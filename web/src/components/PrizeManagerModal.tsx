import { useEffect, useState } from "react";
import { X, Gift, Save, CheckCircle2, Clock, AlertCircle, Loader2, Trophy, Send, Trash2 } from "lucide-react";
import { theme } from "../theme/theme";
import {
    AdminPrizeOverview,
    clearTestBalloon,
    createManualBalloonGrant,
    deleteManualBalloonGrant,
    getAdminPrizeOverview,
    setPrizeDelivered,
    startOrResetTestBalloon,
    updateBalloonPrizes,
} from "../services/api/prize.service";
import { getUsersList } from "../services/api/notice.service";

interface PrizeManagerModalProps {
    onClose: () => void;
    onUpdated?: (overview: AdminPrizeOverview) => void;
}

const MONTHS = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];

const BALLOON_COUNT = 10;

export function PrizeManagerModal({ onClose, onUpdated }: PrizeManagerModalProps) {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [granting, setGranting] = useState(false);
    const [togglingYm, setTogglingYm] = useState<string | null>(null);
    const [overview, setOverview] = useState<AdminPrizeOverview | null>(null);
    const [prizesList, setPrizesList] = useState<string[]>(Array(BALLOON_COUNT).fill(""));
    const [usersList, setUsersList] = useState<{ id: string; name: string }[]>([]);
    const [grantUserId, setGrantUserId] = useState("");
    const [grantMonth, setGrantMonth] = useState(9); // Outubro padrão
    const [grantYear, setGrantYear] = useState(2026);
    const [feedback, setFeedback] = useState<{ type: "ok" | "err"; text: string } | null>(null);

    const loadData = async () => {
        try {
            setLoading(true);
            const [data, uList] = await Promise.all([
                getAdminPrizeOverview(),
                getUsersList().catch(() => []),
            ]);
            setOverview(data);
            const nextPrizes = Array.from({ length: BALLOON_COUNT }, (_, i) => data.prizes[i] || "");
            setPrizesList(nextPrizes);
            const cleanUsers = (uList || []).filter(
                (u) => u.name !== "Coordenador" && u.name !== "Serva Teste" && u.name !== "serva teste2"
            );
            setUsersList(cleanUsers);
            onUpdated?.(data);
        } catch (err: any) {
            setFeedback({
                type: "err",
                text: err?.response?.data?.message || "Erro ao carregar dados de premiação.",
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const handleSavePrizes = async (e: React.FormEvent) => {
        e.preventDefault();
        setFeedback(null);
        const cleaned = prizesList.map((p) => p.trim());
        if (cleaned.some((p) => !p)) {
            setFeedback({ type: "err", text: `Preencha o nome de todos os ${BALLOON_COUNT} presentes.` });
            return;
        }
        try {
            setSaving(true);
            await updateBalloonPrizes(cleaned);
            setFeedback({ type: "ok", text: `Os ${BALLOON_COUNT} presentes dos balões foram atualizados!` });
            await loadData();
        } catch (err: any) {
            setFeedback({
                type: "err",
                text: err?.response?.data?.message || "Erro ao salvar presentes.",
            });
        } finally {
            setSaving(false);
        }
    };

    const handleCreateManualGrant = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!grantUserId) {
            setFeedback({ type: "err", text: "Selecione o(a) servo(a) para disparar os balões." });
            return;
        }
        try {
            setGranting(true);
            setFeedback(null);
            const created = await createManualBalloonGrant({
                userId: grantUserId,
                year: grantYear,
                month: grantMonth,
            });
            setGrantUserId("");
            setFeedback({
                type: "ok",
                text: `10 balões disparados para ${created.userName} (${created.label})!`,
            });
            await loadData();
        } catch (err: any) {
            setFeedback({
                type: "err",
                text: err?.response?.data?.message || err?.response?.data?.error || "Erro ao disparar balões.",
            });
        } finally {
            setGranting(false);
        }
    };

    const handleDeleteManualGrant = async (grantId: string) => {
        try {
            await deleteManualBalloonGrant(grantId);
            setFeedback({ type: "ok", text: "Disparo pendente cancelado." });
            await loadData();
        } catch {
            setFeedback({ type: "err", text: "Erro ao cancelar disparo." });
        }
    };

    const handleToggleDelivered = async (ymKey: string, nextDelivered: boolean) => {
        try {
            setTogglingYm(ymKey);
            await setPrizeDelivered(ymKey, nextDelivered);
            await loadData();
        } catch (err: any) {
            setFeedback({
                type: "err",
                text: err?.response?.data?.message || "Erro ao atualizar status de entrega.",
            });
        } finally {
            setTogglingYm(null);
        }
    };

    const lastMonth = overview?.lastClosedMonth;
    const pendingGrants = overview?.pendingManualGrants || [];

    return (
        <div
            onClick={onClose}
            style={{
                position: "fixed",
                inset: 0,
                backgroundColor: "rgba(0,0,0,0.65)",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                zIndex: 10020,
                padding: "16px",
                backdropFilter: "blur(3px)",
            }}
        >
            <div
                onClick={(e) => e.stopPropagation()}
                style={{
                    background: "#FAF8F5",
                    width: "100%",
                    maxWidth: "560px",
                    maxHeight: "88vh",
                    borderRadius: "18px",
                    overflowY: "auto",
                    overflowX: "hidden",
                    WebkitOverflowScrolling: "touch",
                    overscrollBehavior: "contain",
                    boxSizing: "border-box",
                    boxShadow: "0 24px 60px rgba(0,0,0,0.35)",
                    border: `1px solid ${theme.colors.border}`,
                }}
            >
                {/* HEADER */}
                <div
                    style={{
                        position: "sticky",
                        top: 0,
                        zIndex: 20,
                        background: theme.colors.primaryGradient,
                        color: "#FFFFFF",
                        padding: "16px 18px",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        boxSizing: "border-box",
                    }}
                >
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <div
                            style={{
                                background: "rgba(255,255,255,0.18)",
                                padding: "8px",
                                borderRadius: "10px",
                                display: "flex",
                            }}
                        >
                            <Gift size={20} color="#FFFFFF" />
                        </div>
                        <div>
                            <div style={{ margin: 0, fontSize: "1.05rem", fontWeight: 800, color: "#FFFFFF", lineHeight: 1.2 }}>
                                Premiação Mensal & 10 Balões
                            </div>
                            <span style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.88)" }}>
                                10 presentes fixos (ordem muda automaticamente todo mês)
                            </span>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        style={{
                            background: "rgba(255,255,255,0.2)",
                            border: "none",
                            borderRadius: "50%",
                            width: 30,
                            height: 30,
                            color: "#fff",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                        }}
                    >
                        <X size={16} />
                    </button>
                </div>

                {/* BODY */}
                <div style={{ boxSizing: "border-box" }}>
                    <div
                        style={{
                            padding: "16px",
                            display: "flex",
                            flexDirection: "column",
                            gap: "16px",
                            boxSizing: "border-box",
                        }}
                    >
                        {loading && !overview ? (
                            <div style={{ textAlign: "center", padding: "36px 12px", color: theme.colors.textSecondary }}>
                                <Loader2 size={26} className="animate-spin" style={{ margin: "0 auto 8px" }} />
                                <div style={{ fontSize: "0.85rem", fontWeight: 600 }}>Carregando premiações...</div>
                            </div>
                        ) : (
                            <>
                                {feedback && (
                                    <div
                                        style={{
                                            padding: "10px 12px",
                                            borderRadius: "10px",
                                            fontSize: "0.82rem",
                                            fontWeight: 700,
                                            background: feedback.type === "ok" ? "#DCFCE7" : "#FEE2E2",
                                            color: feedback.type === "ok" ? "#166534" : "#991B1B",
                                            border: `1px solid ${feedback.type === "ok" ? "#86EFAC" : "#FCA5A5"}`,
                                        }}
                                    >
                                        {feedback.text}
                                    </div>
                                )}

                                {/* DISPARO INDIVIDUAL / RETROATIVO DE BALÕES */}
                                <div
                                    style={{
                                        background: "#FFFFFF",
                                        border: "1.5px solid #E5DEC9",
                                        borderRadius: "14px",
                                        padding: "14px",
                                        display: "flex",
                                        flexDirection: "column",
                                        gap: "10px",
                                    }}
                                >
                                    <div>
                                        <div style={{ fontWeight: 800, fontSize: "0.9rem", color: "#4A3222" }}>
                                            🎯 Disparar Balões p/ Servo(a) Específico(a)
                                        </div>
                                        <div style={{ fontSize: "0.75rem", color: "#785A3C", marginTop: "2px" }}>
                                            Envie os 10 balõezinhos para vencedores de meses passados ou premiações avulsas.
                                        </div>
                                    </div>

                                    <form onSubmit={handleCreateManualGrant} style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                                        <select
                                            className="form-input"
                                            value={grantUserId}
                                            onChange={(e) => setGrantUserId(e.target.value)}
                                            style={{ flex: "1 1 200px", minWidth: 0 }}
                                        >
                                            <option value="">Selecione o(a) servo(a)...</option>
                                            {usersList.map((u) => (
                                                <option key={u.id} value={u.id}>
                                                    {u.name}
                                                </option>
                                            ))}
                                        </select>

                                        <select
                                            className="form-input"
                                            value={grantMonth}
                                            onChange={(e) => setGrantMonth(Number(e.target.value))}
                                            style={{ width: "120px" }}
                                        >
                                            {MONTHS.map((m, idx) => (
                                                <option key={idx} value={idx}>
                                                    {m}
                                                </option>
                                            ))}
                                        </select>

                                        <select
                                            className="form-input"
                                            value={grantYear}
                                            onChange={(e) => setGrantYear(Number(e.target.value))}
                                            style={{ width: "86px" }}
                                        >
                                            <option value={2025}>2025</option>
                                            <option value={2026}>2026</option>
                                            <option value={2027}>2027</option>
                                        </select>

                                        <button
                                            type="submit"
                                            disabled={granting}
                                            style={{
                                                padding: "8px 14px",
                                                borderRadius: "10px",
                                                border: "none",
                                                background: "#B45309",
                                                color: "#FFFFFF",
                                                fontWeight: 800,
                                                fontSize: "0.8rem",
                                                cursor: granting ? "not-allowed" : "pointer",
                                                display: "inline-flex",
                                                alignItems: "center",
                                                gap: "6px",
                                            }}
                                        >
                                            {granting ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                                            <span>Disparar Balões</span>
                                        </button>
                                    </form>

                                    {pendingGrants.length > 0 && (
                                        <div style={{ marginTop: "4px", display: "flex", flexDirection: "column", gap: "6px" }}>
                                            <div style={{ fontSize: "0.72rem", fontWeight: 800, color: "#8C6530", textTransform: "uppercase" }}>
                                                ⏳ Balões Disparados (Aguardando a pessoa abrir e estourar)
                                            </div>
                                            {pendingGrants.map((g) => (
                                                <div
                                                    key={g.id}
                                                    style={{
                                                        padding: "8px 10px",
                                                        borderRadius: "8px",
                                                        background: "#FFFBEB",
                                                        border: "1px solid #FDE68A",
                                                        display: "flex",
                                                        justifyContent: "space-between",
                                                        alignItems: "center",
                                                        gap: "8px",
                                                    }}
                                                >
                                                    <div style={{ fontSize: "0.8rem", color: "#4A3222" }}>
                                                        🎈 <strong>{g.userName}</strong> — <span style={{ color: "#92400E", fontWeight: 700 }}>{g.label}</span>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleDeleteManualGrant(g.id)}
                                                        style={{
                                                            background: "transparent",
                                                            border: "none",
                                                            color: "#DC2626",
                                                            cursor: "pointer",
                                                            padding: "4px",
                                                            display: "flex",
                                                        }}
                                                        title="Cancelar disparo pendente"
                                                    >
                                                        <Trash2 size={15} />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* STATUS DO ÚLTIMO MÊS FECHADO */}
                                {lastMonth && (
                                    <div
                                        style={{
                                            background: "#FFFFFF",
                                            border: "1.5px solid #E5DEC9",
                                            borderRadius: "14px",
                                            padding: "14px",
                                        }}
                                    >
                                        <div
                                            style={{
                                                fontSize: "0.72rem",
                                                fontWeight: 800,
                                                textTransform: "uppercase",
                                                letterSpacing: "0.06em",
                                                color: "#8C6530",
                                                marginBottom: "6px",
                                                display: "flex",
                                                alignItems: "center",
                                                gap: "5px",
                                            }}
                                        >
                                            <Trophy size={14} />
                                            <span>
                                                {lastMonth.isInProgressPreview
                                                    ? `Disputa automática atual: ${MONTHS[lastMonth.month]}/${lastMonth.year}`
                                                    : `Último mês encerrado: ${MONTHS[lastMonth.month]}/${lastMonth.year}`}
                                            </span>
                                        </div>

                                        {!lastMonth.winner ? (
                                            <div style={{ fontSize: "0.83rem", color: "#666" }}>
                                                Nenhuma presença confirmada encontrada em {MONTHS[lastMonth.month]}/{lastMonth.year}.
                                            </div>
                                        ) : (
                                            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                                                <div style={{ fontSize: "0.92rem", fontWeight: 800, color: "#4A3222" }}>
                                                    {lastMonth.isInProgressPreview
                                                        ? `🏅 Líder parcial até agora: ${lastMonth.winner.name}`
                                                        : `🏅 Vencedor(a) Elegível: ${lastMonth.winner.name}`}
                                                </div>
                                                <div style={{ fontSize: "0.78rem", color: "#5C4028" }}>
                                                    {lastMonth.winner.score} pts • {lastMonth.winner.totalPresences} escalas totais •{" "}
                                                    {lastMonth.winner.specialPresences} de 2+ pts
                                                </div>

                                                {lastMonth.skippedPrevWinner && (
                                                    <div
                                                        style={{
                                                            marginTop: "2px",
                                                            padding: "7px 10px",
                                                            borderRadius: "8px",
                                                            background: "#FFFBEB",
                                                            border: "1px solid #FDE68A",
                                                            fontSize: "0.75rem",
                                                            color: "#92400E",
                                                            display: "flex",
                                                            alignItems: "center",
                                                            gap: "6px",
                                                        }}
                                                    >
                                                        <AlertCircle size={14} style={{ flexShrink: 0 }} />
                                                        <span>
                                                            <strong>{lastMonth.skippedPrevWinner.name}</strong> teve mais pontos ({lastMonth.skippedPrevWinner.score} pts), mas já venceu no mês anterior — prêmio repassado automaticamente.
                                                        </span>
                                                    </div>
                                                )}

                                                {lastMonth.isInProgressPreview ? (
                                                    <div
                                                        style={{
                                                            marginTop: "4px",
                                                            padding: "8px 10px",
                                                            borderRadius: "8px",
                                                            background: "#FEF3C7",
                                                            border: "1px solid #FDE68A",
                                                            fontSize: "0.78rem",
                                                            color: "#92400E",
                                                            display: "flex",
                                                            alignItems: "center",
                                                            gap: "6px",
                                                            fontWeight: 600,
                                                        }}
                                                    >
                                                        <Clock size={14} style={{ flexShrink: 0 }} />
                                                        <span>
                                                            Os 10 balões automáticos serão liberados em <strong>01/12/2026</strong>, após o fechamento de Novembro/2026.
                                                        </span>
                                                    </div>
                                                ) : lastMonth.claim ? (
                                                    <div
                                                        style={{
                                                            marginTop: "4px",
                                                            padding: "9px 11px",
                                                            borderRadius: "10px",
                                                            background: "#FEF3C7",
                                                            border: "1px solid #F59E0B",
                                                            fontSize: "0.82rem",
                                                            color: "#78350F",
                                                            fontWeight: 700,
                                                        }}
                                                    >
                                                        🎈 Estourou o <strong>Balão {lastMonth.claim.balloonIndex + 1}</strong> e ganhou:{" "}
                                                        <strong>{lastMonth.claim.prizeWon}</strong>
                                                    </div>
                                                ) : (
                                                    <div
                                                        style={{
                                                            marginTop: "4px",
                                                            padding: "8px 10px",
                                                            borderRadius: "8px",
                                                            background: "#F3F4F6",
                                                            fontSize: "0.78rem",
                                                            color: "#4B5563",
                                                            display: "flex",
                                                            alignItems: "center",
                                                            gap: "6px",
                                                        }}
                                                    >
                                                        <Clock size={14} />
                                                        <span>Aguardando o(a) vencedor(a) abrir o app e estourar o balão.</span>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* FORMULÁRIO DOS 10 PRESENTES FIXOS */}
                                <form
                                    onSubmit={handleSavePrizes}
                                    style={{
                                        background: "#FFFFFF",
                                        border: "1px solid #E5DEC9",
                                        borderRadius: "14px",
                                        padding: "14px",
                                        display: "flex",
                                        flexDirection: "column",
                                        gap: "10px",
                                    }}
                                >
                                    <div>
                                        <div style={{ fontWeight: 800, fontSize: "0.9rem", color: "#4A3222" }}>
                                            🎁 Lista Fixa dos 10 Presentes
                                        </div>
                                        <div style={{ fontSize: "0.75rem", color: "#785A3C", marginTop: "2px" }}>
                                            A ordem dos 10 presentes dentro dos 10 balõezinhos muda automaticamente a cada mês (assim o mesmo número nunca guarda o mesmo prêmio no mês seguinte).
                                        </div>
                                    </div>

                                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "8px" }}>
                                        {prizesList.map((val, idx) => (
                                            <div key={idx}>
                                                <label style={{ fontSize: "0.72rem", fontWeight: 700, color: "#5C4028", display: "block", marginBottom: "2px" }}>
                                                    Presente {idx + 1}
                                                </label>
                                                <input
                                                    type="text"
                                                    className="form-input"
                                                    value={val}
                                                    onChange={(e) => {
                                                        const copy = [...prizesList];
                                                        copy[idx] = e.target.value;
                                                        setPrizesList(copy);
                                                    }}
                                                    required
                                                />
                                            </div>
                                        ))}
                                    </div>

                                    <div style={{ fontSize: "0.72rem", color: "#8C7360", background: "#FAF8F5", padding: "8px 10px", borderRadius: "8px" }}>
                                        <strong>Regras ativas de desempate:</strong> 1º Pontuação do mês → 2º Mais escalas totais → 3º Mais escalas de 2+ pontos → 4º Menos faltas. Quem venceu no mês anterior não pode vencer no mês seguinte.
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={saving}
                                        style={{
                                            padding: "10px 14px",
                                            borderRadius: "10px",
                                            border: "none",
                                            background: theme.colors.primary,
                                            color: "#FFFFFF",
                                            fontWeight: 800,
                                            fontSize: "0.84rem",
                                            cursor: saving ? "not-allowed" : "pointer",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            gap: "6px",
                                        }}
                                    >
                                        {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                                        <span>{saving ? "Salvando..." : "Salvar Lista de 10 Presentes"}</span>
                                    </button>
                                </form>

                                {/* HISTÓRICO DE BALÕES ESTOURADOS */}
                                <div
                                    style={{
                                        background: "#FFFFFF",
                                        border: "1px solid #E5DEC9",
                                        borderRadius: "14px",
                                        padding: "14px",
                                    }}
                                >
                                    <div style={{ fontWeight: 800, fontSize: "0.9rem", color: "#4A3222", marginBottom: "10px" }}>
                                        🎈 Histórico de Prêmios Sorteados
                                    </div>

                                    {!overview?.claims || overview.claims.length === 0 ? (
                                        <div style={{ fontSize: "0.8rem", color: "#888", textAlign: "center", padding: "12px 0" }}>
                                            Nenhum balão foi estourado ainda.
                                        </div>
                                    ) : (
                                        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                                            {overview.claims.map((c) => (
                                                <div
                                                    key={c.ymKey}
                                                    style={{
                                                        padding: "10px 12px",
                                                        borderRadius: "10px",
                                                        background: c.delivered ? "#F9FAFB" : "#FFFBEB",
                                                        border: `1px solid ${c.delivered ? "#E5E7EB" : "#FDE68A"}`,
                                                        display: "flex",
                                                        justifyContent: "space-between",
                                                        alignItems: "center",
                                                        gap: "10px",
                                                        flexWrap: "wrap",
                                                    }}
                                                >
                                                    <div style={{ flex: 1, minWidth: "180px" }}>
                                                        <div style={{ fontSize: "0.72rem", fontWeight: 800, color: "#8C6530", textTransform: "uppercase" }}>
                                                            {c.ymKey === "TESTE-SIMULACAO"
                                                                ? "🧪 Simulação"
                                                                : c.customLabel || `${MONTHS[c.month]}/${c.year}`}{" "}
                                                            • Balão {c.balloonIndex + 1}
                                                        </div>
                                                        <div style={{ fontSize: "0.88rem", fontWeight: 800, color: "#4A3222" }}>
                                                            {c.winnerName}
                                                        </div>
                                                        <div style={{ fontSize: "0.82rem", fontWeight: 700, color: "#B45309", marginTop: "2px" }}>
                                                            🎁 {c.prizeWon}
                                                        </div>
                                                    </div>

                                                    <button
                                                        type="button"
                                                        disabled={togglingYm === c.ymKey}
                                                        onClick={() => handleToggleDelivered(c.ymKey, !c.delivered)}
                                                        style={{
                                                            padding: "6px 11px",
                                                            borderRadius: "8px",
                                                            border: c.delivered ? "1px solid #86EFAC" : "none",
                                                            background: c.delivered ? "#DCFCE7" : "#166534",
                                                            color: c.delivered ? "#166534" : "#FFFFFF",
                                                            fontSize: "0.75rem",
                                                            fontWeight: 800,
                                                            cursor: "pointer",
                                                            display: "inline-flex",
                                                            alignItems: "center",
                                                            gap: "5px",
                                                        }}
                                                    >
                                                        <CheckCircle2 size={14} />
                                                        <span>{c.delivered ? "Entregue" : "Marcar Entregue"}</span>
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* MODO DE SIMULAÇÃO COM SERVA TESTE */}
                                <div
                                    style={{
                                        background: "#F5F3FF",
                                        border: "1px dashed #A78BFA",
                                        borderRadius: "14px",
                                        padding: "12px 14px",
                                        display: "flex",
                                        flexDirection: "column",
                                        gap: "8px",
                                    }}
                                >
                                    <div style={{ fontWeight: 800, fontSize: "0.84rem", color: "#5B21B6" }}>
                                        🧪 Modo de Teste (Serva Teste — teste@servas.com)
                                    </div>
                                    <div style={{ fontSize: "0.75rem", color: "#4C1D95", lineHeight: 1.4 }}>
                                        {overview?.testActive
                                            ? "✅ Teste ATIVO para teste@servas.com! Faça login nessa conta para testar os 10 balões. Ao terminar, clique em 'Encerrar e Limpar Teste'."
                                            : "Libere um sorteio de simulação exclusivo para a conta teste@servas.com sem afetar nenhum servo real."}
                                    </div>
                                    <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                                        <button
                                            type="button"
                                            onClick={async () => {
                                                try {
                                                    await startOrResetTestBalloon();
                                                    setFeedback({
                                                        type: "ok",
                                                        text: "Os 10 balões de teste foram liberados/resetados para teste@servas.com!",
                                                    });
                                                    await loadData();
                                                } catch {
                                                    setFeedback({ type: "err", text: "Erro ao ativar teste." });
                                                }
                                            }}
                                            style={{
                                                padding: "7px 12px",
                                                borderRadius: "8px",
                                                border: "none",
                                                background: "#6D28D9",
                                                color: "#FFFFFF",
                                                fontSize: "0.76rem",
                                                fontWeight: 800,
                                                cursor: "pointer",
                                            }}
                                        >
                                            {overview?.testActive ? "🔄 Resetar Balões de Teste" : "🎈 Liberar 10 Balões p/ Serva Teste"}
                                        </button>
                                        {(overview?.testActive || overview?.claims?.some((c) => c.ymKey === "TESTE-SIMULACAO")) && (
                                            <button
                                                type="button"
                                                onClick={async () => {
                                                    try {
                                                        await clearTestBalloon();
                                                        setFeedback({
                                                            type: "ok",
                                                            text: "Modo de teste encerrado e limpo!",
                                                        });
                                                        await loadData();
                                                    } catch {
                                                        setFeedback({ type: "err", text: "Erro ao limpar teste." });
                                                    }
                                                }}
                                                style={{
                                                    padding: "7px 12px",
                                                    borderRadius: "8px",
                                                    border: "1px solid #C4B5FD",
                                                    background: "#FFFFFF",
                                                    color: "#5B21B6",
                                                    fontSize: "0.76rem",
                                                    fontWeight: 800,
                                                    cursor: "pointer",
                                                }}
                                            >
                                                🧹 Encerrar e Limpar Teste
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
