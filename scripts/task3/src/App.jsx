import { useCopilotAction, useCopilotReadable } from "@copilotkit/react-core";
import { CopilotSidebar } from "@copilotkit/react-ui";
import "@copilotkit/react-ui/styles.css";
import { useEffect, useState } from "react";
import "./App.css";
import EmptyState from "./components/EmptyState";
import TodoList from "./components/TodoList";
import WeatherCard from "./components/WeatherCard";
import {
  loadPreferences,
  loadTodos,
  loadTripLocation,
  savePreferences,
  saveTodos,
  saveTripLocation,
} from "./utils/storage";
import { getWeatherForLocation } from "./utils/weather";

function App() {
  const [todos, setTodos] = useState([]);
  const [tripLocation, setTripLocation] = useState(null);
  const [userPreferences, setUserPreferences] = useState({});
  const [weatherData, setWeatherData] = useState(null);

  // Load data from localStorage on mount
  useEffect(() => {
    setTodos(loadTodos());
    setTripLocation(loadTripLocation());
    setUserPreferences(loadPreferences());
  }, []);

  // Save todos to localStorage whenever they change
  useEffect(() => {
    saveTodos(todos);
  }, [todos]);

  // Save trip location to localStorage
  useEffect(() => {
    saveTripLocation(tripLocation);
  }, [tripLocation]);

  // Save preferences to localStorage
  useEffect(() => {
    savePreferences(userPreferences);
  }, [userPreferences]);

  // Make todos readable by Copilot
  useCopilotReadable({
    description: "Current todo list for trip planning",
    value: todos,
  });

  // Make trip location readable
  useCopilotReadable({
    description: "Current trip destination",
    value: tripLocation,
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
      "Add a new todo item to the trip planning list. Use appropriate categories like sightseeing, food, shopping, accommodation, or transportation.",
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
    handler: async ({ text, category }) => {
      const newTodo = {
        id: Date.now().toString(),
        text,
        completed: false,
        category: category || "Other",
      };
      setTodos((prev) => [...prev, newTodo]);
      return `Added todo: ${text}`;
    },
  });

  // Action: Remove todo
  useCopilotAction({
    name: "removeTodo",
    description:
      "Remove a todo item from the list by its ID or by matching the text.",
    parameters: [
      {
        name: "id",
        type: "string",
        description: "The ID of the todo to remove, or the text to match",
        required: true,
      },
    ],
    handler: async ({ id }) => {
      setTodos((prev) =>
        prev.filter((todo) => todo.id !== id && todo.text !== id)
      );
      return `Removed todo`;
    },
  });

  // Action: Update todo
  useCopilotAction({
    name: "updateTodo",
    description: "Update a todo item's text, completion status, or category.",
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
    handler: async ({ id, text, completed, category }) => {
      setTodos((prev) =>
        prev.map((todo) =>
          todo.id === id
            ? {
                ...todo,
                ...(text !== undefined && { text }),
                ...(completed !== undefined && { completed }),
                ...(category !== undefined && { category }),
              }
            : todo
        )
      );
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
    handler: async ({ location }) => {
      const weather = await getWeatherForLocation(location);
      setWeatherData(weather);
      return `Current weather in ${weather.location}: ${weather.temperature}°C, ${weather.description}. Humidity: ${weather.humidity}%, Wind: ${weather.windSpeed} km/h.`;
    },
    render: ({ status, result }) => {
      if (status === "complete" && weatherData) {
        return <WeatherCard weatherData={weatherData} />;
      }
      return null;
    },
  });

  // Action: Set trip location
  useCopilotAction({
    name: "setTripLocation",
    description:
      "Set or update the current trip destination that the user is planning for.",
    parameters: [
      {
        name: "location",
        type: "string",
        description: "The destination/location name",
        required: true,
      },
    ],
    handler: async ({ location }) => {
      setTripLocation(location);
      return `Trip location set to: ${location}`;
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
    handler: async ({ favoriteDestinations, travelStyle, interests }) => {
      setUserPreferences((prev) => ({
        ...prev,
        ...(favoriteDestinations && { favoriteDestinations }),
        ...(travelStyle && { travelStyle }),
        ...(interests && { interests }),
      }));
      return "User preferences updated";
    },
  });

  const toggleTodo = (id) => {
    setTodos((prev) =>
      prev.map((todo) =>
        todo.id === id ? { ...todo, completed: !todo.completed } : todo
      )
    );
  };

  const deleteTodo = (id) => {
    setTodos((prev) => prev.filter((todo) => todo.id !== id));
  };

  return (
    <>
      <CopilotSidebar
        defaultOpen={true}
        clickOutsideToClose={false}
        labels={{
          title: "Trip Planning Assistant",
          initial:
            '👋 Hi! I\'m your travel planning assistant. I can help you plan trips and manage your todo list.\n\n✈️ Try saying:\n- "Help me create a todo list for a trip to Paris"\n- "What\'s the weather like in Tokyo?"\n- "Add a todo to visit the Eiffel Tower"\n- "Show me things to do in London"\n\nI\'ll check the weather and give you personalized recommendations!',
        }}
      >
        <div className="h-screen w-full flex flex-col bg-gradient-to-br from-blue-50 via-white to-purple-50">
          {/* Header */}
          <div className="bg-white border-b border-gray-200 shadow-sm">
            <div className="max-w-6xl mx-auto px-6 py-4">
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
