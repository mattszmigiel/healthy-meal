import { navigate } from "astro:transitions/client";
import { useCallback, useState } from "react";

/**
 * Custom hook for handling user logout
 * Manages logout state and handles API communication
 *
 * @returns Object containing logout function and loading state
 */
export function useLogout() {
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const logout = useCallback(async () => {
    if (isLoggingOut) return; // Prevent multiple simultaneous logout calls

    setIsLoggingOut(true);
    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include", // Include cookies for session authentication
      });

      if (response.ok) {
        // Redirect to home/login page on successful logout using Astro's navigate for smooth transition
        navigate("/");
      } else {
        // Handle error response
        const error = await response.json();
        console.error("Logout failed:", error);
        setIsLoggingOut(false);
        // Note: Could add toast notification here if needed
        // toast.error('Failed to log out. Please try again.');
      }
    } catch (error) {
      // Handle network or other errors
      console.error("Logout error:", error);
      setIsLoggingOut(false);
      // Note: Could add toast notification here if needed
      // toast.error('Failed to log out. Please try again.');
    }
  }, [isLoggingOut]);

  return { logout, isLoggingOut };
}
