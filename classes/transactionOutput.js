const crypto = require('crypto');
const hashSeed = 'billbitt';

class TransactionOutput {
    constructor(recipient, amount, parentTransactionId, timestamp) {
        console.log('\ncreating a transaction output...');
        // define vars
        this.amount = amount || null;
        this.id = null;
        this.parentTransactionId = parentTransactionId || null;
        this.recipient = recipient || null;
        this.timestamp = timestamp || Date.now();
        // set id
        this.id = crypto.createHmac('sha256', hashSeed)
            .update(
                this.amount +
                this.parentTransactionId +
                this.recipient +
                this.timestamp
            )
            .digest('hex');
    }
    isMine (publicKey) {
        return (publicKey === this.recipient);
    }
}

module.exports = TransactionOutput;
