module.exports = (prefix, totalCharacters) => {
    let text = prefix;
    let startIndex = prefix.length;
    let possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

    for (let i = startIndex; i < totalCharacters; i++)
        text += possible.charAt(Math.floor(Math.random() * possible.length));

    return text;
};
