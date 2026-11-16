import { useState, useMemo, useRef } from "react";
import { Mass } from "../types/types";
import { X, Trophy, Medal, Calendar, Crown, Share2, CheckCircle2, MapPin, ReceiptText } from "lucide-react";
import { theme } from "../theme/theme";
import { calculateRanking, getMassPoints, ServaRanking } from "../utils/ranking.utils";
import { formatRole, getUserGender } from "../constants/roles";
import html2canvas from "html2canvas";

interface RankingModalProps {
  masses: Mass[];
  onClose: () => void;
  currentUserId?: string;
  currentUserName?: string;
}

export function RankingModal({ masses, onClose, currentUserId, currentUserName }: RankingModalProps) {
  const rankingRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const [isSharing, setIsSharing] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedServa, setSelectedServa] = useState<ServaRanking | null>(null);

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

  const selectedServaScales = useMemo(() => {
    if (!selectedServa) return [];
    return masses
      .filter((m) => {
        const d = new Date(m.date);
        const brDate = new Date(d.toLocaleString("en-US", { timeZone: "America/Sao_Paulo" }));
        return (
          brDate.getMonth() === selectedMonth &&
          brDate.getFullYear() === selectedYear &&
          m.signups.some((s) => s.userId === selectedServa.id && s.present)
        );
      })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .map((m) => {
        const signup = m.signups.find((s) => s.userId === selectedServa.id && s.present)!;
        const points = m.points !== undefined && m.points !== null ? m.points : getMassPoints(m.date);
        return { mass: m, signup, points };
      });
  }, [masses, selectedMonth, selectedYear, selectedServa]);

  const handleShare = async () => {
    if (!rankingRef.current) return;
    setIsSharing(true);

    // Remove scroll limit so html2canvas captures the full list
    const listEl = listRef.current;
    const prevMaxHeight = listEl?.style.maxHeight ?? "";
    const prevOverflow = listEl?.style.overflowY ?? "";
    if (listEl) {
      listEl.style.maxHeight = "none";
      listEl.style.overflowY = "visible";
    }

    // Small delay to let the DOM reflow before capture
    setTimeout(async () => {
      try {
        const canvas = await html2canvas(rankingRef.current!, {
          backgroundColor: "#ffffff",
          scale: 2,
          logging: false,
          useCORS: true,
          windowHeight: rankingRef.current!.scrollHeight + 200,
          height: rankingRef.current!.scrollHeight,
        });

        // Restore scroll limit
        if (listEl) {
          listEl.style.maxHeight = prevMaxHeight;
          listEl.style.overflowY = prevOverflow;
        }

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
                text: `Confira o nosso ranking de presenças de ${months[selectedMonth]}! 🕊️✨`
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
        // Restore on error too
        if (listEl) {
          listEl.style.maxHeight = prevMaxHeight;
          listEl.style.overflowY = prevOverflow;
        }
        console.error("Error sharing ranking:", error);
        alert("Erro ao gerar imagem do ranking.");
        setIsSharing(false);
      }
    }, 150);
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
              Ranking Mensal
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

          {!isSharing && (currentUserId || ranking.length > 0) && (
            <div style={{ padding: "0 20px 10px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
              <span style={{ fontSize: "0.72rem", color: "#8C7360", fontWeight: 600 }}>
                {currentUserId ? "Toque no seu nome para ver seu extrato de pontos" : "Toque em um nome para ver o extrato de pontos"}
              </span>
              {currentUserId && (
                <button
                  type="button"
                  onClick={() => {
                    const found = ranking.find((r) => r.id === currentUserId);
                    setSelectedServa(
                      found || {
                        id: currentUserId,
                        name: currentUserName || "Minhas Pontuações",
                        score: 0,
                        countSpecial: 0,
                        countNormal: 0,
                      }
                    );
                  }}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "5px",
                    padding: "5px 10px",
                    borderRadius: "10px",
                    border: `1px solid ${theme.colors.border}`,
                    background: "#FAF8F5",
                    color: theme.colors.primary,
                    fontSize: "0.73rem",
                    fontWeight: 800,
                    cursor: "pointer",
                  }}
                >
                  <ReceiptText size={13} />
                  <span>Meu Extrato</span>
                </button>
              )}
            </div>
          )}

          {/* CONTEÚDO LISTA */}
          <div ref={listRef} style={{ padding: "0 20px 20px 20px", overflowY: "auto", maxHeight: "50vh" }}>
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

                  const isCurrentUser = Boolean(currentUserId && serva.id === currentUserId);
                  const canViewExtract = !currentUserId || isCurrentUser;

                  return (
                    <div
                      key={serva.id || index}
                      onClick={() => canViewExtract && setSelectedServa(serva)}
                      title={canViewExtract ? "Clique para ver o extrato de pontuações" : undefined}
                      style={{
                        ...cardStyle,
                        cursor: canViewExtract ? "pointer" : "default",
                        ...(isCurrentUser && !isSharing
                          ? { borderColor: "#B8925A", boxShadow: "0 2px 10px rgba(184, 146, 90, 0.22)" }
                          : {}),
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: 0 }}>
                        <div style={{ width: "24px", display: "flex", justifyContent: "center", flexShrink: 0 }}>{rankBadge}</div>
                        <span
                          style={{
                            fontWeight: "700",
                            color: "#333",
                            fontSize: "0.9rem",
                            textDecoration: canViewExtract && !isSharing ? "underline" : "none",
                            textDecorationColor: "rgba(184, 146, 90, 0.45)",
                            textUnderlineOffset: "3px",
                          }}
                        >
                          {serva.name}
                        </span>
                        {isCurrentUser && !isSharing && (
                          <span style={{ background: "#FEF3C7", color: "#92400E", border: "1px solid #FDE68A", padding: "1px 6px", borderRadius: "6px", fontSize: "0.65rem", fontWeight: 800 }}>
                            Você
                          </span>
                        )}
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
              Gerado por Servos do Altar • {new Date().toLocaleDateString()}
            </div>
          </div>
        </div>
      </div>

      {/* SUBMODAL: ESCALAS CONFIRMADAS DO SERVO */}
      {selectedServa && (
        <div
          onClick={() => setSelectedServa(null)}
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0,0,0,0.5)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 1100,
            padding: "16px",
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: "#fff",
              width: "100%",
              maxWidth: "390px",
              borderRadius: "18px",
              overflow: "hidden",
              boxShadow: "0 20px 50px rgba(0,0,0,0.28)",
              border: `1px solid ${theme.colors.border}`,
              display: "flex",
              flexDirection: "column",
              maxHeight: "75vh",
            }}
          >
            <div
              style={{
                background: theme.colors.primaryGradient,
                color: "#fff",
                padding: "14px 16px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: "10px",
              }}
            >
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: "0.06em", opacity: 0.85, fontWeight: 700 }}>
                  Extrato de Pontuação
                </div>
                <div style={{ fontWeight: 800, fontSize: "1rem", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {selectedServa.name}
                </div>
                <div style={{ fontSize: "0.75rem", opacity: 0.9 }}>
                  {months[selectedMonth]} {selectedYear} • {selectedServaScales.length} {selectedServaScales.length === 1 ? "escala confirmada" : "escalas confirmadas"} • <strong>{selectedServa.score} pts</strong>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedServa(null)}
                style={{
                  background: "rgba(255,255,255,0.22)",
                  border: "none",
                  borderRadius: "50%",
                  width: 28,
                  height: 28,
                  cursor: "pointer",
                  color: "#fff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <X size={16} />
              </button>
            </div>

            <div style={{ padding: "14px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "8px", background: "#FAF8F5" }}>
              {selectedServaScales.length === 0 ? (
                <div style={{ textAlign: "center", padding: "24px 10px", color: "#888", fontSize: "0.85rem" }}>
                  Nenhuma escala confirmada encontrada neste mês.
                </div>
              ) : (
                selectedServaScales.map(({ mass, signup, points }) => {
                  const brDate = new Date(mass.date).toLocaleDateString("pt-BR", {
                    timeZone: "America/Sao_Paulo",
                    weekday: "short",
                    day: "2-digit",
                    month: "2-digit",
                  });
                  const brTime =
                    mass.time ||
                    new Date(mass.date).toLocaleTimeString("pt-BR", {
                      timeZone: "America/Sao_Paulo",
                      hour: "2-digit",
                      minute: "2-digit",
                    });
                  const gender = getUserGender(selectedServa.id, selectedServa.name);
                  const roleLabel = signup.role ? formatRole(signup.role, gender) : "Auxiliar";

                  return (
                    <div
                      key={mass.id}
                      style={{
                        background: "#fff",
                        border: "1px solid #E5DEC9",
                        borderRadius: "12px",
                        padding: "10px 12px",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        gap: "10px",
                      }}
                    >
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px", fontWeight: 800, fontSize: "0.82rem", color: "#23170F" }}>
                          <CheckCircle2 size={14} color="#16A34A" style={{ flexShrink: 0 }} />
                          <span style={{ textTransform: "capitalize" }}>{brDate}</span>
                          <span>• {brTime}</span>
                        </div>
                        <div style={{ fontSize: "0.78rem", color: "#5A4332", fontWeight: 600, marginTop: "2px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {mass.name || "Santa Missa"}
                        </div>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", alignItems: "center", marginTop: "4px" }}>
                          <span style={{ background: "#F7F5F0", color: theme.colors.primary, border: `1px solid ${theme.colors.border}`, padding: "1px 6px", borderRadius: "6px", fontSize: "0.68rem", fontWeight: 700 }}>
                            {roleLabel}
                          </span>
                          {mass.local && (
                            <span style={{ fontSize: "0.68rem", color: "#6B7280", display: "inline-flex", alignItems: "center", gap: "2px" }}>
                              <MapPin size={10} /> {mass.local}
                            </span>
                          )}
                        </div>
                      </div>
                      <div
                        style={{
                          background: "#DCFCE7",
                          color: "#166534",
                          padding: "3px 8px",
                          borderRadius: "10px",
                          fontSize: "0.72rem",
                          fontWeight: 800,
                          whiteSpace: "nowrap",
                        }}
                      >
                        +{points} {points === 1 ? "pt" : "pts"}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

