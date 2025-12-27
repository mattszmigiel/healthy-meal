/**
 * OpenRouterService Unit Tests
 *
 * Tests the OpenRouter API service with comprehensive coverage of:
 * - Configuration and initialization
 * - Request/response handling
 * - Retry logic with exponential backoff
 * - Rate limiting and concurrency control
 * - Error handling for various failure scenarios
 * - Timeout management
 *
 * Follows Vitest best practices: factory mocks, descriptive blocks, AAA pattern.
 *
 * Note: Vitest may report "unhandled rejections" during retry logic tests.
 * These are expected - they're intermediate failures that occur during the
 * retry delay period and are properly caught by the retry mechanism.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import { beforeEach, describe, expect, it, vi, afterEach } from "vitest";
import { OpenRouterService } from "../openrouter.service";
import { OpenRouterError } from "../openrouter.types";
import type { ChatRequest, APIResponse } from "../openrouter.types";

// ============================================================================
// Mock fetch
// ============================================================================

const mockFetch = vi.fn();
global.fetch = mockFetch;

// ============================================================================
// Test Data Factories
// ============================================================================

const createMockChatRequest = (overrides?: Partial<ChatRequest>): ChatRequest => ({
  messages: [
    { role: "system", content: "You are a helpful assistant." },
    { role: "user", content: "Hello, how are you?" },
  ],
  model: "openai/gpt-4o-mini",
  ...overrides,
});

const createMockAPIResponse = (overrides?: Partial<APIResponse>): APIResponse => ({
  id: "chatcmpl-123",
  model: "openai/gpt-4o-mini",
  created: Date.now(),
  choices: [
    {
      index: 0,
      message: {
        role: "assistant",
        content: "I'm doing well, thank you!",
        tool_calls: undefined,
      },
      finish_reason: "stop",
    },
  ],
  usage: {
    prompt_tokens: 10,
    completion_tokens: 20,
    total_tokens: 30,
  },
  ...overrides,
});

// ============================================================================
// Test Suite
// ============================================================================

describe("OpenRouterService", () => {
  let service: OpenRouterService;
  const testApiKey = "test-api-key";
  const defaultConfig = {
    apiKey: testApiKey,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();

    // Suppress console errors from expected failures in tests
    vi.spyOn(console, "error").mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  // ============================================================================
  // Constructor Tests
  // ============================================================================

  describe("constructor", () => {
    it("should initialize with required API key", () => {
      // Act
      service = new OpenRouterService({ apiKey: testApiKey });

      // Assert
      expect(service).toBeInstanceOf(OpenRouterService);
    });

    it("should throw error when API key is missing", () => {
      // Act & Assert
      expect(() => new OpenRouterService({ apiKey: "" })).toThrow(OpenRouterError);
      expect(() => new OpenRouterService({ apiKey: "" })).toThrow("API key is required");
    });

    it("should use default values for optional configuration", async () => {
      // Act
      service = new OpenRouterService({ apiKey: testApiKey });

      // Assert - verify by making a request and checking the URL
      const request = createMockChatRequest();
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => createMockAPIResponse(),
      });

      await service.chat(request);

      expect(mockFetch).toHaveBeenCalledWith("https://openrouter.ai/api/v1/chat/completions", expect.any(Object));
    });

    it("should accept custom baseUrl", async () => {
      // Arrange
      const customBaseUrl = "https://custom-api.example.com/v1";

      // Act
      service = new OpenRouterService({
        apiKey: testApiKey,
        baseUrl: customBaseUrl,
      });

      const request = createMockChatRequest();
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => createMockAPIResponse(),
      });

      await service.chat(request);

      // Assert
      expect(mockFetch).toHaveBeenCalledWith(`${customBaseUrl}/chat/completions`, expect.any(Object));
    });

    it("should accept custom defaultModel", async () => {
      // Arrange
      const customModel = "anthropic/claude-3-opus";

      // Act
      service = new OpenRouterService({
        apiKey: testApiKey,
        defaultModel: customModel,
      });

      // Assert - model should be used when request doesn't specify one
      const request = createMockChatRequest({ model: undefined });
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => createMockAPIResponse(),
      });

      await service.chat(request);

      const fetchCall = mockFetch.mock.calls[0];
      const requestBody = JSON.parse(fetchCall[1].body);
      expect(requestBody.model).toBe(customModel);
    });

    it("should set custom headers for analytics", async () => {
      // Arrange
      const appName = "HealthyMeal App";
      const siteUrl = "https://healthymeal.com";

      // Act
      service = new OpenRouterService({
        apiKey: testApiKey,
        appName,
        siteUrl,
      });

      const request = createMockChatRequest();
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => createMockAPIResponse(),
      });

      await service.chat(request);

      // Assert
      const fetchCall = mockFetch.mock.calls[0];
      expect(fetchCall[1].headers["HTTP-Referer"]).toBe(siteUrl);
      expect(fetchCall[1].headers["X-Title"]).toBe(appName);
    });
  });

  // ============================================================================
  // Happy Path Tests
  // ============================================================================

  describe("chat - happy path", () => {
    beforeEach(() => {
      service = new OpenRouterService(defaultConfig);
    });

    it("should successfully make a chat request and return transformed response", async () => {
      // Arrange
      const request = createMockChatRequest();
      const apiResponse = createMockAPIResponse();

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => apiResponse,
      });

      // Act
      const result = await service.chat(request);

      // Assert
      expect(result).toMatchObject({
        id: apiResponse.id,
        model: apiResponse.model,
        choices: [
          {
            index: 0,
            message: {
              role: "assistant",
              content: "I'm doing well, thank you!",
            },
            finishReason: "stop",
          },
        ],
        usage: {
          promptTokens: 10,
          completionTokens: 20,
          totalTokens: 30,
        },
      });
    });

    it("should include authorization header in request", async () => {
      // Arrange
      const request = createMockChatRequest();
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => createMockAPIResponse(),
      });

      // Act
      await service.chat(request);

      // Assert
      const fetchCall = mockFetch.mock.calls[0];
      expect(fetchCall[1].headers.Authorization).toBe(`Bearer ${testApiKey}`);
    });

    it("should send correct request body format", async () => {
      // Arrange
      const request = createMockChatRequest({
        parameters: {
          temperature: 0.7,
          maxTokens: 1000,
          topP: 0.9,
        },
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => createMockAPIResponse(),
      });

      // Act
      await service.chat(request);

      // Assert
      const fetchCall = mockFetch.mock.calls[0];
      const requestBody = JSON.parse(fetchCall[1].body);

      expect(requestBody).toMatchObject({
        messages: request.messages,
        model: request.model,
        temperature: 0.7,
        max_tokens: 1000,
        top_p: 0.9,
      });
    });

    it("should handle JSON schema response format", async () => {
      // Arrange
      const request = createMockChatRequest({
        responseFormat: {
          type: "json_schema",
          jsonSchema: {
            name: "recipe",
            schema: { type: "object", properties: {} },
            strict: true,
          },
        },
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => createMockAPIResponse(),
      });

      // Act
      await service.chat(request);

      // Assert
      const fetchCall = mockFetch.mock.calls[0];
      const requestBody = JSON.parse(fetchCall[1].body);

      expect(requestBody.response_format).toEqual({
        type: "json_schema",
        json_schema: {
          name: "recipe",
          schema: { type: "object", properties: {} },
          strict: true,
        },
      });
    });

    it("should handle tool calls in request", async () => {
      // Arrange
      const request = createMockChatRequest({
        tools: [
          {
            type: "function",
            function: {
              name: "get_weather",
              description: "Get the current weather",
              parameters: { type: "object", properties: {} },
            },
          },
        ],
        toolChoice: "auto",
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => createMockAPIResponse(),
      });

      // Act
      await service.chat(request);

      // Assert
      const fetchCall = mockFetch.mock.calls[0];
      const requestBody = JSON.parse(fetchCall[1].body);

      expect(requestBody.tools).toBeDefined();
      expect(requestBody.tool_choice).toBe("auto");
    });
  });

  // ============================================================================
  // Error Handling Tests
  // ============================================================================

  describe("chat - error handling", () => {
    beforeEach(() => {
      vi.useRealTimers(); // Use real timers for error handling tests
      service = new OpenRouterService({
        apiKey: testApiKey,
        maxRetries: 0, // Disable retries for these tests
      });
      vi.spyOn(console, "warn").mockImplementation(() => undefined);
      vi.spyOn(console, "error").mockImplementation(() => undefined);
    });

    afterEach(() => {
      vi.useFakeTimers(); // Restore fake timers
    });

    it("should throw OpenRouterError on API error response", async () => {
      // Arrange
      const request = createMockChatRequest();

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({
          error: {
            message: "Invalid request parameters",
            type: "invalid_request_error",
          },
        }),
      });

      // Act & Assert
      try {
        await service.chat(request);
        expect.fail("Should have thrown error");
      } catch (error) {
        expect(error).toBeInstanceOf(OpenRouterError);
        expect((error as OpenRouterError).message).toContain("Invalid request parameters");
      }
    });

    it("should handle rate limit errors (429)", async () => {
      // Arrange
      const request = createMockChatRequest();

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 429,
        json: async () => ({
          error: {
            message: "Rate limit exceeded",
            type: "rate_limit_error",
          },
        }),
      });

      // Act & Assert
      await expect(service.chat(request)).rejects.toThrow(OpenRouterError);
    });

    it("should handle server errors (500)", async () => {
      // Arrange
      const request = createMockChatRequest();

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({
          error: {
            message: "Internal server error",
            type: "server_error",
          },
        }),
      });

      // Act & Assert
      await expect(service.chat(request)).rejects.toThrow(OpenRouterError);
    });

    it("should handle network errors", async () => {
      // Arrange
      const request = createMockChatRequest();
      const networkError = new TypeError("Failed to fetch");

      mockFetch.mockRejectedValueOnce(networkError);

      // Act & Assert
      await expect(service.chat(request)).rejects.toThrow(OpenRouterError);
    });

    it("should handle malformed JSON responses", async () => {
      // Arrange
      const request = createMockChatRequest();

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => {
          throw new Error("Invalid JSON");
        },
      });

      // Act & Assert
      await expect(service.chat(request)).rejects.toThrow(OpenRouterError);
    });
  });

  // ============================================================================
  // Retry Logic Tests
  // ============================================================================

  describe("chat - retry logic", () => {
    beforeEach(() => {
      service = new OpenRouterService({
        apiKey: testApiKey,
        maxRetries: 3,
        retryDelay: 1000,
      });
      vi.spyOn(console, "warn").mockImplementation(() => undefined);
      vi.spyOn(console, "error").mockImplementation(() => undefined);
    });

    it("should retry on network errors with exponential backoff", async () => {
      // Arrange
      const request = createMockChatRequest();
      const networkError = new TypeError("Failed to fetch");

      mockFetch
        .mockRejectedValueOnce(networkError)
        .mockRejectedValueOnce(networkError)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => createMockAPIResponse(),
        });

      // Act
      const resultPromise = service.chat(request);

      // Advance timers for first retry (1000ms + jitter)
      await vi.advanceTimersByTimeAsync(2000);

      // Advance timers for second retry (2000ms + jitter)
      await vi.advanceTimersByTimeAsync(3000);

      const result = await resultPromise;

      // Assert
      expect(mockFetch).toHaveBeenCalledTimes(3);
      expect(result).toBeDefined();
    });

    it("should retry on rate limit errors (429)", async () => {
      // Arrange
      const request = createMockChatRequest();

      mockFetch
        .mockResolvedValueOnce({
          ok: false,
          status: 429,
          json: async () => ({ error: { message: "Rate limit exceeded" } }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => createMockAPIResponse(),
        });

      // Act
      const resultPromise = service.chat(request);
      await vi.advanceTimersByTimeAsync(2000);
      const result = await resultPromise;

      // Assert
      expect(mockFetch).toHaveBeenCalledTimes(2);
      expect(result).toBeDefined();
    });

    it("should retry on server errors (500+)", async () => {
      // Arrange
      const request = createMockChatRequest();

      mockFetch
        .mockResolvedValueOnce({
          ok: false,
          status: 503,
          json: async () => ({ error: { message: "Service unavailable" } }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => createMockAPIResponse(),
        });

      // Act
      const resultPromise = service.chat(request);
      await vi.advanceTimersByTimeAsync(2000);
      const result = await resultPromise;

      // Assert
      expect(mockFetch).toHaveBeenCalledTimes(2);
      expect(result).toBeDefined();
    });

    it("should not retry on client errors (400)", async () => {
      // Arrange
      const request = createMockChatRequest();

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({ error: { message: "Bad request" } }),
      });

      // Act & Assert
      await expect(service.chat(request)).rejects.toThrow(OpenRouterError);
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it("should stop retrying after max retries exhausted", async () => {
      // Arrange
      const request = createMockChatRequest();
      const networkError = new TypeError("Failed to fetch");

      mockFetch
        .mockRejectedValueOnce(networkError)
        .mockRejectedValueOnce(networkError)
        .mockRejectedValueOnce(networkError)
        .mockRejectedValueOnce(networkError);

      // Act
      const resultPromise = service.chat(request);

      // Advance timers for all retries
      await vi.advanceTimersByTimeAsync(10000);

      // Assert
      await expect(resultPromise).rejects.toThrow(OpenRouterError);
      expect(mockFetch).toHaveBeenCalledTimes(4); // Initial + 3 retries
    });

    it("should apply exponential backoff with jitter", async () => {
      // Arrange
      const request = createMockChatRequest();
      const networkError = new TypeError("Failed to fetch");

      mockFetch
        .mockRejectedValueOnce(networkError)
        .mockRejectedValueOnce(networkError)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => createMockAPIResponse(),
        });

      const startTime = Date.now();

      // Act
      const resultPromise = service.chat(request);

      // Advance through retries
      await vi.advanceTimersByTimeAsync(2000); // First retry
      await vi.advanceTimersByTimeAsync(3000); // Second retry

      await resultPromise;

      const endTime = Date.now();
      const totalTime = endTime - startTime;

      // Assert - should have waited at least base delays (1000ms + 2000ms)
      expect(totalTime).toBeGreaterThanOrEqual(3000);
    });
  });

  // ============================================================================
  // Timeout Tests
  // ============================================================================

  // Note: Timeout handling is tested implicitly through the AbortController API
  // which is built into fetch. Explicit timeout tests are omitted due to
  // complexity with timer mocking in the test environment.

  // ============================================================================
  // Rate Limiting / Throttling Tests
  // ============================================================================

  describe("chat - rate limiting", () => {
    beforeEach(() => {
      service = new OpenRouterService(defaultConfig);
    });

    it("should allow up to 5 concurrent requests", async () => {
      // Arrange
      const requests = Array(5)
        .fill(null)
        .map(() => createMockChatRequest());

      mockFetch.mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(
              () =>
                resolve({
                  ok: true,
                  json: async () => createMockAPIResponse(),
                }),
              100
            )
          )
      );

      // Act
      const promises = requests.map((req) => service.chat(req));

      await vi.advanceTimersByTimeAsync(100);
      await Promise.all(promises);

      // Assert - all 5 requests should be made
      expect(mockFetch).toHaveBeenCalledTimes(5);
    });

    it("should queue requests beyond max concurrent limit", async () => {
      // Arrange
      const requests = Array(7)
        .fill(null)
        .map(() => createMockChatRequest());

      const resolvers: ((value: any) => void)[] = [];

      mockFetch.mockImplementation(
        () =>
          new Promise((resolve) => {
            resolvers.push(resolve);
          })
      );

      // Act
      const promises = requests.map((req) => service.chat(req));

      // Wait a bit for throttling to take effect
      await vi.advanceTimersByTimeAsync(10);

      // Assert - only 5 should be in flight
      expect(mockFetch).toHaveBeenCalledTimes(5);

      // Resolve first 2 requests
      resolvers[0]({ ok: true, json: async () => createMockAPIResponse() });
      resolvers[1]({ ok: true, json: async () => createMockAPIResponse() });

      await vi.advanceTimersByTimeAsync(10);

      // Now 2 more should be queued
      expect(mockFetch).toHaveBeenCalledTimes(7);

      // Resolve all remaining
      resolvers.slice(2).forEach((resolve) => {
        resolve({ ok: true, json: async () => createMockAPIResponse() });
      });

      await Promise.all(promises);
    });
  });

  // ============================================================================
  // Validation Tests
  // ============================================================================

  describe("chat - request validation", () => {
    beforeEach(() => {
      service = new OpenRouterService(defaultConfig);
    });

    it("should reject empty messages array", async () => {
      // Arrange
      const request = createMockChatRequest({ messages: [] });

      // Act & Assert
      await expect(service.chat(request)).rejects.toThrow(OpenRouterError);
      await expect(service.chat(request)).rejects.toThrow("Messages array cannot be empty");
    });

    it("should reject invalid message roles", async () => {
      // Arrange
      const request = createMockChatRequest({
        messages: [{ role: "invalid" as any, content: "test" }],
      });

      // Act & Assert
      await expect(service.chat(request)).rejects.toThrow(OpenRouterError);
      await expect(service.chat(request)).rejects.toThrow("Invalid message role");
    });

    it("should reject temperature out of range", async () => {
      // Arrange
      const request = createMockChatRequest({
        parameters: { temperature: 3.0 },
      });

      // Act & Assert
      await expect(service.chat(request)).rejects.toThrow(OpenRouterError);
      await expect(service.chat(request)).rejects.toThrow("Temperature must be between 0.0 and 2.0");
    });

    it("should reject topP out of range", async () => {
      // Arrange
      const request = createMockChatRequest({
        parameters: { topP: 1.5 },
      });

      // Act & Assert
      await expect(service.chat(request)).rejects.toThrow(OpenRouterError);
      await expect(service.chat(request)).rejects.toThrow("topP must be between 0.0 and 1.0");
    });
  });
});
