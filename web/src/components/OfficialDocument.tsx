import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { Download, ArrowLeft, Flower } from "lucide-react";
import { Mass } from "../types/types";

interface OfficialDocumentProps {
  masses: Mass[];
  onBack?: () => void;
}

export function OfficialDocument({ masses, onBack }: OfficialDocumentProps) {
  const generatePDF = () => {
    const doc = new jsPDF();

    // --- CABEÇALHO DO PDF (Mais delicado) ---
    // Adiciona uma linha rosa fina no topo
    doc.setDrawColor(233, 30, 99);
    doc.setLineWidth(1.5);
    doc.line(14, 15, 196, 15);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.setTextColor(233, 30, 99); // Rosa
    doc.text("Escala das Servas", 105, 25, { align: "center" });

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Gerado em: ${new Date().toLocaleDateString("pt-BR")}`, 105, 32, {
      align: "center",
    });

    // --- PROCESSAMENTO DAS LINHAS ---
    const tableRows = masses.map((mass) => {
      // Formatação de Data
      const dataObj = new Date(mass.date);
      const diaMes = dataObj.toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
      });
      // Dia da semana (Primeira letra maiúscula)
      const diaSemana = dataObj
        .toLocaleDateString("pt-BR", { weekday: "long" })
        .replace(/^\w/, (c) => c.toUpperCase());

      const hora = dataObj.toLocaleTimeString("pt-BR", {
        hour: "2-digit",
        minute: "2-digit",
      });

      // Busca Funções
      const cerimoniaria =
        mass.signups.find((s) => s.role === "Cerimoniária")?.user.name || "-";
      const librifera =
        mass.signups.find((s) => s.role === "Librífera")?.user.name || "-";

      const listaAuxiliares = mass.signups
        .filter((s) => s.role === "Auxiliar" || !s.role)
        .map((s) => s.user.name);

      const auxiliares = listaAuxiliares.length > 0 ? listaAuxiliares.join(", ") : "-";

      // Retorna a linha
      return [
        `${diaMes}\n${diaSemana}`, // Coluna Data com Dia da Semana
        hora,
        cerimoniaria,
        librifera,
        auxiliares,
      ];
    });

    // --- CRIAÇÃO DA TABELA (Estilo Clean) ---
    autoTable(doc, {
      startY: 40,
      head: [["Data", "Hora", "Cerimoniária", "Librífera", "Auxiliares"]],
      body: tableRows,
      theme: "grid", // Tema com linhas finas
      styles: {
        fontSize: 10,
        cellPadding: 5,
        valign: "middle",
        textColor: [60, 60, 60], // Cinza escuro elegante
        lineColor: [230, 230, 230], // Linhas bem clarinhas
        lineWidth: 0.1,
      },
      headStyles: {
        fillColor: [233, 30, 99], // Rosa Principal
        textColor: 255,
        fontStyle: "bold",
        halign: "center", // Centraliza cabeçalho
      },
      columnStyles: {
        0: { cellWidth: 30, halign: "center" }, // Data
        1: { cellWidth: 20, halign: "center" }, // Hora
        2: { cellWidth: 35 }, // Cerimoniária
        3: { cellWidth: 35 }, // Librífera
        4: { cellWidth: "auto" }, // Auxiliares
      },
      alternateRowStyles: {
        fillColor: [255, 250, 251], // Um rosa quase branco, muito sutil
      },
    });

    // Rodapé fofo
    const pageHeight = doc.internal.pageSize.height;
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text('"Servir com alegria"', 105, pageHeight - 10, { align: "center" });

    doc.save("escala-servas.pdf");
  };

  return (
    <div
      style={{
        padding: "20px",
        maxWidth: "900px",
        margin: "0 auto",
        fontFamily: "sans-serif",
      }}
    >
      <div
        style={{
          background: "white",
          padding: "40px",
          borderRadius: "24px",
          boxShadow: "0 10px 30px rgba(0,0,0,0.05)",
          textAlign: "center",
          border: "1px solid #fff0f5", // Borda rosa muito sutil
        }}
      >
        {/* Ícone de Flor Decorativo */}
        <div
          style={{
            background: "#fce4ec",
            width: "60px",
            height: "60px",
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 20px",
            color: "#e91e63",
          }}
        >
          <Flower size={32} />
        </div>

        <h2 style={{ color: "#333", marginBottom: "8px", fontSize: "1.8rem" }}>
          Escala Oficial
        </h2>
        <p style={{ color: "#888", marginBottom: "30px", fontSize: "0.95rem" }}>
          Visualize a lista detalhada ou baixe o PDF para impressão.
        </p>

        {/* Botões de Ação */}
        <div
          style={{
            display: "flex",
            gap: "12px",
            justifyContent: "center",
            marginBottom: "40px",
          }}
        >
          {onBack && (
            <button
              onClick={onBack}
              className="btn-action"
              style={{
                background: "white",
                color: "#555",
                border: "1px solid #eee",
                padding: "12px 24px",
                borderRadius: "50px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                fontWeight: 600,
                transition: "all 0.2s",
                boxShadow: "0 2px 5px rgba(0,0,0,0.05)",
              }}
            >
              <ArrowLeft size={18} /> Voltar
            </button>
          )}

          <button
            onClick={generatePDF}
            className="btn-action"
            style={{
              background: "linear-gradient(45deg, #e91e63, #ff4081)",
              color: "white",
              border: "none",
              padding: "12px 30px",
              borderRadius: "50px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              fontWeight: 600,
              boxShadow: "0 4px 15px rgba(233, 30, 99, 0.3)",
              transition: "transform 0.2s",
            }}
          >
            <Download size={18} /> Baixar PDF
          </button>
        </div>

        {/* --- TABELA DE PRÉ-VISUALIZAÇÃO (Estilo Aesthetic) --- */}
        <div
          style={{
            overflowX: "auto",
            textAlign: "left",
            borderRadius: "12px",
            border: "1px solid #eee",
          }}
        >
          <table
            style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.9rem" }}
          >
            <thead>
              <tr style={{ background: "#fdf2f6", color: "#c2185b" }}>
                <th style={{ padding: "16px", fontWeight: "700" }}>Data</th>
                <th style={{ padding: "16px", fontWeight: "700" }}>Hora</th>
                <th style={{ padding: "16px", fontWeight: "700" }}>Cerimoniária</th>
                <th style={{ padding: "16px", fontWeight: "700" }}>Librífera</th>
                <th style={{ padding: "16px", fontWeight: "700" }}>Auxiliares</th>
              </tr>
            </thead>
            <tbody>
              {masses.map((mass, index) => {
                const dataObj = new Date(mass.date);
                // Funções
                const cerimoniaria =
                  mass.signups.find((s) => s.role === "Cerimoniária")?.user.name || "-";
                const librifera =
                  mass.signups.find((s) => s.role === "Librífera")?.user.name || "-";
                const auxiliares = mass.signups
                  .filter((s) => s.role === "Auxiliar" || !s.role)
                  .map((s) => s.user.name)
                  .join(", ");

                return (
                  <tr
                    key={mass.id}
                    style={{
                      borderBottom: "1px solid #f5f5f5",
                      background: index % 2 === 0 ? "white" : "#fffbfc", // Alternar cor muito sutil
                    }}
                  >
                    <td style={{ padding: "16px", verticalAlign: "top" }}>
                      <div
                        style={{ fontWeight: "bold", color: "#333", fontSize: "1rem" }}
                      >
                        {dataObj.toLocaleDateString("pt-BR", {
                          day: "2-digit",
                          month: "2-digit",
                        })}
                      </div>
                      <div
                        style={{
                          fontSize: "0.75rem",
                          color: "#e91e63",
                          fontWeight: "600",
                          textTransform: "uppercase",
                          marginTop: "4px",
                          letterSpacing: "0.5px",
                        }}
                      >
                        {dataObj
                          .toLocaleDateString("pt-BR", { weekday: "short" })
                          .replace(".", "")}
                      </div>
                    </td>
                    <td
                      style={{
                        padding: "16px",
                        color: "#666",
                        fontWeight: "500",
                        verticalAlign: "middle",
                      }}
                    >
                      {dataObj.toLocaleTimeString("pt-BR", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                    <td
                      style={{ padding: "16px", color: "#444", verticalAlign: "middle" }}
                    >
                      {cerimoniaria}
                    </td>
                    <td
                      style={{ padding: "16px", color: "#444", verticalAlign: "middle" }}
                    >
                      {librifera}
                    </td>

                    {/* Auxiliares agora em cinza, sem destaque rosa */}
                    <td
                      style={{
                        padding: "16px",
                        color: "#555",
                        verticalAlign: "middle",
                        lineHeight: "1.4",
                      }}
                    >
                      {auxiliares || <span style={{ color: "#ccc" }}>-</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
