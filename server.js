const express = require('express')
const Blockchain = require('./blockchain.js');
const randomId = require('./randomId.js');
const jsonBodyParser = require('body-parser').json();

//instantiate the node
const app = express()

// Generate a globally unique address for this node
nodeIdentifier = randomId('xNAx', 40);

// instantiate the blockchain
const blockchain = new Blockchain();

// add routes

app.get('/mine', (req, res) => {
    // We run the proof of work algorithm to get the next proof...
    const lastBlock = blockchain.lastBlock();
    const lastProof = lastBlock.proof;
    const proof = blockchain.proofOfWork(lastProof);

    // We must receive a reward for finding the proof.
    // the sender is '0' to signify that this node has mined a new coin.
    blockchain.newTransaction('0', nodeIdentifier, 1);

    // Forte the new Block by adding it to the chain
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
})

app.post('/transactions/new', jsonBodyParser, ({ body }, res) => {
    console.log('/transactions/new/,', body);
    // check that the required fields are in the psot'ed data
    if (!body.sender || !body.recipient || !body.amount) {
        return res.status(400).send('missing values');
    }
    // create a new transaction
    const index = blockchain.newTransaction(body.sender, body.recipient, body.amount);
    // create response
    const response = {message: `Transaction will be added to Block ${index}`};
    return res.status(201).json(response);
})

app.get('/chain', (req, res) => {
    const response = {
        chain: blockchain.chain,
        length: blockchain.chain.length,
    }
    return res.json(response);
})

app.listen(3000, () => {
    console.log('Blockchain node listening on port 3000!')
})
