const express = require('express');
const Blockchain = require('./classes/blockchain.js');
const randomId = require('./utils/randomId.js');
const jsonBodyParser = require('body-parser').json();

// get the port
const PORT = parseInt(process.argv[2]) || 3000;

//instantiate the node
const app = express();

// Generate a globally unique address for this node
nodeIdentifier = randomId('xNAx', 40);

// instantiate the blockchain
const blockchain = new Blockchain();

// add routes
// mine the current block
app.get('/mine', (req, res) => {
    // We run the proof of work algorithm to get the next proof...
    const lastBlock = blockchain.lastBlock();
    const lastProof = lastBlock.proof;
    const proof = blockchain.proofOfWork(lastProof);

    // We must receive a reward for finding the proof.
    // the sender is '0' to signify that this node has mined a new coin.
    blockchain.newTransaction('0', nodeIdentifier, 1);

    // Forge the new Block by adding it to the chain
    const previousHash = blockchain.hash(lastBlock);
    const block = blockchain.newBlock(proof, previousHash);

    const response = {
        message: 'New Block Forged',
        index: block.index,
        transactions: block.transactions,
        proof: block.proof,
        previousHash: block.previousHash,
    }

    res.status(200).json(response);
});

// receive a new transaction, and add it to the block to be mined
app.post('/transactions/new', jsonBodyParser, ({ body }, res) => {
    console.log('/transactions/new/,', body);
    // check that the required fields are in the post'ed data
    if (!body.sender || !body.recipient || !body.amount) {
        return res.status(400).send('missing values');
    }
    // create a new transaction
    const index = blockchain.newTransaction(body.sender, body.recipient, body.amount);
    // create response
    const response = {message: `Transaction will be added to Block ${index}`};
    return res.status(201).json(response);
});

// return the chain
app.get('/chain', (req, res) => {
    const response = {
        chain: blockchain.chain,
        length: blockchain.chain.length,
    }
    return res.json(response);
});

// register a new node
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

// check with other nodes to sync chains
app.get('/nodes/resolve', (req, res) => {
    // implement Consensus Algorithm, which resolves any confligs,
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


app.listen(PORT, () => {
    console.log(`Blockchain node listening on port ${PORT}!`)
});
