// OpenRouter API Validation Functions

import type { ChatRequest, JSONSchema } from "./openrouter.types";
import { OpenRouterError } from "./openrouter.types";

// ============================================================================
// Validation Functions
// ============================================================================

/**
 * Validates a chat request before sending to the API
 * @param request - The chat request to validate
 * @param defaultModel - Optional default model from config
 * @throws {OpenRouterError} If validation fails
 */
export function validateRequest(request: ChatRequest, defaultModel?: string): void {
  // Validate messages array
  if (!request.messages || request.messages.length === 0) {
    throw new OpenRouterError("Messages array cannot be empty", undefined, "VALIDATION_ERROR");
  }

  // Validate message roles
  const validRoles = ["system", "user", "assistant", "tool"];
  for (const message of request.messages) {
    if (!validRoles.includes(message.role)) {
      throw new OpenRouterError(`Invalid message role: ${message.role}`, undefined, "VALIDATION_ERROR");
    }
  }

  // Validate model is specified
  if (!request.model && !defaultModel) {
    throw new OpenRouterError("Model must be specified in request or config", undefined, "VALIDATION_ERROR");
  }

  // Validate parameters if provided
  if (request.parameters) {
    const { temperature, topP, frequencyPenalty, presencePenalty, maxTokens } = request.parameters;

    if (temperature !== undefined && (temperature < 0 || temperature > 2)) {
      throw new OpenRouterError("Temperature must be between 0.0 and 2.0", undefined, "VALIDATION_ERROR");
    }

    if (topP !== undefined && (topP < 0 || topP > 1)) {
      throw new OpenRouterError("topP must be between 0.0 and 1.0", undefined, "VALIDATION_ERROR");
    }

    if (frequencyPenalty !== undefined && (frequencyPenalty < -2 || frequencyPenalty > 2)) {
      throw new OpenRouterError("frequencyPenalty must be between -2.0 and 2.0", undefined, "VALIDATION_ERROR");
    }

    if (presencePenalty !== undefined && (presencePenalty < -2 || presencePenalty > 2)) {
      throw new OpenRouterError("presencePenalty must be between -2.0 and 2.0", undefined, "VALIDATION_ERROR");
    }

    if (maxTokens !== undefined && maxTokens < 1) {
      throw new OpenRouterError("maxTokens must be greater than 0", undefined, "VALIDATION_ERROR");
    }
  }

  // Validate JSON schema if provided
  if (request.responseFormat?.type === "json_schema") {
    validateJsonSchema(request.responseFormat.jsonSchema?.schema);
  }

  // Validate tools if provided
  if (request.tools) {
    for (const tool of request.tools) {
      if (tool.type !== "function") {
        throw new OpenRouterError(`Invalid tool type: ${tool.type}`, undefined, "VALIDATION_ERROR");
      }
      if (!tool.function.name || !tool.function.description) {
        throw new OpenRouterError("Tool function must have name and description", undefined, "VALIDATION_ERROR");
      }
    }
  }
}

/**
 * Validates a JSON schema structure
 * @param schema - The JSON schema to validate
 * @throws {OpenRouterError} If validation fails
 */
export function validateJsonSchema(schema?: JSONSchema): void {
  if (!schema) {
    throw new OpenRouterError(
      "JSON schema is required when using json_schema response format",
      undefined,
      "VALIDATION_ERROR"
    );
  }

  // Check schema size
  const schemaString = JSON.stringify(schema);
  if (schemaString.length > 50000) {
    throw new OpenRouterError("JSON schema too large (max 50KB)", undefined, "VALIDATION_ERROR");
  }

  // Validate schema structure
  if (!schema.type || !schema.properties) {
    throw new OpenRouterError(
      "Invalid JSON schema structure: must have type and properties",
      undefined,
      "VALIDATION_ERROR"
    );
  }
}
