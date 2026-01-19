import * as Sentry from '@sentry/react-native';
import { Platform } from 'react-native';
import { consoleTransport, logger as rnLogger } from 'react-native-logs';

import type { LogEntry, Logger, LogLevel } from './types';

const config = {
  levels: {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3,
  },
  severity: __DEV__ ? 'debug' : 'warn',
  transport: consoleTransport,
  transportOptions: {
    colors: {
      debug: 'gray',
      info: 'blueBright',
      warn: 'yellowBright',
      error: 'redBright',
    },
  },
  async: true,
  dateFormat: 'time',
  printLevel: true,
  printDate: true,
  fixedExtLvlLength: false,
  enabled: true,
};

/**
 * Maps log levels to Sentry severity levels
 */
const sentryLevelMap: Record<LogLevel, Sentry.SeverityLevel> = {
  debug: 'debug',
  info: 'info',
  warn: 'warning',
  error: 'error',
};

class LogService {
  private static instance: LogService;
  private logger: any;
  private globalContext: Record<string, unknown> = {};
  private sentryEnabled: boolean = true;

  private constructor() {
    this.logger = rnLogger.createLogger(config as any);
  }

  public static getInstance(): LogService {
    if (!LogService.instance) {
      LogService.instance = new LogService();
    }
    return LogService.instance;
  }

  /**
   * Enable or disable Sentry integration for logging
   */
  public setSentryEnabled(enabled: boolean): void {
    this.sentryEnabled = enabled;
  }

  /**
   * Add a breadcrumb to Sentry for tracking user actions and app state
   */
  private addSentryBreadcrumb(level: LogLevel, message: string, context: Record<string, unknown>): void {
    if (!this.sentryEnabled) return;

    try {
      Sentry.addBreadcrumb({
        category: 'log',
        message,
        level: sentryLevelMap[level],
        data: {
          ...this.globalContext,
          ...context,
          platform: Platform.OS,
        },
      });
    } catch (e) {
      // Silently fail - don't want Sentry errors to break logging
      if (__DEV__) {
        console.warn('Failed to add Sentry breadcrumb:', e);
      }
    }
  }

  /**
   * Capture an error in Sentry with additional context
   */
  private captureErrorInSentry(message: string, context: Record<string, unknown>): void {
    if (!this.sentryEnabled) return;

    try {
      Sentry.withScope((scope) => {
        // Set additional context
        scope.setExtras({
          ...this.globalContext,
          ...context,
          platform: Platform.OS,
        });

        // If context contains an error object, capture it
        const errorObj = context.error;
        if (errorObj instanceof Error) {
          Sentry.captureException(errorObj);
        } else if (typeof errorObj === 'string') {
          // Create an error from the string message
          Sentry.captureException(new Error(`${message}: ${errorObj}`));
        } else {
          // Capture as a message with error level
          Sentry.captureMessage(message, 'error');
        }
      });
    } catch (e) {
      // Silently fail - don't want Sentry errors to break logging
      if (__DEV__) {
        console.warn('Failed to capture error in Sentry:', e);
      }
    }
  }

  private log(level: LogLevel, { message, context = {} }: LogEntry): void {
    this.logger[level](message, {
      ...this.globalContext,
      ...context,
      timestamp: new Date().toISOString(),
    });

    // Add breadcrumb to Sentry for all log levels
    this.addSentryBreadcrumb(level, message, context);
  }

  public setGlobalContext(context: Record<string, unknown>): void {
    this.globalContext = { ...this.globalContext, ...context };

    // Also set this context in Sentry
    if (this.sentryEnabled) {
      try {
        Sentry.setContext('app_context', this.globalContext);
      } catch (e) {
        // Silently fail
      }
    }
  }

  public clearGlobalContext(): void {
    this.globalContext = {};
  }

  public debug(entry: LogEntry): void {
    this.log('debug', entry);
  }

  public info(entry: LogEntry): void {
    this.log('info', entry);
  }

  public warn(entry: LogEntry): void {
    this.log('warn', entry);
  }

  public error(entry: LogEntry): void {
    this.log('error', entry);

    // Capture errors in Sentry (in addition to breadcrumb)
    this.captureErrorInSentry(entry.message, entry.context || {});
  }

  /**
   * Capture an exception directly in Sentry
   * Use this when you have an actual Error object to report
   */
  public captureException(error: Error, context?: Record<string, unknown>): void {
    this.error({
      message: error.message,
      context: {
        ...context,
        error,
        stack: error.stack,
      },
    });
  }

  /**
   * Set user information for Sentry tracking
   */
  public setUser(user: { id?: string; email?: string; username?: string } | null): void {
    if (this.sentryEnabled) {
      try {
        Sentry.setUser(user);
      } catch (e) {
        // Silently fail
      }
    }
  }
}

// Export singleton instance
export const logger = LogService.getInstance();

// React hook for component usage
export const useLogger = (): Logger => {
  return {
    debug: (entry: LogEntry) => logger.debug(entry),
    info: (entry: LogEntry) => logger.info(entry),
    warn: (entry: LogEntry) => logger.warn(entry),
    error: (entry: LogEntry) => logger.error(entry),
  };
};
