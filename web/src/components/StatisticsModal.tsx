import { useState, useMemo } from "react";
import { Mass } from "../types/types";
import { X, Trophy, Medal, Calendar, Award, CheckCircle, AlertCircle } from "lucide-react";

interface StatisticsModalProps {
  masses: Mass[];
  onClose: () => void;
}

export function StatisticsModal({ masses, onClose }: StatisticsModalProps) {
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const months = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
  ];

  // --- LÓGICA DE CÁLCULO ---
  const ranking = useMemo(() => {
    // Estrutura para guardar os dados de cada serva
    const stats: Record<string, { 
      name: string; 
      totalEscalas: number; 
      totalPresencas: number;
      roles: Record<string, number> 
    }> = {};

    // 1. Filtrar missas do mês/ano selecionado
    const filteredMasses = masses.filter(m => {
      const d = new Date(m.date);
      return d.getMonth() === selectedMonth && d.getFullYear() === selectedYear;
    });

    // 2. Processar cada missa
    filteredMasses.forEach(mass => {
      mass.signups.forEach(signup => {
        if (!stats[signup.userId]) {
          stats[signup.userId] = { 
            name: signup.user.name, 
            totalEscalas: 0, 
            totalPresencas: 0,
            roles: {} 
          };
        }
        
        // Contabiliza escala (se inscreveu)
        stats[signup.userId].totalEscalas += 1;

        // Contabiliza presença (se present === true)
        if (signup.present) {
          stats[signup.userId].totalPresencas += 1;
        }

        // Contabiliza função
        const role = signup.role || "Sem função";
        stats[signup.userId].roles[role] = (stats[signup.userId].roles[role] || 0) + 1;
      });
    });

    // 3. Transformar em array e ordenar
    // Critério de desempate: 1º Presenças, 2º Escalas totais
    return Object.values(stats).sort((a, b) => {
      if (b.totalPresencas !== a.totalPresencas) {
        return b.totalPresencas - a.totalPresencas;
      }
      return b.totalEscalas - a.totalEscalas;
    });
  }, [masses, selectedMonth, selectedYear]);

  return (
    <div style={{
      position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: "rgba(0,0,0,0.5)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1000
    }}>
      <div style={{
        backgroundColor: "white", width: "95%", maxWidth: "600px", borderRadius: "12px",
        padding: "20px", position: "relative", maxHeight: "90vh", overflowY: "auto",
        boxShadow: "0 10px 25px rgba(0,0,0,0.2)"
      }}>
        
        <button onClick={onClose} style={{ position: "absolute", top: 15, right: 15, background: "none", border: "none", cursor: "pointer", color: "#666" }}>
          <X size={24} />
        </button>

        <div style={{ textAlign: "center", marginBottom: "20px" }}>
          <div style={{ display: "inline-flex", padding: "10px", background: "#fce4ec", borderRadius: "50%", color: "#e91e63", marginBottom: "10px" }}>
            <Award size={32} />
          </div>
          <h2 style={{ margin: 0, color: "#333", fontSize: "1.5rem" }}>Relatório Mensal</h2>
          <p style={{ color: "#666", fontSize: "0.9rem" }}>Frequência e engajamento</p>
        </div>

        {/* FILTROS */}
        <div style={{ display: "flex", gap: "10px", marginBottom: "20px", justifyContent: "center" }}>
          <select 
            value={selectedMonth} 
            onChange={(e) => setSelectedMonth(Number(e.target.value))}
            style={{ padding: "8px", borderRadius: "6px", border: "1px solid #ddd", fontSize: "1rem" }}
          >
            {months.map((m, index) => (
              <option key={index} value={index}>{m}</option>
            ))}
          </select>
          <select 
            value={selectedYear} 
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            style={{ padding: "8px", borderRadius: "6px", border: "1px solid #ddd", fontSize: "1rem" }}
          >
            <option value={2025}>2025</option>
            <option value={2026}>2026</option>
          </select>
        </div>

        {/* LISTA DE RANKING */}
        {ranking.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px", color: "#999", border: "2px dashed #eee", borderRadius: "8px" }}>
            <Calendar size={40} style={{ opacity: 0.3, marginBottom: 10 }} />
            <p>Nenhuma atividade registrada neste período.</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {ranking.map((serva, index) => {
              // Cálculo de porcentagem de presença
              const percent = serva.totalEscalas > 0 
                ? Math.round((serva.totalPresencas / serva.totalEscalas) * 100) 
                : 0;
              
              // Cores para os TOP 3
              let icon = <span style={{ fontWeight: "bold", color: "#999", width: "24px", textAlign: "center", fontSize: "0.9rem" }}>{index + 1}º</span>;
              let borderColor = "#eee";
              
              if (index === 0) { icon = <Trophy size={20} color="#FFD700" fill="#FFD700" />; borderColor = "#FFD700"; }
              else if (index === 1) { icon = <Medal size={20} color="#C0C0C0" fill="#C0C0C0" />; borderColor = "#C0C0C0"; }
              else if (index === 2) { icon = <Medal size={20} color="#CD7F32" fill="#CD7F32" />; borderColor = "#CD7F32"; }

              return (
                <div key={index} style={{ 
                  display: "flex", flexDirection: "column",
                  padding: "12px", borderRadius: "8px", backgroundColor: "#fff",
                  border: `1px solid ${borderColor}`, boxShadow: "0 2px 5px rgba(0,0,0,0.03)"
                }}>
                  {/* Linha Superior: Nome e Ícone */}
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      {icon}
                      <span style={{ fontWeight: "bold", color: "#333", fontSize: "1rem" }}>{serva.name}</span>
                    </div>
                    {/* Badge de Porcentagem */}
                    <div style={{ 
                      fontSize: "0.75rem", fontWeight: "bold", 
                      padding: "2px 8px", borderRadius: "10px",
                      backgroundColor: percent === 100 ? "#e8f5e9" : percent >= 75 ? "#fff3e0" : "#ffebee",
                      color: percent === 100 ? "#2e7d32" : percent >= 75 ? "#ef6c00" : "#c62828"
                    }}>
                      {percent}% Frequência
                    </div>
                  </div>

                  {/* Linha do Meio: Estatísticas */}
                  <div style={{ display: "flex", gap: "15px", marginBottom: "8px", paddingLeft: "34px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "0.85rem", color: "#666" }}>
                      <CheckCircle size={14} color="#2e7d32" />
                      <strong>{serva.totalPresencas}</strong> <span style={{ fontSize: "0.8rem" }}>Presenças</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "0.85rem", color: "#666" }}>
                      <AlertCircle size={14} color="#e91e63" />
                      <strong>{serva.totalEscalas}</strong> <span style={{ fontSize: "0.8rem" }}>Escalas</span>
                    </div>
                  </div>

                  {/* Linha Inferior: Funções */}
                  <div style={{ fontSize: "0.75rem", color: "#999", paddingLeft: "34px", borderTop: "1px solid #f5f5f5", paddingTop: "5px" }}>
                    {Object.entries(serva.roles).map(([role, count]) => `${role} (${count})`).join(" • ")}
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