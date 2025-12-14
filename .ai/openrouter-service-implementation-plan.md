# OpenRouter Service Implementation Plan

## 1. Service Description

The OpenRouter service is a TypeScript-based client wrapper for the OpenRouter API that provides a unified interface for interacting with multiple LLM providers (OpenAI, Anthropic, Google, etc.) through a single endpoint. This service will handle chat completions with support for:

- System and user messages
- Structured responses via JSON schema validation
- Model selection and configuration
- Streaming and non-streaming responses
- Error handling and retry logic
- Type-safe request/response handling

The service will be implemented as a reusable TypeScript class that can be instantiated throughout the Astro application, particularly in API routes and server-side services.

## 2. Constructor Description

### Purpose
Initialize the OpenRouter service with configuration and authentication credentials.

### Constructor Signature
```typescript
constructor(config: OpenRouterConfig)
```

### Configuration Interface
```typescript
interface OpenRouterConfig {
  apiKey: string;                    // OpenRouter API key
  baseUrl?: string;                  // Default: 'https://openrouter.ai/api/v1'
  defaultModel?: string;             // Default model to use if not specified
  timeout?: number;                  // Request timeout in ms (default: 30000)
  maxRetries?: number;               // Max retry attempts (default: 3)
  retryDelay?: number;               // Initial retry delay in ms (default: 1000)
  appName?: string;                  // Optional app name for OpenRouter analytics
  siteUrl?: string;                  // Optional site URL for OpenRouter analytics
}
```

### Implementation Details
- Validate that `apiKey` is provided (throw error if missing)
- Set default values for optional configuration
- Store configuration in private class fields
- Initialize any internal state (e.g., retry counters, request tracking)

## 3. Public Methods and Fields

### 3.1 Main Chat Completion Method

```typescript
async chat(request: ChatRequest): Promise<ChatResponse>
```

**Purpose**: Send a chat completion request to OpenRouter API.

**Request Interface**:
```typescript
interface ChatRequest {
  messages: Message[];               // Conversation history
  model?: string;                    // Model to use (overrides default)
  responseFormat?: ResponseFormat;   // Structured output configuration
  parameters?: ModelParameters;      // Model-specific parameters
  stream?: boolean;                  // Enable streaming (default: false)
  tools?: Tool[];                    // Function calling tools
  toolChoice?: ToolChoice;           // Tool selection strategy
}

interface Message {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string;
  name?: string;                     // For tool messages
  toolCallId?: string;               // For tool response messages
}

interface ResponseFormat {
  type: 'text' | 'json_object' | 'json_schema';
  jsonSchema?: {
    name: string;                    // Schema name
    description?: string;            // Schema description
    strict?: boolean;                // Enforce strict validation (default: true)
    schema: Record<string, any>;     // JSON Schema object
  };
}

interface ModelParameters {
  temperature?: number;              // 0.0 to 2.0
  maxTokens?: number;                // Max completion tokens
  topP?: number;                     // Nucleus sampling (0.0 to 1.0)
  frequencyPenalty?: number;         // -2.0 to 2.0
  presencePenalty?: number;          // -2.0 to 2.0
  stop?: string | string[];          // Stop sequences
  seed?: number;                     // For reproducible outputs
}

interface Tool {
  type: 'function';
  function: {
    name: string;
    description: string;
    parameters: Record<string, any>; // JSON Schema for function parameters
  };
}

type ToolChoice = 'none' | 'auto' | 'required' | { type: 'function'; function: { name: string } };
```

**Response Interface**:
```typescript
interface ChatResponse {
  id: string;
  model: string;
  created: number;
  choices: Choice[];
  usage: Usage;
}

interface Choice {
  index: number;
  message: {
    role: 'assistant' | 'tool';
    content: string | null;
    toolCalls?: ToolCall[];
  };
  finishReason: 'stop' | 'length' | 'tool_calls' | 'content_filter' | 'error';
}

interface ToolCall {
  id: string;
  type: 'function';
  function: {
    name: string;
    arguments: string;               // JSON string of arguments
  };
}

interface Usage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}
```

### 3.2 Streaming Chat Completion Method

```typescript
async chatStream(request: ChatRequest): Promise<AsyncIterable<ChatStreamChunk>>
```

**Purpose**: Send a streaming chat completion request.

