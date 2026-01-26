import { useState, useMemo } from "react";
import { Mass } from "../types/types";
import {
  X,
  Trophy,
  Medal,
  Calendar,
  Award,
  CheckCircle,
  AlertCircle,
  Star,
} from "lucide-react";

interface StatisticsModalProps {
  masses: Mass[];
  onClose: () => void;
}

// LÓGICA DE PONTUAÇÃO (Fuso Horário BR)
function getMassPoints(dateString: string) {
  const date = new Date(dateString);
  const brazilDateString = date.toLocaleString("en-US", {
    timeZone: "America/Sao_Paulo",
  });
  const brazilDate = new Date(brazilDateString);

  const day = brazilDate.getDay();
  const hour = brazilDate.getHours();

  if (day >= 1 && day <= 5) return 2; // Semana
  if (day === 0 && hour >= 9 && hour <= 11) return 2; // Dom 10h
  return 1; // Resto
}

export function StatisticsModal({ masses, onClose }: StatisticsModalProps) {
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
    const stats: Record<
      string,
      {
        name: string;
        totalEscalas: number;
        totalPresencas: number;
        score: number;
        roles: Record<string, number>;
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
        if (!stats[signup.userId]) {
          stats[signup.userId] = {
            name: signup.user.name,
            totalEscalas: 0,
            totalPresencas: 0,
            score: 0,
            roles: {},
          };
        }

        stats[signup.userId].totalEscalas += 1;

        if (signup.present) {
          stats[signup.userId].totalPresencas += 1;
          stats[signup.userId].score += points;
        }

        // CORREÇÃO AQUI: Se vazio, vira "Auxiliar"
        const role = signup.role || "Auxiliar";
        stats[signup.userId].roles[role] = (stats[signup.userId].roles[role] || 0) + 1;
      });
    });

    return Object.values(stats).sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      if (b.totalPresencas !== a.totalPresencas)
        return b.totalPresencas - a.totalPresencas;
      return b.totalEscalas - a.totalEscalas;
    });
  }, [masses, selectedMonth, selectedYear]);

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0,0,0,0.5)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 1000,
      }}
    >
      <div
        style={{
          backgroundColor: "white",
          width: "95%",
          maxWidth: "600px",
          borderRadius: "12px",
          padding: "20px",
          position: "relative",
          maxHeight: "90vh",
          overflowY: "auto",
          boxShadow: "0 10px 25px rgba(0,0,0,0.2)",
        }}
      >
        <button
          onClick={onClose}
          style={{
            position: "absolute",
            top: 15,
            right: 15,
            background: "none",
            border: "none",
            cursor: "pointer",
            color: "#666",
          }}
        >
          <X size={24} />
        </button>

        <div style={{ textAlign: "center", marginBottom: "20px" }}>
          <div
            style={{
              display: "inline-flex",
              padding: "10px",
              background: "#fce4ec",
              borderRadius: "50%",
              color: "#e91e63",
              marginBottom: "10px",
            }}
          >
            <Award size={32} />
          </div>
          <h2 style={{ margin: 0, color: "#333", fontSize: "1.5rem" }}>Ranking Mensal</h2>
          <p style={{ color: "#666", fontSize: "0.9rem" }}>
            Semana/Dom 10h = <strong>2 pts</strong> • Outros = <strong>1 pt</strong>
          </p>
        </div>

        <div
          style={{
            display: "flex",
            gap: "10px",
            marginBottom: "20px",
            justifyContent: "center",
          }}
        >
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(Number(e.target.value))}
            style={{
              padding: "8px",
              borderRadius: "6px",
              border: "1px solid #ddd",
              fontSize: "1rem",
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
              padding: "8px",
              borderRadius: "6px",
              border: "1px solid #ddd",
              fontSize: "1rem",
            }}
          >
            <option value={2025}>2025</option>
            <option value={2026}>2026</option>
          </select>
        </div>

        {ranking.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: "40px",
              color: "#999",
              border: "2px dashed #eee",
              borderRadius: "8px",
            }}
          >
            <Calendar size={40} style={{ opacity: 0.3, marginBottom: 10 }} />
            <p>Nenhuma atividade registrada neste período.</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {ranking.map((serva, index) => {
              let icon = (
                <span
                  style={{
                    fontWeight: "bold",
                    color: "#999",
                    width: "24px",
                    textAlign: "center",
                    fontSize: "0.9rem",
                  }}
                >
                  {index + 1}º
                </span>
              );
              let borderColor = "#eee";

              if (index === 0) {
                icon = <Trophy size={20} color="#FFD700" fill="#FFD700" />;
                borderColor = "#FFD700";
              } else if (index === 1) {
                icon = <Medal size={20} color="#C0C0C0" fill="#C0C0C0" />;
                borderColor = "#C0C0C0";
              } else if (index === 2) {
                icon = <Medal size={20} color="#CD7F32" fill="#CD7F32" />;
                borderColor = "#CD7F32";
              }

              return (
                <div
                  key={index}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    padding: "12px",
                    borderRadius: "8px",
                    backgroundColor: "#fff",
                    border: `1px solid ${borderColor}`,
                    boxShadow: "0 2px 5px rgba(0,0,0,0.03)",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      marginBottom: "8px",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      {icon}
                      <span
                        style={{ fontWeight: "bold", color: "#333", fontSize: "1rem" }}
                      >
                        {serva.name}
                      </span>
                    </div>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                        background: "#fff8e1",
                        color: "#f57f17",
                        padding: "4px 10px",
                        borderRadius: "20px",
                        fontSize: "0.9rem",
                        fontWeight: "bold",
                        border: "1px solid #ffe082",
                      }}
                    >
                      <Star size={14} fill="#f57f17" />
                      {serva.score} pts
                    </div>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      gap: "15px",
                      marginBottom: "8px",
                      paddingLeft: "34px",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                        fontSize: "0.85rem",
                        color: "#2e7d32",
                      }}
                    >
                      <CheckCircle size={14} />
                      <strong>{serva.totalPresencas}</strong>{" "}
                      <span style={{ opacity: 0.7 }}>Presenças</span>
                    </div>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                        fontSize: "0.85rem",
                        color: "#666",
                      }}
                    >
                      <AlertCircle size={14} />
                      <strong>{serva.totalEscalas}</strong>{" "}
                      <span style={{ opacity: 0.7 }}>Escalas</span>
                    </div>
                  </div>

                  <div
                    style={{
                      fontSize: "0.75rem",
                      color: "#999",
                      paddingLeft: "34px",
                      borderTop: "1px solid #f5f5f5",
                      paddingTop: "5px",
                    }}
                  >
                    {/* Agora deve aparecer "Auxiliar (X)" em vez de "Sem função" */}
                    {Object.entries(serva.roles)
                      .map(([role, count]) => `${role} (${count})`)
                      .join(" • ")}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
