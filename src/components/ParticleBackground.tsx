import React from 'react';
import { motion } from 'framer-motion';

export const ParticleBackground: React.FC = () => {
  return (
    <div className="particle-background">
      {Array.from({ length: 50 }).map((_, i) => (
        <motion.div
          key={i}
          className="particle"
          initial={{
            x: Math.random() * window.innerWidth,
            y: Math.random() * window.innerHeight,
            opacity: 0,
          }}
          animate={{
            x: Math.random() * window.innerWidth,
            y: Math.random() * window.innerHeight,
            opacity: [0, 1, 0],
          }}
          transition={{
            duration: Math.random() * 20 + 10,
            repeat: Infinity,
            ease: "linear",
          }}
          style={{
            position: 'absolute',
            width: Math.random() * 4 + 1,
            height: Math.random() * 4 + 1,
            borderRadius: '50%',
            background: `linear-gradient(45deg, #667eea${Math.floor(Math.random() * 100)}, #764ba2${Math.floor(Math.random() * 100)})`,
            pointerEvents: 'none',
          }}
        />
      ))}
    </div>
  );
};
