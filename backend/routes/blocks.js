const express = require('express')
const router = express.Router()
const Blockchain = require('../blockchain/blockchain')
const { BlockModel, PendingTransactionModel } = require('../models/block')

const blockchain = new Blockchain()

// Get pending transactions
router.get('/transactions', async (req, res) => {
  try {
    const pendingTxs = await PendingTransactionModel.find().sort({ timestamp: 1 })
    res.json(pendingTxs)
  } catch (error) {
    console.error('Error fetching pending transactions:', error)
    res.status(500).json({ error: 'Failed to fetch pending transactions' })
  }
})

// Add a new transaction
router.post('/transaction', async (req, res) => {
  try {
    const { sender, receiver, amount, description } = req.body
    const blockIndex = await blockchain.addTransaction({
      sender,
      receiver,
      amount,
      description
    })
    res.json({ message: `Transaction will be added to block ${blockIndex}` })
  } catch (error) {
    console.error('Error adding transaction:', error)
    res.status(400).json({ error: error.message })
  }
})

// Mine a new block
router.post('/mine', async (req, res) => {
  try {
    // Check if there are pending transactions
    if (blockchain.pendingTransactions.length === 0) {
      return res.status(400).json({ error: 'No pending transactions to mine' })
    }

    // Get the latest block from database to ensure correct index
    const latestBlock = await BlockModel.findOne().sort({ index: -1 })
    const nextIndex = latestBlock ? latestBlock.index + 1 : 0

    // Mine the block
    const block = await blockchain.minePendingTransactions()
    
    // Ensure the block index matches the database state
    block.index = nextIndex

    // Save the block to database
    const newBlock = new BlockModel({
      index: block.index,
      timestamp: block.timestamp,
      transactions: block.transactions,
      previousHash: block.previousHash,
      hash: block.hash,
      nonce: block.nonce,
      merkleRoot: block.merkleRoot
    })
    await newBlock.save()

    res.json({
      message: 'New block mined successfully',
      block: newBlock,
      validationStatus: blockchain.getValidationStatus()
    })
  } catch (error) {
    console.error('Mining error:', error)
    res.status(500).json({ 
      error: 'Failed to mine block',
      details: error.message 
    })
  }
})

// Get all blocks
router.get('/', async (req, res) => {
  try {
    const blocks = await BlockModel.find().sort({ index: 1 })
    res.json({
      chain: blocks,
      validationStatus: blockchain.getValidationStatus()
    })
  } catch (error) {
    console.error('Error fetching blocks:', error)
    res.status(500).json({ error: 'Failed to fetch blocks' })
  }
})

// Get balance for an address
router.get('/balance/:address', (req, res) => {
  try {
    const balance = blockchain.getBalanceOfAddress(req.params.address)
    res.status(200).json({ 
      address: req.params.address, 
      balance,
      validationStatus: blockchain.getValidationStatus()
    })
  } catch (err) {
    res.status(500).json({ message: 'Failed to get balance', error: err })
  }
})

// Validate the blockchain
router.get('/validate', (req, res) => {
  try {
    const validationStatus = blockchain.validateChain()
    res.json({
      isValid: validationStatus.isValid,
      issues: validationStatus.issues,
      validationStatus
    })
  } catch (error) {
    console.error('Validation error:', error)
    res.status(500).json({ error: 'Failed to validate blockchain' })
  }
})

// Check for tampering
router.get('/check-tampering', (req, res) => {
  try {
    const result = blockchain.detectTampering()
    res.json(result)
  } catch (error) {
    console.error('Tampering check error:', error)
    res.status(500).json({ error: 'Failed to check for tampering' })
  }
})

// Reset the blockchain
router.post('/reset', async (req, res) => {
  try {
    // Clear the database
    await BlockModel.deleteMany({})
    
    // Reset the blockchain
    const newChain = blockchain.resetChain()
    
    // Save the genesis block
    const genesisBlock = new BlockModel({
      index: newChain[0].index,
      timestamp: newChain[0].timestamp,
      transactions: newChain[0].transactions,
      previousHash: newChain[0].previousHash,
      hash: newChain[0].hash,
      nonce: newChain[0].nonce,
      merkleRoot: newChain[0].merkleRoot
    })
    await genesisBlock.save()

    res.json({
      message: 'Blockchain reset successfully',
      chain: newChain,
      validationStatus: blockchain.getValidationStatus()
    })
  } catch (error) {
    console.error('Reset error:', error)
    res.status(500).json({ error: 'Failed to reset blockchain' })
  }
})

// Delete a pending transaction
router.delete('/transactions/:index', async (req, res) => {
    try {
        const index = parseInt(req.params.index);
        
        // Get all pending transactions
        const pendingTxs = await PendingTransactionModel.find().sort({ timestamp: 1 });
        
        if (index < 0 || index >= pendingTxs.length) {
            return res.status(400).json({ error: 'Invalid transaction index' });
        }

        // Get the transaction to delete
        const transactionToDelete = pendingTxs[index];

        // Delete from database
        await PendingTransactionModel.deleteOne({ transactionId: transactionToDelete.transactionId });

        // Update blockchain's pending transactions
        blockchain.pendingTransactions = pendingTxs.filter(tx => tx.transactionId !== transactionToDelete.transactionId);

        res.json({
            message: 'Transaction deleted successfully',
            validationStatus: blockchain.getValidationStatus()
        });
    } catch (error) {
        console.error('Error deleting transaction:', error);
        res.status(500).json({ error: 'Failed to delete transaction' });
    }
});

module.exports = router