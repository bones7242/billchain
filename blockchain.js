let crypto;
try {
    crypto = require('crypto');
    console.log('[x] crypto is supported');
} catch (err) {
    console.log('[!] crypto support is disabled');
}

class Blockchain {
    constructor() {
        this.chain = [];
        this.currentTransactions = [];
        this.hashSeed = 'billbitt';
        // bind 'this' to class methods
        this.newBlock = this.newBlock.bind(this);
        this.newTransaction = this.newTransaction.bind(this);
        this.hash = this.hash.bind(this);
        this.lastBlock = this.lastBlock.bind(this);
        this.proofOfWork = this.proofOfWork.bind(this);
        this.validProof = this.validProof.bind(this);
        // generate first 'genesis' block
        this.newBlock(1, 100);
        this.printChain();
        this.printLastBlock();
        this.printBlock(0);
        this.printBlock(1);
        this.printBlock(2);
    }
    printChain () {
        console.log('chain:', this.chain);
    }
    printLastBlock () {
        console.log('last block:', this.lastBlock());
    }
    printBlock (blockNumber) {
        if (blockNumber < 1 || blockNumber > this.chain.length) {
            return console.log(`error: block #${blockNumber} does not exist in the chain`);
        }
        console.log(`block #${blockNumber}:`, this.chain[blockNumber - 1]);
    }
    newBlock (proof, previousHash = null) {
        /*
        Creates a new Block and adds it to the chain

        :param proof: <int> the proof given by the Proof of Work algorithm
        :param prevousHash: (optional) <str> Hash of previous Block
        :return: <dict> New Block
        */
        const block = {
            index: this.chain.length + 1,
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
    newTransaction (sender, recipient, amount) {
        /*
        Adds a new transaction to the list of transactions

        :param sender: <str> Address of the Sender
        :param recipient: <str> Address of the Recipient
        :param amount <int> Amount
        :return: <int> The index of the Block that will hold this transaction
        */
        this.currentTransactions.push({
            sender,
            recipient,
            amount,
        })
        return this.lastBlock().index + 1;
    };
    hash (block) {
        // hashes a Block

        // make sure block is in order so it hashes the same time each time
        const sortedBlock = Object.keys(block).sort().reduce((r, k) => (r[k] = block[k], r), {});
        // stringify the block
        const blockString = JSON.stringify(sortedBlock);
        // hash
        const hash = crypto.createHmac('sha256', this.hashSeed)
            .update(blockString)
            .digest('hex');
        return hash;
    };
    lastBlock () {
        // returns the last Block in the chain
        const lastBlock = this.chain.length - 1;
        return this.chain[lastBlock];
    }
    proofOfWork (lastProof) {
        /*
        Simple Proof of Work Algorithm:
         - Find a number p' such that hash(pp') contains leading 4 zeroes, where p is the previous p'
         - p is the previous proof, and p' is the new proof

        :param lastProof: <int>
        :return: <int>
         */
        let proof = 0;
        while (this.validProof(lastProof, proof) === false) {
            proof += 1;
            // console.log('trying proof:', proof);
        }
        return proof;
    }
    validProof (lastProof, proof) {
        /*
        Validates the Proof: Does hash(lastProof, proof) contain 4 leading zeroes?

        :param lastProof: <int> Previous Proof
        :param proof: <int> Current Proof
        :return: <bool> True if correct, False if not.
         */
        const guess = `${lastProof}${proof}`;
        const guessHash = crypto.createHmac('sha256', this.hashSeed)
            .update(guess)
            .digest('hex');
        const guessHashLeadingCharacters = guessHash.substring(0, 3);

        console.log('guess:', guess);
        console.log('guessHash:', guessHash);
        console.log('guessHashLeadingCharacters:', guessHashLeadingCharacters);

        return ( guessHashLeadingCharacters === '000');
    }
}

module.exports = Blockchain;