**Stream Chunk Interface**:
```typescript
interface ChatStreamChunk {
  id: string;
  model: string;
  created: number;
  choices: StreamChoice[];
}

interface StreamChoice {
  index: number;
  delta: {
    role?: 'assistant';
    content?: string;
    toolCalls?: ToolCall[];
  };
  finishReason?: 'stop' | 'length' | 'tool_calls' | 'content_filter' | 'error';
}
```

**Implementation Notes**:
- Return an async iterable for streaming responses
- Handle Server-Sent Events (SSE) parsing
- Emit chunks as they arrive
- Handle connection errors and reconnection logic

### 3.3 Helper Methods

```typescript
// Create a properly formatted system message
createSystemMessage(content: string): Message

// Create a properly formatted user message
createUserMessage(content: string): Message

// Create a properly formatted assistant message
createAssistantMessage(content: string): Message

// Build JSON schema response format
createJsonSchemaFormat(
  name: string,
  schema: Record<string, any>,
  options?: { description?: string; strict?: boolean }
): ResponseFormat
```

### 3.4 Model Information Method

```typescript
async getAvailableModels(): Promise<ModelInfo[]>

interface ModelInfo {
  id: string;
  name: string;
  description?: string;
  pricing?: {
    prompt: number;                  // Cost per 1M tokens
    completion: number;              // Cost per 1M tokens
  };
  contextLength?: number;
}
```

## 4. Private Methods and Fields

### 4.1 Private Fields

```typescript
private readonly config: Required<OpenRouterConfig>;
private readonly headers: Record<string, string>;
```

### 4.2 HTTP Request Method

```typescript
private async makeRequest<T>(
  endpoint: string,
  body: Record<string, any>,
  options?: { stream?: boolean }
): Promise<T>
```

**Purpose**: Handle HTTP communication with OpenRouter API.

**Responsibilities**:
1. Construct full URL from base URL and endpoint
2. Set required headers (Authorization, Content-Type, etc.)
3. Add optional headers (HTTP-Referer, X-Title) for analytics
4. Send POST request with JSON body
5. Handle response parsing
6. Throw errors for non-2xx responses

**Headers to Include**:
```typescript
{
  'Authorization': `Bearer ${this.config.apiKey}`,
  'Content-Type': 'application/json',
  'HTTP-Referer': this.config.siteUrl || '',     // Optional, for rankings
  'X-Title': this.config.appName || '',          // Optional, for rankings
}
```

### 4.3 Request Transformation Method

```typescript
private transformRequest(request: ChatRequest): Record<string, any>
```

**Purpose**: Transform internal `ChatRequest` to OpenRouter API format.

**Transformations**:
1. Map `messages` array to API format
2. Add model selection (use provided or default)
3. Transform `responseFormat` to API's `response_format`:
   - `type: 'json_schema'` → `{ type: 'json_schema', json_schema: {...} }`
4. Transform `parameters` to root-level API parameters:
   - `maxTokens` → `max_tokens`
   - `topP` → `top_p`
   - `frequencyPenalty` → `frequency_penalty`
   - `presencePenalty` → `presence_penalty`
5. Add `stream` flag if applicable
6. Add `tools` and `tool_choice` if provided

**Example Transformation**:
```typescript
// Input
const request: ChatRequest = {
  messages: [
    { role: 'system', content: 'You are a helpful assistant.' },
    { role: 'user', content: 'What is the capital of France?' }
  ],
  model: 'openai/gpt-4',
  responseFormat: {
    type: 'json_schema',
    jsonSchema: {
      name: 'answer_schema',
      strict: true,
      schema: {
        type: 'object',
        properties: {
          answer: { type: 'string' },
          confidence: { type: 'number' }
        },
        required: ['answer', 'confidence'],
        additionalProperties: false
      }
    }
  },
  parameters: {
    temperature: 0.7,
    maxTokens: 500
  }
};

// Output (sent to API)
{
  "messages": [
    { "role": "system", "content": "You are a helpful assistant." },
    { "role": "user", "content": "What is the capital of France?" }
  ],
  "model": "openai/gpt-4",
  "response_format": {
    "type": "json_schema",
    "json_schema": {
      "name": "answer_schema",
      "strict": true,
      "schema": {
        "type": "object",
        "properties": {
          "answer": { "type": "string" },
          "confidence": { "type": "number" }
        },
        "required": ["answer", "confidence"],
        "additionalProperties": false
      }
    }
  },
  "temperature": 0.7,
  "max_tokens": 500
}
```

### 4.4 Response Transformation Method

```typescript
private transformResponse(response: any): ChatResponse
```

**Purpose**: Transform OpenRouter API response to internal `ChatResponse` format.

