import { useState, useCallback, useEffect, useRef } from "react";
import bgVideo from "./assets/video1.mp4";


const API_KEY = "b89a4fe478d6b40c04533b704844c7e4";
const BASE_URL = "https://api.openweathermap.org/data/2.5";
const GEO_URL = "https://api.openweathermap.org/geo/1.0";


const CONDITIONS = {
  Clear:        { label: "Clear Sky",    icon: "",  accent: "#e8e0d0", accent2: "#c8b89a" },
  Clouds:       { label: "Cloudy",       icon: "☁️",  accent: "#b0bec5", accent2: "#90a4ae" },
  Rain:         { label: "Rainy",        icon: "🌧️",  accent: "#90caf9", accent2: "#64b5f6" },
  Drizzle:      { label: "Drizzle",      icon: "🌦️",  accent: "#b3e5fc", accent2: "#81d4fa" },
  Thunderstorm: { label: "Thunderstorm", icon: "⛈️",  accent: "#ffe082", accent2: "#ffd54f" },
  Snow:         { label: "Snowy",        icon: "❄️",  accent: "#e1f5fe", accent2: "#b3e5fc" },
  Mist:         { label: "Misty",        icon: "🌫️",  accent: "#cfd8dc", accent2: "#b0bec5" },
  Haze:         { label: "Hazy",         icon: "🌫️",  accent: "#d7ccc8", accent2: "#bcaaa4" },
  default:      { label: "Weather",      icon: "🌤️",  accent: "#b0bec5", accent2: "#90a4ae" },
};

// Maps OpenWeatherMap icon codes to emojis
const WEATHER_ICONS = {
  "01d": "☀️",  "01n": "🌙",
  "02d": "⛅",  "02n": "☁️",
  "03d": "☁️",  "03n": "☁️",
  "04d": "☁️",  "04n": "☁️",
  "09d": "🌧️",  "09n": "🌧️",
  "10d": "🌦️",  "10n": "🌧️",
  "11d": "⛈️",  "11n": "⛈️",
  "13d": "❄️",  "13n": "❄️",
  "50d": "🌫️",  "50n": "🌫️",
};


const COMPASS = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];


function getWindDirection(degrees) {
  return COMPASS[Math.round(degrees / 45) % 8];
}

function formatTime(unixTimestamp) {
  return new Date(unixTimestamp * 1000).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDay(unixTimestamp) {
  return new Date(unixTimestamp * 1000).toLocaleDateString("en-US", {
    weekday: "short",
  });
}

function formatDate(unixTimestamp) {
  return new Date(unixTimestamp * 1000).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

const MOCK_WEATHER = {
  name: "San Francisco",
  sys: { country: "US", sunrise: 1708340000, sunset: 1708382000 },
  main: {
    temp: 18.4,
    feels_like: 17.1,
    humidity: 72,
    pressure: 1015,
    temp_min: 14.2,
    temp_max: 21.6,
  },
  weather: [{ main: "Clouds", description: "overcast clouds", icon: "04d" }],
  wind: { speed: 4.2, deg: 230, gust: 6.1 },
  visibility: 10000,
  clouds: { all: 78 },
};

function buildMockForecast() {
  const now = Math.floor(Date.now() / 1000);
  const ONE_DAY = 86400;

  const days = [
    { main: "Clear",  desc: "clear sky",     icon: "01d", hi: 21.6, lo: 14.2, hum: 62, wind: 3.1, pop: 5  },
    { main: "Clouds", desc: "partly cloudy", icon: "02d", hi: 19.1, lo: 12.5, hum: 74, wind: 5.8, pop: 20 },
    { main: "Rain",   desc: "light rain",    icon: "10d", hi: 15.3, lo: 10.1, hum: 88, wind: 7.3, pop: 80 },
    { main: "Clouds", desc: "overcast",      icon: "04d", hi: 17.8, lo: 11.9, hum: 74, wind: 4.9, pop: 35 },
    { main: "Clear",  desc: "sunny",         icon: "01d", hi: 22.4, lo: 15.0, hum: 58, wind: 3.1, pop: 5  },
  ];

  return days.map((day, index) => ({
    dt: now + ONE_DAY * (index + 1),
    temp: {
      max: day.hi,
      min: day.lo,
      day: (day.hi + day.lo) / 2,
      night: day.lo + 1,
      eve: day.hi - 1,
      morn: day.lo + 2,
    },
    weather: [{ main: day.main, description: day.desc, icon: day.icon }],
    humidity: day.hum,
    wind_speed: day.wind,
    wind_deg: 180 + index * 30,
    pressure: 1013 + index * 2,
    visibility: 10000 - index * 500,
    clouds: index * 15,
    pop: day.pop,
    feels_like: (day.hi + day.lo) / 2 - 1,
  }));
}

// -------------------------------------------------------------------
// Takes the 3-hourly forecast list from the API and groups it by day,
// then returns one summary object per day (up to 5 days)
// -------------------------------------------------------------------
function groupForecastByDay(hourlyList) {
  const dayMap = {};

  hourlyList.forEach((item) => {
    const date = new Date(item.dt * 1000);
    const key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;

    if (!dayMap[key]) {
      dayMap[key] = { dt: item.dt, temps: [], items: [], weather: item.weather };
    }

    dayMap[key].temps.push(item.main.temp);
    dayMap[key].items.push(item);
  });

  
  return Object.values(dayMap)
    .slice(1, 6)
    .map((day) => {
      const midIndex = Math.floor(day.items.length / 2);
      const avgOf = (key) =>
        Math.round(day.items.reduce((sum, i) => sum + (i[key] || 0), 0) / day.items.length);

      return {
        dt: day.dt,
        temp: {
          max: Math.max(...day.temps),
          min: Math.min(...day.temps),
          day: day.temps[midIndex] || day.temps[0],
          night: Math.min(...day.temps) + 1,
          eve: Math.max(...day.temps) - 1,
          morn: Math.min(...day.temps) + 2,
        },
        weather: day.weather,
        humidity: avgOf("main.humidity") || Math.round(day.items.reduce((s, i) => s + i.main.humidity, 0) / day.items.length),
        wind_speed: Math.round(day.items.reduce((s, i) => s + (i.wind?.speed || 0), 0) / day.items.length * 10) / 10,
        wind_deg: day.items[midIndex]?.wind?.deg || 0,
        pressure: Math.round(day.items.reduce((s, i) => s + i.main.pressure, 0) / day.items.length),
        visibility: day.items[midIndex]?.visibility || 10000,
        clouds: day.items[midIndex]?.clouds?.all || 0,
        pop: Math.round(Math.max(...day.items.map((i) => i.pop || 0)) * 100),
        feels_like: Math.round(day.items.reduce((s, i) => s + i.main.feels_like, 0) / day.items.length),
      };
    });
}

// -------------------------------------------------------------------
// Particle background canvas — renders animated weather effects
// -------------------------------------------------------------------
function ParticleCanvas({ type, accent }) {
  const canvasRef = useRef(null);
  const animFrameRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");

    const resizeCanvas = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    // Create particles based on weather type
    const particles = [];
    const count = type === "rain" ? 100 : type === "snow" ? 50 : type === "thunder" ? 6 : 16;

    for (let i = 0; i < count; i++) {
      if (type === "rain") {
        particles.push({
          x: Math.random() * 9999,
          y: Math.random() * 9999,
          speed: 7 + Math.random() * 9,
          length: 12 + Math.random() * 18,
          opacity: 0.2 + Math.random() * 0.3,
        });
      } else if (type === "snow") {
        particles.push({
          x: Math.random() * 9999,
          y: Math.random() * 9999,
          radius: 2 + Math.random() * 3,
          speed: 0.4 + Math.random() * 1.2,
          drift: (Math.random() - 0.5) * 0.4,
          opacity: 0.3 + Math.random() * 0.5,
        });
      } else if (type === "sun") {
        particles.push({
          x: Math.random() * 9999,
          y: Math.random() * 9999,
          radius: 1 + Math.random() * 2,
          speed: 0.1 + Math.random() * 0.3,
          angle: Math.random() * Math.PI * 2,
          opacity: 0.04 + Math.random() * 0.12,
          pulse: Math.random() * Math.PI * 2,
        });
      } else if (type === "thunder") {
        particles.push({ x: 0, y: 0, active: false, timer: Math.random() * 80, points: [], life: 0 });
      } else {
        // mist / cloud
        particles.push({
          x: Math.random() * 9999,
          y: Math.random() * 9999,
          radius: 50 + Math.random() * 100,
          speed: 0.06 + Math.random() * 0.15,
          opacity: 0.015 + Math.random() * 0.03,
        });
      }
    }

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particles.forEach((p) => {
        const w = canvas.width;
        const h = canvas.height;

        if (type === "rain") {
          ctx.save();
          ctx.strokeStyle = accent;
          ctx.globalAlpha = p.opacity;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(p.x % w, p.y % h);
          ctx.lineTo((p.x - 2) % w, (p.y + p.length) % h);
          ctx.stroke();
          ctx.restore();
          p.y += p.speed;

        } else if (type === "snow") {
          ctx.save();
          ctx.fillStyle = accent;
          ctx.globalAlpha = p.opacity;
          ctx.beginPath();
          ctx.arc(p.x % w, p.y % h, p.radius, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
          p.y += p.speed;
          p.x += p.drift;

        } else if (type === "sun") {
          p.pulse += 0.015;
          ctx.save();
          ctx.fillStyle = accent;
          ctx.globalAlpha = p.opacity * (0.7 + 0.3 * Math.sin(p.pulse));
          ctx.beginPath();
          ctx.arc(p.x % w, p.y % h, p.radius + Math.sin(p.pulse) * 0.5, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
          p.x += Math.cos(p.angle) * p.speed;
          p.y += Math.sin(p.angle) * p.speed * 0.3;

        } else if (type === "thunder") {
          p.timer--;
          if (p.timer <= 0) {
            p.active = true;
            p.x = Math.random() * w;
            p.points = [];
            let cx = p.x, cy = 0;
            while (cy < h * 0.65) {
              cx += (Math.random() - 0.5) * 50;
              cy += 25 + Math.random() * 25;
              p.points.push([cx, cy]);
            }
            p.life = 7;
            p.timer = 70 + Math.random() * 100;
          }
          if (p.active && p.points.length) {
            ctx.save();
            ctx.strokeStyle = accent;
            ctx.globalAlpha = (p.life / 7) * 0.85;
            ctx.lineWidth = 1.5;
            ctx.shadowColor = accent;
            ctx.shadowBlur = 12;
            ctx.beginPath();
            ctx.moveTo(p.x, 0);
            p.points.forEach(([px, py]) => ctx.lineTo(px, py));
            ctx.stroke();
            ctx.restore();
            p.life--;
            if (p.life <= 0) p.active = false;
          }

        } else {
          // mist
          ctx.save();
          const grad = ctx.createRadialGradient(p.x % w, p.y % h, 0, p.x % w, p.y % h, p.radius);
          grad.addColorStop(0, `rgba(180,190,200,${p.opacity * 2})`);
          grad.addColorStop(1, "rgba(180,190,200,0)");
          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.arc(p.x % w, p.y % h, p.radius, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
          p.x += p.speed;
        }
      });

      animFrameRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(animFrameRef.current);
      window.removeEventListener("resize", resizeCanvas);
    };
  }, [type, accent]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
        opacity: 0.5,
      }}
    />
  );
}

