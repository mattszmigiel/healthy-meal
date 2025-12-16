import type { MobileNavigationProps } from "@/types";
import { Logo } from "./Logo";
import { MobileMenu } from "./MobileMenu";
import { useMobileMenu } from "@/components/hooks/useMobileMenu";
import { useLogout } from "@/components/hooks/useLogout";
import { cn } from "@/lib/utils";

/**
 * MobileNavigation component - Mobile-optimized navigation with hamburger menu
 * Displays horizontal layout with logo and hamburger button
 * Shown only on mobile devices
 */
export function MobileNavigation({ userEmail, currentPath }: MobileNavigationProps) {
  const { isOpen, toggleMenu, closeMenu } = useMobileMenu();
  const { logout } = useLogout();

  return (
    <>
      <div className="flex md:hidden items-center justify-between w-full px-4 py-3">
        {/* Logo */}
        <Logo />

        {/* Hamburger button */}
        <button
          onClick={toggleMenu}
          className={cn(
            "p-2 rounded-md hover:bg-accent transition-colors",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          )}
          aria-label={isOpen ? "Close menu" : "Open menu"}
          aria-expanded={isOpen}
          aria-controls="mobile-menu"
        >
          <div className="w-6 h-5 flex flex-col justify-between">
            <span
              className={cn(
                "block h-0.5 w-full bg-foreground transition-all duration-300",
                isOpen ? "rotate-45 translate-y-2" : ""
              )}
            />
            <span
              className={cn("block h-0.5 w-full bg-foreground transition-all duration-300", isOpen ? "opacity-0" : "")}
            />
            <span
              className={cn(
                "block h-0.5 w-full bg-foreground transition-all duration-300",
                isOpen ? "-rotate-45 -translate-y-2" : ""
              )}
            />
          </div>
        </button>
      </div>

      {/* Mobile menu slide-out panel */}
      <MobileMenu
        isOpen={isOpen}
        onClose={closeMenu}
        userEmail={userEmail}
        currentPath={currentPath}
        onLogout={logout}
      />
    </>
  );
}
