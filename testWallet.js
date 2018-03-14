const Wallet = require('./utils/wallet.js');
const Transaction = require('./utils/transaction.js');

//Create the new wallets
walletA = new Wallet();
walletB = new Wallet();
//Test public and private keys
console.log('\n');
console.log('Wallet A Private key:', walletA.privateKey);
console.log('\n');
console.log('Wallet A Public key:', walletA.publicKey);
//Create a test transaction from WalletA to walletB
const transaction = new Transaction(walletA.publicKey, walletB.publicKey, 5, null);
transaction.generateSignature(walletA.privateKey);
console.log('\n');
console.log(transaction);
//Verify the signature works and verify it from the public key
console.log('\n');
console.log("Is signature verified:", transaction.verifiySignature());
