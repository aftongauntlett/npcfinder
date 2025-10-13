import React, { Component } from "react";
import PropTypes from "prop-types";
import { Cloud } from "lucide-react";
import { DEFAULT_LOCATION } from "../../utils/constants";

/**
 * Weather widget component
 * Displays current weather with geolocation support and tooltip
 */
class WeatherWidget extends Component {
  constructor(props) {
    super(props);
    this.state = {
      weather: null,
      location: DEFAULT_LOCATION.name,
      isLoading: true,
    };
  }

  componentDidMount() {
    this.fetchWeatherWithLocation();
    // Refresh weather every 10 minutes
    this.weatherInterval = setInterval(() => {
      this.fetchWeatherWithLocation();
    }, 600000);
  }

  componentWillUnmount() {
    if (this.weatherInterval) {
      clearInterval(this.weatherInterval);
    }
  }

  async fetchWeatherWithLocation() {
    // Try to get user's location from browser
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          this.fetchWeather(latitude, longitude);
          this.fetchLocationName(latitude, longitude);
        },
        () => {
          console.log(
            "Geolocation denied or unavailable, using default location"
          );
          // Fallback to default location
          this.fetchWeather(
            DEFAULT_LOCATION.latitude,
            DEFAULT_LOCATION.longitude
          );
          this.setState({ location: DEFAULT_LOCATION.name });
        }
      );
    } else {
      // Fallback to default location if geolocation not supported
      this.fetchWeather(DEFAULT_LOCATION.latitude, DEFAULT_LOCATION.longitude);
      this.setState({ location: DEFAULT_LOCATION.name });
    }
  }

  async fetchLocationName(latitude, longitude) {
    try {
      // Use Open-Meteo's geocoding API to get location name
      const response = await fetch(
        `https://geocoding-api.open-meteo.com/v1/reverse?latitude=${latitude}&longitude=${longitude}`
      );
      const data = await response.json();

      if (data.results && data.results.length > 0) {
        const result = data.results[0];
        const city = result.city || result.name || "";
        const state = result.admin1 || "";
        const locationName = state ? `${city}, ${state}` : city;
        this.setState({ location: locationName || "Unknown Location" });
      }
    } catch (error) {
      console.error("Failed to fetch location name:", error);
      // Keep the default location
    }
  }

  async fetchWeather(latitude, longitude) {
    try {
      const response = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,weathercode&temperature_unit=fahrenheit&timezone=auto`
      );

      const data = await response.json();

      this.setState({
        weather: {
          temperature: Math.round(data.current.temperature_2m),
          weatherCode: data.current.weathercode,
        },
        isLoading: false,
      });
    } catch (error) {
      console.error("Failed to fetch weather:", error);
      this.setState({ isLoading: false });
    }
  }

  getWeatherDescription(code) {
    // WMO Weather interpretation codes
    if (code === 0) return "Clear";
    if (code <= 3) return "Partly Cloudy";
    if (code <= 48) return "Foggy";
    if (code <= 67) return "Rainy";
    if (code <= 77) return "Snowy";
    if (code <= 82) return "Showers";
    if (code <= 99) return "Thunderstorm";
    return "Unknown";
  }

  render() {
    const { weather, location, isLoading } = this.state;

    return (
      <div
        className="relative flex items-center gap-2 text-sm bg-gray-50 dark:bg-gray-700/50 px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 cursor-help group"
        title={location}
      >
        {isLoading ? (
          <span>Loading...</span>
        ) : weather ? (
          <>
            <Cloud className="w-4 h-4" />
            <span className="font-medium">{weather.temperature}°F</span>
            <span className="text-gray-500 dark:text-gray-400">
              {this.getWeatherDescription(weather.weatherCode)}
            </span>
            {/* Tooltip */}
            <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 px-3 py-1.5 bg-gray-900 dark:bg-gray-700 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap shadow-lg">
              {location}
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 -mb-1 border-4 border-transparent border-b-gray-900 dark:border-b-gray-700"></div>
            </div>
          </>
        ) : (
          <span>Weather unavailable</span>
        )}
      </div>
    );
  }
}

WeatherWidget.propTypes = {};

export default WeatherWidget;
