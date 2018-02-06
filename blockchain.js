// import dependencies
const axios = require('axios');
// check for crypto support
let crypto;
try {
    crypto = require('crypto');
    console.log('[x] crypto is supported');
} catch (err) {
    console.log('[!] crypto support is disabled');
}
// declare Blockchain class
class Blockchain {
    constructor() {
        this.chain = [];
        this.currentTransactions = [];
        this.hashSeed = 'billbitt';
        this.nodes = {};
        // bind 'this' to class methods
        this.newBlock = this.newBlock.bind(this);
        this.newTransaction = this.newTransaction.bind(this);
        this.hash = this.hash.bind(this);
        this.lastBlock = this.lastBlock.bind(this);
        this.proofOfWork = this.proofOfWork.bind(this);
        this.validProof = this.validProof.bind(this);
        this.registerNode = this.registerNode.bind(this);
        this.validChain = this.validChain.bind(this);
        this.returnNodeAddresses = this.returnNodeAddresses.bind(this);
        this.resolveConflicts = this.resolveConflicts.bind(this);
        // generate first 'genesis' block
        this.newBlock(1, 100);
        // print some stats to make sure first block was created correctly
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
    registerNode (address) {
        /*
        Add a new node to the list of nodes

        :param address: <str> Address of node. Eg. 'http://192.168.0.5:5000'
        :return: None
         */
        this.nodes[address] = address;
    }
    validChain (chain) {
        /*
        Determine if a given blockchain is valid

        :param chain: <list> A blockchain
        :return: <bool> True if valid, False if not
         */
        let lastBlock = chain[0];
        let currentIndex = 1;
        // check the chain, and return false if any problems
        while (currentIndex < chain.length) {
            const block = chain[currentIndex];
            console.log('last block:', lastBlock);
            console.log('block:', block);
            console.log('\n-----------\n');
            // check that the hash of the block is correct
            if (block.previousHash !== this.hash(lastBlock)) {
                return false;
            }
            // check that the Proof of Work is correct
            if (!this.validProof(lastBlock.proof, block.proof)) {
                return false;
            }

            lastBlock = block;
            currentIndex += 1;
        }
        // return true if no problems found in the chain
        return true;
    }
    returnNodeAddresses () {
        let nodes = this.nodes;
        let addresses = [];
        for (let key in nodes){
            if (nodes.hasOwnProperty(key)) {
                addresses.push(nodes[key]);
            }
        };
        return addresses;
    }
    resolveConflicts () {
        /*
        This is our Consensus Algorithm, it resolves conflicts
        by replacing our chain with the longest one in the network.

        :return: <bool> True if our chain was replaced, False if not
         */
        const neighborNodes = this.returnNodeAddresses();
        let newChain = null;
        // we're only looking for chains longer than ours
        let maxLength = this.chain.length;
        // grab and verify the chains from all the nodes in our network
        const that = this;
        async function processNodes(neighborNodes) {
            console.log('starting sync with neighborNodes', neighborNodes)
            // map array to promises
            const promises = neighborNodes.map((node) => {
                return new Promise ((resolve, reject) => {
                    axios.get(`${node}/chain`)
                        .then((response) => {
                            // console.log('response:', response);
                            if (response.status === 200) {
                                // check if the length is longer and the chain is valid
                                const length = response.data.length;
                                const chain = response.data.chain;
                                if (length > maxLength && that.validChain(chain)) {
                                    maxLength = length;
                                    newChain = chain;
                                }
                                resolve();
                            } else {
                                console.log(`response returned with status ${response.status}`);
                                reject();
                            }
                        })
                        .catch(error => {
                            console.log('axios error:', error);
                            reject();
                        });
                })
            })
            // wait until all promises are resolved
            await Promise.all(promises);
            console.log('done!');
        }
        processNodes(neighborNodes);
        // replace our chain if we discover a new, valid chain that is longer than ours
        if (newChain) {
            this.chain = newChain;
            return true;
        }
        return false;
    }
}

module.exports = Blockchain;
