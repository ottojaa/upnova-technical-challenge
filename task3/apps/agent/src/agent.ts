/**
 * This is the main entry point for the agent.
 * It defines the workflow graph, state, tools, nodes and edges.
 */

import {
  convertActionsToDynamicStructuredTools,
  CopilotKitStateAnnotation,
} from "@copilotkit/sdk-js/langgraph";
import { AIMessage, SystemMessage } from "@langchain/core/messages";
import { RunnableConfig } from "@langchain/core/runnables";
import { tool } from "@langchain/core/tools";
import {
  Annotation,
  MemorySaver,
  START,
  StateGraph,
} from "@langchain/langgraph";
import { ToolNode } from "@langchain/langgraph/prebuilt";
import { ChatOpenAI } from "@langchain/openai";
import { z } from "zod";

export interface Todo {
  id: string;
  text: string;
  completed: boolean;
  category?: string;
}

export interface UserPreferences {
  favoriteDestinations?: string[];
  travelStyle?: string;
  interests?: string[];
}

// 1. Define our agent state, which includes CopilotKit state to
//    provide actions to the state.
const AgentStateAnnotation = Annotation.Root({
  ...CopilotKitStateAnnotation.spec, // CopilotKit state annotation already includes messages, as well as frontend tools
  todos: Annotation<Todo[]>,
  userPreferences: Annotation<UserPreferences>,
  tripLocation: Annotation<string | null>,
});

// 2. Define the type for our agent state
export type AgentState = typeof AgentStateAnnotation.State;

// 3. Define a tool to get real-time weather using Open-Meteo API (free, no API key needed)
const getWeather = tool(
  async (args) => {
    try {
      // First, geocode the location to get coordinates using Open-Meteo's geocoding API
      const geoResponse = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
          args.location
        )}&count=1&language=en&format=json`
      );

      if (!geoResponse.ok) {
        throw new Error("Geocoding request failed");
      }

      const geoData = await geoResponse.json();

      if (!geoData.results || geoData.results.length === 0) {
        throw new Error("Location not found");
      }

      const { latitude, longitude, name, country } = geoData.results[0];

      // Now get the weather data using the coordinates
      const weatherResponse = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,wind_speed_10m,weather_code&timezone=auto`
      );

      if (!weatherResponse.ok) {
        throw new Error("Weather API request failed");
      }

      const weatherData = await weatherResponse.json();
      const current = weatherData.current;

      // Map weather codes to conditions
      const weatherCodeMap: Record<
        number,
        { condition: string; description: string }
      > = {
        0: { condition: "Clear", description: "clear skies" },
        1: { condition: "Mainly Clear", description: "mainly clear" },
        2: { condition: "Partly Cloudy", description: "partly cloudy" },
        3: { condition: "Cloudy", description: "overcast" },
        45: { condition: "Foggy", description: "foggy" },
        48: { condition: "Foggy", description: "depositing rime fog" },
        51: { condition: "Drizzle", description: "light drizzle" },
        53: { condition: "Drizzle", description: "moderate drizzle" },
        55: { condition: "Drizzle", description: "dense drizzle" },
        61: { condition: "Rain", description: "slight rain" },
        63: { condition: "Rain", description: "moderate rain" },
        65: { condition: "Rain", description: "heavy rain" },
        71: { condition: "Snow", description: "slight snow" },
        73: { condition: "Snow", description: "moderate snow" },
        75: { condition: "Snow", description: "heavy snow" },
        95: { condition: "Thunderstorm", description: "thunderstorm" },
      };

      const weatherInfo = weatherCodeMap[current.weather_code] || {
        condition: "Clear",
        description: "clear skies",
      };

      return JSON.stringify({
        location: `${name}, ${country}`,
        temperature: Math.round(current.temperature_2m),
        condition: weatherInfo.condition,
        humidity: current.relative_humidity_2m,
        windSpeed: Math.round(current.wind_speed_10m),
        feelsLike: Math.round(current.apparent_temperature),
        description: weatherInfo.description,
      });
    } catch (error) {
      // Return mock data on error
      return JSON.stringify({
        location: args.location,
        temperature: 20,
        condition: "Clear",
        humidity: 50,
        windSpeed: 10,
        feelsLike: 19,
        description:
          "Unable to fetch live weather data. Showing estimated conditions.",
      });
    }
  },
  {
    name: "getWeather",
    description:
      "Get the current weather for a given location. Use this to provide weather-aware recommendations for trip planning. This uses real-time data from Open-Meteo.",
    schema: z.object({
      location: z
        .string()
        .describe(
          "The location to get weather for (city name, or city with country like 'Paris, France')"
        ),
    }),
  }
);

