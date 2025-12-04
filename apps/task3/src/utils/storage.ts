/**
 * LocalStorage utility functions for persisting app state
 */

import { Plan, UserPreferences } from "../types";

const STORAGE_KEYS = {
  PLANS: "tripPlanner_plans",
  CURRENT_PLAN_ID: "tripPlanner_currentPlanId",
  PREFERENCES: "tripPlanner_preferences",
};

// Plans management
export function savePlans(plans: Plan[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.PLANS, JSON.stringify(plans));
  } catch (error) {
    console.error("Failed to save plans:", error);
  }
}

export function loadPlans(): Plan[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.PLANS);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error("Failed to load plans:", error);
    return [];
  }
}

export function saveCurrentPlanId(planId: string | null): void {
  try {
    localStorage.setItem(STORAGE_KEYS.CURRENT_PLAN_ID, planId || "");
  } catch (error) {
    console.error("Failed to save current plan ID:", error);
  }
}

export function loadCurrentPlanId(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEYS.CURRENT_PLAN_ID) || null;
  } catch (error) {
    console.error("Failed to load current plan ID:", error);
    return null;
  }
}

// Global preferences (not per-plan)
export function savePreferences(preferences: UserPreferences): void {
  try {
    localStorage.setItem(STORAGE_KEYS.PREFERENCES, JSON.stringify(preferences));
  } catch (error) {
    console.error("Failed to save preferences:", error);
  }
}

export function loadPreferences(): UserPreferences {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.PREFERENCES);
    return stored ? JSON.parse(stored) : {};
  } catch (error) {
    console.error("Failed to load preferences:", error);
    return {};
  }
}

export function clearAllData(): void {
  try {
    Object.values(STORAGE_KEYS).forEach((key) => {
      localStorage.removeItem(key);
    });
  } catch (error) {
    console.error("Failed to clear data:", error);
  }
}

// Helper functions for plan operations
export function createNewPlan(
  name: string,
  location: string | null = null
): Plan {
  return {
    id: Date.now().toString(),
    name,
    location,
    todos: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}
