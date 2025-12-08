/**
 * Routing utility functions using OSRM (Open Source Routing Machine)
 * Free public demo server
 * https://router.project-osrm.org/
 */

import { Coordinates, TransportMode } from "../types";

export interface RouteResult {
  durationMinutes: number;
  distanceKm: number;
}

interface OSRMResponse {
  code: string;
  routes?: Array<{
    distance: number; // meters
    duration: number; // seconds
  }>;
}

// Average speeds in km/h for estimating travel times
const AVERAGE_SPEEDS: Record<TransportMode, number> = {
  car: 50, // Used as fallback, OSRM provides actual driving time
  walking: 5,
  bus: 25, // Urban bus including stops
  tram: 20, // Tram/streetcar including stops
  train: 80, // Regional/suburban train
};

/**
 * Get travel time and distance between two points
 * @param from - Starting coordinates
 * @param to - Destination coordinates
 * @param mode - Transport mode
 * @returns Route result with duration and distance
 */
export async function getTravelTime(
  from: Coordinates,
  to: Coordinates,
  mode: TransportMode
): Promise<RouteResult | null> {
  try {
    // OSRM public server only has driving profile
    // We use driving distance as base and estimate times for other modes
    const coords = `${from.lon},${from.lat};${to.lon},${to.lat}`;
    const url = `https://router.project-osrm.org/route/v1/driving/${coords}?overview=false`;

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error("OSRM request failed");
    }

    const data: OSRMResponse = await response.json();

    if (data.code !== "Ok" || !data.routes || data.routes.length === 0) {
      throw new Error("No route found");
    }

    const route = data.routes[0];
    const distanceKm = route.distance / 1000;

    let durationMinutes: number;
    if (mode === "car") {
      // Use OSRM's calculated driving duration
      durationMinutes = Math.round(route.duration / 60);
    } else {
      // Estimate based on average speed for the transport mode
      // minutes = (distance in km) / (speed in km/h) * 60
      const avgSpeed = AVERAGE_SPEEDS[mode];
      durationMinutes = Math.round((distanceKm / avgSpeed) * 60);

      // Add buffer for public transport (waiting, stops, transfers)
      if (mode === "bus" || mode === "tram" || mode === "train") {
        durationMinutes += 10; // 10 min buffer for waiting/transfers
      }
    }

    return {
      durationMinutes,
      distanceKm: Math.round(distanceKm * 10) / 10,
    };
  } catch (error) {
    console.error("Routing error:", error);
    return null;
  }
}

/**
 * Format duration in minutes to human-readable string
 * @param minutes - Duration in minutes
 * @returns Formatted string (e.g., "2h 30min" or "45 min")
 */
export function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${minutes} min`;
  }
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (mins === 0) {
    return `${hours}h`;
  }
  return `${hours}h ${mins}min`;
}

/**
 * Calculate estimated arrival time given departure time and travel duration
 * @param departureTime - Departure time in HH:mm format
 * @param durationMinutes - Travel duration in minutes
 * @returns Arrival time in HH:mm format
 */
export function calculateArrivalTime(
  departureTime: string,
  durationMinutes: number
): string {
  const [hours, minutes] = departureTime.split(":").map(Number);
  const totalMinutes = hours * 60 + minutes + durationMinutes;
  const arrivalHours = Math.floor(totalMinutes / 60) % 24;
  const arrivalMinutes = totalMinutes % 60;
  return `${arrivalHours.toString().padStart(2, "0")}:${arrivalMinutes
    .toString()
    .padStart(2, "0")}`;
}
