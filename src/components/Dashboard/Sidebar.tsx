import React from 'react';
import { motion } from 'framer-motion';
import { useAuthStore } from '../../store/authStore';
import '../../styles/dashboard.css';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab }) => {
  const { user, logout } = useAuthStore();

  const menuItems = [
    { id: 'chat', label: 'AI Chat', icon: '🤖' },
    { id: 'tokens', label: 'My Tokens', icon: '🪙' },
    { id: 'nfts', label: 'My NFTs', icon: '🖼️' },
    { id: 'wallet', label: 'Wallet', icon: '💼' }
  ];

  const handleSignOut = () => {
    logout();
    window.location.href = '/';
  };

  return (
    <motion.aside 
      className="dashboard-sidebar"
      initial={{ x: -300, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* Logo Section */}
      <div className="sidebar-header">
        <motion.div 
          className="sidebar-logo"
          whileHover={{ scale: 1.05 }}
          transition={{ type: "spring", stiffness: 400, damping: 17 }}
        >
          <span className="logo-icon">⚡</span>
          <h2 className="logo-text">opBNB AI</h2>
        </motion.div>
      </div>

      {/* Navigation Menu */}
      <nav className="sidebar-nav">
        {menuItems.map((item) => (
          <motion.button
            key={item.id}
            className={`nav-item ${activeTab === item.id ? 'active' : ''}`}
            onClick={() => setActiveTab(item.id)}
            whileHover={{ x: 8 }}
            whileTap={{ scale: 0.98 }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
          >
            <span className="nav-icon">{item.icon}</span>
            <span className="nav-label">{item.label}</span>
          </motion.button>
        ))}
      </nav>

      {/* User Section */}
      <div className="sidebar-footer">
        <div className="user-info">
          <div className="user-details">
            <p className="user-name">{user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User'}</p>
            <p className="user-email">{user?.email}</p>
            <p className="user-status">Connected</p>
          </div>
        </div>
        
        <motion.button
          className="sign-out-btn"
          onClick={handleSignOut}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          transition={{ type: "spring", stiffness: 400, damping: 17 }}
        >
          Sign Out
        </motion.button>
      </div>
    </motion.aside>
  );
};

export default Sidebar;
