const crypto = require('crypto');
const hashSeed = 'billbitt';
const getMerkleRoot = require('../utils/getMerkleRoot.js');
const getDifficultyString = require('../utils/getDifficultyString.js');

class Block {
    constructor(
        {
          previousHash,
          timestamp,
          nonce,
          merkleRoot,
          hash,
          transactions,
        },
        removeChainUtxo,
        addChainUtxo,
        minimumTransaction,
        getChainUtxos
    ) {
        // define vars
        this.hash = hash || null;
        this.previousHash = previousHash || null;
        this.merkleRoot = merkleRoot || '';
        this.nonce = nonce || 0;
        this.timestamp = timestamp || Date.now();
        this.transactions = transactions || [];
        // info/methods passed from the blockchain class
        this.removeChainUtxo = removeChainUtxo;
        this.addChainUtxo = addChainUtxo;
        this.minimumTransaction = minimumTransaction;
        this.getChainUtxos = getChainUtxos;
    }
    calculateHash () {
        //Calculate new hash based on the block's contents
        return crypto.createHmac('sha256', hashSeed)
            .update(
                this.previousHash +
                this.merkleRoot +
                this.nonce +
                this.timestamp
            )
            .digest('hex');
    }
    mineBlock (difficulty) {
        this.merkleRoot = getMerkleRoot(this.transactions);
        const target = getDifficultyString(difficulty);
        this.hash = this.calculateHash();
        while (!(this.hash.substring(0, difficulty) === target)) {
            this.nonce++;
            //console.log('nonce:', this.nonce);
            this.hash = this.calculateHash();
            // console.log('hash:', this.hash);

        }
        console.log('\nBlock Mined! Hash =', this.hash.substring(0, 6));
    }
    getBlockInfo () {
        return {
            hash        : this.hash,
            previousHash: this.previousHash,
            merkleRoot  : this.merkleRoot,
            nonce       : this.nonce,
            timestamp   : this.timestamp,
            transactions: this.transactions
        }
    }
    addTransaction (transaction) {
        // process transaction and check if valid,
        if (!transaction) {
            return false;
        }
        // ignore if genesis block
        if((this.previousHash !== "0")) {  
            const processedSuccessfully = transaction.processTransaction(this.removeChainUtxo, this.addChainUtxo, this.minimumTransaction, this.getChainUtxos);
            if(!processedSuccessfully) {
                console.log('#Transaction failed to process. Discarded.');
                return false;
            }
        }
        this.transactions.push(transaction); // add the processed Transaction
        console.log('\nTransaction successfully added to block');
        return true;
    }
}

module.exports = Block;
