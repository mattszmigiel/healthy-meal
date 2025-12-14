import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { RecipeCardProps } from "@/types";

/**
 * Individual recipe card component
 * Displays recipe metadata and is fully clickable to navigate to recipe detail
 */
export function RecipeCard({ recipe, showAIBadge }: RecipeCardProps) {
  const formattedDate = new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(recipe.created_at));

  // Truncate title to 30 characters
  const displayTitle = recipe.title.length > 30 ? `${recipe.title.substring(0, 30)}...` : recipe.title;

  return (
    <a
      href={`/recipes/${recipe.id}`}
      className="block group transition-transform hover:scale-[1.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-xl"
    >
      <Card className="h-full transition-all group-hover:shadow-md group-hover:border-primary/50">
        <CardHeader>
          <div className="flex items-start justify-between gap-2">
            <CardTitle className="text-lg group-hover:text-primary transition-colors">{displayTitle}</CardTitle>
            {showAIBadge && recipe.is_ai_generated && (
              <Badge variant="secondary" className="shrink-0">
                AI
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">{formattedDate}</p>
        </CardContent>
      </Card>
    </a>
  );
}
