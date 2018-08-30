 //testing
 const blockchain = new blockchain();

 const block1 = new block(blockchain.lastblock().hash, this.removechainutxo, this.addchainutxo, this.minimumtransaction, this.getchainutxos);
 console.log("\nwalleta's balance is: " + this.walleta.getbalanceandupdatewalletutxos());
 console.log("\nwalleta is attempting to send funds (40) to walletb...");
 block1.addtransaction(this.walleta.generatetransaction(this.walletb.publickey, 40));
 this.addblock(block1);
 console.log("\nwalleta's balance is: " + this.walleta.getbalanceandupdatewalletutxos());
 console.log("walletb's balance is: " + this.walletb.getbalanceandupdatewalletutxos());

 const block2 = new block(this.lastblock().hash, this.removechainutxo, this.addchainutxo, this.minimumtransaction, this.getchainutxos);
 console.log("\nwalleta attempting to send more funds (1000) than it has...");
 block2.addtransaction(this.walleta.generatetransaction(this.walletb.publickey, 1000));
 this.addblock(block2);
 console.log("\nwalleta's balance is: " + this.walleta.getbalanceandupdatewalletutxos());
 console.log("walletb's balance is: " + this.walletb.getbalanceandupdatewalletutxos());

 const block3 = new block(this.lastblock().hash, this.removechainutxo, this.addchainutxo, this.minimumtransaction, this.getchainutxos);
 console.log("\nwalletb is attempting to send funds (20) to walleta...");
 block3.addtransaction(this.walletb.generatetransaction(this.walleta.publickey, 20));
 console.log("\nwalleta's balance is: " + this.walleta.getbalanceandupdatewalletutxos());
 console.log("walletb's balance is: " + this.walletb.getbalanceandupdatewalletutxos());

 console.log('\nis this chain valid?', this.validchain(this.chain));
