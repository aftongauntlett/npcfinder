import React, { useEffect, useState } from "react";
import { DEFAULT_LOCATION } from "../../utils/constants";

interface WeatherData {
  temperature: number;
  weatherCode: number;
}

const WeatherWidget: React.FC = () => {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchWeatherWithLocation();

    const interval = setInterval(() => {
      fetchWeatherWithLocation();
    }, 600000); // Refresh every 10 minutes

    return () => clearInterval(interval);
  }, []);

  const fetchWeatherWithLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          fetchWeather(latitude, longitude);
        },
        () => {
          // Fallback to default location
          fetchWeather(DEFAULT_LOCATION.latitude, DEFAULT_LOCATION.longitude);
        }
      );
    } else {
      fetchWeather(DEFAULT_LOCATION.latitude, DEFAULT_LOCATION.longitude);
    }
  };

  const fetchWeather = async (latitude: number, longitude: number) => {
    try {
      const response = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,weathercode&temperature_unit=fahrenheit&timezone=auto`
      );

      const data = await response.json();

      setWeather({
        temperature: Math.round(data.current.temperature_2m),
        weatherCode: data.current.weathercode,
      });
      setIsLoading(false);
    } catch (error) {
      console.error("Failed to fetch weather:", error);
      setIsLoading(false);
    }
  };

  const getWeatherDescription = (code: number): string => {
    // WMO Weather interpretation codes
    if (code === 0) return "Clear";
    if (code <= 3) return "Partly Cloudy";
    if (code <= 48) return "Foggy";
    if (code <= 67) return "Rainy";
    if (code <= 77) return "Snowy";
    if (code <= 82) return "Showers";
    if (code <= 99) return "Thunderstorm";
    return "Unknown";
  };

  return (
    <div className="flex items-center gap-2 text-sm bg-gray-50 dark:bg-gray-700/50 px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300">
      {isLoading ? (
        <span>Loading...</span>
      ) : weather ? (
        <>
          <span
            className="font-medium"
            aria-label={`Temperature ${weather.temperature} degrees Fahrenheit`}
          >
            {weather.temperature}°F
          </span>
          <span className="text-gray-500 dark:text-gray-400">
            {getWeatherDescription(weather.weatherCode)}
          </span>
        </>
      ) : (
        <span>Weather unavailable</span>
      )}
    </div>
  );
};

export default WeatherWidget;
