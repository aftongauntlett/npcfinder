import React, { Component } from "react";
import PropTypes from "prop-types";
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
          // Location name removed - just use default
        },
        () => {
          // Fallback to default location
          this.fetchWeather(
            DEFAULT_LOCATION.latitude,
            DEFAULT_LOCATION.longitude
          );
        }
      );
    } else {
      // Fallback to default location if geolocation not supported
      this.fetchWeather(DEFAULT_LOCATION.latitude, DEFAULT_LOCATION.longitude);
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
    const { weather, isLoading } = this.state;

    return (
      <div className="flex items-center gap-2 text-sm bg-gray-50 dark:bg-gray-700/50 px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300">
        {isLoading ? (
          <span>Loading...</span>
        ) : weather ? (
          <>
            <span className="font-medium">{weather.temperature}°F</span>
            <span className="text-gray-500 dark:text-gray-400">
              {this.getWeatherDescription(weather.weatherCode)}
            </span>
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
