import { useEffect, useState } from 'react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const App = () => {
  const [loading, setLoading] = useState({
    logging: false,
    committing: false,
    fetching: false,
    resetting: false,
    deleting: false
  });
  const [blocks, setBlocks] = useState([]);
  const [validationStatus, setValidationStatus] = useState({
    lastChecked: null,
    isValid: true,
    issues: []
  });
  const [pendingTransactions, setPendingTransactions] = useState([]);
  const [payer, setPayer] = useState('');
  const [payee, setPayee] = useState('');
  const [amount, setAmount] = useState('');
  const [paymentDescription, setPaymentDescription] = useState('');
  const [message, setMessage] = useState('');

  const fetchPendingTransactions = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/blocks/transactions`);
      console.log('Pending transactions response:', response.data);
      setPendingTransactions(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Error fetching pending transactions:', error);
      setPendingTransactions([]);
      setMessage('Failed to fetch pending transactions');
    }
  };

  const deleteTransaction = async (index) => {
    if (!window.confirm('Are you sure you want to delete this pending payment? This can only be done before committing to the blockchain.')) {
      return;
    }

    try {
      setLoading(true);
      await axios.delete(`${API_URL}/api/blocks/transactions/${index}`);
      setMessage('Transaction deleted successfully');
      fetchPendingTransactions();
    } catch (error) {
      console.error('Error deleting transaction:', error);
      setMessage(error.response?.data?.error || 'Failed to delete transaction. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchBlocks = async () => {
    setLoading(prev => ({ ...prev, fetching: true }));
    try {
      const res = await axios.get(`${API_URL}/api/blocks`);
      console.log('Blocks response:', res.data);
      
      // Ensure we have valid data
      const chain = Array.isArray(res.data?.chain) ? res.data.chain : [];
      const validation = res.data?.validationStatus || {
        lastChecked: new Date().toISOString(),
        isValid: true,
        issues: []
      };

      setBlocks(chain);
      setValidationStatus(validation);
    } catch (error) {
      console.error('Error fetching payment history:', error);
      setBlocks([]);
      setValidationStatus({
        lastChecked: new Date().toISOString(),
        isValid: false,
        issues: ['Failed to fetch blockchain data']
      });
    } finally {
      setLoading(prev => ({ ...prev, fetching: false }));
    }
  };

  const logPayment = async () => {
    if (!payer || !payee || !amount || !paymentDescription) {
      return alert("Please fill all payment details");
    }
    setLoading(prev => ({ ...prev, logging: true }));
    try {
      await axios.post(`${API_URL}/api/blocks/transaction`, {
        sender: payer,
        receiver: payee,
        amount: parseFloat(amount),
        description: paymentDescription
      });
      alert('Payment logged successfully!');
      setPayer('');
      setPayee('');
      setAmount('');
      setPaymentDescription('');
      fetchBlocks();
      fetchPendingTransactions();
    } catch (error) {
      console.error('Error logging payment:', error);
      alert('Failed to log payment');
    } finally {
      setLoading(prev => ({ ...prev, logging: false }));
    }
  };

  const commitTransactions = async () => {
    setLoading(prev => ({ ...prev, committing: true }));
    try {
      const pending = await axios.get(`${API_URL}/api/blocks/transactions`);
      if (!pending.data || pending.data.length === 0) {
        throw new Error('No pending payments to commit');
      }

      const res = await axios.post(`${API_URL}/api/blocks/mine`);
      setValidationStatus(res.data.validationStatus);
      alert('Payments committed to blockchain!');
      fetchBlocks();
      fetchPendingTransactions();
    } catch (error) {
      console.error('Error committing payments:', error);
      if (error.message === 'No pending payments to commit') {
        alert('No pending payments to commit');
      } else {
        alert('Failed to commit payments. Please try again.');
      }
    } finally {
      setLoading(prev => ({ ...prev, committing: false }));
    }
  };

  const resetLedger = async () => {
    if (!window.confirm('Are you sure you want to reset the payment ledger? This will delete all payment history except the genesis block.')) {
      return;
    }
    
    setLoading(prev => ({ ...prev, resetting: true }));
    try {
      const res = await axios.post(`${API_URL}/api/blocks/reset`);
      setValidationStatus(res.data.validationStatus);
      alert('Payment ledger reset successfully!');
      fetchBlocks();
      fetchPendingTransactions();
    } catch (error) {
      console.error('Error resetting payment ledger:', error);
      alert('Failed to reset payment ledger');
    } finally {
      setLoading(prev => ({ ...prev, resetting: false }));
    }
  };

  const checkTampering = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/blocks/check-tampering`);
      if (res.data.tampered) {
        alert('WARNING: Blockchain tampering detected!\nIssues: ' + res.data.issues.join('\n'));
      } else {
        alert('Blockchain integrity verified - no tampering detected.');
      }
    } catch (error) {
      console.error('Error checking for tampering:', error);
      alert('Failed to check blockchain integrity');
    }
  };

  const formatToRupiah = (amount) =>
    new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
    }).format(amount);

  const mineBlock = async () => {
    try {
      setLoading(true);
      const response = await axios.post(`${API_URL}/api/blocks/mine`);
      setBlocks(response.data.chain);
      setPendingTransactions([]);
      setValidationStatus(response.data.validationStatus);
      setMessage('Block mined successfully!');
    } catch (error) {
      console.error('Error mining block:', error);
      setMessage(error.response?.data?.error || 'Failed to mine block. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const addTransaction = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const response = await axios.post(`${API_URL}/api/blocks/transaction`, {
        sender: payer,
        receiver: payee,
        amount: parseFloat(amount),
        description: paymentDescription
      });
      setMessage(response.data.message);
      setPayer('');
      setPayee('');
      setAmount('');
      setPaymentDescription('');
      fetchPendingTransactions();
    } catch (error) {
      console.error('Error adding transaction:', error);
      setMessage(error.response?.data?.error || 'Failed to add transaction. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const checkIntegrity = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/api/blocks/validate`);
      setValidationStatus(response.data.validationStatus);
      setMessage(response.data.isValid ? 'Blockchain is valid!' : 'Blockchain validation failed!');
    } catch (error) {
      console.error('Error checking integrity:', error);
      setMessage(error.response?.data?.error || 'Failed to check blockchain integrity. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const resetBlockchain = async () => {
    if (!window.confirm('Are you sure you want to reset the blockchain? This will delete all blocks except the genesis block.')) {
      return;
    }
    try {
      setLoading(true);
      const response = await axios.post(`${API_URL}/api/blocks/reset`);
      setBlocks(response.data.chain);
      setPendingTransactions([]);
      setValidationStatus(response.data.validationStatus);
      setMessage('Blockchain reset successfully!');
    } catch (error) {
      console.error('Error resetting blockchain:', error);
      setMessage(error.response?.data?.error || 'Failed to reset blockchain. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBlocks();
    fetchPendingTransactions();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-blue-800 mb-6 text-center">Blockchain Payment Logger</h1>
        <p className="text-center text-gray-600 mb-8">Securely log and track all your payments on the blockchain</p>

        <div className="bg-white p-6 rounded-lg shadow-md mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-800">📝 Log New Payment</h2>
            <button
              onClick={checkTampering}
              className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
            >
              Check Integrity
            </button>
          </div>
          <div className="space-y-3">
            <input
              className="border border-gray-300 p-2 w-full rounded"
              value={payer}
              onChange={e => setPayer(e.target.value)}
              placeholder="Payer Name"
              disabled={loading.logging}
            />
            <input
              className="border border-gray-300 p-2 w-full rounded"
              value={payee}
              onChange={e => setPayee(e.target.value)}
              placeholder="Payee Name"
              disabled={loading.logging}
            />
            <input
              className="border border-gray-300 p-2 w-full rounded"
              type="number"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              placeholder="Payment Amount"
              disabled={loading.logging}
            />
            <textarea
              className="border border-gray-300 p-2 w-full rounded"
              value={paymentDescription}
              onChange={e => setPaymentDescription(e.target.value)}
              placeholder="Payment Description"
              rows="3"
              disabled={loading.logging}
            />
            <div className="flex gap-3 pt-2">
              <button
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
                onClick={logPayment}
                disabled={loading.logging}
              >
                {loading.logging ? 'Logging...' : 'Log Payment'}
              </button>
              <button
                className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50"
                onClick={commitTransactions}
                disabled={loading.committing}
              >
                {loading.committing ? 'Committing...' : 'Commit to Blockchain'}
              </button>
              <button
                className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 disabled:opacity-50"
                onClick={resetLedger}
                disabled={loading.resetting}
              >
                {loading.resetting ? 'Resetting...' : 'Reset Ledger'}
              </button>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md mb-8">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">⏳ Pending Payments</h2>
          {loading.fetching ? (
            <p className="text-center text-gray-500">Loading pending payments...</p>
          ) : Array.isArray(pendingTransactions) && pendingTransactions.length > 0 ? (
            <div className="space-y-3">
              {pendingTransactions.map((tx, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <p className="font-medium">{tx.sender} → {tx.receiver}</p>
                    <p className="text-sm text-gray-600">{formatToRupiah(tx.amount)}</p>
                    <p className="text-sm text-gray-600">{tx.description}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(Number(tx.timestamp)).toLocaleString()}
                    </p>
                  </div>
                  <button
                    className="ml-4 px-3 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50"
                    onClick={() => deleteTransaction(index)}
                    disabled={loading.deleting}
                  >
                    Delete
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-gray-500">No pending payments</p>
          )}
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-semibold text-gray-800">📚 Payment History</h2>
            <div className={`px-3 py-1 rounded text-sm ${
              validationStatus?.isValid 
                ? 'bg-green-100 text-green-800' 
                : 'bg-red-100 text-red-800'
            }`}>
              {validationStatus?.isValid ? '✓ Valid' : '⚠ Invalid'}
            </div>
          </div>

          {loading.fetching ? (
            <p className="text-center text-gray-500">Loading payment history...</p>
          ) : Array.isArray(blocks) && blocks.length > 0 ? (
            blocks.map((block, idx) => (
              <div
                key={idx}
                className="bg-white p-5 rounded-lg shadow-sm mb-6 border border-gray-200"
              >
                <div className="mb-3">
                  <p className="text-lg font-bold text-indigo-700">Block #{block.index}</p>
                  <p className="text-sm text-gray-500">⏰ {new Date(Number(block.timestamp)).toLocaleString()}</p>
                </div>

                <p className="mt-4 mb-1 font-semibold text-gray-800">Payments:</p>
                <ul className="ml-5 list-disc text-sm text-gray-700">
                  {Array.isArray(block.transactions) && block.transactions.length > 0 ? (
                    block.transactions.map((tx, i) => (
                      <li key={i} className="mb-2">
                        <div className="flex flex-col">
                          <span className="font-semibold">{tx.sender} → {tx.receiver}</span>
                          <span className="text-blue-600">{formatToRupiah(tx.amount)}</span>
                          <span className="text-gray-600 text-sm">{tx.description}</span>
                          <span className="text-xs text-gray-500">
                            Payment ID: {tx.transactionId}
                          </span>
                        </div>
                      </li>
                    ))
                  ) : (
                    <li className="italic text-gray-500">No payments</li>
                  )}
                </ul>
              </div>
            ))
          ) : (
            <p className="text-center text-gray-500">No blocks found</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default App;
