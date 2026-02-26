import { useState, useMemo } from "react";
import { Mass } from "../types/types";
import { X, BarChart2, Calendar } from "lucide-react";

interface StatisticsModalProps {
  masses: Mass[];
  onClose: () => void;
}

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

  const stats = useMemo(() => {
    const data: Record<
      string,
      {
        name: string;
        presencas: number;
        faltas: number;
        escalas: number;
        score: number;
        roles: Record<string, number>;
      }
    > = {};

    const hoje = new Date();

    const filteredMasses = masses.filter((m) => {
      const d = new Date(m.date);
      const brDate = new Date(
        d.toLocaleString("en-US", { timeZone: "America/Sao_Paulo" }),
      );
      return brDate.getMonth() === selectedMonth && brDate.getFullYear() === selectedYear;
    });

    filteredMasses.forEach((mass) => {
      const massDate = new Date(mass.date);
      const isPast = massDate < hoje;
      const points = getMassPoints(mass.date);

      mass.signups.forEach((signup) => {
        if ((signup as any).status === "RESERVA") return;

        if (!data[signup.userId]) {
          data[signup.userId] = {
            name: signup.user.name,
            presencas: 0,
            faltas: 0,
            escalas: 0,
            score: 0,
            roles: {},
          };
        }

        data[signup.userId].escalas += 1;

        if (signup.present) {
          data[signup.userId].presencas += 1;
          data[signup.userId].score += points;
          const role = signup.role || "Auxiliar";
          data[signup.userId].roles[role] = (data[signup.userId].roles[role] || 0) + 1;
        } else if (isPast) {
          data[signup.userId].faltas += 1;
        }
      });
    });

    return Object.values(data);
  }, [masses, selectedMonth, selectedYear]);

  const sortedData = useMemo(() => {
    return [...stats].sort((a, b) => a.name.localeCompare(b.name));
  }, [stats]);

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
          backgroundColor: "#fff",
          width: "98%",
          maxWidth: "800px",
          borderRadius: "16px",
          padding: "0",
          position: "relative",
          maxHeight: "90vh",
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 20px 50px rgba(0,0,0,0.3)",
        }}
      >
        {/* HEADER */}
        <div
          style={{
            padding: "15px 15px 15px 15px",
            background: "#f8f9fa",
            borderTopLeftRadius: "16px",
            borderTopRightRadius: "16px",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <div
                style={{
                  background: "#e3f2fd",
                  padding: "8px",
                  borderRadius: "8px",
                  color: "#1565c0",
                }}
              >
                <BarChart2 size={20} />
              </div>
              <h2 style={{ margin: 0, fontSize: "1.1rem", color: "#333" }}>
                Relatório de Assiduidade
              </h2>
            </div>
            <button
              onClick={onClose}
              style={{
                background: "transparent",
                border: "none",
                cursor: "pointer",
                color: "#999",
              }}
            >
              <X size={24} />
            </button>
          </div>
        </div>

        {/* FILTROS */}
        <div
          style={{
            padding: "10px 15px",
            background: "#fff",
            borderBottom: "1px solid #eee",
            display: "flex",
            gap: "8px",
          }}
        >
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(Number(e.target.value))}
            style={{
              padding: "6px",
              borderRadius: "6px",
              border: "1px solid #ddd",
              flex: 1,
              fontSize: "0.85rem",
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
              padding: "6px",
              borderRadius: "6px",
              border: "1px solid #ddd",
              width: "80px",
              fontSize: "0.85rem",
            }}
          >
            <option value={2025}>2025</option>
            <option value={2026}>2026</option>
          </select>
        </div>

        {/* CONTEÚDO */}
        <div style={{ flex: 1, overflowY: "auto", padding: "0" }}>
          {sortedData.length === 0 ? (
            <div style={{ textAlign: "center", color: "#999", padding: "40px 20px" }}>
              <Calendar size={40} style={{ opacity: 0.2, marginBottom: 10 }} />
              <p>Sem dados para este mês.</p>
            </div>
          ) : (
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                minWidth: "320px",
                tableLayout: "fixed",
              }}
            >
              <thead
                style={{ position: "sticky", top: 0, background: "#fff", zIndex: 10 }}
              >
                <tr style={{ borderBottom: "2px solid #f0f0f0", textAlign: "left" }}>
                  <th
                    style={{
                      padding: "10px",
                      color: "#666",
                      fontSize: "0.7rem",
                      textTransform: "uppercase",
                      width: "40%",
                    }}
                  >
                    Serva
                  </th>
                  <th
                    style={{
                      padding: "10px 5px",
                      textAlign: "center",
                      color: "#666",
                      fontSize: "0.7rem",
                      textTransform: "uppercase",
                      width: "15%",
                    }}
                  >
                    Esc.
                  </th>
                  <th
                    style={{
                      padding: "10px 5px",
                      textAlign: "center",
                      color: "#2e7d32",
                      fontSize: "0.7rem",
                      textTransform: "uppercase",
                      width: "15%",
                    }}
                  >
                    Pres.
                  </th>
                  <th
                    style={{
                      padding: "10px 5px",
                      textAlign: "center",
                      color: "#c62828",
                      fontSize: "0.7rem",
                      textTransform: "uppercase",
                      width: "15%",
                    }}
                  >
                    Falt.
                  </th>
                  <th
                    style={{
                      padding: "10px",
                      textAlign: "right",
                      color: "#666",
                      fontSize: "0.7rem",
                      textTransform: "uppercase",
                      width: "15%",
                    }}
                  >
                    %
                  </th>
                </tr>
              </thead>
              <tbody>
                {sortedData.map((s, i) => {
                  const totalRealizadas = s.presencas + s.faltas;
                  const percent =
                    totalRealizadas > 0
                      ? Math.round((s.presencas / totalRealizadas) * 100)
                      : 100;
                  const color =
                    percent < 50 ? "#f44336" : percent < 80 ? "#ff9800" : "#4caf50";

                  return (
                    <tr key={i} style={{ borderBottom: "1px solid #f9f9f9" }}>
                      <td
                        style={{
                          padding: "10px",
                          fontWeight: "600",
                          color: "#333",
                          fontSize: "0.85rem",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {s.name}
                      </td>
                      <td style={{ textAlign: "center", fontSize: "0.85rem" }}>
                        {s.escalas}
                      </td>
                      <td
                        style={{
                          textAlign: "center",
                          color: "#2e7d32",
                          fontWeight: "bold",
                          fontSize: "0.85rem",
                        }}
                      >
                        {s.presencas}
                      </td>
                      <td
                        style={{
                          textAlign: "center",
                          color: "#c62828",
                          fontWeight: "bold",
                          fontSize: "0.85rem",
                        }}
                      >
                        {s.faltas}
                      </td>
                      <td
                        style={{
                          padding: "10px",
                          textAlign: "right",
                          fontWeight: "bold",
                          fontSize: "0.85rem",
                          color: color,
                        }}
                      >
                        {percent}%
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
