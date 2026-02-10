import { useState, useEffect, useMemo, useRef } from "react";
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
  Search,
  Hourglass
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

  // Refs para o Auto-Scroll
  const itemsRef = useRef<Map<string, HTMLDivElement> | null>(null);

  // --- FILTRO MENSAL ---
  const [selectedDate, setSelectedDate] = useState(new Date());

  useEffect(() => {
    api.get("/notices").then((res) => setNotices(res.data));
  }, []);

  // Inicializa o Map de refs
  function getMap() {
    if (!itemsRef.current) {
      itemsRef.current = new Map();
    }
    return itemsRef.current;
  }

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

  // --- FILTRO PRINCIPAL (Ordenado por data) ---
  const filteredMasses = useMemo(() => {
    const filtered = masses.filter(mass => {
      const mDate = new Date(mass.date);
      const brDate = new Date(mDate.toLocaleString("en-US", { timeZone: "America/Sao_Paulo" }));
      
      return (
        brDate.getMonth() === selectedDate.getMonth() &&
        brDate.getFullYear() === selectedDate.getFullYear()
      );
    });

    return filtered.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [masses, selectedDate]);

  // --- AUTO-SCROLL PARA A PRIMEIRA DATA DISPONÍVEL ---
  useEffect(() => {
    if (activeTab === "inscricoes" && filteredMasses.length > 0) {
      const now = new Date();
      now.setHours(0, 0, 0, 0); 

      const firstUpcoming = filteredMasses.find(m => new Date(m.date) >= now);

      if (firstUpcoming) {
        const node = getMap().get(firstUpcoming.id);
        if (node) {
          setTimeout(() => {
            node.scrollIntoView({ 
              behavior: "smooth", 
              block: "center", 
              inline: "start" 
            });
          }, 300);
        }
      }
    }
  }, [selectedDate, activeTab, filteredMasses]);

  // Função robusta para checar se expirou
  const checkStatus = (massDate: string, deadline?: string) => {
    const now = new Date();
    if (deadline) return new Date(deadline) < now;
    const massD = new Date(massDate);
    return massD < now;
  };

  const confirmedScore = masses.reduce((acc, mass) => {
    const mySignup = mass.signups.find((s) => s.userId === user.id);
    if (mySignup && mySignup.present && (mySignup as any).status !== "RESERVA") return acc + 1;
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

        /* --- LAYOUT RESPONSIVO: MOBILE VS PC --- */
        
        .responsive-list-container {
          display: flex;
          overflow-x: auto;
          gap: 15px;
          padding: 10px 15px 30px 15px;
          scroll-snap-type: x mandatory;
          -webkit-overflow-scrolling: touch;
          scrollbar-width: none;
          scroll-padding-left: 15px;
        }
        .responsive-list-container::-webkit-scrollbar { display: none; }

        .responsive-card {
          min-width: 88%;
          max-width: 400px;
          scroll-snap-align: start; 
          flex-shrink: 0;
          background: white;
          border-radius: 20px; /* Mais arredondado */
          box-shadow: 0 10px 30px rgba(0,0,0,0.08); /* Sombra mais difusa */
          padding: 20px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          position: relative;
          border: none; /* Remove borda cinza padrão */
        }

        @media (min-width: 768px) {
          .responsive-list-container {
            display: flex;
            flex-direction: column;
            gap: 15px;
            padding: 20px;
            max-width: 800px;
            margin: 0 auto;
            overflow-x: visible;
          }

          .responsive-card {
            width: 100%;
            min-width: auto;
            max-width: none;
            scroll-snap-align: none;
          }
        }

        /* --- ESTILOS ESPECÍFICOS DO CARD (BASEADO NA IMAGEM) --- */

        /* Badge Rosa com Onda */
        .pink-date-badge {
          width: 65px;
          height: 65px;
          background: linear-gradient(180deg, #ff2e63 0%, #ff0055 100%);
          border-radius: 14px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          color: white;
          position: relative;
          overflow: hidden;
          box-shadow: 0 4px 10px rgba(255, 46, 99, 0.4);
        }
        
        /* Efeito de onda sutil no badge */
        .pink-date-badge::after {
          content: '';
          position: absolute;
          bottom: -10px;
          left: 0;
          width: 100%;
          height: 30px;
          background: rgba(255, 255, 255, 0.2);
          border-radius: 50% 50% 0 0;
          transform: scaleX(1.5);
        }

        /* Texto da Data */
        .pink-date-badge .day { font-size: 1.6rem; fontWeight: 700; line-height: 1; z-index: 2; }
        .pink-date-badge .month { font-size: 0.75rem; text-transform: uppercase; fontWeight: 600; z-index: 2; margin-top: 2px; }

        /* Título e Hora */
        .card-title {
          font-size: 1.1rem;
          font-weight: 700;
          color: #2d3436;
          line-height: 1.3;
          margin-bottom: 6px;
        }
        
        .card-time {
          display: flex;
          align-items: center;
          gap: 6px;
          color: #636e72;
          font-size: 0.95rem;
          font-weight: 500;
        }

        /* Vagas */
        .vagas-text {
          display: flex;
          align-items: center;
          gap: 5px;
          font-size: 1rem;
          color: #2d3436;
          margin-bottom: 12px; /* Espaço antes do botão */
        }
        .vagas-text strong { font-weight: 700; font-size: 1.1rem; }
        .vagas-text span { color: #636e72; font-size: 0.9rem; }

        /* Botão "SERVIR" com Onda */
        .btn-servir {
          width: 100%;
          padding: 14px;
          border-radius: 12px;
          border: none;
          background: linear-gradient(90deg, #ff2e63 0%, #ff4081 100%);
          color: white;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 1px;
          font-size: 1rem;
          cursor: pointer;
          position: relative;
          overflow: hidden;
          box-shadow: 0 5px 15px rgba(255, 46, 99, 0.3);
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }
        
        /* Onda no botão */
        .btn-servir::after {
          content: '';
          position: absolute;
          bottom: -15px;
          right: -10px;
          width: 60px;
          height: 60px;
          background: rgba(255, 255, 255, 0.15);
          border-radius: 50%;
        }

        .btn-desistir {
          width: 100%; padding: 12px; border-radius: 12px; border: 2px solid #ff2e63;
          background: transparent; color: #ff2e63; font-weight: 700; cursor: pointer; text-transform: uppercase;
        }
        
        .btn-disabled {
          width: 100%; padding: 12px; border-radius: 12px; border: none;
          background: #dfe6e9; color: #b2bec3; font-weight: 700; cursor: not-allowed; text-transform: uppercase;
        }

        .btn-reserva {
          width: 100%; padding: 12px; border-radius: 12px; border: none;
          background: #ff9f43; color: white; font-weight: 700; cursor: pointer; text-transform: uppercase;
          box-shadow: 0 5px 15px rgba(255, 159, 67, 0.3);
        }

        /* Navegação */
        .month-navigator {
          display: flex; 
          align-items: center; 
          justify-content: space-between; 
          background: white;
          width: 100%; 
          padding: 15px 20px; 
          border-bottom: 1px solid #f0f0f0; 
          box-shadow: 0 2px 10px rgba(0,0,0,0.03);
          margin-bottom: 15px;
          box-sizing: border-box;
        }
        .nav-btn {
          background: #fff0f3; border: none; color: #ff2e63; 
          width: 36px; height: 36px; border-radius: 50%;
          display: flex; alignItems: center; justifyContent: center; cursor: pointer;
        }
        .current-month-label {
          flex: 1; /* Adicionado para ocupar o espaço total */
          font-size: 1.1rem; 
          font-weight: 800; 
          color: #333; 
          text-transform: capitalize; 
          text-align: center; /* Garante que o texto fique no meio */
          display: flex; 
          flex-direction: column; 
          align-items: center;
          line-height: 1.1;
        }
        .current-year-label { font-size: 0.75rem; color: #888; fontWeight: normal; }
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
          <div>
            
            {/* NAVEGADOR DE MESES */}
            <div className="month-navigator">
              <button className="nav-btn" onClick={handlePrevMonth}>
                <ChevronLeft size={18} />
              </button>
              
              <div className="current-month-label">
                {currentMonthName}
                <span className="current-year-label">{currentYear}</span>
              </div>

              <button className="nav-btn" onClick={handleNextMonth}>
                <ChevronRight size={18} />
              </button>
            </div>

            {/* LISTA VAZIA */}
            {filteredMasses.length === 0 ? (
              <div style={{ 
                textAlign: "center", padding: "40px 20px", color: "#999", 
                border: "2px dashed #eee", borderRadius: "12px", margin: "10px 15px" 
              }}>
                <Search size={32} style={{ opacity: 0.3, marginBottom: 10 }} />
                <p>Nenhuma escala encontrada para <strong>{currentMonthName}</strong>.</p>
                <p style={{ fontSize: "0.8rem" }}>Use as setas acima para navegar.</p>
              </div>
            ) : (
              /* --- LISTA RESPONSIVA --- */
              <div className="responsive-list-container">
                {filteredMasses.map((mass) => {
                  const totalConfirmados = mass.signups ? mass.signups.filter((s: any) => s.status !== "RESERVA").length : 0;
                  const vagasRestantes = mass.maxServers - totalConfirmados;
                  const meuSignup = mass.signups.find((s) => s.userId === user.id);
                  const jaEstouInscrita = !!meuSignup;
                  const souReserva = (meuSignup as any)?.status === "RESERVA";
                  const minhaFuncao = meuSignup?.role || "Auxiliar";

                  const estaAberto = mass.open;
                  const prazoEncerrado = checkStatus(mass.date, mass.deadline);
                  const lotado = vagasRestantes <= 0;
                  
                  const mostrarFuncao = jaEstouInscrita; 

                  const botaoDesabilitado = prazoEncerrado || !estaAberto;
                  const isInativa = prazoEncerrado; 
                  const isAvailable = estaAberto && !prazoEncerrado;

                  let btnClass = "btn-servir";
                  let btnText: React.ReactNode = <><Heart size={16} fill="white" /> SERVIR</>;

                  if (jaEstouInscrita) {
                    if (botaoDesabilitado) {
                      btnClass = "btn-disabled";
                      btnText = "FECHADO";
                    } else {
                      btnClass = "btn-desistir";
                      btnText = souReserva ? "SAIR DA RESERVA" : "DESISTIR";
                    }
                  } else if (!estaAberto) {
                    btnClass = "btn-disabled";
                    btnText = "EM BREVE";
                  } else if (prazoEncerrado) {
                    btnClass = "btn-disabled";
                    btnText = "ENCERRADO";
                  } else if (lotado) {
                    btnClass = "btn-reserva";
                    btnText = <><Hourglass size={16} /> FILA DE ESPERA</>;
                  }

                  return (
                    <div
                      key={mass.id}
                      ref={(node) => {
                        const map = getMap();
                        if (node) map.set(mass.id, node);
                        else map.delete(mass.id);
                      }}
                      className={`responsive-card ${isInativa ? "card-inactive" : ""}`}
                    >
                      {/* Timer */}
                      {mass.deadline && !prazoEncerrado && estaAberto && (
                        <div style={{ position: "absolute", top: 15, right: 15, zIndex: 2 }}>
                          <CountdownTimer deadline={mass.deadline} />
                        </div>
                      )}

                      {/* --- CONTEÚDO DO CARD (ESTRUTURA FIEL À IMAGEM) --- */}
                      <div style={{ display: "flex", gap: "15px", alignItems: "flex-start", marginBottom: "20px" }}>
                        
                        {/* BADGE DATA */}
                        <div className="pink-date-badge">
                          <span className="day">{new Date(mass.date).getDate()}</span>
                          <span className="month">
                            {new Date(mass.date).toLocaleDateString("pt-BR", { month: "short" }).replace(".", "")}
                          </span>
                        </div>

                        {/* TEXTOS */}
                        <div style={{ flex: 1 }}>
                          <h3 className="card-title">
                            {mass.name || new Date(mass.date).toLocaleDateString("pt-BR", { weekday: "long" })}
                          </h3>
                          
                          <div className="card-time">
                            <Clock size={16} color="#ff2e63" />
                            <span>
                              {new Date(mass.date).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                            </span>
                            <span style={{ color: "#b2bec3" }}>•</span>
                            <span style={{ textTransform: "capitalize" }}>
                              {new Date(mass.date).toLocaleDateString("pt-BR", { weekday: "long" })}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      {/* FUNÇÃO (SE TIVER) */}
                      {mostrarFuncao && (
                        <div style={{ 
                          backgroundColor: souReserva ? "#fff3e0" : "#f3e5f5", 
                          color: souReserva ? "#e65100" : "#7b1fa2",
                          padding: "8px 12px", 
                          borderRadius: "8px", 
                          fontSize: "0.85rem", 
                          fontWeight: "bold",
                          marginBottom: "15px",
                          display: "flex", alignItems: "center", gap: "6px", width: "fit-content"
                        }}>
                          {souReserva ? <Hourglass size={14}/> : <User size={14}/>}
                          {souReserva ? "Fila de Espera" : `Sua função: ${minhaFuncao}`}
                        </div>
                      )}

                      {/* DIVISOR FINO */}
                      <div style={{ height: "1px", background: "#f0f0f0", marginBottom: "15px" }}></div>
                      
                      {/* VAGAS E BOTÃO */}
                      <div>
                        <div className="vagas-text">
                          <User size={18} strokeWidth={2.5} color="#2d3436" />
                          <strong>{totalConfirmados}</strong> <span>/ {mass.maxServers} vagas</span>
                        </div>
                        
                        <button className={btnClass} onClick={() => onToggleSignup(mass.id)} disabled={botaoDesabilitado}>
                          {btnText}
                        </button>
                      </div>
                    </div>
                  );
                })}
                <div className="mobile-only-spacer" style={{ minWidth: "10px" }}></div>
              </div>
            )}
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
          &copy; {new Date().getFullYear()} Santuário Diocesano Nossa Senhora da Natividade - v2.9 (10/02/2026)
        </p>
      </footer>
    </div>
  );
}