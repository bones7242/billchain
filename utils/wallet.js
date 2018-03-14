const crypto = require('crypto');

class Wallet {
    constructor() {
        console.log('creating your new wallet!');
        this.privateKey;
        this.publicKey;
        this.generateKeyPair();
    }
    generateKeyPair() {
        const keyGen = crypto.createECDH('secp521r1');
        keyGen.generateKeys();
        this.publicKey = keyGen.getPublicKey();
        this.privateKey = keyGen.getPrivateKey();
    }
}

module.exports = Wallet;