**Transformations**:
1. Map API response fields to internal interface
2. Parse and validate response structure
3. Handle missing or null fields gracefully
4. Parse JSON content if `response_format` was `json_schema` or `json_object`

### 4.5 Retry Logic Method

```typescript
private async retryWithBackoff<T>(
  operation: () => Promise<T>,
  attempt: number = 0
): Promise<T>
```

**Purpose**: Implement exponential backoff retry logic.

**Retry Conditions**:
- Network errors (ECONNREFUSED, ETIMEDOUT, etc.)
- HTTP 429 (rate limiting)
- HTTP 500, 502, 503, 504 (server errors)

**Backoff Formula**:
```typescript
delay = retryDelay * Math.pow(2, attempt) + randomJitter
```

**Stop Conditions**:
- Maximum retries reached
- Non-retryable error (400, 401, 403, etc.)
- Successful response

### 4.6 Validation Method

```typescript
private validateRequest(request: ChatRequest): void
```

**Purpose**: Validate request before sending to API.

**Validations**:
1. Messages array is not empty
2. At least one message exists
3. Message roles are valid
4. Model is specified (either in request or config)
5. Response format schema is valid JSON Schema (if provided)
6. Parameters are within valid ranges
7. Tools are properly formatted (if provided)

### 4.7 Error Parsing Method

```typescript
private parseError(error: any): OpenRouterError
```

**Purpose**: Parse API errors into structured error objects.

**Error Structure**:
```typescript
class OpenRouterError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public errorType?: string,
    public details?: any
  ) {
    super(message);
    this.name = 'OpenRouterError';
  }
}
```

### 4.8 Stream Parsing Method

```typescript
private async *parseSSEStream(
  response: Response
): AsyncIterable<ChatStreamChunk>
```

**Purpose**: Parse Server-Sent Events stream from API.

**Implementation**:
1. Read response body as stream
2. Parse SSE format (data: prefix, double newline separators)
3. Parse JSON from each data chunk
4. Yield transformed chunks
5. Handle `[DONE]` message
6. Handle connection errors and incomplete streams

## 5. Error Handling

### 5.1 Error Categories

**1. Configuration Errors**
- Missing API key
- Invalid base URL
- Invalid timeout or retry settings

**2. Validation Errors**
- Empty messages array
- Invalid message roles
- Invalid model name
- Malformed JSON schema
- Parameters out of range
- Invalid tool definitions

**3. Network Errors**
- Connection timeout
- Connection refused
- DNS resolution failure
- Network unreachable

**4. API Errors**
- 400 Bad Request: Invalid parameters, malformed request
- 401 Unauthorized: Invalid or missing API key
- 403 Forbidden: Insufficient permissions
- 429 Too Many Requests: Rate limit exceeded
- 500 Internal Server Error: OpenRouter server error
- 502 Bad Gateway: Upstream provider error
- 503 Service Unavailable: Temporary outage
- 504 Gateway Timeout: Upstream provider timeout

**5. Response Errors**
- Invalid response format
- Missing required fields
- JSON parsing errors
- Unexpected finish_reason

### 5.2 Error Handling Strategy

```typescript
// Configuration errors: Throw immediately in constructor
if (!config.apiKey) {
  throw new OpenRouterError('API key is required', undefined, 'CONFIG_ERROR');
}

// Validation errors: Throw before making request
private validateRequest(request: ChatRequest): void {
  if (!request.messages || request.messages.length === 0) {
    throw new OpenRouterError(
      'Messages array cannot be empty',
      undefined,
      'VALIDATION_ERROR'
    );
  }
}

// Network errors: Retry with backoff
async chat(request: ChatRequest): Promise<ChatResponse> {
  return this.retryWithBackoff(async () => {
    // Make request
  });
}

// API errors: Parse and throw with context
private async handleApiError(response: Response): Promise<never> {
  const body = await response.json().catch(() => ({}));
  throw new OpenRouterError(
    body.error?.message || `API request failed with status ${response.status}`,
    response.status,
    body.error?.type || 'API_ERROR',
    body.error
  );
}

// Response errors: Throw with details
private transformResponse(response: any): ChatResponse {
  if (!response.choices || !Array.isArray(response.choices)) {
    throw new OpenRouterError(
      'Invalid response format: missing choices array',
      undefined,
      'RESPONSE_ERROR',
      response
    );
  }
}
```

### 5.3 Error Logging

Implement structured logging for all errors:

