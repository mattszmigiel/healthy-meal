import { useState, useId } from "react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { X } from "lucide-react";
import type { TagInputProps } from "@/types";

export function TagInput({
  label,
  value,
  onChange,
  placeholder = "Type and press Enter to add",
  disabled = false,
  id,
  ariaDescribedBy,
}: TagInputProps) {
  const [inputValue, setInputValue] = useState("");
  const [announcement, setAnnouncement] = useState("");
  const announceId = useId();

  const addTag = () => {
    const trimmed = inputValue.trim();

    if (!trimmed) {
      return;
    }

    if (trimmed.length > 50) {
      setAnnouncement("Tag is too long. Maximum 50 characters.");
      return;
    }

    if (value.some((tag) => tag.toLowerCase() === trimmed.toLowerCase())) {
      setAnnouncement("This item has already been added");
      return;
    }

    onChange([...value, trimmed]);
    setInputValue("");
    setAnnouncement(`Added ${trimmed}`);
  };

  const removeTag = (index: number) => {
    const removed = value[index];
    onChange(value.filter((_, i) => i !== index));
    setAnnouncement(`Removed ${removed}`);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addTag();
    } else if (e.key === "Backspace" && inputValue === "" && value.length > 0) {
      removeTag(value.length - 1);
    }
  };

  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <div className="space-y-2">
        {value.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {value.map((tag, index) => (
              <Badge key={index} variant="secondary" className="gap-1">
                {tag}
                <button
                  type="button"
                  onClick={() => removeTag(index)}
                  disabled={disabled}
                  className="ml-1 rounded-full hover:bg-muted"
                  aria-label={`Remove ${tag}`}
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}
        <Input
          id={id}
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          aria-describedby={ariaDescribedBy}
          aria-label={label}
        />
      </div>
      <div id={announceId} role="status" aria-live="polite" aria-atomic="true" className="sr-only">
        {announcement}
      </div>
    </div>
  );
}
