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
        
        /* Padrão Mobile: Carrossel Horizontal */
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

        /* Card no Mobile */
        .responsive-card {
          min-width: 88%;
          max-width: 400px;
          scroll-snap-align: start; 
          flex-shrink: 0;
          background: white;
          border-radius: 16px;
          border: 1px solid #eee;
          box-shadow: 0 4px 15px rgba(0,0,0,0.05);
          padding: 15px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          position: relative;
        }

        /* --- MUDANÇA PARA PC (TELAS MAIORES QUE 768px) --- */
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

        .card-inactive {
          background-color: #f9f9f9 !important;
          opacity: 0.9;
          filter: grayscale(0.8);
        }
        .mass-highlight {
          border: 2px solid #e91e63 !important;
          box-shadow: 0 8px 25px rgba(233, 30, 99, 0.15) !important;
          background-color: #fff !important;
        }

        .role-pill {
          background-color: #e1bee7 !important;
          color: #7b1fa2 !important;
          font-weight: bold;
          border-radius: 8px;
          padding: 8px 12px;
          font-size: 0.85rem;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          margin: 10px 0 15px 0;
          width: fit-content;
        }
        .role-pill.reserva {
          background-color: #fff3e0 !important;
          color: #e65100 !important;
          border: 1px solid #ffe0b2;
        }
        .role-pill.pendente {
          background-color: #f5f5f5 !important;
          color: #616161 !important;
          border: 1px solid #e0e0e0;
        }

        /* Botões */
        .btn-action {
          width: 100%; 
          padding: 8px; 
          border-radius: 10px; 
          border: none; 
          font-weight: bold;
          cursor: pointer; 
          font-size: 0.8rem; 
          display: flex; 
          align-items: center; 
          justify-content: center; 
          gap: 5px; 
          transition: all 0.2s;
          height: 36px;
        }
        .btn-action.servir { background: #e91e63; color: white; }
        .btn-action.desistir { background: transparent; border: 1px solid #c62828; color: #c62828; }
        .btn-action.disabled { background: #e0e0e0; color: #999; cursor: not-allowed; }
        .btn-action.btn-reserva { background: #fb8c00; color: white; }

        /* Navegação */
        .month-navigator {
          display: flex; 
          align-items: center; 
          justify-content: space-between; 
          background: white;
          width: 100%; 
          padding: 12px 15px; 
          border-bottom: 1px solid #eee; 
          box-shadow: 0 2px 5px rgba(0,0,0,0.03);
          margin-bottom: 10px;
          box-sizing: border-box;
        }
        .nav-btn {
          background: #fce4ec; border: none; color: #e91e63; 
          width: 32px; height: 32px; border-radius: 50%;
          display: flex; alignItems: center; justifyContent: center; cursor: pointer;
        }
        .current-month-label {
          font-size: 1.1rem; 
          font-weight: 800; 
          color: #333; 
          text-transform: capitalize; 
          flex: 1; 
          text-align: center; 
          display: flex; 
          flex-direction: column; 
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

                  let cardClass = "";
                  if (isInativa) cardClass = "card-inactive";
                  else if (isAvailable) cardClass = "mass-highlight";

                  let btnClass = "servir";
                  let btnText: React.ReactNode = <><Heart size={14} fill="white" /> Servir</>;

                  if (jaEstouInscrita) {
                    if (botaoDesabilitado) {
                      btnClass = "disabled";
                      btnText = "Fechado";
                    } else {
                      btnClass = "desistir";
                      btnText = souReserva ? "Sair da Reserva" : "Desistir";
                    }
                  } else if (!estaAberto) {
                    btnClass = "disabled";
                    btnText = "Em Breve";
                  } else if (prazoEncerrado) {
                    btnClass = "disabled";
                    btnText = "Encerrado";
                  } else if (lotado) {
                    btnClass = "btn-reserva";
                    btnText = <><Hourglass size={14} /> Entrar na Reserva</>;
                  }

                  const defaultDateBadgeStyle = { backgroundColor: "#fce4ec", color: "#e91e63" };

                  return (
                    <div
                      key={mass.id}
                      ref={(node) => {
                        const map = getMap();
                        if (node) map.set(mass.id, node);
                        else map.delete(mass.id);
                      }}
                      className={`responsive-card ${cardClass} ${botaoDesabilitado && !jaEstouInscrita ? "disabled" : ""}`}
                    >
                      {/* Timer */}
                      {mass.deadline && !prazoEncerrado && estaAberto && (
                        <div style={{ position: "absolute", top: 10, right: 10, zIndex: 2 }}>
                          <CountdownTimer deadline={mass.deadline} />
                        </div>
                      )}

                      <div className="card-header" style={{ display: "flex", gap: "15px", alignItems: "center" }}>
                        <div className="date-badge" style={{ ...defaultDateBadgeStyle, borderRadius: "10px", padding: "10px", textAlign: "center", minWidth: "50px" }}>
                          <span style={{ fontSize: "1.3rem", fontWeight: "bold", display: "block" }}>{new Date(mass.date).getDate()}</span>
                          <span style={{ fontSize: "0.75rem", textTransform: "uppercase" }}>
                            {new Date(mass.date).toLocaleDateString("pt-BR", { month: "short" }).replace(".", "")}
                          </span>
                        </div>
                        <div className="mass-info" style={{ flex: 1, paddingRight: "35px" }}>
                          <h3 style={{ margin: "0 0 5px 0", fontSize: "1.1rem", color: "#333", lineHeight: "1.2" }}>
                            {mass.name || new Date(mass.date).toLocaleDateString("pt-BR", { weekday: "long" })}
                          </h3>
                          
                          {/* --- HORÁRIO AUMENTADO E DIA DA SEMANA --- */}
                          <div className="mass-time" style={{ display: "flex", alignItems: "center", gap: "6px", color: "#666" }}>
                            <Clock size={18} color="#e91e63" />
                            <span style={{ fontSize: "1.2rem", fontWeight: "800", color: "#333" }}>
                              {new Date(mass.date).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                            </span>
                            
                            {/* Se tiver nome, mostra o dia da semana ao lado */}
                            {mass.name && (
                              <span style={{ textTransform: "capitalize", marginLeft: "4px", fontSize: "0.9rem", color: "#666" }}>
                                • {new Date(mass.date).toLocaleDateString("pt-BR", { weekday: "long" })}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
                        {mostrarFuncao ? (
                          <div className={`role-pill ${souReserva ? "reserva" : (!mass.published ? "pendente" : "")}`}>
                            {souReserva ? (
                              <><Hourglass size={16} /> Na fila de espera</>
                            ) : (
                              mass.published ? (
                                <><User size={16} /> Função: {minhaFuncao}</>
                              ) : (
                                <><Clock size={16} /> Aguardando Escala</>
                              )
                            )}
                          </div>
                        ) : (
                          <div style={{ height: "20px" }}></div>
                        )}
                      </div>
                      
                      <div className="card-footer" style={{ borderTop: "1px solid #f0f0f0", paddingTop: "15px", marginTop: "10px" }}>
                        <div className="vagas-info" style={{ color: "#666", fontSize: "0.9rem", marginBottom: "10px", display: "flex", alignItems: "center", gap: "5px" }}>
                          <User size={16} />
                          <strong>{totalConfirmados}</strong> / {mass.maxServers} vagas
                        </div>
                        <button className={`btn-action ${btnClass}`} onClick={() => onToggleSignup(mass.id)} disabled={botaoDesabilitado}>
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
          &copy; {new Date().getFullYear()} Santuário Diocesano Nossa Senhora da Natividade - v2.8 (05/02/2026)
        </p>
      </footer>
    </div>
  );
}