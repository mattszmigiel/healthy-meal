import type { NavLinksProps } from "@/types";
import { cn } from "@/lib/utils";

/**
 * NavLinks component - Reusable navigation links for Recipes and Profile
 * Supports both horizontal (desktop) and vertical (mobile) layouts
 * Highlights the currently active link
 */
export function NavLinks({ currentPath, orientation = "horizontal", onLinkClick }: NavLinksProps) {
  const isRecipesActive = currentPath.startsWith("/recipes");
  const isProfileActive = currentPath === "/profile";

  const containerClasses = cn("flex gap-1", orientation === "horizontal" ? "flex-row items-center" : "flex-col");

  const linkClasses = (isActive: boolean) =>
    cn(
      "px-4 py-2 rounded-md text-sm font-medium transition-colors",
      "hover:bg-accent hover:text-accent-foreground",
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
      isActive ? "bg-accent text-accent-foreground" : "text-muted-foreground"
    );

  const handleClick = () => {
    if (onLinkClick) {
      onLinkClick();
    }
  };

  return (
    <nav className={containerClasses} aria-label="Main navigation">
      <a
        href="/recipes"
        className={linkClasses(isRecipesActive)}
        aria-current={isRecipesActive ? "page" : undefined}
        onClick={handleClick}
      >
        Recipes
      </a>
      <a
        href="/profile"
        className={linkClasses(isProfileActive)}
        aria-current={isProfileActive ? "page" : undefined}
        onClick={handleClick}
      >
        Profile
      </a>
    </nav>
  );
}
