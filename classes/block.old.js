class Block {
    constructor(chainLength, transactions, proof, previousHash ) {
        console.log('\n');
        console.log('creating a block');
        // define vars
        this.index = null;
        this.timestamp = null;
        this.transactions = null;
        this.proof = null;
        this.previousHash = null;
        // construct
        this.index = chainLength + 1;
        this.timestamp = Date.now();
        this.transactions = transactions;
        this.proof = proof;
        this.previousHash =  previousHash;
    }
}

module.exports = Block;
