import { useState, useEffect } from "react";
import { X, Copy, ExternalLink, CheckCircle, AlertCircle, Calendar, MessageSquare, Megaphone } from "lucide-react";
import { Mass, FUNCOES } from "../types/types";
import api from "../services/api";

interface ReminderModalProps {
    masses: Mass[];
    onClose: () => void;
}

type TemplateType = "SUNDAY_SCALE" | "OPEN_REGISTRATION" | "GENERAL_NOTICE";

export function ReminderModal({ masses, onClose }: ReminderModalProps) {
    const [template, setTemplate] = useState<TemplateType>("SUNDAY_SCALE");
    const [customText, setCustomText] = useState("");
    const [isCopied, setIsCopied] = useState(false);
    const [isSending, setIsSending] = useState(false);
    const [sendError, setSendError] = useState<string | null>(null);
    const [sendSuccess, setSendSuccess] = useState(false);

    // Auto-generate text based on template
    useEffect(() => {
        generateTemplateText(template);
    }, [template, masses]);

    const generateTemplateText = (type: TemplateType) => {
        let text = "";

        if (type === "SUNDAY_SCALE") {
            text = "🌸 *GRUPO DE SERVAS SANTA TEREZINHA* 🌸\n\n";
            text += "✨ *Lembrete da Escala do Final de Semana* ✨\n\n";

            const upcoming = masses
                .filter(m => new Date(m.date) >= new Date())
                .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                .slice(0, 3);

            if (upcoming.length === 0) {
                text += "Nenhuma missa próxima encontrada no sistema.";
            } else {
                upcoming.forEach(mass => {
                    const d = new Date(mass.date);
                    const diaStr = d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", weekday: "long" }).toUpperCase();
                    const hora = d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

                    text += `📅 *${diaStr} às ${hora}h*\n`;

                    FUNCOES.forEach(funcao => {
                        const serva = mass.signups.find(s => s.role === funcao && s.status === "CONFIRMADO");
                        if (serva) {
                            text += `   • ${funcao}: ${serva.user.name}\n`;
                        }
                    });
                    text += "\n";
                });
            }

            text += "\n_Por favor, confirmem presença no aplicativo!_ 🔗 https://servasdoaltar.vercel.app/";
        }
        else if (type === "OPEN_REGISTRATION") {
            text = "📢 *AVISO IMPORTANTE: INSCRIÇÕES ABERTAS!* 📢\n\n";
            text += "As inscrições para as próximas missas já estão disponíveis no sistema.\n\n";
            text += "Acesse agora e garanta sua vaga!\n";
            text += "🔗 https://servasdoaltar.vercel.app/\n\n";
            text += "Não deixe para a última hora! 🌸✨";
        }
        else if (type === "GENERAL_NOTICE") {
            text = "🌸 *COMUNICADO: GRUPO DE SERVAS* 🌸\n\n";
            text += "[Escreva seu aviso aqui...]\n\n";
            text += "Atenciosamente,\nCoordenação.";
        }

        setCustomText(text);
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(customText);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
    };

    const handleOpenWhatsapp = () => {
        const encoded = encodeURIComponent(customText);
        window.open(`https://api.whatsapp.com/send?text=${encoded}`, "_blank");
    };

    const handleSendPush = async () => {
        if (!customText.trim()) return;

        setIsSending(true);
        setSendError(null);
        setSendSuccess(false);

        try {
            await api.post("/push/send-custom", {
                title: "Aviso do Grupo de Servas 🌸",
                body: customText
            });

            setSendSuccess(true);
            setTimeout(() => setSendSuccess(false), 3000);
        } catch (err: any) {
            console.error("Push error:", err);
            const errorMsg = err.response?.data?.error || err.message || "Erro ao enviar notificações";
            setSendError(errorMsg);
        } finally {
            setIsSending(false);
        }
    };

    return (
        <div style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.7)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: "20px"
        }}>
            <div style={{
                background: "white",
                width: "100%",
                maxWidth: "600px",
                borderRadius: "24px",
                overflow: "hidden",
                boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
                animation: "scaleIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)"
            }}>
                {/* Header */}
                <div style={{
                    background: "linear-gradient(135deg, #7b1fa2 0%, #4a148c 100%)",
                    padding: "24px",
                    color: "white",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center"
                }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        <div style={{ background: "rgba(255,255,255,0.2)", padding: "8px", borderRadius: "12px" }}>
                            <Megaphone size={24} />
                        </div>
                        <div>
                            <h2 style={{ margin: 0, fontSize: "1.25rem", fontWeight: "bold" }}>Central de Lembretes</h2>
                            <p style={{ margin: 0, opacity: 0.8, fontSize: "0.85rem" }}>Dispare avisos para o WhatsApp</p>
                        </div>
                    </div>
                    <button onClick={onClose} style={{
                        background: "rgba(255,255,255,0.1)",
                        border: "none",
                        color: "white",
                        padding: "8px",
                        borderRadius: "50%",
                        cursor: "pointer",
                        transition: "all 0.2s"
                    }}
                        onMouseOver={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.2)"}
                        onMouseOut={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.1)"}
                    >
                        <X size={24} />
                    </button>
                </div>

                <div style={{ padding: "24px" }}>
                    {/* Template Selector */}
                    <div style={{ marginBottom: "20px" }}>
                        <label style={{ display: "block", marginBottom: "8px", fontSize: "0.9rem", fontWeight: "600", color: "#4B5563" }}>
                            Escolha um Modelo
                        </label>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px" }}>
                            <button
                                onClick={() => setTemplate("SUNDAY_SCALE")}
                                style={{
                                    padding: "12px 8px",
                                    borderRadius: "12px",
                                    border: "2px solid",
                                    borderColor: template === "SUNDAY_SCALE" ? "#7b1fa2" : "#E5E7EB",
                                    background: template === "SUNDAY_SCALE" ? "#F5F3FF" : "white",
                                    color: template === "SUNDAY_SCALE" ? "#7b1fa2" : "#6B7280",
                                    fontSize: "0.8rem",
                                    fontWeight: "bold",
                                    cursor: "pointer",
                                    transition: "all 0.2s",
                                    display: "flex",
                                    flexDirection: "column",
                                    alignItems: "center",
                                    gap: "6px"
                                }}
                            >
                                <Calendar size={18} /> Escala do Dia
                            </button>
                            <button
                                onClick={() => setTemplate("OPEN_REGISTRATION")}
                                style={{
                                    padding: "12px 8px",
                                    borderRadius: "12px",
                                    border: "2px solid",
                                    borderColor: template === "OPEN_REGISTRATION" ? "#7b1fa2" : "#E5E7EB",
                                    background: template === "OPEN_REGISTRATION" ? "#F5F3FF" : "white",
                                    color: template === "OPEN_REGISTRATION" ? "#7b1fa2" : "#6B7280",
                                    fontSize: "0.8rem",
                                    fontWeight: "bold",
                                    cursor: "pointer",
                                    transition: "all 0.2s",
                                    display: "flex",
                                    flexDirection: "column",
                                    alignItems: "center",
                                    gap: "6px"
                                }}
                            >
                                <MessageSquare size={18} /> Inscrições
                            </button>
                            <button
                                onClick={() => setTemplate("GENERAL_NOTICE")}
                                style={{
                                    padding: "12px 8px",
                                    borderRadius: "12px",
                                    border: "2px solid",
                                    borderColor: template === "GENERAL_NOTICE" ? "#7b1fa2" : "#E5E7EB",
                                    background: template === "GENERAL_NOTICE" ? "#F5F3FF" : "white",
                                    color: template === "GENERAL_NOTICE" ? "#7b1fa2" : "#6B7280",
                                    fontSize: "0.8rem",
                                    fontWeight: "bold",
                                    cursor: "pointer",
                                    transition: "all 0.2s",
                                    display: "flex",
                                    flexDirection: "column",
                                    alignItems: "center",
                                    gap: "6px"
                                }}
                            >
                                <Megaphone size={18} /> Aviso Livre
                            </button>
                        </div>
                    </div>

                    {/* Editor */}
                    <div style={{ marginBottom: "24px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                            <label style={{ fontSize: "0.9rem", fontWeight: "600", color: "#4B5563" }}>
                                Edite o Texto
                            </label>
                            <span style={{ fontSize: "0.75rem", color: "#9CA3AF" }}>
                                Markdown do WhatsApp ativado (*negrito*, _itálico_)
                            </span>
                        </div>
                        <textarea
                            value={customText}
                            onChange={(e) => setCustomText(e.target.value)}
                            style={{
                                width: "100%",
                                height: "220px",
                                padding: "16px",
                                borderRadius: "16px",
                                border: "1px solid #E5E7EB",
                                background: "#F9FAFB",
                                fontSize: "0.95rem",
                                lineHeight: "1.5",
                                fontFamily: "inherit",
                                resize: "none",
                                outline: "none",
                                transition: "border-color 0.2s"
                            }}
                            onFocus={(e) => e.target.style.borderColor = "#7b1fa2"}
                            onBlur={(e) => e.target.style.borderColor = "#E5E7EB"}
                        />
                    </div>

                    {/* Actions */}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "12px" }}>
                        <button
                            onClick={handleCopy}
                            style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                gap: "8px",
                                padding: "14px",
                                borderRadius: "14px",
                                border: "1px solid #E5E7EB",
                                background: "white",
                                color: "#4B5563",
                                fontWeight: "bold",
                                cursor: "pointer",
                                transition: "all 0.2s"
                            }}
                        >
                            {isCopied ? <CheckCircle size={20} color="#059669" /> : <Copy size={20} />}
                            {isCopied ? "Copiado!" : "Copiar"}
                        </button>
                        <button
                            onClick={template === "GENERAL_NOTICE" ? handleSendPush : handleOpenWhatsapp}
                            disabled={isSending}
                            style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                gap: "10px",
                                padding: "14px",
                                borderRadius: "14px",
                                border: "none",
                                background: template === "GENERAL_NOTICE" ? "#7b1fa2" : "#25D366",
                                color: "white",
                                fontWeight: "bold",
                                fontSize: "1rem",
                                cursor: isSending ? "not-allowed" : "pointer",
                                boxShadow: template === "GENERAL_NOTICE"
                                    ? "0 4px 6px -1px rgba(123, 31, 162, 0.2)"
                                    : "0 4px 6px -1px rgba(37, 211, 102, 0.2)",
                                transition: "all 0.2s",
                                opacity: isSending ? 0.7 : 1
                            }}
                            onMouseOver={(e) => !isSending && (e.currentTarget.style.transform = "translateY(-2px)")}
                            onMouseOut={(e) => !isSending && (e.currentTarget.style.transform = "translateY(0)")}
                        >
                            {template === "GENERAL_NOTICE" ? (
                                <>
                                    <Megaphone size={20} />
                                    {isSending ? "Enviando..." : "Disparar no Celular"}
                                </>
                            ) : (
                                <>
                                    <ExternalLink size={20} />
                                    Copiado e Abrir WhatsApp
                                </>
                            )}
                        </button>
                    </div>

                    {sendSuccess && (
                        <div style={{ marginTop: "16px", display: "flex", alignItems: "center", gap: "8px", color: "#059669", fontSize: "0.85rem", padding: "10px", background: "#ecfdf5", borderRadius: "10px", border: "1px solid #10b981" }}>
                            <CheckCircle size={14} />
                            Notificações enviadas com sucesso para as servas!
                        </div>
                    )}

                    {sendError && (
                        <div style={{ marginTop: "16px", display: "flex", alignItems: "center", gap: "8px", color: "#dc2626", fontSize: "0.85rem", padding: "10px", background: "#fef2f2", borderRadius: "10px", border: "1px solid #ef4444" }}>
                            <AlertCircle size={14} />
                            {sendError}
                        </div>
                    )}

                    <div style={{ marginTop: "16px", display: "flex", alignItems: "center", gap: "8px", color: "#6B7280", fontSize: "0.8rem", padding: "10px", background: "#f3f4f6", borderRadius: "10px" }}>
                        <AlertCircle size={14} />
                        {template === "GENERAL_NOTICE"
                            ? "Dica: Este aviso chegará como uma notificação no celular de todas as servas."
                            : "Dica: Clique em \"Copiado e Abrir\" para levar o texto direto para o grupo."}
                    </div>
                </div>
            </div>

            <style dangerouslySetInnerHTML={{
                __html: `
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
      `}} />
        </div>
    );
}
