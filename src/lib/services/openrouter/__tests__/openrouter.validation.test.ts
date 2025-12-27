/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * OpenRouter Validation Unit Tests
 *
 * Tests validation functions for chat requests with comprehensive coverage of:
 * - Message validation (roles, content, empty arrays)
 * - Model validation
 * - Parameter validation (temperature, topP, penalties, maxTokens)
 * - JSON schema validation (structure, size limits)
 * - Tool validation (function definitions)
 *
 * Follows Vitest best practices: factory mocks, descriptive blocks, AAA pattern.
 */

import { describe, expect, it } from "vitest";
import { validateRequest, validateJsonSchema } from "../openrouter.validation";
import { OpenRouterError } from "../openrouter.types";
import type { ChatRequest, JSONSchema } from "../openrouter.types";

// ============================================================================
// Test Data Factories
// ============================================================================

const createValidChatRequest = (overrides?: Partial<ChatRequest>): ChatRequest => ({
  messages: [
    { role: "system", content: "You are a helpful assistant." },
    { role: "user", content: "Hello!" },
  ],
  model: "openai/gpt-4o-mini",
  ...overrides,
});

const createValidJSONSchema = (overrides?: Partial<JSONSchema>): JSONSchema => ({
  type: "object",
  properties: {
    name: { type: "string" },
    age: { type: "number" },
  },
  required: ["name"],
  ...overrides,
});

// ============================================================================
// Test Suite
// ============================================================================

