import { useState, useEffect } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import type { OnboardingBannerProps } from "@/types";

const STORAGE_KEY = "healthymeal_banner_dismissed";

/**
 * Onboarding banner component
 * Prompts users without dietary preferences to complete their profile
 * Dismissible with localStorage persistence
 */
export function OnboardingBanner({ onNavigateToProfile, onDismiss }: OnboardingBannerProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Check if banner was previously dismissed
    try {
      const wasDismissed = localStorage.getItem(STORAGE_KEY);
      setIsVisible(!wasDismissed);
    } catch {
      // localStorage not available, default to showing banner
      setIsVisible(true);
    }
  }, []);

  const handleDismiss = () => {
    try {
      localStorage.setItem(STORAGE_KEY, "true");
    } catch {
      // localStorage not available, continue anyway
    }
    setIsVisible(false);
    onDismiss();
  };

  if (!isVisible) {
    return null;
  }

  return (
    <Alert className="relative">
      {/* Info Icon */}
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z"
        />
      </svg>

      <AlertDescription className="flex items-center justify-between gap-4">
        <div className="flex-1">
          <p className="font-medium mb-2">Set your dietary preferences</p>
          <p className="text-sm">Get personalized AI recipe modifications by adding your dietary preferences.</p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button onClick={onNavigateToProfile} size="sm">
            Set Preferences
          </Button>
          <Button onClick={handleDismiss} variant="ghost" size="sm" aria-label="Dismiss banner">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-4 h-4"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  );
}
