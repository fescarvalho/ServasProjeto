import { useState, useMemo, useEffect } from "react";
import { ChevronDown, ChevronUp, BookOpen, Loader2, AlertCircle } from "lucide-react";
import { theme } from "../theme/theme";
import api from "../services/api";
import { LiturgicalColor, LITURGICAL_DATA_2026, getDateKey } from "../utils/liturgical.utils";

interface LiturgySection {
    title: string;
    content: string;
}

interface LiturgyData {
    sections: LiturgySection[];
}

// ── HELPERS ─────────────────────────────────────────────────────────────────
const COLOR_META: Record<LiturgicalColor, { hex: string; bg: string; label: string }> = {
    roxo: { hex: "#6d28d9", bg: "#f5f3ff", label: "Roxo" },
    verde: { hex: "#15803d", bg: "#f0fdf4", label: "Verde" },
    branco: { hex: "#d97706", bg: "#ffffff", label: "Branco" },
    vermelho: { hex: "#b91c1c", bg: "#fef2f2", label: "Vermelho" },
    rosa: { hex: "#be185d", bg: "#fdf2f8", label: "Rosa" },
};


function getToday(): Date {
    // Data de hoje no timezone de Brasília
    const now = new Date();
    const br = new Date(now.toLocaleString("en-US", { timeZone: "America/Sao_Paulo" }));
    return new Date(br.getFullYear(), br.getMonth(), br.getDate());
}

