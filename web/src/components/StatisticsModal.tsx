import { useState, useMemo } from "react";
import { Mass } from "../types/types";
import {
  X,
  BarChart2,
  Calendar,
  Trophy,
  Download,
  Users,
  CheckCircle2,
  Repeat,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { getMassPoints } from "../utils/ranking.utils";
import { formatRole } from "../constants/roles";
import { formatServoName, registerUsersFromMasses } from "../utils/format.utils";
import { theme } from "../theme/theme";

interface StatisticsModalProps {
  masses: Mass[];
  onClose: () => void;
}

type PeriodMode = "MONTH" | "YEAR";
type SortMode = "RANKING" | "PRESENCES" | "PERCENT" | "NAME";

interface ServoStatItem {
  userId: string;
  name: string;
  presencas: number;
  faltas: number;
  escalas: number;
  specialPresences: number;
  substitutions: number;
  score: number;
  roles: Record<string, number>;
}

const MONTHS = [
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

export function StatisticsModal({ masses, onClose }: StatisticsModalProps) {
  registerUsersFromMasses(masses);
  const nowBr = useMemo(
    () => new Date(new Date().toLocaleString("en-US", { timeZone: "America/Sao_Paulo" })),
    []
  );
  const [periodMode, setPeriodMode] = useState<PeriodMode>("MONTH");
  const [selectedMonth, setSelectedMonth] = useState(nowBr.getMonth());
  const [selectedYear, setSelectedYear] = useState(nowBr.getFullYear());
  const [sortMode, setSortMode] = useState<SortMode>("RANKING");
  const [expandedUserId, setExpandedUserId] = useState<string | null>(null);

  const availableYears = useMemo(() => {
    const yrs = new Set<number>([2025, 2026, nowBr.getFullYear()]);
    for (const m of masses) {
      const d = new Date(m.date);
      if (!isNaN(d.getTime())) {
        const br = new Date(d.toLocaleString("en-US", { timeZone: "America/Sao_Paulo" }));
        yrs.add(br.getFullYear());
      }
    }
    return Array.from(yrs).sort((a, b) => b - a);
  }, [masses, nowBr]);

  const { stats, summary } = useMemo(() => {
    const data: Record<string, ServoStatItem> = {};
    const hoje = new Date();

    const filteredMasses = masses.filter((m) => {
      if (m.name?.includes("Ajuste de Pontos")) return false;
      const d = new Date(m.date);
      const brDate = new Date(d.toLocaleString("en-US", { timeZone: "America/Sao_Paulo" }));
      if (brDate.getFullYear() !== selectedYear) return false;
      if (periodMode === "MONTH" && brDate.getMonth() !== selectedMonth) return false;
      return true;
    });

    let pastMassesCount = 0;
    let totalPresencesAll = 0;
    let totalAbsencesAll = 0;
    let totalSubstitutionsAll = 0;

    filteredMasses.forEach((mass) => {
      const massDate = new Date(mass.date);
      const isPast = massDate < hoje;
      if (isPast) pastMassesCount += 1;

      const points =
        mass.points !== undefined && mass.points !== null
          ? mass.points
          : getMassPoints(mass.date);

      mass.signups.forEach((signup) => {
        if ((signup as any).status === "RESERVA") return;

        const uid = signup.userId;
        const uName = signup.user?.name || "Servo(a)";
        if (uName === "Serva Teste" || uName === "serva teste2" || uName === "Servo(a)") {
          return;
        }

        if (!data[uid]) {
          data[uid] = {
            userId: uid,
            name: formatServoName(uName, uid),
            presencas: 0,
            faltas: 0,
            escalas: 0,
            specialPresences: 0,
            substitutions: 0,
            score: 0,
            roles: {},
          };
        }

        data[uid].escalas += 1;

        if (signup.present) {
          data[uid].presencas += 1;
          data[uid].score += points;
          totalPresencesAll += 1;
          if (points >= 2) {
            data[uid].specialPresences += 1;
          }
          if (signup.isSubstitution) {
            data[uid].substitutions += 1;
            totalSubstitutionsAll += 1;
          }
          const formattedRole = formatRole(signup.role || "Auxiliar", uName, uid);
          data[uid].roles[formattedRole] = (data[uid].roles[formattedRole] || 0) + 1;
        } else if (isPast) {
          data[uid].faltas += 1;
          totalAbsencesAll += 1;
        }
      });
    });

    const list = Object.values(data);
    const totalRealizedSlots = totalPresencesAll + totalAbsencesAll;
    const avgAttendance =
      totalRealizedSlots > 0 ? Math.round((totalPresencesAll / totalRealizedSlots) * 100) : 100;

    const topByScales = [...list]
      .filter((i) => i.presencas > 0)
      .sort((a, b) => b.presencas - a.presencas || b.score - a.score)[0] || null;

    const topBySubstitutions = [...list]
      .filter((i) => i.substitutions > 0)
      .sort((a, b) => b.substitutions - a.substitutions || b.presencas - a.presencas)[0] || null;

    return {
      stats: list,
      summary: {
        totalMasses: filteredMasses.length,
        pastMassesCount,
        totalPresencesAll,
        totalAbsencesAll,
        totalSubstitutionsAll,
        avgAttendance,
        topByScales,
        topBySubstitutions,
      },
    };
  }, [masses, periodMode, selectedMonth, selectedYear]);

  // Ranking oficial seguindo a regra: 1º Pontos, 2º Mais escalas totais, 3º Mais escalas 2+ pts, 4º Menos faltas
  const officialRanked = useMemo(() => {
    return [...stats]
      .filter((s) => s.presencas > 0)
      .sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        if (b.presencas !== a.presencas) return b.presencas - a.presencas;
        if (b.specialPresences !== a.specialPresences) return b.specialPresences - a.specialPresences;
        if (a.faltas !== b.faltas) return a.faltas - b.faltas;
        return a.name.localeCompare(b.name, "pt-BR", { sensitivity: "base" });
      });
  }, [stats]);

  const sortedData = useMemo(() => {
    const copy = [...stats];
    if (sortMode === "NAME") {
      return copy.sort((a, b) => a.name.localeCompare(b.name, "pt-BR", { sensitivity: "base" }));
    }
    if (sortMode === "PRESENCES") {
      return copy.sort((a, b) => {
        if (b.presencas !== a.presencas) return b.presencas - a.presencas;
        if (b.score !== a.score) return b.score - a.score;
        if (a.faltas !== b.faltas) return a.faltas - b.faltas;
        return a.name.localeCompare(b.name, "pt-BR", { sensitivity: "base" });
      });
    }
    if (sortMode === "PERCENT") {
      return copy.sort((a, b) => {
        const pa = a.presencas + a.faltas > 0 ? a.presencas / (a.presencas + a.faltas) : 0;
        const pb = b.presencas + b.faltas > 0 ? b.presencas / (b.presencas + b.faltas) : 0;
        if (pb !== pa) return pb - pa;
        return b.presencas - a.presencas;
      });
    }
    // RANKING
    return copy.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      if (b.presencas !== a.presencas) return b.presencas - a.presencas;
      if (b.specialPresences !== a.specialPresences) return b.specialPresences - a.specialPresences;
      if (a.faltas !== b.faltas) return a.faltas - b.faltas;
      return a.name.localeCompare(b.name, "pt-BR", { sensitivity: "base" });
    });
  }, [stats, sortMode]);

  const periodLabel =
    periodMode === "YEAR"
      ? `Acumulado Anual — ${selectedYear}`
      : `${MONTHS[selectedMonth]} de ${selectedYear}`;

  const handleExportPDF = async () => {
    const [{ default: jsPDF }, { default: autoTable }] = await Promise.all([
      import("jspdf"),
      import("jspdf-autotable"),
    ]);
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.setTextColor(74, 50, 34);
    doc.text(
      periodMode === "YEAR"
        ? `Ranking e Relatório Anual — ${selectedYear}`
        : `Relatório Mensal de Assiduidade — ${MONTHS[selectedMonth]}/${selectedYear}`,
      14,
      18
    );

    doc.setFontSize(9.5);
    doc.setTextColor(90);
    doc.text(
      `Gerado em: ${new Date().toLocaleDateString("pt-BR")} • Missas realizadas: ${summary.pastMassesCount} (${summary.totalMasses} cadastradas) • Taxa geral de presença: ${summary.avgAttendance}%`,
      14,
      25
    );
    if (summary.topByScales) {
      doc.text(
        `Mais escalas no período: ${summary.topByScales.name} (${summary.topByScales.presencas} presenças / ${summary.topByScales.score} pts)`,
        14,
        31
      );
    }

    const rows = sortedData.map((s, idx) => {
      const realized = s.presencas + s.faltas;
      const pct = realized > 0 ? `${Math.round((s.presencas / realized) * 100)}%` : "100%";
      const rolesStr = Object.entries(s.roles)
        .map(([r, q]) => `${q}x ${r}`)
        .join(", ");
      return [
        `${idx + 1}º`,
        s.name,
        String(s.presencas),
        String(s.specialPresences),
        String(s.faltas),
        pct,
        `${s.score} pts`,
        rolesStr || "-",
      ];
    });

    autoTable(doc, {
      startY: 37,
      head: [["#", "Servo(a)", "Pres.", "2+ pts", "Faltas", "%", "Pontos", "Funções Exercidas"]],
      body: rows.length > 0 ? rows : [["-", "Sem registros no período", "0", "0", "0", "-", "0", "-"]],
      headStyles: { fillColor: [74, 50, 34], fontSize: 8.5 },
      styles: { fontSize: 8, cellPadding: 3 },
      columnStyles: {
        0: { cellWidth: 10, halign: "center" },
        2: { cellWidth: 14, halign: "center" },
        3: { cellWidth: 14, halign: "center" },
        4: { cellWidth: 14, halign: "center" },
        5: { cellWidth: 14, halign: "center" },
        6: { cellWidth: 18, halign: "right" },
      },
    });

    const slug =
      periodMode === "YEAR"
        ? `ranking-anual-${selectedYear}.pdf`
        : `relatorio-${MONTHS[selectedMonth].toLowerCase()}-${selectedYear}.pdf`;
    doc.save(slug);
  };

  const podiumTop3 = officialRanked.slice(0, 3);

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(0,0,0,0.65)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 1000,
        padding: "12px",
        backdropFilter: "blur(3px)",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: "#FAF8F5",
          width: "100%",
          maxWidth: "860px",
          borderRadius: "18px",
          maxHeight: "88vh",
          overflowY: "auto",
          overflowX: "hidden",
          WebkitOverflowScrolling: "touch",
          overscrollBehavior: "contain",
          boxSizing: "border-box",
          boxShadow: "0 24px 60px rgba(0,0,0,0.35)",
          border: `1px solid ${theme.colors.border}`,
        }}
      >
        {/* HEADER STICKY */}
        <div
          style={{
            position: "sticky",
            top: 0,
            zIndex: 20,
            padding: "14px 16px",
            background: theme.colors.primaryGradient,
            color: "#FFFFFF",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "10px",
            boxSizing: "border-box",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: 0 }}>
            <div
              style={{
                background: "rgba(255,255,255,0.18)",
                padding: "8px",
                borderRadius: "10px",
                display: "flex",
                flexShrink: 0,
              }}
            >
              <BarChart2 size={20} color="#FFFFFF" />
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ margin: 0, fontSize: "1.02rem", fontWeight: 800, color: "#FFFFFF", lineHeight: 1.2 }}>
                Relatório Geral & Ranking Anual
              </div>
              <div style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.88)", marginTop: "2px" }}>
                {periodLabel}
              </div>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "8px", flexShrink: 0 }}>
            {sortedData.length > 0 && (
              <button
                type="button"
                onClick={handleExportPDF}
                style={{
                  background: "rgba(255,255,255,0.2)",
                  border: "1px solid rgba(255,255,255,0.35)",
                  color: "#FFFFFF",
                  padding: "6px 11px",
                  borderRadius: "8px",
                  fontSize: "0.76rem",
                  fontWeight: 800,
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "5px",
                }}
              >
                <Download size={14} />
                <span>PDF</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              style={{
                background: "rgba(255,255,255,0.18)",
                border: "none",
                borderRadius: "50%",
                width: 30,
                height: 30,
                cursor: "pointer",
                color: "#fff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* CONTEÚDO INTERNO */}
        <div
          style={{
            boxSizing: "border-box",
          }}
        >
          {/* BARRA DE MODO (MENSAL vs ANUAL) + FILTROS */}
          <div
            style={{
              padding: "12px 14px",
              background: "#FFFFFF",
              borderBottom: "1px solid #ECE6DA",
              display: "flex",
              flexDirection: "column",
              gap: "10px",
              boxSizing: "border-box",
            }}
          >
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
              <button
                type="button"
                onClick={() => setPeriodMode("MONTH")}
                style={{
                  padding: "8px 10px",
                  borderRadius: "10px",
                  border: periodMode === "MONTH" ? `2px solid ${theme.colors.primary}` : "1px solid #E5DEC9",
                  background: periodMode === "MONTH" ? "#F7F5F0" : "#FFFFFF",
                  color: periodMode === "MONTH" ? theme.colors.primary : "#666",
                  fontWeight: 800,
                  fontSize: "0.82rem",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "6px",
                }}
              >
                <Calendar size={15} />
                <span>Visão Mensal</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setPeriodMode("YEAR");
                  setSortMode("RANKING");
                }}
                style={{
                  padding: "8px 10px",
                  borderRadius: "10px",
                  border: periodMode === "YEAR" ? "2px solid #B45309" : "1px solid #E5DEC9",
                  background: periodMode === "YEAR" ? "#FEF3C7" : "#FFFFFF",
                  color: periodMode === "YEAR" ? "#92400E" : "#666",
                  fontWeight: 800,
                  fontSize: "0.82rem",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "6px",
                }}
              >
                <Trophy size={15} />
                <span>Ranking Anual</span>
              </button>
            </div>

            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
              {periodMode === "MONTH" && (
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(Number(e.target.value))}
                  style={{
                    padding: "7px 9px",
                    borderRadius: "8px",
                    border: "1px solid #DDD4C2",
                    flex: "1 1 130px",
                    minWidth: 0,
                    fontSize: "0.82rem",
                    fontWeight: 600,
                  }}
                >
                  {MONTHS.map((m, index) => (
                    <option key={index} value={index}>
                      {m}
                    </option>
                  ))}
                </select>
              )}

              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                style={{
                  padding: "7px 9px",
                  borderRadius: "8px",
                  border: "1px solid #DDD4C2",
                  width: periodMode === "YEAR" ? "130px" : "95px",
                  fontSize: "0.82rem",
                  fontWeight: 700,
                }}
              >
                {availableYears.map((yr) => (
                  <option key={yr} value={yr}>
                    {yr}
                  </option>
                ))}
              </select>

              <select
                value={sortMode}
                onChange={(e) => setSortMode(e.target.value as SortMode)}
                style={{
                  padding: "7px 9px",
                  borderRadius: "8px",
                  border: "1px solid #DDD4C2",
                  flex: "1 1 165px",
                  minWidth: 0,
                  fontSize: "0.82rem",
                  fontWeight: 600,
                }}
              >
                <option value="RANKING">Ordenar: 🏆 Ranking (Pontos)</option>
                <option value="PRESENCES">Ordenar: 📅 Mais Escalas Servidas</option>
                <option value="PERCENT">Ordenar: ✅ % Assiduidade</option>
                <option value="NAME">Ordenar: 🔤 Ordem Alfabética</option>
              </select>
            </div>
          </div>

          <div
            style={{
              padding: "14px",
              display: "flex",
              flexDirection: "column",
              gap: "14px",
              boxSizing: "border-box",
            }}
          >
            {/* 4 CARDS DE RESUMO (KPIs) */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
                gap: "10px",
              }}
            >
              <div
                style={{
                  background: "#FFFFFF",
                  border: "1px solid #E5DEC9",
                  borderRadius: "12px",
                  padding: "11px 12px",
                }}
              >
                <div style={{ fontSize: "0.7rem", fontWeight: 800, color: "#8C7360", textTransform: "uppercase", display: "flex", alignItems: "center", gap: "5px" }}>
                  <Calendar size={13} />
                  <span>Missas & Escalas</span>
                </div>
                <div style={{ fontSize: "1.2rem", fontWeight: 900, color: "#4A3222", marginTop: "3px" }}>
                  {summary.pastMassesCount} <span style={{ fontSize: "0.76rem", fontWeight: 600, color: "#785A3C" }}>missas realizadas</span>
                </div>
                <div style={{ fontSize: "0.72rem", color: "#8C7360", marginTop: "2px" }}>
                  {summary.totalPresencesAll} participações confirmadas ({summary.totalMasses} missas no período)
                </div>
              </div>

              <div
                style={{
                  background: "#FFFFFF",
                  border: "1px solid #E5DEC9",
                  borderRadius: "12px",
                  padding: "11px 12px",
                }}
              >
                <div style={{ fontSize: "0.7rem", fontWeight: 800, color: "#166534", textTransform: "uppercase", display: "flex", alignItems: "center", gap: "5px" }}>
                  <CheckCircle2 size={13} />
                  <span>Assiduidade Geral</span>
                </div>
                <div style={{ fontSize: "1.2rem", fontWeight: 900, color: "#166534", marginTop: "3px" }}>
                  {summary.avgAttendance}%
                </div>
                <div style={{ fontSize: "0.72rem", color: "#666", marginTop: "2px" }}>
                  {summary.totalPresencesAll} presenças • {summary.totalAbsencesAll} faltas
                </div>
              </div>

              <div
                style={{
                  background: "#FFFFFF",
                  border: "1px solid #E5DEC9",
                  borderRadius: "12px",
                  padding: "11px 12px",
                }}
              >
                <div style={{ fontSize: "0.7rem", fontWeight: 800, color: "#B45309", textTransform: "uppercase", display: "flex", alignItems: "center", gap: "5px" }}>
                  <Users size={13} />
                  <span>Mais Escalas Servidas</span>
                </div>
                <div
                  style={{
                    fontSize: "0.9rem",
                    fontWeight: 900,
                    color: "#4A3222",
                    marginTop: "4px",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                  title={summary.topByScales?.name || ""}
                >
                  {summary.topByScales ? summary.topByScales.name : "—"}
                </div>
                <div style={{ fontSize: "0.72rem", color: "#92400E", fontWeight: 700, marginTop: "2px" }}>
                  {summary.topByScales
                    ? `${summary.topByScales.presencas} missas servidas (${summary.topByScales.score} pts)`
                    : "Sem presenças ainda"}
                </div>
              </div>

              <div
                style={{
                  background: "#FFFFFF",
                  border: "1px solid #E5DEC9",
                  borderRadius: "12px",
                  padding: "11px 12px",
                }}
              >
                <div style={{ fontSize: "0.7rem", fontWeight: 800, color: "#6D28D9", textTransform: "uppercase", display: "flex", alignItems: "center", gap: "5px" }}>
                  <Repeat size={13} />
                  <span>Apoio em Substituições</span>
                </div>
                <div
                  style={{
                    fontSize: "0.9rem",
                    fontWeight: 900,
                    color: "#4A3222",
                    marginTop: "4px",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                  title={summary.topBySubstitutions?.name || ""}
                >
                  {summary.topBySubstitutions ? summary.topBySubstitutions.name : "—"}
                </div>
                <div style={{ fontSize: "0.72rem", color: "#6D28D9", fontWeight: 700, marginTop: "2px" }}>
                  {summary.topBySubstitutions
                    ? `${summary.topBySubstitutions.substitutions} substituição(ões) • ${summary.totalSubstitutionsAll} no total`
                    : "Nenhuma substituição no período"}
                </div>
              </div>
            </div>

            {/* PÓDIO TOP 3 (Destaque especial no Ranking Anual ou quando ordenado por Ranking) */}
            {podiumTop3.length > 0 && (periodMode === "YEAR" || sortMode === "RANKING") && (
              <div
                style={{
                  background: "linear-gradient(135deg, #FFFBF0 0%, #FDF2D6 100%)",
                  border: "1.5px solid #E6C77E",
                  borderRadius: "14px",
                  padding: "12px 14px",
                }}
              >
                <div style={{ fontSize: "0.74rem", fontWeight: 800, color: "#8C6530", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "8px", display: "flex", alignItems: "center", gap: "6px" }}>
                  <Trophy size={14} />
                  <span>
                    {periodMode === "YEAR"
                      ? `Pódio Anual ${selectedYear} (Geral)`
                      : `Top 3 de ${MONTHS[selectedMonth]}/${selectedYear}`}
                  </span>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", gap: "8px" }}>
                  {podiumTop3.map((item, idx) => {
                    const medal = idx === 0 ? "🥇 1º" : idx === 1 ? "🥈 2º" : "🥉 3º";
                    return (
                      <div
                        key={item.userId}
                        style={{
                          background: "#FFFFFF",
                          border: idx === 0 ? "1.5px solid #D97706" : "1px solid #E5DEC9",
                          borderRadius: "10px",
                          padding: "9px 11px",
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "6px" }}>
                          <span style={{ fontSize: "0.76rem", fontWeight: 900, color: idx === 0 ? "#B45309" : "#5C4028" }}>
                            {medal}
                          </span>
                          <span style={{ fontSize: "0.76rem", fontWeight: 900, color: "#4A3222", background: "#FEF3C7", padding: "2px 7px", borderRadius: "999px" }}>
                            {item.score} pts
                          </span>
                        </div>
                        <div
                          style={{
                            fontSize: "0.86rem",
                            fontWeight: 800,
                            color: "#333",
                            marginTop: "4px",
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}
                          title={item.name}
                        >
                          {item.name}
                        </div>
                        <div style={{ fontSize: "0.72rem", color: "#785A3C", marginTop: "2px" }}>
                          {item.presencas} escalas servidas • {item.specialPresences} de 2+ pts • {item.faltas} faltas
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* TABELA COMPLETA + RAIO-X DE FUNÇÕES EXPANSÍVEL */}
            {sortedData.length === 0 ? (
              <div
                style={{
                  textAlign: "center",
                  color: "#999",
                  padding: "40px 20px",
                  background: "#FFFFFF",
                  borderRadius: "14px",
                  border: "1px dashed #DDD",
                }}
              >
                <Calendar size={38} style={{ opacity: 0.25, marginBottom: 8 }} />
                <p style={{ margin: 0, fontWeight: 600 }}>Sem dados registrados neste período.</p>
              </div>
            ) : (
              <div
                style={{
                  background: "#FFFFFF",
                  borderRadius: "14px",
                  border: "1px solid #E5DEC9",
                  overflow: "hidden",
                }}
              >
                <div style={{ padding: "8px 12px", background: "#F7F5F0", borderBottom: "1px solid #E5DEC9", fontSize: "0.73rem", color: "#785A3C", fontWeight: 600 }}>
                  💡 Toque no nome de qualquer servo(a) para ver as funções exercidas no período.
                </div>
                <div style={{ overflowX: "auto" }}>
                  <table
                    style={{
                      width: "100%",
                      borderCollapse: "collapse",
                      minWidth: "420px",
                    }}
                  >
                    <thead>
                      <tr style={{ borderBottom: "2px solid #EFECE6", textAlign: "left", background: "#FAF8F5" }}>
                        <th style={{ padding: "10px 8px 10px 12px", color: "#785A3C", fontSize: "0.68rem", textTransform: "uppercase", width: "36px" }}>
                          #
                        </th>
                        <th style={{ padding: "10px 8px", color: "#785A3C", fontSize: "0.68rem", textTransform: "uppercase" }}>
                          Servo(a)
                        </th>
                        <th style={{ padding: "10px 6px", textAlign: "center", color: "#166534", fontSize: "0.68rem", textTransform: "uppercase", width: "68px" }}>
                          Pres.
                        </th>
                        <th style={{ padding: "10px 6px", textAlign: "center", color: "#92400E", fontSize: "0.68rem", textTransform: "uppercase", width: "62px" }}>
                          2+ pts
                        </th>
                        <th style={{ padding: "10px 6px", textAlign: "center", color: "#B91C1C", fontSize: "0.68rem", textTransform: "uppercase", width: "56px" }}>
                          Falt.
                        </th>
                        <th style={{ padding: "10px 6px", textAlign: "center", color: "#666", fontSize: "0.68rem", textTransform: "uppercase", width: "54px" }}>
                          %
                        </th>
                        <th style={{ padding: "10px 12px 10px 6px", textAlign: "right", color: "#4A3222", fontSize: "0.68rem", textTransform: "uppercase", width: "66px" }}>
                          Pontos
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
                        const pctColor =
                          percent < 50 ? "#DC2626" : percent < 80 ? "#D97706" : "#16A34A";
                        const isExpanded = expandedUserId === s.userId;
                        const roleEntries = Object.entries(s.roles).sort((a, b) => b[1] - a[1]);

                        return (
                          <FragmentRow
                            key={s.userId}
                            index={i}
                            item={s}
                            percent={percent}
                            pctColor={pctColor}
                            isExpanded={isExpanded}
                            roleEntries={roleEntries}
                            onToggle={() => setExpandedUserId(isExpanded ? null : s.userId)}
                          />
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function FragmentRow({
  index,
  item,
  percent,
  pctColor,
  isExpanded,
  roleEntries,
  onToggle,
}: {
  index: number;
  item: ServoStatItem;
  percent: number;
  pctColor: string;
  isExpanded: boolean;
  roleEntries: [string, number][];
  onToggle: () => void;
}) {
  return (
    <>
      <tr
        onClick={onToggle}
        style={{
          borderBottom: isExpanded ? "none" : "1px solid #F3EFE8",
          cursor: "pointer",
          background: isExpanded ? "#FFFBF2" : "#FFFFFF",
        }}
      >
        <td style={{ padding: "10px 8px 10px 12px", fontSize: "0.8rem", fontWeight: 800, color: "#8C7360" }}>
          {index + 1}º
        </td>
        <td style={{ padding: "10px 8px", fontWeight: 700, color: "#333", fontSize: "0.84rem" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "6px" }}>
            <span>{item.name}</span>
            {isExpanded ? <ChevronUp size={14} color="#8C7360" /> : <ChevronDown size={14} color="#B8A99A" />}
          </div>
        </td>
        <td style={{ textAlign: "center", color: "#166534", fontWeight: 800, fontSize: "0.85rem" }}>
          {item.presencas}
        </td>
        <td style={{ textAlign: "center", color: "#92400E", fontWeight: 700, fontSize: "0.82rem" }}>
          {item.specialPresences}
        </td>
        <td style={{ textAlign: "center", color: item.faltas > 0 ? "#DC2626" : "#9CA3AF", fontWeight: 800, fontSize: "0.84rem" }}>
          {item.faltas}
        </td>
        <td style={{ textAlign: "center", fontWeight: 800, fontSize: "0.82rem", color: pctColor }}>
          {percent}%
        </td>
        <td style={{ padding: "10px 12px 10px 6px", textAlign: "right", fontWeight: 900, fontSize: "0.86rem", color: "#4A3222" }}>
          {item.score}
        </td>
      </tr>
      {isExpanded && (
        <tr style={{ borderBottom: "1px solid #EFECE6", background: "#FFFBF2" }}>
          <td colSpan={7} style={{ padding: "0 12px 12px 36px" }}>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", alignItems: "center" }}>
              <span style={{ fontSize: "0.72rem", fontWeight: 800, color: "#785A3C" }}>
                Funções servidas ({item.escalas} escalas inscritas):
              </span>
              {roleEntries.length === 0 ? (
                <span style={{ fontSize: "0.74rem", color: "#999" }}>Nenhuma presença confirmada</span>
              ) : (
                roleEntries.map(([rName, qty]) => (
                  <span
                    key={rName}
                    style={{
                      background: "#FFFFFF",
                      border: "1px solid #E5DEC9",
                      borderRadius: "999px",
                      padding: "2px 9px",
                      fontSize: "0.73rem",
                      fontWeight: 700,
                      color: "#4A3222",
                    }}
                  >
                    {rName}: <strong>{qty}x</strong>
                  </span>
                ))
              )}
              {item.substitutions > 0 && (
                <span
                  style={{
                    background: "#F3E8FF",
                    border: "1px solid #D8B4FE",
                    borderRadius: "999px",
                    padding: "2px 9px",
                    fontSize: "0.73rem",
                    fontWeight: 800,
                    color: "#6D28D9",
                  }}
                >
                  🤝 {item.substitutions} substituição(ões)
                </span>
              )}
            </div>
          </td>
        </tr>
      )}
    </>
  );
}
