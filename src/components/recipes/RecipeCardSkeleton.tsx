import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * Loading placeholder component for RecipeCard
 * Matches RecipeCard dimensions to prevent layout shift during loading
 */
export function RecipeCardSkeleton() {
  return (
    <Card aria-busy="true" aria-live="polite">
      <CardHeader>
        <Skeleton className="h-6 w-3/4" />
      </CardHeader>
      <CardContent className="space-y-2">
        <Skeleton className="h-4 w-1/2" />
      </CardContent>
    </Card>
  );
}
