const crypto = require('crypto');
const hashSeed = 'billbitt';

module.exports = (transactionsArray) => {
    let count = transactionsArray.length;
    let previousTreeLayer = [];
    transactionsArray.forEach(transaction => {
        previousTreeLayer.push(transaction.txid);
    })
    let treeLayer = previousTreeLayer;
    while (count > 1) {
        treeLayer = [];
        for (let i = 1; i < previousTreeLayer.length; i++){
            const hash = crypto.createHmac('sha256', hashSeed)
                .update(previousTreeLayer[i-1] + previousTreeLayer[i])
                .digest('hex');
            treeLayer.push(hash);
        }
        count = treeLayer.length;
        previousTreeLayer = treeLayer;
    }
    let merkleRoot = '';
    if (treeLayer.length === 1) {
       merkleRoot = treeLayer[0];
    };
    return merkleRoot;
};
