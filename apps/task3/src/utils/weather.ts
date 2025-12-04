/**
 * Weather utility functions using Open-Meteo API
 * Free API, no key required
 */

import { WeatherData } from "../types";

interface GeoResponse {
  results?: Array<{
    latitude: number;
    longitude: number;
    name: string;
    country: string;
  }>;
}

interface WeatherResponse {
  current: {
    temperature_2m: number;
    relative_humidity_2m: number;
    apparent_temperature: number;
    wind_speed_10m: number;
    weather_code: number;
  };
}

interface WeatherCondition {
  condition: string;
  description: string;
}

export async function getWeatherForLocation(
  location: string
): Promise<WeatherData> {
  try {
    // Step 1: Geocode the location to get coordinates
    const geoResponse = await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
        location
      )}&count=1&language=en&format=json`
    );

    if (!geoResponse.ok) {
      throw new Error("Geocoding request failed");
    }

    const geoData: GeoResponse = await geoResponse.json();

    if (!geoData.results || geoData.results.length === 0) {
      throw new Error("Location not found");
    }

    const { latitude, longitude, name, country } = geoData.results[0];

    // Step 2: Get weather data using coordinates
    const weatherResponse = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,wind_speed_10m,weather_code&timezone=auto`
    );

    if (!weatherResponse.ok) {
      throw new Error("Weather API request failed");
    }

    const weatherData: WeatherResponse = await weatherResponse.json();
    const current = weatherData.current;

    // Step 3: Map weather codes to human-readable conditions
    const weatherInfo = getWeatherCondition(current.weather_code);

    return {
      location: `${name}, ${country}`,
      temperature: Math.round(current.temperature_2m),
      condition: weatherInfo.condition,
      humidity: current.relative_humidity_2m,
      windSpeed: Math.round(current.wind_speed_10m),
      feelsLike: Math.round(current.apparent_temperature),
      description: weatherInfo.description,
    };
  } catch (error) {
    console.error("Weather fetch error:", error);
    // Return fallback data on error
    return {
      location: location,
      temperature: 20,
      condition: "Clear",
      humidity: 50,
      windSpeed: 10,
      feelsLike: 19,
      description: "Unable to fetch live weather data.",
      error: true,
    };
  }
}

function getWeatherCondition(weatherCode: number): WeatherCondition {
  const weatherCodeMap: Record<number, WeatherCondition> = {
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

  return (
    weatherCodeMap[weatherCode] || {
      condition: "Clear",
      description: "clear skies",
    }
  );
}
