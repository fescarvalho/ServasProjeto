import { useState, useMemo, useRef } from "react";
import { Mass } from "../types/types";
import { X, Trophy, Medal, Calendar, Crown, Share2 } from "lucide-react";
import { theme } from "../theme/theme";
import { calculateRanking } from "../utils/ranking.utils";
import html2canvas from "html2canvas";

interface RankingModalProps {
  masses: Mass[];
  onClose: () => void;
}

export function RankingModal({ masses, onClose }: RankingModalProps) {
  const rankingRef = useRef<HTMLDivElement>(null);
  const [isSharing, setIsSharing] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const months = [
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

  const ranking = useMemo(() => {
    return calculateRanking(masses, selectedMonth, selectedYear);
  }, [masses, selectedMonth, selectedYear]);

  const handleShare = async () => {
    if (!rankingRef.current) return;
    setIsSharing(true);

    setTimeout(async () => {
      try {
        const canvas = await html2canvas(rankingRef.current!, {
          backgroundColor: "#ffffff",
          scale: 2,
          logging: false,
          useCORS: true,
        });

        canvas.toBlob(async (blob) => {
          if (!blob) {
            setIsSharing(false);
            return;
          }

          const file = new File([blob], `ranking-${months[selectedMonth]}-${selectedYear}.png`, { type: "image/png" });

          if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
            try {
              await navigator.share({
                files: [file],
                title: `Ranking de Pontos - ${months[selectedMonth]}/${selectedYear}`,
                text: `Confira o nosso ranking de presenças de ${months[selectedMonth]}! 🌹✨`
              });
            } catch (shareError) {
              console.log("Share cancelled or failed", shareError);
              downloadFallback(canvas);
            }
          } else {
            downloadFallback(canvas);
          }
          setIsSharing(false);
        }, "image/png");
      } catch (error) {
        console.error("Error sharing ranking:", error);
        alert("Erro ao gerar imagem do ranking.");
        setIsSharing(false);
      }
    }, 100);
  };

  const downloadFallback = (canvas: HTMLCanvasElement) => {
    const link = document.createElement('a');
    link.download = `ranking-${months[selectedMonth]}-${selectedYear}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
    if (!/Android|iPhone/i.test(navigator.userAgent)) {
      alert("Ranking baixado! Agora você pode enviar no WhatsApp.");
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0,0,0,0.6)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 1000,
        backdropFilter: "blur(3px)",
      }}
    >
      <div
        style={{
          backgroundColor: theme.colors.background,
          width: "90%",
          maxWidth: "450px",
          borderRadius: "20px",
          padding: "0",
          position: "relative",
          maxHeight: "85vh",
          boxShadow: theme.colors.shadowBase,
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* BOTÕES DE AÇÃO SUPERIORES */}
        <div style={{ position: "absolute", top: 15, right: 15, zIndex: 100, display: "flex", gap: "10px" }}>
          <button
            onClick={handleShare}
            disabled={isSharing}
            style={{
              background: "rgba(255,255,255,0.25)",
              border: "none",
              borderRadius: "10px",
              padding: "4px 8px",
              cursor: "pointer",
              color: "white",
              display: "flex",
              alignItems: "center",
              gap: "5px",
              fontSize: "0.75rem",
              fontWeight: "bold",
              backdropFilter: "blur(5px)"
            }}
          >
            <Share2 size={14} /> {isSharing ? "..." : "Compartilhar"}
          </button>
          <button
            onClick={onClose}
            style={{
              background: "rgba(255,255,255,0.25)",
              border: "none",
              borderRadius: "50%",
              width: 32,
              height: 32,
              cursor: "pointer",
              color: "white",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              backdropFilter: "blur(5px)"
            }}
          >
            <X size={20} />
          </button>
        </div>

        <div ref={rankingRef} style={{ background: "#fff", display: "flex", flexDirection: "column", borderRadius: "20px", overflow: "hidden" }}>
          {/* HEADER ROSA */}
          <div
            style={{
              background: theme.colors.primaryGradient,
              padding: "25px 20px 40px 20px",
              color: "white",
              textAlign: "center",
              position: "relative",
              zIndex: 1,
            }}
          >
            <Crown
              size={36}
              fill="rgba(255,255,255,0.2)"
              stroke="#fff"
              strokeWidth={1.5}
              style={{ marginBottom: 8 }}
            />

            <h2
              style={{
                margin: 0,
                fontSize: "1.6rem",
                fontWeight: "800",
                letterSpacing: "-0.5px",
                color: "#fff",
              }}
            >
              Ranking das Servas
            </h2>
            <p style={{ margin: "5px 0 0 0", fontSize: "0.9rem", opacity: 0.9 }}>
              {months[selectedMonth]} {selectedYear}
            </p>
          </div>

          {/* FILTROS FLUTUANTES (apenas no modo visual, escondemos no print se quiser, mas aqui vamos manter) */}
          <div
            className="no-print-area"
            style={{
              marginTop: "-20px",
              display: "flex",
              gap: "10px",
              justifyContent: "center",
              padding: "0 20px",
              marginBottom: "15px",
              position: "relative",
              zIndex: 10,
            }}
          >
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              style={{
                padding: "8px 15px",
                borderRadius: "20px",
                border: "none",
                fontSize: "0.9rem",
                fontWeight: "bold",
                color: theme.colors.primary,
                backgroundColor: "white",
                boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                flex: 1,
                cursor: "pointer",
                outline: "none",
              }}
            >
              {months.map((m, index) => (
                <option key={index} value={index}>
                  {m}
                </option>
              ))}
            </select>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              style={{
                padding: "8px 15px",
                borderRadius: "20px",
                border: "none",
                fontSize: "0.9rem",
                fontWeight: "bold",
                color: theme.colors.primary,
                backgroundColor: "white",
                boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                width: "80px",
                cursor: "pointer",
                outline: "none",
              }}
            >
              <option value={2025}>2025</option>
              <option value={2026}>2026</option>
            </select>
          </div>

          {/* CONTEÚDO LISTA */}
          <div style={{ padding: "0 20px 20px 20px", overflowY: "auto", maxHeight: "50vh" }}>
            {ranking.length === 0 ? (
              <div style={{ textAlign: "center", padding: "40px 20px", color: "#aaa" }}>
                <Calendar
                  size={48}
                  strokeWidth={1}
                  style={{ opacity: 0.3, marginBottom: 10 }}
                />
                <p>Nenhuma pontuação registrada neste mês ainda.</p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {ranking.map((serva, index) => {
                  let cardStyle: React.CSSProperties = {
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "12px 15px",
                    borderRadius: "16px",
                    backgroundColor: "#fff",
                    boxShadow: "0 2px 6px rgba(0,0,0,0.04)",
                    border: "1px solid #f0f0f0",
                  };

                  let rankBadge;
                  let scoreColor = theme.colors.primary;

                  if (index === 0) {
                    cardStyle = { ...cardStyle, background: "#fff9c4", border: "1px solid #fbc02d" };
                    scoreColor = "#f57f17";
                    rankBadge = <Trophy size={20} color="#fbc02d" fill="#fbc02d" />;
                  } else if (index === 1) {
                    rankBadge = <Medal size={20} color="#9e9e9e" fill="#e0e0e0" />;
                  } else if (index === 2) {
                    rankBadge = <Medal size={20} color="#8d6e63" fill="#d7ccc8" />;
                  } else {
                    rankBadge = <span style={{ fontWeight: "bold", color: "#bbb", width: "20px", textAlign: "center", fontSize: "0.8rem" }}>{index + 1}º</span>;
                  }

                  return (
                    <div key={index} style={cardStyle}>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <div style={{ width: "24px", display: "flex", justifyContent: "center" }}>{rankBadge}</div>
                        <span style={{ fontWeight: "700", color: "#333", fontSize: "0.9rem" }}>{serva.name}</span>
                      </div>
                      <div style={{ background: scoreColor + "15", color: scoreColor, padding: "3px 10px", borderRadius: "12px", fontWeight: "800", fontSize: "0.9rem" }}>
                        {serva.score} <span style={{ fontSize: "0.6rem" }}>PTS</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <div style={{ marginTop: "20px", textAlign: "center", fontSize: "0.65rem", color: "#ccc", fontStyle: "italic" }}>
              Gerado por Aplicativo Servas • {new Date().toLocaleDateString()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

