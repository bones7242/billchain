var EC = require('elliptic').ec;
var ec = new EC('secp256k1');

class Wallet {
    constructor() {
        console.log('creating your new wallet!');
        this.generateKeyPair();
    }
    generateKeyPair() {
        // create private key
        const key = ec.genKeyPair();
        this.privateKey = key;

        // create public key
        const pubPoint = key.getPublic();
        this.publicKey = pubPoint.encode('hex');
    }
}

module.exports = Wallet;
