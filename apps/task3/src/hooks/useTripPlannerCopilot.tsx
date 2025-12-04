import { useCopilotAction, useCopilotReadable } from "@copilotkit/react-core";
import WeatherCard from "../components/WeatherCard";
import { Plan, Todo, UserPreferences, WeatherData } from "../types";
import { createNewPlan } from "../utils/storage";
import { getWeatherForLocation } from "../utils/weather";

interface UseTripPlannerCopilotProps {
  plans: Plan[];
  currentPlanId: string | null;
  currentPlan: Plan | undefined;
  todos: Todo[];
  weatherData: WeatherData | null;
  setPlans: React.Dispatch<React.SetStateAction<Plan[]>>;
  setCurrentPlanId: React.Dispatch<React.SetStateAction<string | null>>;
  setUserPreferences: React.Dispatch<React.SetStateAction<UserPreferences>>;
  setWeatherData: React.Dispatch<React.SetStateAction<WeatherData | null>>;
  updateCurrentPlan: (updates: Partial<Plan>) => void;
}

export function useTripPlannerCopilot({
  plans,
  currentPlanId,
  currentPlan,
  todos,
  weatherData,
  setPlans,
  setCurrentPlanId,
  setUserPreferences,
  setWeatherData,
  updateCurrentPlan,
}: UseTripPlannerCopilotProps) {
  // ============ READABLES ============

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
    value: {},
  });

  // ============ TODO ACTIONS ============

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

  // ============ WEATHER ACTION ============

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

  // ============ PLAN ACTIONS ============

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

  // ============ PREFERENCES ACTION ============

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
}