// -------------------------------------------------------------------
// Smoothly counts from the previous value to the new one
// -------------------------------------------------------------------
function AnimatedNumber({ value, suffix = "" }) {
  const [displayed, setDisplayed] = useState(value);
  const prevValue = useRef(value);

  useEffect(() => {
    const start = prevValue.current;
    const end = value;
    const diff = end - start;

    if (diff === 0) return;

    let step = 0;
    const totalSteps = 30;

    const timer = setInterval(() => {
      step++;
      const current = start + (diff * step) / totalSteps;
      setDisplayed(parseFloat(current.toFixed(1)));

      if (step >= totalSteps) {
        clearInterval(timer);
        prevValue.current = end;
      }
    }, 16);

    return () => clearInterval(timer);
  }, [value]);

  return <>{displayed}{suffix}</>;
}

// -------------------------------------------------------------------
// Horizontal temp range bar used in the 5-day forecast rows
// Positions a colored fill relative to the week's overall min/max
// -------------------------------------------------------------------
function TempRangeBar({ dayMin, dayMax, weekMin, weekMax, isDark }) {
  const weekRange = weekMax - weekMin || 1;
  const leftPercent = ((dayMin - weekMin) / weekRange) * 100;
  const widthPercent = Math.max(((dayMax - dayMin) / weekRange) * 100, 6);

  const trackColor = isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)";
  const fillColor = isDark
    ? "linear-gradient(90deg, #78909c, #b0bec5)"
    : "linear-gradient(90deg, #546e7a, #78909c)";

  return (
    <div style={{
      position: "relative",
      height: 5,
      background: trackColor,
      borderRadius: 3,
      flex: 1,
      margin: "0 10px",
      minWidth: 80,
    }}>
      <div style={{
        position: "absolute",
        left: `${leftPercent}%`,
        width: `${widthPercent}%`,
        height: "100%",
        borderRadius: 3,
        background: fillColor,
        transition: "all 0.5s ease",
      }} />
    </div>
  );
}

