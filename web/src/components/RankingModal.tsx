import { useState, useMemo } from "react";
import { Mass } from "../types/types";
import { X, Trophy, Medal, Calendar, Crown, Info } from "lucide-react";
import { theme } from "../theme/theme";
import { calculateRanking } from "../utils/ranking.utils";

interface RankingModalProps {
  masses: Mass[];
  onClose: () => void;
}

export function RankingModal({ masses, onClose }: RankingModalProps) {
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const months = [
    "Janeiro",
    "Fevereiro",
    "Março",
    "Abril",
    "Maio",
    "Junho",
    "Julho",
    "Agosto",
    "Setembro",
    "Outubro",
    "Novembro",
    "Dezembro",
  ];

  const ranking = useMemo(() => {
    return calculateRanking(masses, selectedMonth, selectedYear);
  }, [masses, selectedMonth, selectedYear]);

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0,0,0,0.6)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 1000,
        backdropFilter: "blur(3px)",
      }}
    >
      <div
        style={{
          backgroundColor: theme.colors.background,
          width: "90%",
          maxWidth: "450px",
          borderRadius: "20px",
          padding: "0",
          position: "relative",
          maxHeight: "85vh",
          overflowY: "auto",
          boxShadow: theme.colors.shadowBase,
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* HEADER ROSA */}
        <div
          style={{
            background: theme.colors.primaryGradient,
            padding: "25px 20px 50px 20px",
            color: "white",
            textAlign: "center",
            borderTopLeftRadius: "20px",
            borderTopRightRadius: "20px",
            position: "relative",
            zIndex: 1,
          }}
        >
          <button
            onClick={onClose}
            style={{
              position: "absolute",
              top: 15,
              right: 15,
              background: "rgba(255,255,255,0.2)",
              border: "none",
              borderRadius: "50%",
              width: 32,
              height: 32,
              cursor: "pointer",
              color: "white",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <X size={20} />
          </button>

          <Crown
            size={36}
            fill="rgba(255,255,255,0.2)"
            stroke="#fff"
            strokeWidth={1.5}
            style={{ marginBottom: 8 }}
          />

          <h2
            style={{
              margin: 0,
              fontSize: "1.6rem",
              fontWeight: "800",
              letterSpacing: "-0.5px",
              color: "#fff",
            }}
          >
            Ranking das Servas
          </h2>

          {/* LEGENDA */}
          <div
            style={{
              marginTop: "12px",
              background: "rgba(0,0,0,0.15)",
              borderRadius: "12px",
              padding: "8px 12px",
              fontSize: "0.8rem",
              color: "#fff",
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <Info size={14} />
            <span>
              <strong>Dias de semana ou Dom (10:15h) = 2 pts • Outros = 1 pt</strong>
            </span>
          </div>
        </div>

        {/* FILTROS FLUTUANTES */}
        <div
          style={{
            marginTop: "-25px",
            display: "flex",
            gap: "10px",
            justifyContent: "center",
            padding: "0 20px",
            marginBottom: "15px",
            position: "relative",
            zIndex: 10,
          }}
        >
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(Number(e.target.value))}
            style={{
              padding: "8px 15px",
              borderRadius: "20px",
              border: "none",
              fontSize: "0.9rem",
              fontWeight: "bold",
              color: theme.colors.primary,
              backgroundColor: "white",
              boxShadow: theme.colors.shadowBase,
              flex: 1,
              cursor: "pointer",
              outline: "none",
            }}
          >
            {months.map((m, index) => (
              <option key={index} value={index}>
                {m}
              </option>
            ))}
          </select>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            style={{
              padding: "8px 15px",
              borderRadius: "20px",
              border: "none",
              fontSize: "0.9rem",
              fontWeight: "bold",
              color: theme.colors.primary,
              backgroundColor: "white",
              boxShadow: theme.colors.shadowBase,
              width: "80px",
              cursor: "pointer",
              outline: "none",
            }}
          >
            <option value={2025}>2025</option>
            <option value={2026}>2026</option>
          </select>
        </div>

        {/* CONTEÚDO LISTA */}
        <div style={{ padding: "0 20px 20px 20px" }}>
          {ranking.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px 20px", color: "#aaa" }}>
              <Calendar
                size={48}
                strokeWidth={1}
                style={{ opacity: 0.3, marginBottom: 10 }}
              />
              <p>Nenhuma pontuação registrada neste mês ainda.</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {ranking.map((serva, index) => {
                // ESTILOS DO PODIUM
                let cardStyle: React.CSSProperties = {
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "15px",
                  borderRadius: "16px",
                  backgroundColor: "#fff",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
                  border: "1px solid #fff",
                  position: "relative",
                  minHeight: "50px",
                };

                let rankBadge;
                let scoreColor = theme.colors.primary;

                if (index === 0) {
                  cardStyle = {
                    ...cardStyle,
                    background: `linear-gradient(to right, ${theme.colors.warningLight}, #fff)`,
                    border: `1px solid ${theme.colors.warning}`,
                  };
                  scoreColor = theme.colors.warningDark;
                  rankBadge = <Trophy size={24} color={theme.colors.warning} fill={theme.colors.warning} />;
                } else if (index === 1) {
                  scoreColor = theme.colors.textSecondary;
                  rankBadge = <Medal size={24} color={theme.colors.textMuted} fill="#e0e0e0" />;
                } else if (index === 2) {
                  scoreColor = "#8d6e63";
                  rankBadge = <Medal size={24} color="#8d6e63" fill="#d7ccc8" />;
                } else {
                  rankBadge = (
                    <span
                      style={{
                        fontWeight: "bold",
                        color: "#ccc",
                        width: "24px",
                        textAlign: "center",
                      }}
                    >
                      {index + 1}º
                    </span>
                  );
                }

                return (
                  <div key={index} style={cardStyle}>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                      <div
                        style={{
                          width: "30px",
                          display: "flex",
                          justifyContent: "center",
                        }}
                      >
                        {rankBadge}
                      </div>
                      <div>
                        {/* NOME LIMPO */}
                        <span
                          style={{
                            fontWeight: "700",
                            color: "#333",
                            fontSize: "1rem",
                            display: "block",
                          }}
                        >
                          {serva.name}
                        </span>
                      </div>
                    </div>

                    {/* COLUNA DA DIREITA: PONTOS + DETALHAMENTO */}
                    <div style={{ textAlign: "right", minWidth: "90px" }}>
                      {/* Pontuação Total */}
                      <div
                        style={{
                          background:
                            index === 0 ? "rgba(251, 192, 45, 0.15)" : theme.colors.primary + "1A", // 10% opacity
                          color: scoreColor,
                          padding: "4px 10px",
                          borderRadius: "20px",
                          fontWeight: "800",
                          fontSize: "1rem",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "4px",
                          justifyContent: "center",
                        }}
                      >
                        {serva.score}{" "}
                        <span style={{ fontSize: "0.6rem", textTransform: "uppercase" }}>
                          PTS
                        </span>
                      </div>

                      {/* Detalhamento das Missas */}
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: "2px",
                          marginTop: "6px",
                        }}
                      >
                        {serva.countSpecial > 0 && (
                          <span
                            style={{
                              fontSize: "0.7rem",
                              color: theme.colors.primary + "8C", // Semi-transparent primary
                              fontWeight: "600",
                            }}
                          >
                            {serva.countSpecial}x dia de semana / dom 10:15h
                          </span>
                        )}

                        {serva.countNormal > 0 && (
                          <span style={{ fontSize: "0.7rem", color: theme.colors.textMuted }}>
                            {serva.countNormal}x outros
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
