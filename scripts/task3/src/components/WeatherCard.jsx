function WeatherIcon({ condition }) {
  const iconMap = {
    Clear: (
      <svg
        className="w-14 h-14 text-yellow-300"
        fill="currentColor"
        viewBox="0 0 24 24"
      >
        <circle cx="12" cy="12" r="5" />
        <path
          d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"
          strokeWidth="2"
          stroke="currentColor"
          fill="none"
        />
      </svg>
    ),
    "Mainly Clear": (
      <svg
        className="w-14 h-14 text-yellow-300"
        fill="currentColor"
        viewBox="0 0 24 24"
      >
        <circle cx="12" cy="12" r="5" />
        <path
          d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"
          strokeWidth="2"
          stroke="currentColor"
          fill="none"
        />
      </svg>
    ),
    Clouds: (
      <svg
        className="w-14 h-14 text-gray-300"
        fill="currentColor"
        viewBox="0 0 24 24"
      >
        <path d="M18 10a4 4 0 00-4-4 4 4 0 00-3.6 2.3A3 3 0 007 11a3 3 0 000 6h11a2 2 0 002-2 2 2 0 00-2-5z" />
      </svg>
    ),
    Cloudy: (
      <svg
        className="w-14 h-14 text-gray-300"
        fill="currentColor"
        viewBox="0 0 24 24"
      >
        <path d="M18 10a4 4 0 00-4-4 4 4 0 00-3.6 2.3A3 3 0 007 11a3 3 0 000 6h11a2 2 0 002-2 2 2 0 00-2-5z" />
      </svg>
    ),
    "Partly Cloudy": (
      <svg
        className="w-14 h-14 text-gray-400"
        fill="currentColor"
        viewBox="0 0 24 24"
      >
        <path d="M18 10a4 4 0 00-4-4 4 4 0 00-3.6 2.3A3 3 0 007 11a3 3 0 000 6h11a2 2 0 002-2 2 2 0 00-2-5z" />
      </svg>
    ),
    Rain: (
      <svg
        className="w-14 h-14 text-blue-300"
        fill="currentColor"
        viewBox="0 0 24 24"
      >
        <path d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707" />
      </svg>
    ),
    Drizzle: (
      <svg
        className="w-14 h-14 text-blue-200"
        fill="currentColor"
        viewBox="0 0 24 24"
      >
        <path d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707" />
      </svg>
    ),
    Snow: (
      <svg
        className="w-14 h-14 text-blue-100"
        fill="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          d="M12 3v18M3 12h18M6.34 6.34l11.32 11.32M6.34 17.66L17.66 6.34"
          stroke="currentColor"
          strokeWidth="2"
          fill="none"
        />
      </svg>
    ),
    Thunderstorm: (
      <svg
        className="w-14 h-14 text-yellow-400"
        fill="currentColor"
        viewBox="0 0 24 24"
      >
        <path d="M13 2L3 14h8l-1 8 10-12h-8l1-8z" />
      </svg>
    ),
    Foggy: (
      <svg
        className="w-14 h-14 text-gray-300"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M3 15h18M3 9h18M3 12h18"
        />
      </svg>
    ),
  };

  return iconMap[condition] || iconMap.Clear;
}

export default function WeatherCard({ weatherData }) {
  if (!weatherData) {
    return null;
  }

  const {
    location,
    temperature,
    condition,
    humidity,
    windSpeed,
    feelsLike,
    description,
  } = weatherData;

  return (
    <div className="rounded-xl shadow-xl mt-6 mb-4 max-w-md w-full bg-gradient-to-br from-blue-500 to-blue-600 overflow-hidden">
      <div className="bg-white/10 backdrop-blur-sm p-6 w-full">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-2xl font-bold text-white capitalize">
              {location}
            </h3>
            <p className="text-blue-100">{description}</p>
          </div>
          <WeatherIcon condition={condition} />
        </div>

        <div className="mt-6 flex items-end justify-between">
          <div className="text-5xl font-bold text-white">{temperature}°C</div>
          <div className="text-sm text-blue-100 pb-2">{condition}</div>
        </div>

        <div className="mt-6 pt-4 border-t border-white/20">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-blue-100 text-xs mb-1">Humidity</p>
              <p className="text-white font-semibold">{humidity}%</p>
            </div>
            <div>
              <p className="text-blue-100 text-xs mb-1">Wind</p>
              <p className="text-white font-semibold">{windSpeed} km/h</p>
            </div>
            <div>
              <p className="text-blue-100 text-xs mb-1">Feels Like</p>
              <p className="text-white font-semibold">{feelsLike}°C</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
