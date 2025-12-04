import { useState } from "react";
import { Plan } from "../types";

interface PlanSelectorProps {
  plans: Plan[];
  currentPlanId: string | null;
  onSelectPlan: (id: string) => void;
  onCreatePlan: (name: string) => void;
  onDeletePlan: (id: string) => void;
  onRenamePlan: (id: string, name: string) => void;
}

export default function PlanSelector({
  plans,
  currentPlanId,
  onSelectPlan,
  onCreatePlan,
  onDeletePlan,
  onRenamePlan,
}: PlanSelectorProps) {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [isCreating, setIsCreating] = useState<boolean>(false);
  const [newPlanName, setNewPlanName] = useState<string>("");
  const [editingPlanId, setEditingPlanId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState<string>("");

  const currentPlan = plans.find((p) => p.id === currentPlanId);

  const handleCreate = () => {
    if (newPlanName.trim()) {
      onCreatePlan(newPlanName.trim());
      setNewPlanName("");
      setIsCreating(false);
    }
  };

  const handleRename = (planId: string) => {
    if (editingName.trim()) {
      onRenamePlan(planId, editingName.trim());
      setEditingPlanId(null);
      setEditingName("");
    }
  };

  const startEditing = (plan: Plan) => {
    setEditingPlanId(plan.id);
    setEditingName(plan.name);
  };

  return (
    <div className="relative">
      {/* Current Plan Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors shadow-sm"
      >
        <span className="text-2xl">📋</span>
        <div className="text-left">
          <div className="text-sm text-gray-500">Current Plan</div>
          <div className="font-semibold text-gray-800">
            {currentPlan?.name || "No plan selected"}
          </div>
        </div>
        <svg
          className={`w-5 h-5 text-gray-500 transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-80 bg-white border border-gray-200 rounded-xl shadow-xl z-50 max-h-96 overflow-hidden flex flex-col">
          {/* Header */}
          <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
            <h3 className="font-semibold text-gray-800">Your Plans</h3>
            <p className="text-xs text-gray-500 mt-0.5">
              {plans.length} {plans.length === 1 ? "plan" : "plans"}
            </p>
          </div>

          {/* Plans List */}
          <div className="overflow-y-auto flex-1">
            {plans.map((plan) => (
              <div
                key={plan.id}
                className={`px-4 py-3 border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                  plan.id === currentPlanId ? "bg-blue-50" : ""
                }`}
              >
                {editingPlanId === plan.id ? (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleRename(plan.id);
                        if (e.key === "Escape") {
                          setEditingPlanId(null);
                          setEditingName("");
                        }
                      }}
                      className="flex-1 px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      autoFocus
                    />
                    <button
                      onClick={() => handleRename(plan.id)}
                      className="px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                    >
                      ✓
                    </button>
                    <button
                      onClick={() => {
                        setEditingPlanId(null);
                        setEditingName("");
                      }}
                      className="px-2 py-1 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between gap-2">
                    <button
                      onClick={() => {
                        onSelectPlan(plan.id);
                        setIsOpen(false);
                      }}
                      className="flex-1 text-left"
                    >
                      <div className="font-medium text-gray-800 flex items-center gap-2">
                        {plan.id === currentPlanId && (
                          <span className="text-blue-500">✓</span>
                        )}
                        {plan.name}
                      </div>
                      {plan.location && (
                        <div className="text-xs text-gray-500 mt-0.5">
                          📍 {plan.location}
                        </div>
                      )}
                      <div className="text-xs text-gray-400 mt-0.5">
                        {plan.todos.length}{" "}
                        {plan.todos.length === 1 ? "todo" : "todos"}
                      </div>
                    </button>
                    <div className="flex gap-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          startEditing(plan);
                        }}
                        className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                        title="Rename plan"
                      >
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                          />
                        </svg>
                      </button>
                      {plans.length > 1 && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (
                              confirm(
                                `Delete "${plan.name}"? This cannot be undone.`
                              )
                            ) {
                              onDeletePlan(plan.id);
                            }
                          }}
                          className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                          title="Delete plan"
                        >
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Create New Plan */}
          <div className="px-4 py-3 border-t border-gray-200 bg-gray-50">
            {isCreating ? (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newPlanName}
                  onChange={(e) => setNewPlanName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleCreate();
                    if (e.key === "Escape") {
                      setIsCreating(false);
                      setNewPlanName("");
                    }
                  }}
                  placeholder="Plan name (e.g., Tokyo Trip)"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  autoFocus
                />
                <button
                  onClick={handleCreate}
                  className="px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                  Create
                </button>
                <button
                  onClick={() => {
                    setIsCreating(false);
                    setNewPlanName("");
                  }}
                  className="px-3 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={() => setIsCreating(true)}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                New Plan
              </button>
            )}
          </div>
        </div>
      )}

      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        ></div>
      )}
    </div>
  );
}
