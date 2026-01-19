import { X } from "lucide-react";
import { Mass } from "../types/types";

interface RankingModalProps {
  masses: Mass[];
  onClose: () => void;
}

export function RankingModal({ masses, onClose }: RankingModalProps) {
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  const monthName = now.toLocaleString('pt-BR', { month: 'long' });

  const monthlyMasses = masses.filter(m => {
    const d = new Date(m.date);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  });

  const scores: Record<string, number> = {};
  monthlyMasses.forEach(mass => {
    mass.signups.forEach(signup => {
      // @ts-ignore
      const name = signup.user?.name || "Serva";
      if (signup.present) scores[name] = (scores[name] || 0) + 1;
    });
  });

  const ranking = Object.entries(scores)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);

  return (
    <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.6)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
      <div style={{ background: "white", width: "100%", maxWidth: "350px", borderRadius: "20px", padding: "25px", position: "relative", boxShadow: "0 10px 25px rgba(0,0,0,0.3)", textAlign: "center", maxHeight: "80vh", overflowY: "auto" }}>
        <button onClick={onClose} style={{ position: "absolute", top: "15px", right: "15px", background: "none", border: "none", cursor: "pointer", color: "#666" }}><X size={24} /></button>
        <h2 style={{ color: "#e91e63", marginBottom: "5px", fontSize: "1.4rem" }}>Placar Mensal</h2>
        <p style={{ textTransform: "capitalize", color: "#666", marginBottom: "20px" }}>{monthName} de {currentYear}</p>
        {ranking.length === 0 ? <div style={{ padding: "30px 0", color: "#999", fontStyle: "italic" }}>Nenhuma presença confirmada.<br/>Seja a primeira!</div> : 
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {ranking.map((item, index) => (
              <div key={item.name} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: index === 0 ? "#fff9c4" : "#f5f5f5", padding: "12px 15px", borderRadius: "12px", border: index === 0 ? "1px solid #fbc02d" : "1px solid transparent" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}><span style={{ fontSize: "1.2rem" }}>{index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : `${index+1}º`}</span><span style={{ color: "#333", fontWeight: index === 0 ? "bold" : "normal" }}>{item.name}</span></div>
                <div style={{ fontWeight: "bold", color: "#e91e63" }}>{item.count} <span style={{ fontSize: "0.7rem", fontWeight: "normal" }}>x</span></div>
              </div>
            ))}
          </div>
        }
      </div>
    </div>
  );
}