// import dependencies
const axios = require('axios');
const Wallet = require('./wallet.js');
const Block = require('./block.js');
const BlockToVerify = require('./blockToVerify.js');
const TransactionOutput = require('./transactionOutput.js');
const Transaction = require('./transaction.js');
const TransactionToVerify = require('./transactionToVerify.js');
const searchChainForPreviousHash = require('../functions/searchChainForPreviousHash');
const createChainWithSideChain = require('../functions/createChainWithSideChain');
const getDifficultyString = require('../utils/getDifficultyString.js');

class Node {
    constructor() {
        this.chain = [];
        this.transactionQueue = [];
        this.difficulty = 3;
        this.nodes = {
            'http://localhost:4000': 'http://localhost:4000', // note: hard coded nodes
        };
        this.UTXOs = {};
        this.minimumTransaction = 1;
        // bind functions
        this.getChainUtxos = this.getChainUtxos.bind(this);
        this.removeChainUtxo = this.removeChainUtxo.bind(this);
        this.addChainUtxo = this.addChainUtxo.bind(this);
        this.mine = this.mine.bind(this);
        // create coinbase wallet
        this.coinbase = new Wallet(this.getChainUtxos);
        // create another wallets
        this.primaryWallet = new Wallet(this.getChainUtxos);
        // generate first 'genesis' block & add it to the chain
        const genesisBlock = this.createGenesisBlock();
        this.addBlock(genesisBlock);
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
    // blocks
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

        // store the genesis transaction
        this.genesisTransactionOutput = genesisTransactionOutput;

        // create genesis block
        console.log('\ncreating and mining genesis block...');
        const genesisBlock = new Block('0', this.removeChainUtxo, this.addChainUtxo, null, null);
        genesisBlock['timestamp'] = new Date('January 13, 1986');
        genesisBlock.addTransactionToBlock(genesisTransaction);
        genesisBlock.mineBlock(3);

        return genesisBlock.getBlockInfo();

    }
    getBlock (hash) {
        for (let i = this.chain.length; i >= 0; i--) {
            let thisBlock = this.chain[i];
            if (thisBlock.hash === hash) {
                return [thisBlock, i];
            }
        }
        return null;
    }
    lastBlock() {
        // returns the last Block in the chain
        const lastBlock = this.chain.length - 1;
        return this.chain[lastBlock];
    }
    addBlock(block) {
        console.log('block added to chain');
        this.chain.push(block);
    };
    // transactions
    newTransaction (recipient, amount) {
        /*
        Adds a new transaction to the list of transactions
        */
        const newTransaction = this.primaryWallet.generateTransaction(recipient, amount);
        this.transactionQueue.push(newTransaction);
        return this.transactionQueue.length;
    };
    // networking
    registerNode (address) {
        /*
        Add a new node to the list of nodes

        :param address: <str> Address of node. Eg. 'http://192.168.0.5:5000'
        :return: None
         */
        this.nodes[address] = address;
    }
    returnNodeAddresses() {
        let nodes = this.nodes;
        let addresses = [];
        for (let key in nodes) {
            if (nodes.hasOwnProperty(key)) {
                addresses.push(nodes[key]);
            }
        };
        return addresses;
    }
    // consensus
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
    validSideChain () {
        return true;
    }
    async requestBlockFromPeer (hash, ip) {
        console.log('previous block requested from peer');
        /*
        return: a block object, or false
        */
        const url = `${ip}/block/${hash}`;
        await axios.get(url)
            .then(response => {
                console.log('previous block from peer:')
                return response.block;
            })
            .catch(error => {
                console.log(error.message);
            });
    }
    findCommonRoot (block, peerAddress) {
        console.log('finding common root...');
        let currentBlock, index, sideChain;
        index = -1;
        currentBlock = block;
        sideChain = [];
        // check for a common root
        // for each block given, check all the way back untill you hit the origin
        // do this until there are no more new blocks or an index above zero is found
        while (currentBlock.previousHash && index <= 0) {
            // check the chain for the preceding block
            index = searchChainForPreviousHash(this.chain, currentBlock);
            console.log(`index of previous hash ${currentBlock.previousHash} in our chain:`, index);
            // store this block in sidechain array
            sideChain.unshift(currentBlock);
            console.log('sidechain:', sideChain);
            // and get a new block
            currentBlock = this.requestBlockFromPeer(currentBlock.previousHash, peerAddress);
            console.log('new block from peer:', currentBlock.hash);
        }
        // check to see if we went through the whole competing chain without finding the same genesis block
        if (!currentBlock && index < 0) {
            console.log('warning: this chain does not have same genesis block');
            return [-1, null];
        }
        console.log('found a common root:', this.chain[index].hash);
        return [ index, sideChain ];
    }
    evaluateNewBlock (newBlock, peerAddress) {
        // console.log('evaluating new block', newBlock);
        console.log('from peer:', peerAddress);
        // find common root
        const [index, sideChain] = this.findCommonRoot(newBlock);
        if (index < 0) {
            console.log('#rejecting malicious chain');
            return false;
        }
        // reject if provided block is part of a shorter chain
        console.log('evaluating amount of work...');
        const sideChainLength = sideChain.length;
        const depthOfCommonRoot = this.chain.length - 1 - index;
        console.log('sideChainLength', sideChainLength);
        console.log('depthOfCommonRoot', depthOfCommonRoot);
        if (sideChainLength <= depthOfCommonRoot) {
            console.log(`#rejecting block because sidechain is not longer than our chain`);
            return false;
        }
        // evaluate the sidechain's validity
        console.log('evaluating side chain...');
        if (!this.validSideChain(sideChain)) {
            console.log(`#rejecting block because sidechain is invalid`);
            return false;
        }
        console.log('using side chain...');
        this.chain = createChainWithSideChain(sideChain, index);
        console.log('side chain used.');
        // restart the current mining operations,
            // because they didn't have this most recent block
        // return the new block
        return true;
    }
    // mining
    mine() {
        // create the new block
        const newBlock = new Block(
            this.lastBlock().hash,
            this.removeChainUtxo,
            this.addChainUtxo,
            this.minimumTransaction,
            this.getChainUtxos
        );

        // tbd: add a coinbase transaction

        

        // add up to 9 other transactions from the queue to the block
        while (this.transactionQueue.length !== 0 && newBlock.transactions.length <= 10) {
            let newTransaction = this.transactionQueue.pop();
            newBlock.addTransactionToBlock(newTransaction)
        }

        // mine the block
        newBlock.mineBlock(this.difficulty);
        const minedBlock = newBlock.getBlockInfo();

        // add the mined block to the chain
        this.addBlock(minedBlock);

        // broadcast the mined block
        this.broadcastBlock(minedBlock);

        // return the mined block
        return minedBlock;
    };
    broadcastBlock(block) {
        console.log('broadcasting block:', block);
        const neighborNodes = this.returnNodeAddresses();
        neighborNodes.map((node) => {
            axios({
                method: 'post',
                url: `${node}/block/new`,
                headers: { 'Content-Type': 'application/json' },
                data: {
                    block,
                }
            })
                .then(response => {
                    console.log(`successfully sent to ${node}.`);
                })
                .catch(error => {
                    console.log('error:', error.message);
                });
        });
    }
}

module.exports = Node;
