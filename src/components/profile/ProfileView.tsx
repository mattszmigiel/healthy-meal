import { useState } from "react";
import { AccountSection } from "./AccountSection";
import { DietaryPreferencesSection } from "./DietaryPreferencesSection";
import type { ProfileViewProps, DietaryPreferencesDTO } from "@/types";

export function ProfileView({ initialPreferences, userEmail }: ProfileViewProps) {
  const [preferences, setPreferences] = useState<DietaryPreferencesDTO | null>(initialPreferences);

  const handlePreferencesUpdated = (updatedPreferences: DietaryPreferencesDTO) => {
    setPreferences(updatedPreferences);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Profile</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <AccountSection userEmail={userEmail} />
        <DietaryPreferencesSection preferences={preferences} onPreferencesUpdated={handlePreferencesUpdated} />
      </div>
    </div>
  );
}
