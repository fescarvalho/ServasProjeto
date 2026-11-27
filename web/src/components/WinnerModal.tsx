import { useState } from "react";
import { Crown, Sparkles, X, Gift, Loader2 } from "lucide-react";
import { theme } from "../theme/theme";
import { formatServoName } from "../utils/format.utils";
import { popWinnerBalloon, PrizeClaimRecord } from "../services/api/prize.service";

interface WinnerModalProps {
    score: number;
    totalPresences?: number;
    month: number;
    year: number;
    userName: string;
    initialClaim?: PrizeClaimRecord | null;
    onClaimed?: (claim: PrizeClaimRecord) => void;
    onClose: () => void;
}

const MONTHS = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];

const BALLOON_STYLES = [
    {
        gradient: "radial-gradient(circle at 32% 28%, #FDE68A 0%, #F59E0B 48%, #B45309 100%)",
        shadow: "0 8px 16px rgba(217, 119, 6, 0.34)",
        knotColor: "#B45309",
        delay: "0s",
    },
    {
        gradient: "radial-gradient(circle at 32% 28%, #FCA5A5 0%, #DC2626 50%, #991B1B 100%)",
        shadow: "0 8px 16px rgba(185, 28, 28, 0.32)",
        knotColor: "#991B1B",
        delay: "0.2s",
    },
    {
        gradient: "radial-gradient(circle at 32% 28%, #E6C786 0%, #8C6530 52%, #4A3222 100%)",
        shadow: "0 8px 16px rgba(74, 50, 34, 0.34)",
        knotColor: "#4A3222",
        delay: "0.4s",
    },
    {
        gradient: "radial-gradient(circle at 32% 28%, #86EFAC 0%, #16A34A 50%, #166534 100%)",
        shadow: "0 8px 16px rgba(22, 163, 74, 0.3)",
        knotColor: "#166534",
        delay: "0.6s",
    },
    {
        gradient: "radial-gradient(circle at 32% 28%, #93C5FD 0%, #2563EB 50%, #1E40AF 100%)",
        shadow: "0 8px 16px rgba(37, 99, 235, 0.3)",
        knotColor: "#1E40AF",
        delay: "0.8s",
    },
    {
        gradient: "radial-gradient(circle at 32% 28%, #F9A8D4 0%, #DB2777 50%, #9D174D 100%)",
        shadow: "0 8px 16px rgba(219, 39, 119, 0.3)",
        knotColor: "#9D174D",
        delay: "0.15s",
    },
    {
        gradient: "radial-gradient(circle at 32% 28%, #C4B5FD 0%, #7C3AED 50%, #5B21B6 100%)",
        shadow: "0 8px 16px rgba(124, 58, 237, 0.3)",
        knotColor: "#5B21B6",
        delay: "0.35s",
    },
    {
        gradient: "radial-gradient(circle at 32% 28%, #FDBA74 0%, #EA580C 50%, #9A3412 100%)",
        shadow: "0 8px 16px rgba(234, 88, 12, 0.32)",
        knotColor: "#9A3412",
        delay: "0.55s",
    },
    {
        gradient: "radial-gradient(circle at 32% 28%, #5EEAD4 0%, #0D9488 50%, #115E59 100%)",
        shadow: "0 8px 16px rgba(13, 148, 136, 0.3)",
        knotColor: "#115E59",
        delay: "0.75s",
    },
    {
        gradient: "radial-gradient(circle at 32% 28%, #FDE047 0%, #CA8A04 50%, #854D0E 100%)",
        shadow: "0 8px 16px rgba(202, 138, 4, 0.34)",
        knotColor: "#854D0E",
        delay: "0.95s",
    },
];

