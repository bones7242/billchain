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

const Transaction = require('./transaction.js');

// declare Blockchain class
class Blockchain {
    constructor() {
        this.chain = [];
        this.currentTransactions = [];
        this.hashSeed = 'billbitt';
        this.nodes = {};
        this.UTXOs = {};
        this.minimumTransaction = 0.01;
        // generate first 'genesis' block
        this.newBlock(1, 100);
        // print some stats to make sure first block was created correctly
        this.printChain();
        // this.printLastBlock();
        // this.printBlock(0);
        // this.printBlock(1);
        // this.printBlock(2);
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
        :param previousHash: (optional) <str> Hash of previous Block
        :return: <dict> New Block
        */
        const currentChainLength = this.chain.length;
        const transactions = this.currentTransactions;
        previousHash = previousHash || this.hash(this.chain[-1]);
        const block = new Block(currentChainLength, transactions, proof, previousHash);
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
        const transaction = {
            sender,
            recipient,
            amount,
        };
        this.currentTransactions.push(transaction);
        return this.lastBlock().index + 1;
    };
    hash (block) {
        // hashes a Block

        // make sure block is in order so it hashes the same time each time
        const sortedBlock = Object.keys(block).sort().reduce((r, k) => (r[k] = block[k], r), {});
        // stringify the block
        const blockString = JSON.stringify(sortedBlock);
        // hash
        return crypto.createHmac('sha256', this.hashSeed)
            .update(blockString)
            .digest('hex');
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
        const guessHashLeadingCharacters = guessHash.substring(0, 4);
        console.log('guessHash:', guessHash);
        return ( guessHashLeadingCharacters === '0000');
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
            // console.log('last block:', lastBlock);
            // console.log('block:', block);
            // console.log('\n-----------\n');
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
        return new Promise((resolve, reject) => {
            const neighborNodes = this.returnNodeAddresses();
            let newChain = null;
            // we're only looking for chains longer than ours
            let maxLength = this.chain.length;
            // grab and verify the chains from all the nodes in our network
            const that = this;
            const promises = neighborNodes.map((node) => {
                return new Promise((resolve,reject) => {
                    axios.get(`${node}/chain`)
                        .then((response)=> {
                            resolve(response)
                        })
                        .catch(error => {
                            resolve(`error with node ${node}: ${error.message}`);
                        });
                })
            })
            // get responses from all the nodes
            Promise.all(promises)
                .then(responsesArray => {
                    // check each response
                    responsesArray.forEach((response => {
                        if (response.status === 200) {
                            const length = response.data.length;
                            const chain = response.data.chain;
                            if (length > maxLength && that.validChain(chain)) {
                                maxLength = length;
                                newChain = chain;
                            }
                        } else if (response.status) {
                            console.log(`response returned with status ${response.status}`);
                        } else {
                            console.log(response);
                        };
                    }))
                })
                .then(() => {
                    console.log('done checking node responses');
                    // replace our chain if we discovered a new, valid chain that is longer than ours
                    if (newChain) {
                        this.chain = newChain;
                        return resolve(true);
                    }
                    resolve(false);
                })
                .catch(error => {
                    console.log('error in node check promises', error);
                    reject(error);
                });
        })
    }
}

module.exports = Blockchain;
