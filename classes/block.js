const crypto = require('crypto');
const hashSeed = 'billbitt';
const getMerkleRoot = require('../utils/getMerkleRoot.js');
const getDifficultyString = require('../utils/getDifficultyString.js');

class Block {
    constructor(previousHash, removeChainUtxo, addChainUtxo, minimumTransaction, getChainUtxos) {
        console.log('\ncreating a block');
        // define vars
        this.hash = null;
        this.previousHash = null;
        this.merkleRoot = null;
        this.transactions = [];
        this.timestamp = null;
        this.nonce = null;
        // info/methods passed from the blockchain class
        this.removeChainUtxo = removeChainUtxo;
        this.addChainUtxo = addChainUtxo;
        this.minimumTransaction = minimumTransaction;
        this.getChainUtxos = getChainUtxos;
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
        this.hash = this.calculateHash();
        while (!(this.hash.substring(0, difficulty) === target)) {
            this.nonce++;
            this.hash = this.calculateHash();

        }
        console.log('\nBlock Mined! Hash =', this.hash);
    }
    addTransaction (transaction) {
        // process transaction and check if valid,
        // unless block is genesis block then ignore.
        if (!transaction) {
            return false;
        }
        if((this.previousHash !== "0")) {  // ignore if genesis block
            const processedSuccessfully = transaction.processTransaction(this.removeChainUtxo, this.addChainUtxo, this.minimumTransaction, this.getChainUtxos);
            if(!processedSuccessfully) {
                console.log('Transaction failed to process. Discarded.');
                return false;
            }
        }
        this.transactions.push(transaction); // add the processed Transaction
        console.log('\nTransaction successfully added to Block');
        console.log(transaction);
        return true;
    }

}

module.exports = Block;