// -------------------------------------------------------------------
// SVG line chart showing today's temperature curve across 24 hours
// -------------------------------------------------------------------
function TempChart({ tempMin, tempMax, feelsLike, isDark, textColor }) {
  // Hours to plot across the x-axis
  const timePoints = [0, 2, 5, 8, 11, 14, 17, 20, 23];
  const timeLabels = ["12AM", "2AM", "5AM", "8AM", "11AM", "2PM", "5PM", "8PM", "11PM"];

  // Generate a realistic sine-wave temperature curve:
  // temperature peaks around 2PM (hour 14) and dips around 5AM (hour 5)
  const temperatures = timePoints.map((hour) => {
    const normalized = (Math.sin(((hour - 5) / 24) * Math.PI * 2 - Math.PI / 2) + 1) / 2;
    return parseFloat((tempMin + (tempMax - tempMin) * normalized).toFixed(1));
  });

  // Feels-like runs ~1.5° below the main temperature
  const feelsTemps = temperatures.map((t) => parseFloat((t - 1.5).toFixed(1)));

  // Chart dimensions and padding
  const WIDTH = 500;
  const HEIGHT = 120;
  const PAD_LEFT = 32;
  const PAD_RIGHT = 12;
  const PAD_TOP = 24;
  const PAD_BOTTOM = 28;
  const innerWidth = WIDTH - PAD_LEFT - PAD_RIGHT;
  const innerHeight = HEIGHT - PAD_TOP - PAD_BOTTOM;

  const allValues = [...temperatures, ...feelsTemps];
  const minValue = Math.min(...allValues) - 2;
  const maxValue = Math.max(...allValues) + 2;

  // Scale functions: convert a data index or value to SVG coordinates
  const xAt = (index) => PAD_LEFT + (index / (timePoints.length - 1)) * innerWidth;
  const yAt = (value) => PAD_TOP + ((maxValue - value) / (maxValue - minValue)) * innerHeight;

  // Build a smooth cubic bezier SVG path from an array of [x, y] points
  const buildSmoothPath = (points) => {
    return points.reduce((pathStr, [x, y], i) => {
      if (i === 0) return `M${x.toFixed(1)},${y.toFixed(1)}`;
      const [prevX, prevY] = points[i - 1];
      const midX = (prevX + x) / 2;
      return `${pathStr} C${midX.toFixed(1)},${prevY.toFixed(1)} ${midX.toFixed(1)},${y.toFixed(1)} ${x.toFixed(1)},${y.toFixed(1)}`;
    }, "");
  };

  const tempPoints = temperatures.map((t, i) => [xAt(i), yAt(t)]);
  const feelsPoints = feelsTemps.map((t, i) => [xAt(i), yAt(t)]);

  const tempLinePath = buildSmoothPath(tempPoints);
  const feelsLinePath = buildSmoothPath(feelsPoints);

  // Close the temp path into a filled area shape
  const areaPath = `${tempLinePath} L${xAt(timePoints.length - 1)},${PAD_TOP + innerHeight} L${PAD_LEFT},${PAD_TOP + innerHeight} Z`;

  // Find the closest time point to the current hour for the "now" dot
  const currentHour = new Date().getHours();
  const nowIndex = timePoints.reduce((closest, hour, i) => {
    return Math.abs(hour - currentHour) < Math.abs(timePoints[closest] - currentHour) ? i : closest;
  }, 0);
  const nowX = xAt(nowIndex);
  const nowY = yAt(temperatures[nowIndex]);
  const nowTemp = temperatures[nowIndex];

  // Y-axis gridline values
  const gridValues = [tempMin, Math.round((tempMin + tempMax) / 2), tempMax];

  // Colors based on theme
  const lineColor  = isDark ? "#90a4ae" : "#37474f";
  const feelsColor = isDark ? "rgba(176,190,197,0.5)" : "rgba(55,71,79,0.4)";
  const gridColor  = isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)";
  const labelColor = isDark ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.45)";
  const tooltipBg  = isDark ? "#1e2124" : "#ffffff";
  const dotFill    = isDark ? "#cfd8dc" : "#263238";
  const dotRing    = isDark ? "#111213" : "#f0f2f4";

  return (
    <div style={{ marginTop: 22 }}>
      {/* Legend */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
        <span style={{
          fontSize: 10,
          fontWeight: 600,
          letterSpacing: "1px",
          textTransform: "uppercase",
          color: labelColor,
        }}>
          Today's Temperature
        </span>
        <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <svg width="20" height="8">
              <line x1="0" y1="4" x2="20" y2="4" stroke={lineColor} strokeWidth="2" strokeLinecap="round" />
            </svg>
            <span style={{ fontSize: 10, color: labelColor }}>Temp</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <svg width="20" height="8">
              <line x1="0" y1="4" x2="20" y2="4" stroke={feelsColor} strokeWidth="1.5" strokeDasharray="4,3" strokeLinecap="round" />
            </svg>
            <span style={{ fontSize: 10, color: labelColor }}>Feels like</span>
          </div>
        </div>
      </div>

      {/* Chart */}
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        style={{ width: "100%", height: "auto", display: "block", overflow: "visible" }}
      >
        <defs>
          <linearGradient id="chartAreaGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor={lineColor} stopOpacity={isDark ? "0.22" : "0.15"} />
            <stop offset="100%" stopColor={lineColor} stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Horizontal dashed grid lines with Y-axis temperature labels */}
        {gridValues.map((value, i) => (
          <g key={i}>
            <line
              x1={PAD_LEFT} y1={yAt(value)}
              x2={WIDTH - PAD_RIGHT} y2={yAt(value)}
              stroke={gridColor}
              strokeWidth="1"
              strokeDasharray="5,4"
            />
            <text
              x={PAD_LEFT - 4} y={yAt(value) + 4}
              fill={labelColor}
              fontSize="9"
              textAnchor="end"
              fontFamily="Sora, sans-serif"
            >
              {value}°
            </text>
          </g>
        ))}

        {/* Shaded area under the temperature line */}
        <path d={areaPath} fill="url(#chartAreaGradient)" />

        {/* Dashed feels-like line */}
        <path
          d={feelsLinePath}
          fill="none"
          stroke={feelsColor}
          strokeWidth="1.8"
          strokeDasharray="5,4"
          strokeLinecap="round"
        />

        {/* Main solid temperature line */}
        <path
          d={tempLinePath}
          fill="none"
          stroke={lineColor}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Temperature value labels above each data point */}
        {tempPoints.map(([x, y], i) => (
          <text
            key={i}
            x={x} y={y - 8}
            fill={labelColor}
            fontSize="9"
            textAnchor="middle"
            fontFamily="Sora, sans-serif"
            fontWeight="500"
          >
            {temperatures[i]}°
          </text>
        ))}

        {/* Vertical dashed line marking the current time */}
        <line
          x1={nowX} y1={PAD_TOP}
          x2={nowX} y2={PAD_TOP + innerHeight}
          stroke={isDark ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.15)"}
          strokeWidth="1"
          strokeDasharray="4,3"
        />

        {/* Current time dot — outer ring + inner dot */}
        <circle cx={nowX} cy={nowY} r="7" fill={dotFill} stroke={dotRing} strokeWidth="2.5" />
        <circle cx={nowX} cy={nowY} r="3" fill={dotRing} />

        {/* Tooltip box showing the current temperature */}
        <rect
          x={nowX - 22} y={nowY - 34}
          width="44" height="22"
          rx="6"
          fill={tooltipBg}
          stroke={isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.1)"}
          strokeWidth="1"
        />
        <text
          x={nowX} y={nowY - 18}
          fill={textColor}
          fontSize="10"
          textAnchor="middle"
          fontFamily="Sora, sans-serif"
          fontWeight="700"
        >
          {nowTemp}°
        </text>

        {/* X-axis time labels */}
        {timeLabels.map((label, i) => (
          <text
            key={i}
            x={xAt(i)} y={HEIGHT - 2}
            fill={labelColor}
            fontSize="9"
            textAnchor="middle"
            fontFamily="Sora, sans-serif"
          >
            {label}
          </text>
        ))}
      </svg>
    </div>
  );
}

