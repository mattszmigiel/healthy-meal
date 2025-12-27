import { describe, it, expect } from "vitest";
import {
  LoginFormSchema,
  RegisterFormSchema,
  ResetPasswordRequestSchema,
  ResetPasswordConfirmSchema,
  LoginRequestSchema,
  RegisterRequestSchema,
  ResetPasswordRequestServerSchema,
  ResetPasswordConfirmServerSchema,
} from "../auth.schema";

describe("auth.schema", () => {
  describe("LoginFormSchema (Client)", () => {
    describe("valid inputs", () => {
      it("should validate valid login credentials", () => {
        const validData = {
          email: "user@example.com",
          password: "password123",
        };

        const result = LoginFormSchema.safeParse(validData);

        expect(result.success).toBe(true);
      });

      it("should accept any non-empty password", () => {
        const validData = {
          email: "test@test.com",
          password: "x",
        };

        const result = LoginFormSchema.safeParse(validData);

        expect(result.success).toBe(true);
      });
    });

    describe("invalid inputs", () => {
      it("should reject invalid email format", () => {
        const invalidData = {
          email: "not-an-email",
          password: "password123",
        };

        const result = LoginFormSchema.safeParse(invalidData);

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toBe("Please enter a valid email address");
        }
      });

      it("should reject empty password", () => {
        const invalidData = {
          email: "user@example.com",
          password: "",
        };

        const result = LoginFormSchema.safeParse(invalidData);

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toBe("Password is required");
        }
      });
    });
  });

  describe("RegisterFormSchema (Client)", () => {
    const validPassword = "Test@123";

    describe("valid inputs", () => {
      it("should validate valid registration data", () => {
        const validData = {
          email: "user@example.com",
          password: validPassword,
          confirmPassword: validPassword,
        };

        const result = RegisterFormSchema.safeParse(validData);

        expect(result.success).toBe(true);
      });

      it("should accept password with all required components", () => {
        const validData = {
          email: "test@test.com",
          password: "Abc123!@#",
          confirmPassword: "Abc123!@#",
        };

        const result = RegisterFormSchema.safeParse(validData);

        expect(result.success).toBe(true);
      });
    });

    describe("invalid inputs - password requirements", () => {
      it("should reject password shorter than 8 characters", () => {
        const invalidData = {
          email: "user@example.com",
          password: "Test@12",
          confirmPassword: "Test@12",
        };

        const result = RegisterFormSchema.safeParse(invalidData);

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toContain("at least 8 characters");
        }
      });

      it("should reject password without uppercase letter", () => {
        const invalidData = {
          email: "user@example.com",
          password: "test@123",
          confirmPassword: "test@123",
        };

        const result = RegisterFormSchema.safeParse(invalidData);

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toContain("uppercase letter");
        }
      });

      it("should reject password without number", () => {
        const invalidData = {
          email: "user@example.com",
          password: "Test@abc",
          confirmPassword: "Test@abc",
        };

        const result = RegisterFormSchema.safeParse(invalidData);

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toContain("number");
        }
      });

      it("should reject password without special character", () => {
        const invalidData = {
          email: "user@example.com",
          password: "Test1234",
          confirmPassword: "Test1234",
        };

        const result = RegisterFormSchema.safeParse(invalidData);

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toContain("special character");
        }
      });
    });

    describe("invalid inputs - password confirmation", () => {
      it("should reject when passwords do not match", () => {
        const invalidData = {
          email: "user@example.com",
          password: "Test@123",
          confirmPassword: "Test@456",
        };

        const result = RegisterFormSchema.safeParse(invalidData);

        expect(result.success).toBe(false);
        if (!result.success) {
          const confirmError = result.error.issues.find((issue) => issue.path.includes("confirmPassword"));
          expect(confirmError?.message).toBe("Passwords do not match");
        }
      });
    });
  });

  describe("ResetPasswordRequestSchema (Client)", () => {
    it("should validate valid email", () => {
      const validData = {
        email: "user@example.com",
      };

      const result = ResetPasswordRequestSchema.safeParse(validData);

      expect(result.success).toBe(true);
    });

    it("should reject invalid email", () => {
      const invalidData = {
        email: "invalid-email",
      };

      const result = ResetPasswordRequestSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe("Please enter a valid email address");
      }
    });
  });

  describe("ResetPasswordConfirmSchema (Client)", () => {
    const validPassword = "Test@123";

    describe("valid inputs", () => {
      it("should validate valid reset data", () => {
        const validData = {
          code: "reset-token-123",
          password: validPassword,
          confirmPassword: validPassword,
        };

        const result = ResetPasswordConfirmSchema.safeParse(validData);

        expect(result.success).toBe(true);
      });
    });

    describe("invalid inputs", () => {
      it("should reject empty code", () => {
        const invalidData = {
          code: "",
          password: validPassword,
          confirmPassword: validPassword,
        };

        const result = ResetPasswordConfirmSchema.safeParse(invalidData);

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toBe("Reset token is required");
        }
      });

      it("should reject weak password", () => {
        const invalidData = {
          code: "reset-token-123",
          password: "weak",
          confirmPassword: "weak",
        };

        const result = ResetPasswordConfirmSchema.safeParse(invalidData);

        expect(result.success).toBe(false);
      });

      it("should reject mismatched passwords", () => {
        const invalidData = {
          code: "reset-token-123",
          password: "Test@123",
          confirmPassword: "Test@456",
        };

        const result = ResetPasswordConfirmSchema.safeParse(invalidData);

        expect(result.success).toBe(false);
        if (!result.success) {
          const confirmError = result.error.issues.find((issue) => issue.path.includes("confirmPassword"));
          expect(confirmError?.message).toBe("Passwords do not match");
        }
      });
    });
  });

  describe("LoginRequestSchema (Server)", () => {
    it("should validate valid login data with minimal validation", () => {
      const validData = {
        email: "user@example.com",
        password: "x",
      };

      const result = LoginRequestSchema.safeParse(validData);

      expect(result.success).toBe(true);
    });

    it("should reject invalid email", () => {
      const invalidData = {
        email: "not-an-email",
        password: "password",
      };

      const result = LoginRequestSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
    });

    it("should reject empty password", () => {
      const invalidData = {
        email: "user@example.com",
        password: "",
      };

      const result = LoginRequestSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
    });
  });

  describe("RegisterRequestSchema (Server)", () => {
    it("should validate valid registration with minimal password rules", () => {
      const validData = {
        email: "user@example.com",
        password: "12345678",
      };

      const result = RegisterRequestSchema.safeParse(validData);

      expect(result.success).toBe(true);
    });

    it("should reject password shorter than 8 characters", () => {
      const invalidData = {
        email: "user@example.com",
        password: "1234567",
      };

      const result = RegisterRequestSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
    });

    it("should accept password without uppercase (server schema is less strict)", () => {
      const validData = {
        email: "user@example.com",
        password: "lowercase123",
      };

      const result = RegisterRequestSchema.safeParse(validData);

      expect(result.success).toBe(true);
    });
  });

  describe("ResetPasswordRequestServerSchema", () => {
    it("should validate valid email", () => {
      const validData = {
        email: "user@example.com",
      };

      const result = ResetPasswordRequestServerSchema.safeParse(validData);

      expect(result.success).toBe(true);
    });

    it("should reject invalid email", () => {
      const invalidData = {
        email: "not-an-email",
      };

      const result = ResetPasswordRequestServerSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
    });
  });

  describe("ResetPasswordConfirmServerSchema", () => {
    it("should validate valid reset data with minimal validation", () => {
      const validData = {
        code: "token",
        password: "12345678",
      };

      const result = ResetPasswordConfirmServerSchema.safeParse(validData);

      expect(result.success).toBe(true);
    });

    it("should reject empty code", () => {
      const invalidData = {
        code: "",
        password: "12345678",
      };

      const result = ResetPasswordConfirmServerSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
    });

    it("should reject password shorter than 8 characters", () => {
      const invalidData = {
        code: "token",
        password: "1234567",
      };

      const result = ResetPasswordConfirmServerSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
    });
  });

  describe("Client vs Server schema comparison", () => {
    it("client schema should be stricter than server schema for registration", () => {
      const weakPassword = {
        email: "user@example.com",
        password: "password123",
        confirmPassword: "password123",
      };

      const clientResult = RegisterFormSchema.safeParse(weakPassword);
      const serverResult = RegisterRequestSchema.safeParse({
        email: weakPassword.email,
        password: weakPassword.password,
      });

      expect(clientResult.success).toBe(false);
      expect(serverResult.success).toBe(true);
    });
  });
});
