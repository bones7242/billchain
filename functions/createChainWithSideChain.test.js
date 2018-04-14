const createChainWithSideChain = require('./createChainWithSideChain');
const { testChain, genesisBlock, blockOne, blockTwo, fakeBlock} = require('../test/chain');


test('should find previous hash at index 4', () => {
    const sideChain = [fakeBlock, fakeBlock, fakeBlock];
    const result = [genesisBlock, blockOne, blockTwo, fakeBlock, fakeBlock, fakeBlock];
    expect(createChainWithSideChain(testChain, sideChain, 3)).toEqual(result);
});
