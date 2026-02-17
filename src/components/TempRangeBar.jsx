export default function TempRangeBar({ dayMin, dayMax, weekMin, weekMax }) {
  const range = weekMax - weekMin || 1;
  const left = ((dayMin - weekMin) / range) * 100;
  const width = Math.max(((dayMax - dayMin) / range) * 100, 6);

  return (
    <div style={{ position:"relative", height:5, background:"#ddd", borderRadius:3, flex:1 }}>
      <div style={{
        position:"absolute",
        left:`${left}%`,
        width:`${width}%`,
        height:"100%",
        background:"#78909c",
        borderRadius:3
      }} />
    </div>
  );
}
