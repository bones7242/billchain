const searchChainForPreviousHash = require('./searchChainForPreviousHash');
const { testChain, blockFive, blockThree, blockOne, fakeBlock} = require('../test/chain');

test('should find previous hash at index 4', () => {
    expect(searchChainForPreviousHash(testChain, blockFive)).toBe(4);
});
test('should find previous hash at index 2', () => {
    expect(searchChainForPreviousHash(testChain, blockThree)).toBe(2);
});
test('should find previous hash at index 0 (genesis)', () => {
    expect(searchChainForPreviousHash(testChain, blockOne)).toBe(0);
});
test('should return null if no block with previous hash found', () => {
    expect(searchChainForPreviousHash(testChain, fakeBlock)).toBe(null);
});
