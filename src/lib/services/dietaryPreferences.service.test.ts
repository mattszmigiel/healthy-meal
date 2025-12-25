import { describe, it, expect, vi, beforeEach } from "vitest";
import { DietaryPreferencesService } from "./dietaryPreferences.service";
import type { DietaryPreferencesDTO, UpdateDietaryPreferencesCommand } from "@/types";

// Mock Supabase client at the top level
const mockSupabaseClient = {
  from: vi.fn(),
};

describe("DietaryPreferencesService", () => {
  let service: DietaryPreferencesService;
  const userId = "test-user-123";

  beforeEach(() => {
    // Reset all mocks before each test
    vi.clearAllMocks();

    // Create service instance with mocked Supabase client
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    service = new DietaryPreferencesService(mockSupabaseClient as any);
  });

  describe("getDietaryPreferences", () => {
    it("should return dietary preferences for a valid user", async () => {
      // Arrange
      const expectedPreferences: DietaryPreferencesDTO = {
        user_id: userId,
        diet_type: "vegetarian",
        allergies: ["peanuts", "shellfish"],
        disliked_ingredients: ["cilantro"],
        created_at: "2025-01-01T00:00:00Z",
        updated_at: "2025-01-01T00:00:00Z",
      };

      const mockSelect = vi.fn().mockReturnThis();
      const mockEq = vi.fn().mockReturnThis();
      const mockSingle = vi.fn().mockResolvedValue({
        data: expectedPreferences,
        error: null,
      });

      mockSupabaseClient.from.mockReturnValue({
        select: mockSelect,
      });
      mockSelect.mockReturnValue({
        eq: mockEq,
      });
      mockEq.mockReturnValue({
        single: mockSingle,
      });

      // Act
      const result = await service.getDietaryPreferences(userId);

      // Assert
      expect(mockSupabaseClient.from).toHaveBeenCalledWith("dietary_preferences");
      expect(mockSelect).toHaveBeenCalledWith("*");
      expect(mockEq).toHaveBeenCalledWith("user_id", userId);
      expect(mockSingle).toHaveBeenCalled();
      expect(result).toEqual(expectedPreferences);
    });

    it("should throw DIETARY_PREFERENCES_NOT_FOUND when no preferences exist", async () => {
      // Arrange
      const mockSelect = vi.fn().mockReturnThis();
      const mockEq = vi.fn().mockReturnThis();
      const mockSingle = vi.fn().mockResolvedValue({
        data: null,
        error: { code: "PGRST116", message: "No rows found" },
      });

      mockSupabaseClient.from.mockReturnValue({
        select: mockSelect,
      });
      mockSelect.mockReturnValue({
        eq: mockEq,
      });
      mockEq.mockReturnValue({
        single: mockSingle,
      });

      // Act & Assert
      await expect(service.getDietaryPreferences(userId)).rejects.toThrow("DIETARY_PREFERENCES_NOT_FOUND");
    });

    it("should throw DATABASE_ERROR for generic database failures", async () => {
      // Arrange
      const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(vi.fn());

      const mockSelect = vi.fn().mockReturnThis();
      const mockEq = vi.fn().mockReturnThis();
      const mockSingle = vi.fn().mockResolvedValue({
        data: null,
        error: { code: "PGRST000", message: "Database connection failed" },
      });

      mockSupabaseClient.from.mockReturnValue({
        select: mockSelect,
      });
      mockSelect.mockReturnValue({
        eq: mockEq,
      });
      mockEq.mockReturnValue({
        single: mockSingle,
      });

      // Act & Assert
      await expect(service.getDietaryPreferences(userId)).rejects.toThrow("DATABASE_ERROR");
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "Error fetching dietary preferences:",
        expect.objectContaining({ code: "PGRST000" })
      );

      consoleErrorSpy.mockRestore();
    });
  });

  describe("updateDietaryPreferences", () => {
    it("should update all provided fields and return updated preferences", async () => {
      // Arrange
      const command: UpdateDietaryPreferencesCommand = {
        diet_type: "vegan",
        allergies: ["soy"],
        disliked_ingredients: ["mushrooms", "olives"],
      };

      const expectedResult: DietaryPreferencesDTO = {
        user_id: userId,
        diet_type: "vegan",
        allergies: ["soy"],
        disliked_ingredients: ["mushrooms", "olives"],
        created_at: "2025-01-01T00:00:00Z",
        updated_at: "2025-01-02T00:00:00Z",
      };

      const mockUpdate = vi.fn().mockReturnThis();
      const mockEq = vi.fn().mockReturnThis();
      const mockSelect = vi.fn().mockReturnThis();
      const mockSingle = vi.fn().mockResolvedValue({
        data: expectedResult,
        error: null,
      });

      mockSupabaseClient.from.mockReturnValue({
        update: mockUpdate,
      });
      mockUpdate.mockReturnValue({
        eq: mockEq,
      });
      mockEq.mockReturnValue({
        select: mockSelect,
      });
      mockSelect.mockReturnValue({
        single: mockSingle,
      });

      // Act
      const result = await service.updateDietaryPreferences(userId, command);

      // Assert
      expect(mockSupabaseClient.from).toHaveBeenCalledWith("dietary_preferences");
      expect(mockUpdate).toHaveBeenCalledWith({
        diet_type: "vegan",
        allergies: ["soy"],
        disliked_ingredients: ["mushrooms", "olives"],
      });
      expect(mockEq).toHaveBeenCalledWith("user_id", userId);
      expect(mockSelect).toHaveBeenCalled();
      expect(mockSingle).toHaveBeenCalled();
      expect(result).toEqual(expectedResult);
    });

    it("should perform partial update with only diet_type", async () => {
      // Arrange
      const command: Partial<UpdateDietaryPreferencesCommand> = {
        diet_type: "pescatarian",
      };

      const expectedResult: DietaryPreferencesDTO = {
        user_id: userId,
        diet_type: "pescatarian",
        allergies: ["peanuts"],
        disliked_ingredients: [],
        created_at: "2025-01-01T00:00:00Z",
        updated_at: "2025-01-02T00:00:00Z",
      };

      const mockUpdate = vi.fn().mockReturnThis();
      const mockEq = vi.fn().mockReturnThis();
      const mockSelect = vi.fn().mockReturnThis();
      const mockSingle = vi.fn().mockResolvedValue({
        data: expectedResult,
        error: null,
      });

      mockSupabaseClient.from.mockReturnValue({
        update: mockUpdate,
      });
      mockUpdate.mockReturnValue({
        eq: mockEq,
      });
      mockEq.mockReturnValue({
        select: mockSelect,
      });
      mockSelect.mockReturnValue({
        single: mockSingle,
      });

      // Act
      const result = await service.updateDietaryPreferences(userId, command);

      // Assert
      expect(mockUpdate).toHaveBeenCalledWith({
        diet_type: "pescatarian",
      });
      expect(result).toEqual(expectedResult);
    });

    it("should perform partial update with only allergies", async () => {
      // Arrange
      const command: Partial<UpdateDietaryPreferencesCommand> = {
        allergies: ["gluten", "dairy"],
      };

      const mockUpdate = vi.fn().mockReturnThis();
      const mockEq = vi.fn().mockReturnThis();
      const mockSelect = vi.fn().mockReturnThis();
      const mockSingle = vi.fn().mockResolvedValue({
        data: {} as DietaryPreferencesDTO,
        error: null,
      });

      mockSupabaseClient.from.mockReturnValue({
        update: mockUpdate,
      });
      mockUpdate.mockReturnValue({
        eq: mockEq,
      });
      mockEq.mockReturnValue({
        select: mockSelect,
      });
      mockSelect.mockReturnValue({
        single: mockSingle,
      });

      // Act
      await service.updateDietaryPreferences(userId, command);

      // Assert
      expect(mockUpdate).toHaveBeenCalledWith({
        allergies: ["gluten", "dairy"],
      });
    });

    it("should perform partial update with only disliked_ingredients", async () => {
      // Arrange
      const command: Partial<UpdateDietaryPreferencesCommand> = {
        disliked_ingredients: ["eggplant", "brussels_sprouts"],
      };

      const mockUpdate = vi.fn().mockReturnThis();
      const mockEq = vi.fn().mockReturnThis();
      const mockSelect = vi.fn().mockReturnThis();
      const mockSingle = vi.fn().mockResolvedValue({
        data: {} as DietaryPreferencesDTO,
        error: null,
      });

      mockSupabaseClient.from.mockReturnValue({
        update: mockUpdate,
      });
      mockUpdate.mockReturnValue({
        eq: mockEq,
      });
      mockEq.mockReturnValue({
        select: mockSelect,
      });
      mockSelect.mockReturnValue({
        single: mockSingle,
      });

      // Act
      await service.updateDietaryPreferences(userId, command);

      // Assert
      expect(mockUpdate).toHaveBeenCalledWith({
        disliked_ingredients: ["eggplant", "brussels_sprouts"],
      });
    });

    it("should update with empty object when no fields are provided", async () => {
      // Arrange
      const command: UpdateDietaryPreferencesCommand = {};

      const mockUpdate = vi.fn().mockReturnThis();
      const mockEq = vi.fn().mockReturnThis();
      const mockSelect = vi.fn().mockReturnThis();
      const mockSingle = vi.fn().mockResolvedValue({
        data: {} as DietaryPreferencesDTO,
        error: null,
      });

      mockSupabaseClient.from.mockReturnValue({
        update: mockUpdate,
      });
      mockUpdate.mockReturnValue({
        eq: mockEq,
      });
      mockEq.mockReturnValue({
        select: mockSelect,
      });
      mockSelect.mockReturnValue({
        single: mockSingle,
      });

      // Act
      await service.updateDietaryPreferences(userId, command);

      // Assert
      expect(mockUpdate).toHaveBeenCalledWith({});
    });

    it("should throw DIETARY_PREFERENCES_NOT_FOUND when preferences do not exist", async () => {
      // Arrange
      const command: UpdateDietaryPreferencesCommand = {
        diet_type: "vegan",
      };

      const mockUpdate = vi.fn().mockReturnThis();
      const mockEq = vi.fn().mockReturnThis();
      const mockSelect = vi.fn().mockReturnThis();
      const mockSingle = vi.fn().mockResolvedValue({
        data: null,
        error: { code: "PGRST116", message: "No rows found" },
      });

      mockSupabaseClient.from.mockReturnValue({
        update: mockUpdate,
      });
      mockUpdate.mockReturnValue({
        eq: mockEq,
      });
      mockEq.mockReturnValue({
        select: mockSelect,
      });
      mockSelect.mockReturnValue({
        single: mockSingle,
      });

      // Act & Assert
      await expect(service.updateDietaryPreferences(userId, command)).rejects.toThrow("DIETARY_PREFERENCES_NOT_FOUND");
    });

    it("should throw DATABASE_ERROR for generic update failures", async () => {
      // Arrange
      const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(vi.fn());

      const command: UpdateDietaryPreferencesCommand = {
        diet_type: "vegan",
      };

      const mockUpdate = vi.fn().mockReturnThis();
      const mockEq = vi.fn().mockReturnThis();
      const mockSelect = vi.fn().mockReturnThis();
      const mockSingle = vi.fn().mockResolvedValue({
        data: null,
        error: { code: "23505", message: "Unique constraint violation" },
      });

      mockSupabaseClient.from.mockReturnValue({
        update: mockUpdate,
      });
      mockUpdate.mockReturnValue({
        eq: mockEq,
      });
      mockEq.mockReturnValue({
        select: mockSelect,
      });
      mockSelect.mockReturnValue({
        single: mockSingle,
      });

      // Act & Assert
      await expect(service.updateDietaryPreferences(userId, command)).rejects.toThrow("DATABASE_ERROR");
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "Error updating dietary preferences:",
        expect.objectContaining({ code: "23505" })
      );

      consoleErrorSpy.mockRestore();
    });

    it("should handle null values correctly in partial update", async () => {
      // Arrange - Testing that null is treated differently from undefined
      const command: UpdateDietaryPreferencesCommand = {
        diet_type: null,
        allergies: ["soy"],
      };

      const mockUpdate = vi.fn().mockReturnThis();
      const mockEq = vi.fn().mockReturnThis();
      const mockSelect = vi.fn().mockReturnThis();
      const mockSingle = vi.fn().mockResolvedValue({
        data: {} as DietaryPreferencesDTO,
        error: null,
      });

      mockSupabaseClient.from.mockReturnValue({
        update: mockUpdate,
      });
      mockUpdate.mockReturnValue({
        eq: mockEq,
      });
      mockEq.mockReturnValue({
        select: mockSelect,
      });
      mockSelect.mockReturnValue({
        single: mockSingle,
      });

      // Act
      await service.updateDietaryPreferences(userId, command);

      // Assert - null values should be included in update
      expect(mockUpdate).toHaveBeenCalledWith({
        diet_type: null,
        allergies: ["soy"],
      });
    });
  });
});
