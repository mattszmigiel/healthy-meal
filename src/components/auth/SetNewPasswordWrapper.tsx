import { useState } from "react";
import { SetNewPasswordForm } from "./SetNewPasswordForm";

/**
 * Extract recovery code from URL query parameters immediately when component initializes
 */
function extractRecoveryCode(): string | null {
  if (typeof window === "undefined") return null;

  console.log("🔍 Extracting recovery code");
  console.log("📍 Current URL:", window.location.href);
  console.log("🔗 Search params:", window.location.search);

  const params = new URLSearchParams(window.location.search);
  const recoveryCode = params.get("code");
  console.log("🔑 Recovery code:", recoveryCode);

  if (recoveryCode) {
    console.log("✅ Valid recovery code found");
    // Clean up URL (remove query params for security)
    window.history.replaceState(null, "", "/set-new-password");
    console.log("🧹 URL cleaned");
    return recoveryCode;
  }

  console.log("❌ No recovery code in query params");
  return null;
}

/**
 * Wrapper component that extracts recovery code from URL hash
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
