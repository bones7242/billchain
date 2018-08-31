const crypto = require('crypto');
const hashSeed = 'billbitt';

class BlockToVerify {
    constructor({ previousHash, timestamp, nonce, merkleRoot, hash, transactions }) {
        // define vars
        this.previousHash = previousHash;
        this.merkleRoot = merkleRoot;
        this.timestamp = timestamp;
        this.nonce = nonce;
        this.hash = hash;
        this.transactions = transactions;
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
}

module.exports = BlockToVerify;
