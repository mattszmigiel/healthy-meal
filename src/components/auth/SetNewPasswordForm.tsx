import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { navigate } from "astro:transitions/client";
import { z } from "zod";
import { ResetPasswordConfirmSchema } from "@/lib/schemas/auth.schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

type FormValues = z.infer<typeof ResetPasswordConfirmSchema>;

interface SetNewPasswordFormProps {
  code: string;
}

export function SetNewPasswordForm({ code }: SetNewPasswordFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(ResetPasswordConfirmSchema),
    defaultValues: {
      code: code,
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (data: FormValues) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/auth/reset-password-confirm", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          code: data.code,
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

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {/* Hidden field for the recovery code */}
        <input type="hidden" {...form.register("code")} />

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
          control={form.control}
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
          control={form.control}
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
