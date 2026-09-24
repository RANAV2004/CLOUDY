# Cloudy — Weather App

A beautiful weather app built with React, featuring live weather data, hourly temperature charts, a 5-day forecast with expandable details, city autocomplete, dark/light theme toggle, and a dramatic cloud background.

## Features

- **Live weather** from OpenWeatherMap API
- **Hourly temperature chart** with feels-like curve
- **5-day forecast** with proportional temperature range bars and expandable details
- **City autocomplete** with keyboard navigation (↑↓ arrows, Enter, Escape)
- **Dark / light theme** toggle
- **Celsius / Fahrenheit** toggle
- **Animated particles** (rain, snow, sun, thunder, mist) based on the current weather
- **Dramatic cloud background** with frosted glass cards
- **Demo mode** — runs without an API key using mock data

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Get a free OpenWeatherMap API key at https://openweathermap.org/api

3. Open `src/WeatherApp.jsx` and replace the placeholder API key at the top of the file:
   ```js
   const API_KEY = "YOUR_API_KEY_HERE"; // ← replace this
   ```

4. Start the dev server:
   ```bash
   npm run dev
   ```

5. Open http://localhost:5173 in your browser.

## Project Structure

```
cloudy-app/
├── public/
│   └── clouds.jpg          ← the background image
├── src/
│   ├── WeatherApp.jsx      ← main component (all UI + logic)
│   ├── main.jsx            ← React entry point
│   └── index.css           ← global styles
├── index.html              ← HTML shell
├── vite.config.js
├── package.json
└── README.md
```

## Customization

- **Change the background image** — replace `public/clouds.jpg` with any image (keep the filename, or update `BACKGROUND_IMAGE` in `WeatherApp.jsx`).
- **Rename the app** — search for `CLOUDY` in `WeatherApp.jsx` and change it.
- **Change theme colors** — edit the `theme` object inside the `WeatherApp` component.
- **Change weather emojis** — edit the `WEATHER_ICONS` object at the top of `WeatherApp.jsx`.

## Build for Production

```bash
npm run build
```

Output goes to `dist/`. Serve it with any static host (Vercel, Netlify, GitHub Pages, etc.).

## Tech Stack

- **React ** with hooks
- **Vite** for fast dev + builds
- **OpenWeatherMap** for weather + geocoding data
- Pure CSS-in-JS (no external UI libraries)
- SVG for charts and background scene
