import { useState, useEffect, useMemo, useRef } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
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
  BookOpen,
  BookHeart
} from "lucide-react";
import { Mass, UserData, Notice, SwapRequest } from "../types/types";
import { OfficialDocument } from "./OfficialDocument";
import { api } from "../services/api";
import * as swapRequestService from "../services/api/swap-request.service";
import { RankingModal } from "./RankingModal";
import { BadgesModal } from "./BadgesModal";
import { CountdownTimer } from "./CountdownTimer";
import { ToastContainer, ConfirmModal, useToast } from "./Toast";
import { WinnerModal } from "./WinnerModal";
import { theme } from "../theme/theme";
import { calculateRanking } from "../utils/ranking.utils";
import { LiturgicalCalendar } from "./LiturgicalCalendar";
import { Prayers } from "./Prayers";
import { getLiturgicalData, isSunday } from "../utils/liturgical.utils";
import "./css/UserPanel.css"; // CSS Importado aqui

interface UserPanelProps {
  masses: Mass[];
  user: UserData;
  onToggleSignup: (massId: string) => void;
  onLogout: () => void;
}

export function UserPanel({ masses, user, onToggleSignup, onLogout }: UserPanelProps) {
  const [activeTab, setActiveTab] = useState<"inscricoes" | "documento" | "calendario" | "oracoes">("inscricoes");
  const [showBadges, setShowBadges] = useState(false);
  const [showRanking, setShowRanking] = useState(false);
  const [notices, setNotices] = useState<Notice[]>([]);
  const [swapRequests, setSwapRequests] = useState<SwapRequest[]>([]);
  const [swapLoading, setSwapLoading] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [pendingMassIds, setPendingMassIds] = useState<string[]>([]);
  const { toasts, remove, show } = useToast();

  const [showWinnerModal, setShowWinnerModal] = useState(false);
  const [winnerDetails, setWinnerDetails] = useState<{ score: number; month: number; year: number } | null>(null);

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

  // Ref para o Auto-Scroll e Virtualização
  const parentRef = useRef<HTMLDivElement>(null);

  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // --- FILTRO MENSAL ---
  // Sempre inicia no mês de Brasília, independente do fuso do dispositivo
  const [selectedDate, setSelectedDate] = useState(() => {
    const now = new Date();
    const brStr = now.toLocaleDateString("en-US", { timeZone: "America/Sao_Paulo", year: "numeric", month: "2-digit", day: "2-digit" });
    // brStr formato: "MM/DD/YYYY"
    const [month, , year] = brStr.split("/").map(Number);
    return new Date(year, month - 1, 1);
  });

  useEffect(() => {
    api.get("/notices").then((res) => setNotices(res.data));
    loadSwapRequests();
    loadUnreadNotifications();
  }, []);

  async function loadUnreadNotifications() {
    try {
      const res = await api.get("/notifications/unread");
      const masses = res.data.masses as Mass[];

      const viewedIds = JSON.parse(localStorage.getItem("viewedMasses") || "[]");
      const unreadMasses = masses.filter((m: Mass) => !viewedIds.includes(m.id));

      setPendingMassIds(unreadMasses.map((m: Mass) => m.id));
      setUnreadCount(unreadMasses.length);
    } catch (err) {
      console.error("Erro notifications", err);
    }
  }

  // Poll for notifications every 10 seconds
  useEffect(() => {
    const p = setInterval(loadUnreadNotifications, 10000);
    return () => clearInterval(p);
  }, []);

  // --- Lógica da Serva Campeã ---
  useEffect(() => {
    if (masses.length === 0 || !user) return;

    const now = new Date();
    const day = now.getDate();
    const month = now.getMonth();
    const year = now.getFullYear();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    let checkMonth = month;
    let checkYear = year;
    let shouldCheck = false;

    // Últimos 3 dias do mês ou primeiros 5 dias do próximo mês
    if (day >= daysInMonth - 2) {
      shouldCheck = true;
    } else if (day <= 5) {
      shouldCheck = true;
      checkMonth = month === 0 ? 11 : month - 1;
      checkYear = month === 0 ? year - 1 : year;
    }

    if (shouldCheck) {
      const storageKey = `winner_notified_${checkYear}_${checkMonth}`;
      const alreadyNotified = localStorage.getItem(storageKey);

      if (!alreadyNotified) {
        const ranking = calculateRanking(masses, checkMonth, checkYear);
        // Se eu sou a primeira colocada e tenho pontuação maior que 0
        if (ranking.length > 0 && ranking[0].id === user.id && ranking[0].score > 0) {
          setWinnerDetails({ score: ranking[0].score, month: checkMonth, year: checkYear });
          setShowWinnerModal(true);
        }
      }
    }
  }, [masses, user]);

  const handleCloseWinnerModal = () => {
    if (winnerDetails) {
      localStorage.setItem(`winner_notified_${winnerDetails.year}_${winnerDetails.month}`, "true");
    }
    setShowWinnerModal(false);
  };

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

  // --- VIRTUALIZADOR ---
  const rowVirtualizer = useVirtualizer({
    count: filteredMasses.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => isMobile ? (window.innerWidth - 40 + 15) : 180, // Largura do card + gap no mobile, altura no desktop
    horizontal: isMobile,
    overscan: 3,
  });

  // --- AUTO-SCROLL PARA A PRIMEIRA DATA DISPONÍVEL ---
  useEffect(() => {
    if (activeTab === "inscricoes" && filteredMasses.length > 0) {
      const now = new Date();
      now.setHours(0, 0, 0, 0);

      const firstUpcomingIndex = filteredMasses.findIndex(m => new Date(m.date) >= now);

      if (firstUpcomingIndex !== -1) {
        setTimeout(() => {
          rowVirtualizer.scrollToIndex(firstUpcomingIndex, {
            align: "center",
            behavior: "smooth"
          });
        }, 300);
      }
    }
  }, [selectedDate, activeTab, filteredMasses, rowVirtualizer]);

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
        backgroundColor: theme.colors.background
      }}
    >
      {showBadges && (
        <BadgesModal count={confirmedScore} onClose={() => setShowBadges(false)} />
      )}
      {showRanking && (
        <RankingModal masses={masses} onClose={() => setShowRanking(false)} />
      )}
      {showWinnerModal && winnerDetails && (
        <WinnerModal
          score={winnerDetails.score}
          month={winnerDetails.month}
          year={winnerDetails.year}
          userName={user.name}
          onClose={handleCloseWinnerModal}
        />
      )}

      {/* HEADER HERO */}
      <div className="header-hero no-print" style={{ width: "100%", boxSizing: "border-box", paddingBottom: "30px" }}>
        <div className="header-icon-wrapper">
          <Flower size={32} strokeWidth={2} color="white" />
        </div>

        <h1>GRUPO DE SERVAS <br /> SANTA TEREZINHA</h1>

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
            Bem-vindo(a), <strong style={{ fontWeight: "800" }}>{user.name.split(" ")[0]}</strong> 🕊️
          </p>
        </div>

        <p style={{ fontSize: "0.9rem", opacity: 0.9, marginTop: "5px" }}>"Servir com alegria."</p>
      </div>

      {/* ABAS */}
      <div className="container-tabs no-print" style={{ width: "100%", boxSizing: "border-box" }}>
        {/* Linha 1: Abas de navegação */}
        <div className="menu-tabs-scroll-wrapper" style={{
          display: "flex",
          width: "100%",
          background: "white",
          borderRadius: "50px 50px 0 0",
          padding: "5px 5px 0",
          boxSizing: "border-box",
          boxShadow: "0 -2px 10px rgba(0,0,0,0.05)",
          overflowX: "auto",
          scrollbarWidth: "none",
          msOverflowStyle: "none"
        }}>
          <button onClick={() => setActiveTab("inscricoes")} className={`tab-btn ${activeTab === "inscricoes" ? "active" : ""}`} style={{ flex: "1 0 auto", minWidth: isMobile ? "80px" : "auto", display: "flex", justifyContent: "center", gap: "5px" }}>
            <Calendar size={16} /> <span className="mobile-hide-text">Inscrições</span>
          </button>
          <button onClick={() => setActiveTab("documento")} className={`tab-btn ${activeTab === "documento" ? "active" : ""}`} style={{ flex: "1 0 auto", minWidth: isMobile ? "80px" : "auto", display: "flex", justifyContent: "center", gap: "5px" }}>
            <FileText size={16} /> <span className="mobile-hide-text">Escala</span>
          </button>
          <button onClick={() => setActiveTab("calendario")} className={`tab-btn ${activeTab === "calendario" ? "active" : ""}`} style={{ flex: "1 0 auto", minWidth: isMobile ? "60px" : "auto", display: "flex", justifyContent: "center", gap: "5px" }} title="Calendário Litúrgico">
            <BookOpen size={16} /> <span className="mobile-hide-text">Santos</span>
          </button>
          <button onClick={() => setActiveTab("oracoes")} className={`tab-btn ${activeTab === "oracoes" ? "active" : ""}`} style={{ flex: "1 0 auto", minWidth: isMobile ? "80px" : "auto", display: "flex", justifyContent: "center", gap: "5px" }} title="Orações">
            <BookHeart size={16} /> <span className="mobile-hide-text">Orações</span>
          </button>
        </div>

        {/* Linha 2: Botões de ação */}
        <div style={{ display: "flex", width: "100%", background: "white", borderRadius: "0 0 50px 50px", padding: "0 5px 5px", boxSizing: "border-box", borderTop: "1px solid #f0f0f0", boxShadow: "0 5px 15px rgba(0,0,0,0.08)", justifyContent: "flex-end", gap: "2px" }}>
          <button onClick={() => setShowRanking(true)} className="tab-btn" style={{ flex: 1, color: theme.colors.success, display: "flex", justifyContent: "center" }} title="Placar Mensal">
            <Medal size={18} />
          </button>
          <button onClick={() => setShowBadges(true)} className="tab-btn" style={{ flex: 1, color: theme.colors.warning, display: "flex", justifyContent: "center" }} title="Minhas Conquistas">
            <Trophy size={18} />
          </button>
          <div style={{ position: "relative", flex: 1 }}>
            <button
              onClick={() => {
                if (unreadCount > 0) {
                  show(`Existem escalas disponíveis para escolha. Veja na aba de inscrições.`, "info", 8000);
                  const viewedIds = JSON.parse(localStorage.getItem("viewedMasses") || "[]");
                  const novosIds = Array.from(new Set([...viewedIds, ...pendingMassIds]));
                  localStorage.setItem("viewedMasses", JSON.stringify(novosIds));
                  setUnreadCount(0);
                  setPendingMassIds([]);
                } else {
                  show("Você não tem missas abertas pendentes no momento.", "info");
                }
              }}
              className="tab-btn" style={{ width: "100%", color: unreadCount > 0 ? theme.colors.danger : theme.colors.textMuted, display: "flex", justifyContent: "center" }} title="Notificações do Sistema">
              <Bell size={18} />
              {unreadCount > 0 && (
                <span style={{ position: "absolute", top: 4, right: 4, background: "red", color: "white", fontSize: "0.6rem", fontWeight: "bold", padding: "1px 5px", borderRadius: "10px", minWidth: "14px", textAlign: "center", lineHeight: "1" }}>
                  {unreadCount}
                </span>
              )}
            </button>
          </div>
          <button onClick={onLogout} className="tab-btn logout" style={{ flex: 1, display: "flex", justifyContent: "center", color: theme.colors.dangerDark }}>
            <LogOut size={18} />
          </button>
        </div>
      </div>


      {/* AVISOS */}
      {notices.length > 0 && (
        <div className="no-print" style={{ margin: "15px 15px 5px 15px", display: "flex", flexDirection: "column", gap: "10px" }}>
          {notices.map((notice) => (
            <div key={notice.id} className="notice-animated" style={{ background: theme.colors.warningLight, borderLeft: `5px solid ${theme.colors.warning}`, color: theme.colors.warningDark, padding: "15px", borderRadius: theme.borderRadius.md, display: "flex", alignItems: "center", gap: "12px", boxShadow: theme.colors.shadowBase }}>
              <div style={{ background: theme.colors.warning, padding: "8px", borderRadius: "50%", color: "white" }}>
                <Megaphone size={20} fill="white" />
              </div>
              <div>
                <strong style={{ display: "block", fontSize: "0.8rem", textTransform: "uppercase", color: theme.colors.warningDark, marginBottom: "2px" }}>Atenção, servas!</strong>
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
              <div className="no-print" style={{ margin: "10px 15px", borderRadius: "12px", overflow: "hidden", border: `1px solid ${theme.colors.warning}`, background: theme.colors.warningLight }}>
                <div style={{ background: theme.colors.warning, color: "white", padding: "10px 15px", fontWeight: "bold", fontSize: "0.9rem", display: "flex", alignItems: "center", gap: "8px" }}>
                  🔄 Substituições em Aberto ({swapRequests.length})
                </div>
                {swapRequests.map((sr) => {
                  const massDate = new Date(sr.signup.mass.date).toLocaleString("pt-BR", { weekday: "long", day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
                  const isMyRequest = sr.requesterId === user.id;
                  return (
                    <div key={sr.id} style={{ padding: "12px 15px", borderBottom: `1px solid ${theme.colors.warningLight}`, display: "flex", flexDirection: "column", gap: "6px" }}>
                      <div style={{ fontSize: "0.9rem", color: theme.colors.textMain }}>
                        <strong>{sr.signup.user.name}</strong> não pode atender a <strong>{sr.signup.mass.name || massDate}</strong>
                      </div>
                      <div style={{ fontSize: "0.8rem", color: theme.colors.textSecondary }}>{massDate} · Função: {sr.signup.role || "Auxiliar"}</div>
                      {isMyRequest ? (
                        <button
                          onClick={() => handleCancelSwap(sr.id)}
                          disabled={swapLoading === sr.id}
                          style={{ alignSelf: "flex-start", padding: "6px 14px", borderRadius: "20px", border: "none", background: theme.colors.dangerLight, color: theme.colors.dangerDark, fontWeight: "bold", cursor: "pointer", fontSize: "0.8rem" }}
                        >
                          {swapLoading === sr.id ? "..." : "Cancelar pedido"}
                        </button>
                      ) : (
                        <button
                          onClick={() => handleAcceptSwap(sr.id)}
                          disabled={swapLoading === sr.id}
                          style={{ alignSelf: "flex-start", padding: "6px 14px", borderRadius: "20px", border: "none", background: theme.colors.successLight, color: theme.colors.successDark, fontWeight: "bold", cursor: "pointer", fontSize: "0.8rem" }}
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
                textAlign: "center", padding: "40px 20px", color: theme.colors.textMuted,
                border: `2px dashed ${theme.colors.border}`, borderRadius: "12px", margin: "10px 15px"
              }}>
                <Search size={32} style={{ opacity: 0.3, marginBottom: 10 }} />
                <p>Nenhuma escala encontrada para <strong>{currentMonthName}</strong>.</p>
                <p style={{ fontSize: "0.8rem" }}>Use as setas acima para navegar.</p>
              </div>
            ) : (
              /* --- LISTA RESPONSIVA COM VIRTUALIZAÇÃO --- */
              <div
                ref={parentRef}
                className="responsive-list-container no-scrollbar"
                style={{
                  display: "block",
                  position: "relative",
                  height: isMobile ? "370px" : "calc(100vh - 250px)",
                  width: "100%",
                  overflowX: isMobile ? "auto" : "hidden",
                  overflowY: isMobile ? "hidden" : "auto",
                  padding: isMobile ? "10px 0 10px 0" : "0 30px 40px 30px",
                  scrollSnapType: "none",
                  boxSizing: "border-box"
                }}
              >
                <div
                  style={{
                    height: isMobile ? "100%" : `${rowVirtualizer.getTotalSize()}px`,
                    width: isMobile ? `${rowVirtualizer.getTotalSize() + 40}px` : "100%",
                    position: "relative",
                  }}
                >
                  {rowVirtualizer.getVirtualItems().map((virtualItem) => {
                    const mass = filteredMasses[virtualItem.index];
                    const totalConfirmados = mass.signups ? mass.signups.filter((s: any) => s.status !== "RESERVA").length : 0;
                    const vagasRestantes = mass.maxServers - totalConfirmados;
                    const meuSignup = mass.signups.find((s) => s.userId === user.id);
                    const jaEstouInscrita = !!meuSignup;
                    const souReserva = (meuSignup as any)?.status === "RESERVA";
                    const minhaFuncao = meuSignup?.role || "Auxiliar";

                    const liturgical = getLiturgicalData(new Date(mass.date));
                    const isSundayDay = isSunday(new Date(mass.date));

                    const estaAberto = mass.open;
                    const prazoEncerrado = checkStatus(mass.date, mass.deadline);
                    const lotado = vagasRestantes <= 0;

                    const mostrarFuncao = jaEstouInscrita;

                    const botaoDesabilitado = prazoEncerrado || !estaAberto;
                    const isInativa = prazoEncerrado;
                    const isAvailable = estaAberto && !prazoEncerrado;

                    let cardClass = "";
                    if (isInativa) {
                      cardClass = "card-inactive";
                    } else if (isAvailable) {
                      cardClass = "mass-highlight";
                    }

                    let highlightClass = "";
                    if (mass.isSolemnity) {
                      highlightClass = "solemnity-card";
                    } else if (isSundayDay) {
                      highlightClass = `sunday-card ${liturgical.color}-card`;
                    } else {
                      highlightClass = `${liturgical.color}-card`;
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
                        key={virtualItem.key}
                        data-index={virtualItem.index}
                        ref={rowVirtualizer.measureElement}
                        style={{
                          position: "absolute",
                          top: 0,
                          left: 0,
                          transform: isMobile ? `translateX(${virtualItem.start + 20}px)` : `translateY(${virtualItem.start}px)`,
                          width: isMobile ? `${window.innerWidth - 40 + 15}px` : "100%",
                          height: isMobile ? "100%" : undefined,
                          paddingRight: isMobile ? "15px" : "0",
                          paddingBottom: isMobile ? "0" : "20px",
                          boxSizing: "border-box"
                        }}
                      >
                        <div
                          className={`responsive-card ${cardClass} ${highlightClass}`}
                          style={{
                            width: "100%",
                            height: "100%",
                            margin: 0,
                            minWidth: "auto",
                            boxSizing: "border-box",
                            justifyContent: "flex-start"
                          }}
                        >
                          {/* Timer */}
                          {mass.deadline && !prazoEncerrado && estaAberto && (
                            <div style={{ position: "absolute", top: 15, right: 15, zIndex: 2 }}>
                              <CountdownTimer deadline={mass.deadline} />
                            </div>
                          )}

                          {/* CABEÇALHO */}
                          <div style={{ display: "flex", gap: "15px", alignItems: "flex-start", marginBottom: "20px" }}>
                            <div className="pink-date-badge" style={mass.isSolemnity ? { background: "linear-gradient(180deg, #f59e0b 0%, #b45309 100%)", boxShadow: "0 4px 12px rgba(245, 158, 11, 0.4)" } : {}}>
                              <span className="day">{new Date(mass.date).getDate()}</span>
                              <span className="month">
                                {new Date(mass.date).toLocaleDateString("pt-BR", { month: "short" }).replace(".", "")}
                              </span>
                            </div>

                            <div style={{ flex: 1 }}>
                              <h3 className="card-title">
                                {mass.name || new Date(mass.date).toLocaleDateString("pt-BR", { weekday: "long" })}
                              </h3>
                              {mass.local && (
                                <div style={{ fontSize: "0.85rem", color: theme.colors.textSecondary, fontWeight: "bold", marginBottom: "4px" }}>
                                  📍 {mass.local}
                                </div>
                              )}
                              <div className="card-time">
                                <Clock size={16} color={theme.colors.primary} />
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
                          <div style={{ height: "1px", background: theme.colors.borderLight, marginBottom: "15px", flexShrink: 0 }}></div>

                          {/* VAGAS E BOTÃO */}
                          <div style={{ marginTop: "auto" }}>
                            <div className="vagas-text">
                              <User size={18} strokeWidth={2.5} color={theme.colors.textMain} />
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
                                      border: `1px dashed ${theme.colors.warning}`,
                                      background: hasOpenRequest ? theme.colors.warningLight : "transparent",
                                      color: hasOpenRequest ? theme.colors.warningDark : theme.colors.warning,
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
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        ) : activeTab === "calendario" ? (
          <LiturgicalCalendar />
        ) : activeTab === "oracoes" ? (
          <Prayers />
        ) : (
          <OfficialDocument masses={masses.filter((m) => m.published)} />
        )}
      </div>

      <footer className="app-footer no-print" style={{ width: "100%", boxSizing: "border-box" }}>
        <p>
          Desenvolvido por <a href="https://fescarvpage.vercel.app/" target="_blank" rel="noopener noreferrer" style={{ color: theme.colors.danger, textDecoration: "none", fontWeight: "bold" }}>Fernando Carvalho</a>
        </p>
        <p style={{ marginTop: "5px", opacity: 0.7 }}>
          &copy; {new Date().getFullYear()} Santuário Diocesano Nossa Senhora da Natividade - v5 (29/04/2026)
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