```typescript
private logError(error: OpenRouterError, context: Record<string, any>): void {
  console.error('[OpenRouter]', {
    message: error.message,
    statusCode: error.statusCode,
    errorType: error.errorType,
    context,
    timestamp: new Date().toISOString()
  });
}
```

## 6. Security Considerations

### 6.1 API Key Management

**Best Practices**:
1. **Never hardcode API keys** in source code
2. Store API key in environment variables (`OPENROUTER_API_KEY`)
3. Access via `import.meta.env.OPENROUTER_API_KEY` in Astro
4. Never log API key in error messages or logs
5. Mask API key in debug output (show only last 4 characters)

**Example**:
```typescript
// In .env file
OPENROUTER_API_KEY=sk_or_v1_1234567890abcdef...

// In service initialization
const openRouterService = new OpenRouterService({
  apiKey: import.meta.env.OPENROUTER_API_KEY
});
```

### 6.2 Input Validation and Sanitization

**Protect Against**:
1. **Prompt injection**: Validate and sanitize user inputs before adding to messages
2. **Excessive token usage**: Set reasonable `maxTokens` limits
3. **Malicious JSON schemas**: Validate schema structure and size
4. **Tool injection**: Validate tool definitions and parameters

**Implementation**:
```typescript
private sanitizeUserInput(input: string): string {
  // Remove or escape potentially dangerous content
  // Limit input length
  const maxLength = 10000;
  return input.slice(0, maxLength).trim();
}

private validateJsonSchema(schema: Record<string, any>): void {
  // Check schema size
  const schemaString = JSON.stringify(schema);
  if (schemaString.length > 50000) {
    throw new OpenRouterError('JSON schema too large', undefined, 'VALIDATION_ERROR');
  }

  // Validate schema structure
  if (!schema.type || !schema.properties) {
    throw new OpenRouterError('Invalid JSON schema structure', undefined, 'VALIDATION_ERROR');
  }
}
```

### 6.3 Rate Limiting

**Client-Side Protection**:
```typescript
private requestQueue: Promise<any>[] = [];
private readonly maxConcurrentRequests = 5;

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
```

### 6.4 Response Validation

**Validate All Responses**:
1. Check response structure matches expected format
2. Validate content is safe (no XSS vectors if displaying in UI)
3. Verify JSON schema compliance if structured output requested
4. Check token usage is within expected bounds

### 6.5 HTTPS and Transport Security

