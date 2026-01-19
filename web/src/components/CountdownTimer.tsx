import { useState, useEffect } from "react";
import { Clock } from "lucide-react";

// Helper exportado para ser usado em outros lugares
export const getAdjustedDeadline = (deadlineString: string) => {
  const cleanDate = deadlineString.endsWith("Z") ? deadlineString.slice(0, -1) : deadlineString;
  const date = new Date(cleanDate);
  if (date.getHours() === 0 && date.getMinutes() === 0) {
    date.setHours(23, 59, 59, 999);
  }
  return date;
};

export function CountdownTimer({ deadline }: { deadline: string }) {
  const [timeLeft, setTimeLeft] = useState("");

  useEffect(() => {
    const calculateTime = () => {
      const now = new Date();
      const deadlineDate = getAdjustedDeadline(deadline);
      const distance = deadlineDate.getTime() - now.getTime();
      if (distance < 0) {
        setTimeLeft("ENCERRADO");
      } else {
        const days = Math.floor(distance / (1000 * 60 * 60 * 24));
        const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        if (days > 0) setTimeLeft(`${days}d ${hours}h`);
        else setTimeLeft(`${hours}h ${minutes}m`);
      }
    };
    calculateTime();
    const interval = setInterval(calculateTime, 1000 * 60);
    return () => clearInterval(interval);
  }, [deadline]);

  if (timeLeft === "ENCERRADO") return null;

  return (
    <div style={{ position: "absolute", top: 15, right: 15, background: "#fff0f5", color: "#d81b60", fontSize: "0.7rem", fontWeight: "bold", padding: "4px 8px", borderRadius: "8px", display: "flex", alignItems: "center", gap: "4px" }}>
      <Clock size={12} /> {timeLeft}
    </div>
  );
}