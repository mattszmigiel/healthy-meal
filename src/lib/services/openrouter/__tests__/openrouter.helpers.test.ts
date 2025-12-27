/**
 * OpenRouter Helpers Unit Tests
 *
 * Tests helper functions for creating messages and response formats with coverage of:
 * - Message creation helpers (system, user, assistant)
 * - JSON schema format creation
 * - Default values and optional parameters
 * - Edge cases
 *
 * Follows Vitest best practices: factory mocks, descriptive blocks, AAA pattern.
 */

import { describe, expect, it } from "vitest";
import {
  createSystemMessage,
  createUserMessage,
  createAssistantMessage,
  createJsonSchemaFormat,
} from "../openrouter.helpers";
import type { Message, ResponseFormat, JSONSchema } from "../openrouter.types";

// ============================================================================
// Test Suite
// ============================================================================

describe("OpenRouter Helpers", () => {
  // ============================================================================
  // Message Creation Helpers
  // ============================================================================

  describe("createSystemMessage", () => {
    it("should create a system message with given content", () => {
      // Arrange
      const content = "You are a helpful assistant.";

      // Act
      const message = createSystemMessage(content);

      // Assert
      expect(message).toEqual<Message>({
        role: "system",
        content,
      });
    });

    it("should handle empty content", () => {
      // Arrange
      const content = "";

      // Act
      const message = createSystemMessage(content);

      // Assert
      expect(message.role).toBe("system");
      expect(message.content).toBe("");
    });

    it("should handle multiline content", () => {
      // Arrange
      const content = `You are a professional chef.
You specialize in healthy recipes.
Always provide nutritional information.`;

      // Act
      const message = createSystemMessage(content);

      // Assert
      expect(message.role).toBe("system");
      expect(message.content).toBe(content);
    });

    it("should handle content with special characters", () => {
      // Arrange
      const content = 'System: "Use quotes" & special chars like @#$%';

      // Act
      const message = createSystemMessage(content);

      // Assert
      expect(message.role).toBe("system");
      expect(message.content).toBe(content);
    });

    it("should handle very long content", () => {
      // Arrange
      const content = "A".repeat(10000);

      // Act
      const message = createSystemMessage(content);

      // Assert
      expect(message.role).toBe("system");
      expect(message.content).toHaveLength(10000);
    });
  });

  describe("createUserMessage", () => {
    it("should create a user message with given content", () => {
      // Arrange
      const content = "Hello, how are you?";

      // Act
      const message = createUserMessage(content);

      // Assert
      expect(message).toEqual<Message>({
        role: "user",
        content,
      });
    });

    it("should handle empty content", () => {
      // Arrange
      const content = "";

      // Act
      const message = createUserMessage(content);

      // Assert
      expect(message.role).toBe("user");
      expect(message.content).toBe("");
    });

    it("should handle content with markdown formatting", () => {
      // Arrange
      const content = `# Heading

**Bold text** and *italic text*

- List item 1
- List item 2

\`\`\`javascript
const code = "test";
\`\`\``;

      // Act
      const message = createUserMessage(content);

      // Assert
      expect(message.role).toBe("user");
      expect(message.content).toBe(content);
    });

    it("should handle content with JSON", () => {
      // Arrange
      const content = JSON.stringify({
        title: "Recipe",
        ingredients: ["flour", "eggs"],
      });

      // Act
      const message = createUserMessage(content);

      // Assert
      expect(message.role).toBe("user");
      expect(message.content).toBe(content);
    });

    it("should handle unicode characters", () => {
      // Arrange
      const content = "Hello 👋 世界 🌍";

      // Act
      const message = createUserMessage(content);

      // Assert
      expect(message.role).toBe("user");
      expect(message.content).toBe(content);
    });
  });

  describe("createAssistantMessage", () => {
    it("should create an assistant message with given content", () => {
      // Arrange
      const content = "I'm doing well, thank you!";

      // Act
      const message = createAssistantMessage(content);

      // Assert
      expect(message).toEqual<Message>({
        role: "assistant",
        content,
      });
    });

    it("should handle empty content", () => {
      // Arrange
      const content = "";

      // Act
      const message = createAssistantMessage(content);

      // Assert
      expect(message.role).toBe("assistant");
      expect(message.content).toBe("");
    });

    it("should handle structured response content", () => {
      // Arrange
      const content = JSON.stringify({
        title: "Vegan Lasagna",
        ingredients: ["tofu", "pasta", "sauce"],
        instructions: "1. Cook pasta\n2. Layer ingredients",
      });

      // Act
      const message = createAssistantMessage(content);

      // Assert
      expect(message.role).toBe("assistant");
      expect(message.content).toBe(content);
    });
  });

  // ============================================================================
  // Message Creation - Integration
  // ============================================================================

  describe("message creation helpers - integration", () => {
    it("should create complete conversation flow", () => {
      // Arrange & Act
      const messages = [
        createSystemMessage("You are a helpful assistant."),
        createUserMessage("What is the weather like?"),
        createAssistantMessage("I don't have access to real-time weather data."),
        createUserMessage("Can you help me with a recipe?"),
        createAssistantMessage("Of course! What type of recipe are you looking for?"),
      ];

      // Assert
      expect(messages).toHaveLength(5);
      expect(messages[0].role).toBe("system");
      expect(messages[1].role).toBe("user");
      expect(messages[2].role).toBe("assistant");
      expect(messages[3].role).toBe("user");
      expect(messages[4].role).toBe("assistant");
    });

    it("should create messages that can be used in chat request", () => {
      // Arrange & Act
      const messages: Message[] = [createSystemMessage("System prompt"), createUserMessage("User query")];

      // Assert - messages should have correct structure for ChatRequest
      messages.forEach((msg) => {
        expect(msg).toHaveProperty("role");
        expect(msg).toHaveProperty("content");
        expect(typeof msg.role).toBe("string");
        expect(typeof msg.content).toBe("string");
      });
    });
  });

  // ============================================================================
  // createJsonSchemaFormat
  // ============================================================================

  describe("createJsonSchemaFormat", () => {
    it("should create JSON schema format with required parameters", () => {
      // Arrange
      const name = "recipe";
      const schema: JSONSchema = {
        type: "object",
        properties: {
          title: { type: "string" },
          ingredients: { type: "array", items: { type: "string" } },
        },
        required: ["title"],
      };

      // Act
      const format = createJsonSchemaFormat(name, schema);

      // Assert
      expect(format).toEqual<ResponseFormat>({
        type: "json_schema",
        jsonSchema: {
          name,
          schema,
          description: undefined,
          strict: true,
        },
      });
    });

    it("should use strict: true by default", () => {
      // Arrange
      const name = "test";
      const schema: JSONSchema = {
        type: "object",
        properties: {},
      };

      // Act
      const format = createJsonSchemaFormat(name, schema);

      // Assert
      expect(format.jsonSchema?.strict).toBe(true);
    });

    it("should accept custom description", () => {
      // Arrange
      const name = "recipe";
      const schema: JSONSchema = {
        type: "object",
        properties: {},
      };
      const description = "A recipe with ingredients and instructions";

      // Act
      const format = createJsonSchemaFormat(name, schema, { description });

      // Assert
      expect(format.jsonSchema?.description).toBe(description);
    });

    it("should accept custom strict mode", () => {
      // Arrange
      const name = "recipe";
      const schema: JSONSchema = {
        type: "object",
        properties: {},
      };

      // Act
      const format = createJsonSchemaFormat(name, schema, { strict: false });

      // Assert
      expect(format.jsonSchema?.strict).toBe(false);
    });

    it("should accept both description and strict in options", () => {
      // Arrange
      const name = "recipe";
      const schema: JSONSchema = {
        type: "object",
        properties: {},
      };
      const options = {
        description: "Custom description",
        strict: false,
      };

      // Act
      const format = createJsonSchemaFormat(name, schema, options);

      // Assert
      expect(format.jsonSchema?.description).toBe(options.description);
      expect(format.jsonSchema?.strict).toBe(false);
    });

    it("should handle complex nested schema", () => {
      // Arrange
      const name = "recipe";
      const schema: JSONSchema = {
        type: "object",
        properties: {
          title: { type: "string" },
          metadata: {
            type: "object",
            properties: {
              author: { type: "string" },
              tags: { type: "array", items: { type: "string" } },
              nutrition: {
                type: "object",
                properties: {
                  calories: { type: "number" },
                  protein: { type: "number" },
                },
              },
            },
          },
        },
        required: ["title"],
      };

      // Act
      const format = createJsonSchemaFormat(name, schema);

      // Assert
      expect(format.jsonSchema?.schema).toEqual(schema);
      expect(format.type).toBe("json_schema");
    });

    it("should handle schema with array types", () => {
      // Arrange
      const name = "ingredients_list";
      const schema: JSONSchema = {
        type: "object",
        properties: {
          ingredients: {
            type: "array",
            items: {
              type: "object",
              properties: {
                name: { type: "string" },
                quantity: { type: "string" },
                unit: { type: "string" },
              },
              required: ["name"],
            },
          },
        },
      };

      // Act
      const format = createJsonSchemaFormat(name, schema);

      // Assert
      expect(format.jsonSchema?.schema).toEqual(schema);
    });

    it("should handle schema with enum values", () => {
      // Arrange
      const name = "recipe_type";
      const schema: JSONSchema = {
        type: "object",
        properties: {
          diet_type: {
            type: "string",
            enum: ["vegan", "vegetarian", "pescatarian", "omnivore"],
          },
        },
      };

      // Act
      const format = createJsonSchemaFormat(name, schema);

      // Assert
      expect(format.jsonSchema?.schema).toEqual(schema);
    });

    it("should handle empty schema name", () => {
      // Arrange
      const name = "";
      const schema: JSONSchema = {
        type: "object",
        properties: {},
      };

      // Act
      const format = createJsonSchemaFormat(name, schema);

      // Assert
      expect(format.jsonSchema?.name).toBe("");
    });

    it("should preserve all schema properties", () => {
      // Arrange
      const name = "complex";
      const schema: JSONSchema = {
        type: "object",
        properties: {
          field1: { type: "string" },
        },
        required: ["field1"],
        additionalProperties: false,
        $schema: "http://json-schema.org/draft-07/schema#",
      };

      // Act
      const format = createJsonSchemaFormat(name, schema);

      // Assert
      expect(format.jsonSchema?.schema).toEqual(schema);
    });
  });

  // ============================================================================
  // createJsonSchemaFormat - Edge Cases
  // ============================================================================

  describe("createJsonSchemaFormat - edge cases", () => {
    it("should handle minimal valid schema", () => {
      // Arrange
      const name = "minimal";
      const schema: JSONSchema = {
        type: "object",
        properties: {},
      };

      // Act
      const format = createJsonSchemaFormat(name, schema);

      // Assert
      expect(format.type).toBe("json_schema");
      expect(format.jsonSchema?.name).toBe(name);
      expect(format.jsonSchema?.schema).toEqual(schema);
    });

    it("should handle schema with special characters in name", () => {
      // Arrange
      const name = "recipe-v2_final@2024";
      const schema: JSONSchema = {
        type: "object",
        properties: {},
      };

      // Act
      const format = createJsonSchemaFormat(name, schema);

      // Assert
      expect(format.jsonSchema?.name).toBe(name);
    });

    it("should handle very long schema names", () => {
      // Arrange
      const name = "a".repeat(1000);
      const schema: JSONSchema = {
        type: "object",
        properties: {},
      };

      // Act
      const format = createJsonSchemaFormat(name, schema);

      // Assert
      expect(format.jsonSchema?.name).toHaveLength(1000);
    });

    it("should handle very long descriptions", () => {
      // Arrange
      const name = "test";
      const schema: JSONSchema = {
        type: "object",
        properties: {},
      };
      const description = "A ".repeat(500) + "schema";

      // Act
      const format = createJsonSchemaFormat(name, schema, { description });

      // Assert
      expect(format.jsonSchema?.description).toBe(description);
    });

    it("should handle undefined options", () => {
      // Arrange
      const name = "test";
      const schema: JSONSchema = {
        type: "object",
        properties: {},
      };

      // Act
      const format = createJsonSchemaFormat(name, schema, undefined);

      // Assert
      expect(format.jsonSchema?.strict).toBe(true);
      expect(format.jsonSchema?.description).toBeUndefined();
    });

    it("should handle empty options object", () => {
      // Arrange
      const name = "test";
      const schema: JSONSchema = {
        type: "object",
        properties: {},
      };

      // Act
      const format = createJsonSchemaFormat(name, schema, {});

      // Assert
      expect(format.jsonSchema?.strict).toBe(true);
      expect(format.jsonSchema?.description).toBeUndefined();
    });

    it("should handle strict explicitly set to true", () => {
      // Arrange
      const name = "test";
      const schema: JSONSchema = {
        type: "object",
        properties: {},
      };

      // Act
      const format = createJsonSchemaFormat(name, schema, { strict: true });

      // Assert
      expect(format.jsonSchema?.strict).toBe(true);
    });
  });

  // ============================================================================
  // Integration - Using Helpers Together
  // ============================================================================

  describe("helpers integration", () => {
    it("should create complete chat request components", () => {
      // Arrange
      const systemMessage = createSystemMessage("You are a recipe assistant");
      const userMessage = createUserMessage("Help me modify this recipe");
      const schema: JSONSchema = {
        type: "object",
        properties: {
          title: { type: "string" },
          ingredients: { type: "string" },
          instructions: { type: "string" },
        },
        required: ["title", "ingredients", "instructions"],
      };
      const responseFormat = createJsonSchemaFormat("modified_recipe", schema, {
        description: "Modified recipe based on user preferences",
      });

      // Assert
      expect(systemMessage.role).toBe("system");
      expect(userMessage.role).toBe("user");
      expect(responseFormat.type).toBe("json_schema");
      expect(responseFormat.jsonSchema?.name).toBe("modified_recipe");

      // Can be used together in a chat request
      const messages = [systemMessage, userMessage];
      expect(messages).toHaveLength(2);
    });

    it("should create components that match OpenRouter API types", () => {
      // Arrange & Act
      const messages: Message[] = [
        createSystemMessage("System"),
        createUserMessage("User"),
        createAssistantMessage("Assistant"),
      ];

      const format: ResponseFormat = createJsonSchemaFormat(
        "test",
        {
          type: "object",
          properties: { field: { type: "string" } },
        },
        { strict: true }
      );

      // Assert - verify types are compatible
      expect(messages).toBeInstanceOf(Array);
      expect(format).toHaveProperty("type");
      expect(format).toHaveProperty("jsonSchema");
    });
  });
});
