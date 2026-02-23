
import { Crown, Sparkles, X } from "lucide-react";
import { theme } from "../theme/theme";

interface WinnerModalProps {
    score: number;
    month: number;
    year: number;
    userName: string;
    onClose: () => void;
}

const MONTHS = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];

export function WinnerModal({ score, month, year, userName, onClose }: WinnerModalProps) {
    const monthName = MONTHS[month];

    return (
        <div
            style={{
                position: "fixed",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: "rgba(0,0,0,0.7)",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                zIndex: 9999,
                padding: "20px",
                backdropFilter: "blur(5px)",
            }}
        >
            <div
                style={{
                    background: `linear-gradient(135deg, ${theme.colors.warningLight} 0%, #fff 100%)`,
                    width: "100%",
                    maxWidth: "400px",
                    borderRadius: "24px",
                    padding: "30px",
                    position: "relative",
                    boxShadow: "0 10px 40px rgba(251, 192, 45, 0.3)",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    textAlign: "center",
                    border: `2px solid ${theme.colors.warning}`,
                    animation: "popIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)"
                }}
            >
                <button
                    onClick={onClose}
                    style={{
                        position: "absolute",
                        top: 15,
                        right: 15,
                        background: "rgba(0,0,0,0.05)",
                        border: "none",
                        borderRadius: "50%",
                        width: 32,
                        height: 32,
                        cursor: "pointer",
                        color: theme.colors.textSecondary,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        transition: "background 0.2s"
                    }}
                >
                    <X size={20} />
                </button>

                <div style={{ position: "relative", marginBottom: "15px" }}>
                    <Crown size={64} color={theme.colors.warningDark} fill={theme.colors.warning} />
                    <Sparkles
                        size={24}
                        color={theme.colors.primary}
                        style={{ position: "absolute", top: -10, right: -15, animation: "spin 3s linear infinite" }}
                    />
                </div>

                <h2 style={{ color: theme.colors.warningDark, margin: "0 0 10px 0", fontSize: "1.8rem", fontWeight: "900" }}>
                    Parabéns, {userName.split(" ")[0]}!
                </h2>

                <p style={{ color: theme.colors.textMain, fontSize: "1.1rem", lineHeight: "1.5", margin: "0 0 20px 0" }}>
                    Você foi a <strong>Serva Campeã</strong> do mês de <strong>{monthName} de {year}</strong>!
                </p>

                <div style={{
                    background: theme.colors.warning,
                    color: "white",
                    padding: "10px 20px",
                    borderRadius: "50px",
                    fontWeight: "bold",
                    fontSize: "1.2rem",
                    marginBottom: "25px",
                    boxShadow: `0 4px 15px ${theme.colors.warning}66`
                }}>
                    {score} Pontos Conquistados 🏆
                </div>

                <p style={{ color: theme.colors.textSecondary, fontSize: "0.9rem", margin: "0 0 25px 0" }}>
                    Obrigado por servir com tanta dedicação e amor neste mês. Continue brilhando! ✨
                </p>

                <button
                    onClick={onClose}
                    style={{
                        width: "100%",
                        padding: "14px",
                        borderRadius: "12px",
                        border: "none",
                        background: theme.colors.primaryGradient,
                        color: "white",
                        fontWeight: "bold",
                        fontSize: "1rem",
                        cursor: "pointer",
                        boxShadow: theme.colors.shadowPrimary,
                    }}
                >
                    Incrível!
                </button>

                <style>{`
          @keyframes popIn {
            0% { transform: scale(0.8); opacity: 0; }
            100% { transform: scale(1); opacity: 1; }
          }
          @keyframes spin {
            100% { transform: rotate(360deg); }
          }
        `}</style>
            </div>
        </div>
    );
}
