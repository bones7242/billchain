const crypto = require('crypto');
const EC = require('elliptic').ec;
const ec = new EC('secp256k1');
const hashSeed = 'billbitt';

const TransactionOutput = require('./transactionOutput.js');

class Transaction {
    constructor (sender, recipient, amount, inputs, timestamp) {
        // console.log('\ncreating a transaction...');
        this.amount = amount;
        this.inputs = inputs;
        this.outputs = [];
        this.recipient = recipient;
        this.sender = sender;
        this.signature = null;
        this.timestamp = timestamp || Date.now();
        this.txid = this.calculateHash();
        
    }
    calculateHash () {
        return crypto.createHmac('sha256', hashSeed)
            .update(
                this.amount +
                this.inputs +
                this.sender +
                this.recipient +
                this.timestamp
            )
            .digest('hex');
    }
    generateSignature (privateKey) {
        const message = this.sender + this.recipient + this.amount;
        const key = ec.keyFromPrivate(privateKey, 'hex');
        const signature = key.sign(message);
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

}

module.exports = Transaction;
