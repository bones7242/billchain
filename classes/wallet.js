const EC = require('elliptic').ec;
const ec = new EC('secp256k1');

const Transaction = require('./transaction.js');
const TransactionInput = require('./transactionInput.js');

class Wallet {
    constructor (getChainUtxos, seedPrivatekey) {
        console.log('\ncreating a new wallet!');
        // declare variables
        this.privateKey = null;
        this.publicKey = null;
        this.UTXOs = {};
        this.getChainUtxos = getChainUtxos;
        this.seedPrivatekey = seedPrivatekey || null;
        // construct
        this.generateKeyPair();
    }
    generateKeyPair () {
        // create private key
        let key;
        if (this.seedPrivatekey) {
            key = ec.keyFromPrivate(this.seedPrivatekey, 'hex');
        } else {
            key = ec.genKeyPair();
        }
        this.privateKey = key.getPrivate('hex');

        // create public key
        const pubPoint = key.getPublic();
        this.publicKey = pubPoint.encode('hex');
    }
    getBalanceAndUpdateWalletUTXOs () {
        const chainUtxos = this.getChainUtxos();
        // returns balance and stores the UTXOs owned by this wallet in this.UTXOs
        let total = 0;
        for (let key in chainUtxos) {
            if (chainUtxos.hasOwnProperty(key)) {
                const UTXO = chainUtxos[key];
                // if output belongs to me, add it to the wallet's list of unspent outputs
                if (UTXO.isMine(this.publicKey)) {
                    this.UTXOs[key] = UTXO;
                    total += UTXO.amount;
                }
            }
        };
        return total;

    }
    generateTransaction (recipient, amount) {
        /*
        generate and return a new transaction from this wallet
         */
        // get the wallet balance & update UTXOs in this wallet
        const currentBalance = this.getBalanceAndUpdateWalletUTXOs();
        if (currentBalance < amount) {
            console.log('#Not enough funds to send transaction.  Transaction discarded.');
            return null;
        }
        // create array list of inputs from the UTXOs in this wallet
        // that total more than the amount to be sent
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
        const newTransaction = new Transaction(
            this.publicKey,
            recipient,
            amount,
            inputs
        );
        // sign the new transaction with the private key from this wallet
        newTransaction.generateSignature(this.privateKey);
        // remove the used inputs from our available utxos
        for (let i = 0; i < inputs.length; i++) {
            const transactionOutputId = inputs[i].transactionOutputId;
            delete this.UTXOs[transactionOutputId];
        }
        // return the transaction
        return newTransaction;
    }
}

module.exports = Wallet;
