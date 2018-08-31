class TransactionInput {
    constructor(transactionOutputId) {
        console.log('\ncreating a transaction input...');
        // define vars
        this.transactionOutputId = null;  // reference to TransactionOutput.transactionId
        // construct
        this.transactionOutputId = transactionOutputId;
    }
}

module.exports = TransactionInput;
