const crypto = require('crypto');

class TransactionOutput {
    constructor(reciepient, value, parentTransactionId) {
        console.log('\n');
        console.log('creating a transaction output');
        // define vars
        this.amount = null;
        this.hashSeed = 'billbitt';
        this.id = null;
        this.parentTransactionId = null;
        this.reciepient = null;
        // construct
        this.reciepient = reciepient;
        this.value = value;
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
