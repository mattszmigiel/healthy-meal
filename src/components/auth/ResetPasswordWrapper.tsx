import { useEffect, useState } from "react";
import { ResetPasswordForm } from "./ResetPasswordForm";

/**
 * Wrapper component that detects reset mode from URL hash
 * Supabase redirects with format: /reset-password#access_token=XXX&type=recovery
 */
export function ResetPasswordWrapper() {
  const [mode, setMode] = useState<"request" | "reset">("request");
  const [token, setToken] = useState<string | undefined>(undefined);
  const [title, setTitle] = useState("Reset your password");
  const [description, setDescription] = useState(
    "Enter your email address and we'll send you a link to reset your password"
  );

  useEffect(() => {
    // Check URL hash for reset token
    const hash = window.location.hash.substring(1);
    const params = new URLSearchParams(hash);
    const accessToken = params.get("access_token");
    const type = params.get("type");

    // If we have a token and type=recovery, we're in reset mode
    if (accessToken && type === "recovery") {
      setMode("reset");
      setToken(accessToken);
      setTitle("Set new password");
      setDescription("Enter your new password below");
    }
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold">{title}</h1>
        <p className="text-muted-foreground text-sm">{description}</p>
      </div>

      {/* Form */}
      <ResetPasswordForm mode={mode} token={token} />

      {/* Back to login link */}
      <div className="text-center">
        <a
          href="/login"
          className="text-sm text-muted-foreground hover:text-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded"
        >
          Back to log in
        </a>
      </div>
    </div>
  );
}
