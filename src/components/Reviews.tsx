import React from 'react';
import { motion } from 'framer-motion';

export default function Reviews() {
  const reviews = [
    {
      text: "I discovered gifts I never knew I had. This spiritual awakening completely transformed how I see myself and my purpose.",
      author: "Sarah M., Wellness Coach"
    },
    {
      text: "My intuition has become my superpower. I now trust my inner knowing and make decisions with confidence and clarity.",
      author: "Marcus T., Software Engineer"
    },
    {
      text: "I manifested my dream job by following the divine timing guidance. The abundance alignment really works!",
      author: "Emma L., Creative Director"
    }
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="w-full"
    >
      <div className="text-center mb-8">
        <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
          What Our <span className="text-purple-400">Community</span> Says
        </h2>
        <p className="text-gray-400 text-lg">
          Real transformations from real people
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {reviews.map((review, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 + index * 0.1 }}
            className="bg-gray-900/30 backdrop-blur-sm border border-gray-800/50 rounded-lg p-6 hover:border-purple-500/30 transition-colors"
          >
            <p className="text-gray-300 italic mb-4 leading-relaxed">
              "{review.text}"
            </p>
            <p className="text-gray-500 text-sm font-medium">
              — {review.author}
            </p>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}