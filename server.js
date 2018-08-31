const express = require('express');
const async = require('async');
const BillNode = require('./classes/billNode.js');
const randomId = require('./utils/randomId.js');
const jsonBodyParser = require('body-parser').json();

// get the port
const PORT = parseInt(process.argv[2]) || 3000;

//instantiate the node
const app = express();

// Generate an id for this node
nodeIdentifier = randomId('xNAx', 40);

require('./utils/checkCryptoSupport.js');

// instantiate this billchain node
const myBillNode = new BillNode();
myBillNode.setId(nodeIdentifier);
myBillNode.setAddress(`http://localhost:${PORT}`);

// add routes so the node can be accessed
app.get('/mine', (req, res) => {
    const minedBlock = myBillNode.mine();
    const response = {
        message: `Successfully mined a block`,
        minedBlock,
    };
    res.status(200).json(response);
});
app.get('/transaction', (req, res) => {
    return res.status(201).json({
        transactionQue: myBillNode.transactionQueue,
    });
});
app.post('/transaction', jsonBodyParser, ({ body }, res) => {
    // check that the required fields are in the post'ed data
    if (!body.recipient || !body.amount) {
        return res.status(400).send('missing values');
    }
    // create a new transaction
    const placeInQueue = myBillNode.newTransaction(body.recipient, body.amount);
    const response = {message: `Transaction is number ${placeInQueue} in the queue`};
    return res.status(201).json(response);
});

app.get('/peer', (req, res) => {
    return res.status(201).json(myBillNode.peers);
});

app.post('/peer', jsonBodyParser, ({ body }, res) => {
    // accept a list of new peer nodes in the form of URLs
    const peerList = body.peers;
    if (!peerList || (peerList.length === 0)) {
        return res.status(400).json({error: 'Please supply a valid array of nodes'})
    }
    for (let i = 0; i < peerList.length; i++) {
        myBillNode.registerNode(peerList[i]);
    }
    const response = {
        message: `{$peerList.length} New peer nodes have been added`,
        totalNodes: myBillNode.peers.length,
    }
    return res.status(201).json(response);
});
// chain
app.get('/chain', (req, res) => {
    const response = {
        chain: myBillNode.chain,
        length: myBillNode.chain.length,
    };
    return res.json(response);
});
app.post('/chain', jsonBodyParser, ({ body }, res) => {
    console.log(`received new chain from ${body.address}`);
    // Consensus Algorithm, which resolves any conflicts,
    // to ensure this node has the correct chain
    if (!body || !body.chain) {
        console.log('no chain received');
        return res.status(400).json({ error: 'No chain received'})
    }
    if (!body.id) {
        console.log('no node id received');
        return res.status(400).json({ error: 'No node id received' })
    }
    if (!body.address) {
        console.log('no node address received');
        return res.status(400).json({ error: 'No node address received' })
    }

    const accepted = myBillNode.evaluateSidechain(body.chain, body.address);
    console.log('completed evaluating new chain');
    let response;
    if (accepted) {
        response = {
            message: 'accepted',
            chain: myBillNode.chain,
        }
    } else {
        response = {
            message: 'rejected',
            chain: myBillNode.chain,
        }
    }
    return res.status(201).json(response);
});
// wallet
app.get('/wallet/primary', (req, res) => {
    const response = {
        message: `primary wallet on node ${nodeidentifier}`,
        primarywallet: {
            address: myBillNode.primarywallet.publickey,
            balance: myBillNode.primarywallet.getBalance(),
        },
    };
    return res.status(201).json(response);
});
app.get('/wallet/coinbase', (req, res) => {
    const response = {
        message: `coinbase wallet on node ${nodeidentifier}`,
        coinbase: {
            address: myBillNode.coinbase.publickey,
            balance: myBillNode.coinbase.getBalance(),
        },
    };
    return res.status(201).json(response);
});
app.get('/', (req, res) => {
    const response = {
        id: nodeIdentifier,
        url: `http://localhost:${PORT}`,
        walletAddresses: {
            primary: myBillNode.primaryWallet.publicKey,
            coinbase: myBillNode.coinbase.publicKey,
            genesis: myBillNode.genesisWallet.publicKey,
        },
        txQueue: myBillNode.transactionQueue,
        difficulty: myBillNode.difficulty,
        peers: myBillNode.peers,
        chain: myBillNode.chain,
        UTXOs: myBillNode.UTXOs,
    }
    return res.status(201).json(response);
});
// start the server
app.listen(PORT, () => {
    console.log(`\nBillChain node listening on port ${PORT}!`)
});
