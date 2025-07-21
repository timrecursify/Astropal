'use client';

import { useEffect } from 'react';

class Logger {
  private currentLevel: string;

  constructor() {
    this.currentLevel = process.env.NODE_ENV === 'production' ? "warn" : "debug";
  }
  
  log(level: string, message: string, data: Record<string, any> = {}) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      environment: process.env.NODE_ENV || 'development',
      component: data.component || 'unknown',
      ...data
    };
    
    // Console output
    if (level === 'debug') console.debug(`[DEBUG] ${logEntry.timestamp}:`, message, data);
    if (level === 'info') console.info(`[INFO] ${logEntry.timestamp}:`, message, data);
    if (level === 'warn') console.warn(`[WARN] ${logEntry.timestamp}:`, message, data);
    if (level === 'error') console.error(`[ERROR] ${logEntry.timestamp}:`, message, data);
    
    // Production logging would integrate with external services here
    if (process.env.NODE_ENV === 'production') {
      // Sentry/LogRocket integration
    }
  }

  debug(message: string, data: Record<string, any> = {}) {
    this.log('debug', message, data);
  }

  info(message: string, data: Record<string, any> = {}) {
    this.log('info', message, data);
  }

  warn(message: string, data: Record<string, any> = {}) {
    this.log('warn', message, data);
  }

  error(message: string, data: Record<string, any> = {}) {
    this.log('error', message, data);
  }
}

// Export singleton instance
export const logger = new Logger();

// React hook for component logging
export const useLogger = (componentName: string) => {
  useEffect(() => {
    logger.debug(`${componentName} mounted`, { component: componentName });
    return () => logger.debug(`${componentName} unmounted`, { component: componentName });
  }, [componentName]);
  
  return {
    logUserAction: (action: string, data: Record<string, any> = {}) => 
      logger.info(`User: ${action}`, { component: componentName, action, ...data }),
    logError: (error: Error, context: Record<string, any> = {}) => 
      logger.error(`Error in ${componentName}`, { 
        component: componentName, 
        error: error.message, 
        ...context 
      }),
    logInfo: (message: string, data: Record<string, any> = {}) => 
      logger.info(`${componentName}: ${message}`, { component: componentName, ...data }),
    logWarn: (message: string, data: Record<string, any> = {}) => 
      logger.warn(`${componentName}: ${message}`, { component: componentName, ...data })
  };
}; 