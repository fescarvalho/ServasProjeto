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
  Hourglass,
  Bell,
  BellOff
} from "lucide-react";
import { Mass, UserData, Notice, SwapRequest } from "../types/types";
import { OfficialDocument } from "./OfficialDocument";
import { api } from "../services/api";
import * as swapRequestService from "../services/api/swap-request.service";
import { RankingModal } from "./RankingModal";
import { BadgesModal } from "./BadgesModal";
import { CountdownTimer } from "./CountdownTimer";
import { usePushNotifications } from "../hooks/usePushNotifications";
import { ToastContainer, ConfirmModal, useToast } from "./Toast";
import "./css/UserPanel.css"; // CSS Importado aqui

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
  const [swapRequests, setSwapRequests] = useState<SwapRequest[]>([]);
  const [swapLoading, setSwapLoading] = useState<string | null>(null);

  const { isSubscribed, isSupported, subscribe, unsubscribe } = usePushNotifications();
  const { toasts, remove, show } = useToast();

  // Confirm modal state
  const [confirmState, setConfirmState] = useState<{ message: string; onConfirm: () => void } | null>(null);

  function promptConfirm(message: string): Promise<boolean> {
    return new Promise((resolve) => {
      setConfirmState({
        message,
        onConfirm: () => { setConfirmState(null); resolve(true); },
      });
      // Cancel resolves false via ConfirmModal onCancel
    });
  }

  // Refs para o Auto-Scroll
  const itemsRef = useRef<Map<string, HTMLDivElement> | null>(null);

  // --- FILTRO MENSAL ---
  const [selectedDate, setSelectedDate] = useState(new Date());

  useEffect(() => {
    api.get("/notices").then((res) => setNotices(res.data));
    loadSwapRequests();
  }, []);

  async function loadSwapRequests() {
    try {
      const data = await swapRequestService.getOpenSwapRequests();
      setSwapRequests(data);
    } catch (err) {
      console.error(err);
    }
  }

  async function handleRequestSwap(signupId: string) {
    const ok = await promptConfirm("Confirma o pedido de substituição? Outras servas verão este pedido e poderão aceitar.");
    if (!ok) return;
    try {
      setSwapLoading(signupId);
      await swapRequestService.createSwapRequest(signupId, user.id);
      await loadSwapRequests();
      show("Pedido de substituição enviado! Aguarde outra serva aceitar.", "success");
    } catch (err: any) {
      show(err?.response?.data?.message || "Erro ao criar pedido.", "error");
    } finally {
      setSwapLoading(null);
    }
  }

  async function handleAcceptSwap(swapRequestId: string) {
    const ok = await promptConfirm("Confirma que você vai assumir esta missa no lugar da serva solicitante?");
    if (!ok) return;
    try {
      setSwapLoading(swapRequestId);
      await swapRequestService.acceptSwapRequest(swapRequestId, user.id);
      await loadSwapRequests();
      show("Substituição realizada! A escala foi atualizada.", "success");
    } catch (err: any) {
      show(err?.response?.data?.message || "Erro ao aceitar substituição.", "error");
    } finally {
      setSwapLoading(null);
    }
  }

  async function handleCancelSwap(swapRequestId: string) {
    const ok = await promptConfirm("Cancelar o pedido de substituição?");
    if (!ok) return;
    try {
      setSwapLoading(swapRequestId);
      await swapRequestService.cancelSwapRequest(swapRequestId, user.id);
      await loadSwapRequests();
      show("Pedido cancelado.", "info");
    } catch (err: any) {
      show(err?.response?.data?.message || "Erro ao cancelar pedido.", "error");
    } finally {
      setSwapLoading(null);
    }
  }

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
          {isSupported && (
            <button
              onClick={() => isSubscribed ? unsubscribe() : subscribe(user.id)}
              className="tab-btn"
              style={{ color: isSubscribed ? "#e91e63" : "#9e9e9e", marginLeft: "5px" }}
              title={isSubscribed ? "Desativar notificações" : "Ativar notificações"}
            >
              {isSubscribed ? <Bell size={18} /> : <BellOff size={18} />}
            </button>
          )}
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

            {/* BANNER DE SUBSTITUIÇÕES ABERTAS */}
            {swapRequests.length > 0 && (
              <div className="no-print" style={{ margin: "10px 15px", borderRadius: "12px", overflow: "hidden", border: "1px solid #FFB74D", background: "#FFF8E1" }}>
                <div style={{ background: "#FF9800", color: "white", padding: "10px 15px", fontWeight: "bold", fontSize: "0.9rem", display: "flex", alignItems: "center", gap: "8px" }}>
                  🔄 Substituições em Aberto ({swapRequests.length})
                </div>
                {swapRequests.map((sr) => {
                  const massDate = new Date(sr.signup.mass.date).toLocaleString("pt-BR", { weekday: "long", day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
                  const isMyRequest = sr.requesterId === user.id;
                  return (
                    <div key={sr.id} style={{ padding: "12px 15px", borderBottom: "1px solid #FFE0B2", display: "flex", flexDirection: "column", gap: "6px" }}>
                      <div style={{ fontSize: "0.9rem", color: "#5D4037" }}>
                        <strong>{sr.signup.user.name}</strong> não pode atender a <strong>{sr.signup.mass.name || massDate}</strong>
                      </div>
                      <div style={{ fontSize: "0.8rem", color: "#8D6E63" }}>{massDate} · Função: {sr.signup.role || "Auxiliar"}</div>
                      {isMyRequest ? (
                        <button
                          onClick={() => handleCancelSwap(sr.id)}
                          disabled={swapLoading === sr.id}
                          style={{ alignSelf: "flex-start", padding: "6px 14px", borderRadius: "20px", border: "none", background: "#ef9a9a", color: "#b71c1c", fontWeight: "bold", cursor: "pointer", fontSize: "0.8rem" }}
                        >
                          {swapLoading === sr.id ? "..." : "Cancelar pedido"}
                        </button>
                      ) : (
                        <button
                          onClick={() => handleAcceptSwap(sr.id)}
                          disabled={swapLoading === sr.id}
                          style={{ alignSelf: "flex-start", padding: "6px 14px", borderRadius: "20px", border: "none", background: "#81C784", color: "#1B5E20", fontWeight: "bold", cursor: "pointer", fontSize: "0.8rem" }}
                        >
                          {swapLoading === sr.id ? "..." : "✅ Aceitar e entrar no lugar"}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

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

                  // CORREÇÃO TS: Usando as variáveis para definir a classe
                  let cardClass = "";
                  if (isInativa) {
                    cardClass = "card-inactive";
                  } else if (isAvailable) {
                    cardClass = "mass-highlight";
                  }

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
                      // CORREÇÃO TS: Usando a variável cardClass aqui
                      className={`responsive-card ${cardClass}`}
                    >
                      {/* Timer */}
                      {mass.deadline && !prazoEncerrado && estaAberto && (
                        <div style={{ position: "absolute", top: 15, right: 15, zIndex: 2 }}>
                          <CountdownTimer deadline={mass.deadline} />
                        </div>
                      )}

                      {/* CABEÇALHO */}
                      <div style={{ display: "flex", gap: "15px", alignItems: "flex-start", marginBottom: "20px" }}>
                        <div className="pink-date-badge">
                          <span className="day">{new Date(mass.date).getDate()}</span>
                          <span className="month">
                            {new Date(mass.date).toLocaleDateString("pt-BR", { month: "short" }).replace(".", "")}
                          </span>
                        </div>

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

                      {/* FUNÇÃO / STATUS */}
                      {mostrarFuncao && (
                        <div className={`role-pill ${souReserva ? "reserva" : (!mass.published ? "pendente" : "")}`}>
                          {souReserva ? (
                            <>
                              <Hourglass size={14} />
                              Fila de Espera
                            </>
                          ) : (
                            // CORREÇÃO LÓGICA: Verifica se está publicada
                            mass.published ? (
                              <>
                                <User size={14} />
                                Função: {minhaFuncao}
                              </>
                            ) : (
                              <>
                                <Clock size={14} />
                                Aguardando publicação
                              </>
                            )
                          )}
                        </div>
                      )}

                      {/* DIVISOR */}
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

                        {/* BOTÃO PEDIR SUBSTITUIÇÃO — só para quem está confirmada e a missa não passou */}
                        {jaEstouInscrita && !souReserva && !prazoEncerrado && (
                          (() => {
                            const mySignup = mass.signups.find(s => s.userId === user.id);
                            const hasOpenRequest = swapRequests.some(sr => sr.signupId === mySignup?.id);
                            return (
                              <button
                                onClick={() => mySignup && handleRequestSwap(mySignup.id)}
                                disabled={hasOpenRequest || swapLoading === mySignup?.id}
                                style={{
                                  width: "100%",
                                  marginTop: "8px",
                                  padding: "8px",
                                  borderRadius: "8px",
                                  border: "1px dashed #FB8C00",
                                  background: hasOpenRequest ? "#FFF3E0" : "transparent",
                                  color: hasOpenRequest ? "#E65100" : "#FB8C00",
                                  fontWeight: "bold",
                                  cursor: hasOpenRequest ? "default" : "pointer",
                                  fontSize: "0.82rem"
                                }}
                              >
                                {hasOpenRequest ? "⏳ Aguardando substituta..." : "↔ Pedir Substituição"}
                              </button>
                            );
                          })()
                        )}
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
      <ToastContainer toasts={toasts} onRemove={remove} />

      {confirmState && (
        <ConfirmModal
          message={confirmState.message}
          onConfirm={confirmState.onConfirm}
          onCancel={() => setConfirmState(null)}
        />
      )}
    </div>
  );
}