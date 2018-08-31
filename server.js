const express = require('express');
const async = require('async');
const Node = require('./classes/node.js');
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
const billNode = new Node();
billNode.setId(nodeIdentifier);
billNode.setAddress(`http://localhost:${PORT}`);

// add routes so the node can be accessed
app.get('/mine', (req, res) => {
    const minedBlock = billNode.mine();
    const response = {
        message: `Successfully mined a block`,
        minedBlock,
    };
    res.status(200).json(response);
});
app.get('/transaction', (req, res) => {
    return res.status(201).json({
        transactionQue: billNode.transactionQueue,
    });
});
app.post('/transaction', jsonBodyParser, ({ body }, res) => {
    // check that the required fields are in the post'ed data
    if (!body.recipient || !body.amount) {
        return res.status(400).send('missing values');
    }
    // create a new transaction
    const placeInQueue = billNode.newTransaction(body.recipient, body.amount);
    const response = {message: `Transaction is number ${placeInQueue} in the queue`};
    return res.status(201).json(response);
});

app.get('/nodes', (req, res) => {
    return res.status(201).json({
        nodes: billNode.nodes,
    });
});

app.post('/nodes', jsonBodyParser, ({ body }, res) => {
    // accept a list of new nodes in the form of URLs
    const nodeList = body.nodes;
    if (!nodeList || (nodeList.length === 0)) {
        return res.status(400).json({error: 'Please supply a valid array of nodes'})
    }
    for (let i = 0; i < nodeList.length; i++) {
        billNode.registerNode(nodeList[i]);
    }
    const response = {
        message: 'New nodes have been added',
        totalNodes: nodeList,
    }
    return res.status(201).json(response);
});
// chain
app.get('/chain', (req, res) => {
    const response = {
        chain: billNode.chain,
        length: billNode.chain.length,
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

    const accepted = billNode.evaluateSidechain(body.chain, body.address);
    console.log('completed evaluating new chain');
    let response;
    if (accepted) {
        response = {
            message: 'accepted',
            chain: billNode.chain,
        }
    } else {
        response = {
            message: 'rejected',
            chain: billNode.chain,
        }
    }
    return res.status(201).json(response);
});
// wallet
app.get('/wallet/primary', (req, res) => {
    const response = {
        message: `primary wallet on node ${nodeidentifier}`,
        primarywallet: {
            address: billnode.primarywallet.publickey,
            balance: billnode.primarywallet.getBalance(),
        },
    };
    return res.status(201).json(response);
});
app.get('/wallet/coinbase', (req, res) => {
    const response = {
        message: `coinbase wallet on node ${nodeidentifier}`,
        coinbase: {
            address: billnode.coinbase.publickey,
            balance: billnode.coinbase.getBalance(),
        },
    };
    return res.status(201).json(response);
});
app.get('/', (req, res) => {
    const response = {
        message: `details for node ${nodeIdentifier}`,
        id: nodeIdentifier,
        address: `http://localhost:${PORT}`,
        primaryWallet: {
            address: billNode.primaryWallet.publicKey,
            balance: billNode.primaryWallet.getBalance(),
        },
        coinbase: {
            address: billNode.coinbase.publicKey,
        },
        txQueue: billNode.transactionQueue,
        difficulty: billNode.difficulty,
        peers: billNode.returnNodeAddresses(),
        chain: billNode.chain,
    }
    return res.status(201).json(response);
});
// start the server
app.listen(PORT, () => {
    console.log(`\nBillChain node listening on port ${PORT}!`)
});
