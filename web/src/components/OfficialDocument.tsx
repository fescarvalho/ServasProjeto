import { Mass } from "../types/types";
import { Flower, ArrowLeft, Calendar, Clock } from "lucide-react";

interface OfficialDocumentProps {
  masses: Mass[];
  onBack?: () => void;
}

export function OfficialDocument({ masses, onBack }: OfficialDocumentProps) {
  
  // --- FILTRO ---
  const missasComEscala = masses.filter(mass => {
    return mass.signups && mass.signups.length > 0;
  });

  const missasOrdenadas = missasComEscala.sort((a, b) => 
    new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="document-container" style={{ 
      padding: "40px", 
      maxWidth: "800px", 
      margin: "20px auto", 
      backgroundColor: "white",
      boxShadow: "0 10px 30px rgba(0,0,0,0.1)", 
      fontFamily: "'Georgia', 'Times New Roman', serif", 
      color: "#444"
    }}>
      
      {/* Botões (Não saem na impressão) */}
      <div className="no-print" style={{ display: "flex", justifyContent: "space-between", marginBottom: "40px" }}>
        {onBack && (
          <button onClick={onBack} style={{ display: "flex", alignItems: "center", gap: "8px", background: "white", border: "1px solid #ddd", padding: "10px 20px", borderRadius: "8px", cursor: "pointer", color: "#666", fontWeight: "500", boxShadow: "0 2px 5px rgba(0,0,0,0.05)" }}>
            <ArrowLeft size={18} /> Voltar
          </button>
        )}
        <button onClick={handlePrint} style={{ background: "#e91e63", color: "white", border: "none", padding: "12px 25px", borderRadius: "8px", cursor: "pointer", fontWeight: "bold", boxShadow: "0 4px 10px rgba(233, 30, 99, 0.3)", display: "flex", alignItems: "center", gap: "8px" }}>
          🖨️ Imprimir PDF
        </button>
      </div>

      {/* CABEÇALHO */}
      <div style={{ textAlign: "center", marginBottom: "40px" }}>
        <div style={{ 
          display: "inline-flex", alignItems: "center", justifyContent: "center", 
          width: "70px", height: "70px", backgroundColor: "#fce4ec", 
          borderRadius: "50%", marginBottom: "15px", color: "#e91e63" 
        }}>
          <Flower size={36} strokeWidth={2} />
        </div>
        
        <h1 style={{ margin: "0", fontSize: "26px", color: "#e91e63", textTransform: "uppercase", letterSpacing: "1px", fontWeight: "normal" }}>
          Escala das Servas
        </h1>
        <div style={{ height: "3px", width: "60px", backgroundColor: "#e91e63", margin: "15px auto", borderRadius: "2px" }}></div>
        <h2 style={{ margin: "5px 0", fontSize: "16px", fontWeight: "bold", color: "#333" }}>
          Santuário Diocesano Nossa Senhora da Natividade
        </h2>
        <p style={{ margin: "5px 0 0 0", fontSize: "13px", color: "#888", fontStyle: "italic" }}>
          Documento gerado em: {new Date().toLocaleDateString("pt-BR")}
        </p>
      </div>

      {missasOrdenadas.length === 0 ? (
        <div style={{ textAlign: "center", padding: "60px 20px", backgroundColor: "#f9f9f9", borderRadius: "12px", border: "1px dashed #ccc" }}>
          <p style={{ color: "#888", fontStyle: "italic", fontSize: "16px" }}>
            Nenhuma escala confirmada para este período.
          </p>
        </div>
      ) : (
        <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: "0", borderRadius: "12px", overflow: "hidden", border: "1px solid #e0e0e0" }}>
          <thead>
            <tr style={{ backgroundColor: "#e91e63", color: "white" }}>
              <th style={{ padding: "18px 20px", textAlign: "left", width: "30%", fontWeight: "bold", fontSize: "13px", letterSpacing: "0.5px", borderRight: "1px solid rgba(255,255,255,0.2)" }}>DATA / HORA</th>
              <th style={{ padding: "18px 20px", textAlign: "left", width: "70%", fontWeight: "bold", fontSize: "13px", letterSpacing: "0.5px" }}>EQUIPE LITÚRGICA</th>
            </tr>
          </thead>
          <tbody>
            {missasOrdenadas.map((mass, index) => {
              const funcoes: Record<string, string[]> = {};
              
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

              const rowBg = index % 2 === 0 ? "#ffffff" : "#fff9fc";
              const massName = (mass as any).name;

              return (
                <tr key={mass.id} style={{ backgroundColor: rowBg }}>
                  {/* Coluna 1: Informações da Missa */}
                  <td style={{ padding: "20px", verticalAlign: "middle", borderBottom: "1px solid #eee", borderRight: "1px solid #eee" }}>
                    
                    {/* NOME DA MISSA */}
                    {massName && (
                      <div style={{ 
                        marginBottom: "15px", 
                        paddingBottom: "10px", 
                        borderBottom: "1px dashed #e0e0e0", 
                        color: "#e91e63", 
                        fontWeight: "bold", 
                        fontSize: "14px",
                        lineHeight: "1.3",
                        textTransform: "uppercase"
                      }}>
                        {massName}
                      </div>
                    )}

                    {/* DATA */}
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px", color: "#333", fontWeight: "bold", fontSize: "16px" }}>
                      <Calendar size={18} color="#666" />
                      {new Date(mass.date).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })}
                    </div>
                    
                    {/* DIA DA SEMANA */}
                    <div style={{ fontSize: "13px", color: "#666", textTransform: "uppercase", marginBottom: "15px", paddingLeft: "26px" }}>
                      {new Date(mass.date).toLocaleDateString("pt-BR", { weekday: "long" })}
                    </div>
                    
                    {/* HORA COM ÊNFASE TOTAL */}
                    <div style={{ 
                      display: "inline-flex", 
                      alignItems: "center", 
                      gap: "8px", 
                      color: "#e91e63", 
                      fontWeight: "900", 
                      fontSize: "14px", 
                      backgroundColor: "#fce4ec", // Fundo rosa claro
                      padding: "8px 16px",
                      borderRadius: "8px",
                      border: "1px solid #f8bbd0"
                    }}>
                      <Clock size={18} strokeWidth={2.5} />
                      {new Date(mass.date).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                    </div>
                  </td>

                  {/* Coluna 2: Equipe */}
                  <td style={{ padding: "20px", verticalAlign: "middle", borderBottom: "1px solid #eee" }}>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px", alignItems: "center" }}>
                      {Object.entries(funcoes).map(([cargo, nomes]) => (
                        <div key={cargo}>
                          <div style={{ 
                            fontSize: "12px", 
                            textTransform: "uppercase", 
                            fontWeight: "bold", 
                            color: "#e91e63", 
                            marginBottom: "3px",
                            letterSpacing: "0.5px"
                          }}>
                            {cargo}
                          </div>
                          <div style={{ fontSize: "16px", color: "#333", lineHeight: "1.4" }}>
                            {nomes.join(", ")}
                          </div>
                        </div>
                      ))}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}

      {/* Rodapé */}
      <div style={{ marginTop: "50px", textAlign: "center" }}>
        <p style={{ fontSize: "16px", fontStyle: "italic", color: "#e91e63", fontWeight: "bold", fontFamily: "cursive" }}>"Servir com alegria"</p>
        <div style={{ width: "100%", borderTop: "1px solid #eee", marginTop: "20px" }}></div>
      </div>

      {/* Estilos de Impressão */}
      <style>{`
        @media print {
          @page { margin: 1.5cm; size: A4; }
          body { -webkit-print-color-adjust: exact; background-color: white !important; }
          .document-container { 
            box-shadow: none !important; 
            margin: 0 !important; 
            width: 100% !important; 
            max-width: 100% !important; 
            padding: 0 !important;
            border: none !important;
          }
          .no-print { display: none !important; }
          table { page-break-inside: auto; }
          tr { page-break-inside: avoid; page-break-after: auto; }
          th { background-color: #e91e63 !important; color: white !important; }
          tr:nth-child(even) { background-color: #fff9fc !important; }
        }
      `}</style>
    </div>
  );
}