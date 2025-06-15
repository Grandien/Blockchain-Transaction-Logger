const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const blocksRouter = require('./routes/blocks');
const Blockchain = require('./blockchain/blockchain');

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/test';
mongoose.connect(MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => {
    console.log('Connected to MongoDB');
}).catch((error) => {
    console.error('MongoDB connection error:', error);
});

// Initialize blockchain
const blockchain = new Blockchain();
blockchain.initialize().then(() => {
    console.log('Blockchain initialized');
}).catch((error) => {
    console.error('Blockchain initialization error:', error);
});

// Routes
app.use('/api/blocks', blocksRouter);

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        error: 'Something went wrong!',
        details: err.message
    });
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
