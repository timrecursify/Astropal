'use client';

import React from 'react';
import { motion } from 'framer-motion';

export default function CosmicDust() {
  // Generate array of dust particles
  const dustParticles = Array.from({ length: 50 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: Math.random() * 3 + 1,
    duration: Math.random() * 20 + 10,
    delay: Math.random() * 5,
  }));

  return (
    <div className="fixed inset-0 -z-5 overflow-hidden pointer-events-none">
      {dustParticles.map((particle) => (
        <motion.div
          key={particle.id}
          className="absolute bg-white/20 rounded-full blur-sm"
          style={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            width: `${particle.size}px`,
            height: `${particle.size}px`,
          }}
          animate={{
            y: [0, -100, 0],
            x: [0, Math.random() * 50 - 25, 0],
            opacity: [0, 0.3, 0],
          }}
          transition={{
            duration: particle.duration,
            delay: particle.delay,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}
      
      {/* Larger floating elements */}
      {Array.from({ length: 8 }, (_, i) => (
        <motion.div
          key={`large-${i}`}
          className="absolute bg-white/10 rounded-full blur-md"
          style={{
            left: `${Math.random() * 90}%`,
            top: `${Math.random() * 90}%`,
            width: `${Math.random() * 8 + 4}px`,
            height: `${Math.random() * 8 + 4}px`,
          }}
          animate={{
            y: [0, -200, 0],
            x: [0, Math.random() * 100 - 50, 0],
            opacity: [0, 0.2, 0],
            scale: [1, 1.5, 1],
          }}
          transition={{
            duration: Math.random() * 30 + 15,
            delay: Math.random() * 10,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
} 