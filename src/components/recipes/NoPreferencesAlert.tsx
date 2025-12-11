import type { NoPreferencesAlertProps } from "@/types";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

/**
 * Info/Alert Circle icon SVG component
 */
function InfoIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M12 16v-4" />
      <path d="M12 8h.01" />
    </svg>
  );
}

/**
 * NoPreferencesAlert component displays a warning when user attempts
 * AI modification without setting dietary preferences
 */
export function NoPreferencesAlert({ onNavigateToProfile }: NoPreferencesAlertProps) {
  return (
    <Alert className="border-amber-500/50 bg-amber-500/10">
      <InfoIcon className="h-4 w-4 text-amber-600 dark:text-amber-400" />
      <AlertTitle className="text-amber-900 dark:text-amber-100">Dietary Preferences Required</AlertTitle>
      <AlertDescription className="space-y-3">
        <p className="text-amber-800 dark:text-amber-200">
          Please set your dietary preferences to modify recipes with AI. Your preferences help us customize recipes to
          match your dietary needs and restrictions.
        </p>
        <Button onClick={onNavigateToProfile} variant="default" size="sm" className="mt-2">
          Go to Profile
        </Button>
      </AlertDescription>
    </Alert>
  );
}
