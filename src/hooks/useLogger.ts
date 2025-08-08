import { useEffect, useMemo } from 'react';
import { logger } from '../utils/logger';

interface LoggerApi {
  logUserAction: (action: string, data?: Record<string, unknown>) => void;
  logError: (error: unknown, context?: Record<string, unknown>) => void;
  logInfo: (message: string, data?: Record<string, unknown>) => void;
}

export function useLogger(componentName: string): LoggerApi {
  useEffect(() => {
    logger.debug(`${componentName} mounted`, { component: componentName });
    return () => logger.debug(`${componentName} unmounted`, { component: componentName });
  }, [componentName]);

  return useMemo(() => ({
    logUserAction: (action, data = {}) => logger.info(`User: ${action}`, { component: componentName, action, ...data }),
    logError: (error, context = {}) => {
      const message = error instanceof Error ? error.message : String(error);
      logger.error(`Error in ${componentName}`, { component: componentName, error: message, ...context });
    },
    logInfo: (message, data = {}) => logger.info(`${componentName}: ${message}`, { component: componentName, ...data }),
  }), [componentName]);
}


