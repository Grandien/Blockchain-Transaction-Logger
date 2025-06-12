# Blockchain-Based Payment System

A secure and immutable payment transaction logger built using blockchain technology. This system provides a tamper-proof way to record and verify payment transactions.

## Features

- **Secure Transaction Logging**: All transactions are recorded in an immutable blockchain
- **Real-time Validation**: Continuous validation of the blockchain's integrity
- **Tamper Detection**: Automatic detection of any attempts to modify transactions
- **Persistent Storage**: Transactions are stored in MongoDB for reliability
- **User-friendly Interface**: Clean and intuitive React-based frontend

## Technical Stack

### Frontend
- React.js
- Axios for API calls
- Modern UI components
- Real-time updates

### Backend
- Node.js with Express
- MongoDB for data persistence
- Custom blockchain implementation
- RESTful API architecture

### Security Features
- Cryptographic hashing (SHA-256)
- Merkle tree implementation
- Block validation
- Chain integrity verification
- Tamper detection system

## Getting Started

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (v4.4 or higher)
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone [repository-url]
cd [repository-name]
```

2. Install backend dependencies:
```bash
cd backend
npm install
```

3. Install frontend dependencies:
```bash
cd ../frontend
npm install
```

4. Start MongoDB:
```bash
mongod
```

5. Start the backend server:
```bash
cd backend
npm start
```

6. Start the frontend development server:
```bash
cd frontend
npm run dev
```

The application will be available at:
- Frontend: http://localhost:5173
- Backend API: http://localhost:3000

## Usage

### Adding a Transaction
1. Enter the payer's name
2. Enter the payee's name
3. Enter the payment amount
4. Add an optional description
5. Click "Add Transaction"

### Mining Transactions
1. After adding transactions, click "Commit to Blockchain"
2. The system will create a new block containing the pending transactions
3. The block will be validated and added to the chain

### Checking Blockchain Integrity
1. Click "Check Integrity" to verify the blockchain's validity
2. The system will check for any tampering or inconsistencies
3. Results will show if the chain is valid and any issues found

### Viewing Transactions
- All transactions are displayed in chronological order
- Each block shows its transactions and hash
- The chain's validation status is always visible

## Security Features

### Block Security
- Each block contains:
  - Cryptographic hash
  - Previous block's hash
  - Merkle root of transactions
  - Timestamp
  - Nonce for mining

### Validation System
- Continuous chain validation
- Block structure verification
- Transaction integrity checks
- Hash verification
- Merkle root validation

### Anti-Tampering
- Immutable block structure
- Cryptographic linking between blocks
- Automatic tamper detection
- Detailed validation reporting

## API Endpoints

### Transactions
- `POST /api/blocks/transaction` - Add a new transaction
- `GET /api/blocks/transactions` - Get pending transactions
- `DELETE /api/blocks/transactions/:index` - Delete a pending transaction

### Blockchain
- `GET /api/blocks` - Get the entire blockchain
- `POST /api/blocks/mine` - Mine pending transactions
- `GET /api/blocks/validate` - Check blockchain validity
- `GET /api/blocks/check-tampering` - Check for tampering
- `POST /api/blocks/reset` - Reset the blockchain

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Built for educational and research purposes
- Demonstrates practical blockchain implementation
- Showcases secure payment system design 