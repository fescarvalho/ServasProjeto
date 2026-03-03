import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { ClipboardList, Download } from "lucide-react";
import { Mass } from "../types/types";

interface MonthlyReportProps {
  masses: Mass[];
}

export function MonthlyReport({ masses }: MonthlyReportProps) {
  const generateMonthlyPDF = () => {
    const doc = new jsPDF();
    const now = new Date();

    // 1. Considerar apenas escalas que já ocorreram (passadas)
    const pastMasses = masses.filter((mass) => new Date(mass.date) < now);

    // 2. Agrupar presenças por Serva (somente present === true)
    const presenceStats: Record<
      string,
      { total: number; roles: Record<string, number> }
    > = {};

    // 3. Agrupar faltas por Serva (present === false em escalas passadas)
    const absenceStats: Record<string, number> = {};

    pastMasses.forEach((mass) => {
      mass.signups.forEach((signup) => {
        const name = signup.user.name;
        const role = signup.role || "Auxiliar";

        if (signup.present) {
          // Presença confirmada
          if (!presenceStats[name]) {
            presenceStats[name] = { total: 0, roles: {} };
          }
          presenceStats[name].total += 1;
          presenceStats[name].roles[role] =
            (presenceStats[name].roles[role] || 0) + 1;
        } else {
          // Falta
          absenceStats[name] = (absenceStats[name] || 0) + 1;
        }
      });
    });

    // 4. Montar linhas da tabela de presenças
    const presenceRows = Object.entries(presenceStats)
      .sort((a, b) => b[1].total - a[1].total)
      .map(([name, data]) => {
        const detalhes = Object.entries(data.roles)
          .map(([role, qtd]) => `${qtd}x ${role}`)
          .join(", ");
        return [name, data.total.toString(), detalhes];
      });

    // 5. Montar linhas da tabela de faltas
    const absenceRows = Object.entries(absenceStats)
      .sort((a, b) => b[1] - a[1])
      .map(([name, total]) => [name, total.toString()]);

    // 6. Gerar o PDF
    doc.setFontSize(18);
    doc.setTextColor(233, 30, 99);
    doc.text("Relatório Mensal de Atividades", 14, 20);

    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Gerado em: ${now.toLocaleDateString("pt-BR")}`, 14, 28);
    doc.text(`Escalas consideradas: ${pastMasses.length}`, 14, 34);

    // Tabela de presenças
    doc.setFontSize(13);
    doc.setTextColor(233, 30, 99);
    doc.text("Presenças", 14, 44);

    autoTable(doc, {
      startY: 48,
      head: [["Nome da Serva", "Presenças", "Detalhamento por Função"]],
      body:
        presenceRows.length > 0
          ? presenceRows
          : [["Nenhuma presença registrada", "", ""]],
      headStyles: { fillColor: [233, 30, 99] },
      styles: { fontSize: 10, cellPadding: 4 },
      columnStyles: {
        1: { halign: "center", cellWidth: 30 },
      },
    });

    // Tabela de faltas (logo abaixo)
    const afterPresenceY = (doc as any).lastAutoTable?.finalY ?? 80;

    doc.setFontSize(13);
    doc.setTextColor(180, 0, 0);
    doc.text("Faltas", 14, afterPresenceY + 12);

    autoTable(doc, {
      startY: afterPresenceY + 16,
      head: [["Nome da Serva", "Faltas"]],
      body:
        absenceRows.length > 0
          ? absenceRows
          : [["Nenhuma falta registrada", ""]],
      headStyles: { fillColor: [180, 0, 0] },
      styles: { fontSize: 10, cellPadding: 4 },
      columnStyles: {
        1: { halign: "center", cellWidth: 30 },
      },
    });

    doc.save("relatorio-mensal-servas.pdf");
  };

  return (
    <button
      onClick={generateMonthlyPDF}
      style={{
        background: "white",
        color: "#e91e63",
        border: "1px solid #e91e63",
        padding: "10px 20px",
        borderRadius: "30px",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        gap: "8px",
        fontWeight: 600,
        fontSize: "0.9rem",
        marginTop: "10px",
        transition: "all 0.2s",
      }}
      onMouseOver={(e) => (e.currentTarget.style.background = "#fff5f8")}
      onMouseOut={(e) => (e.currentTarget.style.background = "white")}
    >
      <ClipboardList size={18} />
      Gerar Relatório
      <Download size={16} style={{ opacity: 0.7 }} />
    </button>
  );
}

