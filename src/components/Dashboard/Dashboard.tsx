import React, { useState } from 'react';
import { motion } from 'framer-motion';
import Sidebar from './Sidebar';
import AIChat from './AIChat';
import Wallet from './Wallet';
import Tokens from './Tokens';
import NFTs from './NFTs';
import '../../styles/dashboard.css';

const Dashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState('chat');

  const renderContent = () => {
    switch (activeTab) {
      case 'chat':
        return <AIChat />;
      case 'wallet':
        return <Wallet />;
      case 'tokens':
        return <Tokens />;
      case 'nfts':
        return <NFTs />;
      default:
        return <AIChat />;
    }
  };

  return (
    <div className="dashboard-container">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      <main className="dashboard-main">
        <motion.div
          key={activeTab}
          className="dashboard-content"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
        >
          {renderContent()}
        </motion.div>
      </main>
    </div>
  );
};

export default Dashboard;
