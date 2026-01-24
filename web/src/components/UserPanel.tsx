import { useState, useEffect } from "react";
import {
  Flower,
  Calendar,
  FileText,
  User,
  Clock,
  LogOut,
  Heart,
  Trophy,
  Medal,
  Megaphone,
} from "lucide-react";
import { Mass, UserData, Notice } from "../types/types";
import { OfficialDocument } from "./OfficialDocument";
import { api } from "../services/api";
import { RankingModal } from "./RankingModal";
import { BadgesModal } from "./BadgesModal";
import { CountdownTimer, getAdjustedDeadline } from "./CountdownTimer";
import "./css/UserPanel.css";

interface UserPanelProps {
  masses: Mass[];
  user: UserData;
  onToggleSignup: (massId: string) => void;
  onLogout: () => void;
}

export function UserPanel({ masses, user, onToggleSignup, onLogout }: UserPanelProps) {
  const [activeTab, setActiveTab] = useState<"inscricoes" | "documento">("inscricoes");
  const [showBadges, setShowBadges] = useState(false);
  const [showRanking, setShowRanking] = useState(false);
  const [notices, setNotices] = useState<Notice[]>([]);

  useEffect(() => {
    api.get("/notices").then((res) => setNotices(res.data));
  }, []);

  const isExpired = (deadline?: string) => {
    if (!deadline) return false;
    return new Date().getTime() > getAdjustedDeadline(deadline).getTime();
  };

  const confirmedScore = masses.reduce((acc, mass) => {
    const mySignup = mass.signups.find((s) => s.userId === user.id);
    if (mySignup && mySignup.present) return acc + 1;
    return acc;
  }, 0);

  return (
    <div
      className="user-panel-container"
      style={{ width: "100%", overflowX: "hidden", position: "relative" }}
    >
      {/* Estilos de Animação */}
      <style>{`
        @keyframes pulse-alert {
          0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(255, 193, 7, 0.7); }
          50% { transform: scale(1.02); box-shadow: 0 0 10px 5px rgba(255, 193, 7, 0); }
          100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(255, 193, 7, 0); }
        }
        .notice-animated {
          animation: pulse-alert 2s infinite;
          transition: all 0.3s ease;
        }
      `}</style>

      {showBadges && (
        <BadgesModal count={confirmedScore} onClose={() => setShowBadges(false)} />
      )}
      {showRanking && (
        <RankingModal masses={masses} onClose={() => setShowRanking(false)} />
      )}

      <div
        className="header-hero no-print"
        style={{ width: "100%", boxSizing: "border-box" }}
      >
        <div className="header-icon-wrapper">
          <Flower size={32} strokeWidth={2} color="white" />
        </div>
        <h1>GRUPO DE SERVAS SANTA TEREZINHA</h1>
        <p>"Servir com alegria."</p>
      </div>

      <div
        className="container-tabs no-print"
        style={{ width: "100%", boxSizing: "border-box" }}
      >
        <div
          className="menu-tabs"
          style={{
            display: "flex",
            width: "100%",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "0 5px",
            boxSizing: "border-box",
          }}
        >
          <button
            onClick={() => setActiveTab("inscricoes")}
            className={`tab-btn ${activeTab === "inscricoes" ? "active" : ""}`}
            style={{ flex: 1, display: "flex", justifyContent: "center", gap: "5px" }}
          >
            <Calendar size={16} /> <span className="mobile-hide-text">Inscrições</span>
          </button>
          <button
            onClick={() => setActiveTab("documento")}
            className={`tab-btn ${activeTab === "documento" ? "active" : ""}`}
            style={{ flex: 1, display: "flex", justifyContent: "center", gap: "5px" }}
          >
            <FileText size={16} /> <span className="mobile-hide-text">Escala</span>
          </button>
          <button
            onClick={() => setShowRanking(true)}
            className="tab-btn"
            style={{
              color: "#4caf50",
              borderLeft: "1px solid #ddd",
              paddingLeft: "10px",
              marginLeft: "5px",
              display: "flex",
              justifyContent: "center",
            }}
            title="Placar Mensal"
          >
            <Medal size={20} />
          </button>
          <button
            onClick={() => setShowBadges(true)}
            className="tab-btn"
            style={{
              color: "#fbc02d",
              marginLeft: "5px",
              display: "flex",
              justifyContent: "center",
            }}
            title="Minhas Conquistas"
          >
            <Trophy size={20} />
          </button>
          <button
            onClick={onLogout}
            className="tab-btn logout"
            style={{ marginLeft: "5px" }}
          >
            <LogOut size={18} />
          </button>
        </div>
      </div>

      {/* Mural de Avisos */}
      {notices.length > 0 && (
        <div
          className="no-print"
          style={{
            margin: "15px 15px 5px 15px",
            display: "flex",
            flexDirection: "column",
            gap: "10px",
          }}
        >
          {notices.map((notice) => (
            <div
              key={notice.id}
              className="notice-animated"
              style={{
                background: "#fff9c4",
                borderLeft: "5px solid #ffc107",
                color: "#856404",
                padding: "15px",
                borderRadius: "8px",
                display: "flex",
                alignItems: "center",
                gap: "12px",
                boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
              }}
            >
              <div
                style={{
                  background: "#ffc107",
                  padding: "8px",
                  borderRadius: "50%",
                  color: "white",
                }}
              >
                <Megaphone size={20} fill="white" />
              </div>
              <div>
                <strong
                  style={{
                    display: "block",
                    fontSize: "0.8rem",
                    textTransform: "uppercase",
                    color: "#b08d55",
                    marginBottom: "2px",
                  }}
                >
                  Atenção, servas!
                </strong>
                <span style={{ fontSize: "1rem", fontWeight: "bold" }}>
                  {notice.text}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      <div style={{ flex: 1, width: "100%", boxSizing: "border-box" }}>
        {activeTab === "inscricoes" ? (
          <div className="container-responsive">
            <div style={{ padding: "0 15px" }}>
              {masses.map((mass) => {
                const totalInscritos = mass.signups ? mass.signups.length : 0;
                const vagasRestantes = mass.maxServers - totalInscritos;
                const jaEstouInscrita = mass.signups.some((s) => s.userId === user.id);

                // --- CORREÇÃO 1: Garante que se a função for vazia, usa "Auxiliar" ---
                const minhaFuncao =
                  mass.signups.find((s) => s.userId === user.id)?.role || "Auxiliar";

                // LÓGICA DA TRAVA
                const estaAberto = mass.open;
                const prazoEncerrado = isExpired(mass.deadline);
                const lotado = vagasRestantes <= 0;

                // --- CORREÇÃO 2: Define se a missa está "inativa" (para mudar cor) ---
                const isInativa = prazoEncerrado || (lotado && !jaEstouInscrita);

                // Botão trava se: Não sou eu E (prazo acabou OU lotou OU não abriu ainda)
                const botaoDesabilitado =
                  (!jaEstouInscrita && prazoEncerrado) ||
                  (!jaEstouInscrita && lotado) ||
                  (!jaEstouInscrita && !estaAberto);

                let btnClass = "servir";
                let btnText: React.ReactNode = (
                  <>
                    <Heart size={16} fill="white" /> Servir
                  </>
                );

                if (jaEstouInscrita) {
                  btnClass = "desistir";
                  btnText = "Desistir";
                } else if (!estaAberto) {
                  btnClass = "disabled";
                  btnText = "Em Breve";
                } else if (prazoEncerrado) {
                  btnClass = "disabled";
                  btnText = "Encerrado";
                } else if (lotado) {
                  btnClass = "disabled";
                  btnText = "Lotado";
                }

                // Estilo da Data (Rosa se ativa, Cinza se inativa)
                const dateBadgeStyle = isInativa
                  ? { backgroundColor: "#f5f5f5", color: "#9e9e9e" } // Cinza
                  : {}; // Usa o padrão do CSS (Rosa)

                // Opacidade do Card (Mais apagado se inativo)
                const cardOpacity = isInativa ? 0.7 : 1;

                return (
                  <div
                    key={mass.id}
                    className={`mass-card ${botaoDesabilitado && !jaEstouInscrita ? "disabled" : ""}`}
                    style={{ position: "relative", opacity: cardOpacity }}
                  >
                    {/* Só mostra cronômetro se estiver ABERTO e no PRAZO */}
                    {mass.deadline && !prazoEncerrado && estaAberto && (
                      <CountdownTimer deadline={mass.deadline} />
                    )}

                    <div className="card-header">
                      {/* Aplicando o estilo condicional na data */}
                      <div className="date-badge" style={dateBadgeStyle}>
                        <span className="date-day">{new Date(mass.date).getDate()}</span>
                        <span className="date-month">
                          {new Date(mass.date)
                            .toLocaleDateString("pt-BR", { month: "short" })
                            .replace(".", "")}
                        </span>
                      </div>
                      <div className="mass-info">
                        <h3 style={{ color: isInativa ? "#757575" : "inherit" }}>
                          {new Date(mass.date).toLocaleDateString("pt-BR", {
                            weekday: "long",
                          })}
                        </h3>
                        <div
                          className="mass-time"
                          style={{ color: isInativa ? "#9e9e9e" : "inherit" }}
                        >
                          <Clock size={14} />
                          {new Date(mass.date).toLocaleTimeString("pt-BR", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </div>
                      </div>
                    </div>

                    {/* Exibe a função se estiver inscrita (Agora sempre aparece, pois tem o padrão "Auxiliar") */}
                    {jaEstouInscrita && (
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
                        {btnText}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <OfficialDocument masses={masses.filter((m) => m.published)} />
        )}
      </div>

      <footer
        className="app-footer no-print"
        style={{ width: "100%", boxSizing: "border-box" }}
      >
        <p>
          Desenvolvido por{" "}
          <a
            href="https://www.linkedin.com/in/fecarvalhodev/"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: "#e91e63", textDecoration: "none", fontWeight: "bold" }}
          >
            Fernando Carvalho
          </a>
        </p>
        <p style={{ marginTop: "5px", opacity: 0.7 }}>
          &copy; {new Date().getFullYear()} Santuario Diocesano Nossa Senhora da
          Natividade
        </p>
      </footer>
    </div>
  );
}
