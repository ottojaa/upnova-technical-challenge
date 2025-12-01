/**
 * LocalStorage utility functions for persisting app state
 */

const STORAGE_KEYS = {
  PLANS: "tripPlanner_plans",
  CURRENT_PLAN_ID: "tripPlanner_currentPlanId",
  PREFERENCES: "tripPlanner_preferences",
};

// Plans management
export function savePlans(plans) {
  try {
    localStorage.setItem(STORAGE_KEYS.PLANS, JSON.stringify(plans));
  } catch (error) {
    console.error("Failed to save plans:", error);
  }
}

export function loadPlans() {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.PLANS);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error("Failed to load plans:", error);
    return [];
  }
}

export function saveCurrentPlanId(planId) {
  try {
    localStorage.setItem(STORAGE_KEYS.CURRENT_PLAN_ID, planId || "");
  } catch (error) {
    console.error("Failed to save current plan ID:", error);
  }
}

export function loadCurrentPlanId() {
  try {
    return localStorage.getItem(STORAGE_KEYS.CURRENT_PLAN_ID) || null;
  } catch (error) {
    console.error("Failed to load current plan ID:", error);
    return null;
  }
}

// Global preferences (not per-plan)
export function savePreferences(preferences) {
  try {
    localStorage.setItem(STORAGE_KEYS.PREFERENCES, JSON.stringify(preferences));
  } catch (error) {
    console.error("Failed to save preferences:", error);
  }
}

export function loadPreferences() {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.PREFERENCES);
    return stored ? JSON.parse(stored) : {};
  } catch (error) {
    console.error("Failed to load preferences:", error);
    return {};
  }
}

export function clearAllData() {
  try {
    Object.values(STORAGE_KEYS).forEach((key) => {
      localStorage.removeItem(key);
    });
  } catch (error) {
    console.error("Failed to clear data:", error);
  }
}

// Helper functions for plan operations
export function createNewPlan(name, location = null) {
  return {
    id: Date.now().toString(),
    name,
    location,
    todos: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

// Migration from old storage format
const OLD_STORAGE_KEYS = {
  TODOS: "tripPlanner_todos",
  TRIP_LOCATION: "tripPlanner_tripLocation",
};

export function migrateOldDataIfNeeded() {
  try {
    // Check if new format already exists
    const existingPlans = loadPlans();
    if (existingPlans.length > 0) {
      return; // Already migrated or using new format
    }

    // Check for old format data
    const oldTodos = localStorage.getItem(OLD_STORAGE_KEYS.TODOS);
    const oldLocation = localStorage.getItem(OLD_STORAGE_KEYS.TRIP_LOCATION);

    if (oldTodos || oldLocation) {
      // Create a plan from old data
      const migratedPlan = createNewPlan(oldLocation || "My Trip", oldLocation);
      migratedPlan.todos = oldTodos ? JSON.parse(oldTodos) : [];

      // Save as new format
      savePlans([migratedPlan]);
      saveCurrentPlanId(migratedPlan.id);

      // Clean up old data
      localStorage.removeItem(OLD_STORAGE_KEYS.TODOS);
      localStorage.removeItem(OLD_STORAGE_KEYS.TRIP_LOCATION);

      console.log("Successfully migrated old trip data to new format");
    }
  } catch (error) {
    console.error("Failed to migrate old data:", error);
  }
}
