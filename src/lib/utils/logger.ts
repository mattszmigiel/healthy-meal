/**
 * Structured logging utility for the application
 * Provides consistent logging format with timestamp, level, context, and message
 */

type LogLevel = "info" | "warn" | "error" | "debug";

interface LogContext {
  user_id?: string;
  recipe_id?: string;
  endpoint?: string;
  duration_ms?: number;
  error_stack?: string;
  [key: string]: string | number | boolean | undefined;
}

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: LogContext;
}

/**
 * Formats a log entry into a structured JSON string
 */
function formatLogEntry(level: LogLevel, message: string, context?: LogContext): string {
  const entry: LogEntry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    ...(context && { context }),
  };

  return JSON.stringify(entry);
}

/**
 * Logs an informational message
 * Use for successful operations and general application flow
 *
 * @param message - The log message
 * @param context - Optional context object with additional information
 *
 * @example
 * logger.info('AI preview generated successfully', {
 *   user_id: 'user-123',
 *   recipe_id: 'recipe-456',
 *   duration_ms: 2500
 * });
 */
function info(message: string, context?: LogContext): void {
  // eslint-disable-next-line no-console
  console.log(formatLogEntry("info", message, context));
}

/**
 * Logs a warning message
 * Use for non-critical issues that should be monitored
 *
 * @param message - The warning message
 * @param context - Optional context object with additional information
 *
 * @example
 * logger.warn('Rate limit approaching', {
 *   user_id: 'user-123',
 *   current_count: 8,
 *   limit: 10
 * });
 */
function warn(message: string, context?: LogContext): void {
  // eslint-disable-next-line no-console
  console.warn(formatLogEntry("warn", message, context));
}

/**
 * Logs an error message
 * Use for errors that require attention and debugging
 *
 * @param message - The error message
 * @param context - Optional context object with additional information
 *
 * @example
 * logger.error('AI service failed', {
 *   user_id: 'user-123',
 *   recipe_id: 'recipe-456',
 *   error_stack: error.stack
 * });
 */
function error(message: string, context?: LogContext): void {
  // eslint-disable-next-line no-console
  console.error(formatLogEntry("error", message, context));
}

/**
 * Logs a debug message
 * Use for detailed debugging information during development
 *
 * @param message - The debug message
 * @param context - Optional context object with additional information
 *
 * @example
 * logger.debug('Fetching recipe from database', {
 *   recipe_id: 'recipe-456',
 *   user_id: 'user-123'
 * });
 */
function debug(message: string, context?: LogContext): void {
  // Only log debug messages in development
  if (import.meta.env.DEV) {
    // eslint-disable-next-line no-console
    console.debug(formatLogEntry("debug", message, context));
  }
}

/**
 * Structured logger instance
 * Provides methods for logging at different levels with consistent formatting
 */
export const logger = {
  info,
  warn,
  error,
  debug,
};

/**
 * Helper function to extract error stack trace
 * Safely extracts stack trace from Error objects
 *
 * @param err - The error object
 * @returns Stack trace string or undefined
 */
export function getErrorStack(err: unknown): string | undefined {
  if (err instanceof Error) {
    return err.stack;
  }
  return undefined;
}

/**
 * Helper function to create log context for API requests
 * Creates a consistent context object for API endpoint logging
 *
 * @param userId - The authenticated user ID
 * @param endpoint - The API endpoint path
 * @param additionalContext - Additional context fields
 * @returns Log context object
 */
export function createAPILogContext(
  userId: string,
  endpoint: string,
  additionalContext?: Partial<LogContext>
): LogContext {
  return {
    user_id: userId,
    endpoint,
    ...additionalContext,
  };
}

/**
 * Helper function to measure and log operation duration
 * Returns a function that logs the duration when called
 *
 * @param operation - The operation name
 * @param context - Optional context object
 * @returns Function to call when operation completes
 *
 * @example
 * const endTimer = logger.startTimer('AI preview generation', { user_id: 'user-123' });
 * // ... perform operation ...
 * endTimer(); // Logs: "AI preview generation completed in 2500ms"
 */
export function startTimer(operation: string, context?: LogContext): () => void {
  const startTime = Date.now();

  return () => {
    const duration = Date.now() - startTime;
    info(`${operation} completed`, {
      ...context,
      duration_ms: duration,
    });
  };
}
