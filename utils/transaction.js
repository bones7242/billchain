const crypto = require('crypto');
const EC = require('elliptic').ec;
const ec = new EC('secp256k1');

class Transaction {
    constructor (sender, recipient, amount, inputs) {
        console.log('\n');
        console.log('creating a transaction...');
        this.sender = sender;
        this.recipient = recipient;
        this.amount = amount;
        this.inputs = inputs;
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
    processTransaction () {
        if (this.verifySignature() === false) {
            console.log('#Transaction Signature failed to verify');
            return false;
        }
        // gather transaction inputs
        for (let i = 0; i < this.inputs.length; i++) {
            inputs[i].transactionOutputId
        }
    }
}

module.exports = Transaction;
