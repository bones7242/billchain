let crypto;
try {
    crypto = require('crypto');
} catch (err) {
    console.log('crypto support is disabled!');
}

module.exports = function Blockchain () {
    this.chain = [];
    this.currentTransactions = [];
    this.newBlock = function (proof, previousHash = null) {
        /*
        Creates a new Block and adds it to the chain

        :param proof: <int> the proof given by the Proof of Work algorithm
        :param prevousHash: (optional) <str> Hash of previous Block
        :return: <dict> New Block
        */
        const block = {
            index: this.chain.length() + 1,
            timestamp: Date.now(),
            transactions: this.currentTransactions,
            proof: proof,
            previousHash: previousHash || this.hash(this.chain[-1]),
        }
        // reset the current list of transactions
        this.currentTransactions = [];
        this.chain.push(block);
        return block;
    };
    this.newTransaction = function (sender, recipient, amount) {
        /*
        Adds a new transaction to the list of transactions

        :param sender: <str> Address of the Sender
        :param recipient: <str> Address of the Recipient
        :param amount <int> Amount
        :return: <int> The index of the Block that will hold this transaction
        */
        this.currentTransactions.append({
            sender,
            recipient,
            amount,
        })
        return this.lastBlock['index'] + 1;
    };
    this.secretWord = 'abcdefg';
    this.hash = function (block) {
        // hashes a Block

        // make sure block is in order so it hashes the same time each time
        const sortedBlock = Object.keys(block).sort().reduce((r, k) => (r[k] = block[k], r), {});
        // stringify the block
        const blockString = JSON.stringify(sortedBlock);
        // hash
        const hash = crypto.createHmac('sha256', this.secretWord)
            .update(blockString)
            .digest('hex');
        return hash;
    };
    this.lastBlock = function () {
        // returns the last Block in the chain
        return this.chain[-1];
    }
    this.proofOfWork = function (lastProof) {
        /*
        Simple Proof of Work Algorithm:
         - Find a number p' such that hash(pp') contains leading 4 zeroes, where p is the previous p'
         - p is the previous proof, and p' is the new proof

        :param lastProof: <int>
        :return: <int>
         */
        proof = 0;
        while (this.validProof(lastProof, proof) === false) {
            proof += 1;
        }
        return proof;
    }
    this.validProof = function (lastProof, proof) {
        /*
        Validates the Proof: Does hash(lastProof, proof) contain 4 leading zeroes?

        :param lastProof: <int> Previous Proof
        :param proof: <int> Current Proof
        :return: <bool> True if correct, False if not.
         */
        const guess = `${lastProof}${proof}`;
        const guessHash = crypto.createHmac('sha256', this.secretWord)
            .update(guess)
            .digest('hex');
        return (guessHash.substring(0, 3) === '0000');
    }
}
