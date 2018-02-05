const express = require('express')
const Blockchain = require('./blockchain.js');
const randomId = require('./randomId.jx');
var jsonBodyParser = require('body-parser').json();

//instantiate the node
const app = express()

// Generate a globally unique address for this node
node_identifier = randomId();

// instantiate the blockchain
const blockchain = new Blockchain();
blockchain.newBlock(1, 100);  // create first block

// add routes

app.get('/mine', (req, res) => {
    res.send('we will mine a new block')
})

app.post('/transactions/new', jsonBodyParser, ({ body }, res) => {
    // check that the required fields are in the psot'ed data
    if (!body.sender || !body.recipient || !body.amount) {
        return res.status(400).send('missing values');
    }
    // create a new transaction
    const index = blockchain.newTransaction(body.sender, body.recipient, body.amount);
    // create response
    const response = {message: `Transaction will be added to Block ${index}`}
    return res.status(201).json(response);
})

app.get('/chain', (req, res) => {
    const response = {
        chain: blockchain.chain,
        length: blockchain.chain.lenth();
    }
    return res.json(response);
})

app.listen(3000, () => {
    console.log('Example app listening on port 3000!')
})
