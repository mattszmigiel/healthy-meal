import type { MobileMenuProps } from "@/types";
import { NavLinks } from "./NavLinks";
import { Button } from "@/components/ui/button";
import { useEffect, useRef } from "react";

/**
 * MobileMenu component - Slide-out panel for mobile navigation
 * Includes overlay backdrop, navigation links, and logout button
 * Handles focus management and accessibility
 */
export function MobileMenu({ isOpen, onClose, userEmail, currentPath, onLogout }: MobileMenuProps) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Focus management: focus close button when menu opens
  useEffect(() => {
    if (isOpen && closeButtonRef.current) {
      closeButtonRef.current.focus();
    }
  }, [isOpen]);

  const handleLogout = () => {
    onLogout();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay backdrop */}
      <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={onClose} aria-hidden="true" />

      {/* Slide-out panel */}
      <div
        ref={menuRef}
        className="fixed top-0 right-0 bottom-0 w-80 max-w-[85vw] bg-background shadow-lg z-50 md:hidden transform transition-transform duration-300 ease-in-out"
        role="dialog"
        aria-modal="true"
        aria-label="Mobile navigation menu"
      >
        <div className="flex flex-col h-full">
          {/* Header with close button */}
          <div className="flex items-center justify-between px-4 py-4 border-b">
            <h2 className="text-lg font-semibold">Menu</h2>
            <button
              ref={closeButtonRef}
              onClick={onClose}
              className="p-2 rounded-md hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-label="Close menu"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          {/* User info */}
          {userEmail && (
            <div className="px-4 py-3 border-b bg-muted/30">
              <p className="text-sm text-muted-foreground">Logged in as</p>
              <p className="text-sm font-medium">{userEmail}</p>
            </div>
          )}

          {/* Navigation links */}
          <div className="flex-1 px-4 py-4">
            <NavLinks currentPath={currentPath} orientation="vertical" onLinkClick={onClose} />
          </div>

          {/* Logout button at bottom */}
          <div className="px-4 py-4 border-t">
            <Button
              onClick={handleLogout}
              variant="outline"
              className="w-full text-destructive hover:text-destructive hover:bg-destructive/10"
            >
              Logout
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
