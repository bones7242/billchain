module.exports = (difficulty) => {
    let difficultyString = '';
    for (let i = 0; i < difficulty;  i++) {
        difficultyString += '0';
    };
    return difficultyString;
};
