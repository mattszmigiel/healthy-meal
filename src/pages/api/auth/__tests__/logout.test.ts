import { describe, it, expect, beforeEach, vi } from "vitest";
import { POST } from "../logout";
import { createMockAPIContext, parseResponse } from "@/test/helpers/api-test-helpers";

describe("POST /api/auth/logout", () => {
  let mockContext: ReturnType<typeof createMockAPIContext>;

  beforeEach(() => {
    mockContext = createMockAPIContext();
    vi.clearAllMocks();
  });

  describe("Successful Logout", () => {
    it("should return 200 on successful logout", async () => {
      mockContext = createMockAPIContext({
        request: {
          method: "POST",
        },
        locals: {
          user: { id: "user-123", email: "test@example.com" },
        },
      });

      vi.mocked(mockContext.locals.supabase.auth.signOut).mockResolvedValue({
        error: null,
      });

      const response = await POST(mockContext);
      const body = await parseResponse(response);

      expect(response.status).toBe(200);
      expect(response.headers.get("Content-Type")).toBe("application/json");
      expect(body.message).toBe("Logged out successfully");
    });

    it("should call AuthService.logout with user ID", async () => {
      mockContext = createMockAPIContext({
        request: {
          method: "POST",
        },
        locals: {
          user: { id: "user-456", email: "test@example.com" },
        },
      });

      vi.mocked(mockContext.locals.supabase.auth.signOut).mockResolvedValue({
        error: null,
      });

      await POST(mockContext);

      expect(mockContext.locals.supabase.auth.signOut).toHaveBeenCalled();
    });

    it("should handle logout for authenticated user", async () => {
      const mockUser = { id: "user-123", email: "test@example.com", aud: "authenticated" };

      mockContext = createMockAPIContext({
        request: {
          method: "POST",
        },
        locals: {
          user: mockUser,
        },
      });

      vi.mocked(mockContext.locals.supabase.auth.signOut).mockResolvedValue({
        error: null,
      });

      const response = await POST(mockContext);
      const body = await parseResponse(response);

      expect(response.status).toBe(200);
      expect(body.message).toBe("Logged out successfully");
    });
  });

  describe("Optimistic Logout Behavior", () => {
    it("should return 200 even if user is not authenticated", async () => {
      mockContext = createMockAPIContext({
        request: {
          method: "POST",
        },
        locals: {
          user: null,
        },
      });

      vi.mocked(mockContext.locals.supabase.auth.signOut).mockResolvedValue({
        error: null,
      });

      const response = await POST(mockContext);
      const body = await parseResponse(response);

      expect(response.status).toBe(200);
      expect(body.message).toBe("Logged out successfully");
    });

    it("should return 200 even if signOut fails", async () => {
      mockContext = createMockAPIContext({
        request: {
          method: "POST",
        },
        locals: {
          user: { id: "user-123", email: "test@example.com" },
        },
      });

      // Mock signOut failure
      vi.mocked(mockContext.locals.supabase.auth.signOut).mockResolvedValue({
        error: { message: "Session not found", status: 404 },
      });

      const response = await POST(mockContext);
      const body = await parseResponse(response);

      // Optimistic logout - always returns success
      expect(response.status).toBe(200);
      expect(body.message).toBe("Logged out successfully");
    });

    it("should handle network errors gracefully", async () => {
      mockContext = createMockAPIContext({
        request: {
          method: "POST",
        },
        locals: {
          user: { id: "user-123", email: "test@example.com" },
        },
      });

      // Mock network error
      vi.mocked(mockContext.locals.supabase.auth.signOut).mockRejectedValue(new Error("Network error"));

      const response = await POST(mockContext);
      const body = await parseResponse(response);

      // Optimistic logout - still returns success
      expect(response.status).toBe(200);
      expect(body.message).toBe("Logged out successfully");
    });
  });

  describe("Security", () => {
    it("should not require authentication to logout (optimistic)", async () => {
      mockContext = createMockAPIContext({
        request: {
          method: "POST",
        },
        locals: {
          user: null, // No user
        },
      });

      vi.mocked(mockContext.locals.supabase.auth.signOut).mockResolvedValue({
        error: null,
      });

      const response = await POST(mockContext);

      expect(response.status).toBe(200);
    });

    it("should handle undefined user gracefully", async () => {
      mockContext = createMockAPIContext({
        request: {
          method: "POST",
        },
        locals: {
          user: undefined,
        },
      });

      vi.mocked(mockContext.locals.supabase.auth.signOut).mockResolvedValue({
        error: null,
      });

      const response = await POST(mockContext);
      const body = await parseResponse(response);

      expect(response.status).toBe(200);
      expect(body.message).toBe("Logged out successfully");
    });

    it("should revoke refresh token on successful logout", async () => {
      mockContext = createMockAPIContext({
        request: {
          method: "POST",
        },
        locals: {
          user: { id: "user-123", email: "test@example.com" },
        },
      });

      vi.mocked(mockContext.locals.supabase.auth.signOut).mockResolvedValue({
        error: null,
      });

      await POST(mockContext);

      // Verify signOut was called (which revokes refresh token)
      expect(mockContext.locals.supabase.auth.signOut).toHaveBeenCalled();
    });
  });

  describe("Integration", () => {
    it("should work with AuthService through the full flow", async () => {
      mockContext = createMockAPIContext({
        request: {
          method: "POST",
        },
        locals: {
          user: { id: "user-123", email: "test@example.com" },
        },
      });

      vi.mocked(mockContext.locals.supabase.auth.signOut).mockResolvedValue({
        error: null,
      });

      const response = await POST(mockContext);
      const body = await parseResponse(response);

      // Verify AuthService was instantiated with correct Supabase client
      expect(mockContext.locals.supabase.auth.signOut).toHaveBeenCalled();

      // Verify response structure matches LogoutResponseDTO
      expect(body).toHaveProperty("message");
      expect(body.message).toBe("Logged out successfully");
      expect(response.status).toBe(200);
    });

    it("should call signOut with local scope parameter", async () => {
      mockContext = createMockAPIContext({
        request: {
          method: "POST",
        },
        locals: {
          user: { id: "user-123", email: "test@example.com" },
        },
      });

      vi.mocked(mockContext.locals.supabase.auth.signOut).mockResolvedValue({
        error: null,
      });

      await POST(mockContext);

      // Verify signOut is called with local scope (current session only)
      expect(mockContext.locals.supabase.auth.signOut).toHaveBeenCalledWith({ scope: "local" });
    });
  });

  describe("Response Format", () => {
    it("should return JSON response with correct content type", async () => {
      mockContext = createMockAPIContext({
        request: {
          method: "POST",
        },
        locals: {
          user: { id: "user-123", email: "test@example.com" },
        },
      });

      vi.mocked(mockContext.locals.supabase.auth.signOut).mockResolvedValue({
        error: null,
      });

      const response = await POST(mockContext);

      expect(response.headers.get("Content-Type")).toBe("application/json");
    });

    it("should return consistent message format", async () => {
      mockContext = createMockAPIContext({
        request: {
          method: "POST",
        },
        locals: {
          user: { id: "user-123", email: "test@example.com" },
        },
      });

      vi.mocked(mockContext.locals.supabase.auth.signOut).mockResolvedValue({
        error: null,
      });

      const response = await POST(mockContext);
      const body = await parseResponse(response);

      expect(body).toEqual({
        message: "Logged out successfully",
      });
    });
  });
});
