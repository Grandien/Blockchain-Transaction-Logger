// Load environment variables from .env file
require('dotenv').config();

// Import the required modules
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');

const app = express();

// Connect to MongoDB
connectDB();

// Middleware to enable CORS
app.use(cors({
  origin: 'http://localhost:5173' // Allow frontend origin
}));

// Middleware to parse JSON bodies
app.use(express.json());

// Import routes
const blockRoutes = require('./routes/blocks');

// Use routes
app.use('/api/blocks', blockRoutes);

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
