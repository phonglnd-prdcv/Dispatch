/**
 * Tests for logging service with Sentry integration
 */

// Mock Sentry before importing logging
jest.mock('@sentry/react-native', () => ({
  addBreadcrumb: jest.fn(),
  captureException: jest.fn(),
  captureMessage: jest.fn(),
  setContext: jest.fn(),
  setUser: jest.fn(),
  withScope: jest.fn((callback) => {
    const mockScope = {
      setExtras: jest.fn(),
    };
    callback(mockScope);
  }),
}));

// Mock react-native-logs
jest.mock('react-native-logs', () => ({
  consoleTransport: jest.fn(),
  logger: {
    createLogger: () => ({
      debug: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
    }),
  },
}));

import * as Sentry from '@sentry/react-native';
import { logger } from '../logging';

describe('LogService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('basic logging', () => {
    it('should log debug messages', () => {
      logger.debug({ message: 'Debug message', context: { key: 'value' } });
      // Verify breadcrumb was added to Sentry
      expect(Sentry.addBreadcrumb).toHaveBeenCalledWith(
        expect.objectContaining({
          category: 'log',
          message: 'Debug message',
          level: 'debug',
        })
      );
    });

    it('should log info messages', () => {
      logger.info({ message: 'Info message', context: { key: 'value' } });
      expect(Sentry.addBreadcrumb).toHaveBeenCalledWith(
        expect.objectContaining({
          category: 'log',
          message: 'Info message',
          level: 'info',
        })
      );
    });

    it('should log warn messages', () => {
      logger.warn({ message: 'Warning message' });
      expect(Sentry.addBreadcrumb).toHaveBeenCalledWith(
        expect.objectContaining({
          category: 'log',
          message: 'Warning message',
          level: 'warning',
        })
      );
    });

    it('should log error messages and capture in Sentry', () => {
      logger.error({ message: 'Error message', context: { error: 'some error' } });

      // Verify breadcrumb was added
      expect(Sentry.addBreadcrumb).toHaveBeenCalledWith(
        expect.objectContaining({
          category: 'log',
          message: 'Error message',
          level: 'error',
        })
      );

      // Verify error was captured in Sentry
      expect(Sentry.withScope).toHaveBeenCalled();
    });
  });

  describe('error capturing', () => {
    it('should capture Error objects in Sentry', () => {
      const error = new Error('Test error');
      logger.error({ message: 'An error occurred', context: { error } });

      expect(Sentry.withScope).toHaveBeenCalled();
      expect(Sentry.captureException).toHaveBeenCalledWith(error);
    });

    it('should capture string errors as new Error in Sentry', () => {
      logger.error({ message: 'An error occurred', context: { error: 'string error' } });

      expect(Sentry.withScope).toHaveBeenCalled();
      expect(Sentry.captureException).toHaveBeenCalled();
    });

    it('should capture errors without error context as message', () => {
      logger.error({ message: 'An error without context' });

      expect(Sentry.withScope).toHaveBeenCalled();
      expect(Sentry.captureMessage).toHaveBeenCalledWith('An error without context', 'error');
    });
  });

  describe('captureException', () => {
    it('should capture exceptions directly', () => {
      const error = new Error('Direct exception');
      logger.captureException(error, { userId: '123' });

      expect(Sentry.captureException).toHaveBeenCalledWith(error);
    });
  });

  describe('context management', () => {
    it('should set global context', () => {
      logger.setGlobalContext({ userId: '123', environment: 'test' });
      expect(Sentry.setContext).toHaveBeenCalledWith('app_context', expect.objectContaining({ userId: '123' }));
    });
  });

  describe('user management', () => {
    it('should set user in Sentry', () => {
      logger.setUser({ id: '123', email: 'test@example.com' });
      expect(Sentry.setUser).toHaveBeenCalledWith({ id: '123', email: 'test@example.com' });
    });

    it('should clear user in Sentry', () => {
      logger.setUser(null);
      expect(Sentry.setUser).toHaveBeenCalledWith(null);
    });
  });

  describe('Sentry toggle', () => {
    it('should allow disabling Sentry integration', () => {
      logger.setSentryEnabled(false);
      logger.error({ message: 'This should not go to Sentry' });

      // Should not have called Sentry methods after disabling
      // Note: The first call might have happened before disabling
      const callsAfterDisable = (Sentry.addBreadcrumb as jest.Mock).mock.calls.filter(
        (call) => call[0]?.message === 'This should not go to Sentry'
      );
      expect(callsAfterDisable.length).toBe(0);
    });
  });
});
