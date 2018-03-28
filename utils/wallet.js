const EC = require('elliptic').ec;
const ec = new EC('secp256k1');

const Transaction = require('./transaction.js');

class Wallet {
    constructor () {
        console.log('\n');
        console.log('creating your new wallet!');
        this.privateKey = null;
        this.publicKey = null;
        this.generateKeyPair();
    }
    static validAmount (amount) {
        if (!amount) {
            throw new Error('no ammount provided');
        };
        return true;
    };
    static validAddress (address) {
        if (!address) {
            throw new Error('no address provided');
        }
        return true;  // should return
    };
    generateKeyPair () {
        // create private key
        const key = ec.genKeyPair();
        this.privateKey = key;

        // create public key
        const pubPoint = key.getPublic();
        this.publicKey = pubPoint.encode('hex');
    }
    // generateTransaction (amount, toAddress) {
    //     let inputs;
    //     try {
    //         this.validAmount(amount);
    //         this.validAddress(address);
    //         inputs = this.findInputs(amount);
    //     } catch (error) {
    //         return console.log(error.message);
    //     }
    //     return new Transaction(this.privatKey, toAddress, amount, inputs);
    // }
    // findInputs (amount) {
    //     // search through utxo's to find the inputs which add up to >= the amount
    //     // throw an error if no inputs found
    // }
}

module.exports = Wallet;
