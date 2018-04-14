const searchChainForPreviousHash = (chain, { previousHash }) => {
    // console.log('searching chain for block with hash:', previousHash);
    for (let i = chain.length - 1; i >= 0; i--) {
        let thisBlock = chain[i];
        if (thisBlock.hash === previousHash) {
            return i;
        }
    }
    return null;
};

module.exports = searchChainForPreviousHash;
