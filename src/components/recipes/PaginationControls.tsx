import { Button } from "@/components/ui/button";
import type { PaginationControlsProps } from "@/types";

/**
 * Pagination controls component
 * Displays current range info and "Load More" button
 */
export function PaginationControls({ pagination, isLoading, onLoadMore }: PaginationControlsProps) {
  const { page, limit, total, total_pages } = pagination;

  // Calculate display range
  const start = (page - 1) * limit + 1;
  const end = Math.min(page * limit, total);

  // Check if there are more pages
  const hasMore = page < total_pages;

  return (
    <div className="flex flex-col items-center gap-4 py-8" aria-live="polite">
      {/* Range info */}
      <p className="text-sm text-muted-foreground">
        Showing {start}–{end} of {total} {total === 1 ? "recipe" : "recipes"}
      </p>

      {/* Load More button */}
      {hasMore && (
        <Button onClick={onLoadMore} disabled={isLoading} variant="outline" size="lg">
          {isLoading ? (
            <>
              <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              Loading...
            </>
          ) : (
            "Load More"
          )}
        </Button>
      )}
    </div>
  );
}
