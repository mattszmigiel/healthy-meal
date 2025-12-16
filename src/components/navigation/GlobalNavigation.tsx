import type { GlobalNavigationProps } from "@/types";
import { DesktopNavigation } from "./DesktopNavigation";
import { MobileNavigation } from "./MobileNavigation";

/**
 * GlobalNavigation component - Main navigation header for authenticated views
 * Combines desktop and mobile navigation with accessibility features
 * Displayed on all authenticated routes (/recipes*, /profile)
 */
export function GlobalNavigation({ userEmail, currentPath }: GlobalNavigationProps) {
  return (
    <header className="sticky top-0 z-30 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      {/* Skip to content link for accessibility */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:px-4 focus:py-2 focus:bg-background focus:text-foreground focus:rounded-md focus:ring-2 focus:ring-ring"
      >
        Skip to content
      </a>

      {/* Navigation wrapper */}
      <nav role="navigation" aria-label="Global navigation">
        {/* Desktop Navigation - hidden on mobile */}
        <DesktopNavigation userEmail={userEmail} currentPath={currentPath} />

        {/* Mobile Navigation - hidden on desktop */}
        <MobileNavigation userEmail={userEmail} currentPath={currentPath} />
      </nav>
    </header>
  );
}
