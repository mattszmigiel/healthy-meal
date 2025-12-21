// OpenRouter API Service
// Provides a unified interface for interacting with multiple LLM providers through OpenRouter

import type { APIResponse, ChatRequest, ChatResponse, OpenRouterConfig } from "./openrouter.types";
import { OpenRouterError } from "./openrouter.types";
import { validateRequest } from "./openrouter.validation";
import { transformRequest, transformResponse } from "./openrouter.transformation";

// ============================================================================
// Service Class
// ============================================================================

export class OpenRouterService {
  private readonly config: Required<OpenRouterConfig>;
  private readonly headers: Record<string, string>;
  private requestQueue: Promise<unknown>[] = [];
  private readonly maxConcurrentRequests = 5;

  constructor(config: OpenRouterConfig) {
    // Validate required configuration
    if (!config.apiKey) {
      throw new OpenRouterError("API key is required", undefined, "CONFIG_ERROR");
    }

    // Set default values for optional configuration
    this.config = {
      apiKey: config.apiKey,
      baseUrl: config.baseUrl || "https://openrouter.ai/api/v1",
      defaultModel: config.defaultModel || "openai/gpt-4o-mini",
      timeout: config.timeout || 30000,
      maxRetries: config.maxRetries || 3,
      retryDelay: config.retryDelay || 1000,
      appName: config.appName || "",
      siteUrl: config.siteUrl || "",
    };

    // Initialize headers
    this.headers = {
      Authorization: `Bearer ${this.config.apiKey}`,
      "Content-Type": "application/json",
    };

    // Add optional headers for analytics
    if (this.config.siteUrl) {
      this.headers["HTTP-Referer"] = this.config.siteUrl;
    }
    if (this.config.appName) {
      this.headers["X-Title"] = this.config.appName;
    }
  }

  // ============================================================================
  // Error Handling Methods
  // ============================================================================

  private parseError(error: unknown): OpenRouterError {
    // If it's already an OpenRouterError, return it
    if (error instanceof OpenRouterError) {
      return error;
    }

    // Handle network errors
    if (error instanceof Error && error.name === "TypeError" && error.message.includes("fetch")) {
      return new OpenRouterError(
        "Network error: Failed to connect to OpenRouter API",
        undefined,
        "NETWORK_ERROR",
        error
      );
    }

    // Handle Error instances
    if (error instanceof Error) {
      return new OpenRouterError(error.message || "Unknown error occurred", undefined, "UNKNOWN_ERROR", error);
    }

    // Handle unknown error types
    return new OpenRouterError("Unknown error occurred", undefined, "UNKNOWN_ERROR", error);
  }

  private async handleApiError(response: Response): Promise<never> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let body: any = {};

    try {
      body = await response.json();
    } catch {
      // If JSON parsing fails, use empty object
    }

    const errorMessage = body.error?.message || `API request failed with status ${response.status}`;
    const errorType = body.error?.type || "API_ERROR";

    throw new OpenRouterError(errorMessage, response.status, errorType, body.error);
  }

  // ============================================================================
  // Retry Logic
  // ============================================================================

  private isRetryableError(error: OpenRouterError, statusCode?: number): boolean {
    // Network errors are retryable
    if (error.errorType === "NETWORK_ERROR") {
      return true;
    }

    // Retry on rate limiting and server errors
    if (statusCode) {
      return statusCode === 429 || statusCode >= 500;
    }

    return false;
  }

  private async retryWithBackoff<T>(operation: () => Promise<T>, attempt = 0): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      const parsedError = this.parseError(error);

      // Check if we should retry
      const shouldRetry =
        attempt < this.config.maxRetries && this.isRetryableError(parsedError, parsedError.statusCode);

      if (!shouldRetry) {
        throw parsedError;
      }

      // Calculate delay with exponential backoff and jitter
      const exponentialDelay = this.config.retryDelay * Math.pow(2, attempt);
      const jitter = Math.random() * 1000; // Random jitter up to 1 second
      const delay = exponentialDelay + jitter;

      console.warn(
        `[OpenRouter] Retrying request (attempt ${attempt + 1}/${this.config.maxRetries}) after ${Math.round(delay)}ms`
      );

      // Wait before retrying
      await new Promise<void>((resolve) => setTimeout(resolve, delay));

      // Retry the operation
      return this.retryWithBackoff(operation, attempt + 1);
    }
  }

  // ============================================================================
  // HTTP Request Method
  // ============================================================================

  private async makeRequest<T>(endpoint: string, body: Record<string, unknown>): Promise<T> {
    const url = `${this.config.baseUrl}${endpoint}`;

    // Create abort controller for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: this.headers,
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // Handle non-2xx responses
      if (!response.ok) {
        await this.handleApiError(response);
      }

      // Parse JSON response
      const data = await response.json();
      return data as T;
    } catch (error) {
      clearTimeout(timeoutId);

      // Handle timeout
      if (error instanceof Error && error.name === "AbortError") {
        throw new OpenRouterError(`Request timeout after ${this.config.timeout}ms`, undefined, "TIMEOUT_ERROR");
      }

      throw error;
    }
  }

  // ============================================================================
  // Rate Limiting
  // ============================================================================
  //
  // Security: Prevents API abuse by limiting concurrent requests
  // Default: Maximum 5 concurrent requests
  // Configurable via: maxConcurrentRequests property (currently private)

  private async throttleRequest<T>(operation: () => Promise<T>): Promise<T> {
    // Wait if too many concurrent requests
    while (this.requestQueue.length >= this.maxConcurrentRequests) {
      await Promise.race(this.requestQueue);
    }

    const promise = operation();
    this.requestQueue.push(promise);

    promise.finally(() => {
      const index = this.requestQueue.indexOf(promise);
      if (index > -1) {
        this.requestQueue.splice(index, 1);
      }
    });

    return promise;
  }

  // ============================================================================
  // Main Chat Method
  // ============================================================================

  async chat(request: ChatRequest): Promise<ChatResponse> {
    // Validate request
    validateRequest(request, this.config.defaultModel);

    // Transform request
    const apiRequest = transformRequest(request, this.config.defaultModel);

    // Execute with retry logic and throttling
    return this.throttleRequest(() =>
      this.retryWithBackoff(async () => {
        const response = await this.makeRequest<APIResponse>("/chat/completions", apiRequest);
        return transformResponse(response);
      })
    );
  }
}
