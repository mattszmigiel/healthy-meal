import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { navigate } from "astro:transitions/client";
import { z } from "zod";
import { ResetPasswordRequestSchema, ResetPasswordConfirmSchema } from "@/lib/schemas/auth.schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

type ResetPasswordRequestValues = z.infer<typeof ResetPasswordRequestSchema>;
type ResetPasswordConfirmValues = z.infer<typeof ResetPasswordConfirmSchema>;

interface ResetPasswordFormProps {
  mode: "request" | "reset";
  token?: string;
}

export function ResetPasswordForm({ mode, token }: ResetPasswordFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  // Request mode form
  const requestForm = useForm<ResetPasswordRequestValues>({
    resolver: zodResolver(ResetPasswordRequestSchema),
    defaultValues: {
      email: "",
    },
  });

  // Reset mode form
  const resetForm = useForm<ResetPasswordConfirmValues>({
    resolver: zodResolver(ResetPasswordConfirmSchema),
    defaultValues: {
      token: token || "",
      password: "",
      confirmPassword: "",
    },
  });

  const onRequestSubmit = async (data: ResetPasswordRequestValues) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/auth/reset-password-request", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
        credentials: "include",
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));

        if (response.status === 429) {
          setError("Too many requests. Please try again later.");
        } else {
          setError(errorData.message || "An error occurred. Please try again.");
        }
        return;
      }

      setIsSuccess(true);
    } catch {
      setError("Unable to connect. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const onResetSubmit = async (data: ResetPasswordConfirmValues) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/auth/reset-password-confirm", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token: data.token,
          password: data.password,
        }),
        credentials: "include",
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));

        if (response.status === 400) {
          if (errorData.message?.includes("expired") || errorData.message?.includes("invalid")) {
            setError("This reset link is invalid or has expired. Please request a new one.");
          } else {
            setError(errorData.message || "Please check your password and try again.");
          }
        } else if (response.status === 429) {
          setError("Too many attempts. Please try again later.");
        } else {
          setError("An error occurred. Please try again.");
        }
        return;
      }

      // Navigate to login with success message
      navigate("/login?reset=success");
    } catch {
      setError("Unable to connect. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Request mode - Email input
  if (mode === "request") {
    return (
      <Form {...requestForm}>
        <form onSubmit={requestForm.handleSubmit(onRequestSubmit)} className="space-y-4">
          {error && (
            <div
              className="rounded-md bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive"
              role="alert"
              aria-live="polite"
            >
              {error}
            </div>
          )}

          {isSuccess ? (
            <div
              className="rounded-md bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900/30 p-4 text-sm text-green-800 dark:text-green-200"
              role="status"
              aria-live="polite"
            >
              <p className="font-medium mb-1">Check your email</p>
              <p>If an account exists with this email, you will receive a password reset link shortly.</p>
            </div>
          ) : (
            <>
              <FormField
                control={requestForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="name@example.com" autoComplete="email" {...field} />
                    </FormControl>
                    <FormDescription>
                      Enter the email address associated with your account and we&apos;ll send you a link to reset your
                      password.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Sending..." : "Send reset link"}
              </Button>
            </>
          )}
        </form>
      </Form>
    );
  }

  // Reset mode - Password inputs
  return (
    <Form {...resetForm}>
      <form onSubmit={resetForm.handleSubmit(onResetSubmit)} className="space-y-4">
        {error && (
          <div
            className="rounded-md bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive"
            role="alert"
            aria-live="polite"
          >
            {error}
          </div>
        )}

        <FormField
          control={resetForm.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>New Password</FormLabel>
              <FormControl>
                <Input type="password" autoComplete="new-password" {...field} />
              </FormControl>
              <FormDescription>
                Password must be at least 8 characters and include an uppercase letter, a number, and a special
                character.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={resetForm.control}
          name="confirmPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Confirm New Password</FormLabel>
              <FormControl>
                <Input type="password" autoComplete="new-password" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? "Updating password..." : "Reset password"}
        </Button>
      </form>
    </Form>
  );
}
