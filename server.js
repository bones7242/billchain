const express = require('express');
const async = require('async');
const Blockchain = require('./classes/blockchain.js');
const randomId = require('./utils/randomId.js');
const jsonBodyParser = require('body-parser').json();

// get the port
const PORT = parseInt(process.argv[2]) || 3000;

//instantiate the node
const app = express();

// Generate an id for this node
nodeIdentifier = randomId('xNAx', 40);

require('./utils/checkCryptoSupport.js');

// instantiate the blockchain
const blockchain = new Blockchain();

// add routes
app.get('/details', (req, res) => {
    const response = {
        message: `details for node ${nodeIdentifier}`,
        id: nodeIdentifier,
        address: `http://localhost:${PORT}`,
        primaryWallet: {
            address: blockchain.primaryWallet.publicKey,
            balance: blockchain.primaryWallet.getBalanceAndUpdateWalletUTXOs(),
        },
        coinbase: {
            address: blockchain.coinbase.publicKey,
        },
        txQueue: blockchain.transactionQueue,
        difficulty: blockchain.difficulty,
        peers: blockchain.returnNodeAddresses(),
        chain: blockchain.chain,
    }
    return res.status(201).json(response);
});
app.get('/mine/start/:interval', (req, res) => {
    const interval = parseInt(req.params.interval); // tbd: take this from a param
    blockchain.startMining(interval);
    const response = {message: `Your miner is now mining every ${interval} seconds.`};
    res.status(200).json(response);
});
app.get('/mine/stop', (req, res) => {
    blockchain.stopMining();
    const response = {message: `Your miner has successfully stopped`};
    res.status(200).json(response);
});
app.post('/transactions/new', jsonBodyParser, ({ body }, res) => {
    // check that the required fields are in the post'ed data
    if (!body.recipient || !body.amount) {
        return res.status(400).send('missing values');
    }
    // create a new transaction
    const placeInQueue = blockchain.newTransaction(body.recipient, body.amount);
    const response = {message: `Transaction is number ${placeInQueue} in the queue`};
    return res.status(201).json(response);
});
app.post('/transactions/queue', jsonBodyParser, ({ body }, res) => {
    // receive a transaction (From a wallet. From another mining node?)
    if (!body.transaction) {
        return res.status(400).send('missing values');
    }
    // put that tx in you queue of transactions
    const placeInQueue = blockchain.queueTransaction(body.transaction);
    const response = {message: `Transaction is number ${placeInQueue} in the queue`};
    return res.status(201).json(response);
});
app.get('/chain', (req, res) => {
    const response = {
        chain: blockchain.chain,
        length: blockchain.chain.length,
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
        blockchain.registerNode(nodeList[i]);
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
    blockchain.resolveConflicts()
        .then(replaced => {
            if (replaced) {
                response = {
                    message: 'Our chain was replaced',
                    newChain: blockchain.chain,
                }
            } else {
                response = {
                    message: 'Our chain is authoritative',
                    chain: blockchain.chain,
                }
            }
            return res.status(201).json(response);
        })
        .catch(error => {
            res.status(400).json(error.message);
        });
});
app.post('/block/new', jsonBodyParser, ({ body, ip }, res) => {
    console.log('post to /block/new/')
    if (!body || !body.block) {
        console.log('no block received');
        return res.status(400).json({error: 'No block received'})
    }
    blockchain.evaluateNewBlock(body.block, ip)
        .then(accepted => {
            console.log('completed evaluating new block');
            let response;
            if (accepted) {
                response = {
                    message: 'Your block was accepted',
                    chain: blockchain.chain,
                }
            } else {
                response = {
                    message: 'Your block was rejected',
                    chain: null,
                }
            }
            return res.status(201).json(response);
        })
        .catch(error => {
            res.status(400).json(error.message);
        });
});
app.get('/block/:hash', ({ params }, res) => {
    console.log(`request on /block/${params.hash}`);
    try {
        let response;
        const [block, index ] = blockchain.getBlock(params.hash);
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
        message: `primary wallet on node ${nodeIdentifier}`,
        primaryWallet: {
            address: blockchain.primaryWallet.publicKey,
            balance: blockchain.primaryWallet.getBalanceAndUpdateWalletUTXOs(),
        },
    };
    return res.status(201).json(response);
});
app.get('/wallet/coinbase', (req, res) => {
    const response = {
        message: `coinbase wallet on node ${nodeIdentifier}`,
        coinbase: {
            address: blockchain.coinbase.publicKey,
            balance: blockchain.coinbase.getBalanceAndUpdateWalletUTXOs(),
        },
    };
    return res.status(201).json(response);
});

// start the server
app.listen(PORT, () => {
    console.log(`\nBlockchain node listening on port ${PORT}!`)
});
