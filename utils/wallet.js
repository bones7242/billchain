const EC = require('elliptic').ec;
const ec = new EC('secp256k1');

const Transaction = require('./transaction.js');
const TransactionInput = require('./transactionInput.js');

class Wallet {
    constructor () {
        console.log('\n');
        console.log('creating your new wallet!');
        // declare variables
        this.privateKey = null;
        this.publicKey = null;
        this.UTXOs = {};
        // construct
        this.generateKeyPair();
    }
    generateKeyPair () {
        // create private key
        const key = ec.genKeyPair();
        this.privateKey = key;

        // create public key
        const pubPoint = key.getPublic();
        this.publicKey = pubPoint.encode('hex');
    }
    getBalance (masterUtxolist) {
        // returns balance and stores the UTXOs owned by this wallet in this.UTXOs
        let total = 0;
        for (let key in masterUtxolist) {
            if (masterUtxolist.hasOwnProperty(key)) {
                const unspentOutput = masterUtxolist[key];
                // if output belongs to me, add it to the wallet's list of unspent outputs
                if (unspentOutput.isMine(this.publicKey)) {
                    this.UTXOs[key] = unspentOutput;
                    total += unspentOutput.amount;
                }
            }
        };
        return total;

    }
    generateTransaction (amount, recipient) {
        // generate and return a new transaction from this wallet
        if (this.getBalance() < amount) {
            console.log('#Not enough funds to send transaction.  Transaction discarded.');
            return null;
        }
        // create array list of inputs
        let inputs = [];
        let total = 0;
        for (let key in this.UTXOs) {
            if (this.UTXOs.hasOwnProperty(key)) {
                const transactionOutput = this.UTXOs[key];
                total += transactionOutput.amount;
                inputs.push(new TransactionInput(key));
                if (total > amount) break;
            }
        }
        // create the new transaction
        const newTransaction = new Transaction(this.publicKey, recipient, amount, inputs);
        // sign the new transaction with the private key from this wallet
        newTransaction.generateSignature(this.privateKey);

    }
}

module.exports = Wallet;
