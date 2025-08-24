import React from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '../contexts/ThemeContext';

export const ThemeToggle: React.FC = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <motion.button
      className="theme-toggle"
      onClick={toggleTheme}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
    >
      <motion.div
        className="theme-toggle-track"
        animate={{ 
          backgroundColor: theme === 'dark' ? '#667eea' : '#f1f5f9' 
        }}
        transition={{ duration: 0.2 }}
      >
        <motion.div
          className="theme-toggle-thumb"
          animate={{
            x: theme === 'dark' ? 0 : 20,
            rotate: theme === 'dark' ? 0 : 180
          }}
          transition={{ duration: 0.2, ease: "easeInOut" }}
        >
          {theme === 'dark' ? (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
            </svg>
          ) : (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <circle cx="12" cy="12" r="5"/>
              <path d="m12 1-1 6m1-6 1 6m-1-6v6m8 5-6-1m6 1-6 1m6-1h-6m5 8-6-1m6 1-6 1m6-1h-6M7 1l6 1M7 1l6-1M7 1h6m-8 5 6 1m-6-1 6-1m-6 1h6m-5 8 6 1m-6-1 6-1m-6 1h6"/>
            </svg>
          )}
        </motion.div>
      </motion.div>
    </motion.button>
  );
};
