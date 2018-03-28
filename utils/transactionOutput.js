const crypto = require('crypto');

class TransactionOutput {
    constructor(reciepient, amount, parentTransactionId) {
        console.log('\n');
        console.log('creating a transaction output');
        // define vars
        this.hashSeed = 'billbitt';
        this.reciepient = null;
        this.amount = null;
        this.parentTransactionId = null;
        this.id = null;
        // construct
        this.reciepient = reciepient;
        this.amount = amount;
        this.parentTransactionId = parentTransactionId;
        this.id = crypto.createHmac('sha256', this.hashSeed)
            .update(this.reciepient + this.amount + this.parentTransactionId)
            .digest('hex');
    }
    isMine (publicKey) {
        return (publicKey === this.reciepient);
    }
}

module.exports = TransactionOutput;
