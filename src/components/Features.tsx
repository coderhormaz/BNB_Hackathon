import React from 'react';
import { motion } from 'framer-motion';

interface FeatureCardProps {
  icon: string;
  title: string;
  description: string;
  index: number;
}

const FeatureCard: React.FC<FeatureCardProps> = ({ icon, title, description, index }) => (
  <motion.div
    className="feature-card-wrapper"
    initial={{ opacity: 0, y: 30 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.6, delay: index * 0.1 }}
    whileHover={{ scale: 1.02 }}
  >
    <div className="feature-card-glow"></div>
    <div className="card card-glass feature-card">
      <motion.div 
        className="feature-icon"
        whileHover={{ scale: 1.1, rotate: 5 }}
        transition={{ duration: 0.3 }}
        style={{ 
          fontSize: '3rem', 
          marginBottom: 'var(--spacing-md)', 
          textAlign: 'center' 
        }}
      >
        {icon}
      </motion.div>
      <div className="card-header">
        <h3 className="card-title">{title}</h3>
        <p className="card-description">{description}</p>
      </div>
    </div>
  </motion.div>
);

export const Features: React.FC = () => {
  const features = [
    {
      icon: '🤖',
      title: 'AI Chat Assistant',
      description: 'Get instant help with blockchain queries, smart contract analysis, and trading insights powered by advanced AI.'
    },
    {
      icon: '🪙',
      title: 'Token Creation',
      description: 'Launch your own tokens on opBNB with our intuitive interface and smart contract templates.'
    },
    {
      icon: '🖼️',
      title: 'NFT Minting',
      description: 'Create, mint, and trade NFTs with minimal gas fees on the opBNB network.'
    },
    {
      icon: '☁️',
      title: 'Greenfield Storage',
      description: 'Decentralized storage solutions integrated with BNB Greenfield for your digital assets.'
    }
  ];

  return (
    <section id="features" style={{ padding: 'var(--spacing-2xl) 0' }}>
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          style={{ textAlign: 'center', marginBottom: 'var(--spacing-2xl)' }}
        >
          <h2>Powerful Features</h2>
          <p className="text-secondary" style={{ 
            maxWidth: '600px', 
            margin: '0 auto',
            fontSize: 'var(--font-size-lg)' 
          }}>
            Everything you need to build, trade, and innovate on the opBNB blockchain
          </p>
        </motion.div>

        <div className="grid grid-cols-2">
          {features.map((feature, index) => (
            <FeatureCard
              key={feature.title}
              icon={feature.icon}
              title={feature.title}
              description={feature.description}
              index={index}
            />
          ))}
        </div>
      </div>
    </section>
  );
};
