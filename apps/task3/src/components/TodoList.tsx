import { Check, Trash2 } from "lucide-react";
import { Todo } from "../types";

interface TodoListProps {
  todos: Todo[];
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
}

const categoryColors: Record<string, string> = {
  sightseeing: "bg-purple-500/20 border-purple-400/30",
  food: "bg-orange-500/20 border-orange-400/30",
  shopping: "bg-pink-500/20 border-pink-400/30",
  accommodation: "bg-blue-500/20 border-blue-400/30",
  transportation: "bg-green-500/20 border-green-400/30",
  Other: "bg-gray-500/20 border-gray-400/30",
};

const categoryEmojis: Record<string, string> = {
  sightseeing: "🏛️",
  food: "🍽️",
  shopping: "🛍️",
  accommodation: "🏨",
  transportation: "🚗",
  Other: "📝",
};

export default function TodoList({ todos, onToggle, onDelete }: TodoListProps) {
  // Group todos by category
  const groupedTodos = todos.reduce((acc: Record<string, Todo[]>, todo) => {
    const category = todo.category || "Other";
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(todo);
    return acc;
  }, {} as Record<string, Todo[]>);

  return (
    <div className="grid gap-6">
      {Object.entries(groupedTodos).map(
        ([category, categoryTodos]: [string, Todo[]]) => (
          <div
            key={category}
            className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden"
          >
            <div
              className={`px-6 py-3 border-b border-gray-200 ${
                categoryColors[category] || categoryColors.Other
              }`}
            >
              <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <span>{categoryEmojis[category] || categoryEmojis.Other}</span>
                <span className="capitalize">{category}</span>
                <span className="ml-auto text-sm font-normal text-gray-600">
                  {categoryTodos.filter((t) => t.completed).length}/
                  {categoryTodos.length} completed
                </span>
              </h2>
            </div>
            <div className="divide-y divide-gray-100">
              {categoryTodos.map((todo) => (
                <div
                  key={todo.id}
                  className="px-6 py-4 hover:bg-gray-50 transition-colors group flex items-center gap-4"
                >
                  <button
                    onClick={() => onToggle(todo.id)}
                    className={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                      todo.completed
                        ? "bg-green-500 border-green-500"
                        : "border-gray-300 hover:border-green-400"
                    }`}
                  >
                    {todo.completed && <Check className="w-4 h-4 text-white" />}
                  </button>
                  <span
                    className={`flex-1 ${
                      todo.completed
                        ? "line-through text-gray-400"
                        : "text-gray-700"
                    }`}
                  >
                    {todo.text}
                  </span>
                  <button
                    onClick={() => onDelete(todo.id)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 text-red-500 hover:text-red-700 p-2 rounded-lg hover:bg-red-50"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )
      )}
    </div>
  );
}
