/* Centralized Logger Utility (production-safe)
 * - Uses environment to set default log level
 * - Provides debug/info/warn/error methods
 * - Avoids leaking sensitive data; callers should pass sanitized payloads
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  environment: string | undefined;
  component?: string;
  [key: string]: unknown;
}

class Logger {
  private levels: LogLevel[] = ['debug', 'info', 'warn', 'error'];
  private currentLevelIndex: number;

  constructor() {
    const defaultLevel: LogLevel = (import.meta as any)?.env?.PROD ? 'warn' : 'debug';
    const envLevel = ((import.meta as any)?.env?.VITE_LOG_LEVEL as LogLevel) || defaultLevel;
    this.currentLevelIndex = this.levels.indexOf(envLevel);
    if (this.currentLevelIndex < 0) this.currentLevelIndex = this.levels.indexOf(defaultLevel);
  }

  private shouldLog(level: LogLevel): boolean {
    return this.levels.indexOf(level) >= this.currentLevelIndex;
  }

  private buildEntry(level: LogLevel, message: string, data: Record<string, unknown> = {}): LogEntry {
    return {
      timestamp: new Date().toISOString(),
      level,
      message,
      environment: (import.meta as any)?.env?.MODE,
      ...data,
    };
  }

  private sendToExternalService(_entry: LogEntry): void {
    // No-op placeholder for production external logging (Sentry/LogRocket/etc.)
    // Intentionally empty to avoid new dependencies in this step.
  }

  private emit(level: LogLevel, message: string, data: Record<string, unknown> = {}): void {
    if (!this.shouldLog(level)) return;
    const entry = this.buildEntry(level, message, data);
    const payload = { ...entry };
    // Avoid printing overly large objects in dev console
    const printer = level === 'error' ? console.error : level === 'warn' ? console.warn : level === 'info' ? console.info : console.debug;
    printer(`[${level.toUpperCase()}] ${entry.timestamp}: ${message}`, payload);
    if ((import.meta as any)?.env?.PROD) {
      try { this.sendToExternalService(entry); } catch { /* swallow */ }
    }
  }

  debug(message: string, data: Record<string, unknown> = {}): void { this.emit('debug', message, data); }
  info(message: string, data: Record<string, unknown> = {}): void { this.emit('info', message, data); }
  warn(message: string, data: Record<string, unknown> = {}): void { this.emit('warn', message, data); }
  error(message: string, data: Record<string, unknown> = {}): void { this.emit('error', message, data); }
}

export const logger = new Logger();


