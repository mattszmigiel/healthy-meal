// OpenRouter API Helper Functions

import type { JSONSchema, Message, ResponseFormat } from "./openrouter.types";

// ============================================================================
// Message Creation Helpers
// ============================================================================

/**
 * Creates a properly formatted system message
 * @param content - The content of the system message
 * @returns A Message object with role "system"
 */
export function createSystemMessage(content: string): Message {
  return { role: "system", content };
}

/**
 * Creates a properly formatted user message
 * @param content - The content of the user message
 * @returns A Message object with role "user"
 */
export function createUserMessage(content: string): Message {
  return { role: "user", content };
}

/**
 * Creates a properly formatted assistant message
 * @param content - The content of the assistant message
 * @returns A Message object with role "assistant"
 */
export function createAssistantMessage(content: string): Message {
  return { role: "assistant", content };
}

// ============================================================================
// Response Format Helpers
// ============================================================================

/**
 * Creates a JSON schema response format configuration
 * @param name - The name of the schema
 * @param schema - The JSON Schema object
 * @param options - Optional configuration (description, strict mode)
 * @returns A ResponseFormat object configured for JSON schema validation
 */
export function createJsonSchemaFormat(
  name: string,
  schema: JSONSchema,
  options?: { description?: string; strict?: boolean }
): ResponseFormat {
  return {
    type: "json_schema",
    jsonSchema: {
      name,
      schema,
      description: options?.description,
      strict: options?.strict ?? true,
    },
  };
}
