import { useState, useEffect } from "react";
import { ChevronDown, ChevronUp, BookOpen, ChevronLeft, ChevronRight, X, Loader2, ExternalLink } from "lucide-react";
import { theme } from "../theme/theme";
import api from "../services/api";

interface LiturgySection {
    title: string;
    content: string;
}

interface LiturgyResponse {
    date: string;
    liturgia?: string;
    cor?: string;
    sections: LiturgySection[];
}

function getBrDateStr(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
}

function getColorBadgeStyle(cor?: string): { bg: string; text: string; border: string } {
    const norm = (cor || "").toLowerCase();
    if (norm.includes("roxo") || norm.includes("róseo") || norm.includes("rosa")) {
        return norm.includes("rosa")
            ? { bg: "#FDF2F8", text: "#BE185D", border: "#FBCFE8" }
            : { bg: "#F5F3FF", text: "#6D28D9", border: "#DDD6FE" };
    }
    if (norm.includes("vermelho")) return { bg: "#FEF2F2", text: "#B91C1C", border: "#FECACA" };
    if (norm.includes("verde")) return { bg: "#F0FDF4", text: "#15803D", border: "#BBF7D0" };
    return { bg: "#FAF8F5", text: "#8C6530", border: "#E5DEC9" }; // Branco / Dourado
}

interface Prayer {
    id: string;
    title: string;
    subtitle: string;
    icon: string;
    color: string;
    text: string;
}

const PRAYERS: Prayer[] = [
    {
        id: "santa-terezinha",
        title: "Oração de Santa Terezinha",
        subtitle: "Padroeira do nosso grupo de servos e servas",
        icon: "✝",
        color: "#6B4F3A",
        text: `Santa Terezinha do Menino Jesus,
pequena flor do jardim do Senhor,
ensinai-nos a amar a Deus
com o coração simples e confiante de uma criança.

Vós que encontrastes o caminho da santidade
nas pequenas coisas do cotidiano,
ajudai-nos a servir ao altar com humildade,
sem buscar glória nem reconhecimento.

Intercedei por nós, ó Terezinha,
para que sejamos dignas do serviço sagrado
ao qual fomos chamadas,
e que nossa vida seja, como a vossa,
uma chuva de rosas para o Senhor.

Amém.`,
    },
    {

        id: "sao-tarcisio",
        title: "Oração de São Tarcísio",
        subtitle: "Padroeiro dos Coroinhas e Servos do Altar",
        icon: "✝",
        color: "#b91c1c",
        text: `São Tarcísio, jovem mártir da Eucaristia,
que deste a vida para proteger o Corpo de Cristo
das mãos dos ímpios,
olhai por nós que nos comprometemos a servi-Lo.

Dai-nos um amor ardente pela Santa Eucaristia,
para que, como vós, sejamos capazes de
defender e honrar a presença real de Cristo
em nosso meio.

Intercedei por nós junto ao Senhor,
para que cumpramos nosso serviço com fidelidade,
humildade e devoção,
e um dia mereçamos a glória eterna ao Seu lado.

Amém.`,
    },
    {
        id: "antes-do-altar",
        title: "Oração antes de Servir ao Altar",
        subtitle: "Para recitar antes de iniciar o serviço",
        icon: "⛪",
        color: "#8D6E63",
        text: `Senhor Jesus Cristo,
venho diante do Vosso Altar com humildade e reverência.

Purificai meu coração, minha mente e meu corpo
para que eu seja digna de Vos servir neste santo lugar.

Que minhas mãos sejam instrumento da Vossa graça,
que meus passos conduzam à Vossa glória,
e que meu serviço hoje seja agradável a Vós
e edificante para os irmãos que aqui se reúnem.

Não me permita me distrair,
mas que minha atenção esteja voltada inteiramente
para o Mistério Santo que aqui se celebra.

Pela intercessão de Nossa Senhora e de São Tarcísio,
sirvo-Vos hoje com amor.

Amém.`,
    },
    {
        id: "ato-de-contricao",
        title: "Ato de Contrição",
        subtitle: "Para recitar com arrependimento sincero",
        icon: "🙏",
        color: "#7c3aed",
        text: `Meu Deus,
estou arrependido de todos os meus pecados.
Tenho desgostado o Senhor, que é tão bom.

Firme propósito de não mais pecar,
de evitar as ocasiões de pecado
e de confessar os meus pecados.

Senhor, tende piedade de mim!

Amém.`,
    },
    {
        id: "oferta-do-servico",
        title: "Oferta do Serviço",
        subtitle: "Para santificar o trabalho de servir",
        icon: "💐",
        color: "#15803d",
        text: `Senhor, ofereço-Vos este serviço de hoje.
Que cada gesto meu junto ao Altar
seja um ato de amor por Vós.

Que eu saiba calar quando é hora de silêncio,
que eu saiba mover-me com reverência,
que eu saiba estar presente com todo o coração.

Que a Santa Missa de hoje
transforme a mim e a todos os fiéis
que daqui saem renovados.

A Vós, Senhor, toda honra e glória.

Amém.`,
    },
    {
        id: "nossa-senhora",
        title: "Sub Tuum Praesidium",
        subtitle: "A mais antiga oração mariana",
        icon: "⭐",
        color: "#0369a1",
        text: `Sob a Vossa proteção nos refugiamos,
ó Santa Mãe de Deus.
Não desprezeis as nossas súplicas
em nossas necessidades,
mas livrai-nos de todos os perigos,
ó sempre Virgem gloriosa e bendita.

Amém.`,
    },
    {
        id: "gracas-apos",
        title: "Ação de Graças após o Serviço",
        subtitle: "Para recitar ao final da missa",
        icon: "🌸",
        color: "#b45309",
        text: `Graças Vos dou, Senhor Jesus Cristo,
pela honra de ter servido junto ao Vosso Altar.

Que a graça recebida neste Sacrifício
permaneça em mim e em todos que aqui estiveram.

Santificai minha família, minha comunidade
e todos por quem orei hoje.

Que N. Senhora Mãe de Deus,
Rainha dos Anjos e dos Santos,
interceda por nós sempre.

Amém.`,
    },
];

