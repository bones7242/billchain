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

const Wallet = require('./wallet.js');
const Block = require('./block.js');
const TransactionOutput = require('./transactionOutput.js');
const Transaction = require('./transaction.js');
const getDifficultyString = require('../utils/getDifficultyString.js');

// declare Blockchain class
class Blockchain {
    constructor() {
        this.chain = [];
        this.transactionQueue = [];
        this.difficulty = 3;
        this.hashSeed = 'billbitt';
        this.nodes = {};
        this.UTXOs = {};
        this.minimumTransaction = 1;
        this.miner = null;
        // bind functions
        this.getChainUtxos = this.getChainUtxos.bind(this);
        this.removeChainUtxo = this.removeChainUtxo.bind(this);
        this.addChainUtxo = this.addChainUtxo.bind(this);
        // create coinbase wallet
        this.coinbase = new Wallet(this.getChainUtxos);
        // create test wallets
        this.walletA = new Wallet(this.getChainUtxos);
        this.walletB = new Wallet(this.getChainUtxos);
        // generate first 'genesis' block
        this.createGenesisBlock();
        // run tests
        this.newChainTest();
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
    newChainTest () {
        //testing
        const block1 = new Block(this.lastBlock().hash, this.removeChainUtxo, this.addChainUtxo, this.minimumTransaction, this.getChainUtxos);
        console.log("\nWalletA's balance is: " + this.walletA.getBalanceAndUpdateWalletUTXOs());
        console.log("\nWalletA is Attempting to send funds (40) to WalletB...");
        block1.addTransaction(this.walletA.generateTransaction(this.walletB.publicKey, 40));
        this.addBlock(block1);
        console.log("\nWalletA's balance is: " + this.walletA.getBalanceAndUpdateWalletUTXOs());
        console.log("WalletB's balance is: " + this.walletB.getBalanceAndUpdateWalletUTXOs());

        const block2 = new Block(this.lastBlock().hash, this.removeChainUtxo, this.addChainUtxo, this.minimumTransaction, this.getChainUtxos);
        console.log("\nWalletA Attempting to send more funds (1000) than it has...");
        block2.addTransaction(this.walletA.generateTransaction(this.walletB.publicKey, 1000));
        this.addBlock(block2);
        console.log("\nWalletA's balance is: " + this.walletA.getBalanceAndUpdateWalletUTXOs());
        console.log("WalletB's balance is: " + this.walletB.getBalanceAndUpdateWalletUTXOs());

        const block3 = new Block(this.lastBlock().hash, this.removeChainUtxo, this.addChainUtxo, this.minimumTransaction, this.getChainUtxos);
        console.log("\nWalletB is Attempting to send funds (20) to WalletA...");
        block3.addTransaction(this.walletB.generateTransaction(this.walletA.publicKey, 20));
        console.log("\nWalletA's balance is: " + this.walletA.getBalanceAndUpdateWalletUTXOs());
        console.log("WalletB's balance is: " + this.walletB.getBalanceAndUpdateWalletUTXOs());

        console.log('\nis this chain valid?', this.validChain(this.chain));
    }
    printChain () {
        console.log('# Start Chain');
        console.log(this.chain);
        console.log('# End chain');
    }
    createGenesisBlock () {
        console.log('\ncreating genesis transaction');
        // create genesis transaction
        let genesisTransaction = new Transaction(
            this.coinbase.publicKey,
            this.walletA.publicKey,
            100,
            null
        );
        //manually sign the genesis transaction
        genesisTransaction.generateSignature(this.coinbase.privateKey);
        // manually set the txid
        genesisTransaction.txid = '0';
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
        console.log('Creating and mining genesis block...');
        const genesisBlock = new Block('0', this.removeChainUtxo, this.addChainUtxo, null, null);
        genesisBlock.addTransaction(genesisTransaction);
        this.genesisTransactionOutput = genesisTransactionOutput; // store the genesis UTXO
        this.addBlock(genesisBlock);

    }
    newBlock () {
        /*
        Creates a new Block to be added to the chain

        :param proof: <int> the proof given by the Proof of Work algorithm
        :param previousHash: (optional) <str> Hash of previous Block
        :return: <dict> New Block
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
    newTransaction (sender, recipient, amount) {
        /*
        Adds a new transaction to the list of transactions

        :param sender: <str> Address of the Sender
        :param recipient: <str> Address of the Recipient
        :param amount <int> Amount
        :return: <int> The index of the Block that will hold this transaction
        */
        const transaction = new Transaction(sender, recipient, amount);
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

        tempUTXOs[this.genesisTransactionOutput.id] = this.genesisTransactionOutput;

        // check the chain, and return false if any problems
        while (currentIndex < chain.length) {
            const currentBlock = chain[currentIndex];
            // compare registered hash and calculated hash
            if (currentBlock.hash !== currentBlock.calculateHash()) {
                console.log('#Current hashes are not equal');
                return false;
            }
            // compare previous hash and registered revious hash
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
                const currentTransaction = currentBlock.transactions[i];
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
            });
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
    };
    mineBlock () {
        const newBlock = this.newBlock();
        const minedBlock = this.addBlock(newBlock);
        this.resolveConflicts();
        return minedBlock;
    }
    startMining (interval) {
        this.miner = setInterval(this.mineBlock, interval * 1000);
    }
    stopMining () {
        clearInterval(this.miner);
    }
}

module.exports = Blockchain;
