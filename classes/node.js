// import dependencies
const axios = require('axios');
const Wallet = require('./wallet.js');
const Block = require('./block.js');
const TransactionOutput = require('./transactionOutput.js');
const Transaction = require('./transaction.js');
const TransactionToVerify = require('./transactionToVerify.js');
const getDifficultyString = require('../utils/getDifficultyString.js');

class Node {
    constructor() {
        this.chain = [];
        this.transactionQueue = [];
        this.blockRewardAmount = 13;
        this.difficulty = 3;
        this.peers = {
            'http://localhost:4000': 'http://localhost:4000', // note: hard coded nodes
        };
        this.UTXOs = {};
        this.minimumTransaction = 1;
        this.address;
        this.id;
        // bind functions
        this.getChainUtxos = this.getChainUtxos.bind(this);
        this.removeChainUtxo = this.removeChainUtxo.bind(this);
        this.addChainUtxo = this.addChainUtxo.bind(this);
        this.mine = this.mine.bind(this);
        // create coinbase wallet
        this.genesisWallet = new Wallet(null, '2a185918d040455f3fe7e25b322328011e9a31c874f674d53931a4449e7b7239');
        this.coinbase = new Wallet(null, '4a65851d7639eb284da1fa83e24a2398288d6ab6d1c9d8d7d6b611fc76aa305f');

        // create another wallets
        this.primaryWallet = new Wallet(this.getChainUtxos);
        // generate first 'genesis' block & add it to the chain
        const genesisBlock = this.createGenesisBlock();
        this.addBlock(genesisBlock);
    }
    setAddress (address) {
        this.address = address;
    }
    setId(id) {
        this.id = id;
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

        // create genesis transaction
        let genesisTransaction = new Transaction(
            this.coinbase.publicKey,
            this.genesisWallet.publicKey,
            10,
            null
        );

        //manually sign the genesis transaction
        genesisTransaction.generateSignature(this.coinbase.privateKey);

        // add a UTXO to the genesis transaction
        const genesisTransactionOutput = new TransactionOutput(
            genesisTransaction.recipient,
            genesisTransaction.amount,
            genesisTransaction.txid
        );
        genesisTransaction.outputs[0]= genesisTransactionOutput;

        // store the UTXO in the UTXOs list
        this.UTXOs[genesisTransactionOutput.id]= genesisTransactionOutput;

        // store the genesis transaction UTXO
        this.genesisTransactionOutput = genesisTransactionOutput;

        // create genesis block
        console.log('\ncreating and mining genesis block...');
        const genesisBlock = new Block(
            { previousHash: '0' },
            this.removeChainUtxo,
            this.addChainUtxo,
            this.minimumTransaction,
            this.getChainUtxos);
        genesisBlock['timestamp'] = new Date('January 13, 1986');
        genesisBlock.addTransaction(genesisTransaction);
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
    registerPeer (address) {
        /*
        Add a new node to the list of peers

        :param address: <str> Address of node. Eg. 'http://192.168.0.5:5000'
        :return: None
         */
        this.peers[address] = address;
    }
    returnPeerAddressArray() {
        let peers = this.peers;
        let addresses = [];
        for (let key in peers) {
            if (peers.hasOwnProperty(key)) {
                addresses.push(peers[key]);
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
            return [false, null];
        }

        // check the chain, and return false if any problems
        while (currentIndex < chain.length) {
            const currentBlock = new Block(
                chain[currentIndex],
                null,
                null,
                null,
                null
            );
            // compare registered hash and calculated hash
            if (currentBlock.hash !== currentBlock.calculateHash()) {
                console.log('#Current hashes are not equal');
                return [false, null];
            }
            // compare previous hash and registered previous hash
            if (previousBlock.hash !== currentBlock.previousHash) {
                console.log('#previous Hashes not equal');
                return [false, null];
            }
            // check if hash is solved
            if (currentBlock.hash.substring(0, this.difficulty) !== target) {
                console.log('#This block has not been mined');
                return [false, null];
            }
            // check the block's transactions
            let tempOutput;
            for (let i = 0; i < currentBlock.transactions.length; i++) {
                const currentTransaction = new TransactionToVerify(currentBlock.transactions[i]);
                // verify the tx signature
                if(!currentTransaction.verifySignature()) {
                    console.log(`#Signature on transaction[${i}] is invalid`);
                    return [false, null];
                }
                // verify the inputs equal the outputs
                if(currentTransaction.getInputsValue() !== currentTransaction.getOutputsValue()) {
                    console.log(`#Inputs are not equal to outputs on transaction[${i}]`);
                    return [false, null];
                }
                // check all the inputs
                for (let key in currentTransaction.inputs) {
                    if (currentTransaction.inputs.hasOwnProperty(key)) {
                        const thisInput = currentTransaction.inputs[key];
                        tempOutput = tempUTXOs[thisInput.transactionOutputId];
                        //
                        if (!tempOutput) {
                            console.log(`#Referenced input on transaction[${i}] is missing`);
                            return [false, null];
                        }
                        //
                        if (thisInput.UTXO.amount !== tempOutput.amount) {
                            console.log(`#Referenced input on transaction[${i}] has invalid amount`);
                            return [false, null];
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
                    return [false, null];
                }
                if (currentTransaction.outputs[1].recipient !== currentTransaction.sender) {
                    console.log(`#Transaction[${i}] output 'change' address is not sender`);
                    return [false, null];
                }
            }
            // check the next block
            previousBlock = currentBlock;
            currentIndex += 1;
        }
        // return true if no problems found in the chain
        return [true, tempUTXOs];
    }
    evaluateSidechain(sideChain) {
        // reject if provided chain is shorter
        console.log('evaluating amount of work in sidechain...');
        if (sideChain.length <= this.chain.length) {
            console.log(`#rejecting chain because it is not longer than our chain`);
            return false;
        }
        // evaluate the sidechain's validity
        console.log('evaluating longer chain...');
        const [isValidChain, sideChainUTXOs] = this.validChain(sideChain);
        if (!isValidChain) {
            console.log(`#rejecting block because sidechain is invalid`);
            return false;
        }
        console.log('using side chain...');
        this.chain = sideChain;
        this.UTXOs = sideChainUTXOs;
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
            { previousHash: this.lastBlock().hash },
            this.removeChainUtxo,
            this.addChainUtxo,
            this.minimumTransaction,
            this.getChainUtxos
        );

        // tbd: add a coinbase transaction
        // create block reward tx
        let blockRewardTx = new Transaction(
            this.coinbase.publicKey,
            this.primaryWallet.publicKey,
            this.blockRewardAmount,
            null
        );
        //manually sign the block reward
        blockRewardTx.generateSignature(this.coinbase.privateKey);
      
        // add a UTXO to the block reward outputs
        const blockRewardTxOutput = new TransactionOutput(
            blockRewardTx.recipient,
            blockRewardTx.amount,
            blockRewardTx.txid
        );
        blockRewardTx.outputs[0] = blockRewardTxOutput;

        // add the tx to the block
        newBlock.addBlockReward(blockRewardTx);
        
        // add up to 9 other transactions from the queue to the block
        while (this.transactionQueue.length !== 0 && newBlock.transactions.length <= 10) {
            let newTransaction = this.transactionQueue.pop();
            newBlock.addTransaction(newTransaction)
        }

        // mine the block
        newBlock.mineBlock(this.difficulty);
        const minedBlock = newBlock.getBlockInfo();

        // add the mined block to the chain
        this.addBlock(minedBlock);

        // broadcast the mined block
        this.broadcastChain();

        // return the mined block
        return minedBlock;
    };
    broadcastChain() {
        console.log('broadcasting chain');
        const peers = this.returnPeerAddressArray();
        peers.map((node) => {
            axios({
                method: 'post',
                url: `${node}/chain`,
                headers: { 'Content-Type': 'application/json' },
                data: {
                    chain: this.chain,
                    id: this.id,
                    address: this.address,
                }
            })
                .then(response => {
                    console.log(`response from node ${node}:`, response.data.message);
                    if (response.data.message === 'rejected') {
                        this.evaluateSidechain(response.data.chain);
                    }
                })
                .catch(error => {
                    console.log('${node} error:', error.message);
                });
        });
    }
}

module.exports = Node;
