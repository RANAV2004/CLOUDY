import { useState, useEffect, useRef } from "react";

export default function AnimatedNumber({ value, suffix = "" }) {
  const [displayed, setDisplayed] = useState(value);
  const prev = useRef(value);

  useEffect(() => {
    const start = prev.current;
    const diff = value - start;
    if (!diff) return;

    let step = 0;
    const total = 30;

    const timer = setInterval(() => {
      step++;
      const current = start + (diff * step) / total;
      setDisplayed(parseFloat(current.toFixed(1)));
      if (step >= total) {
        clearInterval(timer);
        prev.current = value;
      }
    }, 16);

    return () => clearInterval(timer);
  }, [value]);

  return <>{displayed}{suffix}</>;
}
