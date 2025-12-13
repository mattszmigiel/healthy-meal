import { useState } from "react";
import type { AIVariantsListProps } from "@/types";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { VariantCard } from "./VariantCard";

/**
 * ChevronDown icon SVG component
 */
function ChevronDownIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

/**
 * AIVariantsList component displays a collapsible list of AI-modified variant recipes
 * Only shown for original (non-AI) recipes that have variants
 */
export function AIVariantsList({ variants }: AIVariantsListProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Don't render if no variants
  if (!variants || variants.length === 0) {
    return null;
  }

  const variantCount = variants.length;

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="space-y-4">
      <CollapsibleTrigger asChild>
        <Button
          variant="outline"
          className="w-full justify-between"
          aria-expanded={isOpen}
          aria-controls="variants-content"
        >
          <span className="font-semibold">AI Modified Versions ({variantCount})</span>
          <ChevronDownIcon className={`h-4 w-4 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
        </Button>
      </CollapsibleTrigger>

      <CollapsibleContent id="variants-content" className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {variants.map((variant) => (
            <VariantCard key={variant.id} variant={variant} />
          ))}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
