import { useState, useMemo } from "react";
import { Mass } from "../types/types";
import {
  X,
  BarChart2,
  CheckCircle,
  AlertCircle,
  Calendar,
  User,
  Minus,
  Star,
  Briefcase,
  Trophy,
  Medal,
  LayoutList,
  ListOrdered
} from "lucide-react";

interface StatisticsModalProps {
  masses: Mass[];
  onClose: () => void;
}

// --- LÓGICA DE PONTUAÇÃO ---
function getMassPoints(dateString: string) {
  const date = new Date(dateString);
  const brazilDateString = date.toLocaleString("en-US", { timeZone: "America/Sao_Paulo" });
  const brazilDate = new Date(brazilDateString);
  const day = brazilDate.getDay();
  const hour = brazilDate.getHours();

  if (day >= 1 && day <= 5) return 2; // Semana
  if (day === 0 && (hour >= 9 && hour <= 11)) return 2; // Dom 10h
  return 1; // Resto
}

export function StatisticsModal({ masses, onClose }: StatisticsModalProps) {
  const [activeTab, setActiveTab] = useState<"assiduidade" | "ranking">("assiduidade");
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const months = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
  ];

  // --- CÁLCULO GERAL DOS DADOS ---
  const stats = useMemo(() => {
    const data: Record<string, { 
      name: string; 
      presencas: number; 
      faltas: number; 
      escalas: number; // Total de vezes escalada (Presente + Falta + Futura)
      score: number; 
      roles: Record<string, number>;
    }> = {};

    const hoje = new Date();

    const filteredMasses = masses.filter((m) => {
      const d = new Date(m.date);
      const brDate = new Date(d.toLocaleString("en-US", { timeZone: "America/Sao_Paulo" }));
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
            roles: {} 
          };
        }

        // Conta toda vez que aparece na lista oficial
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

  // --- ORDENAÇÃO ---
  const sortedData = useMemo(() => {
    if (activeTab === "assiduidade") {
      // 1. Ordem Alfabética (A-Z) para facilitar busca
      return [...stats].sort((a, b) => a.name.localeCompare(b.name));
    } else {
      // 2. Ranking por Pontos (Decrescente)
      return [...stats].sort((a, b) => b.score - a.score || b.presencas - a.presencas);
    }
  }, [stats, activeTab]);

  return (
    <div style={{
      position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: "rgba(0,0,0,0.6)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1000,
      backdropFilter: "blur(3px)",
    }}>
      <div style={{
        backgroundColor: "#fff", width: "95%", maxWidth: "800px", borderRadius: "16px",
        padding: "0", position: "relative", maxHeight: "90vh", display: "flex", flexDirection: "column",
        boxShadow: "0 20px 50px rgba(0,0,0,0.3)",
      }}>
        
        {/* HEADER */}
        <div style={{ padding: "20px 25px 0 25px", background: "#f8f9fa", borderTopLeftRadius: "16px", borderTopRightRadius: "16px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div style={{ background: "#e3f2fd", padding: "10px", borderRadius: "10px", color: "#1565c0" }}>
                <BarChart2 size={24} />
              </div>
              <div>
                <h2 style={{ margin: 0, fontSize: "1.2rem", color: "#333" }}>Relatório Mensal</h2>
                <p style={{ margin: 0, fontSize: "0.85rem", color: "#666" }}>Acompanhamento de Servas</p>
              </div>
            </div>
            <button onClick={onClose} style={{ background: "transparent", border: "none", cursor: "pointer", color: "#999" }}>
              <X size={24} />
            </button>
          </div>

          {/* ABAS DE NAVEGAÇÃO */}
          <div style={{ display: "flex", gap: "20px" }}>
            <button 
              onClick={() => setActiveTab("assiduidade")}
              style={{
                display: "flex", alignItems: "center", gap: "8px", padding: "10px 5px", background: "none", border: "none",
                cursor: "pointer", borderBottom: activeTab === "assiduidade" ? "3px solid #1565c0" : "3px solid transparent",
                color: activeTab === "assiduidade" ? "#1565c0" : "#666", fontWeight: activeTab === "assiduidade" ? "bold" : "normal"
              }}
            >
              <LayoutList size={18} /> Assiduidade (A-Z)
            </button>
            <button 
              onClick={() => setActiveTab("ranking")}
              style={{
                display: "flex", alignItems: "center", gap: "8px", padding: "10px 5px", background: "none", border: "none",
                cursor: "pointer", borderBottom: activeTab === "ranking" ? "3px solid #e91e63" : "3px solid transparent",
                color: activeTab === "ranking" ? "#e91e63" : "#666", fontWeight: activeTab === "ranking" ? "bold" : "normal"
              }}
            >
              <Trophy size={18} /> Ranking & Pontos
            </button>
          </div>
        </div>

        {/* FILTROS */}
        <div style={{ padding: "15px 25px", background: "#fff", borderBottom: "1px solid #eee", display: "flex", gap: "10px" }}>
          <select value={selectedMonth} onChange={(e) => setSelectedMonth(Number(e.target.value))} style={{ padding: "10px", borderRadius: "8px", border: "1px solid #ddd", flex: 1, fontSize: "0.9rem" }}>
            {months.map((m, index) => <option key={index} value={index}>{m}</option>)}
          </select>
          <select value={selectedYear} onChange={(e) => setSelectedYear(Number(e.target.value))} style={{ padding: "10px", borderRadius: "8px", border: "1px solid #ddd", width: "100px", fontSize: "0.9rem" }}>
            <option value={2025}>2025</option>
            <option value={2026}>2026</option>
          </select>
        </div>

        {/* CONTEÚDO */}
        <div style={{ flex: 1, overflowY: "auto", padding: "0" }}>
          {sortedData.length === 0 ? (
            <div style={{ textAlign: "center", color: "#999", padding: "60px 20px" }}>
              <Calendar size={48} style={{ opacity: 0.2, marginBottom: 15 }} />
              <p>Nenhum dado encontrado para este mês.</p>
            </div>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "600px" }}>
              
              {/* --- ABA ASSIDUIDADE --- */}
              {activeTab === "assiduidade" && (
                <>
                  <thead style={{ position: "sticky", top: 0, background: "#fff", zIndex: 10 }}>
                    <tr style={{ borderBottom: "2px solid #f0f0f0", textAlign: "left" }}>
                      <th style={{ padding: "15px 25px", color: "#666", fontSize: "0.75rem", textTransform: "uppercase" }}>Serva</th>
                      <th style={{ padding: "15px", textAlign: "center", color: "#666", fontSize: "0.75rem", textTransform: "uppercase" }}>Escalas</th>
                      <th style={{ padding: "15px", textAlign: "center", color: "#2e7d32", fontSize: "0.75rem", textTransform: "uppercase" }}>Presenças</th>
                      <th style={{ padding: "15px", textAlign: "center", color: "#c62828", fontSize: "0.75rem", textTransform: "uppercase" }}>Faltas</th>
                      <th style={{ padding: "15px 25px", textAlign: "right", color: "#666", fontSize: "0.75rem", textTransform: "uppercase" }}>Assiduidade</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedData.map((s, i) => {
                      const totalRealizadas = s.presencas + s.faltas;
                      const percent = totalRealizadas > 0 ? Math.round((s.presencas / totalRealizadas) * 100) : 100;
                      let barColor = percent < 50 ? "#f44336" : (percent < 80 ? "#ff9800" : "#4caf50");

                      return (
                        <tr key={i} style={{ borderBottom: "1px solid #f9f9f9" }}>
                          <td style={{ padding: "12px 25px", fontWeight: "600", color: "#333" }}>{s.name}</td>
                          
                          {/* NOVA COLUNA: ESCALAS */}
                          <td style={{ textAlign: "center" }}>
                            <span style={{ background: "#f5f5f5", color: "#666", padding: "4px 10px", borderRadius: "12px", fontSize: "0.85rem", fontWeight: "bold" }}>
                              {s.escalas}
                            </span>
                          </td>

                          <td style={{ textAlign: "center" }}>
                            <span style={{ color: "#2e7d32", fontWeight: "bold" }}>{s.presencas}</span>
                          </td>
                          
                          <td style={{ textAlign: "center" }}>
                            {s.faltas > 0 ? 
                              <span style={{ background: "#ffebee", color: "#c62828", padding: "4px 10px", borderRadius: "12px", fontWeight: "bold", fontSize: "0.85rem" }}>{s.faltas}</span> : 
                              <span style={{ color: "#e0e0e0" }}><Minus size={16} /></span>
                            }
                          </td>
                          <td style={{ padding: "12px 25px", width: "140px" }}>
                            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "4px" }}>
                              <span style={{ fontSize: "0.85rem", fontWeight: "bold", color: barColor }}>{percent}%</span>
                              <div style={{ width: "100%", height: "6px", background: "#eee", borderRadius: "3px", overflow: "hidden" }}>
                                <div style={{ width: `${percent}%`, height: "100%", background: barColor, borderRadius: "3px" }} />
                              </div>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </>
              )}

              {/* --- ABA RANKING & FUNÇÕES --- */}
              {activeTab === "ranking" && (
                <>
                  <thead style={{ position: "sticky", top: 0, background: "#fff", zIndex: 10 }}>
                    <tr style={{ borderBottom: "2px solid #f0f0f0", textAlign: "left" }}>
                      <th style={{ padding: "15px 25px", width: "50px", color: "#666", fontSize: "0.75rem", textTransform: "uppercase" }}>#</th>
                      <th style={{ padding: "15px", color: "#666", fontSize: "0.75rem", textTransform: "uppercase" }}>Serva & Funções</th>
                      <th style={{ padding: "15px 25px", textAlign: "right", color: "#e91e63", fontSize: "0.75rem", textTransform: "uppercase" }}>Pontos Totais</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedData.map((s, i) => {
                      const rolesText = Object.entries(s.roles).map(([role, count]) => `${role} (${count})`).join(" • ");
                      
                      let rankIcon = <span style={{ color: "#999", fontWeight: "bold" }}>{i + 1}º</span>;
                      if (i === 0) rankIcon = <Trophy size={20} color="#FFD700" fill="#FFD700" />;
                      if (i === 1) rankIcon = <Medal size={20} color="#C0C0C0" fill="#C0C0C0" />;
                      if (i === 2) rankIcon = <Medal size={20} color="#CD7F32" fill="#CD7F32" />;

                      return (
                        <tr key={i} style={{ borderBottom: "1px solid #f9f9f9", background: i === 0 ? "#fffde7" : "transparent" }}>
                          <td style={{ padding: "12px 25px", textAlign: "center" }}>{rankIcon}</td>
                          <td style={{ padding: "12px" }}>
                            <span style={{ fontWeight: "700", color: "#333", fontSize: "0.95rem", display: "block" }}>{s.name}</span>
                            {rolesText && (
                              <div style={{ fontSize: "0.75rem", color: "#666", marginTop: "4px", display: "flex", alignItems: "center", gap: "4px" }}>
                                <Briefcase size={12} /> {rolesText}
                              </div>
                            )}
                          </td>
                          <td style={{ padding: "12px 25px", textAlign: "right" }}>
                            <div style={{ display: "inline-flex", alignItems: "center", gap: "4px", background: "#fce4ec", color: "#e91e63", padding: "4px 12px", borderRadius: "12px", fontWeight: "800", fontSize: "1rem" }}>
                              <Star size={14} fill="#e91e63" /> {s.score}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </>
              )}

            </table>
          )}
        </div>
      </div>
    </div>
  );
}