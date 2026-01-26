import { useState, useMemo } from "react";
import { Mass } from "../types/types";
import { X, Trophy, Medal, Calendar, Crown, Info } from "lucide-react";

interface RankingModalProps {
  masses: Mass[];
  onClose: () => void;
}

// --- LÓGICA DE PONTUAÇÃO ---
function getMassPoints(dateString: string) {
  const date = new Date(dateString);
  const brazilDateString = date.toLocaleString("en-US", {
    timeZone: "America/Sao_Paulo",
  });
  const brazilDate = new Date(brazilDateString);

  const day = brazilDate.getDay();
  const hour = brazilDate.getHours();

  // 1. Semana (Segunda a Sexta) = 2 PONTOS
  if (day >= 1 && day <= 5) return 2;

  // 2. Domingo entre 9h e 11h = 2 PONTOS
  if (day === 0 && hour >= 9 && hour <= 11) return 2;

  // 3. Resto = 1 PONTO
  return 1;
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
    // Agora guardamos contagens separadas
    const stats: Record<
      string,
      {
        name: string;
        score: number;
        countSpecial: number; // Semana ou Dom 10h (2pts)
        countNormal: number; // Outras (1pt)
      }
    > = {};

    const filteredMasses = masses.filter((m) => {
      const d = new Date(m.date);
      const brDate = new Date(
        d.toLocaleString("en-US", { timeZone: "America/Sao_Paulo" }),
      );
      return brDate.getMonth() === selectedMonth && brDate.getFullYear() === selectedYear;
    });

    filteredMasses.forEach((mass) => {
      const points = getMassPoints(mass.date);

      mass.signups.forEach((signup) => {
        if (signup.present) {
          if (!stats[signup.userId]) {
            stats[signup.userId] = {
              name: signup.user.name,
              score: 0,
              countSpecial: 0,
              countNormal: 0,
            };
          }

          // Soma Pontos Totais
          stats[signup.userId].score += points;

          // Separa a contagem para exibir detalhes
          if (points === 2) {
            stats[signup.userId].countSpecial += 1;
          } else {
            stats[signup.userId].countNormal += 1;
          }
        }
      });
    });

    return Object.values(stats).sort((a, b) => b.score - a.score);
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
          backgroundColor: "#f5f5f5",
          width: "90%",
          maxWidth: "450px",
          borderRadius: "20px",
          padding: "0",
          position: "relative",
          maxHeight: "85vh",
          overflowY: "auto",
          boxShadow: "0 20px 50px rgba(0,0,0,0.3)",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* HEADER ROSA */}
        <div
          style={{
            background: "linear-gradient(135deg, #e91e63 0%, #ff4081 100%)",
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
              color: "#e91e63",
              backgroundColor: "white",
              boxShadow: "0 4px 10px rgba(0,0,0,0.1)",
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
              color: "#e91e63",
              backgroundColor: "white",
              boxShadow: "0 4px 10px rgba(0,0,0,0.1)",
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
                let scoreColor = "#e91e63";

                if (index === 0) {
                  cardStyle = {
                    ...cardStyle,
                    background: "linear-gradient(to right, #fffde7, #fff)",
                    border: "1px solid #fbc02d",
                  };
                  scoreColor = "#f57f17";
                  rankBadge = <Trophy size={24} color="#fbc02d" fill="#fbc02d" />;
                } else if (index === 1) {
                  scoreColor = "#757575";
                  rankBadge = <Medal size={24} color="#9e9e9e" fill="#e0e0e0" />;
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
                            index === 0 ? "rgba(251, 192, 45, 0.15)" : "#fce4ec",
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
                              color: "#e91e628c",
                              fontWeight: "600",
                            }}
                          >
                            {serva.countSpecial}x dia de semana / dom 10:15h
                          </span>
                        )}

                        {serva.countNormal > 0 && (
                          <span style={{ fontSize: "0.7rem", color: "#999" }}>
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