// -------------------------------------------------------------------
// Main WeatherApp component
// -------------------------------------------------------------------
export default function WeatherApp() {
  const [searchInput, setSearchInput]       = useState("");
  const [suggestions, setSuggestions]       = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [currentWeather, setCurrentWeather] = useState(null);
  const [forecastDays, setForecastDays]     = useState([]);
  const [isLoading, setIsLoading]           = useState(false);
  const [errorMsg, setErrorMsg]             = useState("");
  const [tempUnit, setTempUnit]             = useState("metric");
  const [isRevealed, setIsRevealed]         = useState(false);
  const [searchFocused, setSearchFocused]   = useState(false);
  const [highlightedIdx, setHighlightedIdx] = useState(-1);
  const [expandedDay, setExpandedDay]       = useState(null);
  const [isDark, setIsDark]                 = useState(true);

  const isDemoMode = API_KEY === "YOUR_API_KEY_HERE";

  const debounceTimer = useRef(null);
  const searchInputRef = useRef(null);
  const suggestionsRef = useRef(null);

  // Get the current weather condition metadata (for icon, label, accent color)
  const condition = currentWeather
    ? (CONDITIONS[currentWeather.weather[0].main] || CONDITIONS.default)
    : CONDITIONS.default;

  // Decide which particle type to show based on weather condition
  const particleType = (() => {
    if (!currentWeather) return "cloud";
    const main = currentWeather.weather[0].main;
    if (main === "Clear") return "sun";
    if (main === "Rain" || main === "Drizzle") return "rain";
    if (main === "Snow") return "snow";
    if (main === "Thunderstorm") return "thunder";
    return "cloud";
  })();

  // Theme token object — all colors come from here, so switching themes is easy
  const theme = isDark ? {
    bg:          "#111213",
    card:        "rgba(255,255,255,0.04)",
    cardBorder:  "rgba(255,255,255,0.07)",
    cardHover:   "rgba(255,255,255,0.07)",
    text:        "rgba(255,255,255,0.92)",
    textSub:     "rgba(255,255,255,0.45)",
    textMuted:   "rgba(255,255,255,0.25)",
    accent:      condition.accent,
    input:       "rgba(255,255,255,0.06)",
    inputBorder: "rgba(255,255,255,0.12)",
    divider:     "rgba(255,255,255,0.07)",
    chip:        "rgba(255,255,255,0.05)",
    chipBorder:  "rgba(255,255,255,0.08)",
    shadow:      "rgba(0,0,0,0.4)",
    suggBg:      "rgba(13,14,16,0.97)",
    suggHover:   "rgba(255,255,255,0.06)",
    logoColor:   "#9aafb5",
  } : {
    bg:          "#f0f2f4",
    card:        "rgba(255,255,255,0.85)",
    cardBorder:  "rgba(0,0,0,0.07)",
    cardHover:   "rgba(255,255,255,1)",
    text:        "#1a1e21",
    textSub:     "#5a6370",
    textMuted:   "#9aa0a8",
    accent:      "#37474f",
    input:       "rgba(255,255,255,0.9)",
    inputBorder: "rgba(0,0,0,0.12)",
    divider:     "rgba(0,0,0,0.07)",
    chip:        "rgba(0,0,0,0.04)",
    chipBorder:  "rgba(0,0,0,0.07)",
    shadow:      "rgba(0,0,0,0.1)",
    suggBg:      "rgba(245,247,249,0.99)",
    suggHover:   "rgba(0,0,0,0.05)",
    logoColor:   "#546e7a",
  };

  // -------------------------------------------------------------------
  // City autocomplete — fetches suggestions as the user types
  // -------------------------------------------------------------------
  const fetchSuggestions = useCallback(async (query) => {
    if (!query || query.length < 2) {
      setSuggestions([]);
      return;
    }

    if (isDemoMode) {
      // In demo mode, filter from a hardcoded list
      const citiesList = [
        { name: "London",    country: "GB", state: "England" },
        { name: "Los Angeles", country: "US", state: "California" },
        { name: "Lima",      country: "PE", state: "Lima" },
        { name: "Lisbon",    country: "PT", state: "Lisbon" },
        { name: "Lyon",      country: "FR", state: "Auvergne" },
        { name: "Lagos",     country: "NG", state: "Lagos" },
        { name: "Tokyo",     country: "JP", state: "Tokyo" },
        { name: "Toronto",   country: "CA", state: "Ontario" },
        { name: "Taipei",    country: "TW", state: "Taipei" },
        { name: "New York",  country: "US", state: "New York" },
        { name: "New Delhi", country: "IN", state: "Delhi" },
        { name: "Sydney",    country: "AU", state: "New South Wales" },
        { name: "Singapore", country: "SG", state: "" },
        { name: "Seoul",     country: "KR", state: "Seoul" },
        { name: "Paris",     country: "FR", state: "Île-de-France" },
        { name: "Prague",    country: "CZ", state: "Bohemia" },
        { name: "Dubai",     country: "AE", state: "Dubai" },
        { name: "Berlin",    country: "DE", state: "Berlin" },
        { name: "Barcelona", country: "ES", state: "Catalonia" },
        { name: "Mumbai",    country: "IN", state: "Maharashtra" },
        { name: "Chicago",   country: "US", state: "Illinois" },
        { name: "Cairo",     country: "EG", state: "Cairo" },
      ];

      const matches = citiesList
        .filter((c) => c.name.toLowerCase().startsWith(query.toLowerCase()))
        .slice(0, 6);

      setSuggestions(matches);
      setShowSuggestions(matches.length > 0);
      return;
    }

    try {
      const res = await fetch(
        `${GEO_URL}/direct?q=${encodeURIComponent(query)}&limit=6&appid=${API_KEY}`
      );
      const data = await res.json();

      // Remove duplicate city+country pairs
      const unique = data.filter((item, index, arr) =>
        arr.findIndex((t) => t.name === item.name && t.country === item.country) === index
      );

      setSuggestions(unique);
      setShowSuggestions(unique.length > 0);
    } catch {
      setSuggestions([]);
    }
  }, [isDemoMode]);

  // Debounce the autocomplete so we don't fire on every keystroke
  const handleSearchInput = (e) => {
    const value = e.target.value;
    setSearchInput(value);
    setHighlightedIdx(-1);
    clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => fetchSuggestions(value), 220);
  };

  // Keyboard navigation for the suggestions dropdown
  const handleKeyDown = (e) => {
    if (!showSuggestions || suggestions.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightedIdx((i) => Math.min(i + 1, suggestions.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedIdx((i) => Math.max(i - 1, -1));
    } else if (e.key === "Enter" && highlightedIdx >= 0) {
      e.preventDefault();
      pickSuggestion(suggestions[highlightedIdx]);
    } else if (e.key === "Escape") {
      setShowSuggestions(false);
      setHighlightedIdx(-1);
    }
  };

  const pickSuggestion = (city) => {
    setSearchInput(city.name);
    setSuggestions([]);
    setShowSuggestions(false);
    setHighlightedIdx(-1);
    loadWeather(`${city.name},${city.country}`);
  };

  // Close suggestions when clicking elsewhere on the page
  useEffect(() => {
    const handleOutsideClick = (e) => {
      const clickedOutsideSearch = !searchInputRef.current?.contains(e.target);
      const clickedOutsideSuggestions = !suggestionsRef.current?.contains(e.target);
      if (clickedOutsideSearch && clickedOutsideSuggestions) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  
  const loadWeather = useCallback(async (cityQuery) => {
    if (!cityQuery.trim()) return;

    setIsLoading(true);
    setErrorMsg("");
    setIsRevealed(false);
    setSuggestions([]);
    setShowSuggestions(false);
    setExpandedDay(null);

    if (isDemoMode) {
      await new Promise((resolve) => setTimeout(resolve, 800));
      setCurrentWeather({ ...MOCK_WEATHER, name: cityQuery.split(",")[0] });
      setForecastDays(buildMockForecast());
      setTimeout(() => setIsRevealed(true), 80);
      setIsLoading(false);
      return;
    }

    try {
      const units = tempUnit === "metric" ? "metric" : "imperial";

      // Fetch current weather and forecast in parallel
      const [weatherRes, forecastRes] = await Promise.all([
        fetch(`${BASE_URL}/weather?q=${encodeURIComponent(cityQuery)}&appid=${API_KEY}&units=${units}`),
        fetch(`${BASE_URL}/forecast?q=${encodeURIComponent(cityQuery)}&appid=${API_KEY}&units=${units}&cnt=40`),
      ]);

      if (!weatherRes.ok) {
        if (weatherRes.status === 404) throw new Error("City not found. Try a different spelling.");
        if (weatherRes.status === 401) throw new Error("Invalid API key. Check your OpenWeatherMap key.");
        throw new Error("Something went wrong. Please try again.");
      }

      const [weatherData, forecastData] = await Promise.all([
        weatherRes.json(),
        forecastRes.json(),
      ]);

      setCurrentWeather(weatherData);
      setForecastDays(groupForecastByDay(forecastData.list));
      setTimeout(() => setIsRevealed(true), 80);

    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [tempUnit, isDemoMode]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (highlightedIdx >= 0 && suggestions[highlightedIdx]) {
      pickSuggestion(suggestions[highlightedIdx]);
      return;
    }
    if (searchInput.trim()) {
      loadWeather(searchInput.trim());
    }
  };

  // Convert temperature based on selected unit
  const convertTemp = (celsius) => {
    if (tempUnit === "imperial" && !isDemoMode) return Math.round(celsius);
    if (tempUnit === "imperial") return Math.round(celsius * 9 / 5 + 32);
    return Math.round(celsius);
  };

  const tempSymbol = tempUnit === "metric" ? "°C" : "°F";

  // Min/max across all forecast days (used to scale the range bars)
  const weekMin = forecastDays.length ? Math.min(...forecastDays.map((d) => convertTemp(d.temp.min))) : 0;
  const weekMax = forecastDays.length ? Math.max(...forecastDays.map((d) => convertTemp(d.temp.max))) : 40;

  // The 4 stat tiles shown on the right side
  const statTiles = currentWeather ? [
    { icon: "💧", label: "Humidity",    value: currentWeather.main.humidity,                           suffix: "%" },
    { icon: "🌡️", label: "Pressure",    value: currentWeather.main.pressure,                           suffix: " hPa" },
    { icon: "👁️", label: "Visibility",  value: Math.round(currentWeather.visibility / 100) / 10,        suffix: " km" },
    { icon: "☁️", label: "Cloud Cover", value: currentWeather.clouds.all,                               suffix: "%" },
  ] : [];

  // -------------------------------------------------------------------
  // CSS — written as a template literal for dynamic theme values
  // -------------------------------------------------------------------
  const styles = `
    @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700&family=DM+Serif+Display:ital@0;1&display=swap');

    *, *::before, *::after {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    html, body, #root {
      width: 100%;
      min-height: 100vh;
    }

    @keyframes fadeUp {
      from { opacity: 0; transform: translateY(16px); }
      to   { opacity: 1; transform: translateY(0); }
    }

    @keyframes fadeIn {
      from { opacity: 0; }
      to   { opacity: 1; }
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    @keyframes floatUpDown {
      0%, 100% { transform: translateY(0); }
      50%       { transform: translateY(-8px); }
    }

    @keyframes slideFromLeft {
      from { opacity: 0; transform: translateX(-8px); }
      to   { opacity: 1; transform: translateX(0); }
    }

    @keyframes pulseOpacity {
      0%, 100% { opacity: 0.5; }
      50%       { opacity: 1; }
    }

    @keyframes suggestionDrop {
      from { opacity: 0; transform: translateY(-6px); }
      to   { opacity: 1; transform: translateY(0); }
    }

    /* App wrapper */
    .app {
      width: 100vw;
      min-height: 100vh;
      background: ${theme.bg};
      transition: background 0.4s ease;
      font-family: 'Sora', sans-serif;
      display: flex;
      flex-direction: column;
      align-items: center;
      position: relative;
      overflow: hidden;
    }

    /* Background particle layer */
    .particle-layer {
      position: fixed;
      inset: 0;
      z-index: 0;
      pointer-events: none;
    }

    /* Top navigation bar */
    .navbar {
      width: 100%;
      max-width: 1280px;
      padding: 20px 40px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      position: relative;
      z-index: 10;
    }

    .logo {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .logo-text {
      font-family: 'DM Serif Display', serif;
      font-size: 22px;
      color: ${theme.logoColor};
      letter-spacing: 1px;
      font-style: italic;
      transition: color 0.4s ease;
    }

    .nav-controls {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    /* Search input */
    .search-container {
      position: relative;
      flex: 1;
      max-width: 380px;
    }

    .search-box {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 11px 16px;
      background: ${theme.input};
      border: 1.5px solid ${searchFocused ? theme.accent : theme.inputBorder};
      border-radius: 14px;
      transition: all 0.25s ease;
      box-shadow: ${searchFocused ? `0 0 0 3px ${theme.accent}22` : "none"};
    }

    .search-input {
      background: transparent;
      border: none;
      outline: none;
      font-family: 'Sora', sans-serif;
      font-size: 14px;
      color: ${theme.text};
      width: 100%;
    }

    .search-input::placeholder {
      color: ${theme.textMuted};
    }

    /* Suggestions dropdown */
    .suggestions-dropdown {
      position: absolute;
      top: calc(100% + 6px);
      left: 0;
      right: 0;
      z-index: 999;
      background: ${theme.suggBg};
      backdrop-filter: blur(20px);
      border: 1px solid ${theme.cardBorder};
      border-radius: 14px;
      overflow: hidden;
      animation: suggestionDrop 0.18s ease;
      box-shadow: 0 16px 50px ${theme.shadow};
    }

    .suggestion-item {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 11px 16px;
      cursor: pointer;
      transition: background 0.12s;
      border-bottom: 1px solid ${theme.divider};
    }

    .suggestion-item:last-child {
      border-bottom: none;
    }

    .suggestion-item:hover,
    .suggestion-item.highlighted {
      background: ${theme.suggHover};
    }

    .suggestion-city-name {
      font-size: 14px;
      font-weight: 500;
      color: ${theme.text};
    }

    .suggestion-meta {
      font-size: 11px;
      color: ${theme.textMuted};
      margin-top: 1px;
    }

    /* Theme toggle button */
    .theme-toggle {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: ${theme.chip};
      border: 1.5px solid ${theme.chipBorder};
      cursor: pointer;
      font-size: 18px;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
      color: ${theme.text};
    }

    .theme-toggle:hover {
      transform: scale(1.12) rotate(20deg);
      background: ${theme.cardHover};
    }

    /* Unit toggle pills */
    .unit-toggle {
      display: flex;
      background: ${theme.chip};
      border: 1.5px solid ${theme.chipBorder};
      border-radius: 12px;
      overflow: hidden;
    }

    .unit-btn {
      background: none;
      border: none;
      padding: 7px 14px;
      font-family: 'Sora', sans-serif;
      font-size: 12px;
      font-weight: 500;
      color: ${theme.textMuted};
      cursor: pointer;
      transition: all 0.2s;
    }

    .unit-btn.active {
      background: ${isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.08)"};
      color: ${theme.text};
    }

    /* Search button */
    .search-btn {
      background: ${theme.accent};
      color: ${isDark ? "#0d1012" : "#fff"};
      border: none;
      border-radius: 12px;
      padding: 11px 22px;
      font-family: 'Sora', sans-serif;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
      white-space: nowrap;
      flex-shrink: 0;
    }

    .search-btn:hover {
      transform: scale(1.04) translateY(-1px);
      box-shadow: 0 8px 24px ${theme.shadow};
    }

    .search-btn:active {
      transform: scale(0.97);
    }

    /* Card base style */
    .card {
      background: ${theme.card};
      border: 1px solid ${theme.cardBorder};
      border-radius: 20px;
      backdrop-filter: blur(16px);
      transition: background 0.4s ease, border 0.4s ease;
    }

    /* Small info chips (humidity, pressure, etc.) */
    .stat-chip {
      background: ${theme.chip};
      border: 1px solid ${theme.chipBorder};
      border-radius: 14px;
      padding: 16px;
      transition: all 0.25s ease;
    }

    .stat-chip:hover {
      background: ${theme.cardHover};
      transform: translateY(-3px);
      box-shadow: 0 10px 28px ${theme.shadow};
    }

    /* Accent badge (e.g. CLOUDY, US) */
    .badge {
      display: inline-block;
      background: ${isDark ? `${theme.accent}18` : `${theme.accent}14`};
      border: 1px solid ${isDark ? `${theme.accent}30` : `${theme.accent}28`};
      border-radius: 7px;
      padding: 3px 9px;
      font-size: 11px;
      color: ${theme.accent};
      font-weight: 600;
      letter-spacing: 0.4px;
      transition: all 0.4s;
    }

    /* Section heading labels */
    .section-label {
      font-size: 11px;
      font-weight: 600;
      color: ${theme.textMuted};
      text-transform: uppercase;
      letter-spacing: 1.5px;
    }

    /* Big temperature display */
    .temp-display {
      font-family: 'DM Serif Display', serif;
      font-size: clamp(68px, 8vw, 96px);
      font-weight: 400;
      line-height: 1;
      letter-spacing: -3px;
      color: ${theme.text};
      transition: color 0.4s;
    }

    /* Quick-pick city buttons on empty state */
    .quick-city-btn {
      background: ${theme.chip};
      border: 1px solid ${theme.chipBorder};
      border-radius: 10px;
      padding: 7px 14px;
      color: ${theme.textSub};
      font-size: 13px;
      cursor: pointer;
      font-family: 'Sora', sans-serif;
      transition: all 0.2s;
    }

    .quick-city-btn:hover {
      background: ${theme.cardHover};
      color: ${theme.text};
      transform: translateY(-2px);
    }

    /* Forecast rows */
    .forecast-row {
      display: grid;
      grid-template-columns: 100px 30px 1fr 58px 58px 24px;
      align-items: center;
      gap: 10px;
      padding: 13px 20px;
      cursor: pointer;
      border-bottom: 1px solid ${theme.divider};
      transition: background 0.18s ease;
    }

    .forecast-row:last-child {
      border-bottom: none;
    }

    .forecast-row:hover,
    .forecast-row.expanded {
      background: ${theme.suggHover};
    }

    /* Expanded detail panel inside a forecast row */
    .day-details {
      overflow: hidden;
      border-bottom: 1px solid ${theme.divider};
      background: ${isDark ? "rgba(0,0,0,0.15)" : "rgba(0,0,0,0.02)"};
    }

    .detail-chips-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
      gap: 8px;
      padding: 14px 20px 18px;
    }

    .detail-chip {
      background: ${theme.chip};
      border: 1px solid ${theme.chipBorder};
      border-radius: 12px;
      padding: 12px;
    }

    /* Wind speed bar */
    .wind-bar-track {
      height: 4px;
      background: ${isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)"};
      border-radius: 3px;
      overflow: hidden;
    }

    .wind-bar-fill {
      height: 100%;
      border-radius: 3px;
      background: linear-gradient(90deg, ${theme.accent}, ${condition.accent2 || theme.accent});
    }

    /* Loading spinner */
    .spinner {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      border: 3px solid ${theme.divider};
      border-top-color: ${theme.accent};
      animation: spin 0.9s linear infinite;
    }

    /* Demo mode notice */
    .demo-notice {
      background: ${isDark ? "rgba(200,180,120,0.08)" : "rgba(180,150,60,0.08)"};
      border: 1px solid ${isDark ? "rgba(200,180,120,0.18)" : "rgba(180,150,60,0.2)"};
      border-radius: 12px;
      padding: 9px 14px;
      font-size: 12px;
      color: ${isDark ? "rgba(220,200,140,0.75)" : "rgba(120,90,20,0.8)"};
      display: flex;
      align-items: center;
      gap: 8px;
    }

    /* Error message */
    .error-notice {
      background: rgba(239, 68, 68, 0.08);
      border: 1px solid rgba(239, 68, 68, 0.2);
      border-radius: 14px;
      padding: 13px 16px;
      color: ${isDark ? "#fca5a5" : "#c0392b"};
      font-size: 14px;
    }

    /* Staggered reveal animations for weather cards */
    .reveal-1 { opacity: ${isRevealed ? 1 : 0}; transform: translateY(${isRevealed ? 0 : 20}px); transition: opacity 0.55s ease 0.05s, transform 0.55s cubic-bezier(0.4,0,0.2,1) 0.05s; }
    .reveal-2 { opacity: ${isRevealed ? 1 : 0}; transform: translateY(${isRevealed ? 0 : 20}px); transition: opacity 0.55s ease 0.15s, transform 0.55s cubic-bezier(0.4,0,0.2,1) 0.15s; }
    .reveal-3 { opacity: ${isRevealed ? 1 : 0}; transform: translateY(${isRevealed ? 0 : 20}px); transition: opacity 0.55s ease 0.28s, transform 0.55s cubic-bezier(0.4,0,0.2,1) 0.28s; }
    .reveal-4 { opacity: ${isRevealed ? 1 : 0}; transform: translateY(${isRevealed ? 0 : 20}px); transition: opacity 0.55s ease 0.42s, transform 0.55s cubic-bezier(0.4,0,0.2,1) 0.42s; }
    .reveal-5 { opacity: ${isRevealed ? 1 : 0}; transform: translateY(${isRevealed ? 0 : 20}px); transition: opacity 0.55s ease 0.55s, transform 0.55s cubic-bezier(0.4,0,0.2,1) 0.55s; }

    /* Scrollbar styling */
    ::-webkit-scrollbar { width: 6px; }
    ::-webkit-scrollbar-track { background: transparent; }
    ::-webkit-scrollbar-thumb { background: ${theme.divider}; border-radius: 3px; }

    @media (max-width: 768px) {
      .navbar { padding: 16px 20px; }
      .two-col { grid-template-columns: 1fr !important; }
      .forecast-row { grid-template-columns: 80px 26px 1fr 50px 50px 20px; padding: 12px 14px; gap: 8px; }
    }
  `;


  return (
   <div className="app" style={{ position: "relative", zIndex: 1 }}>

      <style>{styles}</style>
      <div className="particle-layer">
        {currentWeather && (
          <ParticleCanvas
            type={particleType}
            accent={isDark ? theme.accent : "rgba(120,144,156,0.5)"}
          />
        )}
        <div style={{
          position: "absolute",
          top: "-20%",
          left: "30%",
          width: 700,
          height: 500,
          background: `radial-gradient(ellipse, ${isDark ? theme.accent + "0d" : "rgba(120,144,156,0.06)"} 0%, transparent 70%)`,
          pointerEvents: "none",
          animation: "pulseOpacity 6s ease-in-out infinite",
        }} />
      </div>
      <nav className="navbar" style={{ animation: "fadeUp 0.5s ease" }}>
        <div className="logo">
          <span style={{ fontSize: 28 }}>☁️</span>
          <span className="logo-text">CLOUDY</span>
        </div>

        <div className="nav-controls">
          <div className="search-container">
            <div className="search-box">
              <svg width="15" height="15" viewBox="0 0 20 20" fill="none" style={{ flexShrink: 0, opacity: 0.4 }}>
                <circle cx="9" cy="9" r="6" stroke={theme.text} strokeWidth="2" />
                <path d="M14 14l3 3" stroke={theme.text} strokeWidth="2" strokeLinecap="round" />
              </svg>
              <input
                ref={searchInputRef}
                className="search-input"
                placeholder="Search cities..."
                value={searchInput}
                onChange={handleSearchInput}
                onFocus={() => {
                  setSearchFocused(true);
                  if (suggestions.length > 0) setShowSuggestions(true);
                }}
                onBlur={() => setSearchFocused(false)}
                onKeyDown={handleKeyDown}
                autoComplete="off"
              />
              {searchInput && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchInput("");
                    setSuggestions([]);
                    setShowSuggestions(false);
                    searchInputRef.current?.focus();
                  }}
                  style={{
                    background: "none",
                    border: "none",
                    color: theme.textMuted,
                    cursor: "pointer",
                    fontSize: 18,
                    lineHeight: 1,
                    flexShrink: 0,
                  }}
                >
                  ×
                </button>
              )}
            </div>

           
            {showSuggestions && suggestions.length > 0 && (
              <div className="suggestions-dropdown" ref={suggestionsRef}>
                {suggestions.map((city, index) => (
                  <div
                    key={`${city.name}-${city.country}-${index}`}
                    className={`suggestion-item${highlightedIdx === index ? " highlighted" : ""}`}
                    onMouseDown={() => pickSuggestion(city)}
                    onMouseEnter={() => setHighlightedIdx(index)}
                  >
                    <span style={{ fontSize: 16, opacity: 0.5 }}>📍</span>
                    <div>
                      <div className="suggestion-city-name">{city.name}</div>
                      <div className="suggestion-meta">
                        {[city.state, city.country].filter(Boolean).join(", ")}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

         
          <button
            className="theme-toggle"
            onClick={() => setIsDark((prev) => !prev)}
            title="Toggle dark/light theme"
          >
            {isDark ? "☀️" : "🌙"}
          </button>

          
          <div className="unit-toggle">
            <button
              className={`unit-btn${tempUnit === "metric" ? " active" : ""}`}
              onClick={() => setTempUnit("metric")}
            >
              °C
            </button>
            <button
              className={`unit-btn${tempUnit === "imperial" ? " active" : ""}`}
              onClick={() => setTempUnit("imperial")}
            >
              °F
            </button>
          </div>

          <button
            className="search-btn"
            onClick={handleSearchSubmit}
            disabled={isLoading}
          >
            {isLoading ? "..." : "Search"}
          </button>
        </div>
      </nav>

     
      <main style={{
        position: "relative",
        zIndex: 1,
        width: "100%",
        maxWidth: 1280,
        padding: "0 40px 80px",
      }}>

        
        {isDemoMode && (
          <div className="demo-notice" style={{ marginBottom: 16, animation: "fadeIn 0.5s ease" }}>
            <span>⚠️</span>
            <span>
              Demo mode — replace <code>YOUR_API_KEY_HERE</code> with your{" "}
              <a
                href="https://openweathermap.org/api"
                target="_blank"
                rel="noreferrer"
                style={{ color: theme.accent }}
              >
                OpenWeatherMap key
              </a>
            </span>
          </div>
        )}

       
        {errorMsg && (
          <div className="error-notice" style={{ marginBottom: 16 }}>
            ⚠️ {errorMsg}
          </div>
        )}

        
        {isLoading && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14, paddingTop: 100 }}>
            <div className="spinner" />
            <p style={{ color: theme.textMuted, fontSize: 12, letterSpacing: "1.5px", fontWeight: 500 }}>
              FETCHING WEATHER...
            </p>
          </div>
        )}

        
        {!currentWeather && !isLoading && !errorMsg && (
          <div style={{ textAlign: "center", paddingTop: 80, animation: "fadeIn 0.8s ease" }}>
            <div style={{
              fontSize: "clamp(56px, 9vw, 86px)",
              marginBottom: 16,
              opacity: 0.35,
              animation: "floatUpDown 4s ease-in-out infinite",
            }}>
              ☁️
            </div>
            <p style={{ color: theme.textSub, fontSize: 17, fontWeight: 300 }}>
              Search for any city to see the weather
            </p>
            <p style={{ color: theme.textMuted, fontSize: 12, marginTop: 6 }}>
              Type a city name above to see live suggestions
            </p>
            <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 20, flexWrap: "wrap" }}>
              {["London", "Tokyo", "New York", "Sydney", "Paris", "Dubai", "Mumbai", "Berlin"].map((city) => (
                <button
                  key={city}
                  className="quick-city-btn"
                  onClick={() => {
                    setSearchInput(city);
                    loadWeather(city);
                  }}
                >
                  {city}
                </button>
              ))}
            </div>
          </div>
        )}

       
        {currentWeather && !isLoading && (
          <>
            
            <div
              className="two-col"
              style={{ display: "grid", gridTemplateColumns: "minmax(0, 1.25fr) minmax(0, 1fr)", gap: 14, marginBottom: 14 }}
            >

             
              <div className="card reveal-1" style={{ padding: "30px 32px 26px" }}>

                
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <h2 style={{
                      fontFamily: "'DM Serif Display', serif",
                      fontSize: "clamp(26px, 3vw, 36px)",
                      fontWeight: 400,
                      color: theme.text,
                      letterSpacing: "-0.2px",
                    }}>
                      {currentWeather.name}
                    </h2>
                    <p style={{ color: theme.textSub, fontSize: 13, marginTop: 3 }}>
                      {currentWeather.sys.country}
                    </p>
                    <div style={{ marginTop: 10 }}>
                      <span className="badge">{condition.label.toUpperCase()}</span>
                    </div>
                  </div>

                  
                  <div style={{
                    fontSize: "clamp(48px, 6vw, 68px)",
                    animation: "floatUpDown 4s ease-in-out infinite",
                    filter: `drop-shadow(0 4px 12px ${theme.shadow})`,
                  }}>
                    {WEATHER_ICONS[currentWeather.weather[0].icon] || "🌡️"}
                  </div>
                </div>

               
                <div style={{ margin: "20px 0 8px" }}>
                  <div style={{ display: "flex", alignItems: "flex-end", gap: 12, flexWrap: "wrap" }}>
                    <span className="temp-display">
                      <AnimatedNumber value={convertTemp(currentWeather.main.temp)} />
                      {tempSymbol}
                    </span>
                    <div style={{ paddingBottom: 10 }}>
                      <p style={{ color: theme.textSub, fontSize: 13 }}>
                        Feels like {convertTemp(currentWeather.main.feels_like)}{tempSymbol}
                      </p>
                      <div style={{ display: "flex", gap: 12, marginTop: 4, fontSize: 13 }}>
                        <span style={{ color: "#78909c" }}>↓ {convertTemp(currentWeather.main.temp_min)}{tempSymbol}</span>
                        <span style={{ color: "#b0bec5" }}>↑ {convertTemp(currentWeather.main.temp_max)}{tempSymbol}</span>
                      </div>
                    </div>
                  </div>

                  <p style={{ color: theme.textSub, fontSize: 14, marginTop: 4, textTransform: "capitalize" }}>
                    {currentWeather.weather[0].description}
                  </p>

                 
                  <TempChart
                    tempMin={convertTemp(currentWeather.main.temp_min)}
                    tempMax={convertTemp(currentWeather.main.temp_max)}
                    feelsLike={convertTemp(currentWeather.main.feels_like)}
                    isDark={isDark}
                    textColor={theme.text}
                  />
                </div>

              
                <div style={{ height: 1, background: theme.divider, margin: "18px 0" }} />

             
                <div style={{ display: "flex", gap: 28, flexWrap: "wrap" }}>
                  {[
                    { icon: "🌅", label: "Sunrise", value: formatTime(currentWeather.sys.sunrise) },
                    { icon: "🌇", label: "Sunset",  value: formatTime(currentWeather.sys.sunset)  },
                  ].map((item) => (
                    <div key={item.label} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <span style={{ fontSize: 22 }}>{item.icon}</span>
                      <div>
                        <p style={{ fontSize: 10, color: theme.textMuted, textTransform: "uppercase", letterSpacing: "1px", fontWeight: 600 }}>
                          {item.label}
                        </p>
                        <p style={{ fontSize: 16, color: theme.text, fontWeight: 500, marginTop: 2 }}>
                          {item.value}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            
              <div className="reveal-2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                {statTiles.map((tile) => (
                  <div key={tile.label} className="stat-chip">
                    <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 12 }}>
                      <span style={{ fontSize: 18 }}>{tile.icon}</span>
                      <span className="section-label">{tile.label}</span>
                    </div>
                    <div style={{
                      fontFamily: "'DM Serif Display', serif",
                      fontSize: "clamp(22px, 2.5vw, 30px)",
                      fontWeight: 400,
                      color: theme.text,
                    }}>
                      <AnimatedNumber value={tile.value} suffix={tile.suffix} />
                    </div>
                  </div>
                ))}

                
                <div className="stat-chip" style={{ gridColumn: "1 / -1" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                      <span style={{ fontSize: 18 }}>💨</span>
                      <span className="section-label">Wind Speed</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
                      <span style={{
                        fontFamily: "'DM Serif Display', serif",
                        fontSize: 26,
                        color: theme.text,
                      }}>
                        {currentWeather.wind.speed}
                      </span>
                      <span style={{ color: theme.textMuted, fontSize: 12 }}>m/s</span>
                      <span className="badge" style={{ marginLeft: 4 }}>
                        {getWindDirection(currentWeather.wind.deg)}
                      </span>
                    </div>
                  </div>
                  <div className="wind-bar-track">
                    <div
                      className="wind-bar-fill"
                      style={{ width: `${Math.min(currentWeather.wind.speed * 5, 100)}%` }}
                    />
                  </div>
                  {currentWeather.wind.gust && (
                    <p style={{ color: theme.textMuted, fontSize: 11, marginTop: 7 }}>
                      Gusts up to{" "}
                      <span style={{ color: theme.textSub }}>{currentWeather.wind.gust} m/s</span>
                    </p>
                  )}
                </div>
              </div>
            </div>

        
            {forecastDays.length > 0 && (
              <div className="card reveal-3" style={{ marginBottom: 14 }}>

     
                <div style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "18px 22px 14px",
                  borderBottom: `1px solid ${theme.divider}`,
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 18 }}>📅</span>
                    <span className="section-label">5-Day Forecast</span>
                  </div>
                  <span style={{ fontSize: 11, color: theme.textMuted }}>Click a day for full details</span>
                </div>

                
                <div style={{
                  display: "grid",
                  gridTemplateColumns: "100px 30px 1fr 58px 58px 24px",
                  gap: 10,
                  padding: "8px 20px 4px",
                  borderBottom: `1px solid ${theme.divider}`,
                }}>
                  {["Day", "", "Temp Range", "Low", "High", ""].map((header, i) => (
                    <span key={i} style={{
                      fontSize: 10,
                      color: theme.textMuted,
                      textTransform: "uppercase",
                      letterSpacing: "1px",
                      textAlign: i >= 3 ? "right" : "left",
                    }}>
                      {header}
                    </span>
                  ))}
                </div>

              
                {forecastDays.map((day, index) => {
                  const isExpanded = expandedDay === index;

                  return (
                    <div key={day.dt}>
                    
                      <div
                        className={`forecast-row${isExpanded ? " expanded" : ""}`}
                        onClick={() => setExpandedDay(isExpanded ? null : index)}
                        style={{ animation: `fadeUp 0.4s ease ${index * 0.06 + 0.1}s both` }}
                      >
                     
                        <div>
                          <p style={{ fontSize: 14, fontWeight: 600, color: theme.text }}>
                            {index === 0 ? "Tomorrow" : formatDay(day.dt)}
                          </p>
                          <p style={{ fontSize: 11, color: theme.textMuted, marginTop: 1 }}>
                            {formatDate(day.dt)}
                          </p>
                        </div>

                       
                        <span style={{ fontSize: 20, textAlign: "center" }}>
                          {WEATHER_ICONS[day.weather[0].icon] || "🌡️"}
                        </span>

                        <TempRangeBar
                          dayMin={convertTemp(day.temp.min)}
                          dayMax={convertTemp(day.temp.max)}
                          weekMin={weekMin}
                          weekMax={weekMax}
                          isDark={isDark}
                        />

                    
                        <p style={{ fontSize: 13, fontWeight: 500, color: theme.textSub, textAlign: "right" }}>
                          {convertTemp(day.temp.min)}{tempSymbol}
                        </p>

                    
                        <p style={{ fontSize: 14, fontWeight: 700, color: theme.text, textAlign: "right" }}>
                          {convertTemp(day.temp.max)}{tempSymbol}
                        </p>

                       
                        <span style={{
                          color: theme.textMuted,
                          fontSize: 12,
                          textAlign: "right",
                          display: "block",
                          transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)",
                          transition: "transform 0.3s ease",
                        }}>
                          ▾
                        </span>
                      </div>

                      
                      {isExpanded && (
                        <div className="day-details">
                          <div style={{ padding: "10px 20px 4px", display: "flex", alignItems: "center", gap: 10 }}>
                            <span style={{ fontSize: 26 }}>
                              {WEATHER_ICONS[day.weather[0].icon] || "🌡️"}
                            </span>
                            <div>
                              <p style={{ fontSize: 14, fontWeight: 600, color: theme.text, textTransform: "capitalize" }}>
                                {day.weather[0].description}
                              </p>
                              <p style={{ fontSize: 11, color: theme.textMuted }}>
                                {index === 0 ? "Tomorrow" : formatDay(day.dt)}, {formatDate(day.dt)}
                              </p>
                            </div>
                          </div>

                          <div className="detail-chips-grid">
                            {[
                              { icon: "🌡️", label: "Day",       value: `${convertTemp(day.temp.day)}${tempSymbol}` },
                              { icon: "🌙", label: "Night",     value: `${convertTemp(day.temp.night || day.temp.min)}${tempSymbol}` },
                              { icon: "🌄", label: "Morning",   value: `${convertTemp(day.temp.morn || day.temp.min + 1)}${tempSymbol}` },
                              { icon: "🌆", label: "Evening",   value: `${convertTemp(day.temp.eve || day.temp.max - 1)}${tempSymbol}` },
                              { icon: "💧", label: "Humidity",  value: `${day.humidity}%` },
                              { icon: "💨", label: "Wind",      value: `${day.wind_speed} m/s ${getWindDirection(day.wind_deg)}` },
                              { icon: "🌡️", label: "Pressure",  value: `${day.pressure} hPa` },
                              { icon: "🌧️", label: "Rain",      value: `${day.pop}%` },
                              { icon: "☁️", label: "Clouds",    value: `${day.clouds}%` },
                              { icon: "👁️", label: "Visibility",value: `${Math.round((day.visibility || 10000) / 100) / 10} km` },
                            ].map((detail, i) => (
                              <div
                                key={detail.label}
                                className="detail-chip"
                                style={{ animation: `slideFromLeft 0.25s ease ${i * 0.03}s both` }}
                              >
                                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
                                  <span style={{ fontSize: 14 }}>{detail.icon}</span>
                                  <span style={{
                                    fontSize: 10,
                                    color: theme.textMuted,
                                    textTransform: "uppercase",
                                    letterSpacing: "0.8px",
                                    fontWeight: 600,
                                  }}>
                                    {detail.label}
                                  </span>
                                </div>
                                <p style={{ fontSize: 16, fontWeight: 600, color: theme.text }}>
                                  {detail.value}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

           
            <div className="reveal-5" style={{ textAlign: "center", marginTop: 8 }}>
              <p style={{ color: theme.textMuted, fontSize: 11, letterSpacing: "1.5px", fontWeight: 500 }}>
               
              </p>
            </div>
          </>
        )}
      </main>
    </div>
  );
}