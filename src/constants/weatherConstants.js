export const API_KEY = "PASTE_YOUR_API_KEY";
export const BASE_URL = "https://api.openweathermap.org/data/2.5";
export const GEO_URL = "https://api.openweathermap.org/geo/1.0";

export const CONDITIONS = {
  Clear: { label: "Clear Sky", icon: "☀️", accent: "#e8e0d0", accent2: "#c8b89a" },
  Clouds: { label: "Cloudy", icon: "☁️", accent: "#b0bec5", accent2: "#90a4ae" },
  Rain: { label: "Rainy", icon: "🌧️", accent: "#90caf9", accent2: "#64b5f6" },
  Drizzle: { label: "Drizzle", icon: "🌦️", accent: "#b3e5fc", accent2: "#81d4fa" },
  Thunderstorm: { label: "Thunderstorm", icon: "⛈️", accent: "#ffe082", accent2: "#ffd54f" },
  Snow: { label: "Snowy", icon: "❄️", accent: "#e1f5fe", accent2: "#b3e5fc" },
  Mist: { label: "Misty", icon: "🌫️", accent: "#cfd8dc", accent2: "#b0bec5" },
  Haze: { label: "Hazy", icon: "🌫️", accent: "#d7ccc8", accent2: "#bcaaa4" },
  default: { label: "Weather", icon: "🌤️", accent: "#b0bec5", accent2: "#90a4ae" },
};

export const WEATHER_ICONS = {
  "01d": "☀️","01n": "🌙",
  "02d": "⛅","02n": "☁️",
  "03d": "☁️","03n": "☁️",
  "04d": "☁️","04n": "☁️",
  "09d": "🌧️","09n": "🌧️",
  "10d": "🌦️","10n": "🌧️",
  "11d": "⛈️","11n": "⛈️",
  "13d": "❄️","13n": "❄️",
  "50d": "🌫️","50n": "🌫️",
};

export const COMPASS = ["N","NE","E","SE","S","SW","W","NW"];
