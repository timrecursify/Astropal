// Global type definitions for Cloudflare Pages Functions
// Ensures type safety for edge runtime globals during compilation

declare global {
  // EdgeRuntime exists only in Cloudflare Workers/Pages edge environment
  var EdgeRuntime: unknown | undefined;
  
  // Extend globalThis to include edge-specific properties
  interface globalThis {
    EdgeRuntime?: unknown;
  }
}

// This ensures the file is treated as a module
export {}; 