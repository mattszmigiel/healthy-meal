import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { z } from "zod";
import { ResetPasswordRequestSchema } from "@/lib/schemas/auth.schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

type FormValues = z.infer<typeof ResetPasswordRequestSchema>;

export function ResetPasswordRequestForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(ResetPasswordRequestSchema),
    defaultValues: {
      email: "",
    },
  });

  const onSubmit = async (data: FormValues) => {
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

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
              control={form.control}
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
