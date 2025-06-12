const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
    sender: {
        type: String,
        required: true
    },
    receiver: {
        type: String,
        required: true
    },
    amount: {
        type: Number,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    timestamp: {
        type: Number,
        required: true
    },
    transactionId: {
        type: String,
        required: true,
        unique: true
    }
});

const blockSchema = new mongoose.Schema({
    index: {
        type: Number,
        required: true,
        unique: true
    },
    timestamp: {
        type: Number,
        required: true
    },
    transactions: [transactionSchema],
    previousHash: {
        type: String,
        required: true
    },
    hash: {
        type: String,
        required: true,
        unique: true
    },
    merkleRoot: {
        type: String,
        required: true
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Block', blockSchema); 