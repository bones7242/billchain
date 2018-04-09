const crypto = require('crypto');
const hashSeed = 'billbitt';

class TransactionOutput {
    constructor(recipient, amount, parentTransactionId) {
        console.log('\ncreating a transaction output...');
        // define vars
        this.recipient = null;
        this.amount = null;
        this.parentTransactionId = null;
        this.id = null;
        // construct
        this.recipient = recipient;
        this.amount = amount;
        this.parentTransactionId = parentTransactionId;
        this.id = crypto.createHmac('sha256', hashSeed)
            .update(this.recipient + this.amount + this.parentTransactionId)
            .digest('hex');
    }
    isMine (publicKey) {
        return (publicKey === this.recipient);
    }
}

module.exports = TransactionOutput;
