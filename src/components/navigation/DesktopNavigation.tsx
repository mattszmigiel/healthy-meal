import type { DesktopNavigationProps } from "@/types";
import { Logo } from "./Logo";
import { NavLinks } from "./NavLinks";
import { UserMenu } from "./UserMenu";
import { useLogout } from "@/components/hooks/useLogout";

/**
 * DesktopNavigation component - Desktop-optimized navigation layout
 * Displays horizontal layout with logo, nav links, and user menu
 * Hidden on mobile devices
 */
export function DesktopNavigation({ userEmail, currentPath }: DesktopNavigationProps) {
  const { logout } = useLogout();

  return (
    <div className="hidden md:flex items-center justify-between w-full px-4 py-3">
      {/* Left section: Logo */}
      <div className="flex items-center">
        <Logo />
      </div>

      {/* Center section: Navigation Links */}
      <div className="flex items-center">
        <NavLinks currentPath={currentPath} orientation="horizontal" />
      </div>

      {/* Right section: User Menu */}
      <div className="flex items-center">
        <UserMenu userEmail={userEmail} onLogout={logout} />
      </div>
    </div>
  );
}
