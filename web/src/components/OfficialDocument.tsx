import { Mass } from "../types/types";
import { Flower, ArrowLeft } from "lucide-react";

interface OfficialDocumentProps {
  masses: Mass[];
  onBack?: () => void; // Opcional, pois o UserPanel não passa essa função
}

export function OfficialDocument({ masses, onBack }: OfficialDocumentProps) {
  
  // --- FILTRO NOVO ---
  // Só mostramos missas que tenham pelo menos UMA serva inscrita.
  // Isso remove do PDF aquelas datas futuras que ainda estão vazias.
  const missasComEscala = masses.filter(mass => mass.signups.length > 0);

  // Ordenar por data (garantia extra)
  const missasOrdenadas = missasComEscala.sort((a, b) => 
    new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="document-container" style={{ padding: "20px", maxWidth: "800px", margin: "0 auto", fontFamily: "Times New Roman, serif" }}>
      
      {/* Botões de Ação (Não saem na impressão) */}
      <div className="no-print" style={{ display: "flex", justifyContent: "space-between", marginBottom: "20px" }}>
        {onBack && (
          <button onClick={onBack} style={{ display: "flex", alignItems: "center", gap: "5px", background: "none", border: "1px solid #ccc", padding: "8px 15px", borderRadius: "5px", cursor: "pointer" }}>
            <ArrowLeft size={16} /> Voltar
          </button>
        )}
        <button onClick={handlePrint} style={{ background: "#e91e63", color: "white", border: "none", padding: "10px 20px", borderRadius: "5px", cursor: "pointer", fontWeight: "bold" }}>
          🖨️ Imprimir / Salvar PDF
        </button>
      </div>

      {/* Cabeçalho do Documento */}
      <div style={{ textAlign: "center", borderBottom: "2px solid #333", paddingBottom: "20px", marginBottom: "30px" }}>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: "10px", color: "#e91e63" }}>
          <Flower size={40} strokeWidth={1.5} />
        </div>
        <h1 style={{ margin: "0", fontSize: "24px", textTransform: "uppercase" }}>Escala das Servas</h1>
        <p style={{ margin: "5px 0 0 0", fontSize: "14px", color: "#666" }}>Santuário Diocesano Nossa Senhora da Natividade</p>
        <p style={{ margin: "5px 0 0 0", fontSize: "12px", fontStyle: "italic" }}>Gerado em: {new Date().toLocaleDateString("pt-BR")}</p>
      </div>

      {/* Tabela de Escala */}
      {missasOrdenadas.length === 0 ? (
        <p style={{ textAlign: "center", color: "#666", fontStyle: "italic", marginTop: "50px" }}>
          Nenhuma escala definida com servas inscritas para este período.
        </p>
      ) : (
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px" }}>
          <thead>
            <tr style={{ background: "#f5f5f5", borderBottom: "2px solid #999" }}>
              <th style={{ padding: "10px", textAlign: "left", width: "20%" }}>DATA</th>
              <th style={{ padding: "10px", textAlign: "left", width: "15%" }}>HORA</th>
              <th style={{ padding: "10px", textAlign: "left", width: "65%" }}>EQUIPE</th>
            </tr>
          </thead>
          <tbody>
            {missasOrdenadas.map((mass) => {
              // Agrupar servas por função para exibição organizada
              const funcoes: Record<string, string[]> = {};
              
              // Ordena as inscrições: Primeiro quem tem função definida, depois as auxiliares
              const inscricoesOrdenadas = [...mass.signups].sort((a, b) => {
                 if (a.role && !b.role) return -1;
                 if (!a.role && b.role) return 1;
                 return 0;
              });

              inscricoesOrdenadas.forEach(s => {
                const role = s.role || "Auxiliar";
                if (!funcoes[role]) funcoes[role] = [];
                funcoes[role].push(s.user.name);
              });

              return (
                <tr key={mass.id} style={{ borderBottom: "1px solid #ddd" }}>
                  <td style={{ padding: "12px 10px", verticalAlign: "top" }}>
                    <strong>{new Date(mass.date).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })}</strong>
                    <div style={{ fontSize: "12px", color: "#666", textTransform: "uppercase" }}>
                      {new Date(mass.date).toLocaleDateString("pt-BR", { weekday: "long" })}
                    </div>
                  </td>
                  <td style={{ padding: "12px 10px", verticalAlign: "top" }}>
                    {new Date(mass.date).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                  </td>
                  <td style={{ padding: "12px 10px" }}>
                    {Object.entries(funcoes).map(([cargo, nomes]) => (
                      <div key={cargo} style={{ marginBottom: "4px" }}>
                        <span style={{ fontWeight: "bold", color: "#e91e63", marginRight: "5px" }}>{cargo}:</span>
                        <span>{nomes.join(", ")}</span>
                      </div>
                    ))}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}

      {/* Rodapé */}
      <div style={{ marginTop: "50px", textAlign: "center", fontSize: "12px", color: "#999", borderTop: "1px solid #eee", paddingTop: "20px" }}>
        <p>"Servir com alegria"</p>
      </div>

      {/* CSS para Impressão (Oculta botões e ajusta margens) */}
      <style>{`
        @media print {
          @page { margin: 2cm; }
          body { -webkit-print-color-adjust: exact; }
          .no-print { display: none !important; }
          .document-container { width: 100% !important; max-width: none !important; padding: 0 !important; margin: 0 !important; }
        }
      `}</style>
    </div>
  );
}