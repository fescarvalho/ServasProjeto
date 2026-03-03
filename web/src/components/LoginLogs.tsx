import { useState, useEffect } from "react";
import { History } from "lucide-react";
import { getLoginLogs, LoginLog } from "../services/api/admin.service";

export function LoginLogs() {
    const [logs, setLogs] = useState<LoginLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        getLoginLogs()
            .then(setLogs)
            .catch(() => setError("Erro ao carregar histórico de acessos."))
            .finally(() => setLoading(false));
    }, []);

    const formatDate = (iso: string) =>
        new Date(iso).toLocaleDateString("pt-BR", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
        });

    const formatTime = (iso: string) =>
        new Date(iso).toLocaleTimeString("pt-BR", {
            hour: "2-digit",
            minute: "2-digit",
        });

    return (
        <div style={{ padding: "16px 0" }}>
            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    marginBottom: "12px",
                    color: "#1565c0",
                    fontWeight: "bold",
                    fontSize: "0.95rem",
                }}
            >
                <History size={18} />
                Últimos 100 acessos
            </div>

            {loading && (
                <p style={{ color: "#888", fontSize: "0.9rem" }}>Carregando...</p>
            )}

            {error && (
                <p style={{ color: "#c62828", fontSize: "0.9rem" }}>{error}</p>
            )}

            {!loading && !error && logs.length === 0 && (
                <p style={{ color: "#888", fontSize: "0.9rem" }}>
                    Nenhum acesso registrado ainda.
                </p>
            )}

            {!loading && !error && logs.length > 0 && (
                <div
                    style={{
                        overflowX: "auto",
                        borderRadius: "10px",
                        border: "1px solid #e3eaf4",
                        maxHeight: "380px",
                        overflowY: "auto",
                    }}
                >
                    <table
                        style={{
                            width: "100%",
                            borderCollapse: "collapse",
                            fontSize: "0.88rem",
                        }}
                    >
                        <thead>
                            <tr
                                style={{
                                    background: "#e3f2fd",
                                    position: "sticky",
                                    top: 0,
                                }}
                            >
                                <th
                                    style={{
                                        padding: "10px 14px",
                                        textAlign: "left",
                                        color: "#1565c0",
                                        fontWeight: "bold",
                                        whiteSpace: "nowrap",
                                    }}
                                >
                                    Serva
                                </th>
                                <th
                                    style={{
                                        padding: "10px 14px",
                                        textAlign: "center",
                                        color: "#1565c0",
                                        fontWeight: "bold",
                                        whiteSpace: "nowrap",
                                    }}
                                >
                                    Data
                                </th>
                                <th
                                    style={{
                                        padding: "10px 14px",
                                        textAlign: "center",
                                        color: "#1565c0",
                                        fontWeight: "bold",
                                        whiteSpace: "nowrap",
                                    }}
                                >
                                    Hora
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {logs.map((log, i) => (
                                <tr
                                    key={log.id}
                                    style={{
                                        background: i % 2 === 0 ? "#fff" : "#f5f9ff",
                                        borderBottom: "1px solid #e8f0fe",
                                    }}
                                >
                                    <td
                                        style={{
                                            padding: "9px 14px",
                                            fontWeight: 500,
                                        }}
                                    >
                                        {log.user.name}
                                    </td>
                                    <td
                                        style={{
                                            padding: "9px 14px",
                                            textAlign: "center",
                                            color: "#444",
                                        }}
                                    >
                                        {formatDate(log.timestamp)}
                                    </td>
                                    <td
                                        style={{
                                            padding: "9px 14px",
                                            textAlign: "center",
                                            color: "#444",
                                        }}
                                    >
                                        {formatTime(log.timestamp)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
