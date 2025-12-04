import { useCopilotAction, useCopilotReadable } from "@copilotkit/react-core";
import { CopilotSidebar } from "@copilotkit/react-ui";
import "@copilotkit/react-ui/styles.css";
import { useEffect, useState } from "react";
import "./App.css";
import EmptyState from "./components/EmptyState";
import PlanSelector from "./components/PlanSelector";
import TodoList from "./components/TodoList";
import WeatherCard from "./components/WeatherCard";
import { Plan, Todo, UserPreferences, WeatherData } from "./types";
import {
  createNewPlan,
  loadCurrentPlanId,
  loadPlans,
  loadPreferences,
  saveCurrentPlanId,
  savePlans,
  savePreferences,
} from "./utils/storage";
import { getWeatherForLocation } from "./utils/weather";

function App() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [currentPlanId, setCurrentPlanId] = useState<string | null>(null);
  const [userPreferences, setUserPreferences] = useState<UserPreferences>({});
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);

  // Load data from localStorage on mount
  useEffect(() => {
    const loadedPlans = loadPlans();
    const loadedPreferences = loadPreferences();
    const loadedCurrentPlanId = loadCurrentPlanId();

    // If no plans exist, create a default one
    if (loadedPlans.length === 0) {
      const defaultPlan = createNewPlan("My First Trip");
      setPlans([defaultPlan]);
      setCurrentPlanId(defaultPlan.id);
    } else {
      setPlans(loadedPlans);
      // If saved currentPlanId exists and is valid, use it; otherwise use first plan
      if (
        loadedCurrentPlanId &&
        loadedPlans.some((p) => p.id === loadedCurrentPlanId)
      ) {
        setCurrentPlanId(loadedCurrentPlanId);
      } else {
        setCurrentPlanId(loadedPlans[0].id);
      }
    }

    setUserPreferences(loadedPreferences);
  }, []);

  // Save plans to localStorage whenever they change
  useEffect(() => {
    if (plans.length > 0) {
      savePlans(plans);
    }
  }, [plans]);

  // Save current plan ID to localStorage
  useEffect(() => {
    if (currentPlanId) {
      saveCurrentPlanId(currentPlanId);
    }
  }, [currentPlanId]);

  // Save preferences to localStorage
  useEffect(() => {
    savePreferences(userPreferences);
  }, [userPreferences]);

  // Get current plan
  const currentPlan = plans.find((p) => p.id === currentPlanId);
  const todos: Todo[] = currentPlan?.todos || [];
  const tripLocation: string | null = currentPlan?.location || null;

  // Update current plan
  const updateCurrentPlan = (updates: Partial<Plan>) => {
    setPlans((prev) =>
      prev.map((plan) =>
        plan.id === currentPlanId
          ? { ...plan, ...updates, updatedAt: new Date().toISOString() }
          : plan
      )
    );
  };

  // Make current plan readable by Copilot with explicit context
  useCopilotReadable({
    description: `The user is currently working on the plan named "${
      currentPlan?.name || "Unknown"
    }"${
      currentPlan?.location ? ` for ${currentPlan.location}` : ""
    }. This plan has ${
      todos.length
    } todos. Focus suggestions and responses on THIS plan only, not any other plans.`,
    value: {
      currentPlanId,
      currentPlanName: currentPlan?.name,
      currentPlanLocation: currentPlan?.location,
      currentPlanTodos: todos,
    },
  });

  // Make all plans readable
  useCopilotReadable({
    description:
      "All travel plans the user has created (for listing purposes only)",
    value: plans,
  });

  // Make user preferences readable
  useCopilotReadable({
    description: "User travel preferences",
    value: userPreferences,
  });

  // Action: Add todo
  useCopilotAction({
    name: "addTodo",
    description:
      "Add a new todo item to the current trip plan. Use appropriate categories like sightseeing, food, shopping, accommodation, or transportation.",
    parameters: [
      {
        name: "text",
        type: "string",
        description: "The todo text/description",
        required: true,
      },
      {
        name: "category",
        type: "string",
        description:
          "Category for the todo (e.g., sightseeing, food, shopping, accommodation, transportation)",
        required: false,
      },
    ],
    handler: async ({
      text,
      category,
    }: {
      text: string;
      category?: string;
    }) => {
      const newTodo: Todo = {
        id: Date.now().toString(),
        text,
        completed: false,
        category: category || "Other",
      };
      updateCurrentPlan({ todos: [...todos, newTodo] });
      return `Added todo: ${text}`;
    },
  });

  // Action: Remove todo
  useCopilotAction({
    name: "removeTodo",
    description:
      "Remove a todo item from the current plan by its ID or by matching the text.",
    parameters: [
      {
        name: "id",
        type: "string",
        description: "The ID of the todo to remove, or the text to match",
        required: true,
      },
    ],
    handler: async ({ id }: { id: string }) => {
      updateCurrentPlan({
        todos: todos.filter((todo) => todo.id !== id && todo.text !== id),
      });
      return `Removed todo`;
    },
  });

  // Action: Update todo
  useCopilotAction({
    name: "updateTodo",
    description:
      "Update a todo item's text, completion status, or category in the current plan.",
    parameters: [
      {
        name: "id",
        type: "string",
        description: "The ID of the todo to update",
        required: true,
      },
      {
        name: "text",
        type: "string",
        description: "New text for the todo",
        required: false,
      },
      {
        name: "completed",
        type: "boolean",
        description: "New completion status",
        required: false,
      },
      {
        name: "category",
        type: "string",
        description: "New category for the todo",
        required: false,
      },
    ],
    handler: async ({
      id,
      text,
      completed,
      category,
    }: {
      id: string;
      text?: string;
      completed?: boolean;
      category?: string;
    }) => {
      updateCurrentPlan({
        todos: todos.map((todo) =>
          todo.id === id
            ? {
                ...todo,
                ...(text !== undefined && { text }),
                ...(completed !== undefined && { completed }),
                ...(category !== undefined && { category }),
              }
            : todo
        ),
      });
      return `Updated todo`;
    },
  });

  // Action: List todos
  useCopilotAction({
    name: "listTodos",
    description: "Get the current list of todos with their details.",
    parameters: [],
    handler: async () => {
      if (todos.length === 0) {
        return "No todos yet. Ready to start planning!";
      }
      return JSON.stringify(todos, null, 2);
    },
  });

  // Action: Get weather
  useCopilotAction({
    name: "getWeather",
    description:
      "Get current weather information for a location. Use this to provide weather-aware travel recommendations.",
    parameters: [
      {
        name: "location",
        type: "string",
        description: 'City name or location (e.g., "Paris", "Tokyo, Japan")',
        required: true,
      },
    ],
    handler: async ({ location }: { location: string }) => {
      const weather = await getWeatherForLocation(location);
      setWeatherData(weather);
      return `Current weather in ${weather.location}: ${weather.temperature}°C, ${weather.description}. Humidity: ${weather.humidity}%, Wind: ${weather.windSpeed} km/h.`;
    },
    render: ({ status }) => {
      if (status === "complete" && weatherData) {
        return <WeatherCard weatherData={weatherData} />;
      }
      return <></>;
    },
  });

  // Action: Set trip location
  useCopilotAction({
    name: "setTripLocation",
    description: "Set or update the destination for the current trip plan.",
    parameters: [
      {
        name: "location",
        type: "string",
        description: "The destination/location name",
        required: true,
      },
    ],
    handler: async ({ location }: { location: string }) => {
      updateCurrentPlan({ location });
      return `Trip location set to: ${location}`;
    },
  });

  // Action: Create new plan
  useCopilotAction({
    name: "createPlan",
    description:
      "Create a new trip plan. Use this when the user wants to plan a different trip.",
    parameters: [
      {
        name: "name",
        type: "string",
        description:
          "Name for the new plan (e.g., 'Tokyo Trip', 'Paris Adventure')",
        required: true,
      },
      {
        name: "location",
        type: "string",
        description: "Optional destination for the plan",
        required: false,
      },
    ],
    handler: async ({
      name,
      location,
    }: {
      name: string;
      location?: string;
    }) => {
      const newPlan = createNewPlan(name, location);
      setPlans((prev) => [...prev, newPlan]);
      setCurrentPlanId(newPlan.id);
      return `✓ Created new plan: "${name}"${
        location ? ` for ${location}` : ""
      }. This is now the active plan. All suggestions and actions will apply to this plan.`;
    },
  });

  // Action: Switch plan
  useCopilotAction({
    name: "switchPlan",
    description:
      "Switch to a different trip plan. Use this to work on a different trip.",
    parameters: [
      {
        name: "planName",
        type: "string",
        description: "Name or partial name of the plan to switch to",
        required: true,
      },
    ],
    handler: async ({ planName }: { planName: string }) => {
      const plan = plans.find((p) =>
        p.name.toLowerCase().includes(planName.toLowerCase())
      );
      if (plan) {
        setCurrentPlanId(plan.id);
        return `✓ Successfully switched to plan: "${plan.name}"${
          plan.location ? ` (${plan.location})` : ""
        }. This plan has ${
          plan.todos.length
        } todos. All future suggestions and actions will now apply to this plan only.`;
      }
      return `Could not find plan matching: ${planName}`;
    },
  });

  // Action: List plans
  useCopilotAction({
    name: "listPlans",
    description: "Get a list of all trip plans with their details.",
    parameters: [],
    handler: async () => {
      if (plans.length === 0) {
        return "No plans yet.";
      }
      return (
        "All plans:\n" +
        plans
          .map(
            (p) =>
              `${p.id === currentPlanId ? "➤ [ACTIVE] " : "  "}${p.name}${
                p.location ? ` (${p.location})` : ""
              } - ${p.todos.length} todos`
          )
          .join("\n")
      );
    },
  });

  // Action: Update user preferences
  useCopilotAction({
    name: "updateUserPreferences",
    description:
      "Update user travel preferences to personalize recommendations.",
    parameters: [
      {
        name: "favoriteDestinations",
        type: "string[]",
        description: "Array of favorite destinations",
        required: false,
      },
      {
        name: "travelStyle",
        type: "string",
        description:
          "User's travel style (e.g., luxury, budget, adventure, cultural)",
        required: false,
      },
      {
        name: "interests",
        type: "string[]",
        description:
          "Array of interests (e.g., museums, food, nature, nightlife)",
        required: false,
      },
    ],
    handler: async ({
      favoriteDestinations,
      travelStyle,
      interests,
    }: {
      favoriteDestinations?: string[];
      travelStyle?: string;
      interests?: string[];
    }) => {
      setUserPreferences((prev) => ({
        ...prev,
        ...(favoriteDestinations && { favoriteDestinations }),
        ...(travelStyle && { travelStyle }),
        ...(interests && { interests }),
      }));
      return "User preferences updated";
    },
  });

  const toggleTodo = (id: string) => {
    updateCurrentPlan({
      todos: todos.map((todo) =>
        todo.id === id ? { ...todo, completed: !todo.completed } : todo
      ),
    });
  };

  const deleteTodo = (id: string) => {
    updateCurrentPlan({
      todos: todos.filter((todo) => todo.id !== id),
    });
  };

  const handleCreatePlan = (name: string) => {
    const newPlan = createNewPlan(name);
    setPlans((prev) => [...prev, newPlan]);
    setCurrentPlanId(newPlan.id);
  };

  const handleDeletePlan = (planId: string) => {
    setPlans((prev) => {
      const filtered = prev.filter((p) => p.id !== planId);
      // If deleting current plan, switch to first remaining plan
      if (planId === currentPlanId && filtered.length > 0) {
        setCurrentPlanId(filtered[0].id);
      }
      return filtered;
    });
  };

  const handleRenamePlan = (planId: string, newName: string) => {
    setPlans((prev) =>
      prev.map((plan) =>
        plan.id === planId
          ? { ...plan, name: newName, updatedAt: new Date().toISOString() }
          : plan
      )
    );
  };

  return (
    <>
      <CopilotSidebar
        defaultOpen={true}
        clickOutsideToClose={false}
        labels={{
          title: "Trip Planning Assistant",
          initial:
            '👋 Hi! I\'m your travel planning assistant. I can help you plan trips and manage your todo list.\n\n✈️ Try saying:\n- "Help me create a todo list for a trip to Paris"\n- "Create a new plan for my Tokyo trip"\n- "Switch to my Paris plan"\n- "What\'s the weather like in Tokyo?"\n- "Add a todo to visit the Eiffel Tower"\n\nYou can manage multiple trip plans simultaneously and I\'ll remember everything!',
        }}
      >
        <div className="h-screen w-full flex flex-col bg-gradient-to-br from-blue-50 via-white to-purple-50">
          {/* Header */}
          <div className="bg-white border-b border-gray-200 shadow-sm">
            <div className="max-w-6xl mx-auto px-6 py-4">
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1">
                  <h1 className="text-3xl font-bold text-gray-800">
                    ✈️ Trip Planner
                  </h1>
                  {tripLocation && (
                    <p className="text-gray-600 mt-1">
                      Planning for:{" "}
                      <span className="font-semibold text-blue-600">
                        {tripLocation}
                      </span>
                    </p>
                  )}
                </div>
                <PlanSelector
                  plans={plans}
                  currentPlanId={currentPlanId}
                  onSelectPlan={setCurrentPlanId}
                  onCreatePlan={handleCreatePlan}
                  onDeletePlan={handleDeletePlan}
                  onRenamePlan={handleRenamePlan}
                />
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 overflow-y-auto px-6 py-8">
            <div className="max-w-6xl mx-auto">
              {todos.length > 0 ? (
                <TodoList
                  todos={todos}
                  onToggle={toggleTodo}
                  onDelete={deleteTodo}
                />
              ) : (
                <EmptyState />
              )}
            </div>
          </div>
        </div>
      </CopilotSidebar>
    </>
  );
}

export default App;
