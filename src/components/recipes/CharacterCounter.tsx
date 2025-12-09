import { cn } from "@/lib/utils";

interface CharacterCounterProps {
  current: number;
  max: number;
  warningThreshold?: number;
}

export function CharacterCounter({ current, max, warningThreshold = 0.9 }: CharacterCounterProps) {
  const percentage = (current / max) * 100;
  const isWarning = percentage >= warningThreshold * 100 && percentage <= 100;
  const isExceeded = percentage > 100;

  const className = cn(
    "text-sm",
    isExceeded && "text-destructive font-semibold",
    isWarning && !isExceeded && "text-amber-600 font-medium",
    !isWarning && !isExceeded && "text-muted-foreground"
  );

  return (
    <span className={className} aria-live="polite" aria-atomic="true">
      {current.toLocaleString()} / {max.toLocaleString()}
    </span>
  );
}
