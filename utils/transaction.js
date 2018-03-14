const crypto = require('crypto');

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
    }
    calculateHash () {
        this.sequence = this.sequence + 1;
        return crypto.createHmac('sha256', this.hashSeed)
            .update(this.sender + this.recipient + this.amount + this.sequence)
            .digest('hex');
    }
    generateSignature (privateKey) {
        // const data = this.getStringFromKey(this.sender) + this.getStringFromKey(this.recipient + this.amount);
        // return this.applyECDSASig(privateKey, data)
        const data = this.sender + this.recipient + this.amount;
        const sign = crypto.createSign('SHA256');
        sign.update(data);
        // sign.write(data);
        // sign.end();
        this.signature = sign.sign(privateKey, 'hex');

    }
    verifiySignature() {
        // const data = this.getStringFromKey(this.sender) + this.getStringFromKey(this.recipient + this.amount);
        // return this.verifyECDSASig(this.sender, data, signature)
        const data = this.sender + this.recipient + this.amount;
        const verify = crypto.createVerify('SHA256');
        sign.update(data);
        // verify.write(data);
        // verify.end();
        return verify.verify(this.sender, this.signature)

    }
}

module.exports = Transaction;
