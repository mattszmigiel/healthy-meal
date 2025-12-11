import type { VariantCardProps } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

/**
 * Format date to readable format: "Month DD, YYYY"
 */
const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date);
};

/**
 * Format applied preferences for display
 * Returns a readable summary of diet type, allergies, and disliked ingredients
 */
const formatAppliedPreferences = (variant: VariantCardProps["variant"]): string | null => {
  if (!variant.ai_metadata) {
    return null;
  }

  // Note: ai_metadata doesn't include applied_preferences in the current schema
  // This is a placeholder for when that data becomes available
  // For now, we'll just show that it's AI-modified
  return "AI-modified based on dietary preferences";
};

/**
 * VariantCard component displays a summary of an AI-modified variant recipe
 * Entire card is clickable and navigates to the variant recipe detail page
 */
export function VariantCard({ variant }: VariantCardProps) {
  const createdDate = formatDate(variant.created_at);
  const appliedPreferences = formatAppliedPreferences(variant);

  return (
    <a
      href={`/recipes/${variant.id}`}
      className="block group transition-transform hover:scale-[1.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-lg"
    >
      <Card className="h-full transition-colors group-hover:border-primary/50">
        <CardHeader>
          <CardTitle className="text-lg line-clamp-2 group-hover:text-primary transition-colors">
            {variant.title}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Creation Date */}
          <div className="text-sm text-muted-foreground">
            <span className="font-medium">Created:</span> {createdDate}
          </div>

          {/* Applied Preferences */}
          {appliedPreferences && (
            <div className="flex items-start gap-2">
              <Badge variant="secondary" className="text-xs">
                Modified
              </Badge>
              <span className="text-xs text-muted-foreground flex-1">{appliedPreferences}</span>
            </div>
          )}

          {/* AI Metadata Info */}
          {variant.ai_metadata && (
            <div className="text-xs text-muted-foreground">
              <span className="font-medium">Model:</span> {variant.ai_metadata.model}
            </div>
          )}
        </CardContent>
      </Card>
    </a>
  );
}
