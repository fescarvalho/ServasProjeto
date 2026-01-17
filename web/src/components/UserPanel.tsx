import { useState, useEffect } from "react";
import { Flower, Calendar, FileText, User, Clock, AlertTriangle } from "lucide-react";
import { Mass, UserData } from "../types/types";
import { OfficialDocument } from "./OfficialDocument";
import "./css/UserPanel.css";
interface UserPanelProps {
  masses: Mass[];
  user: UserData;
  onToggleSignup: (massId: string) => void;
  onLogout: () => void;
}

// --- COMPONENTE DE CRONÔMETRO ---
function CountdownTimer({ deadline }: { deadline: string }) {
  const [timeLeft, setTimeLeft] = useState("");
  const [expired, setExpired] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date().getTime();
      const distance = new Date(deadline).getTime() - now;

      if (distance < 0) {
        setExpired(true);
        setTimeLeft("ENCERRADO");
        clearInterval(interval);
      } else {
        const days = Math.floor(distance / (1000 * 60 * 60 * 24));
        const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);

        setTimeLeft(
          `${days}d ${hours.toString().padStart(2, "0")}h ${minutes
            .toString()
            .padStart(2, "0")}m ${seconds.toString().padStart(2, "0")}s`,
        );
        setExpired(false);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [deadline]);

  if (expired) {
    return (
      <span
        style={{
          color: "red",
          fontWeight: "bold",
          fontSize: "0.8rem",
          display: "flex",
          alignItems: "center",
          gap: 4,
        }}
      >
        <AlertTriangle size={14} /> INSCRIÇÕES ENCERRADAS
      </span>
    );
  }

  return (
    <span
      style={{
        color: "#d32f2f",
        fontWeight: "bold",
        fontSize: "0.85rem",
        display: "flex",
        alignItems: "center",
        gap: 4,
        background: "#ffebee",
        padding: "4px 8px",
        borderRadius: 4,
      }}
    >
      <Clock size={14} /> Encerra em: {timeLeft}
    </span>
  );
}

