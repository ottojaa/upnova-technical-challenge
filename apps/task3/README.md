# Task 3: AI Trip Planning Todo App

A modern, AI-powered trip planning application built with React, Vite, and CopilotKit Cloud. The app features an intelligent AI assistant that helps users plan trips, manage todos, and get weather-aware recommendations.

## Features

### 🤖 AI-Powered Assistant
- Natural language interaction for trip planning
- Context-aware suggestions based on destination and weather
- Memory of user preferences and trip details
- Smart todo management through conversation

### ✅ Todo Management
- Create, read, update, and delete todos
- Category-based organization (sightseeing, food, shopping, accommodation, transportation)
- Visual progress tracking
- Persistent storage across sessions

### 🌤️ Weather Integration
- Real-time weather data using Open-Meteo API (free, no key required)
- Weather-aware trip recommendations
- Beautiful weather card displays
- Temperature, humidity, wind speed, and "feels like" information

### 💾 Persistence & Memory
- LocalStorage for todo persistence
- User preferences stored across sessions
- CopilotKit Cloud handles conversation memory
- Trip location tracking

### 🎨 Modern UI
- Clean, minimal design with Tailwind CSS
- Gradient backgrounds and smooth animations
- Category-based color coding with emojis
- Responsive layout
- Intuitive sidebar chat interface

## Prerequisites

- Node.js 18+ installed
- npm or similar package manager
- CopilotKit Cloud API key (get from [cloud.copilotkit.ai](https://cloud.copilotkit.ai))

## Setup Instructions

### 1. Install Dependencies

```bash
cd scripts/task3
npm install
```

### 2. Configure Environment Variables

Create a `.env` file in the `scripts/task3` directory:

```bash
cp .env.example .env
```

Then edit `.env` and add your CopilotKit Cloud API key:

```
VITE_COPILOT_CLOUD_API_KEY=your_copilotkit_cloud_api_key_here
```

**Getting a CopilotKit Cloud API Key:**
1. Visit [cloud.copilotkit.ai](https://cloud.copilotkit.ai)
2. Sign up or log in
3. Create a new project
4. Copy your public API key

### 3. Start Development Server

```bash
npm run dev
```

The app will open at `http://localhost:3000`

## Usage

### Interacting with the AI Assistant

The AI assistant appears in the right sidebar. You can ask it to help with various trip planning tasks:

**Example prompts:**
- "Help me create a todo list for a trip to Paris"
- "What's the weather like in Tokyo right now?"
- "Add a todo to visit the Eiffel Tower"
- "Show me things to do in London"
- "Remove all shopping todos"
- "Mark the first todo as completed"

### Using the UI

- **Check/Uncheck Todos**: Click the circle checkbox next to any todo
- **Delete Todos**: Hover over a todo and click the red trash icon
- **View by Category**: Todos are automatically grouped by category with progress indicators
- **Track Trip Location**: The current destination is displayed in the header when set

### Categories

Todos are automatically organized into these categories:
- 🏛️ **Sightseeing**: Museums, landmarks, attractions
- 🍽️ **Food**: Restaurants, cafes, local cuisine
- 🛍️ **Shopping**: Markets, stores, souvenirs
- 🏨 **Accommodation**: Hotels, check-in/out, reservations
- 🚗 **Transportation**: Flights, trains, car rentals
- 📝 **Other**: Miscellaneous tasks

## Project Structure

```
scripts/task3/
├── src/
│   ├── components/
│   │   ├── TodoList.jsx       # Todo display with categories
│   │   ├── WeatherCard.jsx    # Weather information display
│   │   └── EmptyState.jsx     # Empty state UI
│   ├── utils/
│   │   ├── weather.js         # Weather API integration
│   │   └── storage.js         # LocalStorage helpers
│   ├── App.jsx                # Main app component
│   ├── App.css                # Custom styles
│   ├── main.jsx               # Entry point with CopilotKit provider
│   └── index.css              # Tailwind imports
├── package.json
├── vite.config.js
├── tailwind.config.js
├── postcss.config.js
└── README.md
```

## How It Works

### CopilotKit Cloud Integration

The app uses CopilotKit Cloud for AI capabilities:

```jsx
<CopilotKit publicApiKey={COPILOT_CLOUD_API_KEY}>
  <App />
</CopilotKit>
```

### Copilot Actions

The AI can perform these actions:
- `addTodo` - Add new todos with categories
- `removeTodo` - Remove todos by ID or text
- `updateTodo` - Modify todo text, status, or category
- `listTodos` - View current todos
- `getWeather` - Fetch real-time weather data
- `setTripLocation` - Set the trip destination
- `updateUserPreferences` - Store user preferences

### Weather API

Weather data comes from Open-Meteo API:
1. Geocode location name to coordinates
2. Fetch current weather conditions
3. Display in beautiful weather card
4. AI uses data for weather-aware recommendations

### Persistence

- **Todos**: Saved to localStorage, persist across sessions
- **Preferences**: Stored locally and in CopilotKit Cloud context
- **Trip Location**: Saved to localStorage
- **Conversation**: Managed by CopilotKit Cloud

## Build for Production

```bash
npm run build
```

The production-ready files will be in the `dist/` directory.

## Preview Production Build

```bash
npm run preview
```

## Technologies Used

- **React 18** - UI framework
- **Vite** - Build tool and dev server
- **CopilotKit** - AI integration and chat interface
- **Tailwind CSS** - Styling
- **Open-Meteo API** - Weather data (free, no key required)

## Troubleshooting

### AI Assistant Not Responding
- Verify your CopilotKit Cloud API key is correct in `.env`
- Check browser console for errors
- Ensure you have an active internet connection

### Weather Not Loading
- The weather API is free and requires no key
- Check your internet connection
- Try a different location name (e.g., "Paris, France" instead of just "Paris")

### Todos Not Persisting
- Check browser localStorage is enabled
- Clear localStorage and refresh if data seems corrupted
- Check browser console for storage errors

## License

MIT
