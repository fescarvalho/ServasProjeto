import { useState, useCallback } from "react";
import { CheckCircle, XCircle, AlertTriangle, Info, X } from "lucide-react";
import { theme } from "../theme/theme";

export type ToastType = "success" | "error" | "warning" | "info";

export interface ToastMessage {
    id: string;
    type: ToastType;
    message: string;
}

interface ToastProps {
    toasts: ToastMessage[];
    onRemove: (id: string) => void;
}

const ICONS = {
    success: <CheckCircle size={20} color={theme.colors.success} />,
    error: <XCircle size={20} color={theme.colors.dangerDark} />,
    warning: <AlertTriangle size={20} color={theme.colors.warningDark} />,
    info: <Info size={20} color={theme.colors.info} />,
};

const BG = {
    success: { bg: theme.colors.successLight, border: theme.colors.success, color: theme.colors.successDark },
    error: { bg: theme.colors.dangerLight, border: theme.colors.danger, color: theme.colors.dangerDark },
    warning: { bg: theme.colors.warningLight, border: theme.colors.warning, color: theme.colors.warningDark },
    info: { bg: theme.colors.infoLight, border: theme.colors.info, color: theme.colors.infoDark },
};

export function ToastContainer({ toasts, onRemove }: ToastProps) {
    return (
        <div style={{
            position: "fixed", bottom: "20px", right: "20px",
            display: "flex", flexDirection: "column", gap: "10px",
            zIndex: 99999, maxWidth: "340px", width: "calc(100vw - 40px)",
            pointerEvents: "none",
        }}>
            {toasts.map((t) => {
                const style = BG[t.type];
                return (
                    <div
                        key={t.id}
                        style={{
                            background: style.bg,
                            border: `1px solid ${style.border}`,
                            color: style.color,
                            borderRadius: "12px",
                            padding: "14px 16px",
                            display: "flex",
                            alignItems: "flex-start",
                            gap: "10px",
                            boxShadow: "0 4px 16px rgba(0,0,0,0.12)",
                            animation: "slideInRight 0.3s ease",
                            pointerEvents: "all",
                        }}
                    >
                        <div style={{ flexShrink: 0, marginTop: "1px" }}>{ICONS[t.type]}</div>
                        <span style={{ flex: 1, fontSize: "0.9rem", fontWeight: "500", lineHeight: 1.4 }}>{t.message}</span>
                        <button
                            onClick={() => onRemove(t.id)}
                            style={{ background: "none", border: "none", cursor: "pointer", padding: "0 0 0 4px", color: style.color, opacity: 0.6 }}
                        >
                            <X size={16} />
                        </button>
                    </div>
                );
            })}
            <style>{`
        @keyframes slideInRight {
          from { transform: translateX(110%); opacity: 0; }
          to   { transform: translateX(0);    opacity: 1; }
        }
      `}</style>
        </div>
    );
}

// ── Hook ─────────────────────────────────────────────────────────────────────

export function useToast() {
    const [toasts, setToasts] = useState<ToastMessage[]>([]);

    const remove = useCallback((id: string) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    }, []);

    const show = useCallback((message: string, type: ToastType = "info", duration = 4000) => {
        const id = Math.random().toString(36).slice(2);
        setToasts((prev) => [...prev, { id, type, message }]);
        if (duration > 0) setTimeout(() => remove(id), duration);
    }, [remove]);

    return { toasts, remove, show };
}

// ── Confirm Modal (separate, simpler) ────────────────────────────────────────

interface ConfirmModalProps {
    message: string;
    onConfirm: () => void;
    onCancel: () => void;
}

export function ConfirmModal({ message, onConfirm, onCancel }: ConfirmModalProps) {
    return (
        <div style={{
            position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)",
            display: "flex", alignItems: "center", justifyContent: "center",
            zIndex: 99999, padding: "20px",
        }}>
            <div style={{
                background: "white", borderRadius: "16px", padding: "28px 24px",
                maxWidth: "340px", width: "100%",
                boxShadow: "0 8px 32px rgba(0,0,0,0.2)",
                animation: "fadeScale 0.2s ease",
            }}>
                <div style={{ display: "flex", alignItems: "flex-start", gap: "12px", marginBottom: "20px" }}>
                    <AlertTriangle size={24} color={theme.colors.warningDark} style={{ flexShrink: 0, marginTop: 2 }} />
                    <p style={{ margin: 0, fontSize: "0.95rem", color: theme.colors.textMain, lineHeight: 1.5 }}>{message}</p>
                </div>
                <div style={{ display: "flex", gap: "10px" }}>
                    <button
                        onClick={onCancel}
                        style={{
                            flex: 1, padding: "10px", borderRadius: "8px",
                            border: `1px solid ${theme.colors.border}`, background: theme.colors.background,
                            color: theme.colors.textSecondary, fontWeight: "bold", cursor: "pointer", fontSize: "0.9rem",
                        }}
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={onConfirm}
                        style={{
                            flex: 1, padding: "10px", borderRadius: "8px",
                            border: "none", background: theme.colors.primary,
                            color: "white", fontWeight: "bold", cursor: "pointer", fontSize: "0.9rem",
                        }}
                    >
                        Confirmar
                    </button>
                </div>
            </div>
            <style>{`
        @keyframes fadeScale {
          from { transform: scale(0.9); opacity: 0; }
          to   { transform: scale(1);   opacity: 1; }
        }
      `}</style>
        </div>
    );
}
