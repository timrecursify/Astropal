export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  environment: string;
  component: string;
  traceId?: string;
  userId?: string;
  requestId?: string;
  [key: string]: any;
}

class Logger {
  private levels: LogLevel[] = ['debug', 'info', 'warn', 'error'];
  private currentLevel: LogLevel;

  constructor(environment: string = 'development') {
    this.currentLevel = environment === 'production' ? 'warn' : 'debug';
  }

  private shouldLog(level: LogLevel): boolean {
    const levelIndex = this.levels.indexOf(level);
    const currentLevelIndex = this.levels.indexOf(this.currentLevel);
    return levelIndex >= currentLevelIndex;
  }

  log(level: LogLevel, message: string, data: Record<string, any> = {}): void {
    if (!this.shouldLog(level)) return;

    const logEntry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      environment: data.environment || 'unknown',
      component: data.component || 'worker',
      traceId: data.traceId || this.generateTraceId(),
      userId: data.userId,
      requestId: data.requestId,
      ...data
    };

    // Console output for development and immediate visibility
    // @ts-ignore - console is available in Cloudflare Workers
    console[level](`[${level.toUpperCase()}] ${logEntry.timestamp}:`, message, data);

    // In production, send to external service
    if (logEntry.environment === 'production') {
      this.sendToExternalService(logEntry);
    }
  }

  debug(message: string, data: Record<string, any> = {}): void {
    this.log('debug', message, data);
  }

  info(message: string, data: Record<string, any> = {}): void {
    this.log('info', message, data);
  }

  warn(message: string, data: Record<string, any> = {}): void {
    this.log('warn', message, data);
  }

  error(message: string, data: Record<string, any> = {}): void {
    this.log('error', message, data);
  }

  private generateTraceId(): string {
    return Math.random().toString(36).substring(2, 15) + 
           Math.random().toString(36).substring(2, 15);
  }

  private async sendToExternalService(logEntry: LogEntry): Promise<void> {
    try {
      // Sentry for errors - env vars will be passed from Worker context
      if (logEntry.level === 'error') {
        await this.reportToSentry(logEntry);
      }

      // Store structured logs in R2 for long-term analysis
      await this.storeInR2(logEntry);
    } catch (error) {
      // Fallback: don't let logging errors break the application
      // @ts-ignore - console is available in Cloudflare Workers
      console.error('Failed to send log to external service:', error);
    }
  }

  private async reportToSentry(logEntry: LogEntry): Promise<void> {
    // Sentry integration for production error tracking
    // This would integrate with Sentry's Workers SDK when available
    // @ts-ignore - console is available in Cloudflare Workers
    console.warn('Sentry integration not yet implemented:', logEntry);
  }

  private async storeInR2(logEntry: LogEntry): Promise<void> {
    // Store logs in R2 for long-term storage and analysis
    // This would store structured logs in R2 buckets
    // @ts-ignore - console is available in Cloudflare Workers
    console.debug('R2 log storage not yet implemented:', logEntry);
  }

  // Request-scoped logger factory
  static createRequestLogger(requestId: string, traceId?: string): Logger {
    const logger = new Logger();
    const originalLog = logger.log.bind(logger);
    
    logger.log = (level: LogLevel, message: string, data: Record<string, any> = {}) => {
      return originalLog(level, message, {
        requestId,
        traceId: traceId || logger.generateTraceId(),
        ...data
      });
    };
    
    return logger;
  }
}

// Global logger instance
export const logger = new Logger();

// Performance timing utility
export class PerformanceLogger {
  private startTimes: Map<string, number> = new Map();

  start(operation: string, data: Record<string, any> = {}): void {
    this.startTimes.set(operation, Date.now());
    logger.debug(`Performance: ${operation} started`, {
      operation,
      component: 'performance',
      ...data
    });
  }

  end(operation: string, data: Record<string, any> = {}): number {
    const startTime = this.startTimes.get(operation);
    if (!startTime) {
      logger.warn(`Performance: ${operation} end called without start`, {
        operation,
        component: 'performance'
      });
      return 0;
    }

    const duration = Date.now() - startTime;
    this.startTimes.delete(operation);

    logger.info(`Performance: ${operation} completed`, {
      operation,
      duration,
      component: 'performance',
      ...data
    });

    return duration;
  }
}

// Export performance logger instance
export const performanceLogger = new PerformanceLogger();

// Utility function for error logging with context
export function logError(
  error: Error,
  context: Record<string, any> = {}
): void {
  logger.error('Application error', {
    error: error.message,
    stack: error.stack,
    name: error.name,
    component: context.component || 'unknown',
    ...context
  });
}

// Utility function for user action logging
export function logUserAction(
  action: string,
  userId: string,
  data: Record<string, any> = {}
): void {
  logger.info(`User action: ${action}`, {
    action,
    userId,
    component: 'user-actions',
    ...data
  });
}

// Utility function for API request logging
export function logApiRequest(
  method: string,
  path: string,
  statusCode: number,
  duration: number,
  data: Record<string, any> = {}
): void {
  const level = statusCode >= 500 ? 'error' : statusCode >= 400 ? 'warn' : 'info';
  
  logger.log(level, `API Request: ${method} ${path}`, {
    method,
    path,
    statusCode,
    duration,
    component: 'api',
    ...data
  });
} 