// ── COMPONENTE ───────────────────────────────────────────────────────────────
export function LiturgicalCalendar() {
    const today = useMemo(() => getToday(), []);
    const [selectedDate, setSelectedDate] = useState<Date>(today);
    const [showHistory, setShowHistory] = useState(false);
    const [liturgy, setLiturgy] = useState<LiturgyData | null>(null);
    const [loadingLiturgy, setLoadingLiturgy] = useState(false);
    const [liturgyError, setLiturgyError] = useState(false);

    const isToday = selectedDate.toDateString() === today.toDateString();

    // Formata a data para o input type="date" (YYYY-MM-DD)
    const inputValue = [
        selectedDate.getFullYear(),
        String(selectedDate.getMonth() + 1).padStart(2, "0"),
        String(selectedDate.getDate()).padStart(2, "0"),
    ].join("-");

    const goNext = () => {
        const next = new Date(selectedDate);
        next.setDate(next.getDate() + 1);
        setSelectedDate(next);
        setShowHistory(false);
    };

    const goPrev = () => {
        const prev = new Date(selectedDate);
        prev.setDate(prev.getDate() - 1);
        setSelectedDate(prev);
        setShowHistory(false);
    };

    useEffect(() => {
        const fetchLiturgy = async () => {
            setLoadingLiturgy(true);
            setLiturgyError(false);
            try {
                const dateStr = selectedDate.toISOString().split('T')[0];
                const response = await api.get(`/liturgy?date=${dateStr}`);
                setLiturgy(response.data);
            } catch (error) {
                console.error("Error fetching liturgy:", error);
                setLiturgyError(true);
            } finally {
                setLoadingLiturgy(false);
            }
        };

        fetchLiturgy();
    }, [selectedDate]);

    const { dayData, dateLabel } = useMemo(() => {
        const key = getDateKey(selectedDate);
        const data = LITURGICAL_DATA_2026[key] ?? { season: "Tempo Comum", color: "verde" as LiturgicalColor };
        const label = selectedDate.toLocaleDateString("pt-BR", {
            weekday: "long",
            day: "2-digit",
            month: "long",
            year: "numeric",
        });
        return { dayData: data, dateLabel: label };
    }, [selectedDate]);

    const meta = COLOR_META[dayData.color];

    return (
        <div style={{ padding: "20px 15px", display: "flex", flexDirection: "column", gap: "16px" }}>

            {/* Navegação de datas */}
            <div style={{
                display: "flex", alignItems: "center", gap: "8px",
                background: "white", borderRadius: "50px", padding: "6px 10px",
                boxShadow: "0 2px 10px rgba(0,0,0,0.07)",
            }}>
                <button onClick={goPrev} style={{
                    border: "none", background: "#f3f4f6", borderRadius: "50%",
                    width: 36, height: 36, cursor: "pointer", display: "flex",
                    alignItems: "center", justifyContent: "center", fontSize: "1rem", flexShrink: 0,
                }}>◀</button>

                <div style={{ flex: 1, textAlign: "center" }}>
                    <p style={{ margin: 0, fontSize: "0.85rem", fontWeight: "700", color: "#1a1a2e", textTransform: "capitalize" }}>
                        {dateLabel}
                    </p>
                </div>

                {/* Botão calendário — agora usando overlay para compatibilidade iOS */}
                <div style={{ position: "relative", width: 36, height: 36, flexShrink: 0 }}>
                    <button style={{
                        border: "none", background: "#f3f4f6", borderRadius: "50%",
                        width: "100%", height: "100%", cursor: "pointer", display: "flex",
                        alignItems: "center", justifyContent: "center", fontSize: "1.1rem",
                    }} title="Escolher data">📅</button>

                    <input
                        type="date"
                        value={inputValue}
                        min="2026-01-01"
                        max="2026-12-31"
                        onChange={(e) => {
                            if (!e.target.value) return;
                            const [y, m, d] = e.target.value.split("-").map(Number);
                            setSelectedDate(new Date(y, m - 1, d));
                            setShowHistory(false);
                        }}
                        style={{
                            position: "absolute",
                            top: 0,
                            left: 0,
                            width: "100%",
                            height: "100%",
                            opacity: 0,
                            cursor: "pointer",
                            appearance: "none",
                            WebkitAppearance: "none",
                        }}
                    />
                </div>

                <button onClick={goNext} style={{
                    border: "none", background: "#f3f4f6", borderRadius: "50%",
                    width: 36, height: 36, cursor: "pointer", display: "flex",
                    alignItems: "center", justifyContent: "center", fontSize: "1rem", flexShrink: 0,
                }}>▶</button>

                {!isToday && (
                    <button onClick={() => setSelectedDate(today)} style={{
                        border: "none", background: "#e0e7ff", color: "#3730a3",
                        borderRadius: "20px", padding: "4px 12px", fontSize: "0.75rem",
                        fontWeight: "bold", cursor: "pointer", flexShrink: 0,
                    }}>Hoje</button>
                )}
            </div>

            {/* Card principal */}
            <div style={{
                background: `linear-gradient(135deg, ${meta.hex}, ${meta.hex}cc)`,
                color: "white",
                borderRadius: "16px",
                padding: "24px 20px",
                textAlign: "center",
                boxShadow: `0 4px 20px ${meta.hex}44`,
            }}>
                <div style={{ fontSize: "2.5rem", marginBottom: "8px" }}>✝</div>
                <h2 style={{ margin: "0 0 10px", fontSize: "1.3rem", fontWeight: 800 }}>{dayData.season}</h2>
                <div style={{
                    display: "inline-flex", alignItems: "center", gap: "8px",
                    background: "rgba(255,255,255,0.25)", borderRadius: "30px", padding: "6px 16px",
                }}>
                    <div style={{ width: 12, height: 12, borderRadius: "50%", background: "white" }} />
                    <span style={{ fontSize: "0.9rem", fontWeight: "bold" }}>Cor: {meta.label}</span>
                </div>
            </div>

            {/* Santo / Celebração do dia */}
            <div style={{
                background: meta.bg,
                border: `1px solid ${meta.hex}44`,
                borderLeft: `4px solid ${meta.hex}`,
                borderRadius: "12px",
                padding: "16px 20px",
                display: "flex",
                alignItems: "center",
                gap: "14px",
            }}>
                <span style={{ fontSize: "1.8rem" }}>{dayData.celebration ? "🌹" : "✝"}</span>
                <div>
                    <p style={{ margin: "0 0 2px", fontSize: "0.75rem", color: meta.hex, fontWeight: "bold", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                        {dayData.celebration ? "Celebração do Dia" : "Dia de Feria"}
                    </p>
                    <p style={{ margin: 0, fontSize: "1rem", fontWeight: "700", color: "#1a1a2e" }}>
                        {dayData.celebration ?? "Dia comum sem memória obrigatória"}
                    </p>

                    {dayData.history && (
                        <button
                            onClick={() => setShowHistory(!showHistory)}
                            style={{
                                marginTop: "12px",
                                background: `${meta.hex}12`,
                                border: `1px solid ${meta.hex}33`,
                                borderRadius: "20px",
                                padding: "6px 14px",
                                color: meta.hex,
                                fontSize: "0.8rem",
                                fontWeight: "700",
                                cursor: "pointer",
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "6px",
                                transition: "all 0.2s",
                            }}
                        >
                            {showHistory ? "🔼 Fechar história" : "📖 Conhecer a história"}
                        </button>
                    )}

                    {!dayData.celebration && (
                        <p style={{ margin: "4px 0 0", fontSize: "0.85rem", color: "#666", fontStyle: "italic", opacity: 0.8 }}>
                            Neste dia, celebra-se a missa do tempo litúrgico vigente.
                        </p>
                    )}
                </div>
            </div>

            {/* História do Santo (Expandida) */}
            {dayData.history && showHistory && (
                <div style={{
                    background: "white",
                    border: `1px solid ${meta.hex}22`,
                    borderTop: `4px solid ${meta.hex}`,
                    borderRadius: "12px",
                    padding: "20px",
                    boxShadow: `0 8px 25px ${meta.hex}15`,
                    position: "relative",
                    marginTop: "4px"
                }}>
                    <div style={{
                        position: "absolute",
                        top: -12,
                        left: 20,
                        background: meta.hex,
                        color: "white",
                        padding: "2px 10px",
                        borderRadius: "10px",
                        fontSize: "0.7rem",
                        fontWeight: "bold",
                        textTransform: "uppercase"
                    }}>
                        Vida do Santo
                    </div>
                    <p style={{
                        margin: 0,
                        fontSize: "0.95rem",
                        lineHeight: "1.7",
                        color: "#2d3436",
                        textAlign: "justify",
                        whiteSpace: "pre-wrap"
                    }}>
                        {dayData.history}
                    </p>
                </div>
            )}


            {/* Sobre o tempo litúrgico */}
            <div style={{
                background: "white",
                border: `1px solid ${theme.colors.border}`,
                borderRadius: "12px",
                padding: "16px 20px",
                display: "flex",
                flexDirection: "column",
                gap: "10px",
            }}>
                <p style={{ margin: 0, fontWeight: "bold", fontSize: "0.9rem", color: theme.colors.textSecondary, textTransform: "uppercase", letterSpacing: "0.05em" }}>📋 Sobre o Tempo Litúrgico</p>
                <LiturgicalInfo color={dayData.color} />
            </div>

            {/* SEÇÃO DE LITURGIA DIÁRIA */}
            <div style={{
                background: "white",
                border: `1px solid ${theme.colors.border}`,
                borderRadius: "12px",
                overflow: "hidden",
                boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
            }}>
                <div style={{
                    padding: "16px 20px",
                    borderBottom: `1px solid ${theme.colors.border}`,
                    background: "#fdf8f5",
                    display: "flex",
                    alignItems: "center",
                    gap: "10px"
                }}>
                    <BookOpen size={18} color={theme.colors.primary} />
                    <h3 style={{ margin: 0, fontSize: "1rem", fontWeight: "800", color: "#1a1a2e" }}>Liturgia do Dia</h3>
                </div>

                <div style={{ padding: "20px" }}>
                    {loadingLiturgy ? (
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "10px", padding: "20px 0" }}>
                            <Loader2 className="animate-spin" size={24} color={theme.colors.primary} />
                            <p style={{ fontSize: "0.85rem", color: "#666" }}>Buscando leituras...</p>
                        </div>
                    ) : liturgyError ? (
                        <div style={{ textAlign: "center", padding: "10px 0" }}>
                            <AlertCircle size={32} color={theme.colors.danger} style={{ margin: "0 auto 10px" }} />
                            <p style={{ fontSize: "0.9rem", color: "#666", margin: "0 0 10px" }}>Não foi possível carregar a liturgia.</p>
                            <button
                                onClick={() => {
                                    const dateStr = selectedDate.toISOString().split('T')[0];
                                    api.get(`/liturgy?date=${dateStr}`).then(res => setLiturgy(res.data)).catch(() => setLiturgyError(true));
                                }}
                                style={{
                                    background: theme.colors.primary,
                                    color: "white",
                                    border: "none",
                                    padding: "8px 16px",
                                    borderRadius: "20px",
                                    fontSize: "0.8rem",
                                    fontWeight: "bold",
                                    cursor: "pointer"
                                }}
                            >
                                Tentar novamente
                            </button>
                        </div>
                    ) : liturgy ? (
                        <div className="liturgy-content" style={{
                            fontFamily: "'Playfair Display', 'Georgia', serif",
                            lineHeight: "1.8",
                            color: "#2c3e50"
                        }}>
                            {liturgy.sections.map((section, idx) => (
                                <LiturgySectionComponent key={idx} title={section.title} content={section.content} />
                            ))}
                        </div>
                    ) : (
                        <p style={{ textAlign: "center", fontStyle: "italic", color: "#888" }}>Nenhuma leitura disponível para esta data.</p>
                    )}
                </div>
            </div>

            <p style={{ textAlign: "center", fontSize: "0.72rem", color: theme.colors.textMuted, margin: 0 }}>
                Calendário Litúrgico Romano • Ano Litúrgico 2025–2026
            </p>
        </div>
    );
}