export function UserPanel({ masses, user, onToggleSignup, onLogout }: UserPanelProps) {
  const [activeTab, setActiveTab] = useState<"inscricoes" | "documento">("inscricoes");

  // Verifica se o prazo acabou
  const isExpired = (deadline?: string) => {
    if (!deadline) return false;
    return new Date() > new Date(deadline);
  };

  return (
    <div>
      {/* Header */}
      <div className="header-hero no-print">
        <div className="container-responsive">
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              color: "#e91e63",
              marginBottom: 10,
            }}
          >
            <Flower size={40} strokeWidth={1} />
          </div>
          <h1>Escala das Servas</h1>
          <p>"Tudo é grande quando feito por amor."</p>
        </div>
      </div>

      {/* Menu de Abas */}
      <div className="container-responsive no-print">
        <div className="menu-tabs">
          <button
            onClick={() => setActiveTab("inscricoes")}
            className="tab-btn"
            style={{
              background: activeTab === "inscricoes" ? "white" : "rgba(255,255,255,0.6)",
              color: activeTab === "inscricoes" ? "#e91e63" : "#666",
            }}
          >
            <Calendar size={18} /> Inscrições
          </button>

          <button
            onClick={() => setActiveTab("documento")}
            className="tab-btn"
            style={{
              background: activeTab === "documento" ? "white" : "rgba(255,255,255,0.6)",
              color: activeTab === "documento" ? "#e91e63" : "#666",
            }}
          >
            <FileText size={18} /> Escala
          </button>

          <button
            onClick={onLogout}
            className="tab-btn"
            style={{ background: "rgba(255,255,255,0.4)" }}
          >
            Sair
          </button>
        </div>
      </div>

      {activeTab === "inscricoes" ? (
        <div className="container-responsive" style={{ marginTop: "-10px" }}>
          <div style={{ display: "grid", gap: 20, paddingBottom: 40 }}>
            {masses.map((mass) => {
              const vagasRestantes = mass.maxServers - mass._count!.signups;
              const jaEstouInscrita = mass.signups.some((s) => s.userId === user.id);
              const minhaFuncao = mass.signups.find((s) => s.userId === user.id)?.role;
              const prazoEncerrado = isExpired(mass.deadline);

              return (
                <div
                  key={mass.id}
                  className="mass-card"
                  style={{ opacity: prazoEncerrado ? 0.7 : 1 }}
                >
                  {/* Countdown */}
                  {mass.deadline && (
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "flex-end",
                        marginBottom: -10,
                      }}
                    >
                      <CountdownTimer deadline={mass.deadline} />
                    </div>
                  )}

                  {/* Cabeçalho do Card (Data e Nome) */}
                  <div className="card-header">
                    <div style={{ display: "flex", gap: "15px", alignItems: "center" }}>
                      <div className="date-badge">
                        <span
                          style={{
                            display: "block",
                            fontSize: "1.2rem",
                            fontWeight: "bold",
                            lineHeight: 1,
                          }}
                        >
                          {new Date(mass.date).toLocaleDateString("pt-BR", {
                            day: "2-digit",
                          })}
                        </span>
                        <span style={{ fontSize: "0.7rem", fontWeight: 600 }}>
                          {new Date(mass.date)
                            .toLocaleDateString("pt-BR", { month: "short" })
                            .toUpperCase()}
                        </span>
                      </div>

                      <div>
                        {mass.name && (
                          <div
                            style={{
                              color: "#e91e63",
                              fontWeight: "bold",
                              fontSize: "0.9rem",
                            }}
                          >
                            {mass.name}
                          </div>
                        )}
                        <h3
                          style={{
                            margin: 0,
                            fontSize: "1.1rem",
                            textTransform: "capitalize",
                          }}
                        >
                          {new Date(mass.date).toLocaleDateString("pt-BR", {
                            weekday: "long",
                          })}
                        </h3>
                        <span style={{ color: "#888", fontSize: "0.9rem" }}>
                          {new Date(mass.date).toLocaleTimeString("pt-BR", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                    </div>

                    {jaEstouInscrita && minhaFuncao && (
                      <div className="tag-role">{minhaFuncao}</div>
                    )}
                  </div>

                  {/* Rodapé do Card (Vagas e Botão) */}
                  <div className="card-footer">
                    <div
                      className="info-vagas"
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        color: "#666",
                      }}
                    >
                      <User size={18} />
                      <span style={{ fontSize: "0.9rem" }}>
                        <strong style={{ color: "#e91e63" }}>
                          {mass._count!.signups}
                        </strong>{" "}
                        / {mass.maxServers} vagas
                      </span>
                    </div>

                    <button
                      className="btn-action"
                      onClick={() => onToggleSignup(mass.id)}
                      disabled={
                        prazoEncerrado || (!jaEstouInscrita && vagasRestantes <= 0)
                      }
                      style={{
                        background: prazoEncerrado
                          ? "#e0e0e0"
                          : jaEstouInscrita
                            ? "white"
                            : vagasRestantes > 0
                              ? "#e91e63"
                              : "#e0e0e0",
                        color: prazoEncerrado
                          ? "#888"
                          : jaEstouInscrita
                            ? "#d32f2f"
                            : vagasRestantes > 0
                              ? "white"
                              : "#888",
                        border:
                          jaEstouInscrita && !prazoEncerrado
                            ? "1px solid #d32f2f"
                            : "none",
                      }}
                    >
                      {prazoEncerrado
                        ? "Prazo Encerrado"
                        : jaEstouInscrita
                          ? "Desistir"
                          : vagasRestantes > 0
                            ? "Servir"
                            : "Lotado"}
                    </button>
                  </div>

                  {/* Mensagem de erro/aviso */}
                  {prazoEncerrado && (
                    <div
                      style={{
                        textAlign: "center",
                        fontSize: "0.8rem",
                        color: "#999",
                        marginTop: -5,
                      }}
                    >
                      Inscrições encerradas.
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <OfficialDocument masses={masses} />
      )}
    </div>
  );
}
