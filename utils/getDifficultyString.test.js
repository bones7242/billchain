const getDifficultyString = require('./getDifficultyString');

test('should return null if none provided', () => {
    expect(getDifficultyString()).toBe(null);
});

test('should return an empty string if given 0', () => {
    expect(getDifficultyString(0)).toBe(null);
});

test('should return one zero for 1', () => {
    expect(getDifficultyString(1)).toBe('0');
});

test('should return two zeros for 2', () => {
    expect(getDifficultyString(2)).toBe('00');
});

test('should return four zeros for 4', () => {
    expect(getDifficultyString(4)).toBe('0000');
});

test('should return ten zeros for 10', () => {
    expect(getDifficultyString(10)).toBe('0000000000');
});
