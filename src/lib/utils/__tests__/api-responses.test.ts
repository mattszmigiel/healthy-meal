import { describe, it, expect } from "vitest";
import {
  errorResponse,
  noPreferencesResponse,
  rateLimitResponse,
  notFoundResponse,
  unauthorizedResponse,
  serviceUnavailableResponse,
  timeoutResponse,
  internalServerErrorResponse,
  validationErrorResponse,
} from "../api-responses";

describe("API Response Utilities", () => {
  describe("errorResponse", () => {
    it("should create error response with correct status and body", async () => {
      const response = errorResponse(400, "test_error", "Test error message");

      expect(response.status).toBe(400);
      expect(response.headers.get("Content-Type")).toBe("application/json");

      const body = await response.json();
      expect(body).toEqual({
        error: "test_error",
        message: "Test error message",
      });
    });

    it("should include additional fields when provided", async () => {
      const response = errorResponse(400, "test_error", "Test message", {
        details: ["detail1", "detail2"],
        code: "ERR_001",
      });

      const body = await response.json();
      expect(body).toEqual({
        error: "test_error",
        message: "Test message",
        details: ["detail1", "detail2"],
        code: "ERR_001",
      });
    });
  });

  describe("noPreferencesResponse", () => {
    it("should return 400 with correct error message", async () => {
      const response = noPreferencesResponse();

      expect(response.status).toBe(400);

      const body = await response.json();
      expect(body).toEqual({
        error: "No dietary preferences",
        message: "Please set your dietary preferences before modifying recipes.",
        action: "Navigate to profile settings to add dietary preferences",
      });
    });
  });

  describe("rateLimitResponse", () => {
    it("should return 429 with retry information", async () => {
      const retryAfter = 60;
      const response = rateLimitResponse(retryAfter);

      expect(response.status).toBe(429);
      expect(response.headers.get("Retry-After")).toBe("60");

      const body = await response.json();
      expect(body).toEqual({
        error: "Rate limit exceeded",
        message: "You've made too many AI modification requests. Please wait before trying again.",
        retry_after: 60,
      });
    });
  });

  describe("notFoundResponse", () => {
    it("should return 404 with generic message", async () => {
      const response = notFoundResponse();

      expect(response.status).toBe(404);

      const body = await response.json();
      expect(body.error).toBe("Not found");
      expect(body.message).toBe("Recipe not found or you don't have access to it");
    });
  });

  describe("unauthorizedResponse", () => {
    it("should return 401 with authentication required message", async () => {
      const response = unauthorizedResponse();

      expect(response.status).toBe(401);

      const body = await response.json();
      expect(body.error).toBe("Unauthorized");
      expect(body.message).toBe("Authentication required");
    });
  });

  describe("serviceUnavailableResponse", () => {
    it("should return 503 with service unavailable message", async () => {
      const response = serviceUnavailableResponse();

      expect(response.status).toBe(503);

      const body = await response.json();
      expect(body.error).toBe("AI service unavailable");
    });
  });

  describe("timeoutResponse", () => {
    it("should return 504 with timeout message", async () => {
      const response = timeoutResponse();

      expect(response.status).toBe(504);

      const body = await response.json();
      expect(body.error).toBe("Request timeout");
      expect(body.message).toBe("The AI modification took too long. Please try again.");
    });
  });

  describe("internalServerErrorResponse", () => {
    it("should return 500 with default message when no custom message provided", async () => {
      const response = internalServerErrorResponse();

      expect(response.status).toBe(500);

      const body = await response.json();
      expect(body.error).toBe("Internal server error");
      expect(body.message).toBe("An unexpected error occurred. Please try again.");
    });

    it("should return 500 with custom message when provided", async () => {
      const response = internalServerErrorResponse("Custom error message");

      expect(response.status).toBe(500);

      const body = await response.json();
      expect(body.message).toBe("Custom error message");
    });
  });

  describe("validationErrorResponse", () => {
    it("should return 400 with validation message", async () => {
      const response = validationErrorResponse("Invalid email format");

      expect(response.status).toBe(400);

      const body = await response.json();
      expect(body.error).toBe("Invalid input");
      expect(body.message).toBe("Invalid email format");
    });

    it("should include details array when provided", async () => {
      const details = ["Email is required", "Password must be at least 8 characters"];
      const response = validationErrorResponse("Validation failed", details);

      const body = await response.json();
      expect(body.details).toEqual(details);
    });
  });
});
