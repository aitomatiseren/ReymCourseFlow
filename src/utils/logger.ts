// Production-safe logging utility
interface LogContext {
  [key: string]: unknown;
}

class Logger {
  private isDevelopment = import.meta.env.NODE_ENV === 'development';

  debug(message: string, context?: LogContext) {
    if (this.isDevelopment) {
      console.log(`🔍 ${message}`, context ? JSON.stringify(context, null, 2) : '');
    }
  }

  info(message: string, context?: LogContext) {
    if (this.isDevelopment) {
      console.info(`ℹ️ ${message}`, context ? JSON.stringify(context, null, 2) : '');
    }
  }

  warn(message: string, context?: LogContext) {
    console.warn(`⚠️ ${message}`, context ? JSON.stringify(context, null, 2) : '');
  }

  error(message: string, error?: unknown, context?: LogContext) {
    console.error(`❌ ${message}`, error, context ? JSON.stringify(context, null, 2) : '');
  }

  ai(message: string, context?: LogContext) {
    if (this.isDevelopment) {
      console.log(`🤖 AI: ${message}`, context ? JSON.stringify(context, null, 2) : '');
    }
  }

  db(message: string, context?: LogContext) {
    if (this.isDevelopment) {
      console.log(`🗄️ DB: ${message}`, context ? JSON.stringify(context, null, 2) : '');
    }
  }

  ui(message: string, context?: LogContext) {
    if (this.isDevelopment) {
      console.log(`🎨 UI: ${message}`, context ? JSON.stringify(context, null, 2) : '');
    }
  }
}

export const logger = new Logger();