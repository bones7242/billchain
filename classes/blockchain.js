// import dependencies
const axios = require('axios');
const Wallet = require('./wallet.js');
const Block = require('./block.js');
const BlockToVerify = require('./blockToVerify.js');
const TransactionOutput = require('./transactionOutput.js');
const Transaction = require('./transaction.js');
const TransactionToVerify = require('./transactionToVerify.js');
const getDifficultyString = require('../utils/getDifficultyString.js');

// declare Blockchain class
class Blockchain {
    constructor() {
        this.chain = [];
        this.transactionQueue = [];
        this.difficulty = 5;
        this.nodes = {
            "http://127.0.0.1:4000": "http://127.0.0.1:4000",
            "http://127.0.0.1:3000": "http://127.0.0.1:3000",
        };
        this.UTXOs = {};
        this.minimumTransaction = 1;
        this.miner = null;
        this.isMining = false;
        // bind functions
        this.getChainUtxos = this.getChainUtxos.bind(this);
        this.removeChainUtxo = this.removeChainUtxo.bind(this);
        this.addChainUtxo = this.addChainUtxo.bind(this);
        this.mineBlock = this.mineBlock.bind(this);
        // create coinbase wallet
        this.coinbase = new Wallet(this.getChainUtxos);
        // create another wallets
        this.primaryWallet = new Wallet(this.getChainUtxos);
        // generate first 'genesis' block
        this.createGenesisBlock();
    }
    getChainUtxos () {
        return this.UTXOs;
    }
    removeChainUtxo (id) {
        delete this.UTXOs[id];
    }
    addChainUtxo (transactionOutput) {
        this.UTXOs[transactionOutput.id] = transactionOutput;
    }
    createGenesisBlock () {
        console.log('\ncreating genesis transaction...');
        // create genesis wallets
        const genesisCoinbase = new Wallet(null, '4a65851d7639eb284da1fa83e24a2398288d6ab6d1c9d8d7d6b611fc76aa305f');
        const genesisWallet = new Wallet(null, '2a185918d040455f3fe7e25b322328011e9a31c874f674d53931a4449e7b7239');

        // create genesis transaction
        let genesisTransaction = new Transaction(
            genesisCoinbase.publicKey,
            genesisWallet.publicKey,
            10,
            null
        );
        //manually sign the genesis transaction
        genesisTransaction.generateSignature(genesisCoinbase.privateKey);
        // add a UTXO to the genesis transaction
        const genesisTransactionOutput = new TransactionOutput(
            genesisTransaction.recipient,
            genesisTransaction.amount,
            genesisTransaction.txid
        );
        genesisTransaction.outputs[0]= genesisTransactionOutput;
        // store the UTXO in the UTXOs list
        this.UTXOs[genesisTransactionOutput.id]= genesisTransactionOutput;

        // create genesis block
        console.log('\ncreating and mining genesis block...');
        const genesisBlock = new Block('0', this.removeChainUtxo, this.addChainUtxo, null, null);
        genesisBlock['timestamp'] = new Date('January 13, 1986');
        genesisBlock.addTransaction(genesisTransaction);
        this.genesisTransactionOutput = genesisTransactionOutput;
        this.addBlock(genesisBlock);

    }
    newBlock () {
        /*
        Creates a new Block to be added to the chain
        */

        // create the block
        const newBlock = new Block(
            this.lastBlock().hash,
            this.removeChainUtxo,
            this.addChainUtxo, this.minimumTransaction,
            this.getChainUtxos
        );

        // tbd: add a coinbase transaction

        // add up to 9 other transactions from the queue to the block
        while (this.transactionQueue.length !== 0 && newBlock.transactions.length <= 10){
            let newTransaction = this.transactionQueue.pop();
            newBlock.addTransaction(newTransaction)
        }

        // return the block
        return newBlock;
    }
    addBlock (newBlock) {
        newBlock.mineBlock(this.difficulty);
        this.chain.push(newBlock);
        return newBlock;
    }
    newTransaction (recipient, amount) {
        /*
        Adds a new transaction to the list of transactions
        */
        const transaction = this.primaryWallet.generateTransaction(recipient, amount);
        this.queueTransaction(transaction);
    };
    queueTransaction (transaction) {
        /*
        Adds a transaction to the list of transactions
        */
        this.transactionQueue.push(transaction);
        return this.transactionQueue.length;
    };
    lastBlock () {
        // returns the last Block in the chain
        const lastBlock = this.chain.length - 1;
        return this.chain[lastBlock];
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
        const target = getDifficultyString(this.difficulty);
        let previousBlock = chain[0];
        let currentIndex = 1;
        let tempUTXOs = {};

        tempUTXOs[this.genesisTransactionOutput.id] = this.genesisTransactionOutput;  // hard code this with the genesis block txo

        // verify that the genesis bocks are the same
        if (previousBlock.hash !== this.chain[0].hash) {
            console.log(`#Genesis blocks are not the same`);
            return false;
        }

        // check the chain, and return false if any problems
        while (currentIndex < chain.length) {
            const currentBlock = new BlockToVerify(chain[currentIndex]);
            // compare registered hash and calculated hash
            if (currentBlock.hash !== currentBlock.calculateHash()) {
                console.log('#Current hashes are not equal');
                return false;
            }
            // compare previous hash and registered previous hash
            if (previousBlock.hash !== currentBlock.previousHash) {
                console.log('#previous Hashes not equal');
                return false;
            }
            // check if hash is solved
            if (currentBlock.hash.substring(0, this.difficulty) !== target) {
                console.log('#This block has not been mined');
                return false;
            }
            // check the block's transactions
            let tempOutput;
            for (let i = 0; i < currentBlock.transactions.length; i++) {
                const currentTransaction = new TransactionToVerify(currentBlock.transactions[i]);
                // verify the tx signature
                if(!currentTransaction.verifySignature()) {
                    console.log(`#Signature on transaction[${i}] is invalid`);
                    return false;
                }
                // verify the inputs equal the outputs
                if(currentTransaction.getInputsValue() !== currentTransaction.getOutputsValue()) {
                    console.log(`#Inputs are not equal to outputs on transaction[${i}]`);
                    return false;
                }
                // check all the inputs
                for (let key in currentTransaction.inputs) {
                    if (currentTransaction.inputs.hasOwnProperty(key)) {
                        const thisInput = currentTransaction.inputs[key];
                        tempOutput = tempUTXOs[thisInput.transactionOutputId];
                        //
                        if (!tempOutput) {
                            console.log(`#Referenced input on transaction[${i}] is missing`);
                            return false;
                        }
                        //
                        if (thisInput.UTXO.amount !== tempOutput.amount) {
                            console.log(`#Referenced input on transaction[${i}] has invalid amount`);
                            return false;
                        }
                        delete tempUTXOs[thisInput.transactionOutputId];
                    }
                }
                // add the outputs to temp outputs
                for (let j = 0; j < currentTransaction.outputs.length; j++) {
                   const thisOutput = currentTransaction.outputs[j];
                   tempUTXOs[thisOutput.id] = thisOutput;
                }
                //
                if (currentTransaction.outputs[0].recipient !== currentTransaction.recipient) {
                    console.log(`#Transaction[${i}] output recipient isnot who it should be`);
                    return false;
                }
                if (currentTransaction.outputs[1].recipient !== currentTransaction.sender) {
                    console.log(`#Transaction[${i}] output 'change' address is not sender`);
                    return false;
                }
            }
            // check the next block
            previousBlock = currentBlock;
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
            // get each node's chain
            const that = this;
            const promises = neighborNodes.map((node) => {
                return new Promise((resolve, reject) => {
                    axios.get(`${node}/chain`)
                        .then((response)=> {
                            resolve(response)
                        })
                        .catch(error => {
                            resolve(`error with node ${node}: ${error.message}`);
                        });
                })
            });
            // verify all the chains
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
                            console.log('response:', response);
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
    };
    mineBlock () {
        const newBlock = this.newBlock();
        return this.addBlock(newBlock);
    };
    startMining (interval) {
        console.log('starting mining');
        this.miner = setInterval(this.mineBlock, interval * 1000);
    };
    stopMining () {
        console.log('stopping mining');
        clearInterval(this.miner);
    };
    syncChain () {
        this.resolveConflicts()
            .then(replaced => {
                if (replaced) {
                    return console.log('Our chain was replaced');
                }
                console.log('Our chain is authoritative');
            })
            .catch(error => {
                console.log('error', error);
            });
    }
}

module.exports = Blockchain;
