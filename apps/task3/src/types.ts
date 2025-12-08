export interface Coordinates {
  lat: number;
  lon: number;
}

export type TransportMode = "car" | "walking" | "bus" | "train" | "tram";

export interface ItineraryItem {
  id: string;
  locationName: string;
  coordinates: Coordinates;
  arrivalTime: string; // HH:mm format
  transportMode: TransportMode;
  estimatedTravelMinutes?: number; // from previous item
  notes?: string;
}

export interface Todo {
  id: string;
  text: string;
  completed: boolean;
  category?: string;
  itineraryItemId?: string; // optional link to itinerary stop
}

export interface Plan {
  id: string;
  name: string;
  location: string | null;
  date?: string; // trip date (e.g., "2024-12-24")
  todos: Todo[];
  itinerary: ItineraryItem[];
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
