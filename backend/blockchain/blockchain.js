const { Block } = require('../models/block')
const { BlockModel, PendingTransactionModel } = require('../models/block')
const crypto = require('crypto')
const fs = require('fs')
const path = require('path')

class Blockchain {
    constructor() {
        this.chain = [this.createGenesisBlock()];
        this.pendingTransactions = [];
        this.difficulty = 4;
        this.validationStatus = {
            lastChecked: null,
            isValid: true,
            issues: []
        };
    }

    async initialize() {
        try {
            // Load existing blocks from database
            const blocks = await BlockModel.find().sort({ index: 1 });
            
            if (blocks.length > 0) {
                this.chain = blocks.map(block => new Block(
                    block.index,
                    block.transactions,
                    block.previousHash
                ));
            } else {
                // If no blocks exist, create and save genesis block
                const genesisBlock = this.createGenesisBlock();
                const newBlock = new BlockModel({
                    index: genesisBlock.index,
                    timestamp: genesisBlock.timestamp,
                    transactions: genesisBlock.transactions,
                    previousHash: genesisBlock.previousHash,
                    hash: genesisBlock.hash,
                    nonce: genesisBlock.nonce,
                    merkleRoot: genesisBlock.merkleRoot
                });
                await newBlock.save();
                this.chain = [genesisBlock];
            }

            // Load pending transactions from database
            const pendingTxs = await PendingTransactionModel.find().sort({ timestamp: 1 });
            this.pendingTransactions = pendingTxs;
            
            this.validateChain();
        } catch (error) {
            console.error('Error initializing blockchain:', error);
            throw new Error('Failed to initialize blockchain');
        }
    }

    createGenesisBlock() {
        return new Block(
            0,
            [],
            '0'.repeat(64)
        );
    }

    getLatestBlock() {
        return this.chain[this.chain.length - 1];
    }

    async addTransaction(transaction) {
        if (!transaction.sender || !transaction.receiver || !transaction.amount) {
            throw new Error('Transaction must include sender, receiver and amount');
        }

        if (transaction.amount <= 0) {
            throw new Error('Transaction amount must be greater than 0');
        }

        transaction.timestamp = Date.now().toString();
        transaction.transactionId = crypto.randomBytes(16).toString('hex');

        // Save to database
        const pendingTx = new PendingTransactionModel(transaction);
        await pendingTx.save();

        // Add to memory
        this.pendingTransactions.push(transaction);
        return this.getLatestBlock().index + 1;
    }

    async minePendingTransactions() {
        try {
            if (this.pendingTransactions.length === 0) {
                throw new Error('No pending transactions to mine');
            }

            // Create a copy of pending transactions to avoid reference issues
            const transactionsToMine = JSON.parse(JSON.stringify(this.pendingTransactions));

            const block = new Block(
                this.chain.length,
                transactionsToMine,
                this.getLatestBlock().hash
            );

            // Mine the block
            block.mineBlock(this.difficulty);

            // Validate the block before adding it to the chain
            if (!this.isBlockValid(block)) {
                throw new Error('Invalid block generated');
            }

            // Add the block to the chain
            this.chain.push(block);
            
            // Clear pending transactions from database
            await PendingTransactionModel.deleteMany({});
            
            // Clear pending transactions from memory
            this.pendingTransactions = [];
            
            // Update validation status
            this.validateChain();
            
            return block;
        } catch (error) {
            console.error('Mining error:', error);
            throw new Error(`Failed to mine block: ${error.message}`);
        }
    }

    async deletePendingTransaction(index) {
        try {
            if (index < 0 || index >= this.pendingTransactions.length) {
                throw new Error('Invalid transaction index');
            }

            // Get the transaction to delete
            const transactionToDelete = this.pendingTransactions[index];

            // Delete from database
            await PendingTransactionModel.deleteOne({ transactionId: transactionToDelete.transactionId });

            // Delete from memory
            this.pendingTransactions.splice(index, 1);
        } catch (error) {
            console.error('Error deleting pending transaction:', error);
            throw error;
        }
    }

    isBlockValid(block) {
        try {
            const previousBlock = this.chain[block.index - 1];

            if (block.index === 0) {
                return block.hash === block.calculateHash() &&
                       block.previousHash === '0'.repeat(64);
            }

            return block.hash === block.calculateHash() &&
                   block.previousHash === previousBlock.hash;
        } catch (error) {
            console.error('Block validation error:', error);
            return false;
        }
    }

    validateChain() {
        this.validationStatus = {
            lastChecked: Date.now(),
            isValid: true,
            issues: []
        };

        try {
            const genesisBlock = this.chain[0];
            if (genesisBlock.index !== 0 || 
                genesisBlock.previousHash !== '0'.repeat(64) ||
                genesisBlock.transactions.length !== 0) {
                this.validationStatus.isValid = false;
                this.validationStatus.issues.push('Invalid genesis block');
            }

            for (let i = 1; i < this.chain.length; i++) {
                const currentBlock = this.chain[i];
                const previousBlock = this.chain[i - 1];

                if (!this.isBlockValid(currentBlock)) {
                    this.validationStatus.isValid = false;
                    this.validationStatus.issues.push(`Invalid block at index ${i}`);
                }

                if (currentBlock.previousHash !== previousBlock.hash) {
                    this.validationStatus.isValid = false;
                    this.validationStatus.issues.push(`Invalid previous hash at index ${i}`);
                }

                if (currentBlock.index !== i) {
                    this.validationStatus.isValid = false;
                    this.validationStatus.issues.push(`Invalid block index at ${i}`);
                }
            }
        } catch (error) {
            console.error('Chain validation error:', error);
            this.validationStatus.isValid = false;
            this.validationStatus.issues.push('Error during chain validation');
        }

        return this.validationStatus;
    }

    getValidationStatus() {
        return this.validationStatus;
    }

    resetChain() {
        this.chain = [this.createGenesisBlock()];
        this.pendingTransactions = [];
        this.validateChain();
        return this.chain;
    }

    detectTampering() {
        const issues = [];
        let tampered = false;

        try {
            for (let i = 0; i < this.chain.length; i++) {
                const block = this.chain[i];
                
                if (block.hash !== block.calculateHash()) {
                    issues.push(`Block ${i} hash mismatch`);
                    tampered = true;
                }

                if (block.merkleRoot !== block.calculateMerkleRoot()) {
                    issues.push(`Block ${i} Merkle root mismatch`);
                    tampered = true;
                }

                if (i > 0 && block.previousHash !== this.chain[i - 1].hash) {
                    issues.push(`Block ${i} previous hash mismatch`);
                    tampered = true;
                }
            }
        } catch (error) {
            console.error('Tampering detection error:', error);
            issues.push('Error during tampering detection');
            tampered = true;
        }

        return {
            tampered,
            issues
        };
    }
}

module.exports = Blockchain;