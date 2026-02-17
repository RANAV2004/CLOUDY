import { COMPASS } from "../constants/weatherConstants";

export function getWindDirection(deg) {
  return COMPASS[Math.round(deg / 45) % 8];
}

export function formatTime(ts) {
  return new Date(ts * 1000).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export function formatDay(ts) {
  return new Date(ts * 1000).toLocaleDateString("en-US", { weekday: "short" });
}

export function formatDate(ts) {
  return new Date(ts * 1000).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
