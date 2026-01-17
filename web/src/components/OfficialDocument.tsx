import { ArrowLeft, Download, Flower } from "lucide-react";
import html2pdf from "html2pdf.js";
import { Mass, FUNCOES } from "../types/types";

interface DocumentProps {
  masses: Mass[];
  onBack?: () => void;
}

export function OfficialDocument({ masses, onBack }: DocumentProps) {
  const handleDownloadPDF = () => {
    const element = document.getElementById("documento-pdf");
    if (!element) return;

    // Removemos temporariamente as transformações de escala para o download sair perfeito
    const originalStyle = element.style.transform;
    element.style.transform = "none";

    const opt = {
      margin: 0,
      filename: "Escala_Servas.pdf",
      image: { type: "jpeg" as const, quality: 0.98 },
      html2canvas: {
        scale: 2,
        useCORS: true,
        letterRendering: true,
      },
      jsPDF: {
        unit: "mm" as const,
        format: "a4" as const,
        orientation: "portrait" as const,
      },
    };

    html2pdf()
      .set(opt)
      .from(element)
      .save()
      .then(() => {
        // Restaura o estilo de visualização após o download
        element.style.transform = originalStyle;
      });
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "20px 10px",
        background: "#555",
        minHeight: "100vh",
        width: "100%",
        boxSizing: "border-box",
        overflowX: "hidden", // Evita que a página inteira balance
      }}
    >
      <div
        className="no-print"
        style={{
          marginBottom: 20,
          textAlign: "center",
          display: "flex",
          gap: 10,
          flexWrap: "wrap",
          justifyContent: "center",
        }}
      >
        {onBack && (
          <button
            onClick={onBack}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 5,
              padding: "10px 20px",
              background: "white",
              border: "none",
              borderRadius: 8,
              cursor: "pointer",
              fontWeight: "bold",
            }}
          >
            <ArrowLeft size={18} /> Voltar
          </button>
        )}
        <button
          onClick={handleDownloadPDF}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "10px 24px",
            background: "#ffeb3b",
            color: "black",
            border: "none",
            borderRadius: 8,
            cursor: "pointer",
            fontWeight: "bold",
            boxShadow: "0 4px 10px rgba(0,0,0,0.3)",
          }}
        >
          <Download size={18} /> BAIXAR PDF AGORA
        </button>
      </div>

      {/* Wrapper de Scroll para Mobile */}
      <div
        style={{
          width: "100%",
          display: "flex",
          justifyContent: "center",
          overflowX: "auto", // Permite ver a folha arrastando para o lado no celular
          paddingBottom: "40px",
        }}
      >
        <div
          id="documento-pdf"
          style={{
            background: "white",
            width: "210mm",
            minHeight: "297mm",
            padding: "20mm",
            boxShadow: "0 0 20px rgba(0,0,0,0.5)",
            color: "black",
            fontFamily: '"Times New Roman", serif',
            boxSizing: "border-box",
            flexShrink: 0, // Impede que o flexbox tente "esmagar" a folha
          }}
        >
          {/* Header */}
          <div
            style={{
              textAlign: "center",
              marginBottom: "30px",
              borderBottom: "2px solid black",
              paddingBottom: "20px",
            }}
          >
            <div
              style={{
                color: "black",
                marginBottom: 10,
                display: "flex",
                justifyContent: "center",
              }}
            >
              <Flower size={50} strokeWidth={1} />
            </div>
            <h1 style={{ margin: 0, fontSize: "24pt", textTransform: "uppercase" }}>
              Grupo de Servas Santa Terezinha
            </h1>
            <p style={{ margin: "5px 0 0 0", fontSize: "14pt", fontStyle: "italic" }}>
              Paróquia Santuário Diocesano Nossa Senhora da Natividade
            </p>
          </div>

          {/* Conteúdo */}
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            {masses.map((mass) => {
              const d = new Date(mass.date);
              const dia = d.toLocaleDateString("pt-BR", {
                day: "2-digit",
                month: "long",
              });
              const sem = d.toLocaleDateString("pt-BR", { weekday: "long" });
              const hora = d.toLocaleTimeString("pt-BR", {
                hour: "2-digit",
                minute: "2-digit",
              });

              return (
                <div
                  key={mass.id}
                  style={{
                    marginBottom: "15px",
                    borderBottom: "1px dashed #ccc",
                    paddingBottom: "15px",
                    pageBreakInside: "avoid",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "baseline",
                      marginBottom: "10px",
                    }}
                  >
                    <h3 style={{ margin: 0, fontSize: "14pt" }}>
                      {dia}{" "}
                      <span style={{ fontSize: "11pt", fontWeight: "normal" }}>
                        ({sem})
                      </span>
                    </h3>
                    <span style={{ fontWeight: "bold", fontSize: "14pt" }}>{hora}</span>
                  </div>

                  {mass.name && (
                    <div
                      style={{
                        fontStyle: "italic",
                        marginBottom: "8px",
                        fontSize: "12pt",
                      }}
                    >
                      {mass.name}
                    </div>
                  )}

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: "10px",
                    }}
                  >
                    {FUNCOES.map((funcao) => {
                      const serva = mass.signups.find((s) => s.role === funcao);
                      return (
                        <div key={funcao} style={{ fontSize: "12pt" }}>
                          <span style={{ fontWeight: "bold" }}>{funcao}:</span>{" "}
                          {serva ? serva.user.name : "___________"}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Footer */}
          <div
            style={{
              marginTop: "50px",
              textAlign: "center",
              fontSize: "10pt",
              color: "#666",
            }}
          >
            <p>"Tudo é grande quando feito por amor."</p>
          </div>
        </div>
      </div>
    </div>
  );
}
