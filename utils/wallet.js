const EC = require('elliptic').ec;
const ec = new EC('secp256k1');

const Transaction = require('./transaction.js');

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
    getBalance () {
        // returns balance and stores the UTXO's owned by this wallet in this.UTXOs
        let total = 0;
        
    }
    generateTransaction (amount, toAddress) {
        let inputs;
        try {
            this.validAmount(amount);
            this.validAddress(address);
            inputs = this.findInputs(amount);
        } catch (error) {
            return console.log(error.message);
        }
        return new Transaction(this.privatKey, toAddress, amount, inputs);
    }
}

module.exports = Wallet;
