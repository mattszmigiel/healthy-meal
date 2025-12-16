/**
 * Logo component - Brand/logo link
 * Displays the application name and serves as the primary branding element
 *
 * @param href - Optional destination URL (defaults to /recipes for authenticated users)
 */
export function Logo({ href = "/recipes" }: { href?: string }) {
  return (
    <a
      href={href}
      className="flex items-center gap-2 text-xl font-bold text-foreground hover:text-foreground/80 transition-colors"
      aria-label="HealthyMeal"
    >
      <span>HealthyMeal</span>
    </a>
  );
}
