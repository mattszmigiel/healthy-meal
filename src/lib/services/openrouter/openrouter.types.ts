// OpenRouter API Types and Interfaces

// ============================================================================
// Type Definitions
// ============================================================================

// JSON Schema type for better type safety
export type JSONSchema = Record<string, unknown>;

// ============================================================================
// API Response Types (Internal)
// ============================================================================

export interface APIResponse {
  id: string;
  model: string;
  created: number;
  choices: {
    index: number;
    message: {
      role: string;
      content: string | null;
      tool_calls?: ToolCall[];
    };
    finish_reason: string;
  }[];
  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
    total_tokens?: number;
  };
}

// ============================================================================
// Configuration Interfaces
// ============================================================================

export interface OpenRouterConfig {
  apiKey: string; // OpenRouter API key
  baseUrl?: string; // Default: 'https://openrouter.ai/api/v1'
  defaultModel?: string; // Default model to use if not specified
  timeout?: number; // Request timeout in ms (default: 30000)
  maxRetries?: number; // Max retry attempts (default: 3)
  retryDelay?: number; // Initial retry delay in ms (default: 1000)
  appName?: string; // Optional app name for OpenRouter analytics
  siteUrl?: string; // Optional site URL for OpenRouter analytics
}

// ============================================================================
// Message Interfaces
// ============================================================================

export interface Message {
  role: "system" | "user" | "assistant" | "tool";
  content: string;
  name?: string; // For tool messages
  toolCallId?: string; // For tool response messages
}

export interface ResponseFormat {
  type: "text" | "json_object" | "json_schema";
  jsonSchema?: {
    name: string; // Schema name
    description?: string; // Schema description
    strict?: boolean; // Enforce strict validation (default: true)
    schema: JSONSchema; // JSON Schema object
  };
}

// ============================================================================
// Model Parameters
// ============================================================================

export interface ModelParameters {
  temperature?: number; // 0.0 to 2.0
  maxTokens?: number; // Max completion tokens
  topP?: number; // Nucleus sampling (0.0 to 1.0)
  frequencyPenalty?: number; // -2.0 to 2.0
  presencePenalty?: number; // -2.0 to 2.0
  stop?: string | string[]; // Stop sequences
  seed?: number; // For reproducible outputs
}

// ============================================================================
// Tool Calling Interfaces
// ============================================================================

export interface Tool {
  type: "function";
  function: {
    name: string;
    description: string;
    parameters: JSONSchema; // JSON Schema for function parameters
  };
}

export type ToolChoice = "none" | "auto" | "required" | { type: "function"; function: { name: string } };

export interface ToolCall {
  id: string;
  type: "function";
  function: {
    name: string;
    arguments: string; // JSON string of arguments
  };
}

// ============================================================================
// Request Interfaces
// ============================================================================

export interface ChatRequest {
  messages: Message[]; // Conversation history
  model?: string; // Model to use (overrides default)
  responseFormat?: ResponseFormat; // Structured output configuration
  parameters?: ModelParameters; // Model-specific parameters
  tools?: Tool[]; // Function calling tools
  toolChoice?: ToolChoice; // Tool selection strategy
}

// ============================================================================
// Response Interfaces
// ============================================================================

export interface Choice {
  index: number;
  message: {
    role: "assistant" | "tool";
    content: string | null;
    toolCalls?: ToolCall[];
  };
  finishReason: "stop" | "length" | "tool_calls" | "content_filter" | "error";
}

export interface Usage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

export interface ChatResponse {
  id: string;
  model: string;
  created: number;
  choices: Choice[];
  usage: Usage;
}

// ============================================================================
// Error Class
// ============================================================================

export class OpenRouterError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public errorType?: string,
    public details?: unknown
  ) {
    super(message);
    this.name = "OpenRouterError";

    // Maintain proper stack trace (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, OpenRouterError);
    }
  }
}
