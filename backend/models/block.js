const mongoose = require('mongoose');
const crypto = require('crypto');

// Mongoose Schema for database storage
const transactionSchema = new mongoose.Schema({
  sender: String,
  receiver: String,
  amount: Number,
  timestamp: String,
  description: String,
  transactionId: String
});

const blockSchema = new mongoose.Schema({
  index: Number,
  timestamp: String,
  transactions: [transactionSchema],
  previousHash: String,
  hash: String,
  nonce: Number,
  merkleRoot: String
});

// Schema for pending transactions
const pendingTransactionSchema = new mongoose.Schema({
  sender: String,
  receiver: String,
  amount: Number,
  timestamp: String,
  description: String,
  transactionId: String
});

// Block class for blockchain operations
class Block {
  constructor(index, transactions, previousHash = '') {
    this.index = index;
    this.timestamp = Date.now().toString();
    this.transactions = Array.isArray(transactions) ? transactions : [];
    this.previousHash = previousHash;
    this.nonce = 0;
    this.merkleRoot = this.calculateMerkleRoot();
    this.hash = this.calculateHash();
  }

  calculateHash() {
    try {
      return crypto.createHash('sha256')
        .update(
          this.index.toString() +
          this.previousHash +
          this.timestamp +
          JSON.stringify(this.transactions) +
          this.nonce.toString() +
          this.merkleRoot
        )
        .digest('hex');
    } catch (error) {
      console.error('Error calculating hash:', error);
      throw new Error('Failed to calculate block hash');
    }
  }

  calculateMerkleRoot() {
    try {
      if (!Array.isArray(this.transactions) || this.transactions.length === 0) {
        return '0'.repeat(64);
      }

      let hashes = this.transactions.map(tx => {
        const txString = typeof tx === 'object' ? JSON.stringify(tx) : tx.toString();
        return crypto.createHash('sha256')
          .update(txString)
          .digest('hex');
      });

      while (hashes.length > 1) {
        const newHashes = [];
        for (let i = 0; i < hashes.length; i += 2) {
          const left = hashes[i];
          const right = i + 1 < hashes.length ? hashes[i + 1] : left;
          const combined = crypto.createHash('sha256')
            .update(left + right)
            .digest('hex');
          newHashes.push(combined);
        }
        hashes = newHashes;
      }

      return hashes[0];
    } catch (error) {
      console.error('Error calculating Merkle root:', error);
      throw new Error('Failed to calculate Merkle root');
    }
  }

  mineBlock(difficulty) {
    try {
      const target = Array(difficulty + 1).join('0');
      while (this.hash.substring(0, difficulty) !== target) {
        this.nonce++;
        this.hash = this.calculateHash();
      }
    } catch (error) {
      console.error('Error mining block:', error);
      throw new Error('Failed to mine block');
    }
  }
}

module.exports = {
  Block,
  BlockModel: mongoose.model('Block', blockSchema),
  PendingTransactionModel: mongoose.model('PendingTransaction', pendingTransactionSchema)
};
