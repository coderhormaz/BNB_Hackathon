import React from 'react';
import { motion } from 'framer-motion';

export const Footer: React.FC = () => {
  const links = [
    { name: 'Documentation', href: '#docs' },
    { name: 'GitHub', href: 'https://github.com' },
    { name: 'Twitter', href: 'https://twitter.com' },
    { name: 'Discord', href: 'https://discord.com' }
  ];

  return (
    <footer style={{ 
      padding: 'var(--spacing-2xl) 0 var(--spacing-lg)',
      borderTop: '1px solid var(--dark-border)'
    }}>
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 'var(--spacing-md)'
          }}
        >
          {/* Brand */}
          <div style={{ 
            display: 'flex', 
            alignItems: 'center',
            fontSize: 'var(--font-size-lg)',
            fontWeight: '700'
          }}>
            <div style={{
              width: '24px',
              height: '24px',
              marginRight: 'var(--spacing-sm)',
              background: 'var(--primary-gradient)',
              borderRadius: 'var(--border-radius-sm)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: 'var(--font-size-sm)',
              fontWeight: 'bold'
            }}>
              O
            </div>
            opBNB AI Assistant
          </div>

          {/* Links */}
          <div style={{ 
            display: 'flex', 
            gap: 'var(--spacing-lg)' 
          }}>
            {links.map((link) => (
              <a
                key={link.name}
                href={link.href}
                style={{
                  color: 'var(--text-secondary)',
                  textDecoration: 'none',
                  fontSize: 'var(--font-size-sm)',
                  transition: 'color var(--transition-fast)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = 'var(--text-primary)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = 'var(--text-secondary)';
                }}
              >
                {link.name}
              </a>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          style={{
            textAlign: 'center',
            marginTop: 'var(--spacing-lg)',
            paddingTop: 'var(--spacing-lg)',
            borderTop: '1px solid var(--dark-border)',
            color: 'var(--text-muted)',
            fontSize: 'var(--font-size-sm)'
          }}
        >
          © 2025 opBNB AI Assistant. Built on opBNB for the future of DeFi.
        </motion.div>
      </div>
    </footer>
  );
};
