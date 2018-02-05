module.exports = function makeid(prefix, totalCharacters) {
    var text = prefix;
    var startIndex = prefix.length;
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

    for (var i = startIndex; i < totalCharacters; i++)
        text += possible.charAt(Math.floor(Math.random() * possible.length));

    return text;
};
