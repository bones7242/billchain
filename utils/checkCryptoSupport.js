let crypto;
// check for crypto support
try {
    crypto = require('crypto');
    console.log('[x] crypto is supported');
} catch (err) {
    console.log('[!] crypto support is disabled');
}
