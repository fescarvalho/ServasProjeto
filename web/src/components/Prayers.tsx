import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { theme } from "../theme/theme";

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
        subtitle: "Padroeira do nosso grupo de servas",
        icon: "🌸",
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
        subtitle: "Padroeiro dos Coroinhas e Servas do Altar",
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
        icon: "🌹",
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

    const toggle = (id: string) => setOpenId((prev) => (prev === id ? null : id));

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