export function WinnerModal({
    score,
    totalPresences,
    month,
    year,
    userName,
    initialClaim = null,
    onClaimed,
    onClose,
}: WinnerModalProps) {
    const monthName = MONTHS[month] || "";
    const [claim, setClaim] = useState<PrizeClaimRecord | null>(initialClaim);
    const [poppingIdx, setPoppingIdx] = useState<number | null>(null);
    const [burstingIdx, setBurstingIdx] = useState<number | null>(null);
    const [errorMsg, setErrorMsg] = useState("");

    const handlePop = async (idx: number) => {
        if (poppingIdx !== null || claim) return;
        setErrorMsg("");
        setPoppingIdx(idx);
        try {
            const result = await popWinnerBalloon(year, month, idx);
            setBurstingIdx(idx);
            setTimeout(() => {
                setClaim(result);
                setPoppingIdx(null);
                onClaimed?.(result);
            }, 380);
        } catch (err: any) {
            setPoppingIdx(null);
            setErrorMsg(err?.response?.data?.error || err?.response?.data?.message || "Erro ao estourar o balão. Tente novamente.");
        }
    };

    const otherPrizes = claim
        ? claim.allBalloons
              .map((p, idx) => ({ prize: p, idx }))
              .filter((item) => item.idx !== claim.balloonIndex)
        : [];

    return (
        <div
            style={{
                position: "fixed",
                inset: 0,
                backgroundColor: "rgba(0,0,0,0.75)",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                zIndex: 9999,
                padding: "14px",
                backdropFilter: "blur(5px)",
            }}
        >
            <div
                style={{
                    background: "linear-gradient(155deg, #FFFBF0 0%, #FFFFFF 55%, #FAF4E6 100%)",
                    width: "100%",
                    maxWidth: "460px",
                    maxHeight: "90vh",
                    overflowY: "auto",
                    WebkitOverflowScrolling: "touch",
                    borderRadius: "24px",
                    padding: "22px 16px",
                    position: "relative",
                    boxSizing: "border-box",
                    boxShadow: "0 16px 48px rgba(74, 50, 34, 0.45)",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    textAlign: "center",
                    border: "2px solid #D4A44C",
                    animation: "popIn 0.45s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
                }}
            >
                <button
                    onClick={onClose}
                    style={{
                        position: "absolute",
                        top: 12,
                        right: 12,
                        background: "rgba(74,50,34,0.08)",
                        border: "none",
                        borderRadius: "50%",
                        width: 30,
                        height: 30,
                        cursor: "pointer",
                        color: theme.colors.textSecondary,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                    }}
                    title="Fechar"
                >
                    <X size={17} />
                </button>

                <div style={{ position: "relative", marginBottom: "8px" }}>
                    <Crown size={46} color="#B45309" fill="#F59E0B" />
                    <Sparkles
                        size={20}
                        color={theme.colors.primary}
                        style={{ position: "absolute", top: -6, right: -12, animation: "spin 4s linear infinite" }}
                    />
                </div>

                <div
                    style={{
                        fontSize: "0.7rem",
                        fontWeight: 800,
                        textTransform: "uppercase",
                        letterSpacing: "0.08em",
                        color: "#8C6530",
                        background: "#FEF3C7",
                        border: "1px solid #FDE68A",
                        padding: "3px 10px",
                        borderRadius: "999px",
                        marginBottom: "6px",
                    }}
                >
                    🏆 Destaque de {monthName}/{year}
                </div>

                <h2 style={{ color: "#4A3222", margin: "0 0 4px 0", fontSize: "1.4rem", fontWeight: 900 }}>
                    Parabéns, {formatServoName(userName)}! 🎉
                </h2>

                <p style={{ color: "#5C4028", fontSize: "0.86rem", lineHeight: 1.4, margin: "0 0 10px 0" }}>
                    Você conquistou a premiação mensal com{" "}
                    <strong>{score} pontos</strong>
                    {totalPresences ? (
                        <>
                            {" "}em <strong>{totalPresences} {totalPresences === 1 ? "escala" : "escalas"}</strong>
                        </>
                    ) : null}
                    !
                </p>

                {!claim ? (
                    <>
                        <div
                            style={{
                                background: "#FFFFFF",
                                border: "1px dashed #D4A44C",
                                borderRadius: "12px",
                                padding: "10px 12px",
                                width: "100%",
                                boxSizing: "border-box",
                                marginBottom: "12px",
                            }}
                        >
                            <div style={{ fontWeight: 800, fontSize: "0.86rem", color: "#4A3222", marginBottom: "2px" }}>
                                🎈 Escolha 1 dos 10 balõezinhos para estourar!
                            </div>
                            <div style={{ fontSize: "0.75rem", color: "#785A3C", lineHeight: 1.35 }}>
                                Cada balão esconde um presente surpresa diferente. Toque no seu número da sorte!
                            </div>
                        </div>

                        {/* GRADE 5x2 COM OS 10 BALÕEZINHOS */}
                        <div
                            style={{
                                display: "grid",
                                gridTemplateColumns: "repeat(5, 1fr)",
                                gap: "10px 6px",
                                width: "100%",
                                padding: "6px 2px 14px 2px",
                                boxSizing: "border-box",
                            }}
                        >
                            {BALLOON_STYLES.map((b, idx) => {
                                const isLoadingThis = poppingIdx === idx && burstingIdx === null;
                                const isBurstingThis = burstingIdx === idx;
                                const isDisabled = poppingIdx !== null;

                                return (
                                    <button
                                        key={idx}
                                        type="button"
                                        disabled={isDisabled}
                                        onClick={() => handlePop(idx)}
                                        style={{
                                            background: "transparent",
                                            border: "none",
                                            padding: "2px 0",
                                            cursor: isDisabled ? "default" : "pointer",
                                            display: "flex",
                                            flexDirection: "column",
                                            alignItems: "center",
                                            animation: isBurstingThis
                                                ? "balloonPop 0.38s ease-out forwards"
                                                : `balloonFloat 2.8s ease-in-out ${b.delay} infinite`,
                                            opacity: poppingIdx !== null && poppingIdx !== idx ? 0.42 : 1,
                                            transition: "opacity 0.2s, transform 0.15s",
                                        }}
                                    >
                                        {/* Corpo do balãozinho */}
                                        <div
                                            style={{
                                                width: "48px",
                                                height: "58px",
                                                borderRadius: "50% 50% 48% 48% / 55% 55% 45% 45%",
                                                background: b.gradient,
                                                boxShadow: b.shadow,
                                                position: "relative",
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "center",
                                                color: "#FFFFFF",
                                                fontWeight: 900,
                                                fontSize: "0.95rem",
                                                textShadow: "0 1px 3px rgba(0,0,0,0.35)",
                                            }}
                                        >
                                            {/* Brilho */}
                                            <div
                                                style={{
                                                    position: "absolute",
                                                    top: "8px",
                                                    left: "10px",
                                                    width: "9px",
                                                    height: "15px",
                                                    borderRadius: "50%",
                                                    background: "rgba(255,255,255,0.42)",
                                                    transform: "rotate(-25deg)",
                                                }}
                                            />
                                            {isLoadingThis ? (
                                                <Loader2 size={18} className="animate-spin" />
                                            ) : (
                                                <span>{idx + 1}</span>
                                            )}
                                        </div>
                                        {/* Nó */}
                                        <div
                                            style={{
                                                width: 0,
                                                height: 0,
                                                borderLeft: "4px solid transparent",
                                                borderRight: "4px solid transparent",
                                                borderBottom: `6px solid ${b.knotColor}`,
                                                marginTop: "-1px",
                                            }}
                                        />
                                        {/* Fitinha */}
                                        <div
                                            style={{
                                                width: "1.2px",
                                                height: "12px",
                                                background: "rgba(74, 50, 34, 0.35)",
                                            }}
                                        />
                                    </button>
                                );
                            })}
                        </div>

                        {errorMsg && (
                            <div
                                style={{
                                    width: "100%",
                                    boxSizing: "border-box",
                                    padding: "9px 12px",
                                    borderRadius: "10px",
                                    background: "#FEE2E2",
                                    color: "#991B1B",
                                    fontSize: "0.8rem",
                                    fontWeight: 700,
                                    marginBottom: "10px",
                                }}
                            >
                                {errorMsg}
                            </div>
                        )}

                        <div style={{ fontSize: "0.73rem", color: "#8C7360" }}>
                            Toque em qualquer um dos 10 balões numerados acima para estourar!
                        </div>
                    </>
                ) : (
                    /* TELA DE PRÊMIO REVELADO */
                    <div
                        style={{
                            width: "100%",
                            animation: "popIn 0.45s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
                            display: "flex",
                            flexDirection: "column",
                            gap: "12px",
                        }}
                    >
                        <div
                            style={{
                                background: "linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%)",
                                border: "2px solid #D97706",
                                borderRadius: "18px",
                                padding: "16px 14px",
                                boxShadow: "0 8px 24px rgba(217, 119, 6, 0.25)",
                            }}
                        >
                            <div
                                style={{
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: "6px",
                                    fontSize: "0.73rem",
                                    fontWeight: 800,
                                    textTransform: "uppercase",
                                    letterSpacing: "0.06em",
                                    color: "#92400E",
                                    marginBottom: "6px",
                                }}
                            >
                                <Gift size={15} />
                                <span>Balão {claim.balloonIndex + 1} Estourou! Seu Presente:</span>
                            </div>
                            <div
                                style={{
                                    fontSize: "1.22rem",
                                    fontWeight: 900,
                                    color: "#4A3222",
                                    lineHeight: 1.3,
                                    margin: "4px 0 8px 0",
                                }}
                            >
                                {claim.prizeWon}
                            </div>
                            <div style={{ fontSize: "0.79rem", color: "#78350F", fontWeight: 600 }}>
                                {claim.delivered
                                    ? "✅ Presente já entregue pela coordenação!"
                                    : "✨ A coordenação já foi avisada automaticamente do seu prêmio!"}
                            </div>
                        </div>

                        {otherPrizes.length > 0 && (
                            <div
                                style={{
                                    background: "#FAF8F5",
                                    border: "1px solid #E5DEC9",
                                    borderRadius: "12px",
                                    padding: "10px 10px",
                                    fontSize: "0.72rem",
                                    color: "#785A3C",
                                }}
                            >
                                <div style={{ fontWeight: 700, marginBottom: "6px" }}>
                                    O que havia nos outros balões:
                                </div>
                                <div style={{ display: "flex", justifyContent: "center", gap: "5px", flexWrap: "wrap" }}>
                                    {otherPrizes.map((op) => (
                                        <span
                                            key={op.idx}
                                            style={{
                                                background: "#FFF",
                                                border: "1px solid #E5DEC9",
                                                borderRadius: "999px",
                                                padding: "2px 8px",
                                                fontWeight: 600,
                                            }}
                                        >
                                            <strong>#{op.idx + 1}:</strong> {op.prize}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}

                        <button
                            type="button"
                            onClick={onClose}
                            style={{
                                width: "100%",
                                padding: "12px",
                                borderRadius: "12px",
                                border: "none",
                                background: theme.colors.primaryGradient,
                                color: "white",
                                fontWeight: 800,
                                fontSize: "0.92rem",
                                cursor: "pointer",
                                boxShadow: theme.colors.shadowPrimary,
                                marginTop: "2px",
                            }}
                        >
                            Que benção! Fechar ✨
                        </button>
                    </div>
                )}

                <style>{`
          @keyframes popIn {
            0% { transform: scale(0.84); opacity: 0; }
            100% { transform: scale(1); opacity: 1; }
          }
          @keyframes spin {
            100% { transform: rotate(360deg); }
          }
          @keyframes balloonFloat {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(-6px); }
          }
          @keyframes balloonPop {
            0% { transform: scale(1); opacity: 1; }
            55% { transform: scale(1.32); opacity: 0.9; }
            100% { transform: scale(0); opacity: 0; }
          }
        `}</style>
            </div>
        </div>
    );
}
