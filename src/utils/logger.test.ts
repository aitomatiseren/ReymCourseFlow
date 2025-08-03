import { describe, it, expect, vi, beforeEach } from 'vitest';
import { logger } from './logger';

// Mock console methods
const mockConsole = {
  log: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
};

vi.stubGlobal('console', mockConsole);

describe('Logger', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset import.meta.env for each test
    vi.stubEnv('NODE_ENV', 'development');
  });

  describe('in development mode', () => {
    it('should log debug messages', () => {
      logger.debug('Test debug message');
      expect(mockConsole.log).toHaveBeenCalledWith('🔍 Test debug message', '');
    });

    it('should log debug messages with context', () => {
      const context = { userId: '123', action: 'test' };
      logger.debug('Test debug message', context);
      expect(mockConsole.log).toHaveBeenCalledWith(
        '🔍 Test debug message', 
        JSON.stringify(context, null, 2)
      );
    });

    it('should log info messages', () => {
      logger.info('Test info message');
      expect(mockConsole.info).toHaveBeenCalledWith('ℹ️ Test info message', '');
    });

    it('should log AI messages', () => {
      logger.ai('AI processing');
      expect(mockConsole.log).toHaveBeenCalledWith('🤖 AI: AI processing', '');
    });

    it('should log database messages', () => {
      logger.db('Database query');
      expect(mockConsole.log).toHaveBeenCalledWith('🗄️ DB: Database query', '');
    });

    it('should log UI messages', () => {
      logger.ui('UI update');
      expect(mockConsole.log).toHaveBeenCalledWith('🎨 UI: UI update', '');
    });
  });

  describe('in production mode', () => {
    beforeEach(() => {
      vi.stubEnv('NODE_ENV', 'production');
    });

    it('should not log debug messages', () => {
      logger.debug('Test debug message');
      expect(mockConsole.log).not.toHaveBeenCalled();
    });

    it('should not log info messages', () => {
      logger.info('Test info message');
      expect(mockConsole.info).not.toHaveBeenCalled();
    });

    it('should not log AI messages', () => {
      logger.ai('AI processing');
      expect(mockConsole.log).not.toHaveBeenCalled();
    });
  });

  describe('warning and error messages', () => {
    it('should always log warning messages', () => {
      logger.warn('Test warning');
      expect(mockConsole.warn).toHaveBeenCalledWith('⚠️ Test warning', '');
    });

    it('should always log error messages', () => {
      const error = new Error('Test error');
      logger.error('Error occurred', error);
      expect(mockConsole.error).toHaveBeenCalledWith('❌ Error occurred', error, '');
    });

    it('should log error messages with context', () => {
      const error = new Error('Test error');
      const context = { component: 'TestComponent' };
      logger.error('Error occurred', error, context);
      expect(mockConsole.error).toHaveBeenCalledWith(
        '❌ Error occurred', 
        error, 
        JSON.stringify(context, null, 2)
      );
    });
  });
});