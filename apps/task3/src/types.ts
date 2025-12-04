export interface Todo {
  id: string;
  text: string;
  completed: boolean;
  category?: string;
}

export interface Plan {
  id: string;
  name: string;
  location: string | null;
  todos: Todo[];
  createdAt: string;
  updatedAt: string;
}

export interface WeatherData {
  location: string;
  temperature: number;
  condition: string;
  humidity: number;
  windSpeed: number;
  feelsLike: number;
  description: string;
  error?: boolean;
}

export interface UserPreferences {
  favoriteDestinations?: string[];
  travelStyle?: string;
  interests?: string[];
}
