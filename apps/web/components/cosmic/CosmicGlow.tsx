import React from 'react';

export default function CosmicGlow() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
      {/* Ambient cosmic glow effects */}
      <div className="absolute top-1/4 right-1/3 w-96 h-96 bg-blue-500/[0.03] rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute bottom-1/3 left-1/4 w-80 h-80 bg-purple-500/[0.02] rounded-full blur-3xl animate-pulse delay-1000"></div>
      <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-white/[0.01] rounded-full blur-3xl animate-pulse delay-2000"></div>
      
      {/* Additional subtle glows for depth */}
      <div className="absolute top-3/4 right-1/4 w-48 h-48 bg-cyan-400/[0.02] rounded-full blur-2xl animate-pulse delay-3000"></div>
      <div className="absolute bottom-1/4 right-2/3 w-32 h-32 bg-indigo-400/[0.015] rounded-full blur-xl animate-pulse delay-4000"></div>
    </div>
  );
} 