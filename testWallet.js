const Wallet = require('./utils/wallet.js');
const Transaction = require('./utils/transaction.js');

//Create the new wallets
walletA = new Wallet();
walletB = new Wallet();
//Test public and private keys
console.log("Private and public keys:");
console.log(walletA.privateKey);
console.log(walletA.publicKey);
//Create a test transaction from WalletA to walletB
const transaction = new Transaction(walletA.publicKey, walletB.publicKey, 5, null);
transaction.generateSignature(walletA.privateKey);
//Verify the signature works and verify it from the public key
console.log("Is signature verified");
console.log(transaction.verifiySignature());
