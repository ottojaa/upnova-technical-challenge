export default function EmptyState() {
  return (
    <div className="text-center py-20">
      <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-blue-100 mb-6">
        <svg
          className="w-12 h-12 text-blue-600"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
          />
        </svg>
      </div>
      <h2 className="text-2xl font-bold text-gray-800 mb-3">No todos yet!</h2>
      <p className="text-gray-600 max-w-md mx-auto">
        Start planning your trip by chatting with the AI assistant. Try asking
        "Help me plan a trip to Paris" or "What should I do in Tokyo?"
      </p>
    </div>
  );
}
