const crypto = require('crypto');
const EC = require('elliptic').ec;
const ec = new EC('secp256k1');

const TransactionOutput = require('./transactionOutput.js');

class Transaction {
    constructor (sender, recipient, amount, inputs) {
        console.log('\ncreating a transaction...');
        this.sender = sender;
        this.recipient = recipient;
        this.amount = amount;
        this.inputs = inputs;
        this.outputs = [];
        this.signature = null;
        this.hashSeed = 'billbitt';
        this.txid = this.calculateHash();
    }
    calculateHash () {
        return crypto.createHmac('sha256', this.hashSeed)
            .update(this.sender + this.recipient + this.amount + this.inputs)
            .digest('hex');
    }
    generateSignature (privateKey) {
        const message = this.sender + this.recipient + this.amount;
        const signature = privateKey.sign(message);
        this.signature = signature.toDER('hex');

    }
    verifySignature() {
        const message = this.sender + this.recipient + this.amount;
        const key = ec.keyFromPublic(this.sender, 'hex');
        return key.verify(message, this.signature);

    }
    // add up all the values of inputs that have a utxo attached to them
    // if the input has a UTXO, add its value to the total
    getInputsValue () {
        let total = 0;
        for (let key in this.inputs) {
            if (this.inputs.hasOwnProperty(key)) {
                if (this.inputs[key].UTXO){
                    total += this.inputs[key].UTXO.amount;
                }
            }
        }
        return total;
    };
    getOutputsValue () {
        let total = 0;
        for (let i = 0; i < this.outputs.length; i++) {
            total += this.outputs[i].amount;
        }
        return total;
    }
    processTransaction (removeChainUtxo, addChainUtxo, minimumTransaction, getChainUtxos) {
        /*
        Returns true if a new transaction could be generated
        */
        const UTXOs = getChainUtxos();
        if (this.verifySignature() === false) {
            console.log('#Transaction Signature failed to verify');
            return false;
        }
        // gather transaction inputs (make sure they are unspent)
        // attach the UTXO to the input (assuming one can be found in UTXO list)
        for (let key in this.inputs) {
            if (this.inputs.hasOwnProperty(key)) {
                const UTXOid = UTXOs[this.inputs[key].transactionOutputId];
                if (!UTXOid) {
                    console.log(`#No UTXO found for this input's transactionOtputId`);
                    return false;
                }
                this.inputs[key]['UTXO'] = UTXOid;
            }
        }
        // check if transaction is valid
        if (this.getInputsValue() < minimumTransaction) {
            console.log(`#Transaction Inputs are too small (${this.getInputsValue()} < ${minimumTransaction}`);
            return false;
        }
        // generate transaction outputs:
        let leftOver = this.getInputsValue() - this.amount;
        // generate output for recipient
        this.outputs[0] = new TransactionOutput(this.recipient, this.amount, this.txid);
        // generate output for change
        this.outputs[1] = new TransactionOutput(this.sender, leftOver, this.txid);

        // add outputs to the chain's UTXO list
        this.outputs.forEach( thisUtxo => {
            addChainUtxo(thisUtxo); // i.e. UTXO[thisOutput.id] = thisOutput;
        })

        // remove transaction inputs from master UTXO list as spent
        for (let key in this.inputs) {
            if (this.inputs.hasOwnProperty(key)) {
                removeChainUtxo(key) // i.e. delete UTXO[key];
            }
        }
        return true;

    }
}

module.exports = Transaction;
