import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useWalletStore } from '../../store/walletStore';
import { ethers } from 'ethers';

const Wallet: React.FC = () => {
  const { wallet, balance, balanceUSD, bnbPrice, isLoadingPrice, setBalance, updateBNBPrice } = useWalletStore();
  const [isLoadingBalance, setIsLoadingBalance] = useState(false);
  const [showPrivateKey, setShowPrivateKey] = useState(false);
  const [sendAmount, setSendAmount] = useState('');
  const [recipientAddress, setRecipientAddress] = useState('');
  const [showSendModal, setShowSendModal] = useState(false);
  const [transactions, setTransactions] = useState<Array<{
    hash: string;
    type: string;
    amount: string;
    from?: string;
    to?: string;
    timestamp: Date;
    status: string;
  }>>([]);

  const fetchBalance = useCallback(async () => {
    if (!wallet?.address) return;
    
    try {
      setIsLoadingBalance(true);
      // opBNB Mainnet RPC
      const provider = new ethers.JsonRpcProvider('https://opbnb-mainnet-rpc.bnbchain.org');
      const balanceWei = await provider.getBalance(wallet.address);
      const balanceEth = ethers.formatEther(balanceWei);
      const formattedBalance = parseFloat(balanceEth).toFixed(6);
      setBalance(formattedBalance);
    } catch (error) {
      console.error('Error fetching balance:', error);
      setBalance('0.000000');
    } finally {
      setIsLoadingBalance(false);
    }
  }, [wallet?.address, setBalance]);

  const fetchTransactions = useCallback(async () => {
    // Mock transaction data for now
    const mockTransactions = [
      {
        hash: '0x1234...5678',
        type: 'Received',
        amount: '+0.1 BNB',
        from: '0xabcd...efgh',
        timestamp: new Date(Date.now() - 3600000),
        status: 'Success'
      },
      {
        hash: '0x9876...5432',
        type: 'Sent',
        amount: '-0.05 BNB',
        to: '0xijkl...mnop',
        timestamp: new Date(Date.now() - 7200000),
        status: 'Success'
      }
    ];
    setTransactions(mockTransactions);
  }, []);

  useEffect(() => {
    if (wallet?.address) {
      fetchBalance();
      fetchTransactions();
      // Update BNB price on component mount
      updateBNBPrice();
      
      // Update price every 5 minutes
      const priceInterval = setInterval(updateBNBPrice, 5 * 60 * 1000);
      
      return () => clearInterval(priceInterval);
    }
  }, [wallet?.address, updateBNBPrice, fetchBalance, fetchTransactions]);

  const shortenAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    // You could add a toast notification here
  };

  const handleSendBNB = async () => {
    if (!wallet?.privateKey || !recipientAddress || !sendAmount) return;
    
    try {
      setIsLoadingBalance(true);
      const provider = new ethers.JsonRpcProvider('https://opbnb-mainnet-rpc.bnbchain.org');
      const walletInstance = new ethers.Wallet(wallet.privateKey, provider);
      
      const tx = await walletInstance.sendTransaction({
        to: recipientAddress,
        value: ethers.parseEther(sendAmount)
      });
      
      console.log('Transaction sent:', tx.hash);
      setShowSendModal(false);
      setSendAmount('');
      setRecipientAddress('');
      fetchBalance();
      fetchTransactions();
    } catch (error) {
      console.error('Error sending transaction:', error);
    } finally {
      setIsLoadingBalance(false);
    }
  };

  const showPrivateKeyModal = () => {
    const confirmed = window.confirm(
      '⚠️ SECURITY WARNING ⚠️\n\nNever share your private key with anyone. Anyone with access to your private key can control your funds and assets.\n\nAre you sure you want to reveal your private key?'
    );
    if (confirmed) {
      setShowPrivateKey(true);
    }
  };

  return (
    <div className="wallet-container">
      <div className="wallet-header">
        <h1>My Wallet</h1>
        <motion.button
          className="refresh-btn"
          onClick={fetchBalance}
          disabled={isLoadingBalance}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          {isLoadingBalance ? '⟳' : '↻'} Refresh
        </motion.button>
      </div>

      <div className="wallet-cards">
        {/* Balance Card */}
        <motion.div
          className="wallet-card balance-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <h3>
            Wallet Balance 
            {bnbPrice && (
              <span className="bnb-price-indicator">
                {bnbPrice.change24h >= 0 ? '📈' : '📉'} ${bnbPrice.price.toLocaleString('en-US', { 
                  minimumFractionDigits: 0, 
                  maximumFractionDigits: 0 
                })}
              </span>
            )}
          </h3>
          <div className="balance-amount">
            {isLoadingBalance ? (
              <div className="loading">Loading...</div>
            ) : (
              <span>{balance} BNB</span>
            )}
          </div>
          <p className="balance-usd">
            {isLoadingPrice ? 'Loading price...' : balanceUSD}
            {bnbPrice && (
              <span className={`price-change ${bnbPrice.change24h >= 0 ? 'positive' : 'negative'}`}>
                {bnbPrice.change24h >= 0 ? ' (+' : ' ('}
                {bnbPrice.change24h.toFixed(2)}% 24h)
              </span>
            )}
          </p>
        </motion.div>

        {/* Address Card */}
        <motion.div
          className="wallet-card address-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <h3>Wallet Address</h3>
          <div className="address-display">
            <span className="address-text">
              {wallet?.address ? shortenAddress(wallet.address) : 'Not connected'}
            </span>
            {wallet?.address && (
              <motion.button
                className="copy-btn"
                onClick={() => copyToClipboard(wallet.address)}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                📋
              </motion.button>
            )}
          </div>
          <div className="wallet-actions">
            <motion.button
              className="action-btn primary"
              onClick={() => setShowSendModal(true)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Send BNB
            </motion.button>
            <motion.button
              className="action-btn secondary"
              onClick={() => window.open(`https://opbnb.bscscan.com/address/${wallet?.address}`, '_blank')}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              View on Explorer
            </motion.button>
            <motion.button
              className="action-btn danger"
              onClick={showPrivateKeyModal}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Reveal Private Key
            </motion.button>
          </div>
        </motion.div>
      </div>

      {/* Transactions */}
      <motion.div
        className="transactions-section"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.2 }}
      >
        <h3>Recent Transactions</h3>
        <div className="transactions-list">
          {transactions.length === 0 ? (
            <div className="no-transactions">
              <p>No transactions found</p>
            </div>
          ) : (
            transactions.map((tx, index) => (
              <motion.div
                key={index}
                className="transaction-item"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
              >
                <div className="tx-info">
                  <div className="tx-type">{tx.type}</div>
                  <div className="tx-amount">{tx.amount}</div>
                </div>
                <div className="tx-details">
                  <div className="tx-address">
                    {tx.from && `From: ${shortenAddress(tx.from)}`}
                    {tx.to && `To: ${shortenAddress(tx.to)}`}
                  </div>
                  <div className="tx-time">
                    {tx.timestamp.toLocaleDateString()} {tx.timestamp.toLocaleTimeString()}
                  </div>
                </div>
                <div className={`tx-status ${tx.status.toLowerCase()}`}>
                  {tx.status}
                </div>
              </motion.div>
            ))
          )}
        </div>
      </motion.div>

      {/* Send Modal */}
      {showSendModal && (
        <div className="modal-overlay" onClick={() => setShowSendModal(false)}>
          <motion.div
            className="modal send-modal"
            onClick={(e) => e.stopPropagation()}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
          >
            <h3>Send BNB</h3>
            <div className="modal-form">
              <div className="form-group">
                <label>Recipient Address</label>
                <input
                  type="text"
                  value={recipientAddress}
                  onChange={(e) => setRecipientAddress(e.target.value)}
                  placeholder="0x..."
                />
              </div>
              <div className="form-group">
                <label>Amount (BNB)</label>
                <input
                  type="number"
                  step="0.001"
                  value={sendAmount}
                  onChange={(e) => setSendAmount(e.target.value)}
                  placeholder="0.0"
                />
              </div>
              <div className="modal-actions">
                <button
                  className="modal-btn secondary"
                  onClick={() => setShowSendModal(false)}
                >
                  Cancel
                </button>
                <button
                  className="modal-btn primary"
                  onClick={handleSendBNB}
                  disabled={!recipientAddress || !sendAmount || isLoadingBalance}
                >
                  {isLoadingBalance ? 'Sending...' : 'Send'}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Private Key Modal */}
      {showPrivateKey && wallet?.privateKey && (
        <div className="modal-overlay" onClick={() => setShowPrivateKey(false)}>
          <motion.div
            className="modal private-key-modal"
            onClick={(e) => e.stopPropagation()}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
          >
            <h3>⚠️ Private Key</h3>
            <div className="warning-text">
              <p>Keep this private key secure and never share it with anyone!</p>
            </div>
            <div className="private-key-display">
              <code>{wallet.privateKey}</code>
              <motion.button
                className="copy-btn"
                onClick={() => copyToClipboard(wallet.privateKey)}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                Copy
              </motion.button>
            </div>
            <button
              className="modal-btn danger"
              onClick={() => setShowPrivateKey(false)}
            >
              Close
            </button>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default Wallet;
