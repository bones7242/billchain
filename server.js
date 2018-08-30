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

// add routes so the node can be accessed
app.get('/details', (req, res) => {
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
app.get('/mine', (req, res) => {
    const minedBlock = billNode.mine();
    const response = {
        message: `Successfully mined a block`,
        minedBlock,
    };
    res.status(200).json(response);
});
app.post('/transactions/new', jsonBodyParser, ({ body }, res) => {
    // check that the required fields are in the post'ed data
    if (!body.recipient || !body.amount) {
        return res.status(400).send('missing values');
    }
    // create a new transaction
    const placeInQueue = billNode.newTransaction(body.recipient, body.amount);
    const response = {message: `Transaction is number ${placeInQueue} in the queue`};
    return res.status(201).json(response);
});

app.get('/chain', (req, res) => {
    const response = {
        chain: billNode.chain,
        length: billNode.chain.length,
    };
    return res.json(response);
});
app.post('/nodes/register', jsonBodyParser, ({ body }, res) => {
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
app.get('/nodes/resolve', (req, res) => {
    // implement Consensus Algorithm, which resolves any conflicts,
    // to ensure a node has the correct chain
    billNode.resolveConflicts()
        .then(replaced => {
            if (replaced) {
                response = {
                    message: 'Our chain was replaced',
                    newChain: billNode.chain,
                }
            } else {
                response = {
                    message: 'Our chain is authoritative',
                    chain: billNode.chain,
                }
            }
            return res.status(201).json(response);
        })
        .catch(error => {
            res.status(400).json(error.message);
        });
});
app.post('/block/new', jsonBodyParser, ({ body, ip }, res) => {
    console.log('received new block on /block/new/')
    if (!body || !body.block) {
        console.log('no block received');
        return res.status(400).json({error: 'No block received'})
    }
    return res.status(200).json({message: 'block received'})
    //billNode.evaluateNewBlock(body.block, ip)
    //    .then(accepted => {
    //        console.log('completed evaluating new block');
    //        let response;
    //        if (accepted) {
    //            response = {
    //                message: 'Your block was accepted',
    //                chain: billNode.chain,
    //            }
    //        } else {
    //            response = {
    //                message: 'Your block was rejected',
    //                chain: null,
    //            }
    //        }
    //        return res.status(201).json(response);
    //    })
    //    .catch(error => {
    //        res.status(400).json(error.message);
    //    });
});
app.get('/block/:hash', ({ params }, res) => {
    console.log(`request on /block/${params.hash}`);
    try {
        let response;
        const [block, index] = billNode.getBlock(params.hash);
        if (block) {
            response = {
                message: 'Block found',
                block,
                index,
            };
        } else {
            response = {
                message: 'No block found with that hash',
                block: false,
                index: false,
            }
        }
        res.status(400).json(response);
    } catch (error) {
        res.status(400).json(error.message);
    }
});
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
// start the server
app.listen(PORT, () => {
    console.log(`\nBillChain node listening on port ${PORT}!`)
});
