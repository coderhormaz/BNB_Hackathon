import React from 'react';
import { motion } from 'framer-motion';

interface StatCardProps {
  value: string;
  label: string;
  index: number;
}

const StatCard: React.FC<StatCardProps> = ({ value, label, index }) => (
  <motion.div
    className="card text-center"
    initial={{ opacity: 0, scale: 0.8 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ duration: 0.5, delay: index * 0.1 }}
  >
    <div style={{ 
      fontSize: 'var(--font-size-4xl)', 
      fontWeight: '800', 
      background: 'var(--primary-gradient)',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      backgroundClip: 'text',
      marginBottom: 'var(--spacing-xs)'
    }}>
      {value}
    </div>
    <div style={{ 
      color: 'var(--text-secondary)',
      fontSize: 'var(--font-size-lg)',
      fontWeight: '500'
    }}>
      {label}
    </div>
  </motion.div>
);

export const Stats: React.FC = () => {
  const stats = [
    { value: '<$0.001', label: 'Gas Fees' },
    { value: '4,000+', label: 'TPS' },
    { value: '2s', label: 'Block Time' },
    { value: '99.9%', label: 'Uptime' }
  ];

  return (
    <section id="stats" style={{ 
      padding: 'var(--spacing-2xl) 0',
      background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.03) 0%, rgba(118, 75, 162, 0.03) 100%)'
    }}>
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          style={{ textAlign: 'center', marginBottom: 'var(--spacing-2xl)' }}
        >
          <h2>opBNB Performance</h2>
          <p className="text-secondary" style={{ 
            maxWidth: '600px', 
            margin: '0 auto',
            fontSize: 'var(--font-size-lg)' 
          }}>
            Built for speed, optimized for developers, designed for the future
          </p>
        </motion.div>

        <div className="grid grid-cols-4">
          {stats.map((stat, index) => (
            <StatCard
              key={stat.label}
              value={stat.value}
              label={stat.label}
              index={index}
            />
          ))}
        </div>
      </div>
    </section>
  );
};
