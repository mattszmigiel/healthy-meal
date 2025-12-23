import { useState } from "react";
import { SetNewPasswordForm } from "./SetNewPasswordForm";

/**
 * Extract recovery code from URL query parameters immediately when component initializes
 */
function extractRecoveryCode(): string | null {
  if (typeof window === "undefined") return null;

  const params = new URLSearchParams(window.location.search);
  const recoveryCode = params.get("code");

  if (recoveryCode) {
    window.history.replaceState(null, "", "/set-new-password");
    return recoveryCode;
  }

  return null;
}

/**
 * Wrapper component that extracts recovery code from URL query parameters
 * and mounts the SetNewPasswordForm if a valid code is found
 */
export function SetNewPasswordWrapper() {
  // Extract code during initialization, not in useEffect
  const [code] = useState<string | null>(() => extractRecoveryCode());

  if (!code) {
    return (
      <div className="rounded-md bg-destructive/10 border border-destructive/20 p-4 text-sm text-destructive text-center space-y-3">
        <div>
          <p className="font-medium mb-1">Invalid or expired reset link</p>
          <p>Please request a new password reset.</p>
        </div>
        <a href="/reset-password" className="inline-block text-destructive hover:underline font-medium">
          Request new reset link →
        </a>
      </div>
    );
  }

  return <SetNewPasswordForm code={code} />;
}
