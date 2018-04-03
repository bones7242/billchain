const Wallet = require('./classes/wallet.js');
const Transaction = require('./classes/transaction.js');

//Create the new wallets
walletA = new Wallet();
walletB = new Wallet();
//Test public and private keys
console.log('\nWallet A Private key:', walletA.privateKey);
console.log('Wallet A Public key:', walletA.publicKey);
//Create a test transaction from WalletA to walletB
const transaction = new Transaction(
    walletA.publicKey,
    walletB.publicKey,
    5,
    null
);
transaction.generateSignature(walletA.privateKey);
console.log(transaction);
//Verify the signature works and verify it from the public key
console.log("Is signature verified:", transaction.verifySignature());
