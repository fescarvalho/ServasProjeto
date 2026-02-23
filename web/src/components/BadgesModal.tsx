import { X, Flower } from "lucide-react";
import { theme } from "../theme/theme";

interface BadgesModalProps {
  count: number;
  onClose: () => void;
}

export function BadgesModal({ count, onClose }: BadgesModalProps) {
  let title = "Semente da Fé", icon = <Flower size={32} />, color = theme.colors.successLight, nextGoal = 5;

  if (count >= 5 && count < 15) {
    title = "Botão de Rosa";
    icon = <Flower size={32} fill={theme.colors.primaryLight} />;
    color = theme.colors.dangerLight;
    nextGoal = 15;
  } else if (count >= 15) {
    title = "Rosa de Amor";
    icon = <Flower size={32} fill={theme.colors.primary} stroke={theme.colors.secondary} />;
    color = theme.colors.dangerDark;
    nextGoal = 30;
  }

  const progress = Math.min(100, (count / nextGoal) * 100);

  return (
    <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.5)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
      <div style={{ background: "white", width: "100%", maxWidth: "350px", borderRadius: "20px", padding: "25px", position: "relative", boxShadow: "0 10px 25px rgba(0,0,0,0.2)", textAlign: "center" }}>
        <button onClick={onClose} style={{ position: "absolute", top: "15px", right: "15px", background: "none", border: "none", cursor: "pointer", color: theme.colors.textSecondary }}><X size={24} /></button>
        <h2 style={{ color: theme.colors.primary, marginBottom: "20px", fontSize: "1.2rem" }}>Meu Jardim Espiritual</h2>
        <div style={{ background: theme.colors.primary + "1A", width: "80px", height: "80px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 15px auto", color: color }}>{icon}</div>
        <h3 style={{ margin: "0 0 5px 0", color: theme.colors.textMain }}>{title}</h3>
        <p style={{ margin: "0 0 20px 0", color: theme.colors.textSecondary, fontSize: "0.9rem" }}>Você tem <strong>{count} presenças confirmadas</strong>.</p>
        <div style={{ background: theme.colors.background, height: "10px", borderRadius: "10px", overflow: "hidden", marginBottom: "8px" }}><div style={{ width: `${progress}%`, background: `linear-gradient(90deg, ${color}, ${theme.colors.primaryLight})`, height: "100%", borderRadius: "10px", transition: "width 0.5s ease" }} /></div>
        <p style={{ fontSize: "0.8rem", color: theme.colors.textMuted }}>Faltam {nextGoal - count} para o próximo nível!</p>
        <button onClick={onClose} style={{ marginTop: "20px", background: theme.colors.primary, color: "white", border: "none", padding: "10px 20px", borderRadius: "25px", fontWeight: "bold", width: "100%", cursor: "pointer" }}>Continuar Servindo</button>
      </div>
    </div>
  );
}