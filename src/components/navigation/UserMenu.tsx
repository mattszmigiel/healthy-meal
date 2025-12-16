import type { UserMenuProps } from "@/types";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

/**
 * UserMenu component - Desktop dropdown menu for user actions
 * Displays user email and provides access to Profile and Logout
 */
export function UserMenu({ userEmail, onLogout }: UserMenuProps) {
  const displayName = userEmail || "User";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="flex items-center gap-2 px-3 py-2" aria-label="User menu">
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-medium">
            {displayName.charAt(0).toUpperCase()}
          </div>
          <span className="hidden md:inline-block text-sm font-medium">{displayName}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <div className="flex items-center gap-2 px-2 py-1.5">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">Account</p>
            <p className="text-xs leading-none text-muted-foreground">{displayName}</p>
          </div>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <a href="/profile" className="cursor-pointer">
            Profile
          </a>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={onLogout} className="cursor-pointer text-destructive focus:text-destructive">
          Logout
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
