const crypto = require('crypto');
const EC = require('elliptic').ec;
const ec = new EC('secp256k1');

const TransactionOutput = require('./transactionOutput.js');

class Transaction {
    constructor (sender, recipient, amount, inputs) {
        console.log('\n');
        console.log('creating a transaction...');
        this.sender = sender;
        this.recipient = recipient;
        this.amount = amount;
        this.inputs = inputs;
        this.outputs = {};
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
    verifiySignature() {
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
        for (let key in this.outputs) {
            if (this.outputs.hasOwnProperty(key)) {
                total += this.outputs[key].amount;
            }
        }
        return total;
    }
    processTransaction (UTXOs, minimumTransaction) {
        /*
        Returns true if a new transaction could be generated

        :param UTXOs: <obj> map of all UTXOs
        */
        if (this.verifySignature() === false) {
            console.log('#Transaction Signature failed to verify');
            return false;
        }
        // gather transaction inputs (make sure they are unspent
        // attach the UTXO to the input (assuming one can be found in UTXO list)
        for (let key in this.inputs) {
            if (this.inputs.hasOwnProperty(key)) {
                this.inputs[key]['UTXO'] = UTXOs[this.inputs[key].transactionOutputId];
            }
        }
        // check if transaction is valid
        if (this.getInputsValue() > minimumTransaction) {
            console.log('#Transaction Inputs to small:', this.getInputsValue());
            return false;
        }
        // generate transaction outputs:
        let leftOver = this.getInputsValue() - this.amount;
        const outputForRecipient = new TransactionOutput(this.reciepient, this.amount, this.txid);
        this.outputs[outputForRecipient.id] = outputForRecipient;
        const outputForChange = new TransactionOutput(this.sender, leftOver, this.txid);
        this.outputs[outputForChange.id] = outputForChange;
        // add outputs to master UTXO list
        for (let key in this.outputs) {
            if (this.outputs.hasOwnProperty(key)) {
                  // UTXO[key] = this.outputs[key];
            }

        }
        // remove transaction inputs from master UTXO list as spent
        for (let key in this.inputs) {
            if (this.inputs.hasOwnProperty(key)) {
                // delete UTXO[key];
            }
        }

    }
}

module.exports = Transaction;
