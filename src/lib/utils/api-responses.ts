import type { APIErrorResponse, NoPreferencesErrorResponse, RateLimitErrorResponse } from "@/types";
import {
  AuthenticationError,
  ConflictError,
  ExpiredTokenError,
  InvalidTokenError,
  RateLimitError,
  UnauthorizedError,
} from "@/lib/errors/auth.errors";

/**
 * Generic error response helper
 * Creates a JSON Response with the specified status code and error details
 *
 * @param status - HTTP status code
 * @param error - Error type identifier
 * @param message - Human-readable error message
 * @param additionalFields - Additional fields to include in the response
 * @returns JSON Response with error details
 */
export function errorResponse(
  status: number,
  error: string,
  message: string,
  additionalFields?: Record<string, unknown>
): Response {
  const body: APIErrorResponse & Record<string, unknown> = {
    error,
    message,
    ...additionalFields,
  };

  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
    },
  });
}

/**
 * 400 Bad Request - No dietary preferences set
 * Returns a specific error when user hasn't configured dietary preferences
 *
 * @returns 400 Response with guidance to set preferences
 */
export function noPreferencesResponse(): Response {
  const body: NoPreferencesErrorResponse = {
    error: "No dietary preferences",
    message: "Please set your dietary preferences before modifying recipes.",
    action: "Navigate to profile settings to add dietary preferences",
  };

  return new Response(JSON.stringify(body), {
    status: 400,
    headers: {
      "Content-Type": "application/json",
    },
  });
}

/**
 * 429 Too Many Requests - Rate limit exceeded
 * Returns an error when user exceeds the rate limit
 *
 * @param retryAfter - Seconds until next request is allowed
 * @returns 429 Response with retry information
 */
export function rateLimitResponse(retryAfter: number): Response {
  const body: RateLimitErrorResponse = {
    error: "Rate limit exceeded",
    message: "You've made too many AI modification requests. Please wait before trying again.",
    retry_after: retryAfter,
  };

  return new Response(JSON.stringify(body), {
    status: 429,
    headers: {
      "Content-Type": "application/json",
      "Retry-After": retryAfter.toString(),
    },
  });
}

/**
 * 404 Not Found - Resource not found or unauthorized
 * Generic 404 response that doesn't reveal whether resource exists
 *
 * @returns 404 Response
 */
export function notFoundResponse(): Response {
  return errorResponse(404, "Not found", "Recipe not found or you don't have access to it");
}

/**
 * 401 Unauthorized - Authentication required
 * Returns when user is not authenticated
 *
 * @returns 401 Response
 */
export function unauthorizedResponse(): Response {
  return errorResponse(401, "Unauthorized", "Authentication required");
}

/**
 * 503 Service Unavailable - AI service is unavailable
 * Returns when the AI service is temporarily down
 *
 * @returns 503 Response
 */
export function serviceUnavailableResponse(): Response {
  return errorResponse(
    503,
    "AI service unavailable",
    "The AI service is temporarily unavailable. Please try again later."
  );
}

/**
 * 504 Gateway Timeout - AI service timeout
 * Returns when AI service takes too long to respond
 *
 * @returns 504 Response
 */
export function timeoutResponse(): Response {
  return errorResponse(504, "Request timeout", "The AI modification took too long. Please try again.");
}

/**
 * 500 Internal Server Error - Unexpected server error
 * Generic error for unexpected failures
 *
 * @param message - Optional custom error message
 * @returns 500 Response
 */
export function internalServerErrorResponse(message?: string): Response {
  return errorResponse(500, "Internal server error", message ?? "An unexpected error occurred. Please try again.");
}

/**
 * 400 Bad Request - Invalid input
 * Generic validation error response
 *
 * @param message - Validation error message
 * @param details - Optional array of specific validation errors
 * @returns 400 Response
 */
export function validationErrorResponse(message: string, details?: string[]): Response {
  return errorResponse(400, "Invalid input", message, details ? { details } : undefined);
}

/**
 * Handle authentication errors
 * Maps custom auth error classes to appropriate HTTP responses
 *
 * @param error - Error object (custom auth error or unknown error)
 * @returns Response with appropriate status code and message
 */
export function handleAuthError(error: unknown): Response {
  // Handle custom authentication error classes
  if (error instanceof UnauthorizedError) {
    // 401 - Invalid credentials
    return errorResponse(401, "Unauthorized", error.message);
  }

  if (error instanceof ConflictError) {
    // 409 - Email already exists
    return errorResponse(409, "Conflict", error.message);
  }

  if (error instanceof RateLimitError) {
    // 429 - Too many authentication attempts
    return rateLimitResponse(60); // Default retry after 60 seconds
  }

  if (error instanceof InvalidTokenError || error instanceof ExpiredTokenError) {
    // 400 - Invalid or expired password reset token
    // Generic message for security (don't differentiate between invalid/expired)
    return errorResponse(400, "Invalid token", "This reset link is invalid or has expired");
  }

  if (error instanceof AuthenticationError) {
    // 400 - Generic auth error
    return errorResponse(400, "Authentication error", error.message);
  }

  // Handle unknown errors
  if (error instanceof Error) {
    return internalServerErrorResponse(error.message);
  }

  // Fallback for completely unknown errors
  return internalServerErrorResponse("An unexpected error occurred during authentication");
}
