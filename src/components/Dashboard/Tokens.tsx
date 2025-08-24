import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

interface Token {
  id: string;
  name: string;
  symbol: string;
  totalSupply: string;
  decimals: number;
  contractAddress: string;
  createdAt: Date;
}

const Tokens: React.FC = () => {
  const [tokens, setTokens] = useState<Token[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    symbol: '',
    totalSupply: '',
    decimals: '18'
  });

  useEffect(() => {
    // Mock tokens for demonstration
    const mockTokens: Token[] = [
      {
        id: '1',
        name: 'My Awesome Token',
        symbol: 'MAT',
        totalSupply: '1000000',
        decimals: 18,
        contractAddress: '0x1234567890123456789012345678901234567890',
        createdAt: new Date(Date.now() - 86400000)
      },
      {
        id: '2',
        name: 'Test Coin',
        symbol: 'TEST',
        totalSupply: '500000',
        decimals: 18,
        contractAddress: '0x0987654321098765432109876543210987654321',
        createdAt: new Date(Date.now() - 172800000)
      }
    ];
    setTokens(mockTokens);
  }, []);

  const handleCreateToken = async () => {
    if (!formData.name || !formData.symbol || !formData.totalSupply) return;

    setIsCreating(true);
    
    // Simulate token creation
    setTimeout(() => {
      const newToken: Token = {
        id: Date.now().toString(),
        name: formData.name,
        symbol: formData.symbol,
        totalSupply: formData.totalSupply,
        decimals: parseInt(formData.decimals),
        contractAddress: `0x${Math.random().toString(16).substring(2, 42)}`,
        createdAt: new Date()
      };
      
      setTokens(prev => [newToken, ...prev]);
      setShowCreateModal(false);
      setFormData({ name: '', symbol: '', totalSupply: '', decimals: '18' });
      setIsCreating(false);
    }, 2000);
  };

  const shortenAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="tokens-container">
      <div className="tokens-header">
        <h1>My Tokens</h1>
        <motion.button
          className="create-token-btn"
          onClick={() => setShowCreateModal(true)}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          + Create Token
        </motion.button>
      </div>

      <div className="tokens-grid">
        {tokens.length === 0 ? (
          <div className="no-tokens">
            <div className="no-tokens-icon">🪙</div>
            <h3>No tokens created yet</h3>
            <p>Create your first BEP-20 token on opBNB</p>
            <motion.button
              className="create-first-token-btn"
              onClick={() => setShowCreateModal(true)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Create Your First Token
            </motion.button>
          </div>
        ) : (
          tokens.map((token, index) => (
            <motion.div
              key={token.id}
              className="token-card"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
            >
              <div className="token-header">
                <div className="token-icon">🪙</div>
                <div className="token-info">
                  <h3>{token.name}</h3>
                  <p className="token-symbol">{token.symbol}</p>
                </div>
              </div>
              
              <div className="token-details">
                <div className="token-detail">
                  <span className="label">Total Supply:</span>
                  <span className="value">{parseInt(token.totalSupply).toLocaleString()}</span>
                </div>
                <div className="token-detail">
                  <span className="label">Decimals:</span>
                  <span className="value">{token.decimals}</span>
                </div>
                <div className="token-detail">
                  <span className="label">Contract:</span>
                  <div className="address-row">
                    <span className="value">{shortenAddress(token.contractAddress)}</span>
                    <motion.button
                      className="copy-btn"
                      onClick={() => copyToClipboard(token.contractAddress)}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      📋
                    </motion.button>
                  </div>
                </div>
                <div className="token-detail">
                  <span className="label">Created:</span>
                  <span className="value">{token.createdAt.toLocaleDateString()}</span>
                </div>
              </div>

              <div className="token-actions">
                <motion.button
                  className="action-btn primary"
                  onClick={() => window.open(`https://opbnb.bscscan.com/token/${token.contractAddress}`, '_blank')}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  View on Explorer
                </motion.button>
                <motion.button
                  className="action-btn secondary"
                  onClick={() => copyToClipboard(token.contractAddress)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Copy Address
                </motion.button>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* Create Token Modal */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <motion.div
            className="modal create-token-modal"
            onClick={(e) => e.stopPropagation()}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
          >
            <h3>Create BEP-20 Token</h3>
            <div className="modal-form">
              <div className="form-group">
                <label>Token Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., My Awesome Token"
                />
              </div>
              <div className="form-group">
                <label>Token Symbol</label>
                <input
                  type="text"
                  value={formData.symbol}
                  onChange={(e) => setFormData(prev => ({ ...prev, symbol: e.target.value.toUpperCase() }))}
                  placeholder="e.g., MAT"
                  maxLength={10}
                />
              </div>
              <div className="form-group">
                <label>Total Supply</label>
                <input
                  type="number"
                  value={formData.totalSupply}
                  onChange={(e) => setFormData(prev => ({ ...prev, totalSupply: e.target.value }))}
                  placeholder="e.g., 1000000"
                />
              </div>
              <div className="form-group">
                <label>Decimals</label>
                <select
                  value={formData.decimals}
                  onChange={(e) => setFormData(prev => ({ ...prev, decimals: e.target.value }))}
                >
                  <option value="18">18 (Standard)</option>
                  <option value="8">8</option>
                  <option value="6">6</option>
                  <option value="0">0</option>
                </select>
              </div>
              
              <div className="creation-info">
                <p>🔧 This will deploy a new BEP-20 token contract on opBNB</p>
                <p>💰 Estimated gas fee: ~0.001 BNB</p>
              </div>

              <div className="modal-actions">
                <button
                  className="modal-btn secondary"
                  onClick={() => setShowCreateModal(false)}
                  disabled={isCreating}
                >
                  Cancel
                </button>
                <button
                  className="modal-btn primary"
                  onClick={handleCreateToken}
                  disabled={!formData.name || !formData.symbol || !formData.totalSupply || isCreating}
                >
                  {isCreating ? 'Creating Token...' : 'Create Token'}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default Tokens;
