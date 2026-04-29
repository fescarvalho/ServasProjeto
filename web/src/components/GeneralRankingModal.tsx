import { useRef, useState } from "react";
import { X, Trophy, Flower, Share2 } from "lucide-react";
import { Mass } from "../types/types";
import html2canvas from "html2canvas";

interface GeneralRankingModalProps {
  masses: Mass[];
  onClose: () => void;
}

export function GeneralRankingModal({ masses, onClose }: GeneralRankingModalProps) {
  const rankingRef = useRef<HTMLDivElement>(null);
  const [isSharing, setIsSharing] = useState(false);
  const scores: Record<string, number> = {};

  masses.forEach(mass => {
    mass.signups.forEach(signup => {
      // @ts-ignore
      const name = signup.user?.name || "Serva Desconhecida";
      // Só conta se o Admin deu presença (Check verde)
      if (signup.present) {
        scores[name] = (scores[name] || 0) + 1;
      }
    });
  });

  const ranking = Object.entries(scores)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);

  const getBadge = (count: number) => {
    if (count >= 15) return { icon: <Flower size={20} fill="#B71C1C" stroke="#7F0000" />, name: "Rosa de Amor", color: "#FFEBEE", border: "#B71C1C" };
    if (count >= 5) return { icon: <Flower size={20} fill="#D32F2F" />, name: "Botão de Rosa", color: "#FFF5F5", border: "#D32F2F" };
    return { icon: <Flower size={20} />, name: "Semente da Fé", color: "#e8f5e9", border: "#81c784" };
  };

  const handleShare = async () => {
    if (!rankingRef.current) return;
    setIsSharing(true);

    // Pequeno timeout para garantir que o estado de "isSharing" (se usado para esconder algo) seja refletido
    setTimeout(async () => {
      try {
        const canvas = await html2canvas(rankingRef.current!, {
          backgroundColor: "#ffffff",
          scale: 2,
          logging: false,
          useCORS: true,
          // Garante que o padding interno seja mantido
          windowWidth: rankingRef.current!.scrollWidth,
          windowHeight: rankingRef.current!.scrollHeight
        });

        canvas.toBlob(async (blob) => {
          if (!blob) {
            setIsSharing(false);
            return;
          }

          const file = new File([blob], "ranking-servas.png", { type: "image/png" });

          if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
            try {
              await navigator.share({
                files: [file],
                title: "Ranking de Pontos - Servas",
                text: "Confira o nosso ranking de presenças atualizado! 🌹✨"
              });
            } catch (shareError) {
              console.log("Share cancelled or failed", shareError);
              // Se falhar ou cancelar, tentamos o download como fallback silencioso
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
    link.download = 'ranking-servas.png';
    link.href = canvas.toDataURL("image/png");
    link.click();
    // Apenas avisa se não for mobile pois no desktop é mais comum baixar
    if (!/Android|iPhone/i.test(navigator.userAgent)) {
      alert("Ranking baixado como imagem! Agora você pode enviar no WhatsApp.");
    }
  };

  return (
    <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.6)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
      <div style={{ background: "white", width: "100%", maxWidth: "450px", borderRadius: "20px", padding: "25px", position: "relative", boxShadow: "0 10px 25px rgba(0,0,0,0.3)", maxHeight: "85vh", display: "flex", flexDirection: "column" }}>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginBottom: "10px" }} className="no-print">
          <button
            onClick={handleShare}
            disabled={isSharing}
            style={{
              background: "#e3f2fd",
              color: "#1976d2",
              border: "none",
              borderRadius: "8px",
              padding: "4px 8px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "4px",
              fontWeight: "bold",
              fontSize: "0.75rem",
              transition: "all 0.2s"
            }}
          >
            {isSharing ? "..." : <><Share2 size={14} /> Compartilhar</>}
          </button>
          <button onClick={onClose} style={{ background: "#f5f5f5", border: "none", borderRadius: "10px", padding: "8px", cursor: "pointer", color: "#666" }}><X size={20} /></button>
        </div>

        <div ref={rankingRef} style={{ background: "white", padding: "10px", borderRadius: "12px", overflowY: "auto" }}>
          <div style={{ textAlign: "center", marginBottom: "20px" }}>
            <div style={{ background: "#fff8e1", width: "60px", height: "60px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 10px auto", color: "#fbc02d" }}><Trophy size={32} /></div>
            <h2 style={{ color: "#333", margin: 0 }}>Ranking Geral</h2>
            <p style={{ color: "#666", fontSize: "0.9rem" }}>Total acumulado de presenças</p>
          </div>

          {ranking.length === 0 ? <div style={{ textAlign: "center", color: "#999", padding: "20px" }}>Nenhuma presença confirmada ainda.</div> : (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {ranking.map((item, index) => {
                const badge = getBadge(item.count);
                return (
                  <div key={item.name} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "white", border: `1px solid #eee`, padding: "10px 15px", borderRadius: "12px", boxShadow: "0 2px 5px rgba(0,0,0,0.02)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                      <span style={{ fontWeight: "bold", color: "#999", minWidth: "20px" }}>{index + 1}º</span>
                      <div>
                        <div style={{ fontWeight: "bold", color: "#333" }}>{item.name}</div>
                        <div style={{ fontSize: "0.75rem", display: "flex", alignItems: "center", gap: "4px", color: badge.border }}>{badge.icon} {badge.name}</div>
                      </div>
                    </div>
                    <div style={{ background: badge.color, color: badge.border, fontWeight: "bold", padding: "5px 10px", borderRadius: "20px", fontSize: "0.9rem" }}>{item.count}</div>
                  </div>
                );
              })}
            </div>
          )}

          <div style={{ marginTop: "20px", textAlign: "center", fontSize: "0.7rem", color: "#aaa" }}>
            Gerado por Aplicativo Servas - {new Date().toLocaleDateString()}
          </div>
        </div>
      </div>
    </div>
  );
}