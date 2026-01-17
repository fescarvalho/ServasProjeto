import { useState, useEffect } from "react";
import { Flower, Calendar, FileText, User, Clock, LogOut, Heart } from "lucide-react";
import { Mass, UserData } from "../types/types";
import { OfficialDocument } from "./OfficialDocument";
import "./css/UserPanel.css";

interface UserPanelProps {
  masses: Mass[];
  user: UserData;
  onToggleSignup: (massId: string) => void;
  onLogout: () => void;
}

// Helper para ajustar prazo de 00:00 para 23:59
const getAdjustedDeadline = (deadlineString: string) => {
  const date = new Date(deadlineString);
  // Se for meia-noite exata, joga para o fim do dia
  if (date.getHours() === 0 && date.getMinutes() === 0) {
    date.setHours(23, 59, 59, 999);
  }
  return date;
};

// Cronômetro
function CountdownTimer({ deadline }: { deadline: string }) {
  const [timeLeft, setTimeLeft] = useState("");

  useEffect(() => {
    const calculateTime = () => {
      const now = new Date();
      const deadlineDate = getAdjustedDeadline(deadline);
      const distance = deadlineDate.getTime() - now.getTime();

      if (distance < 0) {
        setTimeLeft("ENCERRADO");
      } else {
        const days = Math.floor(distance / (1000 * 60 * 60 * 24));
        const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));

        if (days > 0) setTimeLeft(`${days}d ${hours}h`);
        else setTimeLeft(`${hours}h ${minutes}m`);
      }
    };
    calculateTime();
    const interval = setInterval(calculateTime, 1000 * 60);
    return () => clearInterval(interval);
  }, [deadline]);

  if (timeLeft === "ENCERRADO") return null;

  return (
    <div
      style={{
        position: "absolute",
        top: 15,
        right: 15,
        background: "#fff0f5",
        color: "#d81b60",
        fontSize: "0.7rem",
        fontWeight: "bold",
        padding: "4px 8px",
        borderRadius: "8px",
        display: "flex",
        alignItems: "center",
        gap: "4px",
      }}
    >
      <Clock size={12} /> {timeLeft}
    </div>
  );
}

export function UserPanel({ masses, user, onToggleSignup, onLogout }: UserPanelProps) {
  const [activeTab, setActiveTab] = useState<"inscricoes" | "documento">("inscricoes");

  const isExpired = (deadline?: string) => {
    if (!deadline) return false;
    return new Date().getTime() > getAdjustedDeadline(deadline).getTime();
  };

  return (
    <div className="user-panel-container">
      {/* Header */}
      <div className="header-hero no-print">
        <div className="header-icon-wrapper">
          <Flower size={32} strokeWidth={2} color="white" />
        </div>
        <h1>Escala das Servas</h1>
        <p>"Servir com alegria."</p>
      </div>

      {/* Abas */}
      <div className="container-tabs no-print">
        <div className="menu-tabs">
          <button
            onClick={() => setActiveTab("inscricoes")}
            className={`tab-btn ${activeTab === "inscricoes" ? "active" : ""}`}
          >
            <Calendar size={16} /> Inscrições
          </button>
          <button
            onClick={() => setActiveTab("documento")}
            className={`tab-btn ${activeTab === "documento" ? "active" : ""}`}
          >
            <FileText size={16} /> Escala
          </button>
          <button onClick={onLogout} className="tab-btn logout">
            <LogOut size={16} />
          </button>
        </div>
      </div>

      {/* Lista */}
      {activeTab === "inscricoes" ? (
        <div className="container-responsive">
          <div style={{ padding: "0 15px" }}>
            {masses.map((mass) => {
              const totalInscritos = mass._count?.signups ?? 0;
              const vagasRestantes = mass.maxServers - totalInscritos;
              const jaEstouInscrita = mass.signups.some((s) => s.userId === user.id);
              const minhaFuncao = mass.signups.find((s) => s.userId === user.id)?.role;

              const prazoEncerrado = isExpired(mass.deadline);
              const lotado = vagasRestantes <= 0;
              const botaoDesabilitado =
                (!jaEstouInscrita && prazoEncerrado) || (!jaEstouInscrita && lotado);

              let btnClass = "servir";
              if (jaEstouInscrita) btnClass = "desistir";
              else if (botaoDesabilitado) btnClass = "disabled";

              return (
                <div
                  key={mass.id}
                  className={`mass-card ${prazoEncerrado && !jaEstouInscrita ? "disabled" : ""}`}
                  style={{ position: "relative" }}
                >
                  {mass.deadline && !prazoEncerrado && (
                    <CountdownTimer deadline={mass.deadline} />
                  )}

                  <div className="card-header">
                    <div className="date-badge">
                      {/* Removi o UTC forçado para usar a data corrigida do backend */}
                      <span className="date-day">{new Date(mass.date).getDate()}</span>
                      <span className="date-month">
                        {new Date(mass.date)
                          .toLocaleDateString("pt-BR", { month: "short" })
                          .replace(".", "")}
                      </span>
                    </div>

                    <div className="mass-info">
                      <h3>
                        {new Date(mass.date).toLocaleDateString("pt-BR", {
                          weekday: "long",
                        })}
                      </h3>
                      <div className="mass-time">
                        <Clock size={14} />
                        {/* Exibe a hora normal (agora que o backend salvou certo) */}
                        {new Date(mass.date).toLocaleTimeString("pt-BR", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                    </div>
                  </div>

                  {jaEstouInscrita && minhaFuncao && (
                    <div
                      style={{
                        background: "#e1bee7",
                        color: "#7b1fa2",
                        padding: "4px 10px",
                        borderRadius: "8px",
                        fontSize: "0.8rem",
                        fontWeight: "bold",
                        marginBottom: "15px",
                        width: "fit-content",
                      }}
                    >
                      Sua função: {minhaFuncao}
                    </div>
                  )}

                  <div className="card-footer">
                    <div
                      className="vagas-info"
                      style={{ color: "#666", fontSize: "0.9rem" }}
                    >
                      <User size={16} style={{ marginRight: 4 }} />
                      <strong>{totalInscritos}</strong> / {mass.maxServers} vagas
                    </div>

                    <button
                      className={`btn-action ${btnClass}`}
                      onClick={() => onToggleSignup(mass.id)}
                      disabled={botaoDesabilitado}
                    >
                      {jaEstouInscrita ? (
                        "Desistir"
                      ) : prazoEncerrado ? (
                        "Encerrado"
                      ) : lotado ? (
                        "Lotado"
                      ) : (
                        <>
                          <Heart size={16} fill="white" /> Servir
                        </>
                      )}
                    </button>
                  </div>
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
