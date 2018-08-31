const crypto = require('crypto');
const hashSeed = 'billbitt';
const getMerkleRoot = require('../utils/getMerkleRoot.js');
const getDifficultyString = require('../utils/getDifficultyString.js');

class Block {
    constructor(
        {
          previousHash,
          timestamp,
          nonce,
          merkleRoot,
          hash,
          transactions,
        },
        removeChainUtxo,
        addChainUtxo,
        minimumTransaction,
        getChainUtxos
    ) {
        // define vars
        this.hash = hash || null;
        this.previousHash = previousHash || null;
        this.merkleRoot = merkleRoot || '';
        this.nonce = nonce || 0;
        this.timestamp = timestamp || Date.now();
        this.transactions = transactions || [];
        // info/methods passed from the blockchain class
        this.removeChainUtxo = removeChainUtxo;
        this.addChainUtxo = addChainUtxo;
        this.minimumTransaction = minimumTransaction;
        this.getChainUtxos = getChainUtxos;
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
    mineBlock (difficulty) {
        this.merkleRoot = getMerkleRoot(this.transactions);
        const target = getDifficultyString(difficulty);
        this.hash = this.calculateHash();
        while (!(this.hash.substring(0, difficulty) === target)) {
            this.nonce++;
            //console.log('nonce:', this.nonce);
            this.hash = this.calculateHash();
            // console.log('hash:', this.hash);

        }
        console.log('\nBlock Mined! Hash =', this.hash.substring(0, 6));
    }
    getBlockInfo () {
        return {
            hash        : this.hash,
            previousHash: this.previousHash,
            merkleRoot  : this.merkleRoot,
            nonce       : this.nonce,
            timestamp   : this.timestamp,
            transactions: this.transactions
        }
    }
    addTransaction (transaction) {
        if (!transaction) {
            return false;
        }
        // process transaction and check if valid
        // ignore if genesis block 
        if (this.previousHash !== "0") {  
            const processedSuccessfully = this.processTransaction(transaction);
            if(!processedSuccessfully) {
                console.log('#Transaction failed to process. Discarded.');
                return false;
            }
        }
        this.transactions.push(transaction); // add the processed Transaction
        console.log('\nTransaction successfully added to block');
        return true;
    }
    addBlockReward (transaction) {
        this.transactions.push(transaction);
        console.log('\nBlockReward successfully added to block');
    }
    processTransaction(transaction) {
        /*
        Returns true if a new transaction could be generated
        */
        console.log('verifying transaction:', transaction);
        const UTXOs = this.getChainUtxos();
        if (transaction.verifySignature() === false) {
            console.log('#Transaction Signature failed to verify');
            return false;
        }
        // gather transaction inputs (make sure they are unspent)
        // attach the UTXO to the input (assuming one can be found in UTXO list)
        for (let key in transaction.inputs) {
            if (transaction.inputs.hasOwnProperty(key)) {
                const UTXOid = UTXOs[transaction.inputs[key].transactionOutputId];
                if (!UTXOid) {
                    console.log(`#No UTXO found for this input's transactionOutputId`);
                    return false;
                }
                transaction.inputs[key]['UTXO'] = UTXOid;
            }
        }
        // check if transaction is valid
        if (transaction.getInputsValue() < this.minimumTransaction) {
            console.log(`#Transaction Inputs are too small (${transaction.getInputsValue()} < ${this.minimumTransaction})`);
            return false;
        }
        // generate transaction outputs:
        let leftOver = transaction.getInputsValue() - transaction.amount;
        // generate output for recipient
        transaction.outputs[0] = new TransactionOutput(transaction.recipient, transaction.amount, transaction.txid);
        // generate output for change
        transaction.outputs[1] = new TransactionOutput(transaction.sender, leftOver, transaction.txid);

        // add outputs to the chain's UTXO list
        transaction.outputs.forEach(transactionOutput => {
            this.addChainUtxo(transactionOutput);
        });

        // remove this input's output from the chain's UTXO list because it is spent
        transaction.inputs.forEach(input => {
            const transactionOutputId = input.transactionOutputId;
            this.removeChainUtxo(transactionOutputId);
        });
        return true;

    }
}

module.exports = Block;
