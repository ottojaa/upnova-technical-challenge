import {
  Bus,
  Car,
  Check,
  Footprints,
  Train,
  TramFront,
  Trash2,
  X,
} from "lucide-react";
import { ItineraryItem, Todo, TransportMode } from "../types";
import { formatDuration } from "../utils/routing";

interface ItineraryViewProps {
  itinerary: ItineraryItem[];
  todos: Todo[];
  tripDate?: string;
  onToggleTodo: (id: string) => void;
  onDeleteTodo: (id: string) => void;
  onDeleteItineraryItem: (id: string) => void;
}

const transportIcons: Record<TransportMode, JSX.Element> = {
  car: <Car className="w-5 h-5" />,
  walking: <Footprints className="w-5 h-5" />,
  bus: <Bus className="w-5 h-5" />,
  train: <Train className="w-5 h-5" />,
  tram: <TramFront className="w-5 h-5" />,
};

const transportColors: Record<TransportMode, string> = {
  car: "bg-blue-100 text-blue-600",
  walking: "bg-green-100 text-green-600",
  bus: "bg-orange-100 text-orange-600",
  train: "bg-purple-100 text-purple-600",
  tram: "bg-yellow-100 text-yellow-700",
};

const transportLabels: Record<TransportMode, string> = {
  car: "Drive",
  walking: "Walk",
  bus: "Bus",
  train: "Train",
  tram: "Tram",
};

export default function ItineraryView({
  itinerary,
  todos,
  tripDate,
  onToggleTodo,
  onDeleteTodo,
  onDeleteItineraryItem,
}: ItineraryViewProps) {
  // Get todos for a specific itinerary item
  const getTodosForItem = (itemId: string) =>
    todos.filter((todo) => todo.itineraryItemId === itemId);

  // Get unassigned todos (not linked to any itinerary item)
  const unassignedTodos = todos.filter((todo) => !todo.itineraryItemId);

  if (itinerary.length === 0) {
    return null;
  }

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return null;
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden mb-6">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-500/10 to-purple-500/10">
        <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
          <span>🗺️</span>
          <span>Itinerary</span>
          {tripDate && (
            <span className="ml-auto text-sm font-normal text-gray-600">
              {formatDate(tripDate)}
            </span>
          )}
        </h2>
      </div>

      {unassignedTodos.length > 0 && (
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-2">
            Unassigned todos
          </h3>
        </div>
      )}

      {/* Timeline */}
      <div className="p-6">
        <div className="relative">
          {itinerary.map((item, index) => (
            <div key={item.id} className="relative group/item">
              {/* Timeline connector */}
              {index < itinerary.length - 1 && (
                <div className="absolute left-[18px] top-10 bottom-0 w-0.5 bg-gray-200" />
              )}

              {/* Stop */}
              <div className="flex gap-4 pb-6">
                {/* Time badge */}
                <div className="flex-shrink-0 w-[38px] h-[38px] rounded-full bg-blue-500 text-white flex items-center justify-center text-xs font-bold shadow-md z-10">
                  {item.arrivalTime.split(":")[0]}
                  <span className="text-[8px]">
                    :{item.arrivalTime.split(":")[1]}
                  </span>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 relative">
                    {/* Delete button for itinerary item */}
                    <button
                      onClick={() => onDeleteItineraryItem(item.id)}
                      className="absolute top-2 right-2 opacity-0 group-hover/item:opacity-100 transition-opacity p-1.5 rounded-lg hover:bg-red-100 text-gray-400 hover:text-red-600"
                      title="Remove stop"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>

                    <div className="flex items-start justify-between gap-2 pr-8">
                      <div className="min-w-0">
                        <h3 className="font-semibold text-gray-800 truncate">
                          {item.locationName}
                        </h3>
                        {item.notes && (
                          <p className="text-sm text-gray-500 mt-1">
                            {item.notes}
                          </p>
                        )}
                      </div>
                      <div
                        className={`flex-shrink-0 p-2 rounded-lg ${
                          transportColors[item.transportMode]
                        }`}
                        title={`Arrived by ${item.transportMode}`}
                      >
                        {transportIcons[item.transportMode]}
                      </div>
                    </div>

                    {/* Todos for this stop */}
                    {getTodosForItem(item.id).length > 0 && (
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">
                          Tasks at this stop
                        </p>
                        <div className="space-y-2">
                          {getTodosForItem(item.id).map((todo) => (
                            <div
                              key={todo.id}
                              className="flex items-center gap-2 group"
                            >
                              <button
                                onClick={() => onToggleTodo(todo.id)}
                                className={`flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                                  todo.completed
                                    ? "bg-green-500 border-green-500"
                                    : "border-gray-300 hover:border-green-400"
                                }`}
                              >
                                {todo.completed && (
                                  <Check className="w-3 h-3 text-white" />
                                )}
                              </button>
                              <span
                                className={`flex-1 text-sm ${
                                  todo.completed
                                    ? "line-through text-gray-400"
                                    : "text-gray-700"
                                }`}
                              >
                                {todo.text}
                              </span>
                              <button
                                onClick={() => onDeleteTodo(todo.id)}
                                className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 p-1"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Travel info to next stop */}
                  {index < itinerary.length - 1 && (
                    <div className="flex items-center gap-2 mt-3 ml-2 text-sm text-gray-500">
                      <span
                        className={`p-1 rounded ${
                          transportColors[
                            itinerary[index + 1].transportMode
                          ].split(" ")[1]
                        }`}
                      >
                        {transportIcons[itinerary[index + 1].transportMode]}
                      </span>
                      <span>
                        {transportLabels[itinerary[index + 1].transportMode]} to
                        next stop
                      </span>
                      {itinerary[index + 1].estimatedTravelMinutes != null && (
                        <span className="text-gray-400">
                          (~
                          {formatDuration(
                            itinerary[index + 1].estimatedTravelMinutes!
                          )}
                          )
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
