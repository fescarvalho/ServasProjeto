import { X, Shield, Award, Crown } from "lucide-react";
import { theme } from "../theme/theme";

interface BadgesModalProps {
  count: number;
  onClose: () => void;
}

export function BadgesModal({ count, onClose }: BadgesModalProps) {
  let title = "Iniciante do Altar";
  let icon = <Shield size={32} />;
  let color = theme.colors.success;
  let nextGoal = 5;

  if (count >= 5 && count < 15) {
    title = "Servo(a) Fiel";
    icon = <Award size={32} />;
    color = theme.colors.secondary;
    nextGoal = 15;
  } else if (count >= 15) {
    title = "Guardião(ã) do Altar";
    icon = <Crown size={32} />;
    color = theme.colors.primary;
    nextGoal = 30;
  }

  const progress = Math.min(100, (count / nextGoal) * 100);

  return (
    <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.6)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px", backdropFilter: "blur(3px)" }}>
      <div style={{ background: "white", width: "100%", maxWidth: "360px", borderRadius: "14px", padding: "28px 24px", position: "relative", boxShadow: "0 12px 30px rgba(0,0,0,0.25)", textAlign: "center", border: `1px solid ${theme.colors.borderLight}` }}>
        <button onClick={onClose} style={{ position: "absolute", top: "14px", right: "14px", background: "none", border: "none", cursor: "pointer", color: theme.colors.textSecondary }}><X size={22} /></button>
        <h2 style={{ color: theme.colors.primary, marginBottom: "18px", fontSize: "1.15rem", letterSpacing: "0.5px" }}>MINHAS CONQUISTAS</h2>
        <div style={{ background: "rgba(74, 50, 34, 0.08)", border: `1px solid ${theme.colors.border}`, width: "76px", height: "76px", borderRadius: "14px", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px auto", color: color }}>{icon}</div>
        <h3 style={{ margin: "0 0 6px 0", color: theme.colors.textMain, fontSize: "1.1rem" }}>{title}</h3>
        <p style={{ margin: "0 0 20px 0", color: theme.colors.textSecondary, fontSize: "0.9rem" }}>Você possui <strong>{count} presenças confirmadas</strong>.</p>
        <div style={{ background: theme.colors.backgroundLight, height: "10px", borderRadius: "6px", overflow: "hidden", marginBottom: "10px" }}>
          <div style={{ width: `${progress}%`, background: theme.colors.primaryGradient, height: "100%", borderRadius: "6px", transition: "width 0.5s ease" }} />
        </div>
        <p style={{ fontSize: "0.8rem", color: theme.colors.textMuted }}>Faltam {Math.max(0, nextGoal - count)} presenças para o próximo nível</p>
        <button onClick={onClose} style={{ marginTop: "20px", background: theme.colors.primaryGradient, color: "white", border: "none", padding: "12px 20px", borderRadius: "8px", fontWeight: "bold", width: "100%", cursor: "pointer" }}>Continuar Servindo</button>
      </div>
    </div>
  );
}
