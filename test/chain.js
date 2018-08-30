const genesisBlock = {
    "hash": "00000f7fdd2b236e361fdd934d30d7c77bad6001049f8b43907ddf4a10321f1e",
    "previousHash": "0",
    "merkleRoot": "f36dcb8d9972e5a57f71963d0c5c0ed34003866cec63dcd7d66ad392effdafb5",
    "transactions": [
        {
            "sender": "04547dd2d5e1277ab4b9367be9c03712180826e6bc8beefa2a584ac0a2ff0e516df750469d59691d190c4b1644690193a9b2005cf0e84810013af1760dfa47e03a",
            "recipient": "0408966f09e6cb0ac2a590df18139f97791f01edfa48e0b29dabfda9c217a7a6b6abbfe2ee6a25222848d806ad8df7ca447f23d906bab6e3dc0ea89d8588361195",
            "amount": 10,
            "inputs": null,
            "outputs": [
                {
                    "recipient": "0408966f09e6cb0ac2a590df18139f97791f01edfa48e0b29dabfda9c217a7a6b6abbfe2ee6a25222848d806ad8df7ca447f23d906bab6e3dc0ea89d8588361195",
                    "amount": 10,
                    "parentTransactionId": "f36dcb8d9972e5a57f71963d0c5c0ed34003866cec63dcd7d66ad392effdafb5",
                    "id": "c8ae135029907fac06c31bd4f5acd1e376c7f07f49663feda830833bd0c5ceed"
                }
            ],
            "signature": "304402204b7b9183650cc8e0b8418581a504f7c75cdb3829c4cb2fac4a841974874abcbe02207986e4d4823806d4a696602d081c0d257c66ab4b7b4ae127961204905ae12add",
            "txid": "f36dcb8d9972e5a57f71963d0c5c0ed34003866cec63dcd7d66ad392effdafb5"
        }
    ],
    "timestamp": "1986-01-13T05:00:00.000Z",
    "nonce": 832691,
    "minimumTransaction": null,
    "getChainUtxos": null
};

let blockOne = {
    "hash": "0000069589e0feceed6bc3bd936394ffde8b1007435677b24ffafc450255a0da",
    "previousHash": "00000f7fdd2b236e361fdd934d30d7c77bad6001049f8b43907ddf4a10321f1e",
    "merkleRoot": "",
    "transactions": [],
    "timestamp": 1523743563314,
    "nonce": 847532,
    "minimumTransaction": 1
};
let blockTwo = {
    "hash": "0000079f07708fd8e0ae6237938c6ff49acd11bf373ee3b7505d1072756d96c2",
    "previousHash": "0000069589e0feceed6bc3bd936394ffde8b1007435677b24ffafc450255a0da",
    "merkleRoot": "",
    "transactions": [],
    "timestamp": 1523743575826,
    "nonce": 296012,
    "minimumTransaction": 1
};
let blockThree = {
    "hash": "000005932f0894e271f1aaf06756e767f95a7b4a9f900e322a12d826134b7b7f",
    "previousHash": "0000079f07708fd8e0ae6237938c6ff49acd11bf373ee3b7505d1072756d96c2",
    "merkleRoot": "",
    "transactions": [],
    "timestamp": 1523743582187,
    "nonce": 860908,
    "minimumTransaction": 1
};
let blockFour = {
    "hash": "000006f7b0810e264a2e7e63b43a1c291c7738872efb6c4a2f2a230e94e3b26e",
    "previousHash": "000005932f0894e271f1aaf06756e767f95a7b4a9f900e322a12d826134b7b7f",
    "merkleRoot": "",
    "transactions": [],
    "timestamp": 1523743594808,
    "nonce": 822941,
    "minimumTransaction": 1
};
let blockFive = {
    "hash": "00000457abd566e3b2b708a132f17263644db2de37c11bebaf01a4b48c701bc3",
    "previousHash": "000006f7b0810e264a2e7e63b43a1c291c7738872efb6c4a2f2a230e94e3b26e",
    "merkleRoot": "",
    "transactions": [],
    "timestamp": 1523743606892,
    "nonce": 2099039,
    "minimumTransaction": 1
};
let fakeBlock = {
    "hash": "11100457abd566e3b2b708a132f17263644db2de37c11bebaf01a4b48c701bc3",
    "previousHash": "111006f7b0810e264a2e7e63b43a1c291c7738872efb6c4a2f2a230e94e3b26e",
    "merkleRoot": "",
    "transactions": [],
    "timestamp": 1523743606895,
    "nonce": 111111111,
    "minimumTransaction": 1
};

let testChain = [genesisBlock, blockOne, blockTwo, blockThree, blockFour, blockFive];

let brokenChain = [genesisBlock, blockOne, blockTwo, blockFour, blockThree, blockFive];

module.exports = {
    genesisBlock,
    blockOne,
    blockTwo,
    blockThree,
    blockFour,
    blockFive,
    testChain,
    fakeBlock,
    brokenChain,
}
