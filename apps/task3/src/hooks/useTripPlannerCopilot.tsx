import { useCopilotAction, useCopilotReadable } from "@copilotkit/react-core";
import WeatherCard from "../components/WeatherCard";
import {
  ItineraryItem,
  Plan,
  Todo,
  TransportMode,
  UserPreferences,
  WeatherData,
} from "../types";
import { searchLocations } from "../utils/geocoding";
import { formatDuration, getTravelTime } from "../utils/routing";
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
  updateCurrentPlan: (
    updater: Partial<Plan> | ((currentPlan: Plan) => Partial<Plan>)
  ) => void;
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

  const itinerary = currentPlan?.itinerary || [];

  // Build a detailed itinerary structure description for the copilot
  const getItineraryStructure = () => {
    if (itinerary.length === 0) return "No itinerary stops yet.";

    return itinerary
      .map((item, i) => {
        const linkedTodos = todos.filter((t) => t.itineraryItemId === item.id);
        const todoInfo =
          linkedTodos.length > 0
            ? ` | Activities: ${linkedTodos.map((t) => t.text).join(", ")}`
            : "";
        const travelInfo = item.estimatedTravelMinutes
          ? ` (~${item.estimatedTravelMinutes}min travel)`
          : "";
        return `${i + 1}. [${item.arrivalTime}] ${item.locationName} (by ${
          item.transportMode
        })${travelInfo}${todoInfo} [id:${item.id}]`;
      })
      .join("\n");
  };

  // Make current plan readable by Copilot with explicit context
  useCopilotReadable({
    description: `The user is currently working on the plan named "${
      currentPlan?.name || "Unknown"
    }"${currentPlan?.location ? ` for ${currentPlan.location}` : ""}${
      currentPlan?.date ? ` on ${currentPlan.date}` : ""
    }. This plan has ${todos.length} todos and ${
      itinerary.length
    } itinerary stops. Focus suggestions and responses on THIS plan only, not any other plans. 

IMPORTANT: When the user wants to add a stop with activities (e.g., "go to Paris and visit a cafe"), use addItineraryItemWithActivities to create both the stop AND linked todos in one action.

When modifying existing itinerary items, check the current structure to ensure timings are feasible. If you change arrival times or transport modes, consider using recalculateItineraryTimings to adjust subsequent stops.

Current itinerary structure:
${getItineraryStructure()}`,
    value: {
      currentPlanId,
      currentPlanName: currentPlan?.name,
      currentPlanLocation: currentPlan?.location,
      currentPlanDate: currentPlan?.date,
      currentPlanTodos: todos,
      currentPlanItinerary: itinerary.map((item) => ({
        ...item,
        linkedTodos: todos.filter((t) => t.itineraryItemId === item.id),
      })),
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
      "Add a new todo item to the current trip plan. Use appropriate categories like sightseeing, food, shopping, accommodation, or transportation. Can optionally link to an itinerary stop.",
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
      {
        name: "itineraryItemId",
        type: "string",
        description:
          "Optional ID of an itinerary stop to link this todo to. Use this to associate tasks with specific stops in the itinerary.",
        required: false,
      },
    ],
    handler: async ({
      text,
      category,
      itineraryItemId,
    }: {
      text: string;
      category?: string;
      itineraryItemId?: string;
    }) => {
      const newTodo: Todo = {
        id: Date.now().toString(),
        text,
        completed: false,
        category: category || "Other",
        itineraryItemId,
      };
      updateCurrentPlan((plan) => ({ todos: [...plan.todos, newTodo] }));
      const linkedTo = itineraryItemId ? ` (linked to itinerary stop)` : "";
      return `Added todo: ${text}${linkedTo}`;
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
      updateCurrentPlan((plan) => ({
        todos: plan.todos.filter((todo) => todo.id !== id && todo.text !== id),
      }));
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
      updateCurrentPlan((plan) => ({
        todos: plan.todos.map((todo) =>
          todo.id === id
            ? {
                ...todo,
                ...(text !== undefined && { text }),
                ...(completed !== undefined && { completed }),
                ...(category !== undefined && { category }),
              }
            : todo
        ),
      }));
      return `Updated todo`;
    },
  });

  useCopilotAction({
    name: "listTodos",
    description: "Get the current list of todos with their details.",
    parameters: [],
    handler: async () => {
      // Get fresh state
      let currentTodos: Todo[] = [];
      setPlans((prev) => {
        const plan = prev.find((p) => p.id === currentPlanId);
        currentTodos = plan?.todos || [];
        return prev;
      });

      if (currentTodos.length === 0) {
        return "No todos yet. Ready to start planning!";
      }
      return JSON.stringify(currentTodos, null, 2);
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
      // Get fresh state
      let currentPlans: Plan[] = [];
      setPlans((prev) => {
        currentPlans = prev;
        return prev;
      });

      if (currentPlans.length === 0) {
        return "No plans yet.";
      }
      return (
        "All plans:\n" +
        currentPlans
          .map(
            (p) =>
              `${p.id === currentPlanId ? "➤ [ACTIVE] " : "  "}${p.name}${
                p.location ? ` (${p.location})` : ""
              } - ${p.todos.length} todos, ${p.itinerary?.length || 0} stops`
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

  // ============ ITINERARY ACTIONS ============

  useCopilotAction({
    name: "searchLocation",
    description:
      "Search for a location/place using Nominatim (OpenStreetMap). Returns matching places with coordinates. Use this before adding itinerary items to get accurate coordinates.",
    parameters: [
      {
        name: "query",
        type: "string",
        description:
          'Search query (e.g., "Eiffel Tower", "Paris", "Cafe de Flore Paris")',
        required: true,
      },
      {
        name: "countryCode",
        type: "string",
        description:
          'Optional 2-letter country code to limit results (e.g., "fr" for France, "de" for Germany)',
        required: false,
      },
    ],
    handler: async ({
      query,
      countryCode,
    }: {
      query: string;
      countryCode?: string;
    }) => {
      const results = await searchLocations(query, countryCode);
      if (results.length === 0) {
        return `No locations found for "${query}"`;
      }
      return (
        `Found ${results.length} location(s):\n` +
        results
          .map(
            (r, i) =>
              `${i + 1}. ${r.name} (${r.displayName}) - coords: ${
                r.coordinates.lat
              }, ${r.coordinates.lon}`
          )
          .join("\n")
      );
    },
  });

  useCopilotAction({
    name: "addItineraryItem",
    description:
      "Add a stop to the trip itinerary. Use searchLocation first to get coordinates for the location.",
    parameters: [
      {
        name: "locationName",
        type: "string",
        description: "Name of the location/stop",
        required: true,
      },
      {
        name: "description",
        type: "string",
        description:
          "Additional details for the location/stop if provided / available",
        required: false,
      },
      {
        name: "lat",
        type: "number",
        description: "Latitude coordinate",
        required: true,
      },
      {
        name: "lon",
        type: "number",
        description: "Longitude coordinate",
        required: true,
      },
      {
        name: "arrivalTime",
        type: "string",
        description: 'Arrival time in HH:mm format (e.g., "12:00", "15:30")',
        required: true,
      },
      {
        name: "transportMode",
        type: "string",
        description:
          'How to arrive at this stop: "car", "walking", "bus", "train", or "tram"',
        required: true,
      },
      {
        name: "notes",
        type: "string",
        description: "Notes for this stop if available",
        required: false,
      },
    ],
    handler: async ({
      locationName,
      lat,
      lon,
      arrivalTime,
      transportMode,
      notes,
    }: {
      locationName: string;
      lat: number;
      lon: number;
      arrivalTime: string;
      transportMode: string;
      notes?: string;
    }) => {
      const validModes: TransportMode[] = [
        "car",
        "walking",
        "bus",
        "train",
        "tram",
      ];
      const mode: TransportMode = validModes.includes(
        transportMode as TransportMode
      )
        ? (transportMode as TransportMode)
        : "car";

      // We need to get the current itinerary state and calculate travel time
      // Use a promise to handle the async operation with current state
      let estimatedTravelMinutes: number | undefined;
      let resolveUpdate: (value: Plan) => void;
      const currentPlanPromise = new Promise<Plan>((resolve) => {
        resolveUpdate = resolve;
      });

      // First, get the current plan state
      setPlans((prev) => {
        const plan = prev.find((p) => p.id === currentPlanId);
        if (plan) {
          resolveUpdate(plan);
        }
        return prev; // Don't modify yet
      });

      const currentPlanState = await currentPlanPromise;
      const currentItinerary = currentPlanState.itinerary || [];

      // Calculate travel time from previous stop if exists
      if (currentItinerary.length > 0) {
        const prevStop = currentItinerary[currentItinerary.length - 1];
        const route = await getTravelTime(
          prevStop.coordinates,
          { lat, lon },
          mode
        );
        if (route) {
          estimatedTravelMinutes = route.durationMinutes;
        }
      }

      const newItem: ItineraryItem = {
        id: Date.now().toString(),
        locationName,
        coordinates: { lat, lon },
        arrivalTime,
        transportMode: mode,
        estimatedTravelMinutes,
        notes,
      };

      // Now update using functional form to get latest state
      updateCurrentPlan((plan) => ({
        itinerary: [...(plan.itinerary || []), newItem],
      }));

      let response = `Added "${locationName}" to itinerary at ${arrivalTime} (by ${mode})`;
      if (estimatedTravelMinutes) {
        response += `. Estimated travel time from previous stop: ${formatDuration(
          estimatedTravelMinutes
        )}`;
      }
      return response;
    },
  });

  useCopilotAction({
    name: "addItineraryItemWithActivities",
    description:
      "Add a stop to the itinerary WITH associated activities/todos. Use this when the user wants to go somewhere and do specific things there (e.g., 'go to Paris and visit a cafe, then go shopping'). This creates the itinerary stop AND linked todos in one operation.",
    parameters: [
      {
        name: "locationName",
        type: "string",
        description: "Name of the location/stop",
        required: true,
      },
      {
        name: "lat",
        type: "number",
        description: "Latitude coordinate",
        required: true,
      },
      {
        name: "lon",
        type: "number",
        description: "Longitude coordinate",
        required: true,
      },
      {
        name: "arrivalTime",
        type: "string",
        description: 'Arrival time in HH:mm format (e.g., "12:00", "15:30")',
        required: true,
      },
      {
        name: "transportMode",
        type: "string",
        description:
          'How to arrive at this stop: "car", "walking", "bus", "train", or "tram"',
        required: true,
      },
      {
        name: "activities",
        type: "object[]",
        description:
          "Array of activities/todos to do at this location. Each activity has: text (string, required), category (string, optional - e.g., sightseeing, food, shopping)",
        required: true,
      },
      {
        name: "notes",
        type: "string",
        description: "Notes for this stop if available",
        required: false,
      },
    ],
    handler: async ({
      locationName,
      lat,
      lon,
      arrivalTime,
      transportMode,
      activities,
      notes,
    }: {
      locationName: string;
      lat: number;
      lon: number;
      arrivalTime: string;
      transportMode: string;
      activities: Array<{ text: string; category?: string }>;
      notes?: string;
    }) => {
      const validModes: TransportMode[] = [
        "car",
        "walking",
        "bus",
        "train",
        "tram",
      ];
      const mode: TransportMode = validModes.includes(
        transportMode as TransportMode
      )
        ? (transportMode as TransportMode)
        : "car";

      // Get current plan state for travel time calculation
      let estimatedTravelMinutes: number | undefined;
      let resolveUpdate: (value: Plan) => void;
      const currentPlanPromise = new Promise<Plan>((resolve) => {
        resolveUpdate = resolve;
      });

      setPlans((prev) => {
        const plan = prev.find((p) => p.id === currentPlanId);
        if (plan) {
          resolveUpdate(plan);
        }
        return prev;
      });

      const currentPlanState = await currentPlanPromise;
      const currentItinerary = currentPlanState.itinerary || [];

      // Calculate travel time from previous stop if exists
      if (currentItinerary.length > 0) {
        const prevStop = currentItinerary[currentItinerary.length - 1];
        const route = await getTravelTime(
          prevStop.coordinates,
          { lat, lon },
          mode
        );
        if (route) {
          estimatedTravelMinutes = route.durationMinutes;
        }
      }

      const itemId = Date.now().toString();
      const newItem: ItineraryItem = {
        id: itemId,
        locationName,
        coordinates: { lat, lon },
        arrivalTime,
        transportMode: mode,
        estimatedTravelMinutes,
        notes,
      };

      // Create linked todos for each activity
      const newTodos: Todo[] = activities.map((activity, index) => ({
        id: `${itemId}-todo-${index}`,
        text: activity.text,
        completed: false,
        category: activity.category || "Other",
        itineraryItemId: itemId,
      }));

      // Update plan with both itinerary item and todos
      updateCurrentPlan((plan) => ({
        itinerary: [...(plan.itinerary || []), newItem],
        todos: [...plan.todos, ...newTodos],
      }));

      let response = `Added "${locationName}" to itinerary at ${arrivalTime} (by ${mode}) with ${
        activities.length
      } activity(ies): ${activities.map((a) => a.text).join(", ")}`;
      if (estimatedTravelMinutes) {
        response += `. Travel time from previous stop: ${formatDuration(
          estimatedTravelMinutes
        )}`;
      }
      return response;
    },
  });

  useCopilotAction({
    name: "updateItineraryItem",
    description:
      "Update an existing itinerary stop. Can also recalculate travel times and optionally shift subsequent stops to maintain feasible timing.",
    parameters: [
      {
        name: "itemId",
        type: "string",
        description: "ID of the itinerary item to update",
        required: true,
      },
      {
        name: "locationName",
        type: "string",
        description: "New location name",
        required: false,
      },
      {
        name: "lat",
        type: "number",
        description: "New latitude coordinate (required if changing location)",
        required: false,
      },
      {
        name: "lon",
        type: "number",
        description: "New longitude coordinate (required if changing location)",
        required: false,
      },
      {
        name: "arrivalTime",
        type: "string",
        description: "New arrival time in HH:mm format",
        required: false,
      },
      {
        name: "transportMode",
        type: "string",
        description:
          'New transport mode: "car", "walking", "bus", "train", or "tram"',
        required: false,
      },
      {
        name: "notes",
        type: "string",
        description: "New notes for this stop",
        required: false,
      },
      {
        name: "adjustSubsequentStops",
        type: "boolean",
        description:
          "If true, automatically adjusts arrival times of all subsequent stops based on new timing. Useful when changing arrival time of an early stop.",
        required: false,
      },
    ],
    handler: async ({
      itemId,
      locationName,
      lat,
      lon,
      arrivalTime,
      transportMode,
      notes,
      adjustSubsequentStops,
    }: {
      itemId: string;
      locationName?: string;
      lat?: number;
      lon?: number;
      arrivalTime?: string;
      transportMode?: string;
      notes?: string;
      adjustSubsequentStops?: boolean;
    }) => {
      // Get current plan state
      let resolveUpdate: (value: Plan) => void;
      const currentPlanPromise = new Promise<Plan>((resolve) => {
        resolveUpdate = resolve;
      });
      setPlans((prev) => {
        const plan = prev.find((p) => p.id === currentPlanId);
        if (plan) resolveUpdate(plan);
        return prev;
      });

      const currentPlanState = await currentPlanPromise;
      const currentItinerary = [...(currentPlanState.itinerary || [])];
      const itemIndex = currentItinerary.findIndex((i) => i.id === itemId);

      if (itemIndex === -1) {
        return `Item with ID ${itemId} not found`;
      }

      const item = currentItinerary[itemIndex];
      const validModes: TransportMode[] = [
        "car",
        "walking",
        "bus",
        "train",
        "tram",
      ];

      // Prepare updated item
      const updatedItem: ItineraryItem = {
        ...item,
        ...(locationName && { locationName }),
        ...(lat !== undefined && lon !== undefined
          ? { coordinates: { lat, lon } }
          : {}),
        ...(arrivalTime && { arrivalTime }),
        ...(transportMode && validModes.includes(transportMode as TransportMode)
          ? { transportMode: transportMode as TransportMode }
          : {}),
        ...(notes !== undefined && { notes }),
      };

      // Recalculate travel time to this item if location or transport changed
      if (
        itemIndex > 0 &&
        (lat !== undefined || lon !== undefined || transportMode)
      ) {
        const prevStop = currentItinerary[itemIndex - 1];
        const route = await getTravelTime(
          prevStop.coordinates,
          updatedItem.coordinates,
          updatedItem.transportMode
        );
        if (route) {
          updatedItem.estimatedTravelMinutes = route.durationMinutes;
        }
      }

      currentItinerary[itemIndex] = updatedItem;

      // Recalculate travel time FROM this item to next if location changed
      if (
        itemIndex < currentItinerary.length - 1 &&
        (lat !== undefined || lon !== undefined)
      ) {
        const nextStop = currentItinerary[itemIndex + 1];
        const route = await getTravelTime(
          updatedItem.coordinates,
          nextStop.coordinates,
          nextStop.transportMode
        );
        if (route) {
          currentItinerary[itemIndex + 1] = {
            ...nextStop,
            estimatedTravelMinutes: route.durationMinutes,
          };
        }
      }

      // Adjust subsequent stops if requested
      if (
        adjustSubsequentStops &&
        arrivalTime &&
        itemIndex < currentItinerary.length - 1
      ) {
        // Calculate time difference
        const oldTime = item.arrivalTime;
        const [oldH, oldM] = oldTime.split(":").map(Number);
        const [newH, newM] = arrivalTime.split(":").map(Number);
        const diffMinutes = newH * 60 + newM - (oldH * 60 + oldM);

        // Shift all subsequent items
        for (let i = itemIndex + 1; i < currentItinerary.length; i++) {
          const subsequentItem = currentItinerary[i];
          const [h, m] = subsequentItem.arrivalTime.split(":").map(Number);
          const newTotal = h * 60 + m + diffMinutes;
          const newHours = Math.floor(newTotal / 60) % 24;
          const newMins = newTotal % 60;
          currentItinerary[i] = {
            ...subsequentItem,
            arrivalTime: `${newHours.toString().padStart(2, "0")}:${newMins
              .toString()
              .padStart(2, "0")}`,
          };
        }
      }

      updateCurrentPlan({ itinerary: currentItinerary });

      let response = `Updated itinerary item: ${updatedItem.locationName}`;
      if (adjustSubsequentStops && arrivalTime) {
        response += `. Adjusted ${
          currentItinerary.length - itemIndex - 1
        } subsequent stop(s)`;
      }
      return response;
    },
  });

  useCopilotAction({
    name: "recalculateItineraryTimings",
    description:
      "Recalculate travel times for all itinerary items and optionally adjust arrival times to be feasible. Use this after making changes to verify the route is possible and fix any timing issues.",
    parameters: [
      {
        name: "autoAdjustTimes",
        type: "boolean",
        description:
          "If true, automatically adjusts arrival times to account for travel duration. If false, only recalculates travel times and reports conflicts.",
        required: true,
      },
      {
        name: "minimumStopDuration",
        type: "number",
        description:
          "Minimum time in minutes to spend at each stop (default: 30). Used when auto-adjusting times.",
        required: false,
      },
    ],
    handler: async ({
      autoAdjustTimes,
      minimumStopDuration = 30,
    }: {
      autoAdjustTimes: boolean;
      minimumStopDuration?: number;
    }) => {
      // Get current plan state
      let resolveUpdate: (value: Plan) => void;
      const currentPlanPromise = new Promise<Plan>((resolve) => {
        resolveUpdate = resolve;
      });
      setPlans((prev) => {
        const plan = prev.find((p) => p.id === currentPlanId);
        if (plan) resolveUpdate(plan);
        return prev;
      });

      const currentPlanState = await currentPlanPromise;
      const currentItinerary = [...(currentPlanState.itinerary || [])];

      if (currentItinerary.length < 2) {
        return "Need at least 2 stops to calculate travel times.";
      }

      const conflicts: string[] = [];
      const updates: string[] = [];

      // Recalculate travel times between all stops
      for (let i = 1; i < currentItinerary.length; i++) {
        const prevStop = currentItinerary[i - 1];
        const currentStop = currentItinerary[i];

        const route = await getTravelTime(
          prevStop.coordinates,
          currentStop.coordinates,
          currentStop.transportMode
        );

        if (route) {
          currentItinerary[i] = {
            ...currentStop,
            estimatedTravelMinutes: route.durationMinutes,
          };

          // Check if timing is feasible
          const [prevH, prevM] = prevStop.arrivalTime.split(":").map(Number);
          const [currH, currM] = currentStop.arrivalTime.split(":").map(Number);
          const prevMinutes = prevH * 60 + prevM;
          const currMinutes = currH * 60 + currM;
          const availableTime = currMinutes - prevMinutes;

          if (availableTime < route.durationMinutes + minimumStopDuration) {
            conflicts.push(
              `${prevStop.locationName} → ${currentStop.locationName}: need ${route.durationMinutes}min travel + ${minimumStopDuration}min stop, but only ${availableTime}min available`
            );

            if (autoAdjustTimes) {
              // Adjust this stop's arrival time
              const newArrival =
                prevMinutes + route.durationMinutes + minimumStopDuration;
              const newH = Math.floor(newArrival / 60) % 24;
              const newM = newArrival % 60;
              currentItinerary[i] = {
                ...currentItinerary[i],
                arrivalTime: `${newH.toString().padStart(2, "0")}:${newM
                  .toString()
                  .padStart(2, "0")}`,
              };
              updates.push(
                `Adjusted ${currentStop.locationName} to ${currentItinerary[i].arrivalTime}`
              );
            }
          }
        }
      }

      updateCurrentPlan({ itinerary: currentItinerary });

      let response = `Recalculated travel times for ${currentItinerary.length} stops.`;
      if (conflicts.length > 0) {
        response += `\n\nTiming issues found:\n${conflicts.join("\n")}`;
      }
      if (updates.length > 0) {
        response += `\n\nAdjustments made:\n${updates.join("\n")}`;
      }
      if (conflicts.length === 0) {
        response += "\n\n✓ All timings are feasible!";
      }

      return response;
    },
  });

  useCopilotAction({
    name: "insertItineraryItemAt",
    description:
      "Insert a new stop at a specific position in the itinerary. Useful for adding stops between existing ones. Automatically recalculates travel times for the new connections.",
    parameters: [
      {
        name: "position",
        type: "number",
        description:
          "Position to insert at (0 = beginning, 1 = after first stop, etc.)",
        required: true,
      },
      {
        name: "locationName",
        type: "string",
        description: "Name of the location/stop",
        required: true,
      },
      {
        name: "lat",
        type: "number",
        description: "Latitude coordinate",
        required: true,
      },
      {
        name: "lon",
        type: "number",
        description: "Longitude coordinate",
        required: true,
      },
      {
        name: "arrivalTime",
        type: "string",
        description: 'Arrival time in HH:mm format (e.g., "12:00", "15:30")',
        required: true,
      },
      {
        name: "transportMode",
        type: "string",
        description:
          'How to arrive at this stop: "car", "walking", "bus", "train", or "tram"',
        required: true,
      },
      {
        name: "notes",
        type: "string",
        description: "Notes for this stop",
        required: false,
      },
    ],
    handler: async ({
      position,
      locationName,
      lat,
      lon,
      arrivalTime,
      transportMode,
      notes,
    }: {
      position: number;
      locationName: string;
      lat: number;
      lon: number;
      arrivalTime: string;
      transportMode: string;
      notes?: string;
    }) => {
      const validModes: TransportMode[] = [
        "car",
        "walking",
        "bus",
        "train",
        "tram",
      ];
      const mode: TransportMode = validModes.includes(
        transportMode as TransportMode
      )
        ? (transportMode as TransportMode)
        : "car";

      // Get current plan state
      let resolveUpdate: (value: Plan) => void;
      const currentPlanPromise = new Promise<Plan>((resolve) => {
        resolveUpdate = resolve;
      });
      setPlans((prev) => {
        const plan = prev.find((p) => p.id === currentPlanId);
        if (plan) resolveUpdate(plan);
        return prev;
      });

      const currentPlanState = await currentPlanPromise;
      const currentItinerary = [...(currentPlanState.itinerary || [])];

      // Clamp position to valid range
      const insertPos = Math.max(
        0,
        Math.min(position, currentItinerary.length)
      );

      let estimatedTravelMinutes: number | undefined;

      // Calculate travel time FROM previous stop to this new stop
      if (insertPos > 0) {
        const prevStop = currentItinerary[insertPos - 1];
        const route = await getTravelTime(
          prevStop.coordinates,
          { lat, lon },
          mode
        );
        if (route) {
          estimatedTravelMinutes = route.durationMinutes;
        }
      }

      const newItem: ItineraryItem = {
        id: Date.now().toString(),
        locationName,
        coordinates: { lat, lon },
        arrivalTime,
        transportMode: mode,
        estimatedTravelMinutes,
        notes,
      };

      // Insert the new item
      currentItinerary.splice(insertPos, 0, newItem);

      // Recalculate travel time FROM this new stop TO the next stop
      if (insertPos < currentItinerary.length - 1) {
        const nextStop = currentItinerary[insertPos + 1];
        const route = await getTravelTime(
          { lat, lon },
          nextStop.coordinates,
          nextStop.transportMode
        );
        if (route) {
          currentItinerary[insertPos + 1] = {
            ...nextStop,
            estimatedTravelMinutes: route.durationMinutes,
          };
        }
      }

      updateCurrentPlan({ itinerary: currentItinerary });

      let response = `Inserted "${locationName}" at position ${
        insertPos + 1
      } in the itinerary (arriving at ${arrivalTime} by ${mode})`;
      if (estimatedTravelMinutes) {
        response += `. Travel time from previous stop: ${formatDuration(
          estimatedTravelMinutes
        )}`;
      }
      return response;
    },
  });

  useCopilotAction({
    name: "removeItineraryItem",
    description:
      "Remove a stop from the itinerary. Automatically recalculates travel time between the stops that become adjacent.",
    parameters: [
      {
        name: "itemId",
        type: "string",
        description:
          "ID of the itinerary item to remove, or the location name to match",
        required: true,
      },
    ],
    handler: async ({ itemId }: { itemId: string }) => {
      // Get current plan state to find position and recalculate travel times
      let resolveUpdate: (value: Plan) => void;
      const currentPlanPromise = new Promise<Plan>((resolve) => {
        resolveUpdate = resolve;
      });
      setPlans((prev) => {
        const plan = prev.find((p) => p.id === currentPlanId);
        if (plan) resolveUpdate(plan);
        return prev;
      });

      const currentPlanState = await currentPlanPromise;
      const currentItinerary = [...(currentPlanState.itinerary || [])];

      // Find the item to remove
      const removeIndex = currentItinerary.findIndex(
        (item) =>
          item.id === itemId ||
          item.locationName.toLowerCase().includes(itemId.toLowerCase())
      );

      if (removeIndex === -1) {
        return `Item "${itemId}" not found in itinerary`;
      }

      const removedItem = currentItinerary[removeIndex];

      // Remove the item
      currentItinerary.splice(removeIndex, 1);

      // Recalculate travel time for the item that's now at this position (the one that was after the removed item)
      if (removeIndex > 0 && removeIndex < currentItinerary.length) {
        const prevStop = currentItinerary[removeIndex - 1];
        const newNextStop = currentItinerary[removeIndex];
        const route = await getTravelTime(
          prevStop.coordinates,
          newNextStop.coordinates,
          newNextStop.transportMode
        );
        if (route) {
          currentItinerary[removeIndex] = {
            ...newNextStop,
            estimatedTravelMinutes: route.durationMinutes,
          };
        }
      }

      // Unlink any todos that were linked to this item
      const updatedTodos = currentPlanState.todos.map((todo) =>
        todo.itineraryItemId === removedItem.id
          ? { ...todo, itineraryItemId: undefined }
          : todo
      );

      updateCurrentPlan({ itinerary: currentItinerary, todos: updatedTodos });

      return `Removed "${removedItem.locationName}" from itinerary`;
    },
  });

  useCopilotAction({
    name: "reorderItinerary",
    description:
      "Reorder itinerary items. Provide the item IDs in the new desired order.",
    parameters: [
      {
        name: "itemIds",
        type: "string[]",
        description: "Array of item IDs in the new order",
        required: true,
      },
    ],
    handler: async ({ itemIds }: { itemIds: string[] }) => {
      updateCurrentPlan((plan) => {
        const itemMap = new Map(
          (plan.itinerary || []).map((item) => [item.id, item])
        );
        const reorderedItinerary = itemIds
          .map((id) => itemMap.get(id))
          .filter((item): item is ItineraryItem => item !== undefined);
        return { itinerary: reorderedItinerary };
      });
      return "Itinerary reordered";
    },
  });

  useCopilotAction({
    name: "calculateRoute",
    description:
      "Calculate travel time and distance between two locations. Use this to estimate arrival times.",
    parameters: [
      {
        name: "fromLat",
        type: "number",
        description: "Starting point latitude",
        required: true,
      },
      {
        name: "fromLon",
        type: "number",
        description: "Starting point longitude",
        required: true,
      },
      {
        name: "toLat",
        type: "number",
        description: "Destination latitude",
        required: true,
      },
      {
        name: "toLon",
        type: "number",
        description: "Destination longitude",
        required: true,
      },
      {
        name: "mode",
        type: "string",
        description:
          'Transport mode: "car", "walking", "bus", "train", or "tram"',
        required: true,
      },
    ],
    handler: async ({
      fromLat,
      fromLon,
      toLat,
      toLon,
      mode,
    }: {
      fromLat: number;
      fromLon: number;
      toLat: number;
      toLon: number;
      mode: string;
    }) => {
      const validModes: TransportMode[] = [
        "car",
        "walking",
        "bus",
        "train",
        "tram",
      ];
      const transportMode: TransportMode = validModes.includes(
        mode as TransportMode
      )
        ? (mode as TransportMode)
        : "car";
      const route = await getTravelTime(
        { lat: fromLat, lon: fromLon },
        { lat: toLat, lon: toLon },
        transportMode
      );

      if (!route) {
        return "Could not calculate route between these locations";
      }

      return `Route by ${transportMode}: ${formatDuration(
        route.durationMinutes
      )} (${route.distanceKm} km)`;
    },
  });

  useCopilotAction({
    name: "setTripDate",
    description: "Set the date for the current trip plan.",
    parameters: [
      {
        name: "date",
        type: "string",
        description:
          'Trip date in YYYY-MM-DD format (e.g., "2024-12-24") or natural format like "December 24, 2024"',
        required: true,
      },
    ],
    handler: async ({ date }: { date: string }) => {
      // Try to parse various date formats
      let parsedDate: string;
      try {
        const d = new Date(date);
        if (isNaN(d.getTime())) {
          throw new Error("Invalid date");
        }
        parsedDate = d.toISOString().split("T")[0];
      } catch {
        parsedDate = date;
      }
      updateCurrentPlan({ date: parsedDate });
      return `Trip date set to: ${parsedDate}`;
    },
  });

  useCopilotAction({
    name: "listItinerary",
    description: "Get the current itinerary with all stops and their details.",
    parameters: [],
    handler: async () => {
      // Get fresh state
      let currentItinerary: ItineraryItem[] = [];
      setPlans((prev) => {
        const plan = prev.find((p) => p.id === currentPlanId);
        currentItinerary = plan?.itinerary || [];
        return prev;
      });

      if (currentItinerary.length === 0) {
        return "No itinerary stops yet. Use searchLocation and addItineraryItem to build your trip itinerary.";
      }
      return (
        "Current itinerary:\n" +
        currentItinerary
          .map(
            (item, i) =>
              `${i + 1}. ${item.arrivalTime} - ${item.locationName} (by ${
                item.transportMode
              })${
                item.estimatedTravelMinutes
                  ? ` [~${formatDuration(
                      item.estimatedTravelMinutes
                    )} from prev]`
                  : ""
              }${item.notes ? ` - ${item.notes}` : ""} [id: ${item.id}]`
          )
          .join("\n")
      );
    },
  });
}
