import { useState, useEffect } from "react";
import { Flower, Calendar, FileText, User, Clock, LogOut, Heart, Trophy, X, Medal, Megaphone } from "lucide-react";
import { Mass, UserData, Notice } from "../types/types";
import { OfficialDocument } from "./OfficialDocument";
import { api } from "../services/api";
import "./css/UserPanel.css";

interface UserPanelProps {
  masses: Mass[];
  user: UserData;
  onToggleSignup: (massId: string) => void;
  onLogout: () => void;
}

const getAdjustedDeadline = (deadlineString: string) => {
  const cleanDate = deadlineString.endsWith("Z") ? deadlineString.slice(0, -1) : deadlineString;
  const date = new Date(cleanDate);
  if (date.getHours() === 0 && date.getMinutes() === 0) {
    date.setHours(23, 59, 59, 999);
  }
  return date;
};

// --- MODAIS (Mantidos iguais) ---
function RankingModal({ masses, onClose }: { masses: Mass[], onClose: () => void }) {
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  const monthName = now.toLocaleString('pt-BR', { month: 'long' });
  const monthlyMasses = masses.filter(m => {
    const d = new Date(m.date);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  });
  const scores: Record<string, number> = {};
  monthlyMasses.forEach(mass => {
    mass.signups.forEach(signup => {
      // @ts-ignore
      const name = signup.user?.name || "Serva";
      if (signup.present) scores[name] = (scores[name] || 0) + 1;
    });
  });
  const ranking = Object.entries(scores).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count);

  return (
    <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.6)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
      <div style={{ background: "white", width: "100%", maxWidth: "350px", borderRadius: "20px", padding: "25px", position: "relative", boxShadow: "0 10px 25px rgba(0,0,0,0.3)", textAlign: "center", maxHeight: "80vh", overflowY: "auto" }}>
        <button onClick={onClose} style={{ position: "absolute", top: "15px", right: "15px", background: "none", border: "none", cursor: "pointer", color: "#666" }}><X size={24} /></button>
        <h2 style={{ color: "#e91e63", marginBottom: "5px", fontSize: "1.4rem" }}>Placar Mensal</h2>
        <p style={{ textTransform: "capitalize", color: "#666", marginBottom: "20px" }}>{monthName} de {currentYear}</p>
        {ranking.length === 0 ? <div style={{ padding: "30px 0", color: "#999", fontStyle: "italic" }}>Nenhuma presença confirmada.<br/>Seja a primeira!</div> : 
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {ranking.map((item, index) => (
              <div key={item.name} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: index === 0 ? "#fff9c4" : "#f5f5f5", padding: "12px 15px", borderRadius: "12px", border: index === 0 ? "1px solid #fbc02d" : "1px solid transparent" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}><span style={{ fontSize: "1.2rem" }}>{index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : `${index+1}º`}</span><span style={{ color: "#333", fontWeight: index === 0 ? "bold" : "normal" }}>{item.name}</span></div>
                <div style={{ fontWeight: "bold", color: "#e91e63" }}>{item.count} <span style={{ fontSize: "0.7rem", fontWeight: "normal" }}>x</span></div>
              </div>
            ))}
          </div>
        }
      </div>
    </div>
  );
}

function BadgesModal({ count, onClose }: { count: number; onClose: () => void }) {
  let title = "Semente da Fé", icon = <Flower size={32} />, color = "#81c784", nextGoal = 5;
  if (count >= 5 && count < 15) { title = "Botão de Rosa"; icon = <Flower size={32} fill="#f48fb1" />; color = "#ec407a"; nextGoal = 15; }
  else if (count >= 15) { title = "Rosa de Amor"; icon = <Flower size={32} fill="#e91e63" stroke="#880e4f" />; color = "#c2185b"; nextGoal = 30; }
  const progress = Math.min(100, (count / nextGoal) * 100);
  return (
    <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.5)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
      <div style={{ background: "white", width: "100%", maxWidth: "350px", borderRadius: "20px", padding: "25px", position: "relative", boxShadow: "0 10px 25px rgba(0,0,0,0.2)", textAlign: "center" }}>
        <button onClick={onClose} style={{ position: "absolute", top: "15px", right: "15px", background: "none", border: "none", cursor: "pointer", color: "#666" }}><X size={24} /></button>
        <h2 style={{ color: "#e91e63", marginBottom: "20px", fontSize: "1.2rem" }}>Meu Jardim Espiritual</h2>
        <div style={{ background: "#fce4ec", width: "80px", height: "80px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 15px auto", color: color }}>{icon}</div>
        <h3 style={{ margin: "0 0 5px 0", color: "#333" }}>{title}</h3>
        <p style={{ margin: "0 0 20px 0", color: "#666", fontSize: "0.9rem" }}>Você tem <strong>{count} presenças confirmadas</strong>.</p>
        <div style={{ background: "#f1f1f1", height: "10px", borderRadius: "10px", overflow: "hidden", marginBottom: "8px" }}><div style={{ width: `${progress}%`, background: `linear-gradient(90deg, ${color}, #f06292)`, height: "100%", borderRadius: "10px", transition: "width 0.5s ease" }} /></div>
        <p style={{ fontSize: "0.8rem", color: "#999" }}>Faltam {nextGoal - count} para o próximo nível!</p>
        <button onClick={onClose} style={{ marginTop: "20px", background: "#e91e63", color: "white", border: "none", padding: "10px 20px", borderRadius: "25px", fontWeight: "bold", width: "100%", cursor: "pointer" }}>Continuar Servindo</button>
      </div>
    </div>
  );
}

