class TransactionInput {
    constructor(transactionOutputId) {
        console.log('\ncreating a transaction input...');
        // define vars
        this.transactionOutputId = null;  // reference to TransactionOutpus.transactionId
        // construct
        this.transactionOutputId = transactionOutputId;
    }
}

module.exports = TransactionInput;
