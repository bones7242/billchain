const crypto = require('crypto');

class TransactionInput {
    constructor(transactionOutputId) {
        console.log('\n');
        console.log('creating a transaction input');
        // define vars
        this.transactionOutputId = null;  // reference to TransactionOutpus.transactionId
        // construct
        this.transactionOutputId = transactionOutputId;
    }
}

module.exports = TransactionInput;
