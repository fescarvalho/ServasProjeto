import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { ClipboardList, Download } from "lucide-react"; // Agora ambos serão usados
import { Mass } from "../types/types";

interface MonthlyReportProps {
  masses: Mass[];
}

export function MonthlyReport({ masses }: MonthlyReportProps) {
  const generateMonthlyPDF = () => {
    const doc = new jsPDF();

    // 1. Agrupar dados por Serva
    const stats: Record<string, { total: number; roles: Record<string, number> }> = {};

    masses.forEach((mass) => {
      mass.signups.forEach((signup) => {
        const name = signup.user.name;
        const role = signup.role || "Auxiliar";

        if (!stats[name]) {
          stats[name] = { total: 0, roles: {} };
        }

        stats[name].total += 1;
        stats[name].roles[role] = (stats[name].roles[role] || 0) + 1;
      });
    });

    // 2. Transformar em linhas para a tabela
    const tableRows = Object.entries(stats)
      .sort((a, b) => b[1].total - a[1].total)
      .map(([name, data]) => {
        const detalhes = Object.entries(data.roles)
          .map(([role, qtd]) => `${qtd}x ${role}`)
          .join(", ");

        return [name, data.total.toString(), detalhes];
      });

    // 3. Gerar o PDF
    doc.setFontSize(18);
    doc.setTextColor(233, 30, 99);
    doc.text("Relatório Mensal de Atividades", 14, 20);

    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Gerado em: ${new Date().toLocaleDateString("pt-BR")}`, 14, 28);

    autoTable(doc, {
      startY: 35,
      head: [["Nome da Serva", "Total de Escalas", "Detalhamento por Função"]],
      body: tableRows,
      headStyles: { fillColor: [233, 30, 99] },
      styles: { fontSize: 10, cellPadding: 4 },
      columnStyles: {
        1: { halign: "center", cellWidth: 35 },
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
      <Download size={16} style={{ opacity: 0.7 }} /> {/* O ícone agora é usado aqui */}
    </button>
  );
}