**Requirements**:
1. Always use HTTPS (default OpenRouter base URL uses HTTPS)
2. Validate SSL certificates (don't disable verification)
3. Use secure random number generation for retry jitter

## 7. Step-by-Step Implementation Plan

### Phase 1: Core Service Structure (Priority: High)

**Step 1.1**: Create service file
- Create `src/lib/services/openrouter.service.ts`
- Import required types from Node.js and standard library

**Step 1.2**: Define TypeScript interfaces
- Create all interfaces in order:
  1. `OpenRouterConfig`
  2. `Message`, `ResponseFormat`, `ModelParameters`
  3. `ChatRequest`
  4. `ChatResponse`, `Choice`, `Usage`
  5. `Tool`, `ToolCall`, `ToolChoice`
  6. `ChatStreamChunk`, `StreamChoice`
  7. `ModelInfo`

**Step 1.3**: Create error class
- Define `OpenRouterError` extending `Error`
- Add properties: `statusCode`, `errorType`, `details`
- Implement proper error name setting

**Step 1.4**: Implement constructor
- Create class `OpenRouterService`
- Define private fields: `config`, `headers`
- Implement constructor with validation
- Set default configuration values
- Initialize headers object

### Phase 2: Request/Response Handling (Priority: High)

**Step 2.1**: Implement validation method
- Create `validateRequest(request: ChatRequest): void`
- Add all validations listed in section 4.6
- Throw `OpenRouterError` with descriptive messages

**Step 2.2**: Implement request transformation
- Create `transformRequest(request: ChatRequest): Record<string, any>`
- Map all fields from internal format to API format
- Pay special attention to `response_format` structure
- Handle optional fields correctly

**Step 2.3**: Implement response transformation
- Create `transformResponse(response: any): ChatResponse`
- Map API response to internal format
- Add null/undefined checks
- Handle edge cases (empty choices, missing fields)

**Step 2.4**: Implement HTTP request method
- Create `makeRequest<T>(endpoint, body, options): Promise<T>`
- Set up fetch request with proper headers
- Handle response status codes
- Parse JSON response
- Add timeout handling

### Phase 3: Error Handling and Resilience (Priority: High)

**Step 3.1**: Implement error parsing
- Create `parseError(error: any): OpenRouterError`
- Handle different error types (network, API, validation)
- Extract error details from API responses
- Set appropriate error codes and types

**Step 3.2**: Implement retry logic
- Create `retryWithBackoff<T>(operation, attempt): Promise<T>`
- Implement exponential backoff formula
- Add random jitter to prevent thundering herd
- Handle retry-able vs non-retry-able errors
- Respect max retry limit

**Step 3.3**: Add error logging
- Create `logError(error, context): void`
- Implement structured logging
- Mask sensitive information (API keys)
- Include relevant context

### Phase 4: Main Chat Functionality (Priority: High)

**Step 4.1**: Implement helper methods
- Create `createSystemMessage(content): Message`
- Create `createUserMessage(content): Message`
- Create `createAssistantMessage(content): Message`
- Create `createJsonSchemaFormat(name, schema, options): ResponseFormat`

**Step 4.2**: Implement main chat method
- Create `chat(request: ChatRequest): Promise<ChatResponse>`
- Call validation
- Transform request
- Wrap in retry logic
- Make HTTP request
- Transform response
- Handle errors
- Return result

**Step 4.3**: Test with basic examples
- Test simple text completion
- Test with system message
- Test with conversation history
- Test with model parameters

### Phase 5: Structured Outputs (Priority: High)

**Step 5.1**: Implement JSON schema validation
- Create `validateJsonSchema(schema): void`
- Check schema structure
- Validate required fields
- Check schema size limits

**Step 5.2**: Test structured responses
- Test with simple JSON object response
- Test with complex JSON schema
- Test with strict mode enabled
- Verify response parsing

**Step 5.3**: Create JSON schema examples
- Document common schema patterns
- Create helper for common types
- Add validation examples

### Phase 6: Streaming Support (Priority: Medium)

**Step 6.1**: Implement SSE parsing
- Create `parseSSEStream(response): AsyncIterable<ChatStreamChunk>`
- Parse SSE format correctly
- Handle data: prefix and line breaks
- Parse JSON from each chunk
- Handle [DONE] message

**Step 6.2**: Implement streaming method
- Create `chatStream(request: ChatRequest): Promise<AsyncIterable<ChatStreamChunk>>`
- Set stream flag in request
- Call API with streaming enabled
- Return async iterable
- Handle errors in stream

**Step 6.3**: Test streaming
- Test basic streaming response
- Test error handling in streams
- Test stream cancellation
- Verify chunk parsing

### Phase 7: Advanced Features (Priority: Medium)

**Step 7.1**: Implement tool calling support
- Add tool validation
- Test function calling
- Handle tool responses
- Test multi-turn tool conversations

**Step 7.2**: Implement model information method
- Create `getAvailableModels(): Promise<ModelInfo[]>`
- Fetch from OpenRouter models API
- Parse and transform response
- Cache results if appropriate

**Step 7.3**: Add input sanitization
- Create `sanitizeUserInput(input): string`
- Implement length limits
- Add content filtering if needed
- Test with various inputs

### Phase 8: Security Hardening (Priority: High)

**Step 8.1**: Review API key handling
- Verify no API key logging
- Implement masking in debug output
- Check environment variable usage
- Document security best practices

**Step 8.2**: Implement rate limiting
- Create request queue
- Add throttling logic
- Test concurrent request limits
- Document rate limit configuration

**Step 8.3**: Add response validation
- Validate response structure
- Check for unexpected data
- Verify JSON schema compliance
- Test with malformed responses

### Phase 9: Integration and Testing (Priority: High)

**Step 9.1**: Create service instance factory
- Create factory function in `src/lib/services/index.ts`
- Load configuration from environment
- Export singleton instance
- Document usage patterns

**Step 9.2**: Create example API endpoint
- Create test endpoint in `src/pages/api/chat/test.ts`
- Use service to handle chat request
- Return structured response
- Add error handling

**Step 9.3**: Integration testing
- Test with real API (using test API key)
- Test all error scenarios
- Test retry logic with simulated failures
- Test rate limiting
- Verify security measures

**Step 9.4**: Create usage documentation
- Document all public methods
- Provide code examples for common use cases
- Document error handling patterns
- Create troubleshooting guide

### Phase 10: Optimization and Monitoring (Priority: Low)

**Step 10.1**: Add request/response logging
- Log request metadata (model, token count estimates)
- Log response metadata (actual token usage)
- Track response times
- Monitor error rates

**Step 10.2**: Implement caching (if applicable)
- Add optional response caching
- Implement cache key generation
- Add cache invalidation logic
- Document caching behavior

**Step 10.3**: Performance optimization
- Profile hot paths
- Optimize JSON parsing
- Reduce memory allocations
- Optimize stream processing

**Step 10.4**: Add metrics and monitoring
- Track API usage statistics
- Monitor token consumption
- Track error rates by type
- Export metrics for monitoring systems

---

## Example Usage Patterns

### Basic Chat Completion

```typescript
import { OpenRouterService } from '@/lib/services/openrouter.service';

const service = new OpenRouterService({
  apiKey: import.meta.env.OPENROUTER_API_KEY,
  defaultModel: 'openai/gpt-4'
});

const response = await service.chat({
  messages: [
    service.createSystemMessage('You are a helpful cooking assistant.'),
    service.createUserMessage('What ingredients do I need for carbonara?')
  ],
  parameters: {
    temperature: 0.7,
    maxTokens: 500
  }
});

console.log(response.choices[0].message.content);
```

### Structured Output with JSON Schema

```typescript
const recipeSchema = {
  type: 'object',
  properties: {
    name: { type: 'string' },
    ingredients: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          item: { type: 'string' },
          quantity: { type: 'string' }
        },
        required: ['item', 'quantity'],
        additionalProperties: false
      }
    },
    steps: {
      type: 'array',
      items: { type: 'string' }
    }
  },
  required: ['name', 'ingredients', 'steps'],
  additionalProperties: false
};

const response = await service.chat({
  messages: [
    service.createUserMessage('Create a recipe for spaghetti carbonara')
  ],
  model: 'openai/gpt-4',
  responseFormat: service.createJsonSchemaFormat(
    'recipe_format',
    recipeSchema,
    { strict: true, description: 'A structured recipe format' }
  )
});

const recipe = JSON.parse(response.choices[0].message.content!);
console.log(recipe.name, recipe.ingredients);
```

### Streaming Response

```typescript
const stream = await service.chatStream({
  messages: [
    service.createUserMessage('Write a detailed recipe for carbonara')
  ],
  parameters: {
    temperature: 0.8,
    maxTokens: 1000
  }
});

for await (const chunk of stream) {
  const content = chunk.choices[0]?.delta?.content;
  if (content) {
    process.stdout.write(content);
  }
}
```

### Using in Astro API Route

```typescript
// src/pages/api/chat.ts
import type { APIRoute } from 'astro';
import { OpenRouterService } from '@/lib/services/openrouter.service';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  try {
    const { messages, model, responseFormat } = await request.json();

    const service = new OpenRouterService({
      apiKey: import.meta.env.OPENROUTER_API_KEY,
      defaultModel: 'openai/gpt-4'
    });

    const response = await service.chat({
      messages,
      model,
      responseFormat,
      parameters: {
        temperature: 0.7,
        maxTokens: 1000
      }
    });

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Chat API error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: error.statusCode || 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
```

---

## Testing Checklist

- [ ] Service initialization with valid config
- [ ] Service initialization with missing API key (should throw)
- [ ] Basic chat completion
- [ ] Chat with system message
- [ ] Chat with conversation history
- [ ] Chat with model parameters (temperature, maxTokens, etc.)
- [ ] Structured output with json_object
- [ ] Structured output with json_schema
- [ ] Structured output with strict mode
- [ ] Streaming chat completion
- [ ] Streaming with error in middle of stream
- [ ] Helper methods (createSystemMessage, etc.)
- [ ] Request validation (empty messages, invalid roles, etc.)
- [ ] Error handling for 400 Bad Request
- [ ] Error handling for 401 Unauthorized
- [ ] Error handling for 429 Rate Limit
- [ ] Error handling for 500 Server Error
- [ ] Retry logic with exponential backoff
- [ ] Max retry limit enforcement
- [ ] Network error handling
- [ ] Timeout handling
- [ ] API key masking in logs
- [ ] Rate limiting (concurrent requests)
- [ ] Response validation
- [ ] Tool calling (if implemented)
- [ ] Model information retrieval (if implemented)

---

## References

- [OpenRouter API Documentation](https://openrouter.ai/docs/api/reference/overview)
- [OpenRouter Chat Completions](https://openrouter.ai/docs/api/api-reference/chat/send-chat-completion-request)
- [OpenRouter Quickstart](https://openrouter.ai/docs/quickstart)
- [JSON Schema Specification](https://json-schema.org/)