describe("OpenRouter Validation", () => {
  // ============================================================================
  // validateRequest - Messages Validation
  // ============================================================================

  describe("validateRequest - messages validation", () => {
    it("should accept valid chat request with messages", () => {
      // Arrange
      const request = createValidChatRequest();

      // Act & Assert - should not throw
      expect(() => validateRequest(request, "openai/gpt-4o-mini")).not.toThrow();
    });

    it("should reject empty messages array", () => {
      // Arrange
      const request = createValidChatRequest({ messages: [] });

      // Act & Assert
      expect(() => validateRequest(request, "openai/gpt-4o-mini")).toThrow(OpenRouterError);
      expect(() => validateRequest(request, "openai/gpt-4o-mini")).toThrow("Messages array cannot be empty");
    });

    it("should reject undefined messages", () => {
      // Arrange
      const request = { model: "openai/gpt-4o-mini" } as ChatRequest;

      // Act & Assert
      expect(() => validateRequest(request, "openai/gpt-4o-mini")).toThrow(OpenRouterError);
      expect(() => validateRequest(request, "openai/gpt-4o-mini")).toThrow("Messages array cannot be empty");
    });

    it("should accept all valid message roles", () => {
      // Arrange - test each valid role
      const validRoles = ["system", "user", "assistant", "tool"] as const;

      validRoles.forEach((role) => {
        const request = createValidChatRequest({
          messages: [{ role, content: "Test message" }],
        });

        // Act & Assert - should not throw
        expect(() => validateRequest(request, "openai/gpt-4o-mini")).not.toThrow();
      });
    });

    it("should reject invalid message role", () => {
      // Arrange
      const request = createValidChatRequest({
        messages: [{ role: "invalid" as any, content: "Test" }],
      });

      // Act & Assert
      expect(() => validateRequest(request, "openai/gpt-4o-mini")).toThrow(OpenRouterError);
      expect(() => validateRequest(request, "openai/gpt-4o-mini")).toThrow("Invalid message role: invalid");
    });

    it("should reject multiple invalid roles and report first one", () => {
      // Arrange
      const request = createValidChatRequest({
        messages: [
          { role: "user", content: "Valid" },
          { role: "invalid1" as any, content: "Invalid" },
          { role: "invalid2" as any, content: "Also invalid" },
        ],
      });

      // Act & Assert
      expect(() => validateRequest(request, "openai/gpt-4o-mini")).toThrow("Invalid message role: invalid1");
    });
  });

  // ============================================================================
  // validateRequest - Model Validation
  // ============================================================================

  describe("validateRequest - model validation", () => {
    it("should accept request with model specified", () => {
      // Arrange
      const request = createValidChatRequest({ model: "openai/gpt-4o-mini" });

      // Act & Assert
      expect(() => validateRequest(request)).not.toThrow();
    });

    it("should accept request without model if defaultModel is provided", () => {
      // Arrange
      const request = createValidChatRequest({ model: undefined });

      // Act & Assert
      expect(() => validateRequest(request, "openai/gpt-4o-mini")).not.toThrow();
    });

    it("should reject request without model and no defaultModel", () => {
      // Arrange
      const request = createValidChatRequest({ model: undefined });

      // Act & Assert
      expect(() => validateRequest(request)).toThrow(OpenRouterError);
      expect(() => validateRequest(request)).toThrow("Model must be specified in request or config");
    });
  });

  // ============================================================================
  // validateRequest - Parameters Validation
  // ============================================================================

  describe("validateRequest - parameters validation", () => {
    describe("temperature", () => {
      it("should accept valid temperature values", () => {
        // Arrange - test boundary values and middle
        const validTemperatures = [0, 0.5, 1.0, 1.5, 2.0];

        validTemperatures.forEach((temperature) => {
          const request = createValidChatRequest({
            parameters: { temperature },
          });

          // Act & Assert
          expect(() => validateRequest(request, "openai/gpt-4o-mini")).not.toThrow();
        });
      });

      it("should reject temperature below 0", () => {
        // Arrange
        const request = createValidChatRequest({
          parameters: { temperature: -0.1 },
        });

        // Act & Assert
        expect(() => validateRequest(request, "openai/gpt-4o-mini")).toThrow(OpenRouterError);
        expect(() => validateRequest(request, "openai/gpt-4o-mini")).toThrow("Temperature must be between 0.0 and 2.0");
      });

      it("should reject temperature above 2.0", () => {
        // Arrange
        const request = createValidChatRequest({
          parameters: { temperature: 2.1 },
        });

        // Act & Assert
        expect(() => validateRequest(request, "openai/gpt-4o-mini")).toThrow("Temperature must be between 0.0 and 2.0");
      });
    });

    describe("topP", () => {
      it("should accept valid topP values", () => {
        // Arrange
        const validTopP = [0, 0.3, 0.5, 0.9, 1.0];

        validTopP.forEach((topP) => {
          const request = createValidChatRequest({
            parameters: { topP },
          });

          // Act & Assert
          expect(() => validateRequest(request, "openai/gpt-4o-mini")).not.toThrow();
        });
      });

      it("should reject topP below 0", () => {
        // Arrange
        const request = createValidChatRequest({
          parameters: { topP: -0.1 },
        });

        // Act & Assert
        expect(() => validateRequest(request, "openai/gpt-4o-mini")).toThrow("topP must be between 0.0 and 1.0");
      });

      it("should reject topP above 1.0", () => {
        // Arrange
        const request = createValidChatRequest({
          parameters: { topP: 1.1 },
        });

        // Act & Assert
        expect(() => validateRequest(request, "openai/gpt-4o-mini")).toThrow("topP must be between 0.0 and 1.0");
      });
    });

    describe("frequencyPenalty", () => {
      it("should accept valid frequencyPenalty values", () => {
        // Arrange
        const validPenalties = [-2.0, -1.0, 0, 1.0, 2.0];

        validPenalties.forEach((frequencyPenalty) => {
          const request = createValidChatRequest({
            parameters: { frequencyPenalty },
          });

          // Act & Assert
          expect(() => validateRequest(request, "openai/gpt-4o-mini")).not.toThrow();
        });
      });

      it("should reject frequencyPenalty below -2.0", () => {
        // Arrange
        const request = createValidChatRequest({
          parameters: { frequencyPenalty: -2.1 },
        });

        // Act & Assert
        expect(() => validateRequest(request, "openai/gpt-4o-mini")).toThrow(
          "frequencyPenalty must be between -2.0 and 2.0"
        );
      });

      it("should reject frequencyPenalty above 2.0", () => {
        // Arrange
        const request = createValidChatRequest({
          parameters: { frequencyPenalty: 2.1 },
        });

        // Act & Assert
        expect(() => validateRequest(request, "openai/gpt-4o-mini")).toThrow(
          "frequencyPenalty must be between -2.0 and 2.0"
        );
      });
    });

    describe("presencePenalty", () => {
      it("should accept valid presencePenalty values", () => {
        // Arrange
        const validPenalties = [-2.0, -1.0, 0, 1.0, 2.0];

        validPenalties.forEach((presencePenalty) => {
          const request = createValidChatRequest({
            parameters: { presencePenalty },
          });

          // Act & Assert
          expect(() => validateRequest(request, "openai/gpt-4o-mini")).not.toThrow();
        });
      });

      it("should reject presencePenalty below -2.0", () => {
        // Arrange
        const request = createValidChatRequest({
          parameters: { presencePenalty: -2.1 },
        });

        // Act & Assert
        expect(() => validateRequest(request, "openai/gpt-4o-mini")).toThrow(
          "presencePenalty must be between -2.0 and 2.0"
        );
      });

      it("should reject presencePenalty above 2.0", () => {
        // Arrange
        const request = createValidChatRequest({
          parameters: { presencePenalty: 2.1 },
        });

        // Act & Assert
        expect(() => validateRequest(request, "openai/gpt-4o-mini")).toThrow(
          "presencePenalty must be between -2.0 and 2.0"
        );
      });
    });

    describe("maxTokens", () => {
      it("should accept valid maxTokens values", () => {
        // Arrange
        const validMaxTokens = [1, 100, 1000, 4000];

        validMaxTokens.forEach((maxTokens) => {
          const request = createValidChatRequest({
            parameters: { maxTokens },
          });

          // Act & Assert
          expect(() => validateRequest(request, "openai/gpt-4o-mini")).not.toThrow();
        });
      });

      it("should reject maxTokens less than 1", () => {
        // Arrange
        const request = createValidChatRequest({
          parameters: { maxTokens: 0 },
        });

        // Act & Assert
        expect(() => validateRequest(request, "openai/gpt-4o-mini")).toThrow("maxTokens must be greater than 0");
      });

      it("should reject negative maxTokens", () => {
        // Arrange
        const request = createValidChatRequest({
          parameters: { maxTokens: -100 },
        });

        // Act & Assert
        expect(() => validateRequest(request, "openai/gpt-4o-mini")).toThrow("maxTokens must be greater than 0");
      });
    });

    it("should accept multiple valid parameters together", () => {
      // Arrange
      const request = createValidChatRequest({
        parameters: {
          temperature: 0.7,
          topP: 0.9,
          maxTokens: 2000,
          frequencyPenalty: 0.5,
          presencePenalty: 0.3,
        },
      });

      // Act & Assert
      expect(() => validateRequest(request, "openai/gpt-4o-mini")).not.toThrow();
    });
  });

  // ============================================================================
  // validateRequest - JSON Schema Validation
  // ============================================================================

  describe("validateRequest - JSON schema validation", () => {
    it("should accept valid JSON schema response format", () => {
      // Arrange
      const request = createValidChatRequest({
        responseFormat: {
          type: "json_schema",
          jsonSchema: {
            name: "recipe",
            schema: createValidJSONSchema(),
          },
        },
      });

      // Act & Assert
      expect(() => validateRequest(request, "openai/gpt-4o-mini")).not.toThrow();
    });

    it("should accept json_object response format without schema", () => {
      // Arrange
      const request = createValidChatRequest({
        responseFormat: {
          type: "json_object",
        },
      });

      // Act & Assert
      expect(() => validateRequest(request, "openai/gpt-4o-mini")).not.toThrow();
    });

    it("should accept text response format", () => {
      // Arrange
      const request = createValidChatRequest({
        responseFormat: {
          type: "text",
        },
      });

      // Act & Assert
      expect(() => validateRequest(request, "openai/gpt-4o-mini")).not.toThrow();
    });

    it("should reject json_schema without schema definition", () => {
      // Arrange
      const request = createValidChatRequest({
        responseFormat: {
          type: "json_schema",
          jsonSchema: {
            name: "recipe",
            schema: undefined as any,
          },
        },
      });

      // Act & Assert
      expect(() => validateRequest(request, "openai/gpt-4o-mini")).toThrow(OpenRouterError);
      expect(() => validateRequest(request, "openai/gpt-4o-mini")).toThrow(
        "JSON schema is required when using json_schema response format"
      );
    });
  });

  // ============================================================================
  // validateRequest - Tools Validation
  // ============================================================================

  describe("validateRequest - tools validation", () => {
    it("should accept valid tool definitions", () => {
      // Arrange
      const request = createValidChatRequest({
        tools: [
          {
            type: "function",
            function: {
              name: "get_weather",
              description: "Get the current weather in a location",
              parameters: {
                type: "object",
                properties: {
                  location: { type: "string" },
                },
              },
            },
          },
        ],
      });

      // Act & Assert
      expect(() => validateRequest(request, "openai/gpt-4o-mini")).not.toThrow();
    });

    it("should accept multiple tool definitions", () => {
      // Arrange
      const request = createValidChatRequest({
        tools: [
          {
            type: "function",
            function: {
              name: "get_weather",
              description: "Get weather",
              parameters: { type: "object", properties: {} },
            },
          },
          {
            type: "function",
            function: {
              name: "search",
              description: "Search the web",
              parameters: { type: "object", properties: {} },
            },
          },
        ],
      });

      // Act & Assert
      expect(() => validateRequest(request, "openai/gpt-4o-mini")).not.toThrow();
    });

    it("should reject tool with invalid type", () => {
      // Arrange
      const request = createValidChatRequest({
        tools: [
          {
            type: "invalid" as any,
            function: {
              name: "test",
              description: "Test",
              parameters: {},
            },
          },
        ],
      });

      // Act & Assert
      expect(() => validateRequest(request, "openai/gpt-4o-mini")).toThrow(OpenRouterError);
      expect(() => validateRequest(request, "openai/gpt-4o-mini")).toThrow("Invalid tool type: invalid");
    });

    it("should reject tool without name", () => {
      // Arrange
      const request = createValidChatRequest({
        tools: [
          {
            type: "function",
            function: {
              name: "",
              description: "Test",
              parameters: {},
            },
          },
        ],
      });

      // Act & Assert
      expect(() => validateRequest(request, "openai/gpt-4o-mini")).toThrow(OpenRouterError);
      expect(() => validateRequest(request, "openai/gpt-4o-mini")).toThrow(
        "Tool function must have name and description"
      );
    });

    it("should reject tool without description", () => {
      // Arrange
      const request = createValidChatRequest({
        tools: [
          {
            type: "function",
            function: {
              name: "test",
              description: "",
              parameters: {},
            },
          },
        ],
      });

      // Act & Assert
      expect(() => validateRequest(request, "openai/gpt-4o-mini")).toThrow(
        "Tool function must have name and description"
      );
    });
  });

  // ============================================================================
  // validateJsonSchema - Schema Validation
  // ============================================================================

  describe("validateJsonSchema", () => {
    it("should accept valid JSON schema", () => {
      // Arrange
      const schema = createValidJSONSchema();

      // Act & Assert
      expect(() => validateJsonSchema(schema)).not.toThrow();
    });

    it("should accept complex nested schema", () => {
      // Arrange
      const schema: JSONSchema = {
        type: "object",
        properties: {
          user: {
            type: "object",
            properties: {
              name: { type: "string" },
              age: { type: "number" },
              address: {
                type: "object",
                properties: {
                  street: { type: "string" },
                  city: { type: "string" },
                },
              },
            },
          },
        },
      };

      // Act & Assert
      expect(() => validateJsonSchema(schema)).not.toThrow();
    });

    it("should reject undefined schema", () => {
      // Act & Assert
      expect(() => validateJsonSchema(undefined)).toThrow(OpenRouterError);
      expect(() => validateJsonSchema(undefined)).toThrow(
        "JSON schema is required when using json_schema response format"
      );
    });

    it("should reject schema without type", () => {
      // Arrange
      const schema = {
        properties: {
          name: { type: "string" },
        },
      } as JSONSchema;

      // Act & Assert
      expect(() => validateJsonSchema(schema)).toThrow(OpenRouterError);
      expect(() => validateJsonSchema(schema)).toThrow("Invalid JSON schema structure");
    });

    it("should reject schema without properties", () => {
      // Arrange
      const schema = {
        type: "object",
      } as JSONSchema;

      // Act & Assert
      expect(() => validateJsonSchema(schema)).toThrow("Invalid JSON schema structure");
    });

    it("should reject schema larger than 50KB", () => {
      // Arrange - create a large schema
      const largeProperties: Record<string, any> = {};
      for (let i = 0; i < 10000; i++) {
        largeProperties[`field_${i}`] = {
          type: "string",
          description: "A very long description that adds to the schema size",
        };
      }

      const schema: JSONSchema = {
        type: "object",
        properties: largeProperties,
      };

      // Act & Assert
      expect(() => validateJsonSchema(schema)).toThrow(OpenRouterError);
      expect(() => validateJsonSchema(schema)).toThrow("JSON schema too large (max 50KB)");
    });

    it("should accept schema at size limit", () => {
      // Arrange - create schema just under 50KB
      const properties: Record<string, any> = {};
      for (let i = 0; i < 1000; i++) {
        properties[`field_${i}`] = { type: "string" };
      }

      const schema: JSONSchema = {
        type: "object",
        properties,
      };

      // Verify it's under the limit
      const schemaSize = JSON.stringify(schema).length;
      expect(schemaSize).toBeLessThan(50000);

      // Act & Assert
      expect(() => validateJsonSchema(schema)).not.toThrow();
    });
  });

  // ============================================================================
  // Edge Cases
  // ============================================================================

  describe("validateRequest - edge cases", () => {
    it("should accept request with all optional fields omitted", () => {
      // Arrange - minimal valid request
      const request: ChatRequest = {
        messages: [{ role: "user", content: "Hello" }],
        model: "openai/gpt-4o-mini",
      };

      // Act & Assert
      expect(() => validateRequest(request)).not.toThrow();
    });

    it("should accept request with stop sequences as string", () => {
      // Arrange
      const request = createValidChatRequest({
        parameters: {
          stop: "STOP",
        },
      });

      // Act & Assert
      expect(() => validateRequest(request, "openai/gpt-4o-mini")).not.toThrow();
    });

    it("should accept request with stop sequences as array", () => {
      // Arrange
      const request = createValidChatRequest({
        parameters: {
          stop: ["STOP", "END"],
        },
      });

      // Act & Assert
      expect(() => validateRequest(request, "openai/gpt-4o-mini")).not.toThrow();
    });

    it("should accept request with seed parameter", () => {
      // Arrange
      const request = createValidChatRequest({
        parameters: {
          seed: 12345,
        },
      });

      // Act & Assert
      expect(() => validateRequest(request, "openai/gpt-4o-mini")).not.toThrow();
    });
  });
});
