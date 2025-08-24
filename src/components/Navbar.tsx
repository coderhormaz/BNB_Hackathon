import React from 'react';
import { motion } from 'framer-motion';
import { useWalletStore, useAuthModalStore } from '../store';
import { WalletService } from '../lib/wallet';
import { AuthService } from '../services/auth';
import { ThemeToggle } from './ThemeToggle';

export const Navbar: React.FC = () => {
  const { user, wallet } = useWalletStore();
  const { openLogin, openSignup } = useAuthModalStore();

  const handleSignOut = async () => {
    try {
      await AuthService.signOut();
      useWalletStore.getState().reset();
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  return (
    <nav className="navbar">
      <div className="container">
        <div className="navbar-content">
          {/* Brand */}
          <motion.a 
            href="/" 
            className="navbar-brand"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="navbar-logo">O</div>
            opBNB AI
          </motion.a>

          {/* Navigation Links */}
          <motion.ul 
            className="navbar-nav"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <li><a href="#features">Features</a></li>
            <li><a href="#stats">Stats</a></li>
            <li><a href="#contact">Contact</a></li>
            <li><a href="#docs">Docs</a></li>
          </motion.ul>

          {/* Actions */}
          <motion.div 
            className="navbar-actions"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <ThemeToggle />
            {user ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
                {user.user_metadata?.full_name && (
                  <span style={{ 
                    color: 'var(--text-secondary)', 
                    fontSize: 'var(--font-size-sm)' 
                  }}>
                    Hi, {user.user_metadata.full_name}
                  </span>
                )}
                {wallet && (
                  <div className="wallet-status">
                    <div className="wallet-indicator"></div>
                    <span>{WalletService.formatAddress(wallet.wallet_address)}</span>
                  </div>
                )}
                <button 
                  className="btn btn-outline btn-sm"
                  onClick={handleSignOut}
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <>
                <button 
                  className="btn btn-secondary btn-sm"
                  onClick={openLogin}
                >
                  Login
                </button>
                <button 
                  className="btn btn-primary btn-sm"
                  onClick={openSignup}
                >
                  Sign Up
                </button>
              </>
            )}
          </motion.div>
        </div>
      </div>
    </nav>
  );
};
