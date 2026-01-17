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

// --- FUNÇÃO AUXILIAR PARA AJUSTAR O PRAZO ---
// Se for 00:00 (meia-noite cravada), assume que é prazo do dia todo (23:59).
// Se tiver qualquer minuto ou hora (ex: 00:30), respeita o horário exato.
const getAdjustedDeadline = (deadlineString: string) => {
  const date = new Date(deadlineString);

  // Verifica se é exatamente 00:00:00
  if (date.getHours() === 0 && date.getMinutes() === 0 && date.getSeconds() === 0) {
    date.setHours(23, 59, 59, 999);
  }

  return date;
};

// --- COMPONENTE DE CRONÔMETRO ---
function CountdownTimer({ deadline }: { deadline: string }) {
  const [timeLeft, setTimeLeft] = useState("");

  useEffect(() => {
    const calculateTime = () => {
      const now = new Date();
      const deadlineDate = getAdjustedDeadline(deadline); // Usa a função inteligente
      const distance = deadlineDate.getTime() - now.getTime();

      if (distance < 0) {
        setTimeLeft("ENCERRADO");
      } else {
        const days = Math.floor(distance / (1000 * 60 * 60 * 24));
        const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000); // Adicionei segundos para precisão

        if (days > 0) {
          setTimeLeft(`${days}d ${hours}h`);
        } else if (hours > 0) {
          setTimeLeft(`${hours}h ${minutes}m`);
        } else {
          setTimeLeft(`${minutes}m ${seconds}s`); // Mostra segundos se faltar menos de 1h
        }
      }
    };

    calculateTime();
    const interval = setInterval(calculateTime, 1000); // Atualiza a cada segundo agora
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
        fontSize: "0.75rem",
        fontWeight: "bold",
        padding: "4px 8px",
        borderRadius: "8px",
        display: "flex",
        alignItems: "center",
        gap: "4px",
        zIndex: 2,
      }}
    >
      <Clock size={12} /> {timeLeft}
    </div>
  );
}

export function UserPanel({ masses, user, onToggleSignup, onLogout }: UserPanelProps) {
  const [activeTab, setActiveTab] = useState<"inscricoes" | "documento">("inscricoes");

  // --- LÓGICA DE VALIDAÇÃO (Precisão de Horário) ---
  const isExpired = (deadline?: string) => {
    if (!deadline) return false;
    const agora = new Date();
    const dataPrazo = getAdjustedDeadline(deadline);

    // Agora a comparação é exata (milessegundos)
    return agora.getTime() > dataPrazo.getTime();
  };

  return (
    <div className="user-panel-container">
      {/* 1. Header Hero */}
      <div className="header-hero no-print">
        <div className="header-icon-wrapper">
          <Flower size={36} strokeWidth={2} color="white" />
        </div>
        <h1>Escala das Servas</h1>
        <p>"Servir com alegria."</p>
      </div>

      {/* 2. Menu Flutuante */}
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

      {/* 3. Conteúdo */}
      {activeTab === "inscricoes" ? (
        <div className="container-responsive" style={{ paddingTop: "20px" }}>
          <div style={{ display: "grid", gap: "15px", paddingBottom: "40px" }}>
            {masses.map((mass) => {
              const totalInscritos = mass._count?.signups ?? 0;
              const vagasRestantes = mass.maxServers - totalInscritos;
              const jaEstouInscrita = mass.signups.some((s) => s.userId === user.id);
              const minhaFuncao = mass.signups.find((s) => s.userId === user.id)?.role;

              // Verifica validade com a nova função precisa
              const prazoEncerrado = isExpired(mass.deadline);
              const lotado = vagasRestantes <= 0;

              // Lógica de bloqueio do botão
              const botaoDesabilitado =
                (!jaEstouInscrita && prazoEncerrado) || (!jaEstouInscrita && lotado);

              // Classes de Estilo do Botão
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
                      <span className="date-day">{new Date(mass.date).getUTCDate()}</span>
                      <span className="date-month">
                        {new Date(mass.date)
                          .toLocaleDateString("pt-BR", {
                            month: "short",
                            timeZone: "UTC",
                          })
                          .replace(".", "")}
                      </span>
                    </div>

                    <div className="mass-info">
                      {mass.name && (
                        <div
                          style={{
                            color: "#e91e63",
                            fontWeight: "bold",
                            fontSize: "0.8rem",
                          }}
                        >
                          {mass.name}
                        </div>
                      )}
                      <h3>
                        {new Date(mass.date).toLocaleDateString("pt-BR", {
                          weekday: "long",
                          timeZone: "UTC",
                        })}
                      </h3>
                      <div className="mass-time">
                        <Clock size={14} />
                        {new Date(mass.date).toLocaleTimeString("pt-BR", {
                          hour: "2-digit",
                          minute: "2-digit",
                          timeZone: "UTC",
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
                    <div className="vagas-info">
                      <User size={16} />
                      <span style={{ fontWeight: "bold", color: "#333" }}>
                        {totalInscritos}
                      </span>
                      <span>/ {mass.maxServers}</span>
                    </div>

                    <button
                      className={`btn-action ${btnClass}`}
                      onClick={() => onToggleSignup(mass.id)}
                      disabled={botaoDesabilitado}
                    >
                      {jaEstouInscrita ? (
                        <>Desistir</>
                      ) : prazoEncerrado ? (
                        <>Encerrado</>
                      ) : lotado ? (
                        <>Lotado</>
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
