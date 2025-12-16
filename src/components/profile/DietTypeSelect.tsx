import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { DietTypeSelectProps, DietType } from "@/types";

const dietTypeOptions: { value: string; label: string }[] = [
  { value: "not-specified", label: "Not specified" },
  { value: "omnivore", label: "Omnivore" },
  { value: "vegetarian", label: "Vegetarian" },
  { value: "vegan", label: "Vegan" },
  { value: "pescatarian", label: "Pescatarian" },
  { value: "keto", label: "Keto" },
  { value: "paleo", label: "Paleo" },
  { value: "low_carb", label: "Low Carb" },
  { value: "low_fat", label: "Low Fat" },
  { value: "mediterranean", label: "Mediterranean" },
  { value: "other", label: "Other" },
];

export function DietTypeSelect({ value, onChange, disabled = false, id }: DietTypeSelectProps) {
  const handleValueChange = (newValue: string) => {
    if (newValue === "not-specified") {
      onChange(null);
    } else {
      onChange(newValue as DietType);
    }
  };

  const displayValue = value || "not-specified";

  return (
    <div className="space-y-2">
      <Label htmlFor={id}>Diet Type</Label>
      <Select value={displayValue} onValueChange={handleValueChange} disabled={disabled}>
        <SelectTrigger id={id}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {dietTypeOptions.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
