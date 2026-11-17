import { useState, useEffect, useMemo, useRef, lazy, Suspense } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import {
  Cross,
  Calendar,
  FileText,
  User,
  Clock,
  LogOut,
  Check,
  Trophy,
  Medal,
  Megaphone,
  ChevronLeft,
  ChevronRight,
  Search,
  Hourglass,
  Bell,
  BookMarked,
  CalendarPlus,
  CalendarOff,
  CheckCircle2,
  Trash2,
  Filter,
  WifiOff,
  RefreshCw,
  ArrowRight
} from "lucide-react";
import { Mass, UserData, Notice, SwapRequest } from "../types/types";
import { formatRole, getUserGender, setGlobalUserGenders } from "../constants/roles";
import { getGoogleCalendarUrl, downloadMassICS } from "../utils/calendar.utils";
import {
  isWithinSantuarioRadius,
  enqueueOfflineCheckin,
  syncOfflineCheckins,
  hasPendingOfflineCheckin,
  getOfflineCheckinQueue,
} from "../services/storage/offlineCheckin.service";
import {
  getUserMetadata,
  addUnavailability,
  removeUnavailability,
  UnavailabilityItem
} from "../services/api/user.service";
import { selfCheckIn } from "../services/api/signup.service";
import { api } from "../services/api";
import * as swapRequestService from "../services/api/swap-request.service";
import { CountdownTimer } from "./CountdownTimer";
import { ToastContainer, ConfirmModal, useToast } from "./Toast";
import { theme } from "../theme/theme";
import { calculateRanking, getMassPoints } from "../utils/ranking.utils";
import "./css/UserPanel.css"; // CSS Importado aqui

// Lazy loading de abas secundárias e modais pesados (ex: html2canvas no RankingModal)
const OfficialDocument = lazy(() => import("./OfficialDocument").then((m) => ({ default: m.OfficialDocument })));
const RankingModal = lazy(() => import("./RankingModal").then((m) => ({ default: m.RankingModal })));
const BadgesModal = lazy(() => import("./BadgesModal").then((m) => ({ default: m.BadgesModal })));
const WinnerModal = lazy(() => import("./WinnerModal").then((m) => ({ default: m.WinnerModal })));
const Prayers = lazy(() => import("./Prayers").then((m) => ({ default: m.Prayers })));

interface UserPanelProps {
  masses: Mass[];
  user: UserData;
  onToggleSignup: (massId: string) => void;
  onLogout: () => void;
  onUpdate?: () => void;
}

