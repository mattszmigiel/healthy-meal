// OpenRouter API Transformation Functions

import type { APIResponse, ChatRequest, ChatResponse, Choice, Usage } from "./openrouter.types";
import { OpenRouterError } from "./openrouter.types";

// ============================================================================
// Request Transformation
// ============================================================================

/**
 * Transforms internal ChatRequest to OpenRouter API format
 * @param request - The chat request to transform
 * @param defaultModel - Default model to use if not specified in request
 * @returns API-compatible request object
 */
export function transformRequest(request: ChatRequest, defaultModel: string): Record<string, unknown> {
  const apiRequest: Record<string, unknown> = {
    messages: request.messages,
    model: request.model || defaultModel,
  };

  // Transform response format
  if (request.responseFormat) {
    if (request.responseFormat.type === "json_schema") {
      apiRequest.response_format = {
        type: "json_schema",
        json_schema: request.responseFormat.jsonSchema,
      };
    } else {
      apiRequest.response_format = {
        type: request.responseFormat.type,
      };
    }
  }

  // Transform parameters to root-level API parameters
  if (request.parameters) {
    const params = request.parameters;

    if (params.temperature !== undefined) {
      apiRequest.temperature = params.temperature;
    }
    if (params.maxTokens !== undefined) {
      apiRequest.max_tokens = params.maxTokens;
    }
    if (params.topP !== undefined) {
      apiRequest.top_p = params.topP;
    }
    if (params.frequencyPenalty !== undefined) {
      apiRequest.frequency_penalty = params.frequencyPenalty;
    }
    if (params.presencePenalty !== undefined) {
      apiRequest.presence_penalty = params.presencePenalty;
    }
    if (params.stop !== undefined) {
      apiRequest.stop = params.stop;
    }
    if (params.seed !== undefined) {
      apiRequest.seed = params.seed;
    }
  }

  // Add tools and tool_choice if provided
  if (request.tools) {
    apiRequest.tools = request.tools;
  }
  if (request.toolChoice) {
    apiRequest.tool_choice = request.toolChoice;
  }

  return apiRequest;
}

// ============================================================================
// Response Transformation
// ============================================================================

/**
 * Transforms OpenRouter API response to internal ChatResponse format
 * @param response - The API response to transform
 * @returns Transformed chat response
 * @throws {OpenRouterError} If response structure is invalid
 */
export function transformResponse(response: APIResponse): ChatResponse {
  // Validate response structure
  if (!response.choices || !Array.isArray(response.choices)) {
    throw new OpenRouterError("Invalid response format: missing choices array", undefined, "RESPONSE_ERROR", response);
  }

  if (response.choices.length === 0) {
    throw new OpenRouterError("Invalid response format: choices array is empty", undefined, "RESPONSE_ERROR", response);
  }

  // Transform usage data
  const usage: Usage = {
    promptTokens: response.usage?.prompt_tokens || 0,
    completionTokens: response.usage?.completion_tokens || 0,
    totalTokens: response.usage?.total_tokens || 0,
  };

  // Transform choices
  const choices: Choice[] = response.choices.map((choice) => ({
    index: choice.index,
    message: {
      role: choice.message.role as "assistant" | "tool",
      content: choice.message.content,
      toolCalls: choice.message.tool_calls,
    },
    finishReason: choice.finish_reason as Choice["finishReason"],
  }));

  return {
    id: response.id,
    model: response.model,
    created: response.created,
    choices,
    usage,
  };
}
