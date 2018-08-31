const crypto = require('crypto');
const EC = require('elliptic').ec;
const ec = new EC('secp256k1');
const hashSeed = 'billbitt';


class TransactionToVerify {
    constructor({ amount, inputs, outputs, recipient, sender, signature, txid, timestamp}) {
        this.amount = amount;
        this.inputs = inputs;
        this.outputs = outputs;
        this.recipient = recipient;
        this.sender = sender;
        this.signature = signature;
        this.txid = txid
        this.timestamp = timestamp;
    }
    calculateHash () {
        return crypto.createHmac('sha256', hashSeed)
            .update(
                this.amount +
                this.inputs +
                this.sender +
                this.recipient +
                this.timestamp
            )
            .digest('hex');
    }
    verifySignature() {
        const message = this.sender + this.recipient + this.amount;
        const key = ec.keyFromPublic(this.sender, 'hex');
        return key.verify(message, this.signature);

    }
    // add up all the values of inputs that have a utxo attached to them
    // if the input has a UTXO, add its value to the total
    getInputsValue () {
        let total = 0;
        for (let key in this.inputs) {
            if (this.inputs.hasOwnProperty(key)) {
                if (this.inputs[key].UTXO){
                    total += this.inputs[key].UTXO.amount;
                }
            }
        }
        return total;
    };
    getOutputsValue () {
        let total = 0;
        for (let i = 0; i < this.outputs.length; i++) {
            total += this.outputs[i].amount;
        }
        return total;
    };
}

module.exports = TransactionToVerify;
