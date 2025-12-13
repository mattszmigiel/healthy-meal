import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { ViewToggleProps, ViewType } from "@/types";

/**
 * View toggle component using Shadcn Tabs
 * Allows switching between "My Recipes" and "AI Modified" views
 */
export function ViewToggle({ currentView, onChange }: ViewToggleProps) {
  const handleValueChange = (value: string) => {
    onChange(value as ViewType);
  };

  return (
    <Tabs value={currentView} onValueChange={handleValueChange}>
      <TabsList>
        <TabsTrigger value="my-recipes">My Recipes</TabsTrigger>
        <TabsTrigger value="ai-modified">AI Modified</TabsTrigger>
      </TabsList>
    </Tabs>
  );
}
