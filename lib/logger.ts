// lib/logger.ts - Structured logging utility

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogContext {
  [key: string]: unknown;
}

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: LogContext;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
}

class Logger {
  private isDevelopment = process.env.NODE_ENV !== 'production';

  private formatLog(entry: LogEntry): string {
    if (this.isDevelopment) {
      // Human-readable format for development
      const contextStr = entry.context ? ` | ${JSON.stringify(entry.context)}` : '';
      const errorStr = entry.error ? ` | ${entry.error.name}: ${entry.error.message}` : '';
      return `[${entry.level.toUpperCase()}] ${entry.message}${contextStr}${errorStr}`;
    } else {
      // JSON format for production (easily parsable by log aggregators)
      return JSON.stringify(entry);
    }
  }

  private log(level: LogLevel, message: string, context?: LogContext, error?: Error): void {
    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date().toISOString(),
      context,
    };

    if (error) {
      entry.error = {
        name: error.name,
        message: error.message,
        stack: error.stack,
      };
    }

    const formatted = this.formatLog(entry);

    switch (level) {
      case 'debug':
        if (this.isDevelopment) console.debug(formatted);
        break;
      case 'info':
        console.info(formatted);
        break;
      case 'warn':
        console.warn(formatted);
        break;
      case 'error':
        console.error(formatted);
        break;
    }
  }

  debug(message: string, context?: LogContext): void {
    this.log('debug', message, context);
  }

  info(message: string, context?: LogContext): void {
    this.log('info', message, context);
  }

  warn(message: string, context?: LogContext): void {
    this.log('warn', message, context);
  }

  error(message: string, contextOrError?: LogContext | Error, error?: Error): void {
    if (contextOrError instanceof Error) {
      this.log('error', message, undefined, contextOrError);
    } else {
      this.log('error', message, contextOrError, error);
    }
  }
}

export const logger = new Logger();