// 4. Put our tools into an array
const tools = [getWeather];

// 5. Define the chat node, which will handle the chat logic
async function chat_node(state: AgentState, config: RunnableConfig) {
  // 5.1 Define the model, higher temperature for creative trip planning
  const model = new ChatOpenAI({ temperature: 0.7, model: "gpt-4o" });

  // 5.2 Bind the tools to the model, include CopilotKit actions. This allows
  //     the model to call tools that are defined in CopilotKit by the frontend.
  const modelWithTools = model.bindTools!([
    ...convertActionsToDynamicStructuredTools(state.copilotkit?.actions ?? []),
    ...tools,
  ]);

  // 5.3 Define the system message, which will be used to guide the model
  const todosInfo = state.todos?.length
    ? `Current todos:\n${state.todos
        .map(
          (t, i) =>
            `${i + 1}. [${t.completed ? "x" : " "}] ${t.text}${
              t.category ? ` (${t.category})` : ""
            }`
        )
        .join("\n")}`
    : "No todos yet.";

  const preferencesInfo =
    state.userPreferences && Object.keys(state.userPreferences).length > 0
      ? `\nUser preferences: ${JSON.stringify(state.userPreferences)}`
      : "";

  const tripInfo = state.tripLocation
    ? `\nCurrent trip location: ${state.tripLocation}`
    : "";

  const systemMessage = new SystemMessage({
    content: `You are a helpful travel planning assistant. Your role is to help users plan trips and manage their trip todos.

${todosInfo}${preferencesInfo}${tripInfo}

When helping plan a trip:
1. Always check the weather for the destination using the getWeather tool to provide relevant recommendations
2. Suggest activities appropriate for the weather conditions
3. Help create, update, and organize todos for the trip
4. Remember user preferences to personalize suggestions
5. Categorize todos (e.g., "sightseeing", "food", "shopping", "accommodation", "transportation")

Be friendly, conversational, and proactive in your suggestions. When the user mentions a destination, immediately fetch weather information and start creating a helpful todo list.`,
  });

  // 5.4 Invoke the model with the system message and the messages in the state
  const response = await modelWithTools.invoke(
    [systemMessage, ...state.messages],
    config
  );

  // 5.5 Return the response, which will be added to the state
  return {
    messages: response,
  };
}

// 6. Define the function that determines whether to continue or not,
//    this is used to determine the next node to run
function shouldContinue({ messages, copilotkit }: AgentState) {
  // 6.1 Get the last message from the state
  const lastMessage = messages[messages.length - 1] as AIMessage;

  // 7.2 If the LLM makes a tool call, then we route to the "tools" node
  if (lastMessage.tool_calls?.length) {
    // Actions are the frontend tools coming from CopilotKit
    const actions = copilotkit?.actions;
    const toolCallName = lastMessage.tool_calls![0].name;

    // 7.3 Only route to the tool node if the tool call is not a CopilotKit action
    if (!actions || actions.every((action) => action.name !== toolCallName)) {
      return "tool_node";
    }
  }

  // 6.4 Otherwise, we stop (reply to the user) using the special "__end__" node
  return "__end__";
}

// Define the workflow graph
const workflow = new StateGraph(AgentStateAnnotation)
  .addNode("chat_node", chat_node)
  .addNode("tool_node", new ToolNode(tools))
  .addEdge(START, "chat_node")
  .addEdge("tool_node", "chat_node")
  .addConditionalEdges("chat_node", shouldContinue as any);

const memory = new MemorySaver();

export const graph = workflow.compile({
  checkpointer: memory,
});