function LiturgySectionComponent({ title, content }: { title: string; content: string }) {
    const [isExpanded, setIsExpanded] = useState(false);

    // Pequeno truque para mostrar apenas o início se não estiver expandido
    const previewContent = content.length > 200 ? content.substring(0, 200) + "..." : content;

    return (
        <div style={{ marginBottom: "24px", borderBottom: "1px solid #f0f0f0", paddingBottom: "16px" }}>
            <h4 style={{
                fontFamily: "Inter, sans-serif",
                fontSize: "0.9rem",
                fontWeight: "800",
                color: "#5C4033",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                margin: "0 0 12px 0",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center"
            }}>
                {title}
            </h4>
            <div style={{
                fontSize: "1.05rem",
                textAlign: "justify",
                whiteSpace: "pre-wrap",
                color: "#333"
            }}>
                {isExpanded ? content : previewContent}
            </div>
            {content.length > 200 && (
                <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    style={{
                        background: "none",
                        border: "none",
                        color: "#5C4033",
                        fontSize: "0.85rem",
                        fontWeight: "700",
                        padding: "8px 0",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                        marginTop: "8px",
                        fontFamily: "Inter, sans-serif"
                    }}
                >
                    {isExpanded ? (
                        <>Ver menos <ChevronUp size={14} /></>
                    ) : (
                        <>Ler tudo <ChevronDown size={14} /></>
                    )}
                </button>
            )}
        </div>
    );
}

function LiturgicalInfo({ color }: { color: LiturgicalColor }) {
    const infos: Record<LiturgicalColor, string> = {
        roxo: "O roxo é a cor do recolhimento, da penitência e da conversão. Usado no Advento e na Quaresma, convida ao preparo interior, à oração e ao jejum.",
        verde: "O verde simboliza esperança e vida. É usado durante o Tempo Comum, quando a Igreja aprofunda o ensinamento do Evangelho no cotidiano dos fiéis.",
        branco: "O branco representa a pureza, a alegria e a glória. Usado nas solenidades do Senhor, de Nossa Senhora e dos santos não mártires.",
        vermelho: "O vermelho recorda o fogo do Espírito Santo e o sangue dos mártires. Usado em Pentecostes e nas festas dos apóstolos e mártires.",
        rosa: "O rosa é uma atenuação do roxo, sinal de alegria no meio da espera. Usado no 3.º Domingo do Advento (Gaudete) e no 4.º Domingo da Quaresma (Laetare).",
    };
    return <p style={{ margin: 0, fontSize: "0.9rem", lineHeight: 1.6, color: "#444" }}>{infos[color]}</p>;
}
