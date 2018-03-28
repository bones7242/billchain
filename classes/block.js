const crypto = require('crypto');
const hashSeed = 'billbitt';
const getMerkleRoot = require('../utils/getMerkleRoot.js');
const getDifficultyString = require('../utils/getDifficultyString.js');

class Block {
    constructor(previousHash) {
        console.log('\n');
        console.log('creating a block');
        // define vars
        this.hash = null;
        this.previousHash = null;
        this.merkleRoot = null;
        this.transactions = [];
        this.timestamp = null;
        this.nonce = null;
        // construct
        this.previousHash = previousHash;
        this.timestamp = Date.now();
        this.nonce = 0;
    }
    calculateHash () {
        //Calculate new hash based on the block's contents
        return crypto.createHmac('sha256', hashSeed)
            .update(
                this.previousHash +
                this.timestamp +
                this.nonce +
                this.merkleRoot
            )
            .digest('hex');
    }
    mineBlock (difficulty) {
        this.merkleRoot = getMerkleRoot(this.transactions);
        const target = getDifficultyString(difficulty);
        while (!(this.hash.substring(0, difficulty) === target)) {
            this.nonce++;
            this.hash = this.calculateHash();

        }
        console.log('Block Mined! Hash =', this.hash);
    }
    addTransaction (transaction) {
        // process transaction and check if valid,
        // unless block is genesis block then ignore.
        if (!transaction) {
            return false;
        }
        if((this.previousHash !== "0")) {
            if(!transaction.processTransaction()) {
                console.log('Transaction failed to process. Discarded.');
                return false;
            }
        }
        this.transactions.push(transaction);
        console.log('Transaction successfully added to Block');
        return true;
    }

}

module.exports = Block;
