const crypto = require('crypto');
var EC = require('elliptic').ec;
var ec = new EC('secp256k1');

class Transaction {
    constructor (sender, recipient, amount, inputs) {
        console.log('creating a transaction...');
        this.hashSeed = 'billbitt';
        this.sender = sender;
        this.recipient = recipient;
        this.amount = amount;
        this.inputs = inputs;
        this.sequence = 0;
        this.signature;
        this.hash = this.calculateHash();
    }
    calculateHash () {
        this.sequence = this.sequence + 1;
        return crypto.createHmac('sha256', this.hashSeed)
            .update(this.sender + this.recipient + this.amount + this.sequence + this.inputs)
            .digest('hex');
    }
    generateSignature (privateKey) {
        const data = this.hash;
        const signature = privateKey.sign(data);
        this.signature = signature.toDER('hex');

    }
    verifiySignature() {
        const data = this.hash;
        const key = ec.keyFromPublic(this.sender, 'hex');
        return key.verify(data, this.signature);

    }
}

module.exports = Transaction;
