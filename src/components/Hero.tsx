import React from 'react';
import { motion } from 'framer-motion';
import { useAuthModalStore, useWalletStore } from '../store';
import { ParticleBackground } from './ParticleBackground';

export const Hero: React.FC = () => {
  const { openSignup } = useAuthModalStore();
  const { user, wallet, balance } = useWalletStore();

  const getUserName = () => {
    if (user?.user_metadata?.full_name) {
      return user.user_metadata.full_name.split(' ')[0]; // First name only
    }
    return null;
  };

  const userName = getUserName();

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        delayChildren: 0.3,
        staggerChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.8,
        ease: [0.6, -0.05, 0.01, 0.99] as const
      }
    }
  };

  return (
    <section className="hero premium-hero">
      <ParticleBackground />
      
      <div className="hero-gradient-overlay"></div>
      
      <div className="container">
        <motion.div
          className="hero-content"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {userName && (
            <motion.div
              className="welcome-badge"
              variants={itemVariants}
            >
              <span className="welcome-text">Welcome back, {userName}!</span>
              {wallet && (
                <span className="balance-text">{balance} BNB</span>
              )}
            </motion.div>
          )}

          <motion.h1 
            className="hero-title premium-title"
            variants={itemVariants}
          >
            {userName ? (
              <>
                Your opBNB
                <br />
                <span className="gradient-text">AI Assistant</span> Awaits
              </>
            ) : (
              <>
                The Future of
                <br />
                <span className="gradient-text">Blockchain AI</span>
              </>
            )}
          </motion.h1>
          
          <motion.p 
            className="hero-subtitle premium-subtitle"
            variants={itemVariants}
          >
            {userName ? (
              "Continue your blockchain journey with lightning-fast transactions, AI-powered insights, and seamless DeFi experiences on opBNB."
            ) : (
              "Experience next-generation blockchain technology with AI-powered tools, ultra-low fees, and lightning-fast transactions on opBNB."
            )}
          </motion.p>
          
          <motion.div 
            className="hero-actions premium-actions"
            variants={itemVariants}
          >
            {!user ? (
              <>
                <motion.button 
                  className="btn btn-primary btn-lg hero-cta animate-glow"
                  onClick={openSignup}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <span>Get Started Free</span>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M5 12h14m-7-7l7 7-7 7"/>
                  </svg>
                </motion.button>
                <motion.button 
                  className="btn btn-outline btn-lg"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <polygon points="5,3 19,12 5,21"/>
                  </svg>
                  <span>Watch Demo</span>
                </motion.button>
              </>
            ) : (
              <>
                <motion.button 
                  className="btn btn-primary btn-lg hero-cta animate-glow"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <span>Open AI Assistant</span>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2l2 7h7l-5.5 4 2 7L12 16l-5.5 4 2-7L3 9h7l2-7z"/>
                  </svg>
                </motion.button>
                <motion.button 
                  className="btn btn-outline btn-lg"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M3 3h18v18H3V3zm16 16V5H5v14h14zM7 7h10v2H7V7zm0 4h10v2H7v-2zm0 4h7v2H7v-2z"/>
                  </svg>
                  <span>View Portfolio</span>
                </motion.button>
              </>
            )}
          </motion.div>

          <motion.div 
            className="hero-stats"
            variants={itemVariants}
          >
            <div className="stat-item">
              <div className="stat-number">4,000+</div>
              <div className="stat-label">TPS</div>
            </div>
            <div className="stat-divider"></div>
            <div className="stat-item">
              <div className="stat-number">&lt;$0.001</div>
              <div className="stat-label">Gas Fees</div>
            </div>
            <div className="stat-divider"></div>
            <div className="stat-item">
              <div className="stat-number">2s</div>
              <div className="stat-label">Block Time</div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};