export function UserPanel({ masses, user, onToggleSignup, onLogout, onUpdate }: UserPanelProps) {
  const [activeTab, setActiveTab] = useState<"inscricoes" | "documento" | "oracoes">("inscricoes");
  const [onlyMyMasses, setOnlyMyMasses] = useState(false);
  const [showBadges, setShowBadges] = useState(false);
  const [showRanking, setShowRanking] = useState(false);
  const [showUnavailabilityModal, setShowUnavailabilityModal] = useState(false);
  const [myUnavailabilities, setMyUnavailabilities] = useState<UnavailabilityItem[]>(() => {
    try {
      const raw = localStorage.getItem(`servas_unav_${user.id}`);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });
  const [unavDate, setUnavDate] = useState("");
  const [unavReason, setUnavReason] = useState("");
  const [unavLoading, setUnavLoading] = useState(false);
  const [calendarModalMass, setCalendarModalMass] = useState<{ mass: Mass; roleLabel: string } | null>(null);
  const [notices, setNotices] = useState<Notice[]>(() => {
    try {
      const cached = localStorage.getItem("servas_notices_cache_v1");
      return cached ? JSON.parse(cached) : [];
    } catch {
      return [];
    }
  });
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
    api.get("/notices").then((res) => {
      setNotices(res.data);
      try {
        localStorage.setItem("servas_notices_cache_v1", JSON.stringify(res.data));
      } catch {}
    });
    loadSwapRequests();
    loadUnreadNotifications();
    getUserMetadata()
      .then((meta) => {
        if (meta?.genders) setGlobalUserGenders(meta.genders);
        if (meta?.unavailabilities && user?.id) {
          const list = meta.unavailabilities[user.id] || [];
          setMyUnavailabilities(list);
          try {
            localStorage.setItem(`servas_unav_${user.id}`, JSON.stringify(list));
          } catch {}
        }
      })
      .catch(() => {});
  }, [user?.id]);

  const [isOnline, setIsOnline] = useState(() => (typeof navigator !== "undefined" ? navigator.onLine : true));
  const [pendingOfflineCount, setPendingOfflineCount] = useState(() => getOfflineCheckinQueue().length);

  const handleManualSyncOffline = async () => {
    const { syncedCount, failedMessages } = await syncOfflineCheckins();
    setPendingOfflineCount(getOfflineCheckinQueue().length);
    if (syncedCount > 0) {
      show(
        `${syncedCount} check-in(s) registrado(s) offline foi(ram) sincronizado(s) com sucesso!`,
        "success",
        6000
      );
      onUpdate?.();
    }
    if (failedMessages.length > 0) {
      show(failedMessages[0], "error", 8000);
    }
  };

  // --- SINCRONIZAÇÃO AUTOMÁTICA DE CHECK-INS OFFLINE QUANDO VOLTAR A INTERNET ---
  useEffect(() => {
    if (!user) return;

    const handleOnline = async () => {
      setIsOnline(true);
      await handleManualSyncOffline();
    };
    const handleOffline = () => {
      setIsOnline(false);
    };

    if (navigator.onLine) {
      handleManualSyncOffline();
    }

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [user?.id]);

  // --- CHECK-IN AUTOMÁTICO VIA QR CODE DA SACRISTIA (online ou offline com fila) ---
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlToken = params.get("checkin");
    const storedToken = sessionStorage.getItem("pending_qr_checkin_token");
    const qrToken = urlToken || storedToken;

    if (qrToken && masses.length > 0 && user) {
      sessionStorage.removeItem("pending_qr_checkin_token");
      if (urlToken) {
        window.history.replaceState({}, "", window.location.pathname);
      }

      if (qrToken !== "SACRISTIA_ST_2026") {
        show("Check-in permitido apenas escaneando o QR Code oficial na sacristia.", "error", 7000);
        return;
      }

      const now = new Date();
      const myWindowEntry = masses
        .map((m) => ({
          mass: m,
          signup: m.signups.find((s) => s.userId === user.id && s.status !== "RESERVA"),
        }))
        .find(({ mass, signup }) => {
          if (!signup) return false;
          const diffMin = (now.getTime() - new Date(mass.date).getTime()) / 60000;
          return diffMin >= -120 && diffMin <= 240;
        });

      if (!myWindowEntry?.signup) {
        show("Nenhuma escala sua encontrada para o horário de agora (o check-in abre 2h antes da missa).", "info", 7000);
        return;
      }

      // Verifica se a missa é no Santuário (bloqueia capelas São Francisco, Santa Terezinha, Água Santa, etc.)
      const massLocalNorm = (myWindowEntry.mass.local || "SANTUARIO")
        .trim()
        .toUpperCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");

      if (!massLocalNorm.includes("SANTUARIO") && !massLocalNorm.includes("MATRIZ")) {
        show(
          `O check-in por QR Code é exclusivo para missas no Santuário (sua escala de hoje é em ${myWindowEntry.mass.local}).`,
          "error",
          8000
        );
        return;
      }

      if (myWindowEntry.signup.present) {
        show("Sua presença na missa de hoje no Santuário já está confirmada! Bom serviço no Altar!", "success", 6000);
        return;
      }

      if (hasPendingOfflineCheckin(myWindowEntry.signup.id)) {
        show("Sua presença já está salva no modo offline e será enviada assim que houver internet!", "info", 6000);
        return;
      }

      if (!("geolocation" in navigator)) {
        show("Seu navegador não suporta GPS. Procure a coordenação para confirmar sua presença.", "error", 7000);
        return;
      }

      show("Validando sua localização no Santuário...", "info", 4000);
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          const scannedAt = new Date().toISOString();
          const signupId = myWindowEntry.signup!.id;

          const saveOfflineIfAllowed = () => {
            if (!isWithinSantuarioRadius(lat, lng)) {
              show(
                "Check-in recusado: você precisa estar presencialmente na sacristia do Santuário para confirmar sua presença.",
                "error",
                8000
              );
              return;
            }
            enqueueOfflineCheckin({
              signupId,
              token: qrToken,
              lat,
              lng,
              scannedAt,
              massName: myWindowEntry.mass.name,
            });
            setPendingOfflineCount(getOfflineCheckinQueue().length);
            show(
              "Modo Offline: presença registrada no aparelho! Será enviada ao servidor assim que houver internet.",
              "success",
              8000
            );
          };

          if (!navigator.onLine) {
            saveOfflineIfAllowed();
            return;
          }

          selfCheckIn(signupId, qrToken, lat, lng, scannedAt)
            .then(() => {
              show("Check-in no Santuário confirmado com sucesso! Bom serviço no Altar!", "success", 6000);
              onUpdate?.();
            })
            .catch((err: any) => {
              if (!err?.response) {
                // Queda ou oscilação de rede dentro da igreja -> salva offline
                saveOfflineIfAllowed();
              } else {
                show(err?.response?.data?.error || "Não foi possível confirmar o check-in agora.", "error", 8000);
              }
            });
        },
        () => {
          show(
            "Permita o acesso à localização (GPS) do celular ao ler o QR Code para confirmar que você está no Santuário.",
            "error",
            8000
          );
        },
        { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 }
      );
    }
  }, [masses, user]);

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

  // Polling inteligente para economizar dados móveis e bateria:
  // Só consulta quando a aba está visível e online, aumentando o intervalo em redes 2G/3G ou Economia de Dados
  useEffect(() => {
    const conn = (navigator as any).connection;
    const isSlowOrDataSaver =
      conn?.saveData === true || conn?.effectiveType === "2g" || conn?.effectiveType === "3g";
    const intervalMs = isSlowOrDataSaver ? 120000 : 60000;

    const p = setInterval(() => {
      if (document.visibilityState === "visible" && navigator.onLine) {
        loadUnreadNotifications();
      }
    }, intervalMs);

    const handleVis = () => {
      if (document.visibilityState === "visible" && navigator.onLine) {
        loadUnreadNotifications();
      }
    };
    document.addEventListener("visibilitychange", handleVis);

    return () => {
      clearInterval(p);
      document.removeEventListener("visibilitychange", handleVis);
    };
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

  async function handleAddUnavailability(e: React.FormEvent) {
    e.preventDefault();
    if (!unavDate) return;
    try {
      setUnavLoading(true);
      const updated = await addUnavailability(unavDate, unavReason);
      setMyUnavailabilities(updated);
      try {
        localStorage.setItem(`servas_unav_${user.id}`, JSON.stringify(updated));
      } catch {}
      setUnavDate("");
      setUnavReason("");
      show("Indisponibilidade registrada! Os coordenadores não incluirão você nesta data.", "success");
    } catch {
      show("Erro ao registrar indisponibilidade.", "error");
    } finally {
      setUnavLoading(false);
    }
  }

  async function handleRemoveUnavailability(date: string) {
    try {
      setUnavLoading(true);
      const updated = await removeUnavailability(date);
      setMyUnavailabilities(updated);
      try {
        localStorage.setItem(`servas_unav_${user.id}`, JSON.stringify(updated));
      } catch {}
      show("Data liberada novamente.", "info");
    } catch {
      show("Erro ao remover data.", "error");
    } finally {
      setUnavLoading(false);
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

  // --- FILTRO MENSAL BASE ---
  const monthMasses = useMemo(() => {
    const filtered = masses.filter(mass => {
      const mDate = new Date(mass.date);
      const brDate = new Date(mDate.toLocaleString("en-US", { timeZone: "America/Sao_Paulo" }));

      return (
        brDate.getMonth() === selectedDate.getMonth() &&
        brDate.getFullYear() === selectedDate.getFullYear()
      );
    });

    return filtered
      .filter(m => !m.name?.includes("Ajuste de Pontos"))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [masses, selectedDate]);

  const myMonthMassesCount = useMemo(() => {
    return monthMasses.filter(m => m.signups.some(s => s.userId === user.id)).length;
  }, [monthMasses, user.id]);

  // --- FILTRO PRINCIPAL (Ordenado por data + Filtro "Minhas Escalas") ---
  const filteredMasses = useMemo(() => {
    if (!onlyMyMasses) return monthMasses;
    return monthMasses.filter(m => m.signups.some(s => s.userId === user.id));
  }, [monthMasses, onlyMyMasses, user.id]);

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

  const currentMonthScore = useMemo(() => {
    const now = new Date();
    const monthlyRanking = calculateRanking(masses, now.getMonth(), now.getFullYear());
    return monthlyRanking.find((r) => r.id === user.id)?.score ?? 0;
  }, [masses, user.id]);

  const rankTitle = useMemo(() => {
    if (confirmedScore >= 25) return "Guardiã(o) do Altar";
    if (confirmedScore >= 10) return "Servo(a) Fiel";
    return "Iniciante do Altar";
  }, [confirmedScore]);

  const nextUpcomingScale = useMemo(() => {
    const minTime = Date.now() - 2 * 60 * 60 * 1000;
    const upcoming = masses
      .map((mass) => {
        const signup = mass.signups.find((s) => s.userId === user.id && (s as any).status !== "RESERVA");
        return signup ? { mass, signup } : null;
      })
      .filter((item): item is { mass: Mass; signup: Mass["signups"][number] } => {
        if (!item) return false;
        return new Date(item.mass.date).getTime() >= minTime;
      })
      .sort((a, b) => new Date(a.mass.date).getTime() - new Date(b.mass.date).getTime());

    return upcoming[0] || null;
  }, [masses, user.id]);

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
        backgroundColor: theme.colors.background,
        paddingBottom: isMobile ? "74px" : "0",
      }}
    >
      <Suspense fallback={null}>
        {showBadges && (
          <BadgesModal count={confirmedScore} onClose={() => setShowBadges(false)} />
        )}
        {showRanking && (
          <RankingModal
            masses={masses}
            currentUserId={user.id}
            currentUserName={user.name}
            onClose={() => setShowRanking(false)}
          />
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
      </Suspense>

      {/* MODAL DE EXPORTAÇÃO PARA AGENDA DO CELULAR */}
      {calendarModalMass && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.6)",
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
            backdropFilter: "blur(3px)",
          }}
          onClick={() => setCalendarModalMass(null)}
        >
          <div
            style={{
              background: "white",
              width: "100%",
              maxWidth: "360px",
              borderRadius: "14px",
              padding: "24px",
              boxShadow: "0 12px 30px rgba(0,0,0,0.25)",
              border: `1px solid ${theme.colors.borderLight}`,
              textAlign: "center",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ margin: "0 0 8px 0", color: theme.colors.primary, fontSize: "1.1rem" }}>
              Adicionar à Agenda
            </h3>
            <p style={{ margin: "0 0 18px 0", fontSize: "0.85rem", color: theme.colors.textSecondary }}>
              Escolha como deseja salvar o lembrete desta missa no seu celular (com alarme 1h antes):
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <a
                href={getGoogleCalendarUrl(calendarModalMass.mass, calendarModalMass.roleLabel)}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setCalendarModalMass(null)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  padding: "12px",
                  borderRadius: "8px",
                  background: theme.colors.primaryGradient,
                  color: "white",
                  textDecoration: "none",
                  fontWeight: "bold",
                  fontSize: "0.85rem",
                }}
              >
                <CalendarPlus size={16} /> Abrir no Google Agenda
              </a>
              <button
                onClick={() => {
                  downloadMassICS(calendarModalMass.mass, calendarModalMass.roleLabel);
                  setCalendarModalMass(null);
                  show("Arquivo da agenda baixado! Abra-o para salvar o alarme.", "success");
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  padding: "12px",
                  borderRadius: "8px",
                  background: theme.colors.backgroundLight,
                  color: theme.colors.primary,
                  border: `1px solid ${theme.colors.border}`,
                  fontWeight: "bold",
                  fontSize: "0.85rem",
                  cursor: "pointer",
                }}
              >
                <Calendar size={16} /> Baixar para iPhone / Calendário (.ics)
              </button>
              <button
                onClick={() => setCalendarModalMass(null)}
                style={{
                  marginTop: "4px",
                  padding: "8px",
                  background: "transparent",
                  border: "none",
                  color: theme.colors.textMuted,
                  cursor: "pointer",
                  fontSize: "0.8rem",
                }}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE INDISPONIBILIDADE PROGRAMADA / JUSTIFICATIVA DE AUSÊNCIA */}
      {showUnavailabilityModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.6)",
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
            backdropFilter: "blur(3px)",
          }}
          onClick={() => setShowUnavailabilityModal(false)}
        >
          <div
            style={{
              background: "white",
              width: "100%",
              maxWidth: "400px",
              borderRadius: "14px",
              padding: "24px",
              boxShadow: "0 12px 30px rgba(0,0,0,0.25)",
              border: `1px solid ${theme.colors.borderLight}`,
              maxHeight: "85vh",
              display: "flex",
              flexDirection: "column",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
              <h3 style={{ margin: 0, color: theme.colors.primary, fontSize: "1.05rem", display: "flex", alignItems: "center", gap: "8px" }}>
                <CalendarOff size={20} /> Indisponibilidade Programada
              </h3>
              <button onClick={() => setShowUnavailabilityModal(false)} style={{ background: "none", border: "none", cursor: "pointer", color: theme.colors.textSecondary, fontSize: "1.1rem" }}>✕</button>
            </div>
            <p style={{ margin: "0 0 14px 0", fontSize: "0.83rem", color: theme.colors.textSecondary, lineHeight: 1.4 }}>
              Informe os dias em que você não poderá servir (viagem, provas, compromisso). Os coordenadores não incluirão você na escala nessas datas.
            </p>

            <form onSubmit={handleAddUnavailability} style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "16px" }}>
              <div>
                <label style={{ fontSize: "0.78rem", fontWeight: "bold", color: theme.colors.textSecondary, display: "block", marginBottom: "4px" }}>Data da Ausência *</label>
                <input
                  type="date"
                  value={unavDate}
                  min={new Date().toISOString().split("T")[0]}
                  onChange={(e) => setUnavDate(e.target.value)}
                  required
                />
              </div>
              <div>
                <label style={{ fontSize: "0.78rem", fontWeight: "bold", color: theme.colors.textSecondary, display: "block", marginBottom: "4px" }}>Motivo / Justificativa (Opcional)</label>
                <input
                  type="text"
                  value={unavReason}
                  onChange={(e) => setUnavReason(e.target.value)}
                  placeholder="Ex: Viagem, Provas, Trabalho..."
                />
              </div>
              <button
                type="submit"
                disabled={unavLoading}
                style={{
                  padding: "12px",
                  background: theme.colors.primaryGradient,
                  color: "white",
                  border: "none",
                  borderRadius: "8px",
                  fontWeight: "bold",
                  cursor: "pointer",
                }}
              >
                {unavLoading ? "Salvando..." : "+ Registrar Indisponibilidade"}
              </button>
            </form>

            <div style={{ flex: 1, overflowY: "auto", borderTop: `1px solid ${theme.colors.borderLight}`, paddingTop: "12px" }}>
              <strong style={{ fontSize: "0.8rem", color: theme.colors.textSecondary, display: "block", marginBottom: "8px" }}>
                Datas Registradas ({myUnavailabilities.length})
              </strong>
              {myUnavailabilities.length === 0 ? (
                <p style={{ fontSize: "0.82rem", color: theme.colors.textMuted, textAlign: "center", padding: "12px 0", margin: 0 }}>
                  Nenhuma indisponibilidade programada.
                </p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {myUnavailabilities.map((item) => (
                    <div
                      key={item.date}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        padding: "8px 12px",
                        background: theme.colors.backgroundLight,
                        borderRadius: "8px",
                        border: `1px solid ${theme.colors.border}`,
                      }}
                    >
                      <div>
                        <strong style={{ fontSize: "0.88rem", color: theme.colors.textMain, display: "block" }}>
                          {new Date(item.date + "T12:00:00").toLocaleDateString("pt-BR", { weekday: "short", day: "2-digit", month: "2-digit", year: "numeric" })}
                        </strong>
                        {item.reason && <span style={{ fontSize: "0.78rem", color: theme.colors.textSecondary }}>{item.reason}</span>}
                      </div>
                      <button
                        onClick={() => handleRemoveUnavailability(item.date)}
                        disabled={unavLoading}
                        style={{ background: "none", border: "none", color: theme.colors.danger, cursor: "pointer", padding: "4px" }}
                        title="Remover data"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* HEADER HERO */}
      <div className="header-hero no-print" style={{ width: "100%", boxSizing: "border-box", paddingBottom: "34px" }}>
        <div className="header-icon-wrapper">
          <Cross size={28} strokeWidth={2.2} color="#E6C786" />
        </div>

        <h1>GRUPO DE SERVOS E SERVAS <br /> SANTA TEREZINHA</h1>

        <div style={{
          marginTop: "10px",
          marginBottom: "6px",
          background: "rgba(255, 255, 255, 0.12)",
          border: "1px solid rgba(230, 199, 134, 0.35)",
          padding: "6px 18px",
          borderRadius: "8px",
          display: "inline-block",
          backdropFilter: "blur(5px)"
        }}>
          <p style={{ margin: 0, fontSize: "1rem", fontWeight: "500", fontStyle: "normal", color: "#FDFBF7" }}>
            Olá, <strong style={{ fontWeight: "800", color: "#E6C786" }}>{user.name.split(" ")[0]}</strong>
          </p>
        </div>

        <div style={{ marginTop: "6px", marginBottom: "2px" }}>
          <button
            type="button"
            onClick={() => setShowRanking(true)}
            style={{
              background: "rgba(230, 199, 134, 0.18)",
              border: "1px solid rgba(230, 199, 134, 0.45)",
              color: "#FDFBF7",
              padding: "5px 14px",
              borderRadius: "20px",
              fontSize: "0.76rem",
              fontWeight: 700,
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              backdropFilter: "blur(4px)",
            }}
            title="Abrir meu extrato de pontos e ranking"
          >
            <Trophy size={13} color="#E6C786" />
            <span>{currentMonthScore} pts este mês</span>
            <span style={{ opacity: 0.65 }}>•</span>
            <span style={{ color: "#E6C786" }}>{rankTitle}</span>
            <ArrowRight size={12} color="#E6C786" />
          </button>
        </div>

        <p style={{ fontSize: "0.85rem", opacity: 0.85, marginTop: "6px", letterSpacing: "0.5px" }}>"Servir ao Altar com zelo e alegria."</p>
      </div>

      {/* ABAS E AÇÕES RÁPIDAS */}
      <div className="container-tabs no-print" style={{ width: "100%", boxSizing: "border-box" }}>
        {/* Linha 1 (Desktop): Abas de navegação (no mobile ficam fixas na barra inferior) */}
        {!isMobile && (
          <div className="menu-tabs-scroll-wrapper" style={{
            display: "flex",
            width: "100%",
            background: "white",
            borderRadius: "12px 12px 0 0",
            padding: "6px 6px 0",
            boxSizing: "border-box",
            boxShadow: "0 -2px 10px rgba(0,0,0,0.05)",
            border: `1px solid ${theme.colors.borderLight}`,
            borderBottom: "none",
          }}>
            <button onClick={() => setActiveTab("inscricoes")} className={`tab-btn ${activeTab === "inscricoes" ? "active" : ""}`} style={{ flex: "1 0 auto", display: "flex", justifyContent: "center", gap: "5px" }}>
              <Calendar size={16} /> <span>Inscrições</span>
            </button>
            <button onClick={() => setActiveTab("documento")} className={`tab-btn ${activeTab === "documento" ? "active" : ""}`} style={{ flex: "1 0 auto", display: "flex", justifyContent: "center", gap: "5px" }}>
              <FileText size={16} /> <span>Escala</span>
            </button>
            <button onClick={() => setActiveTab("oracoes")} className={`tab-btn ${activeTab === "oracoes" ? "active" : ""}`} style={{ flex: "1 0 auto", display: "flex", justifyContent: "center", gap: "5px" }} title="Orações">
              <BookMarked size={16} /> <span>Orações</span>
            </button>
          </div>
        )}

        {/* Barra de ações rápidas com legendas claras */}
        <div
          style={{
            display: "flex",
            width: "100%",
            background: "white",
            borderRadius: isMobile ? "12px" : "0 0 12px 12px",
            padding: isMobile ? "6px 4px" : "4px 6px 6px",
            boxSizing: "border-box",
            border: `1px solid ${theme.colors.borderLight}`,
            borderTop: isMobile ? `1px solid ${theme.colors.borderLight}` : "1px solid #f0ede6",
            boxShadow: "0 6px 16px rgba(44, 26, 16, 0.08)",
            justifyContent: "space-between",
            gap: "2px",
          }}
        >
          <button
            onClick={() => setShowRanking(true)}
            className="tab-btn"
            style={{ flex: 1, color: theme.colors.success, display: "flex", flexDirection: isMobile ? "column" : "row", alignItems: "center", justifyContent: "center", gap: isMobile ? "2px" : "5px", padding: isMobile ? "6px 2px" : undefined, fontSize: isMobile ? "0.65rem" : "0.82rem" }}
            title="Placar Mensal e Extrato"
          >
            <Medal size={17} />
            <span>Placar</span>
          </button>
          <button
            onClick={() => setShowBadges(true)}
            className="tab-btn"
            style={{ flex: 1, color: theme.colors.warning, display: "flex", flexDirection: isMobile ? "column" : "row", alignItems: "center", justifyContent: "center", gap: isMobile ? "2px" : "5px", padding: isMobile ? "6px 2px" : undefined, fontSize: isMobile ? "0.65rem" : "0.82rem" }}
            title="Minhas Conquistas"
          >
            <Trophy size={17} />
            <span>Conquistas</span>
          </button>
          <button
            onClick={() => setShowUnavailabilityModal(true)}
            className="tab-btn"
            style={{ flex: 1, color: myUnavailabilities.length > 0 ? theme.colors.primary : theme.colors.textSecondary, display: "flex", flexDirection: isMobile ? "column" : "row", alignItems: "center", justifyContent: "center", gap: isMobile ? "2px" : "5px", padding: isMobile ? "6px 2px" : undefined, fontSize: isMobile ? "0.65rem" : "0.82rem", position: "relative" }}
            title="Indisponibilidade Programada / Justificar Ausência"
          >
            <CalendarOff size={17} />
            <span>Ausência</span>
            {myUnavailabilities.length > 0 && (
              <span style={{ position: "absolute", top: 2, right: isMobile ? 6 : 6, background: theme.colors.primary, color: "white", fontSize: "0.58rem", fontWeight: "bold", padding: "1px 4px", borderRadius: "8px" }}>
                {myUnavailabilities.length}
              </span>
            )}
          </button>
          <div style={{ position: "relative", flex: 1, display: "flex" }}>
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
              className="tab-btn"
              style={{ width: "100%", color: unreadCount > 0 ? theme.colors.danger : theme.colors.textMuted, display: "flex", flexDirection: isMobile ? "column" : "row", alignItems: "center", justifyContent: "center", gap: isMobile ? "2px" : "5px", padding: isMobile ? "6px 2px" : undefined, fontSize: isMobile ? "0.65rem" : "0.82rem" }}
              title="Notificações do Sistema"
            >
              <Bell size={17} />
              <span>Avisos</span>
              {unreadCount > 0 && (
                <span style={{ position: "absolute", top: 2, right: 6, background: "red", color: "white", fontSize: "0.58rem", fontWeight: "bold", padding: "1px 5px", borderRadius: "10px", minWidth: "14px", textAlign: "center", lineHeight: "1" }}>
                  {unreadCount}
                </span>
              )}
            </button>
          </div>
          <button
            onClick={onLogout}
            className="tab-btn logout"
            style={{ flex: 1, display: "flex", flexDirection: isMobile ? "column" : "row", alignItems: "center", justifyContent: "center", gap: isMobile ? "2px" : "5px", padding: isMobile ? "6px 2px" : undefined, fontSize: isMobile ? "0.65rem" : "0.82rem", color: theme.colors.dangerDark }}
            title="Sair da conta"
          >
            <LogOut size={17} />
            <span>Sair</span>
          </button>
        </div>
      </div>

      {/* FAIXA DE MODO OFFLINE / CHECK-IN PENDENTE */}
      {(!isOnline || pendingOfflineCount > 0) && (
        <div
          className="no-print"
          style={{
            margin: "12px 15px 0 15px",
            padding: "10px 14px",
            borderRadius: "10px",
            background: pendingOfflineCount > 0 ? "#FEF3C7" : "#F3F4F6",
            border: `1px solid ${pendingOfflineCount > 0 ? "#FCD34D" : "#D1D5DB"}`,
            color: pendingOfflineCount > 0 ? "#92400E" : "#374151",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "10px",
            fontSize: "0.78rem",
            fontWeight: 700,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <WifiOff size={16} style={{ flexShrink: 0 }} />
            <span>
              {pendingOfflineCount > 0
                ? `${pendingOfflineCount} check-in(s) salvo(s) offline — será(ão) enviado(s) automaticamente ao conectar.`
                : "Modo Offline ativo — suas escalas em cache continuam disponíveis para consulta e QR Code."}
            </span>
          </div>
          {pendingOfflineCount > 0 && isOnline && (
            <button
              type="button"
              onClick={handleManualSyncOffline}
              style={{
                background: "#92400E",
                color: "#fff",
                border: "none",
                borderRadius: "8px",
                padding: "5px 10px",
                fontSize: "0.72rem",
                fontWeight: 800,
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: "4px",
                flexShrink: 0,
              }}
            >
              <RefreshCw size={12} /> Sincronizar
            </button>
          )}
        </div>
      )}


      {/* AVISOS */}
      {notices.length > 0 && (
        <div className="no-print" style={{ margin: "15px 15px 5px 15px", display: "flex", flexDirection: "column", gap: "10px" }}>
          {notices.map((notice) => (
            <div key={notice.id} className="notice-animated" style={{ background: theme.colors.warningLight, borderLeft: `5px solid ${theme.colors.warning}`, color: theme.colors.warningDark, padding: "15px", borderRadius: theme.borderRadius.md, display: "flex", alignItems: "center", gap: "12px", boxShadow: theme.colors.shadowBase }}>
              <div style={{ background: theme.colors.warning, padding: "8px", borderRadius: "50%", color: "white" }}>
                <Megaphone size={20} fill="white" />
              </div>
              <div>
                <strong style={{ display: "block", fontSize: "0.78rem", textTransform: "uppercase", letterSpacing: "0.5px", color: theme.colors.warningDark, marginBottom: "2px" }}>Comunicado do Grupo</strong>
                <span style={{ fontSize: "0.98rem", fontWeight: "bold" }}>{notice.text}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* CONTEÚDO PRINCIPAL */}
      <div style={{ flex: 1, width: "100%", boxSizing: "border-box" }}>
        {activeTab === "inscricoes" ? (
          <div>
            {/* CARD DE DESTAQUE: SUA PRÓXIMA ESCALA */}
            {nextUpcomingScale && (() => {
              const nextMass = nextUpcomingScale.mass;
              const nextSignup = nextUpcomingScale.signup;
              const nextDate = new Date(nextMass.date);
              const nextDateStr = nextDate.toLocaleDateString("pt-BR", {
                timeZone: "America/Sao_Paulo",
                weekday: "short",
                day: "2-digit",
                month: "2-digit",
              });
              const nextTimeStr = nextDate.toLocaleTimeString("pt-BR", {
                timeZone: "America/Sao_Paulo",
                hour: "2-digit",
                minute: "2-digit",
              });
              const nextRole = nextSignup.role
                ? formatRole(nextSignup.role, getUserGender(user.id, user.name))
                : "Auxiliar";
              const isConfirmedPresent = Boolean(nextSignup.present);
              const isPendingOffline = hasPendingOfflineCheckin(nextSignup.id);

              return (
                <div
                  className="no-print"
                  style={{
                    margin: "12px 16px 4px 16px",
                    padding: "14px 16px",
                    borderRadius: "14px",
                    background: "linear-gradient(135deg, #FFFFFF 0%, #FAF6EE 100%)",
                    border: "1.5px solid #B8925A",
                    boxShadow: "0 4px 14px rgba(74, 50, 34, 0.08)",
                    display: "flex",
                    flexDirection: "column",
                    gap: "10px",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                    <span style={{ fontSize: "0.68rem", fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase", color: "#8C6530" }}>
                      ⛪ Sua Próxima Escala
                    </span>
                    {isConfirmedPresent ? (
                      <span style={{ background: "#DCFCE7", color: "#166534", padding: "2px 8px", borderRadius: "10px", fontSize: "0.68rem", fontWeight: 800 }}>
                        ✓ Presença Confirmada
                      </span>
                    ) : isPendingOffline ? (
                      <span style={{ background: "#FEF3C7", color: "#92400E", padding: "2px 8px", borderRadius: "10px", fontSize: "0.68rem", fontWeight: 800 }}>
                        ⏳ Aguardando Sincronizar
                      </span>
                    ) : (
                      <span style={{ background: "#F7F5F0", color: theme.colors.primary, border: `1px solid ${theme.colors.border}`, padding: "2px 8px", borderRadius: "10px", fontSize: "0.68rem", fontWeight: 700 }}>
                        {nextMass.published ? nextRole : "Aguardando publicação"}
                      </span>
                    )}
                  </div>

                  <div>
                    <div style={{ fontWeight: 800, fontSize: "0.98rem", color: "#23170F", textTransform: "capitalize" }}>
                      {nextDateStr} • {nextTimeStr}
                      {nextMass.name ? ` — ${nextMass.name}` : ""}
                    </div>
                    <div style={{ fontSize: "0.78rem", color: "#5A4332", marginTop: "2px", fontWeight: 600 }}>
                      📍 {nextMass.local || "Santuário"}
                      {nextMass.published && ` • Função: ${nextRole}`}
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                    <button
                      type="button"
                      onClick={() => setCalendarModalMass({ mass: nextMass, roleLabel: nextRole })}
                      style={{
                        flex: 1,
                        minWidth: "120px",
                        padding: "7px 10px",
                        borderRadius: "8px",
                        border: `1px solid ${theme.colors.border}`,
                        background: "#ffffff",
                        color: theme.colors.primary,
                        fontSize: "0.76rem",
                        fontWeight: 700,
                        cursor: "pointer",
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "5px",
                      }}
                    >
                      <CalendarPlus size={14} /> Agenda
                    </button>
                    {!onlyMyMasses && (
                      <button
                        type="button"
                        onClick={() => setOnlyMyMasses(true)}
                        style={{
                          flex: 1,
                          minWidth: "120px",
                          padding: "7px 10px",
                          borderRadius: "8px",
                          border: "none",
                          background: theme.colors.primary,
                          color: "#ffffff",
                          fontSize: "0.76rem",
                          fontWeight: 700,
                          cursor: "pointer",
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: "5px",
                        }}
                      >
                        <Filter size={14} /> Minhas Escalas
                      </button>
                    )}
                  </div>
                </div>
              );
            })()}

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

            {/* BARRA DE FILTRO RÁPIDO: TODAS X MINHAS ESCALAS */}
            <div
              className="no-print"
              style={{
                display: "flex",
                gap: "8px",
                padding: "0 16px 10px 16px",
                justifyContent: "center",
              }}
            >
              <button
                onClick={() => setOnlyMyMasses(false)}
                style={{
                  flex: 1,
                  maxWidth: "220px",
                  padding: "8px 12px",
                  borderRadius: "8px",
                  border: `1px solid ${!onlyMyMasses ? theme.colors.primary : theme.colors.border}`,
                  background: !onlyMyMasses ? theme.colors.primary : "white",
                  color: !onlyMyMasses ? "white" : theme.colors.textSecondary,
                  fontWeight: "bold",
                  fontSize: "0.78rem",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "6px",
                }}
              >
                <Calendar size={14} /> Todas do Mês ({monthMasses.length})
              </button>
              <button
                onClick={() => setOnlyMyMasses(true)}
                style={{
                  flex: 1,
                  maxWidth: "220px",
                  padding: "8px 12px",
                  borderRadius: "8px",
                  border: `1px solid ${onlyMyMasses ? theme.colors.primary : theme.colors.border}`,
                  background: onlyMyMasses ? theme.colors.primary : "white",
                  color: onlyMyMasses ? "white" : theme.colors.textSecondary,
                  fontWeight: "bold",
                  fontSize: "0.78rem",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "6px",
                }}
              >
                <Filter size={14} /> Minhas Escalas ({myMonthMassesCount})
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
                      <div style={{ fontSize: "0.8rem", color: theme.colors.textSecondary }}>{massDate} · Função: {formatRole(sr.signup.role)}</div>
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
                  height: isMobile ? "420px" : "calc(100vh - 250px)",
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
                    const minhaFuncao = formatRole(meuSignup?.role, user.name, user.id);

                    const isSundayDay = new Date(mass.date).getDay() === 0;

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
                      highlightClass = "sunday-card";
                    }

                    let btnClass = "btn-servir";
                    let btnText: React.ReactNode = <><Check size={16} strokeWidth={2.5} /> QUERO SERVIR</>;

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
                              {(() => {
                                const pts = mass.points !== undefined && mass.points !== null ? mass.points : getMassPoints(mass.date);
                                return (
                                  <div style={{ marginTop: "6px" }}>
                                    <span
                                      style={{
                                        display: "inline-block",
                                        fontSize: "0.68rem",
                                        fontWeight: 800,
                                        padding: "2px 7px",
                                        borderRadius: "6px",
                                        background: pts >= 2 ? "#FEF3C7" : "#F7F5F0",
                                        color: pts >= 2 ? "#92400E" : "#5A4332",
                                        border: `1px solid ${pts >= 2 ? "#FDE68A" : theme.colors.border}`,
                                      }}
                                    >
                                      +{pts} {pts === 1 ? "ponto" : "pontos"}
                                    </span>
                                  </div>
                                );
                              })()}
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

                            {/* SELO DE PRESENÇA CONFIRMADA (Check-in realizado via QR Code da Sacristia ou pelo Admin) */}
                            {jaEstouInscrita && !souReserva && meuSignup?.present && (
                              <div
                                style={{
                                  marginTop: "8px",
                                  padding: "8px 10px",
                                  borderRadius: "8px",
                                  background: "#E8F5E9",
                                  border: "1px solid #A5D6A7",
                                  color: "#1B5E20",
                                  fontWeight: "bold",
                                  fontSize: "0.8rem",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  gap: "6px",
                                }}
                              >
                                <CheckCircle2 size={15} /> Presença Confirmada no Altar
                              </div>
                            )}

                            {/* AÇÕES RÁPIDAS DO INSCRITO: AGENDA + PEDIR SUBSTITUIÇÃO */}
                            {jaEstouInscrita && !souReserva && !prazoEncerrado && (
                              (() => {
                                const mySignup = mass.signups.find(s => s.userId === user.id);
                                const hasOpenRequest = swapRequests.some(sr => sr.signupId === mySignup?.id);
                                return (
                                  <div style={{ display: "flex", gap: "8px", marginTop: "8px" }}>
                                    <button
                                      type="button"
                                      onClick={() => setCalendarModalMass({ mass, roleLabel: minhaFuncao })}
                                      style={{
                                        flex: 1,
                                        padding: "8px 6px",
                                        borderRadius: "8px",
                                        border: `1px solid ${theme.colors.border}`,
                                        background: theme.colors.backgroundLight,
                                        color: theme.colors.primary,
                                        fontWeight: "bold",
                                        cursor: "pointer",
                                        fontSize: "0.76rem",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        gap: "4px",
                                      }}
                                      title="Salvar na agenda do celular com alarme"
                                    >
                                      <CalendarPlus size={14} /> Agenda
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => mySignup && handleRequestSwap(mySignup.id)}
                                      disabled={hasOpenRequest || swapLoading === mySignup?.id}
                                      style={{
                                        flex: 1.3,
                                        padding: "8px 6px",
                                        borderRadius: "8px",
                                        border: `1px dashed ${theme.colors.warning}`,
                                        background: hasOpenRequest ? theme.colors.warningLight : "transparent",
                                        color: hasOpenRequest ? theme.colors.warningDark : theme.colors.warning,
                                        fontWeight: "bold",
                                        cursor: hasOpenRequest ? "default" : "pointer",
                                        fontSize: "0.76rem",
                                      }}
                                    >
                                      {hasOpenRequest ? "⏳ Aguardando..." : "↔ Substituição"}
                                    </button>
                                  </div>
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
        ) : (
          <Suspense
            fallback={
              <div style={{ textAlign: "center", padding: "40px 20px", color: theme.colors.textSecondary }}>
                Carregando...
              </div>
            }
          >
            {activeTab === "oracoes" ? (
              <Prayers />
            ) : (
              <OfficialDocument masses={masses.filter((m) => m.published)} />
            )}
          </Suspense>
        )}
      </div>

      <footer className="app-footer no-print" style={{ width: "100%", boxSizing: "border-box" }}>
        <p>
          Desenvolvido por <a href="https://fescarvpage.vercel.app/" target="_blank" rel="noopener noreferrer" style={{ color: theme.colors.danger, textDecoration: "none", fontWeight: "bold" }}>Fernando Carvalho</a>
        </p>
        <p style={{ marginTop: "5px", opacity: 0.7 }}>
          &copy; {new Date().getFullYear()} Santuário Diocesano Nossa Senhora da Natividade - v16.1 (17/11/2026)
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

      {/* BARRA INFERIOR FIXA NO CELULAR */}
      {isMobile && (
        <nav
          className="no-print"
          style={{
            position: "fixed",
            bottom: 0,
            left: 0,
            right: 0,
            zIndex: 900,
            background: "rgba(255, 255, 255, 0.96)",
            backdropFilter: "blur(10px)",
            borderTop: `1px solid ${theme.colors.border}`,
            boxShadow: "0 -4px 16px rgba(44, 26, 16, 0.08)",
            display: "flex",
            justifyContent: "space-around",
            alignItems: "center",
            padding: "6px 4px",
            paddingBottom: "calc(6px + env(safe-area-inset-bottom, 0px))",
          }}
        >
          {[
            { id: "inscricoes" as const, label: "Inscrições", icon: <Calendar size={19} /> },
            { id: "documento" as const, label: "Escala", icon: <FileText size={19} /> },
            { id: "oracoes" as const, label: "Orações", icon: <BookMarked size={19} /> },
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                style={{
                  flex: 1,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "2px",
                  padding: "4px 2px",
                  border: "none",
                  background: "transparent",
                  color: isActive ? theme.colors.primary : "#8C7360",
                  fontWeight: isActive ? 800 : 600,
                  fontSize: "0.68rem",
                  cursor: "pointer",
                  position: "relative",
                }}
              >
                {isActive && (
                  <span
                    style={{
                      position: "absolute",
                      top: "-6px",
                      width: "26px",
                      height: "3px",
                      borderRadius: "3px",
                      background: theme.colors.primary,
                    }}
                  />
                )}
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      )}
    </div>
  );
}