import { Mass } from "../types/types";
import { Flower, ArrowLeft, Calendar, Clock } from "lucide-react";
import { theme } from "../theme/theme";

interface OfficialDocumentProps {
  masses: Mass[];
  onBack?: () => void;
}

export function OfficialDocument({ masses, onBack }: OfficialDocumentProps) {
  // --- FILTRO DE SEGURANÇA E RESERVA ---
  const missasValidas = masses.filter((mass) => {
    // 1. Filtra APENAS CONFIRMADAS para saber se a missa deve aparecer
    // (Ignora quem está na reserva na contagem)
    const confirmadas = mass.signups
      ? mass.signups.filter((s: any) => s.status !== "RESERVA")
      : [];

    const temInscritas = confirmadas.length > 0;

    // 2. Está publicada? (Ignora Rascunhos)
    const estaPublicada = mass.published;

    // 3. É futura? (Ignora o que já passou)
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const dataMissa = new Date(mass.date);
    const ehFutura = dataMissa >= hoje;

    return temInscritas && estaPublicada && ehFutura;
  });

  // Ordena por data
  const missasOrdenadas = missasValidas.sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
  );

  const handlePrint = () => {
    window.print();
  };

  // --- REGRA DE PRIORIDADE DAS FUNÇÕES ---
  const getRolePriority = (role: string) => {
    const normalized = role
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");

    if (normalized.includes("cerimoniaria")) return 1;
    if (normalized.includes("librifera")) return 2;
    // Auxiliar e qualquer outra coisa ficam por último
    return 99;
  };

  return (
    <div
      className="document-container"
      style={{
        padding: "20px",
        maxWidth: "800px",
        margin: "10px auto",
        backgroundColor: "white",
        boxShadow: theme.colors.shadowBase,
        fontFamily: "'Georgia', 'Times New Roman', serif",
        color: theme.colors.textMain,
      }}
    >
      {/* Botões (Não saem na impressão) */}
      <div
        className="no-print"
        style={{ display: "flex", justifyContent: "space-between", marginBottom: "30px" }}
      >
        {onBack && (
          <button
            onClick={onBack}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              background: "white",
              border: `1px solid ${theme.colors.borderDark}`,
              padding: "10px 20px",
              borderRadius: "8px",
              cursor: "pointer",
              color: theme.colors.textSecondary,
              fontWeight: "500",
              boxShadow: "0 2px 5px rgba(0,0,0,0.05)",
            }}
          >
            <ArrowLeft size={18} /> Voltar
          </button>
        )}
        <button
          onClick={handlePrint}
          style={{
            background: theme.colors.primary,
            color: "white",
            border: "none",
            padding: "12px 25px",
            borderRadius: "8px",
            cursor: "pointer",
            fontWeight: "bold",
            boxShadow: theme.colors.shadowPrimary,
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          🖨️ Baixar em PDF
        </button>
      </div>

      {/* CABEÇALHO */}
      <div style={{ textAlign: "center", marginBottom: "30px" }}>
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: "60px",
            height: "60px",
            backgroundColor: "rgba(92,64,51,0.10)",
            borderRadius: "50%",
            marginBottom: "10px",
            color: theme.colors.primary,
          }}
        >
          <Flower size={32} strokeWidth={2} />
        </div>

        <h1
          style={{
            margin: "0",
            fontSize: "22px",
            color: theme.colors.primary,
            textTransform: "uppercase",
            letterSpacing: "1px",
            fontWeight: "normal",
          }}
        >
          Escala de Servas
        </h1>
        <div
          style={{
            height: "3px",
            width: "50px",
            backgroundColor: theme.colors.primary,
            margin: "10px auto",
            borderRadius: "2px",
          }}
        ></div>
        <h2
          style={{ margin: "5px 0", fontSize: "14px", fontWeight: "bold", color: theme.colors.textMain }}
        >
          Santuário Diocesano Nossa Senhora da Natividade
        </h2>
        <p
          style={{
            margin: "5px 0 0 0",
            fontSize: "12px",
            color: theme.colors.textMuted,
            fontStyle: "italic",
          }}
        >
          Documento gerado em: {new Date().toLocaleDateString("pt-BR")}
        </p>
      </div>

      {missasOrdenadas.length === 0 ? (
        <div
          style={{
            textAlign: "center",
            padding: "60px 20px",
            backgroundColor: "#f9f9f9",
            borderRadius: "12px",
            border: "1px dashed #ccc",
          }}
        >
          <p style={{ color: "#888", fontStyle: "italic", fontSize: "16px" }}>
            Nenhuma escala pública confirmada para este período.
          </p>
        </div>
      ) : (
        <table
          style={{
            width: "100%",
            borderCollapse: "separate",
            borderSpacing: "0",
            borderRadius: "12px",
            overflow: "hidden",
            border: "1px solid #e0e0e0",
          }}
        >
          <thead>
            <tr style={{ backgroundColor: "#5C4033", color: "#FDFBF7" }}>
              <th
                style={{
                  padding: "12px 10px",
                  textAlign: "left",
                  width: "35%",
                  fontWeight: "bold",
                  fontSize: "12px",
                  letterSpacing: "0.5px",
                  borderRight: "1px solid rgba(255,255,255,0.2)",
                }}
              >
                DATA / HORA
              </th>
              <th
                style={{
                  padding: "12px 10px",
                  textAlign: "left",
                  width: "65%",
                  fontWeight: "bold",
                  fontSize: "12px",
                  letterSpacing: "0.5px",
                }}
              >
                EQUIPE LITÚRGICA
              </th>
            </tr>
          </thead>
          <tbody>
            {missasOrdenadas.map((mass, index) => {
              const funcoes: Record<string, string[]> = {};

              // --- FILTRO CRUCIAL: PEGA APENAS QUEM NÃO É RESERVA ---
              const servasConfirmadas = mass.signups.filter(
                (s: any) => s.status !== "RESERVA",
              );

              // Agrupa as servas
              servasConfirmadas.forEach((s) => {
                const role = s.role || "Auxiliar";
                if (!funcoes[role]) funcoes[role] = [];

                // Adiciona o ícone se for substituição
                const nomeFormatado = (s as any).isSubstitution
                  ? `${s.user.name} (Subst.)`
                  : s.user.name;

                funcoes[role].push(nomeFormatado);
              });

              // Ordena cargos
              const cargosOrdenados = Object.keys(funcoes).sort((a, b) => {
                return getRolePriority(a) - getRolePriority(b);
              });

              const rowBg = index % 2 === 0 ? "#ffffff" : "#FAF7F2";
              const massName = (mass as Mass & { name?: string }).name;

              return (
                <tr key={mass.id} style={{ backgroundColor: rowBg }}>
                  <td
                    style={{
                      padding: "15px 10px",
                      verticalAlign: "middle",
                      borderBottom: `1px solid ${theme.colors.border}`,
                      borderRight: `1px solid ${theme.colors.border}`,
                    }}
                  >
                    {massName && (
                      <div
                        style={{
                          marginBottom: "10px",
                          paddingBottom: "8px",
                          borderBottom: `1px dashed ${theme.colors.borderDark}`,
                          color: theme.colors.primary,
                          fontWeight: "bold",
                          fontSize: "10px",
                          lineHeight: "1.2",
                          textTransform: "uppercase",
                        }}
                      >
                        {massName}
                      </div>
                    )}

                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "5px",
                        marginBottom: "4px",
                        color: theme.colors.textMain,
                        fontWeight: "bold",
                        fontSize: "15px",
                      }}
                    >
                      <Calendar size={16} color={theme.colors.primary} />
                      {new Date(mass.date).toLocaleDateString("pt-BR", {
                        day: "2-digit",
                        month: "2-digit",
                      })}
                    </div>

                    <div
                      style={{
                        fontSize: "10px",
                        color: theme.colors.textSecondary,
                        textTransform: "uppercase",
                        marginBottom: "12px",
                        paddingLeft: "21px",
                      }}
                    >
                      {new Date(mass.date).toLocaleDateString("pt-BR", {
                        weekday: "long",
                      })}
                    </div>

                    <div
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "6px",
                        color: theme.colors.primary,
                        fontWeight: "900",
                        fontSize: "14px",
                        backgroundColor: "rgba(92,64,51,0.08)",
                        padding: "6px 12px",
                        borderRadius: "6px",
                        border: "1px solid rgba(92,64,51,0.20)",
                      }}
                    >
                      <Clock size={14} strokeWidth={2.5} />
                      {new Date(mass.date).toLocaleTimeString("pt-BR", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                  </td>

                  <td
                    style={{
                      padding: "15px 10px",
                      verticalAlign: "middle",
                      borderBottom: `1px solid ${theme.colors.border}`,
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        flexWrap: "wrap",
                        gap: "15px",
                        alignItems: "flex-start",
                      }}
                    >
                      {cargosOrdenados.map((cargo) => (
                        <div key={cargo} style={{ minWidth: "100px" }}>
                          <div
                            style={{
                              fontSize: "12px",
                              textTransform: "uppercase",
                              fontWeight: "bold",
                              color: theme.colors.primary,
                              marginBottom: "2px",
                              letterSpacing: "0.5px",
                            }}
                          >
                            {cargo}
                          </div>
                          <div
                            style={{
                              fontSize: "15px",
                              color: theme.colors.textMain,
                              lineHeight: "1.3",
                            }}
                          >
                            {funcoes[cargo].join(", ")}
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
      <div style={{ marginTop: "40px", textAlign: "center" }}>
        <p
          style={{
            fontSize: "14px",
            fontStyle: "italic",
            color: theme.colors.primary,
            fontWeight: "bold",
            fontFamily: "cursive",
          }}
        >
          "Servir com alegria"
        </p>
        <div
          style={{ width: "100%", borderTop: "1px solid #eee", marginTop: "15px" }}
        ></div>
      </div>

      <style>{`
        @media print {
          @page { margin: 1cm; size: A4; }
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
          th { background-color: #5C4033 !important; color: #FDFBF7 !important; }
          tr:nth-child(even) { background-color: #FAF7F2 !important; }
        }
        @media screen and (max-width: 480px) {
          .document-container { padding: 10px !important; }
          h1 { fontSize: 18px !important; }
          td, th { padding: 8px 5px !important; }
        }
      `}</style>
    </div>
  );
}
