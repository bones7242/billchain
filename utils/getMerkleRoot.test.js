const getMerkleRoot = require('./getMerkleRoot');
const Transaction = require('../classes/transaction');

let transactionOne = new Transaction('bill', 'jack', 2, null);

let transactionTwo = new Transaction('bill', 'jason', 3, null);

let transactionThree = new Transaction('bill', 'jerry', 2, null);

test('should return empty string if no arguments provided', () => {
    expect(getMerkleRoot()).toBe("");
});

test('should return empty string if empty array provided', () => {
    expect(getMerkleRoot([])).toBe("");
});

test('should return a 64 digit hash when given a transaction', () => {
    const transactionArray = [transactionOne];
   expect(typeof getMerkleRoot(transactionArray)).toBe("string");
   expect(getMerkleRoot(transactionArray).length).toBe(64);
});

test('should return a 64 digit hash when given two transactions', () => {
    const transactionArray = [transactionOne, transactionTwo];
    expect(typeof getMerkleRoot(transactionArray)).toBe("string");
    expect(getMerkleRoot(transactionArray).length).toBe(64);
});

test('should return the same hash when given the same two transactions', () => {
    const transactionArray = [transactionOne, transactionTwo];
    expect(getMerkleRoot(transactionArray)).toBe(getMerkleRoot(transactionArray));
});

test('should return different hashes when given a different transaction', () => {
    const transactionArray = [transactionOne];
    const differentTransactionArray = [transactionTwo];
    expect(getMerkleRoot(transactionArray)).not.toBe(getMerkleRoot(differentTransactionArray));
});

test('should return different hashes when given two different transaction arrays', () => {
    const transactionArray = [transactionOne, transactionTwo];
    const differentTransactionArray = [transactionTwo, transactionThree];
    expect(getMerkleRoot(transactionArray)).not.toBe(getMerkleRoot(differentTransactionArray));
});

