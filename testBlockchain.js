// //testing
// const blockchain = new Blockchain();
//
// const block1 = new Block(blockchain.lastBlock().hash, this.removeChainUtxo, this.addChainUtxo, this.minimumTransaction, this.getChainUtxos);
// console.log("\nWalletA's balance is: " + this.walletA.getBalanceAndUpdateWalletUTXOs());
// console.log("\nWalletA is Attempting to send funds (40) to WalletB...");
// block1.addTransaction(this.walletA.generateTransaction(this.walletB.publicKey, 40));
// this.addBlock(block1);
// console.log("\nWalletA's balance is: " + this.walletA.getBalanceAndUpdateWalletUTXOs());
// console.log("WalletB's balance is: " + this.walletB.getBalanceAndUpdateWalletUTXOs());
//
// const block2 = new Block(this.lastBlock().hash, this.removeChainUtxo, this.addChainUtxo, this.minimumTransaction, this.getChainUtxos);
// console.log("\nWalletA Attempting to send more funds (1000) than it has...");
// block2.addTransaction(this.walletA.generateTransaction(this.walletB.publicKey, 1000));
// this.addBlock(block2);
// console.log("\nWalletA's balance is: " + this.walletA.getBalanceAndUpdateWalletUTXOs());
// console.log("WalletB's balance is: " + this.walletB.getBalanceAndUpdateWalletUTXOs());
//
// const block3 = new Block(this.lastBlock().hash, this.removeChainUtxo, this.addChainUtxo, this.minimumTransaction, this.getChainUtxos);
// console.log("\nWalletB is Attempting to send funds (20) to WalletA...");
// block3.addTransaction(this.walletB.generateTransaction(this.walletA.publicKey, 20));
// console.log("\nWalletA's balance is: " + this.walletA.getBalanceAndUpdateWalletUTXOs());
// console.log("WalletB's balance is: " + this.walletB.getBalanceAndUpdateWalletUTXOs());
//
// console.log('\nis this chain valid?', this.validChain(this.chain));
