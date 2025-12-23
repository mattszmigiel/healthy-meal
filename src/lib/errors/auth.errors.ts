/**
 * Custom Authentication Error Classes
 *
 * These error classes provide specific error types for authentication failures
 * that can be mapped to appropriate HTTP responses in API routes.
 */

/**
 * Generic authentication error
 * Used for general auth failures that don't fit other specific categories
 */
export class AuthenticationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AuthenticationError";
  }
}

/**
 * Unauthorized error - Invalid credentials
 * HTTP Status: 401
 * Used when login credentials are invalid
 */
export class UnauthorizedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UnauthorizedError";
  }
}

/**
 * Conflict error - Resource already exists
 * HTTP Status: 409
 * Used when attempting to create a user with an email that already exists
 */
export class ConflictError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ConflictError";
  }
}

/**
 * Rate limit error - Too many requests
 * HTTP Status: 429
 * Used when user has exceeded authentication attempt limits
 */
export class RateLimitError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "RateLimitError";
  }
}

/**
 * Invalid token error - Token is invalid or malformed
 * HTTP Status: 400
 * Used when password reset token is invalid
 */
export class InvalidTokenError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidTokenError";
  }
}

/**
 * Expired token error - Token has expired
 * HTTP Status: 400
 * Used when password reset token has expired
 */
export class ExpiredTokenError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ExpiredTokenError";
  }
}
