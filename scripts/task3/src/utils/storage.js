/**
 * LocalStorage utility functions for persisting app state
 */

const STORAGE_KEYS = {
  TODOS: "tripPlanner_todos",
  PREFERENCES: "tripPlanner_preferences",
  TRIP_LOCATION: "tripPlanner_tripLocation",
};

export function saveTodos(todos) {
  try {
    localStorage.setItem(STORAGE_KEYS.TODOS, JSON.stringify(todos));
  } catch (error) {
    console.error("Failed to save todos:", error);
  }
}

export function loadTodos() {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.TODOS);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error("Failed to load todos:", error);
    return [];
  }
}

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

export function saveTripLocation(location) {
  try {
    localStorage.setItem(STORAGE_KEYS.TRIP_LOCATION, location || "");
  } catch (error) {
    console.error("Failed to save trip location:", error);
  }
}

export function loadTripLocation() {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.TRIP_LOCATION);
    return stored || null;
  } catch (error) {
    console.error("Failed to load trip location:", error);
    return null;
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
