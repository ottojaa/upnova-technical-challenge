/**
 * Geocoding utility functions using Nominatim API (OpenStreetMap)
 * Free API, no key required
 * https://nominatim.org/release-docs/develop/api/Search/
 */

import { Coordinates } from "../types";

export interface LocationResult {
  name: string;
  displayName: string;
  coordinates: Coordinates;
  type: string;
}

interface NominatimResult {
  place_id: number;
  lat: string;
  lon: string;
  display_name: string;
  name?: string;
  type: string;
  class: string;
}

/**
 * Search for locations using Nominatim
 * @param query - Search query (e.g., "Paris", "Eiffel Tower")
 * @param countryCode - Optional ISO 3166-1 alpha-2 country code to limit results (e.g., "fr", "de")
 * @returns Array of location results
 */
export async function searchLocations(
  query: string,
  countryCode?: string
): Promise<LocationResult[]> {
  try {
    const params = new URLSearchParams({
      q: query,
      format: "json",
      limit: "5",
      addressdetails: "1",
    });

    if (countryCode) {
      params.append("countrycodes", countryCode.toLowerCase());
    }

    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?${params.toString()}`,
      {
        headers: {
          "User-Agent": "TripPlannerApp/1.0",
        },
      }
    );

    if (!response.ok) {
      throw new Error("Nominatim request failed");
    }

    const results: NominatimResult[] = await response.json();

    return results.map((result) => ({
      name: result.name || result.display_name.split(",")[0],
      displayName: result.display_name,
      coordinates: {
        lat: parseFloat(result.lat),
        lon: parseFloat(result.lon),
      },
      type: result.type,
    }));
  } catch (error) {
    console.error("Geocoding error:", error);
    return [];
  }
}

/**
 * Reverse geocode coordinates to get location name
 * @param coordinates - Lat/lon coordinates
 * @returns Location name or null
 */
export async function reverseGeocode(
  coordinates: Coordinates
): Promise<string | null> {
  try {
    const params = new URLSearchParams({
      lat: coordinates.lat.toString(),
      lon: coordinates.lon.toString(),
      format: "json",
    });

    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?${params.toString()}`,
      {
        headers: {
          "User-Agent": "TripPlannerApp/1.0",
        },
      }
    );

    if (!response.ok) {
      throw new Error("Reverse geocoding request failed");
    }

    const result = await response.json();
    return result.display_name || null;
  } catch (error) {
    console.error("Reverse geocoding error:", error);
    return null;
  }
}
