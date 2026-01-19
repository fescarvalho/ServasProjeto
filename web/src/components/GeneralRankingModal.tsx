import { X, Trophy, Flower } from "lucide-react";
import { Mass } from "../types/types";

interface RankingModalProps {
  masses: Mass[];
  onClose: () => void;
}

export function GeneralRankingModal({ masses, onClose }: RankingModalProps) {
  const scores: Record<string, number> = {};
  
  masses.forEach(mass => {
    mass.signups.forEach(signup => {
      if (signup.present) {
        // @ts-ignore
        const name = signup.user?.name || "Serva Desconhecida";
        scores[name] = (scores[name] || 0) + 1;
      }
    });
  });

  const ranking = Object.entries(scores)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);

  const getBadge = (count: number) => {
    if (count >= 15) return { icon: <Flower size={20} fill="#e91e63" stroke="#880e4f" />, name: "Rosa de Amor", color: "#fce4ec", border: "#c2185b" };
    if (count >= 5) return { icon: <Flower size={20} fill="#f48fb1" />, name: "Botão de Rosa", color: "#fff0f5", border: "#ec407a" };
    return { icon: <Flower size={20} />, name: "Semente da Fé", color: "#e8f5e9", border: "#81c784" };
  };

  return (
    <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.6)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
      <div style={{ background: "white", width: "100%", maxWidth: "450px", borderRadius: "20px", padding: "25px", position: "relative", boxShadow: "0 10px 25px rgba(0,0,0,0.3)", maxHeight: "85vh", overflowY: "auto" }}>
        <button onClick={onClose} style={{ position: "absolute", top: "15px", right: "15px", background: "none", border: "none", cursor: "pointer", color: "#666" }}><X size={24} /></button>
        <div style={{ textAlign: "center", marginBottom: "20px" }}>
          <div style={{ background: "#fff8e1", width: "60px", height: "60px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 10px auto", color: "#fbc02d" }}><Trophy size={32} /></div>
          <h2 style={{ color: "#333", margin: 0 }}>Ranking Geral</h2>
          <p style={{ color: "#666", fontSize: "0.9rem" }}>Total acumulado de presenças</p>
        </div>
        {ranking.length === 0 ? <div style={{ textAlign: "center", color: "#999", padding: "20px" }}>Nenhuma presença confirmada ainda.</div> : (
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {ranking.map((item, index) => {
              const badge = getBadge(item.count);
              return (
                <div key={item.name} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "white", border: `1px solid #eee`, padding: "10px 15px", borderRadius: "12px", boxShadow: "0 2px 5px rgba(0,0,0,0.02)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <span style={{ fontWeight: "bold", color: "#999", minWidth: "20px" }}>{index + 1}º</span>
                    <div>
                      <div style={{ fontWeight: "bold", color: "#333" }}>{item.name}</div>
                      <div style={{ fontSize: "0.75rem", display: "flex", alignItems: "center", gap: "4px", color: badge.border }}>{badge.icon} {badge.name}</div>
                    </div>
                  </div>
                  <div style={{ background: badge.color, color: badge.border, fontWeight: "bold", padding: "5px 10px", borderRadius: "20px", fontSize: "0.9rem" }}>{item.count}</div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}