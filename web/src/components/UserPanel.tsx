import { useState, useEffect } from "react";
import {
  Flower,
  Calendar,
  FileText,
  User,
  Clock,
  AlertTriangle,
  LogOut,
  Heart,
} from "lucide-react";
import { Mass, UserData } from "../types/types";
import { OfficialDocument } from "./OfficialDocument";
import "./css/UserPanel.css";

interface UserPanelProps {
  masses: Mass[];
  user: UserData;
  onToggleSignup: (massId: string) => void;
  onLogout: () => void;
}

// --- COMPONENTE DE CRONÔMETRO (Visual Badge) ---
function CountdownTimer({ deadline }: { deadline: string }) {
  const [timeLeft, setTimeLeft] = useState("");
  const [expired, setExpired] = useState(false);

  useEffect(() => {
    const calculateTime = () => {
      const now = new Date().getTime();
      const deadlineDate = new Date(deadline);

      if (deadlineDate.getHours() === 0 && deadlineDate.getMinutes() === 0) {
        deadlineDate.setHours(23, 59, 59, 999);
      }

      const distance = deadlineDate.getTime() - now;

      if (distance < 0) {
        setExpired(true);
        setTimeLeft("ENCERRADO");
      } else {
        const days = Math.floor(distance / (1000 * 60 * 60 * 24));
        const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));

        let timeString = "";
        if (days > 0) timeString += `${days}d `;
        timeString += `${hours}h ${minutes}m`;

        setTimeLeft(timeString);
        setExpired(false);
      }
    };

    calculateTime();
    const interval = setInterval(calculateTime, 1000 * 60);
    return () => clearInterval(interval);
  }, [deadline]);

  if (expired) {
    return (
      <div className="timer-badge expired">
        <AlertTriangle size={12} /> Encerrado
      </div>
    );
  }

  return (
    <div className="timer-badge">
      <Clock size={12} /> {timeLeft}
    </div>
  );
}

export function UserPanel({ masses, user, onToggleSignup, onLogout }: UserPanelProps) {
  const [activeTab, setActiveTab] = useState<"inscricoes" | "documento">("inscricoes");

  const isExpired = (deadline?: string) => {
    if (!deadline) return false;
    const agora = new Date();
    const dataPrazo = new Date(deadline);
    if (dataPrazo.getHours() === 0 && dataPrazo.getMinutes() === 0) {
      dataPrazo.setHours(23, 59, 59, 999);
    }
    return agora > dataPrazo;
  };

  return (
    <div className="user-panel-container">
      {/* 1. Header Hero com Degradê */}
      <div className="header-hero no-print">
        <div className="header-icon-wrapper">
          <Flower size={40} strokeWidth={1.5} color="white" />
        </div>
        <h1>Escala das Servas</h1>
        <p>"Tudo é grande quando feito por amor."</p>
      </div>

      {/* 2. Menu Flutuante */}
      <div className="container-responsive no-print">
        <div className="menu-tabs">
          <button
            onClick={() => setActiveTab("inscricoes")}
            className={`tab-btn ${activeTab === "inscricoes" ? "active" : ""}`}
          >
            <Calendar size={18} /> Inscrições
          </button>

          <button
            onClick={() => setActiveTab("documento")}
            className={`tab-btn ${activeTab === "documento" ? "active" : ""}`}
          >
            <FileText size={18} /> Escala Oficial
          </button>

          <button onClick={onLogout} className="tab-btn logout">
            <LogOut size={18} /> Sair
          </button>
        </div>
      </div>

      {/* 3. Conteúdo Principal */}
      {activeTab === "inscricoes" ? (
        <div className="container-responsive">
          <div style={{ display: "grid", gap: "20px", paddingBottom: "40px" }}>
            {masses.map((mass) => {
              const totalInscritos = mass._count?.signups ?? 0;
              const vagasRestantes = mass.maxServers - totalInscritos;
              const jaEstouInscrita = mass.signups.some((s) => s.userId === user.id);
              const minhaFuncao = mass.signups.find((s) => s.userId === user.id)?.role;
              const prazoEncerrado = isExpired(mass.deadline);
              const botaoDesabilitado =
                (!jaEstouInscrita && prazoEncerrado) ||
                (!jaEstouInscrita && vagasRestantes <= 0);

              // Determina a classe do botão para estilização
              let btnClass = "servir"; // Padrão
              if (jaEstouInscrita) btnClass = "desistir";
              if (botaoDesabilitado) btnClass = "disabled";

              return (
                <div
                  key={mass.id}
                  className={`mass-card ${prazoEncerrado && !jaEstouInscrita ? "disabled" : ""}`}
                >
                  {/* Cronômetro no topo direito */}
                  {mass.deadline && !prazoEncerrado && (
                    <CountdownTimer deadline={mass.deadline} />
                  )}

                  <div className="card-header">
                    {/* Badge da Data */}
                    <div className="date-badge">
                      <span className="date-day">
                        {new Date(mass.date).toLocaleDateString("pt-BR", {
                          day: "2-digit",
                        })}
                      </span>
                      <span className="date-month">
                        {new Date(mass.date).toLocaleDateString("pt-BR", {
                          month: "short",
                        })}
                      </span>
                    </div>

                    {/* Informações da Missa */}
                    <div className="mass-info">
                      {mass.name && <div className="mass-name">{mass.name}</div>}
                      <h3>
                        {new Date(mass.date).toLocaleDateString("pt-BR", {
                          weekday: "long",
                        })}
                      </h3>
                      <div className="mass-time">
                        <Clock size={14} />
                        {new Date(mass.date).toLocaleTimeString("pt-BR", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                    </div>

                    {/* Badge se já tiver função */}
                    {jaEstouInscrita && minhaFuncao && (
                      <div className="tag-role">{minhaFuncao}</div>
                    )}
                  </div>

                  <div className="card-footer">
                    {/* Contador de Vagas */}
                    <div className="vagas-info">
                      <User size={16} />
                      <strong>{totalInscritos}</strong>
                      <span>/ {mass.maxServers} vagas</span>
                    </div>

                    {/* Botão de Ação */}
                    <button
                      className={`btn-action ${btnClass}`}
                      onClick={() => onToggleSignup(mass.id)}
                      disabled={botaoDesabilitado}
                    >
                      {prazoEncerrado && !jaEstouInscrita ? (
                        <>Encerrado</>
                      ) : jaEstouInscrita ? (
                        <>Desistir</>
                      ) : vagasRestantes > 0 ? (
                        <>
                          <Heart size={16} fill="white" /> Servir
                        </>
                      ) : (
                        <>Lotado</>
                      )}
                    </button>
                  </div>

                  {/* Mensagem discreta de encerramento */}
                  {prazoEncerrado && !jaEstouInscrita && (
                    <div
                      style={{
                        textAlign: "center",
                        fontSize: "0.75rem",
                        color: "#999",
                        marginTop: "-10px",
                      }}
                    >
                      Inscrições finalizadas.
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
