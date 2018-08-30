module.exports = (difficulty) => {
    if (!difficulty) {
        return null;
    }
    let difficultyString = '0';
    for (let i = 1; i < difficulty;  i++) {
        difficultyString += '0';
    };
    return difficultyString;
};
