import { useState, useEffect, useMemo, useRef, lazy, Suspense } from "react";
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
  ArrowRight,
  Camera,
  Loader2,
  Eye,
  X,
  Ban,
  Cake,
  Sparkles,
  MessageCircle,
  Download,
  Gift
} from "lucide-react";
import { Mass, MassPhotoData, UserData, Notice, SwapRequest } from "../types/types";
import { formatRole, getUserGender, setGlobalUserGenders } from "../constants/roles";
import { formatServoName, setGlobalShortNames, registerUsersFromMasses } from "../utils/format.utils";
import { getGoogleCalendarUrl, downloadMassICS } from "../utils/calendar.utils";
import {
  compressMassPhotoFile,
  uploadMassPhoto,
  getMassPhoto,
  downloadMassPhotoFile,
} from "../services/api/mass.service";
import {
  getOfflinePhotoQueue,
  getOfflinePhotoForMass,
  enqueueOfflinePhoto,
  syncOfflinePhotos,
  OfflinePhotoItem,
} from "../services/storage/offlinePhoto.service";
import {
  getUserMetadata,
  getMyUnavailabilities,
  addUnavailability,
  removeUnavailability,
  UnavailabilityItem,
  ScaleSuspension
} from "../services/api/user.service";
import {
  getMyPendingPrize,
  MyPendingPrizeResponse,
  PrizeClaimRecord,
} from "../services/api/prize.service";
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
  const [mySuspension, setMySuspension] = useState<ScaleSuspension | null>(() => {
    try {
      const raw = localStorage.getItem(`servas_suspension_${user.id}`);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });
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
  const [pendingPrize, setPendingPrize] = useState<MyPendingPrizeResponse | null>(null);

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
      } catch { }
    });
    loadSwapRequests();
    loadUnreadNotifications();
    getMyUnavailabilities()
      .then((list) => {
        if (Array.isArray(list)) {
          setMyUnavailabilities(list);
          try {
            localStorage.setItem(`servas_unav_${user.id}`, JSON.stringify(list));
          } catch { }
        }
      })
      .catch(() => { });

    getUserMetadata()
      .then((meta) => {
        if (meta?.genders) setGlobalUserGenders(meta.genders);
        if (meta?.shortNames) {
          setGlobalShortNames(meta.shortNames, meta.shortNamesByFull);
          setShortNamesRev((v) => v + 1);
        }
        if (meta && "mySuspension" in meta) {
          const susp = meta.mySuspension || null;
          setMySuspension(susp);
          try {
            if (susp) {
              localStorage.setItem(`servas_suspension_${user.id}`, JSON.stringify(susp));
            } else {
              localStorage.removeItem(`servas_suspension_${user.id}`);
            }
          } catch { }
        }
      })
      .catch(() => { });
  }, [user?.id]);

  const [, setShortNamesRev] = useState(0);
  registerUsersFromMasses(masses, [user]);

  const todayBrStr = useMemo(() => {
    return new Date().toLocaleDateString("en-CA", { timeZone: "America/Sao_Paulo" });
  }, []);

  const hasValidSuspension = Boolean(mySuspension && mySuspension.until >= todayBrStr);
  const isActiveSuspensionToday = Boolean(
    mySuspension && todayBrStr >= mySuspension.from && todayBrStr <= mySuspension.until
  );

  function isSuspendedForDate(dateKey: string): boolean {
    if (!hasValidSuspension || !mySuspension) return false;
    return isActiveSuspensionToday || (dateKey >= mySuspension.from && dateKey <= mySuspension.until);
  }

  const [isOnline, setIsOnline] = useState(() => (typeof navigator !== "undefined" ? navigator.onLine : true));
  const [pendingOfflinePhotos, setPendingOfflinePhotos] = useState<OfflinePhotoItem[]>(() =>
    getOfflinePhotoQueue(user.id)
  );
  const [isSyncingPhotos, setIsSyncingPhotos] = useState(false);
  const [uploadingPhotoMassId, setUploadingPhotoMassId] = useState<string | null>(null);
  const [photoSourcePickerMass, setPhotoSourcePickerMass] = useState<Mass | null>(null);
  const [viewingPhotoMass, setViewingPhotoMass] = useState<{
    mass: Mass;
    photo: MassPhotoData | null;
    loading: boolean;
  } | null>(null);

  const handleSyncOfflinePhotos = async (manual = false) => {
    setIsSyncingPhotos(true);
    try {
      const { syncedCount, failedMessages } = await syncOfflinePhotos(user.id);
      setPendingOfflinePhotos(getOfflinePhotoQueue(user.id));

      if (syncedCount > 0) {
        show(
          `📸 ${syncedCount} foto(s) da equipe salva(s) offline foi(ram) enviada(s) com sucesso!`,
          "success",
          6000
        );
        onUpdate?.();
      } else if (manual && failedMessages.length === 0) {
        show("Sem conexão estável no momento. As fotos continuam salvas com segurança no celular.", "info", 5000);
      }

      if (failedMessages.length > 0) {
        show(failedMessages[0], "error", 8000);
      }
    } finally {
      setIsSyncingPhotos(false);
    }
  };

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      handleSyncOfflinePhotos(false);
    };
    const handleOffline = () => setIsOnline(false);
    const handleVisibility = () => {
      if (document.visibilityState === "visible" && navigator.onLine) {
        handleSyncOfflinePhotos(false);
      }
    };

    setPendingOfflinePhotos(getOfflinePhotoQueue(user.id));
    if (navigator.onLine && getOfflinePhotoQueue(user.id).length > 0) {
      handleSyncOfflinePhotos(false);
    }

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    document.addEventListener("visibilitychange", handleVisibility);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [user?.id]);

  function isMassInPhotoWindow(massDateIso: string): boolean {
    const now = new Date();
    const massDate = new Date(massDateIso);
    const diffHours = (now.getTime() - massDate.getTime()) / (1000 * 60 * 60);
    const nowBrDay = now.toLocaleDateString("en-CA", { timeZone: "America/Sao_Paulo" });
    const massBrDay = massDate.toLocaleDateString("en-CA", { timeZone: "America/Sao_Paulo" });
    return nowBrDay === massBrDay || (diffHours >= -4 && diffHours <= 24);
  }

  async function handleUploadTeamPhoto(massId: string, e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    const capturedAt = new Date().toISOString();

    try {
      setUploadingPhotoMassId(massId);
      const compressedDataUrl = await compressMassPhotoFile(file, 960, 0.74);

      const saveLocally = async (reasonMsg: string) => {
        let saved = enqueueOfflinePhoto({
          massId,
          userId: user.id,
          userName: user.name,
          imageDataUrl: compressedDataUrl,
          capturedAt,
        });
        if (!saved) {
          const compactDataUrl = await compressMassPhotoFile(file, 720, 0.6);
          saved = enqueueOfflinePhoto({
            massId,
            userId: user.id,
            userName: user.name,
            imageDataUrl: compactDataUrl,
            capturedAt,
          });
        }
        if (saved) {
          setPendingOfflinePhotos(getOfflinePhotoQueue(user.id));
          show(
            `📶 ${reasonMsg} A foto foi salva no celular e será enviada automaticamente assim que a internet voltar!`,
            "warning",
            8000
          );
        } else {
          show("Sem internet e sem espaço suficiente no navegador para salvar a foto offline.", "error", 7000);
        }
      };

      if (!navigator.onLine) {
        await saveLocally("Você está sem internet agora.");
        return;
      }

      try {
        await uploadMassPhoto(massId, compressedDataUrl, capturedAt);
        show("📸 Foto da equipe enviada com sucesso! A coordenação fará a conferência de presença.", "success", 6000);
        onUpdate?.();
      } catch (uploadErr: any) {
        const status = uploadErr?.response?.status;
        if (!uploadErr?.response || status >= 500 || status === 401) {
          await saveLocally("Sinal fraco ou sem conexão com o servidor.");
        } else {
          const msg = uploadErr?.response?.data?.error || "Erro ao enviar a foto da equipe.";
          show(msg, "error", 7000);
        }
      }
    } catch (err: any) {
      const msg = err?.message || "Erro ao processar a foto da equipe.";
      show(msg, "error", 7000);
    } finally {
      setUploadingPhotoMassId(null);
    }
  }

  async function handleViewTeamPhoto(mass: Mass) {
    if (!mass.hasPhoto) {
      const localPending = getOfflinePhotoForMass(mass.id, user.id);
      if (localPending) {
        setViewingPhotoMass({
          mass,
          photo: {
            massId: mass.id,
            uploadedById: localPending.userId,
            uploadedByName: `${formatServoName(localPending.userName, localPending.userId)} (salva offline)`,
            uploadedAt: localPending.capturedAt,
            imageDataUrl: localPending.imageDataUrl,
          },
          loading: false,
        });
        return;
      }
    }

    setViewingPhotoMass({ mass, photo: null, loading: true });
    try {
      const photo = await getMassPhoto(mass.id);
      setViewingPhotoMass({ mass, photo, loading: false });
    } catch (err: any) {
      setViewingPhotoMass(null);
      show(err?.response?.data?.error || "Não foi possível carregar a foto desta missa.", "error", 6000);
    }
  }

  function renderTeamPhotoSection(mass: Mass, jaEstouInscrita: boolean, souReserva: boolean) {
    if (!jaEstouInscrita || souReserva) return null;
    const inWindow = isMassInPhotoWindow(mass.date);
    const pendingLocal = !mass.hasPhoto ? pendingOfflinePhotos.find((p) => p.massId === mass.id) : undefined;
    if (!inWindow && !mass.hasPhoto && !pendingLocal) return null;
    const isUploading = uploadingPhotoMassId === mass.id;

    if (pendingLocal) {
      return (
        <div
          style={{
            marginTop: "8px",
            padding: "9px 10px",
            borderRadius: "9px",
            background: "#FFFBEB",
            border: "1.5px solid #FCD34D",
            display: "flex",
            flexDirection: "column",
            gap: "7px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px", flexWrap: "wrap" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#92400E", fontSize: "0.76rem", fontWeight: 800 }}>
              <Camera size={14} />
              <span>⏳ Foto salva no celular (aguardando internet)</span>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
            <button
              type="button"
              onClick={() => handleViewTeamPhoto(mass)}
              style={{
                padding: "5px 9px",
                borderRadius: "6px",
                border: "1px solid #FCD34D",
                background: "#FFFFFF",
                color: "#92400E",
                fontSize: "0.72rem",
                fontWeight: 800,
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: "4px",
              }}
            >
              <Eye size={12} /> Ver
            </button>
            <button
              type="button"
              onClick={() => setPhotoSourcePickerMass(mass)}
              disabled={isUploading}
              style={{
                padding: "5px 9px",
                borderRadius: "6px",
                border: `1px solid ${theme.colors.border}`,
                background: "#FFFFFF",
                color: theme.colors.primary,
                fontSize: "0.72rem",
                fontWeight: 700,
                cursor: isUploading ? "not-allowed" : "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: "4px",
              }}
            >
              <Camera size={12} /> Trocar
            </button>
            {isOnline && (
              <button
                type="button"
                onClick={() => handleSyncOfflinePhotos(true)}
                disabled={isSyncingPhotos}
                style={{
                  padding: "5px 9px",
                  borderRadius: "6px",
                  border: "none",
                  background: "#92400E",
                  color: "#FFFFFF",
                  fontSize: "0.72rem",
                  fontWeight: 800,
                  cursor: isSyncingPhotos ? "not-allowed" : "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "4px",
                }}
              >
                <RefreshCw size={12} className={isSyncingPhotos ? "animate-spin" : ""} />
                <span>{isSyncingPhotos ? "Enviando..." : "Enviar agora"}</span>
              </button>
            )}
          </div>
        </div>
      );
    }

    if (mass.hasPhoto) {
      return (
        <div
          style={{
            marginTop: "8px",
            padding: "8px 10px",
            borderRadius: "9px",
            background: "#F0FDF4",
            border: "1px solid #BBF7D0",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "8px",
            flexWrap: "wrap",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#166534", fontSize: "0.76rem", fontWeight: 700 }}>
            <Camera size={14} />
            <span>
              Foto da equipe enviada{mass.photoUploadedBy ? ` por ${formatServoName(mass.photoUploadedBy)}` : ""}
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <button
              type="button"
              onClick={() => handleViewTeamPhoto(mass)}
              style={{
                padding: "4px 8px",
                borderRadius: "6px",
                border: "1px solid #86EFAC",
                background: "#FFFFFF",
                color: "#166534",
                fontSize: "0.72rem",
                fontWeight: 800,
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: "4px",
              }}
            >
              <Eye size={12} /> Ver
            </button>
            {inWindow && (
              <button
                type="button"
                onClick={() => setPhotoSourcePickerMass(mass)}
                disabled={isUploading}
                style={{
                  padding: "4px 8px",
                  borderRadius: "6px",
                  border: `1px solid ${theme.colors.border}`,
                  background: "#FFFFFF",
                  color: theme.colors.primary,
                  fontSize: "0.72rem",
                  fontWeight: 700,
                  cursor: isUploading ? "not-allowed" : "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "4px",
                  margin: 0,
                }}
              >
                {isUploading ? <Loader2 size={12} className="animate-spin" /> : <Camera size={12} />}
                <span>{isUploading ? "Enviando..." : "Trocar"}</span>
              </button>
            )}
          </div>
        </div>
      );
    }

    return (
      <button
        type="button"
        onClick={() => setPhotoSourcePickerMass(mass)}
        disabled={isUploading}
        style={{
          marginTop: "8px",
          width: "100%",
          padding: "10px 12px",
          borderRadius: "9px",
          border: "none",
          background: "linear-gradient(135deg, #166534 0%, #15803D 100%)",
          color: "#FFFFFF",
          fontWeight: 800,
          fontSize: "0.8rem",
          cursor: isUploading ? "not-allowed" : "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "7px",
          boxShadow: "0 3px 10px rgba(22, 101, 52, 0.25)",
          textAlign: "center",
        }}
      >
        {isUploading ? <Loader2 size={16} className="animate-spin" /> : <Camera size={16} />}
        <span>{isUploading ? "Comprimindo e enviando foto..." : "📸 Enviar Foto da Equipe (Presença)"}</span>
      </button>
    );
  }

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

  // --- Lógica da Premiação Mensal (3 Balões) ---
  // Continua abrindo os 3 balões em TODOS os logins/acessos até a vencedora estourar um balão!
  useEffect(() => {
    if (!user?.id) return;
    let cancelled = false;

    const checkPendingBalloon = () => {
      getMyPendingPrize()
        .then((res) => {
          if (cancelled) return;
          if (!res?.eligible) {
            setPendingPrize(null);
            return;
          }
          setPendingPrize(res);

          // Enquanto NÃO tiver estourado o balão, SEMPRE abre o modal (mesmo após vários logins ou reabrir o app)
          if (!res.alreadyClaimed) {
            setShowWinnerModal(true);
          } else if (res.claim) {
            const seenKey = `winner_claim_seen_${res.claim.ymKey}_${user.id}`;
            if (!localStorage.getItem(seenKey)) {
              setShowWinnerModal(true);
            }
          }
        })
        .catch(() => {});
    };

    checkPendingBalloon();

    const handleVisPrize = () => {
      if (document.visibilityState === "visible" && navigator.onLine) {
        checkPendingBalloon();
      }
    };
    document.addEventListener("visibilitychange", handleVisPrize);

    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", handleVisPrize);
    };
  }, [user?.id]);

  const handleBalloonClaimed = (claim: PrizeClaimRecord) => {
    try {
      localStorage.setItem(`winner_claim_seen_${claim.ymKey}_${user.id}`, "true");
    } catch {}
    setPendingPrize((prev) =>
      prev
        ? {
            ...prev,
            alreadyClaimed: true,
            claim,
          }
        : prev
    );
  };

  const handleCloseWinnerModal = () => {
    if (pendingPrize?.claim?.ymKey) {
      try {
        localStorage.setItem(`winner_claim_seen_${pendingPrize.claim.ymKey}_${user.id}`, "true");
      } catch {}
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
      } catch { }
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
      } catch { }
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

  // --- AGRUPAMENTO POR DIA (para agrupar missas do mesmo dia e rolar 1 dia por vez) ---
  const groupedMassesByDay = useMemo(() => {
    const groups: { dateKey: string; dateObj: Date; masses: Mass[] }[] = [];
    const map = new Map<string, { dateKey: string; dateObj: Date; masses: Mass[] }>();

    for (const mass of filteredMasses) {
      const d = new Date(mass.date);
      const brKey = d.toLocaleDateString("en-CA", { timeZone: "America/Sao_Paulo" });
      let grp = map.get(brKey);
      if (!grp) {
        grp = { dateKey: brKey, dateObj: d, masses: [] };
        map.set(brKey, grp);
        groups.push(grp);
      }
      grp.masses.push(mass);
    }
    return groups;
  }, [filteredMasses]);

  const dayCardRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // --- AUTO-SCROLL PARA A PRIMEIRA DATA DISPONÍVEL ---
  useEffect(() => {
    if (activeTab === "inscricoes" && groupedMassesByDay.length > 0) {
      const now = new Date();
      now.setHours(0, 0, 0, 0);

      const firstUpcoming = groupedMassesByDay.find((g) => g.dateObj >= now);
      if (firstUpcoming) {
        setTimeout(() => {
          const el = dayCardRefs.current[firstUpcoming.dateKey];
          if (el) {
            el.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
          }
        }, 300);
      }
    }
  }, [selectedDate, activeTab, groupedMassesByDay]);

  // Função robusta para checar se expirou
  const checkStatus = (massDate: string, deadline?: string) => {
    const now = new Date();
    if (deadline) return new Date(deadline) < now;
    const massD = new Date(massDate);
    return massD < now;
  };

  const confirmedScore = useMemo(() => {
    return masses.reduce((acc, mass) => {
      const mySignup = mass.signups.find((s) => s.userId === user.id);
      if (mySignup && mySignup.present && (mySignup as any).status !== "RESERVA") return acc + 1;
      return acc;
    }, 0);
  }, [masses, user.id]);

  const currentMonthScore = useMemo(() => {
    const now = new Date();
    const monthlyRanking = calculateRanking(masses, now.getMonth(), now.getFullYear());
    return monthlyRanking.find((r) => r.id === user.id)?.score ?? 0;
  }, [masses, user.id]);

  const rankTitle = useMemo(() => {
    if (confirmedScore >= 100) return "Lenda de Santa Terezinha";
    if (confirmedScore >= 50) return "Guardiã(o) do Altar";
    if (confirmedScore >= 30) return "Coluna do Santuário";
    if (confirmedScore >= 15) return "Servo(a) Fiel";
    if (confirmedScore >= 5) return "Servo(a) Dedicado(a)";
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
          <BadgesModal
            masses={masses}
            userId={user.id}
            userName={user.name}
            onClose={() => setShowBadges(false)}
          />
        )}
        {showRanking && (
          <RankingModal
            masses={masses}
            currentUserId={user.id}
            currentUserName={user.name}
            onClose={() => setShowRanking(false)}
          />
        )}
        {showWinnerModal && pendingPrize?.eligible && pendingPrize.year !== undefined && pendingPrize.month !== undefined && (
          <WinnerModal
            score={pendingPrize.score || 0}
            totalPresences={pendingPrize.totalPresences}
            month={pendingPrize.month}
            year={pendingPrize.year}
            ymKey={pendingPrize.ymKey}
            customLabel={pendingPrize.customLabel}
            userName={formatServoName(user.name, user.id)}
            initialClaim={pendingPrize.claim || null}
            onClaimed={handleBalloonClaimed}
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
            Olá, <strong style={{ fontWeight: "800", color: "#E6C786" }}>{formatServoName(user.name, user.id)}</strong>
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

      {/* FAIXA DE MODO OFFLINE / FOTOS PENDENTES */}
      {(!isOnline || pendingOfflinePhotos.length > 0) && (
        <div
          className="no-print"
          style={{
            margin: "12px 15px 0 15px",
            padding: "10px 14px",
            borderRadius: "10px",
            background: pendingOfflinePhotos.length > 0 ? "#FEF3C7" : "#F3F4F6",
            border: `1px solid ${pendingOfflinePhotos.length > 0 ? "#FCD34D" : "#D1D5DB"}`,
            color: pendingOfflinePhotos.length > 0 ? "#92400E" : "#374151",
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
              {pendingOfflinePhotos.length > 0
                ? `${pendingOfflinePhotos.length} foto(s) da equipe salva(s) offline — será(ão) enviada(s) automaticamente ao conectar.`
                : "Modo Offline ativo — você pode consultar escalas e salvar a foto da equipe no celular para envio automático depois."}
            </span>
          </div>
          {pendingOfflinePhotos.length > 0 && isOnline && (
            <button
              type="button"
              onClick={() => handleSyncOfflinePhotos(true)}
              disabled={isSyncingPhotos}
              style={{
                background: "#92400E",
                color: "#fff",
                border: "none",
                borderRadius: "8px",
                padding: "5px 10px",
                fontSize: "0.72rem",
                fontWeight: 800,
                cursor: isSyncingPhotos ? "not-allowed" : "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: "4px",
                flexShrink: 0,
              }}
            >
              <RefreshCw size={12} className={isSyncingPhotos ? "animate-spin" : ""} />
              <span>{isSyncingPhotos ? "Enviando..." : "Sincronizar"}</span>
            </button>
          )}
        </div>
      )}


      {/* BANNER DE PREMIAÇÃO DO MÊS (BALÃO PENDENTE OU PRÊMIO AGUARDANDO ENTREGA) */}
      {pendingPrize?.eligible && (!pendingPrize.alreadyClaimed || (pendingPrize.claim && !pendingPrize.claim.delivered)) && (
        <div
          className="no-print"
          onClick={() => setShowWinnerModal(true)}
          style={{
            margin: "12px 15px 0 15px",
            padding: "13px 15px",
            borderRadius: "14px",
            background: "linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%)",
            border: "2px solid #D97706",
            color: "#4A3222",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "12px",
            cursor: "pointer",
            boxShadow: "0 6px 16px rgba(217, 119, 6, 0.22)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: 0 }}>
            <div style={{ background: "#D97706", color: "#fff", padding: "8px", borderRadius: "50%", flexShrink: 0, display: "flex" }}>
              <Gift size={18} />
            </div>
            <div style={{ fontSize: "0.82rem", lineHeight: 1.35 }}>
              {!pendingPrize.alreadyClaimed ? (
                <>
                  <div style={{ fontWeight: 900, fontSize: "0.88rem", color: "#78350F" }}>
                    🎈 Você venceu o Destaque do Mês!
                  </div>
                  <div style={{ fontWeight: 600, color: "#92400E" }}>
                    Toque aqui para escolher e estourar seu balão premiado!
                  </div>
                </>
              ) : (
                <>
                  <div style={{ fontWeight: 900, fontSize: "0.85rem", color: "#78350F" }}>
                    🎁 Seu prêmio: {pendingPrize.claim?.prizeWon}
                  </div>
                  <div style={{ fontSize: "0.75rem", fontWeight: 600, color: "#92400E" }}>
                    Procure a coordenação para retirar seu presente!
                  </div>
                </>
              )}
            </div>
          </div>
          <span
            style={{
              background: "#4A3222",
              color: "#FFF",
              padding: "6px 11px",
              borderRadius: "999px",
              fontSize: "0.74rem",
              fontWeight: 800,
              flexShrink: 0,
            }}
          >
            {!pendingPrize.alreadyClaimed ? "Estourar 🎈" : "Ver"}
          </span>
        </div>
      )}

      {/* AVISO DE SUSPENSÃO TEMPORÁRIA DE ESCALAS */}
      {hasValidSuspension && mySuspension && (
        <div
          className="no-print"
          style={{
            margin: "12px 15px 0 15px",
            padding: "12px 14px",
            borderRadius: "12px",
            background: "linear-gradient(135deg, #FEF2F2 0%, #FFF1F2 100%)",
            border: "1.5px solid #F87171",
            color: "#991B1B",
            display: "flex",
            alignItems: "flex-start",
            gap: "10px",
            boxShadow: "0 4px 12px rgba(185, 28, 28, 0.1)",
          }}
        >
          <div style={{ background: "#DC2626", padding: "7px", borderRadius: "50%", color: "#fff", flexShrink: 0, marginTop: "2px" }}>
            <Ban size={18} />
          </div>
          <div style={{ fontSize: "0.82rem", lineHeight: 1.45 }}>
            <div style={{ fontWeight: 900, fontSize: "0.86rem", textTransform: "uppercase", letterSpacing: "0.3px", marginBottom: "2px" }}>
              Suspensão Temporária de Escalas
            </div>
            <div>
              Você está suspenso(a) de pegar novas escalas no período de{" "}
              <strong>{new Date(mySuspension.from + "T12:00:00").toLocaleDateString("pt-BR")}</strong> até{" "}
              <strong>{new Date(mySuspension.until + "T12:00:00").toLocaleDateString("pt-BR")}</strong>
              {mySuspension.reason ? ` (${mySuspension.reason})` : ""}.
            </div>
            <div style={{ marginTop: "3px", fontSize: "0.75rem", color: "#7F1D1D", fontWeight: 600 }}>
              Seu acesso ao aplicativo (avisos, escala oficial e orações) continua normal.
            </div>
          </div>
        </div>
      )}

      {/* AVISOS */}
      {notices.length > 0 && (
        <div className="no-print" style={{ margin: "15px 15px 5px 15px", display: "flex", flexDirection: "column", gap: "10px" }}>
          {notices.map((notice) => {
            const isBirthday = notice.id === "birthday-notice-auto" || Boolean(notice.isBirthday);

            if (isBirthday) {
              const people = notice.birthdayPeople && notice.birthdayPeople.length > 0 ? notice.birthdayPeople : [];
              const isMyBirthday = people.some((p) => p.id === user.id);
              const others = people.filter((p) => p.id !== user.id);
              const namesForWa = (others.length > 0 ? others : people).map((p) => formatServoName(p.name, p.id));
              const formattedWaNames =
                namesForWa.length <= 1
                  ? namesForWa[0] || ""
                  : namesForWa.length === 2
                    ? `${namesForWa[0]} e ${namesForWa[1]}`
                    : `${namesForWa.slice(0, -1).join(", ")} e ${namesForWa[namesForWa.length - 1]}`;
              const waText = `🎂 Parabéns, ${formattedWaNames}! Que Deus abençoe muito ${namesForWa.length > 1 ? "vocês" : "você"} e o serviço no Altar! 🙏🎉`;

              return (
                <div
                  key={notice.id}
                  className="notice-animated"
                  style={{
                    background: "linear-gradient(135deg, #FFFBF0 0%, #FDF2D6 55%, #FCE7B2 100%)",
                    border: "1.5px solid #D4A44C",
                    borderLeft: "5px solid #B8925A",
                    color: "#4A3222",
                    padding: "16px",
                    borderRadius: theme.borderRadius.md,
                    boxShadow: "0 6px 18px rgba(184, 146, 90, 0.22)",
                    display: "flex",
                    flexDirection: "column",
                    gap: "10px",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <div
                      style={{
                        background: "linear-gradient(135deg, #B8925A 0%, #8C6530 100%)",
                        width: "42px",
                        height: "42px",
                        borderRadius: "50%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                        boxShadow: "0 3px 8px rgba(140, 101, 48, 0.3)",
                      }}
                    >
                      <Cake size={22} color="#FFFFFF" />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "5px",
                          fontSize: "0.74rem",
                          fontWeight: 800,
                          textTransform: "uppercase",
                          letterSpacing: "0.07em",
                          color: "#8C6530",
                        }}
                      >
                        {isMyBirthday ? (
                          <>
                            <Sparkles size={13} />
                            <span>Feliz Aniversário!</span>
                          </>
                        ) : (
                          <span>
                            {people.length > 1 ? "🎂 Aniversariantes do Dia" : "🎂 Aniversariante do Dia"}
                          </span>
                        )}
                      </div>
                      {people.length === 0 && (
                        <div style={{ fontSize: "0.98rem", fontWeight: 700, color: "#4A3222", marginTop: "3px" }}>
                          {notice.text}
                        </div>
                      )}
                    </div>
                  </div>

                  {people.length > 0 && (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                      {people.map((person) => (
                        <span
                          key={person.id}
                          style={{
                            background: "rgba(255, 255, 255, 0.9)",
                            border: "1px solid #E2BE72",
                            borderRadius: "999px",
                            padding: "6px 12px",
                            fontSize: "0.96rem",
                            fontWeight: 800,
                            color: "#4A3222",
                            boxShadow: "0 1px 4px rgba(74, 50, 34, 0.08)",
                          }}
                        >
                          🎉 {formatServoName(person.name, person.id)}
                        </span>
                      ))}
                    </div>
                  )}

                  <div style={{ fontSize: "0.88rem", color: "#5C4028", lineHeight: 1.45, fontWeight: 500 }}>
                    {isMyBirthday
                      ? "Hoje é o seu dia especial! Que Deus abençoe grandemente a sua vida e o seu serviço no Altar do Senhor! 🙏✨"
                      : `Vamos parabenizar e rezar! Que Deus abençoe muito ${people.length > 1 ? "as suas vidas" : "a sua vida"} e o serviço no Altar! 🙏✨`}
                  </div>

                  {people.length > 0 && others.length > 0 && (
                    <div>
                      <a
                        href={`https://wa.me/?text=${encodeURIComponent(waText)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "6px",
                          background: "#4A3222",
                          color: "#FFFFFF",
                          textDecoration: "none",
                          fontSize: "0.78rem",
                          fontWeight: 700,
                          padding: "7px 12px",
                          borderRadius: "8px",
                        }}
                      >
                        <MessageCircle size={14} />
                        <span>Parabenizar no WhatsApp</span>
                      </a>
                    </div>
                  )}
                </div>
              );
            }

            return (
              <div key={notice.id} className="notice-animated" style={{ background: theme.colors.warningLight, borderLeft: `5px solid ${theme.colors.warning}`, color: theme.colors.warningDark, padding: "15px", borderRadius: theme.borderRadius.md, display: "flex", alignItems: "center", gap: "12px", boxShadow: theme.colors.shadowBase }}>
                <div style={{ background: theme.colors.warning, padding: "8px", borderRadius: "50%", color: "white" }}>
                  <Megaphone size={20} fill="white" />
                </div>
                <div>
                  <strong style={{ display: "block", fontSize: "0.78rem", textTransform: "uppercase", letterSpacing: "0.5px", color: theme.colors.warningDark, marginBottom: "2px" }}>Comunicado do Grupo</strong>
                  <span style={{ fontSize: "0.98rem", fontWeight: "bold" }}>{notice.text}</span>
                </div>
              </div>
            );
          })}
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
                    ) : nextMass.hasPhoto ? (
                      <span style={{ background: "#DCFCE7", color: "#166534", padding: "2px 8px", borderRadius: "10px", fontSize: "0.68rem", fontWeight: 800 }}>
                        📸 Foto da Equipe Enviada
                      </span>
                    ) : pendingOfflinePhotos.some((p) => p.massId === nextMass.id) ? (
                      <span style={{ background: "#FEF3C7", color: "#92400E", padding: "2px 8px", borderRadius: "10px", fontSize: "0.68rem", fontWeight: 800 }}>
                        ⏳ Foto Salva Offline
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

                  {renderTeamPhotoSection(nextMass, true, false)}
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
                  const massDateBrKey = new Date(sr.signup.mass.date).toLocaleDateString("en-CA", { timeZone: "America/Sao_Paulo" });
                  const isMyRequest = sr.requesterId === user.id;
                  const blockedSwapBySuspension = !isMyRequest && isSuspendedForDate(massDateBrKey);
                  return (
                    <div key={sr.id} style={{ padding: "12px 15px", borderBottom: `1px solid ${theme.colors.warningLight}`, display: "flex", flexDirection: "column", gap: "6px" }}>
                      <div style={{ fontSize: "0.9rem", color: theme.colors.textMain }}>
                        <strong>{formatServoName(sr.signup.user.name, sr.signup.user?.id || sr.requesterId)}</strong> não pode atender a <strong>{sr.signup.mass.name || massDate}</strong>
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
                          disabled={swapLoading === sr.id || blockedSwapBySuspension}
                          style={{
                            alignSelf: "flex-start",
                            padding: "6px 14px",
                            borderRadius: "20px",
                            border: "none",
                            background: blockedSwapBySuspension ? "#FEE2E2" : theme.colors.successLight,
                            color: blockedSwapBySuspension ? "#991B1B" : theme.colors.successDark,
                            fontWeight: "bold",
                            cursor: blockedSwapBySuspension ? "not-allowed" : "pointer",
                            fontSize: "0.8rem",
                          }}
                        >
                          {swapLoading === sr.id
                            ? "..."
                            : blockedSwapBySuspension
                              ? "🚫 Suspenso(a) de escalas"
                              : "✅ Aceitar e entrar no lugar"}
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
              /* --- LISTA AGRUPADA POR DIA (1 dia por vez no celular com scroll-snap) --- */
              <div>
                {isMobile && groupedMassesByDay.length > 1 && (
                  <div style={{ textAlign: "center", fontSize: "0.72rem", color: "#8C7360", fontWeight: 700, marginBottom: "6px" }}>
                    ↔ Deslize para navegar entre os dias ({groupedMassesByDay.length} dias no mês)
                  </div>
                )}
                <div
                  ref={parentRef}
                  className="responsive-list-container no-scrollbar"
                  style={
                    isMobile
                      ? {
                        display: "flex",
                        flexDirection: "row",
                        alignItems: "flex-start",
                        gap: "12px",
                        overflowX: "auto",
                        overflowY: "hidden",
                        scrollSnapType: "x mandatory",
                        WebkitOverflowScrolling: "touch",
                        padding: "6px 18px 18px 18px",
                        boxSizing: "border-box",
                        width: "100%",
                        height: "auto",
                      }
                      : {
                        display: "flex",
                        flexDirection: "column",
                        gap: "18px",
                        padding: "0 30px 40px 30px",
                        maxWidth: "820px",
                        margin: "0 auto",
                        width: "100%",
                        height: "auto",
                        boxSizing: "border-box",
                      }
                  }
                >
                  {groupedMassesByDay.map((group, groupIdx) => {
                    const dayNum = group.dateObj.toLocaleDateString("pt-BR", {
                      timeZone: "America/Sao_Paulo",
                      day: "2-digit",
                    });
                    const monthShort = group.dateObj
                      .toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo", month: "short" })
                      .replace(".", "")
                      .toUpperCase();
                    const weekdayLabel = group.dateObj.toLocaleDateString("pt-BR", {
                      timeZone: "America/Sao_Paulo",
                      weekday: "long",
                    });
                    const hasSolemnity = group.masses.some((m) => m.isSolemnity);
                    const isSingleMass = group.masses.length === 1;
                    const singleMass = isSingleMass ? group.masses[0] : null;
                    const groupTitle = group.masses.find((m) => m.name)?.name || weekdayLabel;

                    if (isSingleMass && singleMass) {
                      const mass = singleMass;
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
                      if (isInativa) cardClass = "card-inactive";
                      else if (isAvailable) cardClass = "mass-highlight";

                      let highlightClass = "";
                      if (mass.isSolemnity) highlightClass = "solemnity-card";
                      else if (isSundayDay) highlightClass = "sunday-card";

                      const myUnavForDay = myUnavailabilities.find((u) => u.date === group.dateKey);
                      const isBlockedByUnav = !jaEstouInscrita && Boolean(myUnavForDay);
                      const isBlockedBySuspension = !jaEstouInscrita && isSuspendedForDate(group.dateKey);
                      const botaoDesabilitadoFinal = botaoDesabilitado || isBlockedByUnav || isBlockedBySuspension;

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
                      } else if (isBlockedBySuspension && mySuspension) {
                        const shortUntil = new Date(mySuspension.until + "T12:00:00").toLocaleDateString("pt-BR");
                        btnClass = "btn-disabled";
                        btnText = `🚫 SUSPENSO ATÉ ${shortUntil}`;
                      } else if (isBlockedByUnav) {
                        btnClass = "btn-disabled";
                        btnText = `AUSENTE: ${myUnavForDay?.reason || "Indisponível"}`;
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

                      const pts = mass.points !== undefined && mass.points !== null ? mass.points : getMassPoints(mass.date);

                      return (
                        <div
                          key={group.dateKey}
                          ref={(el) => {
                            dayCardRefs.current[group.dateKey] = el;
                          }}
                          style={{
                            flex: isMobile ? "0 0 calc(100vw - 36px)" : "0 0 auto",
                            width: isMobile ? "calc(100vw - 36px)" : "100%",
                            scrollSnapAlign: isMobile ? "center" : undefined,
                            scrollSnapStop: isMobile ? "always" : undefined,
                            boxSizing: "border-box",
                          }}
                        >
                          <div
                            className={`responsive-card ${cardClass} ${highlightClass}`}
                            style={{
                              width: "100%",
                              minHeight: isMobile ? "340px" : undefined,
                              margin: 0,
                              minWidth: "auto",
                              boxSizing: "border-box",
                              justifyContent: "flex-start",
                              position: "relative",
                            }}
                          >
                            {mass.deadline && !prazoEncerrado && estaAberto && (
                              <div style={{ position: "absolute", top: 15, right: 15, zIndex: 2 }}>
                                <CountdownTimer deadline={mass.deadline} />
                              </div>
                            )}

                            <div style={{ display: "flex", gap: "15px", alignItems: "flex-start", marginBottom: "20px" }}>
                              <div className="pink-date-badge" style={mass.isSolemnity ? { background: "linear-gradient(180deg, #f59e0b 0%, #b45309 100%)", boxShadow: "0 4px 12px rgba(245, 158, 11, 0.4)" } : {}}>
                                <span className="day">{dayNum}</span>
                                <span className="month">{monthShort}</span>
                              </div>

                              <div style={{ flex: 1 }}>
                                <h3 className="card-title">
                                  {mass.name || weekdayLabel}
                                </h3>
                                {mass.local && (
                                  <div style={{ fontSize: "0.85rem", color: theme.colors.textSecondary, fontWeight: "bold", marginBottom: "4px" }}>
                                    📍 {mass.local}
                                  </div>
                                )}
                                <div className="card-time">
                                  <Clock size={16} color={theme.colors.primary} />
                                  <span>
                                    {new Date(mass.date).toLocaleTimeString("pt-BR", { timeZone: "America/Sao_Paulo", hour: "2-digit", minute: "2-digit" })}
                                  </span>
                                  <span style={{ color: "#b2bec3" }}>•</span>
                                  <span style={{ textTransform: "capitalize" }}>{weekdayLabel}</span>
                                </div>
                                <div style={{ marginTop: "6px", display: "flex", gap: "6px", flexWrap: "wrap" }}>
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
                                  {mass.isSolemnity && (
                                    <span style={{ fontSize: "0.66rem", fontWeight: 800, padding: "2px 7px", borderRadius: "6px", background: "#FEF3C7", color: "#B45309" }}>
                                      Solenidade
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>

                            {mostrarFuncao && (
                              <div className={`role-pill ${souReserva ? "reserva" : (!mass.published ? "pendente" : "")}`}>
                                {souReserva ? (
                                  <>
                                    <Hourglass size={14} />
                                    Fila de Espera
                                  </>
                                ) : mass.published ? (
                                  <>
                                    <User size={14} />
                                    Função: {minhaFuncao}
                                  </>
                                ) : (
                                  <>
                                    <Clock size={14} />
                                    Aguardando publicação
                                  </>
                                )}
                              </div>
                            )}

                            <div style={{ height: "1px", background: theme.colors.borderLight, marginBottom: "15px", flexShrink: 0 }}></div>

                            <div style={{ marginTop: "auto" }}>
                              <div className="vagas-text">
                                <User size={18} strokeWidth={2.5} color={theme.colors.textMain} />
                                <strong>{totalConfirmados}</strong> <span>/ {mass.maxServers} vagas</span>
                              </div>

                              <button
                                className={btnClass}
                                onClick={() => onToggleSignup(mass.id)}
                                disabled={botaoDesabilitadoFinal}
                                style={
                                  mass.isSolemnity && btnClass === "btn-servir"
                                    ? {
                                      background: "linear-gradient(135deg, #B45309 0%, #D97706 100%)",
                                      color: "#FFFFFF",
                                      boxShadow: "0 4px 12px rgba(217, 119, 6, 0.35)",
                                      border: "1px solid #F59E0B",
                                    }
                                    : (isBlockedByUnav || isBlockedBySuspension)
                                      ? { whiteSpace: "normal", lineHeight: 1.25 }
                                      : undefined
                                }
                              >
                                {btnText}
                              </button>

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

                              {renderTeamPhotoSection(mass, jaEstouInscrita, souReserva)}

                              {jaEstouInscrita && !souReserva && !prazoEncerrado && (() => {
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
                              })()}
                            </div>
                          </div>
                        </div>
                      );
                    }

                    return (
                      <div
                        key={group.dateKey}
                        ref={(el) => {
                          dayCardRefs.current[group.dateKey] = el;
                        }}
                        style={{
                          flex: isMobile ? "0 0 calc(100vw - 36px)" : "0 0 auto",
                          width: isMobile ? "calc(100vw - 36px)" : "100%",
                          scrollSnapAlign: isMobile ? "center" : undefined,
                          scrollSnapStop: isMobile ? "always" : undefined,
                          background: "#ffffff",
                          borderRadius: "16px",
                          border: hasSolemnity ? "1.5px solid #D97706" : `1px solid ${theme.colors.border}`,
                          boxShadow: hasSolemnity ? "0 6px 18px rgba(217, 119, 6, 0.14)" : theme.colors.shadowBase,
                          overflow: "hidden",
                          display: "flex",
                          flexDirection: "column",
                          boxSizing: "border-box",
                        }}
                      >
                        {/* CABEÇALHO DO DIA (com o nome da missa apenas no topo) */}
                        <div
                          style={{
                            background: hasSolemnity
                              ? "linear-gradient(135deg, #B45309 0%, #D97706 100%)"
                              : "linear-gradient(135deg, #4A3222 0%, #5A3E2B 100%)",
                            color: "#FDFBF7",
                            padding: "12px 14px",
                            display: "flex",
                            alignItems: "flex-start",
                            justifyContent: "space-between",
                            gap: "10px",
                          }}
                        >
                          <div style={{ display: "flex", alignItems: "center", gap: "12px", flex: 1, minWidth: 0 }}>
                            <div
                              style={{
                                background: "rgba(255,255,255,0.16)",
                                border: "1px solid rgba(230, 199, 134, 0.45)",
                                borderRadius: "12px",
                                padding: "8px 13px",
                                minWidth: "56px",
                                textAlign: "center",
                                lineHeight: 1.05,
                                flexShrink: 0,
                              }}
                            >
                              <div style={{ fontSize: "1.45rem", fontWeight: 900, color: "#E6C786" }}>{dayNum}</div>
                              <div style={{ fontSize: "0.72rem", fontWeight: 800, letterSpacing: "0.06em", marginTop: "2px" }}>{monthShort}</div>
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontWeight: 800, fontSize: "0.98rem", lineHeight: 1.25, wordBreak: "break-word" }}>
                                {groupTitle}
                              </div>
                              <div style={{ fontSize: "0.75rem", opacity: 0.9, textTransform: "capitalize", marginTop: "3px" }}>
                                {weekdayLabel} • {group.masses.length} missas neste dia
                              </div>
                            </div>
                          </div>
                          {isMobile && (
                            <span style={{ fontSize: "0.68rem", fontWeight: 700, opacity: 0.85, background: "rgba(0,0,0,0.2)", padding: "3px 8px", borderRadius: "10px", flexShrink: 0 }}>
                              {groupIdx + 1}/{groupedMassesByDay.length}
                            </span>
                          )}
                        </div>

                        {/* MISSAS DESTE DIA */}
                        <div style={{ display: "flex", flexDirection: "column" }}>
                          {group.masses.map((mass, mIdx) => {
                            const totalConfirmados = mass.signups ? mass.signups.filter((s: any) => s.status !== "RESERVA").length : 0;
                            const vagasRestantes = mass.maxServers - totalConfirmados;
                            const meuSignup = mass.signups.find((s) => s.userId === user.id);
                            const jaEstouInscrita = !!meuSignup;
                            const souReserva = (meuSignup as any)?.status === "RESERVA";
                            const minhaFuncao = formatRole(meuSignup?.role, user.name, user.id);

                            const estaAberto = mass.open;
                            const prazoEncerrado = checkStatus(mass.date, mass.deadline);
                            const lotado = vagasRestantes <= 0;
                            const mostrarFuncao = jaEstouInscrita;
                            const botaoDesabilitado = prazoEncerrado || !estaAberto;
                            const isInativa = prazoEncerrado;

                            const myUnavForDay = myUnavailabilities.find((u) => u.date === group.dateKey);
                            const isBlockedByUnav = !jaEstouInscrita && Boolean(myUnavForDay);
                            const isBlockedBySuspension = !jaEstouInscrita && isSuspendedForDate(group.dateKey);
                            const botaoDesabilitadoFinal = botaoDesabilitado || isBlockedByUnav || isBlockedBySuspension;

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
                            } else if (isBlockedBySuspension && mySuspension) {
                              const shortUntil = new Date(mySuspension.until + "T12:00:00").toLocaleDateString("pt-BR");
                              btnClass = "btn-disabled";
                              btnText = `🚫 SUSPENSO ATÉ ${shortUntil}`;
                            } else if (isBlockedByUnav) {
                              btnClass = "btn-disabled";
                              btnText = `AUSENTE: ${myUnavForDay?.reason || "Indisponível"}`;
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

                            const pts = mass.points !== undefined && mass.points !== null ? mass.points : getMassPoints(mass.date);
                            const timeLabel = new Date(mass.date).toLocaleTimeString("pt-BR", {
                              timeZone: "America/Sao_Paulo",
                              hour: "2-digit",
                              minute: "2-digit",
                            });

                            return (
                              <div
                                key={mass.id}
                                style={{
                                  padding: "13px 14px",
                                  borderTop: mIdx > 0 ? `2px dashed ${theme.colors.borderLight}` : "none",
                                  background: isInativa ? "#FAF8F5" : "#ffffff",
                                  opacity: isInativa ? 0.85 : 1,
                                  display: "flex",
                                  flexDirection: "column",
                                  gap: "8px",
                                }}
                              >
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "10px" }}>
                                  <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap", marginBottom: "4px" }}>
                                      <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", fontWeight: 800, fontSize: "0.98rem", color: theme.colors.primary }}>
                                        <Clock size={15} /> {timeLabel}
                                      </span>
                                      <span
                                        style={{
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
                                      {mass.isSolemnity && (
                                        <span style={{ fontSize: "0.66rem", fontWeight: 800, padding: "2px 7px", borderRadius: "6px", background: "#FEF3C7", color: "#B45309" }}>
                                          Solenidade
                                        </span>
                                      )}
                                    </div>
                                    {mass.local && (
                                      <div style={{ fontSize: "0.82rem", color: theme.colors.textSecondary, fontWeight: 700 }}>
                                        📍 {mass.local}
                                      </div>
                                    )}
                                  </div>

                                  {mass.deadline && !prazoEncerrado && estaAberto && (
                                    <div style={{ flexShrink: 0 }}>
                                      <CountdownTimer deadline={mass.deadline} />
                                    </div>
                                  )}
                                </div>

                                {mostrarFuncao && (
                                  <div className={`role-pill ${souReserva ? "reserva" : (!mass.published ? "pendente" : "")}`}>
                                    {souReserva ? (
                                      <>
                                        <Hourglass size={14} />
                                        Fila de Espera
                                      </>
                                    ) : mass.published ? (
                                      <>
                                        <User size={14} />
                                        Função: {minhaFuncao}
                                      </>
                                    ) : (
                                      <>
                                        <Clock size={14} />
                                        Aguardando publicação
                                      </>
                                    )}
                                  </div>
                                )}

                                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "10px", flexWrap: "wrap" }}>
                                  <div className="vagas-text" style={{ margin: 0 }}>
                                    <User size={16} strokeWidth={2.5} color={theme.colors.textMain} />
                                    <strong>{totalConfirmados}</strong> <span>/ {mass.maxServers} vagas</span>
                                  </div>
                                </div>

                                <button
                                  className={btnClass}
                                  onClick={() => onToggleSignup(mass.id)}
                                  disabled={botaoDesabilitadoFinal}
                                  style={
                                    mass.isSolemnity && btnClass === "btn-servir"
                                      ? {
                                        background: "linear-gradient(135deg, #B45309 0%, #D97706 100%)",
                                        color: "#FFFFFF",
                                        boxShadow: "0 4px 12px rgba(217, 119, 6, 0.35)",
                                        border: "1px solid #F59E0B",
                                      }
                                      : (isBlockedByUnav || isBlockedBySuspension)
                                        ? { whiteSpace: "normal", lineHeight: 1.25 }
                                        : undefined
                                  }
                                >
                                  {btnText}
                                </button>

                                {jaEstouInscrita && !souReserva && meuSignup?.present && (
                                  <div
                                    style={{
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

                                {renderTeamPhotoSection(mass, jaEstouInscrita, souReserva)}

                                {jaEstouInscrita && !souReserva && !prazoEncerrado && (() => {
                                  const mySignup = mass.signups.find(s => s.userId === user.id);
                                  const hasOpenRequest = swapRequests.some(sr => sr.signupId === mySignup?.id);
                                  return (
                                    <div style={{ display: "flex", gap: "8px" }}>
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
                                })()}
                              </div>
                            );
                          })}
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

      {/* MODAL: ESCOLHER CÂMERA OU GALERIA PARA ENVIAR A FOTO */}
      {photoSourcePickerMass && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.65)",
            zIndex: 10020,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "16px",
            backdropFilter: "blur(3px)",
          }}
          onClick={() => setPhotoSourcePickerMass(null)}
        >
          <div
            style={{
              background: "#FAF8F5",
              width: "100%",
              maxWidth: "360px",
              borderRadius: "16px",
              border: `1px solid ${theme.colors.border}`,
              boxShadow: "0 20px 50px rgba(0,0,0,0.35)",
              overflow: "hidden",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                background: theme.colors.primaryGradient,
                color: "#fff",
                padding: "14px 16px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div style={{ fontWeight: 800, fontSize: "0.95rem", display: "flex", alignItems: "center", gap: "7px" }}>
                <Camera size={18} />
                <span>Enviar Foto da Equipe</span>
              </div>
              <button
                type="button"
                onClick={() => setPhotoSourcePickerMass(null)}
                style={{
                  background: "rgba(255,255,255,0.22)",
                  border: "none",
                  borderRadius: "50%",
                  width: 28,
                  height: 28,
                  color: "#fff",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <X size={15} />
              </button>
            </div>

            <div style={{ padding: "16px", display: "flex", flexDirection: "column", gap: "10px" }}>
              <div style={{ fontSize: "0.82rem", color: "#5A4332", fontWeight: 600, textAlign: "center", marginBottom: "2px" }}>
                Como você deseja enviar a foto desta missa?
              </div>

              <label
                style={{
                  padding: "13px 14px",
                  borderRadius: "10px",
                  background: "linear-gradient(135deg, #166534 0%, #15803D 100%)",
                  color: "#FFFFFF",
                  fontWeight: 800,
                  fontSize: "0.88rem",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  boxShadow: "0 4px 12px rgba(22, 101, 52, 0.25)",
                  margin: 0,
                }}
              >
                <span>📷 Abrir Câmera (Tirar Foto Agora)</span>
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={(e) => {
                    const mId = photoSourcePickerMass.id;
                    setPhotoSourcePickerMass(null);
                    handleUploadTeamPhoto(mId, e);
                  }}
                  style={{ display: "none" }}
                />
              </label>

              <label
                style={{
                  padding: "13px 14px",
                  borderRadius: "10px",
                  background: "#FFFFFF",
                  border: `1.5px solid ${theme.colors.primary}`,
                  color: theme.colors.primary,
                  fontWeight: 800,
                  fontSize: "0.88rem",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  margin: 0,
                }}
              >
                <span>🖼️ Escolher Foto da Galeria</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const mId = photoSourcePickerMass.id;
                    setPhotoSourcePickerMass(null);
                    handleUploadTeamPhoto(mId, e);
                  }}
                  style={{ display: "none" }}
                />
              </label>

              <button
                type="button"
                onClick={() => setPhotoSourcePickerMass(null)}
                style={{
                  marginTop: "2px",
                  padding: "9px",
                  borderRadius: "8px",
                  border: "none",
                  background: "#EFECE6",
                  color: "#5A4332",
                  fontWeight: 700,
                  fontSize: "0.8rem",
                  cursor: "pointer",
                }}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE VISUALIZAÇÃO DA FOTO DA EQUIPE */}
      {viewingPhotoMass && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.75)",
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "16px",
            backdropFilter: "blur(3px)",
          }}
          onClick={() => setViewingPhotoMass(null)}
        >
          <div
            style={{
              background: "#FAF8F5",
              width: "100%",
              maxWidth: "460px",
              maxHeight: "88vh",
              borderRadius: "16px",
              overflowY: "auto",
              border: `1px solid ${theme.colors.border}`,
              boxShadow: "0 20px 50px rgba(0,0,0,0.4)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                background: theme.colors.primaryGradient,
                color: "#fff",
                padding: "14px 16px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div>
                <div style={{ fontWeight: 800, fontSize: "0.96rem", display: "flex", alignItems: "center", gap: "6px" }}>
                  <Camera size={17} />
                  <span>Foto da Equipe na Missa</span>
                </div>
                <div style={{ fontSize: "0.74rem", opacity: 0.9 }}>
                  {new Date(viewingPhotoMass.mass.date).toLocaleDateString("pt-BR", {
                    timeZone: "America/Sao_Paulo",
                    day: "2-digit",
                    month: "2-digit",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                  {viewingPhotoMass.mass.local ? ` • ${viewingPhotoMass.mass.local}` : ""}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setViewingPhotoMass(null)}
                style={{
                  background: "rgba(255,255,255,0.22)",
                  border: "none",
                  borderRadius: "50%",
                  width: 30,
                  height: 30,
                  color: "#fff",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <X size={16} />
              </button>
            </div>

            <div style={{ padding: "14px", textAlign: "center" }}>
              {viewingPhotoMass.loading ? (
                <div style={{ padding: "40px 10px", color: theme.colors.textSecondary }}>
                  <Loader2 size={28} className="animate-spin" style={{ margin: "0 auto 10px" }} />
                  <div style={{ fontSize: "0.85rem", fontWeight: 600 }}>Carregando foto da equipe...</div>
                </div>
              ) : viewingPhotoMass.photo ? (
                <div>
                  <img
                    src={viewingPhotoMass.photo.imageDataUrl}
                    alt="Foto da Equipe"
                    style={{
                      width: "100%",
                      maxHeight: "62vh",
                      objectFit: "contain",
                      borderRadius: "12px",
                      border: `1px solid ${theme.colors.border}`,
                      background: "#111",
                    }}
                  />
                  <div style={{ marginTop: "10px", fontSize: "0.78rem", color: "#5A4332", fontWeight: 600 }}>
                    Enviada por{" "}
                    <strong>
                      {viewingPhotoMass.photo.uploadedByName.endsWith("(salva offline)")
                        ? viewingPhotoMass.photo.uploadedByName
                        : formatServoName(viewingPhotoMass.photo.uploadedByName, viewingPhotoMass.photo.uploadedById)}
                    </strong>{" "}
                    em{" "}
                    {new Date(viewingPhotoMass.photo.uploadedAt).toLocaleString("pt-BR", {
                      timeZone: "America/Sao_Paulo",
                      day: "2-digit",
                      month: "2-digit",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                  <div style={{ marginTop: "4px", fontSize: "0.7rem", color: "#8C7360" }}>
                    As fotos são eliminadas automaticamente após 7 dias.
                  </div>
                  {(viewingPhotoMass.photo.uploadedById === user.id || user.role === "ADMIN") && (
                    <div style={{ marginTop: "12px", display: "flex", justifyContent: "center" }}>
                      <button
                        type="button"
                        onClick={() =>
                          downloadMassPhotoFile(
                            viewingPhotoMass.photo!.imageDataUrl,
                            viewingPhotoMass.mass.date
                          )
                        }
                        style={{
                          padding: "8px 16px",
                          borderRadius: "8px",
                          border: "none",
                          background: theme.colors.primary,
                          color: "#FFFFFF",
                          fontSize: "0.82rem",
                          fontWeight: 700,
                          cursor: "pointer",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "6px",
                          boxShadow: "0 2px 8px rgba(74, 50, 34, 0.2)",
                        }}
                      >
                        <Download size={15} />
                        <span>Baixar Foto</span>
                      </button>
                    </div>
                  )}
                </div>
              ) : null}
            </div>
          </div>
        </div>
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