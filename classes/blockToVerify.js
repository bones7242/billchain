const crypto = require('crypto');
const hashSeed = 'billbitt';

class BlockToVerify {
    constructor({ previousHash, timestamp, nonce, merkleRoot }) {
        // define vars
        this.previousHash = previousHash;
        this.merkleRoot = merkleRoot;
        this.timestamp = timestamp;
        this.nonce = nonce;
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
}

module.exports = BlockToVerify;
