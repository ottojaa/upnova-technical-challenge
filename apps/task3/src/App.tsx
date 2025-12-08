import { CopilotSidebar } from "@copilotkit/react-ui";
import "@copilotkit/react-ui/styles.css";
import { useEffect, useState } from "react";
import "./App.css";
import EmptyState from "./components/EmptyState";
import ItineraryView from "./components/ItineraryView";
import PlanSelector from "./components/PlanSelector";
import TodoList from "./components/TodoList";
import { useTripPlannerCopilot } from "./hooks/useTripPlannerCopilot";
import {
  ItineraryItem,
  Plan,
  Todo,
  UserPreferences,
  WeatherData,
} from "./types";
import {
  createNewPlan,
  loadCurrentPlanId,
  loadPlans,
  loadPreferences,
  saveCurrentPlanId,
  savePlans,
  savePreferences,
} from "./utils/storage";

function App() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [currentPlanId, setCurrentPlanId] = useState<string | null>(null);
  const [userPreferences, setUserPreferences] = useState<UserPreferences>({});
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);

  // Load data from localStorage on mount
  useEffect(() => {
    const loadedPlans = loadPlans();
    const loadedPreferences = loadPreferences();
    const loadedCurrentPlanId = loadCurrentPlanId();

    // If no plans exist, create a default one
    if (loadedPlans.length === 0) {
      const defaultPlan = createNewPlan("My First Trip");
      setPlans([defaultPlan]);
      setCurrentPlanId(defaultPlan.id);
    } else {
      setPlans(loadedPlans);
      // If saved currentPlanId exists and is valid, use it; otherwise use first plan
      if (
        loadedCurrentPlanId &&
        loadedPlans.some((p) => p.id === loadedCurrentPlanId)
      ) {
        setCurrentPlanId(loadedCurrentPlanId);
      } else {
        setCurrentPlanId(loadedPlans[0].id);
      }
    }

    setUserPreferences(loadedPreferences);
  }, []);

  // Save plans to localStorage whenever they change
  useEffect(() => {
    if (plans.length > 0) {
      savePlans(plans);
    }
  }, [plans]);

  // Save current plan ID to localStorage
  useEffect(() => {
    if (currentPlanId) {
      saveCurrentPlanId(currentPlanId);
    }
  }, [currentPlanId]);

  // Save preferences to localStorage
  useEffect(() => {
    savePreferences(userPreferences);
  }, [userPreferences]);

  // Get current plan
  const currentPlan = plans.find((p) => p.id === currentPlanId);
  const todos: Todo[] = currentPlan?.todos || [];
  const itinerary: ItineraryItem[] = currentPlan?.itinerary || [];
  const tripLocation: string | null = currentPlan?.location || null;
  const tripDate: string | undefined = currentPlan?.date;

  // Update current plan - supports both direct updates and functional updates
  const updateCurrentPlan = (
    updater: Partial<Plan> | ((currentPlan: Plan) => Partial<Plan>)
  ) => {
    setPlans((prev) =>
      prev.map((plan) => {
        if (plan.id !== currentPlanId) return plan;
        const updates = typeof updater === "function" ? updater(plan) : updater;
        return { ...plan, ...updates, updatedAt: new Date().toISOString() };
      })
    );
  };

  // Register all Copilot hooks
  useTripPlannerCopilot({
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
  });

  const toggleTodo = (id: string) => {
    updateCurrentPlan({
      todos: todos.map((todo) =>
        todo.id === id ? { ...todo, completed: !todo.completed } : todo
      ),
    });
  };

  const deleteTodo = (id: string) => {
    updateCurrentPlan({
      todos: todos.filter((todo) => todo.id !== id),
    });
  };

  const deleteItineraryItem = (id: string) => {
    updateCurrentPlan((plan) => ({
      itinerary: plan.itinerary.filter((item) => item.id !== id),
      // Also unlink any todos that were linked to this item
      todos: plan.todos.map((todo) =>
        todo.itineraryItemId === id
          ? { ...todo, itineraryItemId: undefined }
          : todo
      ),
    }));
  };

  const handleCreatePlan = (name: string) => {
    const newPlan = createNewPlan(name);
    setPlans((prev) => [...prev, newPlan]);
    setCurrentPlanId(newPlan.id);
  };

  const handleDeletePlan = (planId: string) => {
    setPlans((prev) => {
      const filtered = prev.filter((p) => p.id !== planId);
      // If deleting current plan, switch to first remaining plan
      if (planId === currentPlanId && filtered.length > 0) {
        setCurrentPlanId(filtered[0].id);
      }
      return filtered;
    });
  };

  const handleRenamePlan = (planId: string, newName: string) => {
    setPlans((prev) =>
      prev.map((plan) =>
        plan.id === planId
          ? { ...plan, name: newName, updatedAt: new Date().toISOString() }
          : plan
      )
    );
  };

  return (
    <>
      <CopilotSidebar
        defaultOpen={true}
        clickOutsideToClose={false}
        labels={{
          title: "Trip Planning Assistant",
          initial:
            '👋 Hi! I\'m your travel planning assistant. I can help you plan trips with detailed itineraries.\n\n✈️ Try saying:\n- "Plan a day trip in Paris for December 24th"\n- "Arrive in Paris by car at 12:00, then walk to a cafe at 13:00"\n- "Add a stop at the Louvre at 15:00 by walking"\n- "What\'s the weather like in Paris?"\n- "Calculate travel time from Paris to Lyon by car"\n\nI\'ll help you build a complete itinerary with travel times between stops!',
        }}
      >
        <div className="h-screen w-full flex flex-col bg-gradient-to-br from-blue-50 via-white to-purple-50">
          {/* Header */}
          <div className="bg-white border-b border-gray-200 shadow-sm">
            <div className="max-w-6xl mx-auto px-6 py-4">
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1">
                  <h1 className="text-3xl font-bold text-gray-800">
                    ✈️ Trip Planner
                  </h1>
                  {(tripLocation || tripDate) && (
                    <p className="text-gray-600 mt-1">
                      {tripLocation && (
                        <>
                          Planning for:{" "}
                          <span className="font-semibold text-blue-600">
                            {tripLocation}
                          </span>
                        </>
                      )}
                      {tripLocation && tripDate && " · "}
                      {tripDate && (
                        <span className="text-gray-500">{tripDate}</span>
                      )}
                    </p>
                  )}
                </div>
                <PlanSelector
                  plans={plans}
                  currentPlanId={currentPlanId}
                  onSelectPlan={setCurrentPlanId}
                  onCreatePlan={handleCreatePlan}
                  onDeletePlan={handleDeletePlan}
                  onRenamePlan={handleRenamePlan}
                />
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 overflow-y-auto px-6 py-8">
            <div className="max-w-6xl mx-auto">
              {/* Itinerary View */}
              <ItineraryView
                itinerary={itinerary}
                todos={todos}
                tripDate={tripDate}
                onToggleTodo={toggleTodo}
                onDeleteTodo={deleteTodo}
                onDeleteItineraryItem={deleteItineraryItem}
              />

              {/* TodoList for unassigned todos (only show if there are itinerary items) */}
              {itinerary.length > 0 &&
                todos.filter((t) => !t.itineraryItemId).length > 0 && (
                  <TodoList
                    todos={todos.filter((t) => !t.itineraryItemId)}
                    onToggle={toggleTodo}
                    onDelete={deleteTodo}
                  />
                )}

              {/* Show TodoList grouped by category when no itinerary */}
              {itinerary.length === 0 && todos.length > 0 && (
                <TodoList
                  todos={todos}
                  onToggle={toggleTodo}
                  onDelete={deleteTodo}
                />
              )}

              {/* Empty state when nothing exists */}
              {itinerary.length === 0 && todos.length === 0 && <EmptyState />}
            </div>
          </div>
        </div>
      </CopilotSidebar>
    </>
  );
}

export default App;
