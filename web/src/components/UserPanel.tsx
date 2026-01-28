import { useState, useEffect, useMemo } from "react";
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
  ChevronLeft,
  ChevronRight,
  Search
} from "lucide-react";
import { Mass, UserData, Notice } from "../types/types";
import { OfficialDocument } from "./OfficialDocument";
import { api } from "../services/api";
import { RankingModal } from "./RankingModal";
import { BadgesModal } from "./BadgesModal";
import { CountdownTimer } from "./CountdownTimer";
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

  // --- FILTRO MENSAL ---
  const [selectedDate, setSelectedDate] = useState(new Date());

  useEffect(() => {
    api.get("/notices").then((res) => setNotices(res.data));
  }, []);

  // Helpers de Data
  const currentMonthName = selectedDate.toLocaleDateString("pt-BR", { month: "long" });
  const currentYear = selectedDate.getFullYear();

  // Navegação do Mês
  const handlePrevMonth = () => {
    setSelectedDate(d => new Date(d.getFullYear(), d.getMonth() - 1, 1));
  };
  const handleNextMonth = () => {
    setSelectedDate(d => new Date(d.getFullYear(), d.getMonth() + 1, 1));
  };

  // --- FILTRO PRINCIPAL ---
  const filteredMasses = useMemo(() => {
    return masses.filter(mass => {
      const mDate = new Date(mass.date);
      // Ajuste de Fuso (segurança)
      const brDate = new Date(mDate.toLocaleString("en-US", { timeZone: "America/Sao_Paulo" }));
      
      return (
        brDate.getMonth() === selectedDate.getMonth() &&
        brDate.getFullYear() === selectedDate.getFullYear()
      );
    });
  }, [masses, selectedDate]);


  // Função robusta para checar se expirou
  const checkStatus = (massDate: string, deadline?: string) => {
    const now = new Date();
    if (deadline) return new Date(deadline) < now;
    const massD = new Date(massDate);
    return massD < now;
  };

  const confirmedScore = masses.reduce((acc, mass) => {
    const mySignup = mass.signups.find((s) => s.userId === user.id);
    if (mySignup && mySignup.present) return acc + 1;
    return acc;
  }, 0);

  return (
    <div
      className="user-panel-container"
      style={{ 
        width: "100%", 
        minHeight: "100vh",
        overflowX: "hidden", 
        position: "relative",
        display: "flex", 
        flexDirection: "column",
        backgroundColor: "#f5f5f5"
      }}
    >
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

        .card-inactive {
          background-color: #f0f0f0 !important;
          opacity: 0.8;
          border: 1px solid #ddd !important;
        }
        .card-inactive .date-badge {
          background-color: #e0e0e0 !important;
          color: #757575 !important;
        }
        .card-inactive h3, .card-inactive .mass-time, .card-inactive .vagas-info {
          color: #9e9e9e !important;
        }

        .mass-highlight {
          border: 2px solid #e91e63 !important;
          box-shadow: 0 4px 20px rgba(233, 30, 99, 0.15) !important;
          background-color: #fff !important;
        }

        .role-pill {
          background-color: #e1bee7 !important;
          color: #7b1fa2 !important;
          font-weight: bold;
          border-radius: 8px;
          padding: 6px 12px;
          font-size: 0.85rem;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          margin-bottom: 15px;
        }

        /* ESTILO DO FILTRO MENSAL */
        .month-navigator {
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: white;
          margin: 10px 15px;
          padding: 10px;
          border-radius: 12px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.05);
          border: 1px solid #eee;
        }
        .nav-btn {
          background: #fce4ec;
          border: none;
          color: #e91e63;
          width: 36px;
          height: 36px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: background 0.2s;
        }
        .nav-btn:hover {
          background: #f8bbd0;
        }
        .current-month-label {
          font-size: 1.1rem;
          font-weight: 800;
          color: #333;
          text-transform: capitalize;
          display: flex;
          flex-direction: column;
          align-items: center;
          line-height: 1.1;
        }
        .current-year-label {
          font-size: 0.75rem;
          color: #888;
          font-weight: normal;
        }
      `}</style>

      {showBadges && (
        <BadgesModal count={confirmedScore} onClose={() => setShowBadges(false)} />
      )}
      {showRanking && (
        <RankingModal masses={masses} onClose={() => setShowRanking(false)} />
      )}

      {/* HEADER HERO */}
      <div className="header-hero no-print" style={{ width: "100%", boxSizing: "border-box", paddingBottom: "30px" }}>
        <div className="header-icon-wrapper">
          <Flower size={32} strokeWidth={2} color="white" />
        </div>
        
        <h1>GRUPO DE SERVAS SANTA TEREZINHA</h1>
        
        {/* MENSAGEM DE BOAS-VINDAS COM A ROSA */}
        <div style={{ 
          marginTop: "10px", 
          marginBottom: "5px",
          background: "rgba(255, 255, 255, 0.2)", 
          padding: "6px 16px", 
          borderRadius: "30px", 
          display: "inline-block",
          backdropFilter: "blur(5px)"
        }}>
          <p style={{ margin: 0, fontSize: "1.1rem", fontWeight: "400" }}>
            Bem-vinda, <strong style={{ fontWeight: "800" }}>{user.name.split(" ")[0]}</strong> 🌹
          </p>
        </div>

        <p style={{ fontSize: "0.9rem", opacity: 0.9, marginTop: "5px" }}>"Servir com alegria."</p>
      </div>

      {/* ABAS */}
      <div className="container-tabs no-print" style={{ width: "100%", boxSizing: "border-box" }}>
        <div className="menu-tabs" style={{ display: "flex", width: "100%", justifyContent: "space-between", alignItems: "center", padding: "0 5px", boxSizing: "border-box" }}>
          <button onClick={() => setActiveTab("inscricoes")} className={`tab-btn ${activeTab === "inscricoes" ? "active" : ""}`} style={{ flex: 1, display: "flex", justifyContent: "center", gap: "5px" }}>
            <Calendar size={16} /> <span className="mobile-hide-text">Inscrições</span>
          </button>
          <button onClick={() => setActiveTab("documento")} className={`tab-btn ${activeTab === "documento" ? "active" : ""}`} style={{ flex: 1, display: "flex", justifyContent: "center", gap: "5px" }}>
            <FileText size={16} /> <span className="mobile-hide-text">Escala</span>
          </button>
          <button onClick={() => setShowRanking(true)} className="tab-btn" style={{ color: "#4caf50", borderLeft: "1px solid #ddd", paddingLeft: "10px", marginLeft: "5px", display: "flex", justifyContent: "center" }} title="Placar Mensal">
            <Medal size={20} />
          </button>
          <button onClick={() => setShowBadges(true)} className="tab-btn" style={{ color: "#fbc02d", marginLeft: "5px", display: "flex", justifyContent: "center" }} title="Minhas Conquistas">
            <Trophy size={20} />
          </button>
          <button onClick={onLogout} className="tab-btn logout" style={{ marginLeft: "5px" }}>
            <LogOut size={18} />
          </button>
        </div>
      </div>

      {/* AVISOS */}
      {notices.length > 0 && (
        <div className="no-print" style={{ margin: "15px 15px 5px 15px", display: "flex", flexDirection: "column", gap: "10px" }}>
          {notices.map((notice) => (
            <div key={notice.id} className="notice-animated" style={{ background: "#fff9c4", borderLeft: "5px solid #ffc107", color: "#856404", padding: "15px", borderRadius: "8px", display: "flex", alignItems: "center", gap: "12px", boxShadow: "0 4px 6px rgba(0,0,0,0.1)" }}>
              <div style={{ background: "#ffc107", padding: "8px", borderRadius: "50%", color: "white" }}>
                <Megaphone size={20} fill="white" />
              </div>
              <div>
                <strong style={{ display: "block", fontSize: "0.8rem", textTransform: "uppercase", color: "#b08d55", marginBottom: "2px" }}>Atenção, servas!</strong>
                <span style={{ fontSize: "1rem", fontWeight: "bold" }}>{notice.text}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* CONTEÚDO PRINCIPAL */}
      <div style={{ flex: 1, width: "100%", boxSizing: "border-box" }}>
        {activeTab === "inscricoes" ? (
          <div className="container-responsive">
            
            {/* NAVEGADOR DE MESES */}
            <div className="month-navigator">
              <button className="nav-btn" onClick={handlePrevMonth}>
                <ChevronLeft size={20} />
              </button>
              
              <div className="current-month-label">
                {currentMonthName}
                <span className="current-year-label">{currentYear}</span>
              </div>

              <button className="nav-btn" onClick={handleNextMonth}>
                <ChevronRight size={20} />
              </button>
            </div>

            <div style={{ padding: "0 15px" }}>
              
              {/* FEEDBACK SE NÃO HOUVER MISSAS NO MÊS */}
              {filteredMasses.length === 0 && (
                <div style={{ 
                  textAlign: "center", padding: "40px 20px", color: "#999", 
                  border: "2px dashed #eee", borderRadius: "12px", margin: "10px 0" 
                }}>
                  <Search size={32} style={{ opacity: 0.3, marginBottom: 10 }} />
                  <p>Nenhuma escala encontrada para <strong>{currentMonthName}</strong>.</p>
                  <p style={{ fontSize: "0.8rem" }}>Use as setas acima para navegar.</p>
                </div>
              )}

              {filteredMasses.map((mass) => {
                const totalInscritos = mass.signups ? mass.signups.length : 0;
                const vagasRestantes = mass.maxServers - totalInscritos;
                const jaEstouInscrita = mass.signups.some((s) => s.userId === user.id);
                const minhaFuncao = mass.signups.find((s) => s.userId === user.id)?.role || "Auxiliar";

                // ESTADOS
                const estaAberto = mass.open;
                const prazoEncerrado = checkStatus(mass.date, mass.deadline);
                const lotado = vagasRestantes <= 0;
                const mostrarFuncao = jaEstouInscrita && mass.published;

                // Lógica de Botão
                const botaoDesabilitado = prazoEncerrado || !estaAberto || (!jaEstouInscrita && lotado);

                // Classes Visuais
                const isInativa = prazoEncerrado || (lotado && !jaEstouInscrita);
                const isAvailable = estaAberto && !prazoEncerrado && !lotado && !jaEstouInscrita;

                let cardClass = "";
                if (isInativa) cardClass = "card-inactive";
                else if (isAvailable) cardClass = "mass-highlight";

                let btnClass = "servir";
                // --- RESTAURADO PARA CORAÇÃO (HEART) ---
                let btnText: React.ReactNode = <><Heart size={16} fill="white" /> Servir</>;

                if (jaEstouInscrita) {
                  if (botaoDesabilitado) {
                    btnClass = "disabled";
                    btnText = "Inscrita (Fechado)";
                  } else {
                    btnClass = "desistir";
                    btnText = "Desistir";
                  }
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

                const defaultDateBadgeStyle = { backgroundColor: "#fce4ec", color: "#e91e63" };

                return (
                  <div
                    key={mass.id}
                    className={`mass-card ${cardClass} ${botaoDesabilitado && !jaEstouInscrita ? "disabled" : ""}`}
                    style={{ position: "relative" }}
                  >
                    {/* Timer */}
                    {mass.deadline && !prazoEncerrado && estaAberto && (
                      <CountdownTimer deadline={mass.deadline} />
                    )}

                    <div className="card-header">
                      <div className="date-badge" style={defaultDateBadgeStyle}>
                        <span className="date-day">{new Date(mass.date).getDate()}</span>
                        <span className="date-month">
                          {new Date(mass.date).toLocaleDateString("pt-BR", { month: "short" }).replace(".", "")}
                        </span>
                      </div>
                      <div className="mass-info">
                        <h3>
                          {new Date(mass.date).toLocaleDateString("pt-BR", { weekday: "long" })}
                        </h3>
                        <div className="mass-time">
                          <Clock size={14} />
                          {new Date(mass.date).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                        </div>
                      </div>
                    </div>
                    
                    {mostrarFuncao && (
                      <div className="role-pill">
                        <User size={14} /> 
                        Sua função: {minhaFuncao}
                      </div>
                    )}
                    
                    <div className="card-footer">
                      <div className="vagas-info" style={{ color: "#666", fontSize: "0.9rem" }}>
                        <User size={16} style={{ marginRight: 4 }} />
                        <strong>{totalInscritos}</strong> / {mass.maxServers} vagas
                      </div>
                      <button className={`btn-action ${btnClass}`} onClick={() => onToggleSignup(mass.id)} disabled={botaoDesabilitado}>
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

      <footer className="app-footer no-print" style={{ width: "100%", boxSizing: "border-box" }}>
        <p>
          Desenvolvido por <a href="https://www.linkedin.com/in/fecarvalhodev/" target="_blank" rel="noopener noreferrer" style={{ color: "#e91e63", textDecoration: "none", fontWeight: "bold" }}>Fernando Carvalho</a>
        </p>
        <p style={{ marginTop: "5px", opacity: 0.7 }}>
          &copy; {new Date().getFullYear()} Santuário Diocesano Nossa Senhora da Natividade - v2.7 (Rosa no Nome)
        </p>
      </footer>
    </div>
  );
}