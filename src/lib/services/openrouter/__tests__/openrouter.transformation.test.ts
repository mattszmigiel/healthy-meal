/**
 * OpenRouter Transformation Unit Tests
 *
 * Tests request/response transformation functions with comprehensive coverage of:
 * - Request transformation (camelCase to snake_case)
 * - Response transformation (snake_case to camelCase)
 * - Parameter mapping and format conversion
 * - Response validation and error handling
 * - Edge cases (null values, missing fields, arrays)
 *
 * Follows Vitest best practices: factory mocks, descriptive blocks, AAA pattern.
 */

import { describe, expect, it } from "vitest";
import { transformRequest, transformResponse } from "../openrouter.transformation";
import { OpenRouterError } from "../openrouter.types";
import type { ChatRequest, APIResponse, Message } from "../openrouter.types";

// ============================================================================
// Test Data Factories
// ============================================================================

const createMockMessages = (): Message[] => [
  { role: "system", content: "You are a helpful assistant." },
  { role: "user", content: "Hello!" },
];

const createMockChatRequest = (overrides?: Partial<ChatRequest>): ChatRequest => ({
  messages: createMockMessages(),
  model: "openai/gpt-4o-mini",
  ...overrides,
});

const createMockAPIResponse = (overrides?: Partial<APIResponse>): APIResponse => ({
  id: "chatcmpl-123",
  model: "openai/gpt-4o-mini",
  created: 1234567890,
  choices: [
    {
      index: 0,
      message: {
        role: "assistant",
        content: "Hello! How can I help you?",
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

describe("OpenRouter Transformation", () => {
  // ============================================================================
  // transformRequest - Basic Transformation
  // ============================================================================

  describe("transformRequest - basic transformation", () => {
    it("should transform basic chat request", () => {
      // Arrange
      const request = createMockChatRequest();

      // Act
      const result = transformRequest(request, "openai/gpt-4o-mini");

      // Assert
      expect(result).toEqual({
        messages: request.messages,
        model: "openai/gpt-4o-mini",
      });
    });

    it("should use request model over default model", () => {
      // Arrange
      const request = createMockChatRequest({
        model: "anthropic/claude-3-opus",
      });

      // Act
      const result = transformRequest(request, "openai/gpt-4o-mini");

      // Assert
      expect(result.model).toBe("anthropic/claude-3-opus");
    });

    it("should use default model when request model is not specified", () => {
      // Arrange
      const request = createMockChatRequest({
        model: undefined,
      });

      // Act
      const result = transformRequest(request, "openai/gpt-4o-mini");

      // Assert
      expect(result.model).toBe("openai/gpt-4o-mini");
    });

    it("should preserve messages array", () => {
      // Arrange
      const messages = [
        { role: "system" as const, content: "System message" },
        { role: "user" as const, content: "User message" },
        { role: "assistant" as const, content: "Assistant message" },
      ];
      const request = createMockChatRequest({ messages });

      // Act
      const result = transformRequest(request, "openai/gpt-4o-mini");

      // Assert
      expect(result.messages).toEqual(messages);
    });
  });

  // ============================================================================
  // transformRequest - Parameters Transformation
  // ============================================================================

  describe("transformRequest - parameters transformation", () => {
    it("should transform camelCase parameters to snake_case", () => {
      // Arrange
      const request = createMockChatRequest({
        parameters: {
          temperature: 0.7,
          maxTokens: 1000,
          topP: 0.9,
          frequencyPenalty: 0.5,
          presencePenalty: 0.3,
        },
      });

      // Act
      const result = transformRequest(request, "openai/gpt-4o-mini");

      // Assert
      expect(result).toMatchObject({
        temperature: 0.7,
        max_tokens: 1000,
        top_p: 0.9,
        frequency_penalty: 0.5,
        presence_penalty: 0.3,
      });
    });

    it("should include temperature parameter", () => {
      // Arrange
      const request = createMockChatRequest({
        parameters: { temperature: 0.8 },
      });

      // Act
      const result = transformRequest(request, "openai/gpt-4o-mini");

      // Assert
      expect(result.temperature).toBe(0.8);
    });

    it("should include maxTokens as max_tokens", () => {
      // Arrange
      const request = createMockChatRequest({
        parameters: { maxTokens: 2000 },
      });

      // Act
      const result = transformRequest(request, "openai/gpt-4o-mini");

      // Assert
      expect(result.max_tokens).toBe(2000);
    });

    it("should include topP as top_p", () => {
      // Arrange
      const request = createMockChatRequest({
        parameters: { topP: 0.95 },
      });

      // Act
      const result = transformRequest(request, "openai/gpt-4o-mini");

      // Assert
      expect(result.top_p).toBe(0.95);
    });

    it("should include frequencyPenalty as frequency_penalty", () => {
      // Arrange
      const request = createMockChatRequest({
        parameters: { frequencyPenalty: 0.6 },
      });

      // Act
      const result = transformRequest(request, "openai/gpt-4o-mini");

      // Assert
      expect(result.frequency_penalty).toBe(0.6);
    });

    it("should include presencePenalty as presence_penalty", () => {
      // Arrange
      const request = createMockChatRequest({
        parameters: { presencePenalty: 0.4 },
      });

      // Act
      const result = transformRequest(request, "openai/gpt-4o-mini");

      // Assert
      expect(result.presence_penalty).toBe(0.4);
    });

    it("should include stop sequences", () => {
      // Arrange - test with string
      const request1 = createMockChatRequest({
        parameters: { stop: "STOP" },
      });

      // Act
      const result1 = transformRequest(request1, "openai/gpt-4o-mini");

      // Assert
      expect(result1.stop).toBe("STOP");

      // Arrange - test with array
      const request2 = createMockChatRequest({
        parameters: { stop: ["STOP", "END"] },
      });

      // Act
      const result2 = transformRequest(request2, "openai/gpt-4o-mini");

      // Assert
      expect(result2.stop).toEqual(["STOP", "END"]);
    });

    it("should include seed parameter", () => {
      // Arrange
      const request = createMockChatRequest({
        parameters: { seed: 42 },
      });

      // Act
      const result = transformRequest(request, "openai/gpt-4o-mini");

      // Assert
      expect(result.seed).toBe(42);
    });

    it("should omit undefined parameters", () => {
      // Arrange
      const request = createMockChatRequest({
        parameters: {
          temperature: 0.7,
          maxTokens: undefined,
          topP: undefined,
        },
      });

      // Act
      const result = transformRequest(request, "openai/gpt-4o-mini");

      // Assert
      expect(result.temperature).toBe(0.7);
      expect(result.max_tokens).toBeUndefined();
      expect(result.top_p).toBeUndefined();
    });
  });

  // ============================================================================
  // transformRequest - Response Format Transformation
  // ============================================================================

  describe("transformRequest - response format transformation", () => {
    it("should transform text response format", () => {
      // Arrange
      const request = createMockChatRequest({
        responseFormat: { type: "text" },
      });

      // Act
      const result = transformRequest(request, "openai/gpt-4o-mini");

      // Assert
      expect(result.response_format).toEqual({ type: "text" });
    });

    it("should transform json_object response format", () => {
      // Arrange
      const request = createMockChatRequest({
        responseFormat: { type: "json_object" },
      });

      // Act
      const result = transformRequest(request, "openai/gpt-4o-mini");

      // Assert
      expect(result.response_format).toEqual({ type: "json_object" });
    });

    it("should transform json_schema response format", () => {
      // Arrange
      const schema = {
        name: "recipe",
        description: "A recipe object",
        strict: true,
        schema: {
          type: "object",
          properties: {
            title: { type: "string" },
          },
        },
      };

      const request = createMockChatRequest({
        responseFormat: {
          type: "json_schema",
          jsonSchema: schema,
        },
      });

      // Act
      const result = transformRequest(request, "openai/gpt-4o-mini");

      // Assert
      expect(result.response_format).toEqual({
        type: "json_schema",
        json_schema: schema,
      });
    });

    it("should not include response_format when not specified", () => {
      // Arrange
      const request = createMockChatRequest({
        responseFormat: undefined,
      });

      // Act
      const result = transformRequest(request, "openai/gpt-4o-mini");

      // Assert
      expect(result.response_format).toBeUndefined();
    });
  });

  // ============================================================================
  // transformRequest - Tools Transformation
  // ============================================================================

  describe("transformRequest - tools transformation", () => {
    it("should include tools when specified", () => {
      // Arrange
      const tools = [
        {
          type: "function" as const,
          function: {
            name: "get_weather",
            description: "Get weather",
            parameters: { type: "object", properties: {} },
          },
        },
      ];

      const request = createMockChatRequest({ tools });

      // Act
      const result = transformRequest(request, "openai/gpt-4o-mini");

      // Assert
      expect(result.tools).toEqual(tools);
    });

    it("should include tool_choice when specified", () => {
      // Arrange
      const request = createMockChatRequest({
        toolChoice: "auto",
      });

      // Act
      const result = transformRequest(request, "openai/gpt-4o-mini");

      // Assert
      expect(result.tool_choice).toBe("auto");
    });

    it("should handle specific tool choice", () => {
      // Arrange
      const request = createMockChatRequest({
        toolChoice: {
          type: "function",
          function: { name: "get_weather" },
        },
      });

      // Act
      const result = transformRequest(request, "openai/gpt-4o-mini");

      // Assert
      expect(result.tool_choice).toEqual({
        type: "function",
        function: { name: "get_weather" },
      });
    });

    it("should not include tools when not specified", () => {
      // Arrange
      const request = createMockChatRequest({
        tools: undefined,
      });

      // Act
      const result = transformRequest(request, "openai/gpt-4o-mini");

      // Assert
      expect(result.tools).toBeUndefined();
    });
  });

  // ============================================================================
  // transformResponse - Basic Transformation
  // ============================================================================

  describe("transformResponse - basic transformation", () => {
    it("should transform API response to ChatResponse", () => {
      // Arrange
      const apiResponse = createMockAPIResponse();

      // Act
      const result = transformResponse(apiResponse);

      // Assert
      expect(result).toEqual({
        id: apiResponse.id,
        model: apiResponse.model,
        created: apiResponse.created,
        choices: [
          {
            index: 0,
            message: {
              role: "assistant",
              content: "Hello! How can I help you?",
              toolCalls: undefined,
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

    it("should transform snake_case usage to camelCase", () => {
      // Arrange
      const apiResponse = createMockAPIResponse({
        usage: {
          prompt_tokens: 100,
          completion_tokens: 200,
          total_tokens: 300,
        },
      });

      // Act
      const result = transformResponse(apiResponse);

      // Assert
      expect(result.usage).toEqual({
        promptTokens: 100,
        completionTokens: 200,
        totalTokens: 300,
      });
    });

    it("should handle missing usage data", () => {
      // Arrange
      const apiResponse = createMockAPIResponse({
        usage: undefined,
      });

      // Act
      const result = transformResponse(apiResponse);

      // Assert
      expect(result.usage).toEqual({
        promptTokens: 0,
        completionTokens: 0,
        totalTokens: 0,
      });
    });

    it("should handle partial usage data", () => {
      // Arrange
      const apiResponse = createMockAPIResponse({
        usage: {
          prompt_tokens: 10,
          completion_tokens: undefined,
          total_tokens: undefined,
        },
      });

      // Act
      const result = transformResponse(apiResponse);

      // Assert
      expect(result.usage).toEqual({
        promptTokens: 10,
        completionTokens: 0,
        totalTokens: 0,
      });
    });
  });

  // ============================================================================
  // transformResponse - Choices Transformation
  // ============================================================================

  describe("transformResponse - choices transformation", () => {
    it("should transform multiple choices", () => {
      // Arrange
      const apiResponse = createMockAPIResponse({
        choices: [
          {
            index: 0,
            message: { role: "assistant", content: "Response 1" },
            finish_reason: "stop",
          },
          {
            index: 1,
            message: { role: "assistant", content: "Response 2" },
            finish_reason: "length",
          },
        ],
      });

      // Act
      const result = transformResponse(apiResponse);

      // Assert
      expect(result.choices).toHaveLength(2);
      expect(result.choices[0].message.content).toBe("Response 1");
      expect(result.choices[0].finishReason).toBe("stop");
      expect(result.choices[1].message.content).toBe("Response 2");
      expect(result.choices[1].finishReason).toBe("length");
    });

    it("should transform finish_reason to finishReason", () => {
      // Arrange
      const finishReasons = ["stop", "length", "tool_calls", "content_filter"] as const;

      finishReasons.forEach((reason) => {
        const apiResponse = createMockAPIResponse({
          choices: [
            {
              index: 0,
              message: { role: "assistant", content: "Test" },
              finish_reason: reason,
            },
          ],
        });

        // Act
        const result = transformResponse(apiResponse);

        // Assert
        expect(result.choices[0].finishReason).toBe(reason);
      });
    });

    it("should handle null content", () => {
      // Arrange
      const apiResponse = createMockAPIResponse({
        choices: [
          {
            index: 0,
            message: { role: "assistant", content: null },
            finish_reason: "stop",
          },
        ],
      });

      // Act
      const result = transformResponse(apiResponse);

      // Assert
      expect(result.choices[0].message.content).toBeNull();
    });

    it("should transform tool_calls to toolCalls", () => {
      // Arrange
      const apiResponse = createMockAPIResponse({
        choices: [
          {
            index: 0,
            message: {
              role: "assistant",
              content: null,
              tool_calls: [
                {
                  id: "call_123",
                  type: "function",
                  function: {
                    name: "get_weather",
                    arguments: '{"location": "San Francisco"}',
                  },
                },
              ],
            },
            finish_reason: "tool_calls",
          },
        ],
      });

      // Act
      const result = transformResponse(apiResponse);

      // Assert
      expect(result.choices[0].message.toolCalls).toEqual([
        {
          id: "call_123",
          type: "function",
          function: {
            name: "get_weather",
            arguments: '{"location": "San Francisco"}',
          },
        },
      ]);
    });
  });

  // ============================================================================
  // transformResponse - Error Handling
  // ============================================================================

  describe("transformResponse - error handling", () => {
    it("should throw error when choices array is missing", () => {
      // Arrange
      const apiResponse = {
        id: "test",
        model: "test",
        created: 123,
      } as APIResponse;

      // Act & Assert
      expect(() => transformResponse(apiResponse)).toThrow(OpenRouterError);
      expect(() => transformResponse(apiResponse)).toThrow("Invalid response format: missing choices array");
    });

    it("should throw error when choices array is empty", () => {
      // Arrange
      const apiResponse = createMockAPIResponse({
        choices: [],
      });

      // Act & Assert
      expect(() => transformResponse(apiResponse)).toThrow(OpenRouterError);
      expect(() => transformResponse(apiResponse)).toThrow("Invalid response format: choices array is empty");
    });

    it("should throw error when choices is not an array", () => {
      // Arrange
      const apiResponse = {
        id: "test",
        model: "test",
        created: 123,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        choices: "not an array" as any,
      } as APIResponse;

      // Act & Assert
      expect(() => transformResponse(apiResponse)).toThrow("Invalid response format: missing choices array");
    });

    it("should include response details in error", () => {
      // Arrange
      const apiResponse = {
        id: "test",
        model: "test",
        created: 123,
        choices: [],
      } as APIResponse;

      // Act & Assert
      try {
        transformResponse(apiResponse);
        expect.fail("Should have thrown error");
      } catch (error) {
        expect(error).toBeInstanceOf(OpenRouterError);
        const openRouterError = error as OpenRouterError;
        expect(openRouterError.details).toEqual(apiResponse);
      }
    });
  });

  // ============================================================================
  // Edge Cases
  // ============================================================================

  describe("transformRequest - edge cases", () => {
    it("should handle request with no optional fields", () => {
      // Arrange
      const request: ChatRequest = {
        messages: createMockMessages(),
        model: "openai/gpt-4o-mini",
      };

      // Act
      const result = transformRequest(request, "openai/gpt-4o-mini");

      // Assert
      expect(result).toEqual({
        messages: request.messages,
        model: request.model,
      });
    });

    it("should handle empty parameters object", () => {
      // Arrange
      const request = createMockChatRequest({
        parameters: {},
      });

      // Act
      const result = transformRequest(request, "openai/gpt-4o-mini");

      // Assert
      expect(result.temperature).toBeUndefined();
      expect(result.max_tokens).toBeUndefined();
    });

    it("should preserve parameter values of 0", () => {
      // Arrange
      const request = createMockChatRequest({
        parameters: {
          temperature: 0,
          frequencyPenalty: 0,
          presencePenalty: 0,
        },
      });

      // Act
      const result = transformRequest(request, "openai/gpt-4o-mini");

      // Assert
      expect(result.temperature).toBe(0);
      expect(result.frequency_penalty).toBe(0);
      expect(result.presence_penalty).toBe(0);
    });
  });

  describe("transformResponse - edge cases", () => {
    it("should handle response with extra fields", () => {
      // Arrange
      const apiResponse = {
        ...createMockAPIResponse(),
        extraField: "should be ignored",
        anotherExtra: 123,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any;

      // Act
      const result = transformResponse(apiResponse);

      // Assert - should still transform successfully
      expect(result.id).toBeDefined();
      expect(result.choices).toBeDefined();
    });

    it("should handle assistant role in choices", () => {
      // Arrange
      const apiResponse = createMockAPIResponse({
        choices: [
          {
            index: 0,
            message: { role: "assistant", content: "Test" },
            finish_reason: "stop",
          },
        ],
      });

      // Act
      const result = transformResponse(apiResponse);

      // Assert
      expect(result.choices[0].message.role).toBe("assistant");
    });

    it("should handle tool role in choices", () => {
      // Arrange
      const apiResponse = createMockAPIResponse({
        choices: [
          {
            index: 0,
            message: { role: "tool", content: "Tool response" },
            finish_reason: "stop",
          },
        ],
      });

      // Act
      const result = transformResponse(apiResponse);

      // Assert
      expect(result.choices[0].message.role).toBe("tool");
    });
  });
});
