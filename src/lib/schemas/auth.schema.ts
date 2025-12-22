import { z } from "zod";

/**
 * Login Form Schema - Client-side validation for login form
 */
export const LoginFormSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

/**
 * Register Form Schema - Client-side validation for registration form
 */
export const RegisterFormSchema = z
  .object({
    email: z.string().email("Please enter a valid email address"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Password should contain at least one uppercase letter")
      .regex(/[0-9]/, "Password should contain at least one number")
      .regex(/[^A-Za-z0-9]/, "Password should contain at least one special character"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

/**
 * Reset Password Request Schema - Client-side validation for password reset request
 */
export const ResetPasswordRequestSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

/**
 * Reset Password Confirm Schema - Client-side validation for password reset confirmation
 * The access_token is extracted from URL hash after Supabase email redirect
 */
export const ResetPasswordConfirmSchema = z
  .object({
    access_token: z.string().min(1, "Reset token is required"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Password should contain at least one uppercase letter")
      .regex(/[0-9]/, "Password should contain at least one number")
      .regex(/[^A-Za-z0-9]/, "Password should contain at least one special character"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

/**
 * Server-side validation schemas (less strict, format only)
 */
export const LoginRequestSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const RegisterRequestSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export const ResetPasswordRequestServerSchema = z.object({
  email: z.string().email(),
});

export const ResetPasswordConfirmServerSchema = z.object({
  access_token: z.string().min(1),
  password: z.string().min(8),
});