function CountdownTimer({ deadline }: { deadline: string }) {
  const [timeLeft, setTimeLeft] = useState("");
  useEffect(() => {
    const calculateTime = () => {
      const now = new Date();
      const deadlineDate = getAdjustedDeadline(deadline);
      const distance = deadlineDate.getTime() - now.getTime();
      if (distance < 0) setTimeLeft("ENCERRADO");
      else {
        const days = Math.floor(distance / (1000 * 60 * 60 * 24));
        const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        if (days > 0) setTimeLeft(`${days}d ${hours}h`); else setTimeLeft(`${hours}h ${minutes}m`);
      }
    };
    calculateTime(); const interval = setInterval(calculateTime, 1000 * 60); return () => clearInterval(interval);
  }, [deadline]);
  if (timeLeft === "ENCERRADO") return null;
  return <div style={{ position: "absolute", top: 15, right: 15, background: "#fff0f5", color: "#d81b60", fontSize: "0.7rem", fontWeight: "bold", padding: "4px 8px", borderRadius: "8px", display: "flex", alignItems: "center", gap: "4px" }}><Clock size={12} /> {timeLeft}</div>;
}

export function UserPanel({ masses, user, onToggleSignup, onLogout }: UserPanelProps) {
  const [activeTab, setActiveTab] = useState<"inscricoes" | "documento">("inscricoes");
  const [showBadges, setShowBadges] = useState(false);
  const [showRanking, setShowRanking] = useState(false);
  const [notices, setNotices] = useState<Notice[]>([]);

  useEffect(() => {
    api.get("/notices").then(res => setNotices(res.data));
  }, []);

  const isExpired = (deadline?: string) => {
    if (!deadline) return false;
    return new Date().getTime() > getAdjustedDeadline(deadline).getTime();
  };

  const confirmedScore = masses.reduce((acc, mass) => {
    const mySignup = mass.signups.find(s => s.userId === user.id);
    if (mySignup && mySignup.present) return acc + 1;
    return acc;
  }, 0);

  return (
    <div className="user-panel-container" style={{ width: "100%", overflowX: "hidden", position: "relative" }}>
      
      {/* --- ESTILOS DE ANIMAÇÃO (PISCAR/PULSAR) --- */}
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

      {showBadges && <BadgesModal count={confirmedScore} onClose={() => setShowBadges(false)} />}
      {showRanking && <RankingModal masses={masses} onClose={() => setShowRanking(false)} />}

      <div className="header-hero no-print" style={{ width: "100%", boxSizing: "border-box" }}>
        <div className="header-icon-wrapper"><Flower size={32} strokeWidth={2} color="white" /></div>
        <h1>GRUPO DE SERVAS SANTA TEREZINHA</h1>
        <p>"Servir com alegria."</p>
      </div>

      <div className="container-tabs no-print" style={{ width: "100%", boxSizing: "border-box" }}>
        <div className="menu-tabs" style={{ display: "flex", width: "100%", justifyContent: "space-between", alignItems: "center", padding: "0 5px", boxSizing: "border-box" }}>
          <button onClick={() => setActiveTab("inscricoes")} className={`tab-btn ${activeTab === "inscricoes" ? "active" : ""}`} style={{ flex: 1, display: "flex", justifyContent: "center", gap: "5px" }}><Calendar size={16} /> <span className="mobile-hide-text">Inscrições</span></button>
          <button onClick={() => setActiveTab("documento")} className={`tab-btn ${activeTab === "documento" ? "active" : ""}`} style={{ flex: 1, display: "flex", justifyContent: "center", gap: "5px" }}><FileText size={16} /> <span className="mobile-hide-text">Escala</span></button>
          <button onClick={() => setShowRanking(true)} className="tab-btn" style={{ color: "#4caf50", borderLeft: "1px solid #ddd", paddingLeft: "10px", marginLeft: "5px", display: "flex", justifyContent: "center" }} title="Placar Mensal"><Medal size={20} /></button>
          <button onClick={() => setShowBadges(true)} className="tab-btn" style={{ color: "#fbc02d", marginLeft: "5px", display: "flex", justifyContent: "center" }} title="Minhas Conquistas"><Trophy size={20} /></button>
          <button onClick={onLogout} className="tab-btn logout" style={{ marginLeft: "5px" }}><LogOut size={18} /></button>
        </div>
      </div>

      {/* --- MURAL DE AVISOS (POSIÇÃO CORRIGIDA) --- */}
      {/* Agora ele fica ABAIXO dos botões, livre de sobreposições */}
      {notices.length > 0 && (
        <div className="no-print" style={{ margin: "15px 15px 5px 15px", display: "flex", flexDirection: "column", gap: "10px" }}>
          {notices.map(notice => (
            <div 
              key={notice.id} 
              className="notice-animated" // <--- CLASSE DA ANIMAÇÃO
              style={{ 
                background: "#fff9c4", // Amarelo mais vivo
                borderLeft: "5px solid #ffc107", 
                color: "#856404", 
                padding: "15px", 
                borderRadius: "8px",
                display: "flex", 
                alignItems: "center", 
                gap: "12px",
                boxShadow: "0 4px 6px rgba(0,0,0,0.1)"
              }}
            >
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

      <div style={{ flex: 1, width: "100%", boxSizing: "border-box" }}>
        {activeTab === "inscricoes" ? (
          <div className="container-responsive">
            <div style={{ padding: "0 15px" }}>
              {masses.map((mass) => {
                const totalInscritos = mass.signups ? mass.signups.length : 0;
                const vagasRestantes = mass.maxServers - totalInscritos;
                const jaEstouInscrita = mass.signups.some((s) => s.userId === user.id);
                const minhaFuncao = mass.signups.find((s) => s.userId === user.id)?.role;
                const prazoEncerrado = isExpired(mass.deadline);
                const lotado = vagasRestantes <= 0;
                const botaoDesabilitado = (!jaEstouInscrita && prazoEncerrado) || (!jaEstouInscrita && lotado);
                let btnClass = "servir";
                if (jaEstouInscrita) btnClass = "desistir";
                else if (botaoDesabilitado) btnClass = "disabled";

                return (
                  <div key={mass.id} className={`mass-card ${prazoEncerrado && !jaEstouInscrita ? "disabled" : ""}`} style={{ position: "relative" }}>
                    {mass.deadline && !prazoEncerrado && <CountdownTimer deadline={mass.deadline} />}
                    <div className="card-header">
                      <div className="date-badge"><span className="date-day">{new Date(mass.date).getDate()}</span><span className="date-month">{new Date(mass.date).toLocaleDateString("pt-BR", { month: "short" }).replace(".", "")}</span></div>
                      <div className="mass-info"><h3>{new Date(mass.date).toLocaleDateString("pt-BR", { weekday: "long" })}</h3><div className="mass-time"><Clock size={14} />{new Date(mass.date).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</div></div>
                    </div>
                    {jaEstouInscrita && minhaFuncao && <div style={{ background: "#e1bee7", color: "#7b1fa2", padding: "4px 10px", borderRadius: "8px", fontSize: "0.8rem", fontWeight: "bold", marginBottom: "15px", width: "fit-content" }}>Sua função: {minhaFuncao}</div>}
                    <div className="card-footer">
                      <div className="vagas-info" style={{ color: "#666", fontSize: "0.9rem" }}><User size={16} style={{ marginRight: 4 }} /><strong>{totalInscritos}</strong> / {mass.maxServers} vagas</div>
                      <button className={`btn-action ${btnClass}`} onClick={() => onToggleSignup(mass.id)} disabled={botaoDesabilitado}>{jaEstouInscrita ? "Desistir" : prazoEncerrado ? "Encerrado" : lotado ? "Lotado" : <><Heart size={16} fill="white" /> Servir</>}</button>
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
        <p>Desenvolvido por <a href="https://www.linkedin.com/in/fecarvalhodev/" target="_blank" rel="noopener noreferrer" style={{ color: "#e91e63", textDecoration: "none", fontWeight: "bold" }}>Fernando Carvalho</a></p>
        <p style={{ marginTop: "5px", opacity: 0.7 }}>&copy; {new Date().getFullYear()} Santuario Diocesano Nossa Senhora da Natividade</p>
      </footer>
    </div>
  );
}