// ── COMPONENTE ───────────────────────────────────────────────────────────────
export function Prayers() {
    const [openId, setOpenId] = useState<string | null>(PRAYERS[0].id);
    const [showLiturgyModal, setShowLiturgyModal] = useState(false);
    const [liturgyDate, setLiturgyDate] = useState<Date>(() => {
        const now = new Date();
        const br = new Date(now.toLocaleString("en-US", { timeZone: "America/Sao_Paulo" }));
        return new Date(br.getFullYear(), br.getMonth(), br.getDate());
    });
    const [liturgyData, setLiturgyData] = useState<LiturgyResponse | null>(null);
    const [liturgyLoading, setLiturgyLoading] = useState(false);
    const [liturgyError, setLiturgyError] = useState(false);

    const toggle = (id: string) => setOpenId((prev) => (prev === id ? null : id));

    useEffect(() => {
        if (!showLiturgyModal) return;
        let cancelled = false;
        const load = async () => {
            setLiturgyLoading(true);
            setLiturgyError(false);
            try {
                const dateStr = getBrDateStr(liturgyDate);
                const res = await api.get<LiturgyResponse>(`/liturgy?date=${dateStr}`);
                if (!cancelled) setLiturgyData(res.data);
            } catch {
                if (!cancelled) setLiturgyError(true);
            } finally {
                if (!cancelled) setLiturgyLoading(false);
            }
        };
        load();
        return () => { cancelled = true; };
    }, [showLiturgyModal, liturgyDate]);

    const changeDay = (delta: number) => {
        setLiturgyDate((prev) => {
            const next = new Date(prev);
            next.setDate(next.getDate() + delta);
            return next;
        });
    };

    const resetToday = () => {
        const now = new Date();
        const br = new Date(now.toLocaleString("en-US", { timeZone: "America/Sao_Paulo" }));
        setLiturgyDate(new Date(br.getFullYear(), br.getMonth(), br.getDate()));
    };

    const colorStyle = getColorBadgeStyle(liturgyData?.cor);

    return (
        <div style={{ padding: "20px 15px", display: "flex", flexDirection: "column", gap: "10px" }}>
            {/* Cabeçalho */}
            <div style={{
                background: "linear-gradient(135deg, #3E2723 0%, #5C4033 60%, #8D6E63 100%)",
                color: "white",
                borderRadius: "16px",
                padding: "20px",
                textAlign: "center",
                marginBottom: "4px",
                boxShadow: "0 4px 20px rgba(92,64,51,0.35)",
            }}>
                <div style={{ fontSize: "2rem", marginBottom: "6px" }}>🙏</div>
                <h2 style={{ margin: "0 0 4px", fontSize: "1.2rem", fontWeight: 800, color: "white" }}>Orações do Altar</h2>
                <p style={{ margin: 0, fontSize: "0.85rem", opacity: 0.85 }}>Reze antes e depois de servir</p>
            </div>

            {/* Botão Liturgia do Dia (abre janela interna) */}
            <button
                type="button"
                onClick={() => setShowLiturgyModal(true)}
                style={{
                    width: "100%",
                    background: "linear-gradient(135deg, #FAF6EE 0%, #FFFFFF 100%)",
                    border: "1.5px solid #B8925A",
                    borderRadius: "14px",
                    padding: "14px 16px",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: "12px",
                    boxShadow: "0 4px 12px rgba(74, 50, 34, 0.08)",
                    textAlign: "left",
                }}
            >
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <div style={{
                        width: 42,
                        height: 42,
                        borderRadius: "12px",
                        background: "#4A3222",
                        color: "#E6C786",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                    }}>
                        <BookOpen size={20} />
                    </div>
                    <div>
                        <div style={{ fontWeight: 800, fontSize: "0.95rem", color: "#23170F" }}>
                            Liturgia Diária e Leituras
                        </div>
                        <div style={{ fontSize: "0.75rem", color: "#5A4332" }}>
                            Toque para ler a 1ª Leitura, Salmo e Evangelho de hoje
                        </div>
                    </div>
                </div>
                <ChevronRight size={18} color="#8C6530" />
            </button>

            {/* MODAL: LITURGIA DO DIA DENTRO DO APP */}
            {showLiturgyModal && (
                <div
                    onClick={() => setShowLiturgyModal(false)}
                    style={{
                        position: "fixed",
                        inset: 0,
                        backgroundColor: "rgba(0,0,0,0.6)",
                        zIndex: 9999,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        padding: "16px",
                        backdropFilter: "blur(3px)",
                    }}
                >
                    <div
                        onClick={(e) => e.stopPropagation()}
                        style={{
                            backgroundColor: "#FAF8F5",
                            width: "100%",
                            maxWidth: "500px",
                            maxHeight: "85vh",
                            borderRadius: "18px",
                            overflow: "hidden",
                            display: "flex",
                            flexDirection: "column",
                            border: `1px solid ${theme.colors.border}`,
                            boxShadow: "0 20px 50px rgba(0,0,0,0.3)",
                        }}
                    >
                        {/* Header do modal */}
                        <div style={{
                            background: theme.colors.primaryGradient,
                            color: "#fff",
                            padding: "14px 16px",
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            gap: "10px",
                        }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                <BookOpen size={18} color="#E6C786" />
                                <span style={{ fontWeight: 800, fontSize: "1rem" }}>Liturgia do Dia</span>
                            </div>
                            <button
                                type="button"
                                onClick={() => setShowLiturgyModal(false)}
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

                        {/* Navegador de data */}
                        <div style={{
                            background: "#fff",
                            padding: "10px 14px",
                            borderBottom: `1px solid ${theme.colors.borderLight}`,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            gap: "8px",
                        }}>
                            <button
                                type="button"
                                onClick={() => changeDay(-1)}
                                style={{ border: `1px solid ${theme.colors.border}`, background: "#FAF8F5", borderRadius: "8px", padding: "6px 10px", cursor: "pointer", display: "flex", alignItems: "center" }}
                            >
                                <ChevronLeft size={16} color={theme.colors.primary} />
                            </button>
                            <button
                                type="button"
                                onClick={resetToday}
                                style={{ background: "transparent", border: "none", cursor: "pointer", fontWeight: 800, fontSize: "0.86rem", color: "#23170F", textTransform: "capitalize" }}
                                title="Voltar para hoje"
                            >
                                {liturgyDate.toLocaleDateString("pt-BR", { weekday: "short", day: "2-digit", month: "long", year: "numeric" })}
                            </button>
                            <button
                                type="button"
                                onClick={() => changeDay(1)}
                                style={{ border: `1px solid ${theme.colors.border}`, background: "#FAF8F5", borderRadius: "8px", padding: "6px 10px", cursor: "pointer", display: "flex", alignItems: "center" }}
                            >
                                <ChevronRight size={16} color={theme.colors.primary} />
                            </button>
                        </div>

                        {/* Conteúdo das leituras */}
                        <div style={{ padding: "14px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "12px", flex: 1 }}>
                            {liturgyLoading ? (
                                <div style={{ textAlign: "center", padding: "40px 10px", color: theme.colors.textSecondary }}>
                                    <Loader2 size={24} className="animate-spin" style={{ margin: "0 auto 8px" }} />
                                    <p style={{ margin: 0, fontSize: "0.85rem" }}>Buscando leituras...</p>
                                </div>
                            ) : liturgyError || !liturgyData ? (
                                <div style={{ textAlign: "center", padding: "28px 14px", background: "#fff", borderRadius: "12px", border: `1px solid ${theme.colors.border}` }}>
                                    <p style={{ margin: "0 0 12px", color: "#5A4332", fontSize: "0.88rem" }}>
                                        Não foi possível carregar as leituras agora.
                                    </p>
                                    <a
                                        href="https://liturgiadiaria.cnbb.org.br/"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        style={{ display: "inline-flex", alignItems: "center", gap: "6px", background: theme.colors.primary, color: "#fff", padding: "8px 14px", borderRadius: "8px", textDecoration: "none", fontSize: "0.82rem", fontWeight: 700 }}
                                    >
                                        <ExternalLink size={14} /> Abrir na CNBB
                                    </a>
                                </div>
                            ) : (
                                <>
                                    {(liturgyData.liturgia || liturgyData.cor) && (
                                        <div style={{ background: "#fff", borderRadius: "12px", padding: "12px 14px", border: `1px solid ${theme.colors.border}`, display: "flex", justifyContent: "space-between", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                                            {liturgyData.liturgia && (
                                                <div style={{ fontWeight: 800, fontSize: "0.86rem", color: "#23170F", flex: 1 }}>
                                                    {liturgyData.liturgia}
                                                </div>
                                            )}
                                            {liturgyData.cor && (
                                                <span style={{ background: colorStyle.bg, color: colorStyle.text, border: `1px solid ${colorStyle.border}`, padding: "2px 10px", borderRadius: "12px", fontSize: "0.72rem", fontWeight: 800 }}>
                                                    Cor: {liturgyData.cor}
                                                </span>
                                            )}
                                        </div>
                                    )}

                                    {liturgyData.sections.map((sec, idx) => (
                                        <div key={idx} style={{ background: "#fff", borderRadius: "12px", padding: "14px", border: `1px solid ${theme.colors.borderLight}` }}>
                                            <div style={{ fontWeight: 800, fontSize: "0.85rem", color: theme.colors.primary, marginBottom: "8px", borderBottom: "1px solid #F0EDE6", paddingBottom: "6px" }}>
                                                {sec.title}
                                            </div>
                                            <div style={{ fontSize: "0.88rem", lineHeight: 1.65, color: "#2D241E", whiteSpace: "pre-line" }}>
                                                {sec.content}
                                            </div>
                                        </div>
                                    ))}

                                    <div style={{ textAlign: "center", paddingTop: "4px" }}>
                                        <a
                                            href="https://liturgiadiaria.cnbb.org.br/"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            style={{ fontSize: "0.75rem", color: "#8C6530", fontWeight: 700, textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "4px" }}
                                        >
                                            <ExternalLink size={12} /> Conferir no site oficial da CNBB
                                        </a>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Acordeão de orações */}
            {PRAYERS.map((prayer) => {
                const isOpen = openId === prayer.id;
                return (
                    <div
                        key={prayer.id}
                        style={{
                            background: "white",
                            borderRadius: "14px",
                            border: `1px solid ${isOpen ? prayer.color + "55" : theme.colors.border}`,
                            overflow: "hidden",
                            transition: "border-color 0.2s",
                            boxShadow: isOpen ? `0 4px 16px ${prayer.color}22` : theme.colors.shadowBase,
                        }}
                    >
                        {/* Cabeçalho do acordeão */}
                        <button
                            onClick={() => toggle(prayer.id)}
                            style={{
                                width: "100%",
                                background: isOpen ? `linear-gradient(135deg, ${prayer.color}11, ${prayer.color}08)` : "white",
                                border: "none",
                                padding: "16px 18px",
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center",
                                gap: "14px",
                                textAlign: "left",
                                transition: "background 0.2s",
                            }}
                        >
                            <div style={{
                                width: 42, height: 42, borderRadius: "12px",
                                background: `${prayer.color}18`,
                                display: "flex", alignItems: "center", justifyContent: "center",
                                fontSize: "1.3rem", flexShrink: 0,
                            }}>
                                {prayer.icon}
                            </div>
                            <div style={{ flex: 1 }}>
                                <p style={{ margin: "0 0 2px", fontWeight: "bold", fontSize: "0.95rem", color: "#1a1a2e" }}>{prayer.title}</p>
                                <p style={{ margin: 0, fontSize: "0.75rem", color: theme.colors.textSecondary }}>{prayer.subtitle}</p>
                            </div>
                            <div style={{ color: prayer.color, flexShrink: 0 }}>
                                {isOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                            </div>
                        </button>

                        {/* Corpo da oração */}
                        {isOpen && (
                            <div style={{
                                padding: "0 18px 20px 74px",
                                borderTop: `1px solid ${prayer.color}22`,
                            }}>
                                <pre style={{
                                    margin: 0,
                                    paddingTop: "16px",
                                    fontFamily: "inherit",
                                    whiteSpace: "pre-wrap",
                                    fontSize: "0.95rem",
                                    lineHeight: "1.8",
                                    color: "#2d2d2d",
                                    fontStyle: "italic",
                                }}>
                                    {prayer.text}
                                </pre>
                            </div>
                        )}
                    </div>
                );
            })}

            <p style={{ textAlign: "center", fontSize: "0.72rem", color: theme.colors.textMuted, margin: "6px 0 0" }}>
                Servas do Altar — Santuário Diocesano Nossa Senhora da Natividade
            </p>
        </div>
    );
}
