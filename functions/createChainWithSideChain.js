module.exports = (chain, sideChain, height) => {
    // console.log('using side chain...');
    // dump any conflicting blocks
    const newChain = chain.slice(0, height);
    // add the sidechain blocks
    for (let i = 0; i < sideChain.length; i++) {
        newChain.push(sideChain[i]);
    }
    return newChain;
}
