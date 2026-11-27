import { useState, useEffect, useMemo, lazy, Suspense } from "react";
import {
  Shield,
  FileText,
  Edit,
  PlusCircle,
  X,
  Trash2,
  Lock,
  LockOpen,
  Trophy,
  BarChart2,
  ArrowUpCircle,
  RefreshCw,
  Save,
  Filter,
  Camera,
  Loader2,
  Check,
  Megaphone,
  Calendar,
  Users,
  ClipboardList,
  Search,
  LogOut,
  Clock,
  MapPin,
  UserPlus,
  UserX,
  UserCheck,
  LayoutGrid,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Ban,
  Cake,
  MessageCircle,
  Download,
  Gift
} from "lucide-react";
import { Mass, MassPhotoData, User, Signup } from "../types/types";
import { formatRole, setGlobalUserGenders, getUserGender } from "../constants/roles";
import { useSignup } from "../hooks/useSignup";
import { getRoleWeight, setGlobalShortNames, formatServoName, registerUsersFromMasses } from "../utils/format.utils";
import { getMassPoints } from "../utils/ranking.utils";
import { toLocalDate, toLocalDateTime } from "../utils/date.utils";
import { APP_CONFIG } from "../constants/config";
import { getUsersList, getNotices } from "../services/api/notice.service";
import {
  createMass,
  deleteMass,
  togglePublish,
  toggleOpen,
  patchMass,
  uploadScheduleImage,
  getMassPhoto,
  uploadMassPhoto,
  deleteMassPhoto,
  confirmAllMassPresence,
  compressMassPhotoFile,
  downloadMassPhotoFile,
} from "../services/api/mass.service";
import {
  getServasList,
  createServa,
  updateServa,
  deleteServa,
  getUserMetadata,
  setUserSuspension,
  removeUserSuspension,
  ServaData,
  UnavailabilityItem,
  ScaleSuspension
} from "../services/api/user.service";
import {
  AdminPrizeOverview,
  getAdminPrizeOverview,
  setPrizeDelivered,
} from "../services/api/prize.service";
import {
  autoAssign,
  getConsecutiveRoleStreak,
  getLastConsecutiveRole,
} from "../utils/autoAssign";
import { NoticeBoard } from "./NoticeBoard";
import { theme } from "../theme/theme";
import "./css/AdminPanel.css";

const ScaleModal = lazy(() => import("./ScaleModal").then((m) => ({ default: m.ScaleModal })));
const OfficialDocument = lazy(() => import("./OfficialDocument").then((m) => ({ default: m.OfficialDocument })));
const StatisticsModal = lazy(() => import("./StatisticsModal").then((m) => ({ default: m.StatisticsModal })));
const RankingModal = lazy(() => import("./RankingModal").then((m) => ({ default: m.RankingModal })));
const LoginLogs = lazy(() => import("./LoginLogs").then((m) => ({ default: m.LoginLogs })));
const ReminderModal = lazy(() => import("./ReminderModal").then((m) => ({ default: m.ReminderModal })));
const PrizeManagerModal = lazy(() => import("./PrizeManagerModal").then((m) => ({ default: m.PrizeManagerModal })));

// ── MassForm extracted OUTSIDE AdminPanel to prevent unmount on every keystroke ──
interface MassFormProps {
  isInline?: boolean;
  mass?: Mass;
  allMasses?: Mass[];
  localSignups?: Signup[];
  setLocalSignups?: React.Dispatch<React.SetStateAction<Signup[]>>;
  unavailabilitiesMap?: Record<string, UnavailabilityItem[]>;
  onRoleStreakWarning?: (alert: { servaName: string; roleLabel: string; count: number; dates: string[]; isPreventive?: boolean }) => void;
  newName: string; setNewName: (v: string) => void;
  newLocal: string; setNewLocal: (v: string) => void;
  newDate: string; setNewDate: (v: string) => void;
  newTime: string; setNewTime: (v: string) => void;
  newDeadline: string; setNewDeadline: (v: string) => void;
  newMax: number; setNewMax: (v: number) => void;
  newIsSolemnity: boolean; setNewIsSolemnity: (v: boolean) => void;
  newPoints: string; setNewPoints: (v: string) => void;
  repeatWeekly: boolean; setRepeatWeekly: (v: boolean) => void;
  repeatUntil: string; setRepeatUntil: (v: string) => void;
  handleSubmit: (e: React.FormEvent) => void;
  handleCancelEdit: (e?: any) => void;
}

function MassForm({
  isInline = false,
  mass,
  allMasses,
  localSignups,
  setLocalSignups,
  unavailabilitiesMap = {},
  onRoleStreakWarning,
  newName, setNewName,
  newLocal, setNewLocal,
  newDate, setNewDate,
  newTime, setNewTime,
  newDeadline, setNewDeadline,
  newMax, setNewMax,
  newIsSolemnity, setNewIsSolemnity,
  newPoints, setNewPoints,
  repeatWeekly, setRepeatWeekly,
  repeatUntil, setRepeatUntil,
  handleSubmit,
  handleCancelEdit,
}: MassFormProps) {
  const pointsPreview = newDate ? getMassPoints(newDate + (newTime ? `T${newTime}` : "")) : 1;

  return (
    <form onSubmit={handleSubmit} className="form-grid" style={isInline ? { padding: "4px 0" } : {}}>
      <div className="form-group full-width">
        <label>Nome / Celebração (Opcional)</label>
        <input className="form-input" type="text" value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Ex: Missa da Família, Solenidade..." />
      </div>
      <div className="form-group full-width">
        <label>Local</label>
        <input
          className="form-input"
          list="locais-list"
          value={newLocal}
          onChange={(e) => setNewLocal(e.target.value)}
          placeholder="Selecione ou digite o local"
        />
        <datalist id="locais-list">
          <option value="SANTUARIO" />
          <option value="SANTA TEREZINHA" />
          <option value="SAO FRANCISCO" />
          <option value="AGUA SANTA" />
        </datalist>
      </div>
      <div className="form-group">
        <label>Data *</label>
        <input className="form-input" type="date" value={newDate} onChange={(e) => setNewDate(e.target.value)} required />
      </div>
      <div className="form-group">
        <label>Hora *</label>
        <input className="form-input" type="time" value={newTime} onChange={(e) => setNewTime(e.target.value)} required />
      </div>
      <div className="form-group full-width">
        <label style={{ color: theme.colors.dangerDark }}>Prazo Limite de Inscrição (Opcional)</label>
        <input className="form-input" type="datetime-local" value={newDeadline} onChange={(e) => setNewDeadline(e.target.value)} />
      </div>
      <div className="form-group">
        <label>Vagas</label>
        <input className="form-input" type="number" value={newMax} onChange={(e) => setNewMax(Number(e.target.value))} min="1" />
      </div>
      <div className="form-group">
        <label>Pontos (Override)</label>
        <input
          className="form-input"
          type="number"
          value={newPoints}
          onChange={(e) => setNewPoints(e.target.value)}
          min="1"
          placeholder={`Padrão (${pointsPreview} ${pointsPreview === 1 ? "pt" : "pts"})`}
        />
      </div>
      <div className="form-group full-width">
        <label style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer", fontWeight: "bold", color: theme.colors.primary, background: "#F7F5F0", padding: "10px 12px", borderRadius: "8px", border: `1px solid ${theme.colors.border}` }}>
          <input type="checkbox" checked={newIsSolemnity} onChange={(e) => setNewIsSolemnity(e.target.checked)} style={{ width: "18px", height: "18px", cursor: "pointer" }} />
          👑 Marcar como Solenidade (Destaque dourado na escala)
        </label>
      </div>

      {isInline && mass && allMasses && localSignups && setLocalSignups && (
        <div className="form-group full-width" style={{ marginTop: "6px", padding: "14px", background: "#F7F5F0", borderRadius: "10px", border: `1px solid ${theme.colors.border}` }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "8px", marginBottom: "10px" }}>
            <h4 style={{ margin: 0, color: theme.colors.primary, fontSize: "0.9rem" }}>Distribuição da Escala</h4>
            <button
              type="button"
              onClick={() => {
                const targetDateStr = newDate || new Date(mass.date).toISOString().split("T")[0];
                const unavailableIds = Object.entries(unavailabilitiesMap)
                  .filter(([, list]) => list.some((u) => u.date === targetDateStr))
                  .map(([uid]) => uid);
                const newSignups = autoAssign({ ...mass, maxServers: newMax, isSolemnity: newIsSolemnity, signups: localSignups }, allMasses, unavailableIds);
                setLocalSignups(newSignups);
              }}
              style={{ background: theme.colors.primary, color: "#fff", border: "none", padding: "8px 12px", borderRadius: "8px", cursor: "pointer", fontWeight: "bold", fontSize: "0.75rem", display: "flex", gap: "6px", alignItems: "center" }}
            >
              <RefreshCw size={14} /> SORTEAR ESCALA AUTOMÁTICA
            </button>
          </div>

          {localSignups.length === 0 ? (
            <p style={{ fontSize: "0.82rem", color: "#666", margin: 0 }}>Nenhuma inscrição para esta missa.</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "6px", maxHeight: "240px", overflowY: "auto" }}>
              {localSignups.map((s: Signup) => {
                const targetDateStr = newDate || new Date(mass.date).toISOString().split("T")[0];
                const unavItem = (unavailabilitiesMap[s.userId] || []).find((u) => u.date === targetDateStr);
                const inlineStreak =
                  s.status !== "RESERVA" && s.role
                    ? getConsecutiveRoleStreak(s.userId, mass.id, mass.date, s.role, allMasses)
                    : null;
                return (
                  <div
                    key={s.id}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      gap: "8px",
                      padding: "8px 10px",
                      background: unavItem || (inlineStreak && inlineStreak.count >= 3) ? "#FFFBEB" : "#fff",
                      borderRadius: "8px",
                      border: `1px solid ${unavItem || (inlineStreak && inlineStreak.count >= 3) ? "#F59E0B" : "#E5DEC9"}`,
                    }}
                  >
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ fontSize: "0.84rem", fontWeight: 700, color: "#23170F" }}>
                        {formatServoName(s.user?.name, s.userId) || "Desconhecido"}
                      </div>
                      <div style={{ fontSize: "0.7rem", fontWeight: 700, color: s.status === "CONFIRMADO" ? "#2E7D32" : "#D97706" }}>
                        {s.status}
                        {unavItem && ` • ⚠️ Indisponível (${unavItem.reason || "Ausência"})`}
                      </div>
                      {inlineStreak && inlineStreak.count >= 3 && (
                        <div style={{ fontSize: "0.68rem", fontWeight: 800, color: "#B45309", marginTop: "2px" }}>
                          ⚠️ {inlineStreak.count}ª escala seguida como {formatRole(s.role, s.user?.name, s.userId)} ({inlineStreak.massDates.join(", ")})
                        </div>
                      )}
                    </div>
                    <select
                      value={s.role || ""}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (setLocalSignups) {
                          setLocalSignups((prev: Signup[]) => prev.map((item: Signup) => item.id === s.id ? { ...item, role: val || null } : item));
                        }
                        if (val && s.status !== "RESERVA") {
                          const streak = getConsecutiveRoleStreak(s.userId, mass.id, mass.date, val, allMasses);
                          if (streak.count >= 3 && onRoleStreakWarning) {
                            onRoleStreakWarning({
                              servaName: formatServoName(s.user?.name, s.userId) || "Servo(a)",
                              roleLabel: formatRole(val, s.user?.name, s.userId),
                              count: streak.count,
                              dates: streak.massDates,
                            });
                          }
                        }
                      }}
                      className="role-select"
                    >
                      <option value="">Nenhuma</option>
                      <option value="Auxiliar">Auxiliar</option>
                      <option value="Cerimoniária">{formatRole("Cerimoniária", s.user?.name, s.userId)}</option>
                      <option value="Librífera">{formatRole("Librífera", s.user?.name, s.userId)}</option>
                      {(getUserGender(s.userId, s.user?.name) === "M" || s.role === "Turiferário") && (
                        <option value="Turiferário">Turiferário</option>
                      )}
                      <option value="Naveteiro">{formatRole("Naveteiro", s.user?.name, s.userId)}</option>
                      <option value="Lava-pés">Lava-pés</option>
                      <option value="Leituras">Leituras</option>
                      <option value="Matraca">Matraca</option>
                    </select>
                  </div>
                );
              })}
            </div>
          )}
          <p style={{ fontSize: "0.72rem", color: "#888", margin: "8px 0 0 0", fontStyle: "italic" }}>
            Clique em "SALVAR ALTERAÇÕES" abaixo para confirmar a distribuição.
          </p>
        </div>
      )}

      {/* OPÇÃO DE RECORRÊNCIA — visível apenas na criação */}
      {!isInline && (
        <div className="form-group full-width" style={{ borderTop: `1px dashed ${theme.colors.border}`, paddingTop: "10px", marginTop: "2px" }}>
          <label style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer", color: theme.colors.primary, fontWeight: "bold", fontSize: "0.88rem" }}>
            <input
              type="checkbox"
              checked={repeatWeekly}
              onChange={(e) => {
                setRepeatWeekly(e.target.checked);
                if (!e.target.checked) setRepeatUntil("");
              }}
              style={{ width: "18px", height: "18px", cursor: "pointer" }}
            />
            🔁 Repetir toda semana automaticamente
          </label>
          {repeatWeekly && (
            <div style={{ marginTop: "8px", display: "flex", flexDirection: "column", gap: "4px" }}>
              <label style={{ fontSize: "0.8rem", color: "#555", fontWeight: "bold" }}>Repetir até (data final):</label>
              <input
                className="form-input"
                type="date"
                value={repeatUntil}
                min={newDate || undefined}
                onChange={(e) => setRepeatUntil(e.target.value)}
                required
              />
            </div>
          )}
        </div>
      )}

      <div style={{ display: "flex", gap: "8px", marginTop: "8px", gridColumn: "1 / -1" }}>
        <button type="submit" className="btn-create" style={{ background: isInline ? theme.colors.warning : theme.colors.primary, flex: 1 }}>
          {isInline ? "SALVAR ALTERAÇÕES" : (repeatWeekly ? "CRIAR MISSAS RECORRENTES" : "CRIAR MISSA")}
        </button>
        <button
          type="button"
          onClick={handleCancelEdit}
          style={{ padding: "10px 16px", background: "#EFECE6", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "bold", color: theme.colors.textMain }}
        >
          CANCELAR
        </button>
      </div>
    </form>
  );
}

interface AdminPanelProps {
  masses: Mass[];
  user: User;
  onUpdate: () => void;
  onLogout: () => void;
}

export function AdminPanel({ masses, user, onUpdate, onLogout }: AdminPanelProps) {
  const isAdmin = user.role === "ADMIN";

  // AI States
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiExtractedMasses, setAiExtractedMasses] = useState<any[]>([]);
  const [showAiPreview, setShowAiPreview] = useState(false);

  const {
    changeRole,
    toggleSignup,
    togglePresence,
    promoteSignup,
    removeSignup,
    swapSignup,
  } = useSignup(onUpdate);

  // Form states (shared between Create and Edit)
  const [newDate, setNewDate] = useState("");
  const [newTime, setNewTime] = useState("");
  const [newName, setNewName] = useState("");
  const [newLocal, setNewLocal] = useState("");
  const [newMax, setNewMax] = useState<number>(APP_CONFIG.DEFAULT_MAX_SERVERS);
  const [newIsSolemnity, setNewIsSolemnity] = useState(false);
  const [newPoints, setNewPoints] = useState<string>("");
  const [newDeadline, setNewDeadline] = useState("");
  const [repeatWeekly, setRepeatWeekly] = useState(false);
  const [repeatUntil, setRepeatUntil] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [localSignups, setLocalSignups] = useState<Signup[]>([]);
  const [viewMode, setViewMode] = useState<"dashboard" | "pdf">("dashboard");

  // Modais e Acordeões Mobile-First
  const [showTextModal, setShowTextModal] = useState(false);
  const [showRankingModal, setShowRankingModal] = useState(false);
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [showReminderModal, setShowReminderModal] = useState(false);
  const [photoModalMassId, setPhotoModalMassId] = useState<string | null>(null);
  const [photoModalData, setPhotoModalData] = useState<MassPhotoData | null>(null);
  const [photoModalLoading, setPhotoModalLoading] = useState(false);
  const [photoActionLoading, setPhotoActionLoading] = useState(false);
  const [onlyWithPhotos, setOnlyWithPhotos] = useState(false);
  const [roleStreakAlert, setRoleStreakAlert] = useState<{
    servaName: string;
    roleLabel: string;
    count: number;
    dates: string[];
    isPreventive?: boolean;
  } | null>(null);
  const [showFilterSection, setShowFilterSection] = useState(false);
  const [expandedAddMassId, setExpandedAddMassId] = useState<string | null>(null);
  const [addSearchTerm, setAddSearchTerm] = useState("");
  const [unavailabilitiesMap, setUnavailabilitiesMap] = useState<Record<string, UnavailabilityItem[]>>({});

  // Form visibility
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showToolsModal, setShowToolsModal] = useState(false);
  const [showNoticeSection, setShowNoticeSection] = useState(false);
  const [selectedDayMassId, setSelectedDayMassId] = useState<Record<string, string>>({});

  // ── SISTEMA DE ABAS (Menu Inferior Original: Escalas | Servos | Acessos) ──
  const [activeTab, setActiveTab] = useState<"escalas" | "servas" | "logs">("escalas");

  // ── CRUD DE SERVOS ──
  const [servasList, setServasList] = useState<ServaData[]>([]);
  const [servaSearch, setServaSearch] = useState("");
  const [servaFilter, setServaFilter] = useState<"ALL" | "ACTIVE" | "SUSPENDED" | "FORMACAO" | "INATIVO" | "M" | "F">("ALL");
  const [servaSortByDays, setServaSortByDays] = useState(false);
  const [unavModalServa, setUnavModalServa] = useState<{ name: string; items: UnavailabilityItem[] } | null>(null);
  const [showAllUnavModal, setShowAllUnavModal] = useState(false);
  const [dismissedUnavBanner, setDismissedUnavBanner] = useState(false);
  const [suspensionsMap, setSuspensionsMap] = useState<Record<string, ScaleSuspension>>({});
  const [dismissedAbsenceBanner, setDismissedAbsenceBanner] = useState(false);
  const [todayBirthdayPeople, setTodayBirthdayPeople] = useState<{ id: string; name: string; fullName?: string; age?: number | null }[]>([]);
  const [dismissedBirthdayBanner, setDismissedBirthdayBanner] = useState(false);
  const [prizeOverview, setPrizeOverview] = useState<AdminPrizeOverview | null>(null);
  const [showPrizeModal, setShowPrizeModal] = useState(false);
  const [dismissedPrizeBanner, setDismissedPrizeBanner] = useState(false);
  const [showMonthlyAbsencesModal, setShowMonthlyAbsencesModal] = useState(false);
  const [suspensionModalServa, setSuspensionModalServa] = useState<{
    id: string;
    name: string;
    absencesCount?: number;
    current?: ScaleSuspension | null;
  } | null>(null);
  const [suspensionFrom, setSuspensionFrom] = useState("");
  const [suspensionUntil, setSuspensionUntil] = useState("");
  const [suspensionReason, setSuspensionReason] = useState("");
  const [suspensionLoading, setSuspensionLoading] = useState(false);
  const [showServaModal, setShowServaModal] = useState(false);
  const [editingServa, setEditingServa] = useState<ServaData | null>(null);
  const [servaForm, setServaForm] = useState<{ name: string; email: string; password: string; birthDate: string; role: string; gender: "M" | "F" | "" }>({
    name: "",
    email: "",
    password: "",
    birthDate: "",
    role: "USER",
    gender: "",
  });
  const [servaLoading, setServaLoading] = useState(false);
  const [servaError, setServaError] = useState("");

  // Filtros de Datas
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // ESTADO PARA TROCA (SWAP)
  const [allUsers, setAllUsers] = useState<{ id: string; name: string }[]>([]);
  const [swappingSignupId, setSwappingSignupId] = useState<string | null>(null);
  const [selectedReplacementId, setSelectedReplacementId] = useState("");

  // ESTADO PARA ADICIONAR SERVO
  const [selectedUserToAdd, setSelectedUserToAdd] = useState<Record<string, string[]>>({});
  const [, setShortNamesRev] = useState(0);
  registerUsersFromMasses(masses, allUsers);

  // Carrega lista de usuários e metadados para o Admin
  useEffect(() => {
    getUserMetadata()
      .then((meta) => {
        if (meta?.genders) setGlobalUserGenders(meta.genders);
        if (meta?.shortNames) {
          setGlobalShortNames(meta.shortNames, meta.shortNamesByFull);
          setShortNamesRev((v) => v + 1);
        }
        if (meta?.unavailabilities) setUnavailabilitiesMap(meta.unavailabilities);
        if (meta?.suspensions) setSuspensionsMap(meta.suspensions);
      })
      .catch(() => { });

    if (isAdmin) {
      getUsersList()
        .then((users) => setAllUsers(users))
        .catch(console.error);
      getNotices()
        .then((list) => {
          const bday = list.find((n) => n.id === "birthday-notice-auto" || n.isBirthday);
          setTodayBirthdayPeople(bday?.birthdayPeople || []);
        })
        .catch(() => { });
      getAdminPrizeOverview()
        .then((overview) => setPrizeOverview(overview))
        .catch(() => { });
    }
  }, [isAdmin]);

  const loadServas = async () => {
    try {
      setServaLoading(true);
      const [list, meta] = await Promise.all([getServasList(), getUserMetadata()]);
      if (meta?.genders) setGlobalUserGenders(meta.genders);
      if (meta?.shortNames) setGlobalShortNames(meta.shortNames, meta.shortNamesByFull);
      if (meta?.unavailabilities) setUnavailabilitiesMap(meta.unavailabilities);
      if (meta?.suspensions) setSuspensionsMap(meta.suspensions);
      setServasList(list.filter(s => s.role !== "ADMIN"));
    } catch (err) {
      console.error("Erro ao carregar servos:", err);
    } finally {
      setServaLoading(false);
    }
  };

  function getTodayBrDateStr(): string {
    return new Date().toLocaleDateString("en-CA", { timeZone: "America/Sao_Paulo" });
  }

  function addDaysToDateStr(baseYmd: string, days: number): string {
    const d = new Date(baseYmd + "T12:00:00");
    d.setDate(d.getDate() + days);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  }

  function handleOpenSuspensionModal(
    servaId: string,
    servaName: string,
    presetReason?: string,
    absencesCount?: number
  ) {
    const todayBr = getTodayBrDateStr();
    const current = suspensionsMap[servaId] && suspensionsMap[servaId].until >= todayBr ? suspensionsMap[servaId] : null;
    setSuspensionFrom(current?.from || todayBr);
    setSuspensionUntil(current?.until || addDaysToDateStr(todayBr, 15));
    setSuspensionReason(current?.reason || presetReason || "");
    setSuspensionModalServa({ id: servaId, name: servaName, absencesCount, current });
  }

  async function handleSaveSuspension(e: React.FormEvent) {
    e.preventDefault();
    if (!suspensionModalServa) return;
    if (!suspensionFrom || !suspensionUntil || suspensionUntil < suspensionFrom) {
      alert("A data final deve ser igual ou posterior à data inicial.");
      return;
    }

    try {
      setSuspensionLoading(true);
      const saved = await setUserSuspension(suspensionModalServa.id, {
        from: suspensionFrom,
        until: suspensionUntil,
        reason: suspensionReason.trim() || undefined,
      });
      setSuspensionsMap((prev) => ({ ...prev, [suspensionModalServa.id]: saved }));
      setSuspensionModalServa(null);
      if (activeTab === "servas") {
        await loadServas();
      }
    } catch (err: any) {
      alert(err?.response?.data?.error || "Erro ao registrar suspensão.");
    } finally {
      setSuspensionLoading(false);
    }
  }

  async function handleRemoveSuspension(servaId: string) {
    if (!confirm("Remover a suspensão de escalas deste(a) servo(a)? Ele(a) poderá voltar a pegar escalas imediatamente.")) {
      return;
    }
    try {
      setSuspensionLoading(true);
      await removeUserSuspension(servaId);
      setSuspensionsMap((prev) => {
        const next = { ...prev };
        delete next[servaId];
        return next;
      });
      setSuspensionModalServa(null);
      if (activeTab === "servas") {
        await loadServas();
      }
    } catch (err: any) {
      alert(err?.response?.data?.error || "Erro ao remover suspensão.");
    } finally {
      setSuspensionLoading(false);
    }
  }

  useEffect(() => {
    if (isAdmin && activeTab === "servas") {
      loadServas();
    }
  }, [isAdmin, activeTab]);

  function handleOpenServaModal(serva?: ServaData) {
    if (serva) {
      setEditingServa(serva);
      setServaForm({
        name: serva.name,
        email: serva.email,
        password: "",
        birthDate: serva.birthDate ? serva.birthDate.split("T")[0] : "",
        role: serva.role || "USER",
        gender: serva.gender || getUserGender(serva.id, serva.name) || "",
      });
    } else {
      setEditingServa(null);
      setServaForm({ name: "", email: "", password: "", birthDate: "", role: "USER", gender: "" });
    }
    setServaError("");
    setShowServaModal(true);
  }

  async function handleSaveServa(e: React.FormEvent) {
    e.preventDefault();
    setServaError("");
    try {
      setServaLoading(true);
      if (editingServa) {
        await updateServa(editingServa.id, {
          name: servaForm.name,
          email: servaForm.email,
          birthDate: servaForm.birthDate || undefined,
          role: servaForm.role,
          gender: servaForm.gender,
        });
      } else {
        if (!servaForm.password) {
          setServaError("Senha é obrigatória para novo cadastro");
          setServaLoading(false);
          return;
        }
        await createServa({
          name: servaForm.name,
          email: servaForm.email,
          password: servaForm.password,
          birthDate: servaForm.birthDate || undefined,
          role: servaForm.role,
          gender: servaForm.gender,
        });
      }
      setShowServaModal(false);
      await loadServas();
      getUsersList().then(setAllUsers).catch(console.error);
    } catch (err: any) {
      const msg = err.response?.data?.error || "Erro ao salvar cadastro";
      setServaError(msg);
    } finally {
      setServaLoading(false);
    }
  }

  async function handleToggleActiveServa(serva: ServaData) {
    const isCurrentlyInactive = serva.role === "INATIVO";
    const nextRole = isCurrentlyInactive ? "USER" : "INATIVO";
    const actionLabel = isCurrentlyInactive
      ? `Reativar o acesso de "${serva.name}" ao aplicativo?`
      : `Inativar "${serva.name}"?\n\nO cadastro e o histórico de presenças serão mantidos, mas esta pessoa não poderá acessar o aplicativo até ser reativada.`;

    if (!confirm(actionLabel)) return;

    try {
      setServaLoading(true);
      await updateServa(serva.id, { role: nextRole });
      await loadServas();
      getUsersList().then(setAllUsers).catch(console.error);
    } catch (err) {
      console.error("Erro ao alterar status:", err);
      alert("Erro ao alterar status do membro.");
    } finally {
      setServaLoading(false);
    }
  }

  async function handleDeleteServa(serva: ServaData) {
    if (!confirm(`Deseja realmente remover "${serva.name}"?\n\nTodos os dados relacionados (inscrições, logs, etc.) serão removidos permanentemente.`)) return;
    try {
      setServaLoading(true);
      await deleteServa(serva.id);
      await loadServas();
      getUsersList().then(setAllUsers).catch(console.error);
      onUpdate();
    } catch (err) {
      console.error("Erro ao remover cadastro:", err);
      alert("Erro ao remover cadastro.");
    } finally {
      setServaLoading(false);
    }
  }

  const massesWithPhotoCount = useMemo(
    () => masses.filter((m) => m.hasPhoto && !m.name?.includes("Ajuste de Pontos")).length,
    [masses]
  );

  const filteredMasses = masses.filter((mass) => {
    if (mass.name?.includes("Ajuste de Pontos")) return false;
    if (onlyWithPhotos) {
      return Boolean(mass.hasPhoto);
    }

    const massDate = new Date(mass.date);
    const massDateStr = new Date(massDate.getTime() - massDate.getTimezoneOffset() * 60000).toISOString().split("T")[0];

    if (startDate && massDateStr < startDate) return false;
    if (endDate && massDateStr > endDate) return false;

    if (!startDate && !endDate) {
      const today = new Date();
      const todayStr = new Date(today.getTime() - today.getTimezoneOffset() * 60000).toISOString().split("T")[0];
      if (massDateStr < todayStr) return false;
    }

    return true;
  });

  async function handleOpenPhotoModal(massId: string) {
    setPhotoModalMassId(massId);
    setPhotoModalData(null);
    const targetMass = masses.find((m) => m.id === massId);
    if (!targetMass?.hasPhoto) {
      setPhotoModalLoading(false);
      return;
    }
    try {
      setPhotoModalLoading(true);
      const data = await getMassPhoto(massId);
      setPhotoModalData(data);
    } catch (err) {
      console.error("Erro ao carregar foto da missa:", err);
      setPhotoModalData(null);
    } finally {
      setPhotoModalLoading(false);
    }
  }

  async function handleAdminUploadPhoto(massId: string, e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    try {
      setPhotoActionLoading(true);
      const compressed = await compressMassPhotoFile(file, 960, 0.74);
      await uploadMassPhoto(massId, compressed);
      const updatedPhoto = await getMassPhoto(massId);
      setPhotoModalData(updatedPhoto);
      onUpdate();
    } catch (err: any) {
      alert(err?.response?.data?.error || err?.message || "Erro ao enviar foto.");
    } finally {
      setPhotoActionLoading(false);
    }
  }

  async function handleAdminDeletePhoto(massId: string) {
    if (!confirm("Deseja remover a foto da equipe desta missa?")) return;
    try {
      setPhotoActionLoading(true);
      await deleteMassPhoto(massId);
      setPhotoModalData(null);
      onUpdate();
    } catch (err: any) {
      alert(err?.response?.data?.error || "Erro ao remover foto.");
    } finally {
      setPhotoActionLoading(false);
    }
  }

  async function handleConfirmAllPresence(massId: string) {
    try {
      setPhotoActionLoading(true);
      await confirmAllMassPresence(massId);
      onUpdate();
    } catch (err: any) {
      alert(err?.response?.data?.error || "Erro ao confirmar presenças.");
    } finally {
      setPhotoActionLoading(false);
    }
  }

  if (viewMode === "pdf" && isAdmin)
    return (
      <Suspense fallback={<div style={{ padding: 40, textAlign: "center" }}>Carregando PDF...</div>}>
        <OfficialDocument masses={filteredMasses} onBack={() => setViewMode("dashboard")} />
      </Suspense>
    );

  // --- Funções Administrativas ---

  function handleStartEdit(mass: Mass) {
    const d = new Date(mass.date);
    setEditingId(mass.id);
    setShowCreateForm(false);
    setLocalSignups(JSON.parse(JSON.stringify(mass.signups)));
    setNewDate(toLocalDate(d));
    setNewTime(d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }));
    setNewName(mass.name || "");
    setNewLocal(mass.local || "");
    setNewMax(mass.maxServers);
    setNewIsSolemnity(mass.isSolemnity || false);
    setNewPoints(mass.points ? String(mass.points) : "");

    if (mass.deadline) {
      setNewDeadline(toLocalDateTime(new Date(mass.deadline)));
    } else {
      setNewDeadline("");
    }
  }

  function handleCancelEdit() {
    setEditingId(null);
    setShowCreateForm(false);
    setNewDate("");
    setNewTime("");
    setNewName("");
    setNewLocal("");
    setNewMax(APP_CONFIG.DEFAULT_MAX_SERVERS);
    setNewIsSolemnity(false);
    setNewPoints("");
    setNewDeadline("");
    setRepeatWeekly(false);
    setRepeatUntil("");
    setLocalSignups([]);
  }

  async function handleTogglePublish(id: string, currentStatus: boolean) {
    try {
      await togglePublish(id, !currentStatus);
      onUpdate();
    } catch (error) {
      console.error(error);
      alert("Erro ao alterar status.");
    }
  }

  async function handleToggleOpen(id: string, currentOpen: boolean) {
    try {
      await toggleOpen(id, !currentOpen);
      onUpdate();
    } catch (error) {
      console.error(error);
      alert("Erro ao alterar cadeado.");
    }
  }

  async function handleOpenAllFilteredMasses() {
    const closedMasses = filteredMasses.filter((m) => !m.open);
    if (closedMasses.length === 0) return;

    if (!window.confirm(`Deseja abrir as inscrições de ${closedMasses.length} missa(s) listada(s) agora?`)) {
      return;
    }

    try {
      await Promise.all(closedMasses.map((m) => toggleOpen(m.id, true)));
      onUpdate();
    } catch (error) {
      console.error(error);
      alert("Erro ao abrir algumas missas.");
    }
  }

  function handleNotifyOpenMassesWhatsApp() {
    const openMasses = filteredMasses.filter((m) => m.open);
    if (openMasses.length === 0) {
      alert("Nenhuma missa aberta na lista atual para avisar.");
      return;
    }

    const datesSummary = openMasses
      .slice(0, 12)
      .map((m) => {
        const d = new Date(m.date);
        const dateStr = d.toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo", day: "2-digit", month: "2-digit" });
        const timeStr = d.toLocaleTimeString("pt-BR", { timeZone: "America/Sao_Paulo", hour: "2-digit", minute: "2-digit" });
        return `• ${dateStr} às ${timeStr}${m.local ? ` (${m.local})` : ""}`;
      })
      .join("\n");

    const extra = openMasses.length > 12 ? `\n...e mais ${openMasses.length - 12} horário(s)!` : "";
    const text = encodeURIComponent(
      `📅 *Atenção, Servos e Servas!*\n\nAs inscrições foram *Abertas* para ${openMasses.length} missa(s):\n\n${datesSummary}${extra}\n\nCorra no aplicativo e garanta o seu horário acessando a aba de Inscrições.\n🔗 https://servasdoaltar.vercel.app/`
    );
    window.open(`https://api.whatsapp.com/send?text=${text}`, "_blank");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!newDate) return;
    try {
      const payload = {
        date: newDate,
        time: newTime,
        maxServers: newMax,
        name: newName,
        local: newLocal,
        deadline: newDeadline || null,
        isSolemnity: newIsSolemnity,
        points: newPoints ? Number(newPoints) : null,
      };

      if (editingId) {
        const diffSignups = localSignups.filter(ls => {
          const orig = masses.find(m => m.id === editingId)?.signups.find(s => s.id === ls.id);
          if (!orig) return false;
          return orig.role !== ls.role || orig.status !== ls.status;
        });

        const patchPayload: any = { ...payload };

        if (diffSignups.length > 0) {
          patchPayload.signups = {
            update: diffSignups.map(s => ({
              where: { id: s.id },
              data: { role: s.role, status: s.status }
            }))
          };
        }

        await patchMass(editingId, patchPayload);
      } else if (repeatWeekly && repeatUntil) {
        let current = new Date(newDate + "T12:00:00");
        const end = new Date(repeatUntil + "T12:00:00");
        while (current <= end) {
          const dateStr = current.toISOString().split("T")[0];
          await createMass({ ...payload, date: dateStr });
          current.setDate(current.getDate() + 7);
        }
      } else {
        await createMass(payload);
      }

      onUpdate();
      handleCancelEdit();
    } catch (error) {
      console.error(error);
      alert("Erro ao salvar.");
    }
  }

  async function handleDeleteMass(id: string) {
    if (confirm("Apagar missa?")) {
      await deleteMass(id);
      onUpdate();
    }
  }

  async function handleChangeRole(signupId: string, newRole: string, targetMass?: Mass, targetSignup?: Signup) {
    try {
      if (targetMass && targetSignup && (targetSignup as any).status !== "RESERVA") {
        const streak = getConsecutiveRoleStreak(
          targetSignup.userId,
          targetMass.id,
          targetMass.date,
          newRole,
          masses
        );
        if (streak.count >= 3) {
          setRoleStreakAlert({
            servaName: formatServoName(targetSignup.user.name, targetSignup.userId),
            roleLabel: formatRole(newRole, targetSignup.user.name, targetSignup.userId),
            count: streak.count,
            dates: streak.massDates,
          });
        }
      }
      await changeRole(signupId, newRole);
    } catch (error) {
      console.error(error);
    }
  }

  async function handleToggleSignup(massId: string) {
    try {
      await toggleSignup(user.id, massId);
    } catch (error) {
      console.error(error);
      alert("Erro ao se inscrever/sair.");
    }
  }

  async function handleTogglePresence(signupId: string) {
    try {
      await togglePresence(signupId);
    } catch (error) {
      console.error(error);
      alert("Erro ao confirmar presença.");
    }
  }

  async function handlePromote(signupId: string) {
    if (!confirm("Promover este(a) servo(a) da reserva para a escala oficial?")) return;
    try {
      await promoteSignup(signupId);
    } catch (error) {
      console.error(error);
      alert("Erro ao promover.");
    }
  }

  async function handleRemoveSignup(signupId: string) {
    if (!confirm("Remover este(a) servo(a) da escala?")) return;
    try {
      await removeSignup(signupId);
    } catch (error) {
      console.error(error);
      alert("Erro ao remover da escala.");
    }
  }

  async function handleExecuteSwap() {
    if (!swappingSignupId || !selectedReplacementId) return;
    try {
      const targetMass = masses.find((m) => m.signups.some((s) => s.id === swappingSignupId));
      const oldSignup = targetMass?.signups.find((s) => s.id === swappingSignupId);
      const repUser = allUsers.find((u) => u.id === selectedReplacementId);

      if (targetMass && oldSignup && repUser && (oldSignup as any).status !== "RESERVA") {
        const inheritedRole = oldSignup.role || "Auxiliar";
        const streak = getConsecutiveRoleStreak(
          repUser.id,
          targetMass.id,
          targetMass.date,
          inheritedRole,
          masses
        );
        if (streak.count >= 3) {
          setRoleStreakAlert({
            servaName: formatServoName(repUser.name, repUser.id),
            roleLabel: formatRole(inheritedRole, repUser.name, repUser.id),
            count: streak.count,
            dates: streak.massDates,
          });
        }
      }

      await swapSignup(swappingSignupId, selectedReplacementId);
      setSwappingSignupId(null);
      setSelectedReplacementId("");
    } catch (error) {
      console.error("Erro ao realizar troca:", error);
      alert("Erro ao realizar troca.");
    }
  }

  async function handleAddUserToMass(massId: string) {
    const usersIdsToAdd = selectedUserToAdd[massId];
    if (!usersIdsToAdd || usersIdsToAdd.length === 0) {
      alert("Selecione pelo menos um(a) servo(a) para adicionar.");
      return;
    }

    try {
      const targetMass = masses.find((m) => m.id === massId);
      if (targetMass) {
        for (const uid of usersIdsToAdd) {
          const prevStreak = getLastConsecutiveRole(uid, targetMass.date, masses, targetMass.id);
          if (prevStreak && prevStreak.count >= 2) {
            const addedUser = allUsers.find((u) => u.id === uid);
            const uName = addedUser?.name || "Serva";
            const targetDateShort = new Date(targetMass.date).toLocaleDateString("pt-BR", {
              timeZone: "America/Sao_Paulo",
              day: "2-digit",
              month: "2-digit",
            });
            setRoleStreakAlert({
              servaName: formatServoName(uName, uid),
              roleLabel: formatRole(prevStreak.role, uName, uid),
              count: prevStreak.count + 1,
              dates: [...prevStreak.dates, targetDateShort],
              isPreventive: prevStreak.role !== "Auxiliar",
            });
            break;
          }
        }
      }

      await Promise.all(usersIdsToAdd.map(userId => toggleSignup(userId, massId)));
      setSelectedUserToAdd(prev => ({ ...prev, [massId]: [] }));
      setExpandedAddMassId(null);
      setAddSearchTerm("");
    } catch (error) {
      console.error(error);
      alert("Erro ao adicionar na escala.");
    }
  }

  function toggleSelectUserForMass(massId: string, userId: string) {
    setSelectedUserToAdd(prev => {
      const current = prev[massId] || [];
      const exists = current.includes(userId);
      const next = exists ? current.filter(id => id !== userId) : [...current, userId];
      return { ...prev, [massId]: next };
    });
  }

  async function handleAiUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsAiLoading(true);
      const data = await uploadScheduleImage(file);
      setAiExtractedMasses(data);
      setShowAiPreview(true);
    } catch (error: any) {
      console.error(error);
      const msg = error.response?.data?.error || "Erro ao processar arquivo da agenda.";
      alert(msg);
    } finally {
      setIsAiLoading(false);
      e.target.value = "";
    }
  }

  async function handleConfirmAiMasses() {
    try {
      setIsAiLoading(true);
      for (const m of aiExtractedMasses) {
        await createMass({
          date: m.date,
          time: m.time,
          name: m.name,
          local: m.local,
          maxServers: 4
        });
      }
      setShowAiPreview(false);
      setAiExtractedMasses([]);
      onUpdate();
      alert("Missas criadas com sucesso!");
    } catch (error) {
      console.error(error);
      alert("Erro ao criar algumas missas.");
    } finally {
      setIsAiLoading(false);
    }
  }

  const massFormProps: MassFormProps = {
    allMasses: masses,
    localSignups, setLocalSignups,
    unavailabilitiesMap,
    onRoleStreakWarning: setRoleStreakAlert,
    newName, setNewName,
    newLocal, setNewLocal,
    newDate, setNewDate,
    newTime, setNewTime,
    newDeadline, setNewDeadline,
    newMax, setNewMax,
    newIsSolemnity, setNewIsSolemnity,
    newPoints, setNewPoints,
    repeatWeekly, setRepeatWeekly,
    repeatUntil, setRepeatUntil,
    handleSubmit,
    handleCancelEdit,
  };

  const publishedCount = filteredMasses.filter(m => m.published).length;
  const openCount = filteredMasses.filter(m => m.open).length;

  const groupedAdminMasses = useMemo(() => {
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

  const getAgeFromBirthDate = (birthDate?: string | null): number | null => {
    if (!birthDate) return null;
    const datePart = birthDate.split("T")[0];
    const [yStr, mStr, dStr] = datePart.split("-");
    const year = Number(yStr);
    const month = Number(mStr);
    const day = Number(dStr);
    if (!year || !month || !day) return null;

    const today = new Date();
    let age = today.getFullYear() - year;
    const mDiff = today.getMonth() + 1 - month;
    if (mDiff < 0 || (mDiff === 0 && today.getDate() < day)) {
      age--;
    }
    return age >= 0 ? age : null;
  };

  const isExemptFromScaleTimeCount = (serva: ServaData): boolean => {
    const email = (serva.email || "").trim().toLowerCase();
    if (
      email === "alice@serva.com" ||
      email === "camilla@serva.com" ||
      email === "camila@serva.com" ||
      email === "eduarda@serva.com"
    ) {
      return true;
    }
    const firstName = (serva.name || "")
      .trim()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .split(/\s+/)[0];
    return (
      firstName === "camilla" ||
      firstName === "camila" ||
      firstName === "alice" ||
      firstName === "eduarda"
    );
  };

  const getDaysWithoutScaleInfo = (serva: ServaData) => {
    if (isExemptFromScaleTimeCount(serva)) {
      return null;
    }
    const refIso = serva.lastMassDate || serva.firstLoginDate;
    if (!refIso) {
      return {
        label: "Nunca escalado(a)",
        days: null as number | null,
        bg: "#F3F4F6",
        color: "#6B7280",
        border: "#E5E7EB",
        tooltip: "Nenhuma escala ou acesso registrado",
      };
    }

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const refDate = new Date(refIso);
    const refStart = new Date(refDate.getFullYear(), refDate.getMonth(), refDate.getDate()).getTime();
    const diffDays = Math.round((todayStart - refStart) / (1000 * 60 * 60 * 24));
    const dateBr = refDate.toLocaleDateString("pt-BR");

    if (serva.lastMassDate && diffDays < 0) {
      return {
        label: `Escalado(a) (${refDate.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })})`,
        days: 0,
        bg: "#DCFCE7",
        color: "#166534",
        border: "#BBF7D0",
        tooltip: `Próxima escala em ${dateBr}`,
      };
    }

    const days = Math.max(0, diffDays);
    const shortDate = refDate.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
    const dayText =
      days === 0
        ? "Escalado(a) hoje"
        : days === 1
          ? "1 dia sem escala"
          : `${days} dias sem escala`;
    const suffix = serva.lastMassDate ? ` (${shortDate})` : " (1º acesso)";

    let bg = "#FAF8F5";
    let color = "#5A4332";
    let border = "#E5DEC9";
    if (days >= 60) {
      bg = "#FEE2E2";
      color = "#991B1B";
      border = "#FECACA";
    } else if (days >= 30) {
      bg = "#FEF3C7";
      color = "#B45309";
      border = "#FDE68A";
    }

    return {
      label: `${dayText}${days > 0 ? suffix : ""}`,
      days,
      bg,
      color,
      border,
      tooltip: serva.lastMassDate ? `Última escala: ${dateBr}` : `Sem escalas desde o 1º acesso (${dateBr})`,
    };
  };

  const todayBrStr = getTodayBrDateStr();

  const monthlyAbsencesData = useMemo(() => {
    const now = new Date();
    const brNowStr = now.toLocaleDateString("en-CA", { timeZone: "America/Sao_Paulo" });
    const currentYearMonth = brNowStr.slice(0, 7); // YYYY-MM
    const nowMs = now.getTime();

    const byUser: Record<string, { userId: string; userName: string; count: number; dates: string[] }> = {};

    for (const mass of masses) {
      if (mass.name?.includes("Ajuste de Pontos")) continue;
      const massMs = new Date(mass.date).getTime();
      if (isNaN(massMs) || massMs >= nowMs) continue;

      const massBrDay = new Date(mass.date).toLocaleDateString("en-CA", { timeZone: "America/Sao_Paulo" });
      if (!massBrDay.startsWith(currentYearMonth)) continue;

      const dateLabel = new Date(mass.date).toLocaleString("pt-BR", {
        timeZone: "America/Sao_Paulo",
        day: "2-digit",
        month: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      });

      for (const s of mass.signups) {
        if ((s as any).status === "RESERVA" || s.present) continue;
        const servaObj = servasList.find((sv) => sv.id === s.userId);
        if (servaObj && (servaObj.role === "INATIVO" || servaObj.role === "ADMIN")) continue;

        const name = servaObj?.name || allUsers.find((u) => u.id === s.userId)?.name || s.user?.name || "Servo(a)";
        if (!byUser[s.userId]) {
          byUser[s.userId] = { userId: s.userId, userName: name, count: 0, dates: [] };
        }
        byUser[s.userId].count += 1;
        byUser[s.userId].dates.push(dateLabel);
      }
    }

    const listThreePlus = Object.values(byUser)
      .filter((item) => item.count >= 3)
      .sort((a, b) => b.count - a.count || a.userName.localeCompare(b.userName));

    return { byUser, listThreePlus };
  }, [masses, servasList, allUsers]);

  const filteredServasList = servasList
    .filter((s) => {
      const matchesSearch =
        !servaSearch.trim() ||
        s.name.toLowerCase().includes(servaSearch.toLowerCase()) ||
        s.email.toLowerCase().includes(servaSearch.toLowerCase());
      if (!matchesSearch) return false;

      const g = s.gender || getUserGender(s.id, s.name);
      const activeSusp = suspensionsMap[s.id] && suspensionsMap[s.id].until >= todayBrStr;
      if (servaFilter === "ACTIVE") return s.role === "USER" || (!s.role);
      if (servaFilter === "SUSPENDED") return Boolean(activeSusp);
      if (servaFilter === "FORMACAO") return s.role === "em_formacao";
      if (servaFilter === "INATIVO") return s.role === "INATIVO";
      if (servaFilter === "M") return g === "M" && s.role !== "INATIVO";
      if (servaFilter === "F") return g === "F" && s.role !== "INATIVO";
      return true;
    })
    .sort((a, b) => {
      if (!servaSortByDays) return 0;
      const daysA = getDaysWithoutScaleInfo(a)?.days ?? -1;
      const daysB = getDaysWithoutScaleInfo(b)?.days ?? -1;
      return daysB - daysA;
    });

  return (
    <div className="admin-container">
      {/* MODAIS LAZY */}
      <Suspense fallback={null}>
        {showTextModal && isAdmin && <ScaleModal masses={filteredMasses} onClose={() => setShowTextModal(false)} />}
        {showRankingModal && isAdmin && <RankingModal masses={masses} onClose={() => setShowRankingModal(false)} />}
        {showStatsModal && isAdmin && <StatisticsModal masses={masses} onClose={() => setShowStatsModal(false)} />}
        {showReminderModal && isAdmin && <ReminderModal masses={masses} onClose={() => setShowReminderModal(false)} />}
        {showPrizeModal && isAdmin && (
          <PrizeManagerModal
            onClose={() => setShowPrizeModal(false)}
            onUpdated={(data) => setPrizeOverview(data)}
          />
        )}
      </Suspense>

      {/* ALERTA DE REPETIÇÃO DE FUNÇÃO (3+ ESCALAS SEGUIDAS NA MESMA FUNÇÃO) */}
      {roleStreakAlert && isAdmin && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.65)",
            zIndex: 10050,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "16px",
            backdropFilter: "blur(3px)",
          }}
          onClick={() => setRoleStreakAlert(null)}
        >
          <div
            style={{
              background: "#FFFBEB",
              width: "100%",
              maxWidth: "410px",
              borderRadius: "16px",
              border: "2px solid #F59E0B",
              boxShadow: "0 20px 50px rgba(0,0,0,0.35)",
              overflow: "hidden",
              animation: "slideDown 0.2s ease",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                background: "linear-gradient(135deg, #B45309 0%, #D97706 100%)",
                color: "#FFFFFF",
                padding: "14px 16px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "10px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "8px", fontWeight: 800, fontSize: "0.96rem" }}>
                <AlertTriangle size={20} />
                <span>Alerta de Repetição de Função</span>
              </div>
              <button
                type="button"
                onClick={() => setRoleStreakAlert(null)}
                style={{
                  background: "rgba(255,255,255,0.2)",
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
                <X size={16} />
              </button>
            </div>

            <div style={{ padding: "18px 16px", color: "#23170F", fontSize: "0.9rem", lineHeight: 1.5 }}>
              {roleStreakAlert.isPreventive ? (
                <p style={{ margin: "0 0 12px 0" }}>
                  Atenção: <strong>{roleStreakAlert.servaName}</strong> já serviu nas últimas{" "}
                  <strong>{roleStreakAlert.count - 1} escalas seguidas</strong> na função de{" "}
                  <strong style={{ color: "#B45309" }}>{roleStreakAlert.roleLabel}</strong>. Se permanecer nessa mesma função nesta missa, completará{" "}
                  <strong>{roleStreakAlert.count} escalas seguidas</strong>!
                </p>
              ) : (
                <p style={{ margin: "0 0 12px 0" }}>
                  Atenção: <strong>{roleStreakAlert.servaName}</strong> está sendo escalada(o) pela{" "}
                  <strong style={{ color: "#B45309" }}>{roleStreakAlert.count}ª escala seguida</strong> na mesma função de{" "}
                  <strong style={{ color: "#B45309" }}>{roleStreakAlert.roleLabel}</strong>!
                </p>
              )}

              <div
                style={{
                  background: "#FFFFFF",
                  border: "1px solid #FDE68A",
                  borderRadius: "10px",
                  padding: "10px 12px",
                  fontSize: "0.8rem",
                  color: "#78350F",
                  fontWeight: 700,
                  marginBottom: "14px",
                }}
              >
                📅 Sequência de escalas: {roleStreakAlert.dates.join(" → ")}
              </div>

              <button
                type="button"
                onClick={() => setRoleStreakAlert(null)}
                style={{
                  width: "100%",
                  padding: "11px",
                  borderRadius: "10px",
                  border: "none",
                  background: "linear-gradient(135deg, #B45309 0%, #D97706 100%)",
                  color: "#FFFFFF",
                  fontWeight: 800,
                  fontSize: "0.86rem",
                  cursor: "pointer",
                }}
              >
                Entendi, vou verificar
              </button>
            </div>
          </div>
        </div>
      )}

      {photoModalMassId && isAdmin && (() => {
        const modalMass = masses.find((m) => m.id === photoModalMassId);
        if (!modalMass) return null;
        const confirmedSignups = modalMass.signups.filter((s: any) => s.status !== "RESERVA");
        const presentCount = confirmedSignups.filter((s) => s.present).length;
        const allPresent = confirmedSignups.length > 0 && presentCount === confirmedSignups.length;

        return (
          <div
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,0.7)",
              zIndex: 9999,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "16px",
              backdropFilter: "blur(3px)",
            }}
            onClick={() => setPhotoModalMassId(null)}
          >
            <div
              style={{
                background: "#FAF8F5",
                width: "100%",
                maxWidth: "500px",
                maxHeight: "90vh",
                borderRadius: "16px",
                overflowY: "auto",
                display: "flex",
                flexDirection: "column",
                border: `1px solid ${theme.colors.border}`,
                boxShadow: "0 20px 50px rgba(0,0,0,0.4)",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Cabeçalho */}
              <div
                style={{
                  background: theme.colors.primaryGradient,
                  color: "#fff",
                  padding: "14px 16px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  position: "sticky",
                  top: 0,
                  zIndex: 10,
                }}
              >
                <div>
                  <div style={{ fontWeight: 800, fontSize: "0.98rem", display: "flex", alignItems: "center", gap: "7px" }}>
                    <Camera size={18} />
                    <span>Foto da Equipe & Conferência</span>
                  </div>
                  <div style={{ fontSize: "0.75rem", opacity: 0.92 }}>
                    {new Date(modalMass.date).toLocaleDateString("pt-BR", {
                      timeZone: "America/Sao_Paulo",
                      weekday: "short",
                      day: "2-digit",
                      month: "2-digit",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                    {modalMass.local ? ` • ${modalMass.local}` : ""}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setPhotoModalMassId(null)}
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

              <div style={{ padding: "16px", display: "flex", flexDirection: "column", gap: "16px" }}>
                {/* Área da Foto */}
                <div
                  style={{
                    background: "#FFFFFF",
                    border: `1px solid ${theme.colors.borderLight}`,
                    borderRadius: "12px",
                    padding: "12px",
                    textAlign: "center",
                  }}
                >
                  {photoModalLoading ? (
                    <div style={{ padding: "36px 10px", color: theme.colors.textSecondary }}>
                      <Loader2 size={26} className="animate-spin" style={{ margin: "0 auto 8px" }} />
                      <div style={{ fontSize: "0.84rem", fontWeight: 600 }}>Carregando foto da equipe...</div>
                    </div>
                  ) : photoModalData?.imageDataUrl ? (
                    <div>
                      <img
                        src={photoModalData.imageDataUrl}
                        alt="Foto da Equipe"
                        style={{
                          width: "100%",
                          maxHeight: "48vh",
                          objectFit: "contain",
                          borderRadius: "10px",
                          background: "#111",
                          border: `1px solid ${theme.colors.border}`,
                        }}
                      />
                      <div style={{ marginTop: "8px", fontSize: "0.78rem", color: "#5A4332", fontWeight: 600 }}>
                        Enviada por <strong>{formatServoName(photoModalData.uploadedByName, photoModalData.uploadedById)}</strong> em{" "}
                        {new Date(photoModalData.uploadedAt).toLocaleString("pt-BR", {
                          timeZone: "America/Sao_Paulo",
                          day: "2-digit",
                          month: "2-digit",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                      <div style={{ marginTop: "2px", fontSize: "0.7rem", color: "#8C7360" }}>
                        As fotos são eliminadas automaticamente após 7 dias.
                      </div>
                      <div style={{ display: "flex", justifyContent: "center", gap: "8px", marginTop: "10px", flexWrap: "wrap" }}>
                        <button
                          type="button"
                          onClick={() => downloadMassPhotoFile(photoModalData.imageDataUrl, modalMass.date)}
                          style={{
                            padding: "6px 12px",
                            borderRadius: "8px",
                            border: `1px solid ${theme.colors.primary}`,
                            background: theme.colors.primary,
                            color: "#FFFFFF",
                            fontSize: "0.76rem",
                            fontWeight: 700,
                            cursor: "pointer",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "5px",
                          }}
                        >
                          <Download size={14} />
                          <span>Baixar Foto</span>
                        </button>
                        <label
                          style={{
                            padding: "6px 12px",
                            borderRadius: "8px",
                            border: `1px solid ${theme.colors.border}`,
                            background: "#FAF8F5",
                            color: theme.colors.primary,
                            fontSize: "0.76rem",
                            fontWeight: 700,
                            cursor: photoActionLoading ? "not-allowed" : "pointer",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "5px",
                            margin: 0,
                          }}
                        >
                          <Camera size={14} />
                          <span>📷 Câmera</span>
                          <input
                            type="file"
                            accept="image/*"
                            capture="environment"
                            onChange={(e) => handleAdminUploadPhoto(modalMass.id, e)}
                            style={{ display: "none" }}
                            disabled={photoActionLoading}
                          />
                        </label>
                        <label
                          style={{
                            padding: "6px 12px",
                            borderRadius: "8px",
                            border: `1px solid ${theme.colors.border}`,
                            background: "#FAF8F5",
                            color: theme.colors.primary,
                            fontSize: "0.76rem",
                            fontWeight: 700,
                            cursor: photoActionLoading ? "not-allowed" : "pointer",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "5px",
                            margin: 0,
                          }}
                        >
                          <span>🖼️ Galeria</span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleAdminUploadPhoto(modalMass.id, e)}
                            style={{ display: "none" }}
                            disabled={photoActionLoading}
                          />
                        </label>
                        <button
                          type="button"
                          onClick={() => handleAdminDeletePhoto(modalMass.id)}
                          disabled={photoActionLoading}
                          style={{
                            padding: "6px 12px",
                            borderRadius: "8px",
                            border: "1px solid #FECACA",
                            background: "#FEF2F2",
                            color: "#B91C1C",
                            fontSize: "0.76rem",
                            fontWeight: 700,
                            cursor: "pointer",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "5px",
                          }}
                        >
                          <Trash2 size={14} />
                          <span>Excluir Foto</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div style={{ padding: "20px 10px" }}>
                      <Camera size={32} style={{ color: "#C4B5A3", margin: "0 auto 8px", display: "block" }} />
                      <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "#5A4332", marginBottom: "4px" }}>
                        Nenhuma foto enviada para esta missa ainda.
                      </div>
                      <div style={{ fontSize: "0.75rem", color: "#8C7360", marginBottom: "12px" }}>
                        Os(as) servos(as) escalados(as) podem enviar no dia da missa, ou você pode anexar abaixo:
                      </div>
                      <div style={{ display: "flex", justifyContent: "center", gap: "8px", flexWrap: "wrap" }}>
                        <label
                          style={{
                            padding: "8px 14px",
                            borderRadius: "8px",
                            background: "#166534",
                            color: "#fff",
                            fontSize: "0.78rem",
                            fontWeight: 800,
                            cursor: photoActionLoading ? "not-allowed" : "pointer",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "6px",
                            margin: 0,
                          }}
                        >
                          {photoActionLoading ? <Loader2 size={14} className="animate-spin" /> : <Camera size={14} />}
                          <span>📷 Abrir Câmera</span>
                          <input
                            type="file"
                            accept="image/*"
                            capture="environment"
                            onChange={(e) => handleAdminUploadPhoto(modalMass.id, e)}
                            style={{ display: "none" }}
                            disabled={photoActionLoading}
                          />
                        </label>
                        <label
                          style={{
                            padding: "8px 14px",
                            borderRadius: "8px",
                            background: theme.colors.primary,
                            color: "#fff",
                            fontSize: "0.78rem",
                            fontWeight: 800,
                            cursor: photoActionLoading ? "not-allowed" : "pointer",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "6px",
                            margin: 0,
                          }}
                        >
                          <span>🖼️ Escolher da Galeria</span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleAdminUploadPhoto(modalMass.id, e)}
                            style={{ display: "none" }}
                            disabled={photoActionLoading}
                          />
                        </label>
                      </div>
                    </div>
                  )}
                </div>

                {/* Checklist de Presença da Equipe */}
                <div
                  style={{
                    background: "#FFFFFF",
                    border: `1px solid ${theme.colors.borderLight}`,
                    borderRadius: "12px",
                    padding: "12px",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      gap: "8px",
                      marginBottom: "10px",
                      flexWrap: "wrap",
                    }}
                  >
                    <div style={{ fontWeight: 800, fontSize: "0.84rem", color: theme.colors.primary }}>
                      Servos Escalados ({presentCount}/{confirmedSignups.length} presentes)
                    </div>
                    {confirmedSignups.length > 0 && !allPresent && (
                      <button
                        type="button"
                        onClick={() => handleConfirmAllPresence(modalMass.id)}
                        disabled={photoActionLoading}
                        style={{
                          padding: "6px 10px",
                          borderRadius: "8px",
                          border: "none",
                          background: "#16A34A",
                          color: "#FFFFFF",
                          fontSize: "0.74rem",
                          fontWeight: 800,
                          cursor: "pointer",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "4px",
                        }}
                      >
                        <Check size={14} strokeWidth={2.5} />
                        <span>Marcar Todos Presentes</span>
                      </button>
                    )}
                  </div>

                  {confirmedSignups.length === 0 ? (
                    <div style={{ fontSize: "0.8rem", color: "#888", textAlign: "center", padding: "10px" }}>
                      Nenhum servo escalado nesta missa.
                    </div>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                      {confirmedSignups.map((s) => (
                        <div
                          key={s.id}
                          onClick={() => handleTogglePresence(s.id)}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            padding: "8px 10px",
                            borderRadius: "8px",
                            border: s.present ? "1px solid #86EFAC" : "1px solid #E5DEC9",
                            background: s.present ? "#F0FDF4" : "#FAF8F5",
                            cursor: "pointer",
                          }}
                        >
                          <div>
                            <div style={{ fontWeight: 700, fontSize: "0.86rem", color: "#23170F" }}>
                              {formatServoName(s.user.name, s.userId)}
                            </div>
                            <div style={{ fontSize: "0.72rem", color: "#6B7280", fontWeight: 600 }}>
                              {formatRole(s.role, s.user.name, s.userId)}
                            </div>
                          </div>
                          <span
                            style={{
                              padding: "4px 10px",
                              borderRadius: "20px",
                              background: s.present ? "#16A34A" : "#E5E7EB",
                              color: s.present ? "#FFFFFF" : "#4B5563",
                              fontSize: "0.72rem",
                              fontWeight: 800,
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "4px",
                            }}
                          >
                            {s.present ? <><Check size={12} strokeWidth={3} /> Presente</> : "Marcar Presença"}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ─── MODAL: CENTRAL DE FERRAMENTAS & RELATÓRIOS ─────────────────── */}
      {showToolsModal && isAdmin && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.65)",
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "16px",
            backdropFilter: "blur(4px)",
          }}
          onClick={() => setShowToolsModal(false)}
        >
          <div
            style={{
              backgroundColor: "#FAF8F5",
              width: "100%",
              maxWidth: "460px",
              maxHeight: "85vh",
              borderRadius: "16px",
              overflowY: "auto",
              display: "flex",
              flexDirection: "column",
              border: `1px solid ${theme.colors.border}`,
              boxShadow: "0 20px 50px rgba(0,0,0,0.35)",
              animation: "slideDown 0.2s ease",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div
              style={{
                background: theme.colors.primaryGradient,
                color: "#fff",
                padding: "14px 18px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                position: "sticky",
                top: 0,
                zIndex: 10,
              }}
            >
              <div>
                <div style={{ fontWeight: 800, fontSize: "1rem", display: "flex", alignItems: "center", gap: "8px" }}>
                  <LayoutGrid size={18} />
                  <span>Central de Ferramentas</span>
                </div>
                <div style={{ fontSize: "0.74rem", opacity: 0.9 }}>
                  Relatórios, utilitários e ações em lote
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowToolsModal(false)}
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

            {/* Conteúdo */}
            <div style={{ padding: "16px", display: "flex", flexDirection: "column", gap: "16px" }}>
              {/* Relatórios e Exportação */}
              <div>
                <div style={{ fontSize: "0.74rem", fontWeight: 800, color: theme.colors.textSecondary, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "8px" }}>
                  Relatórios & Escala
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "8px" }}>
                  <button
                    className="tool-card-btn"
                    style={{ padding: "12px 10px" }}
                    onClick={() => {
                      setShowStatsModal(true);
                      setShowToolsModal(false);
                    }}
                  >
                    <div className="tool-card-icon" style={{ background: "#EFF6FF", color: "#1D4ED8" }}>
                      <BarChart2 size={18} />
                    </div>
                    <span>Relatório Geral</span>
                  </button>

                  <button
                    className="tool-card-btn"
                    style={{ padding: "12px 10px" }}
                    onClick={() => {
                      setShowRankingModal(true);
                      setShowToolsModal(false);
                    }}
                  >
                    <div className="tool-card-icon" style={{ background: "#FEF3C7", color: "#B45309" }}>
                      <Trophy size={18} />
                    </div>
                    <span>Ranking de Pontos</span>
                  </button>

                  <button
                    className="tool-card-btn"
                    style={{ padding: "12px 10px" }}
                    onClick={() => {
                      setShowPrizeModal(true);
                      setShowToolsModal(false);
                    }}
                  >
                    <div className="tool-card-icon" style={{ background: "#FEF3C7", color: "#D97706" }}>
                      <Gift size={18} />
                    </div>
                    <span>Premiação & Balões</span>
                  </button>

                  <button
                    className="tool-card-btn"
                    style={{ padding: "12px 10px" }}
                    onClick={() => {
                      setShowTextModal(true);
                      setShowToolsModal(false);
                    }}
                  >
                    <div className="tool-card-icon" style={{ background: "#ECFDF5", color: "#047857" }}>
                      <Edit size={18} />
                    </div>
                    <span>Texto p/ WhatsApp</span>
                  </button>

                  <button
                    className="tool-card-btn"
                    style={{ padding: "12px 10px" }}
                    onClick={() => {
                      setShowReminderModal(true);
                      setShowToolsModal(false);
                    }}
                  >
                    <div className="tool-card-icon" style={{ background: "#F7F5F0", color: "#4A3222" }}>
                      <Megaphone size={18} />
                    </div>
                    <span>Enviar Lembretes</span>
                  </button>

                  <button
                    className="tool-card-btn"
                    style={{ padding: "12px 10px" }}
                    onClick={() => {
                      setOnlyWithPhotos((prev) => !prev);
                      setShowToolsModal(false);
                    }}
                  >
                    <div className="tool-card-icon" style={{ background: "#DCFCE7", color: "#166534" }}>
                      <Camera size={18} />
                    </div>
                    <span>Fotos Enviadas ({massesWithPhotoCount})</span>
                  </button>

                  <button
                    className="tool-card-btn"
                    style={{ padding: "12px 10px" }}
                    onClick={() => {
                      setViewMode("pdf");
                      setShowToolsModal(false);
                    }}
                  >
                    <div className="tool-card-icon" style={{ background: "#FEF2F2", color: "#B91C1C" }}>
                      <FileText size={18} />
                    </div>
                    <span>Gerar Escala PDF</span>
                  </button>
                </div>
              </div>

              {/* Ações Rápidas & Automação */}
              <div>
                <div style={{ fontSize: "0.74rem", fontWeight: 800, color: theme.colors.textSecondary, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "8px" }}>
                  Ações Rápidas & Automação
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  <label
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      padding: "10px 12px",
                      borderRadius: "8px",
                      background: "#FFFFFF",
                      border: "1px solid #E5DEC9",
                      color: theme.colors.primary,
                      fontWeight: 700,
                      fontSize: "0.82rem",
                      cursor: isAiLoading ? "not-allowed" : "pointer",
                      margin: 0,
                    }}
                  >
                    {isAiLoading ? <Loader2 className="animate-spin" size={16} /> : <Camera size={16} />}
                    <span>{isAiLoading ? "Lendo imagem da agenda..." : "Importar Agenda por Foto (IA)"}</span>
                    <input
                      type="file"
                      accept="image/*,application/pdf"
                      onChange={(e) => {
                        setShowToolsModal(false);
                        handleAiUpload(e);
                      }}
                      style={{ display: "none" }}
                      disabled={isAiLoading}
                    />
                  </label>

                  {filteredMasses.some((m) => !m.open) && (
                    <button
                      type="button"
                      onClick={() => {
                        setShowToolsModal(false);
                        handleOpenAllFilteredMasses();
                      }}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                        padding: "10px 12px",
                        borderRadius: "8px",
                        border: "1px solid #BBF7D0",
                        background: "#F0FDF4",
                        color: "#166534",
                        fontWeight: 700,
                        fontSize: "0.82rem",
                        cursor: "pointer",
                        textAlign: "left",
                      }}
                    >
                      <LockOpen size={16} />
                      <span>Abrir Todas as Inscrições ({filteredMasses.filter((m) => !m.open).length} fechadas)</span>
                    </button>
                  )}

                  {filteredMasses.some((m) => m.open) && (
                    <button
                      type="button"
                      onClick={() => {
                        setShowToolsModal(false);
                        handleNotifyOpenMassesWhatsApp();
                      }}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                        padding: "10px 12px",
                        borderRadius: "8px",
                        border: "1px solid #A7F3D0",
                        background: "#ECFDF5",
                        color: "#047857",
                        fontWeight: 700,
                        fontSize: "0.82rem",
                        cursor: "pointer",
                        textAlign: "left",
                      }}
                    >
                      <Megaphone size={16} />
                      <span>Avisar Missas Abertas no WhatsApp</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── 1. TOP APPBAR COMPACTA ────────────────────────────────────────── */}
      <header className="admin-header no-print">
        <div className="header-brand">
          <div className="header-brand-icon">
            <Shield size={22} />
          </div>
          <div>
            <h1>{isAdmin ? "Coordenação" : "Escala de Servos"}</h1>
            <span>{user.name}</span>
          </div>
        </div>

        <button className="btn-logout-admin" onClick={onLogout} title="Sair do sistema">
          <LogOut size={16} />
          <span>Sair</span>
        </button>
      </header>

      {/* ALERTA DE PRÊMIO(S) SORTEADO(S) (PENDENTES DE ENTREGA PELO ADMIN) */}
      {isAdmin && !dismissedPrizeBanner && (() => {
        const undeliveredList = (prizeOverview?.claims || []).filter((c) => !c.delivered);
        if (undeliveredList.length === 0) return null;
        const mNames = [
          "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
          "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
        ];

        return (
          <div
            className="no-print"
            style={{
              margin: "0 0 12px 0",
              padding: "12px 14px",
              borderRadius: "12px",
              background: "linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%)",
              border: "1.5px solid #D97706",
              boxShadow: "0 4px 12px rgba(217, 119, 6, 0.18)",
              display: "flex",
              flexDirection: "column",
              gap: "8px",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "8px" }}>
              <div
                onClick={() => setShowPrizeModal(true)}
                style={{ fontWeight: 800, fontSize: "0.84rem", color: "#92400E", display: "flex", alignItems: "center", gap: "6px", cursor: "pointer" }}
              >
                <Gift size={16} />
                <span>
                  🎈 {undeliveredList.length === 1 ? "Balão estourado — Prêmio pendente de entrega!" : `${undeliveredList.length} balões estourados — Prêmios pendentes de entrega!`}
                </span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "6px", flexShrink: 0 }}>
                <button
                  type="button"
                  onClick={() => setShowPrizeModal(true)}
                  style={{
                    background: "#4A3222",
                    color: "#fff",
                    border: "none",
                    borderRadius: "8px",
                    padding: "5px 9px",
                    fontSize: "0.72rem",
                    fontWeight: 800,
                    cursor: "pointer",
                  }}
                >
                  Prêmios
                </button>
                <button
                  type="button"
                  onClick={() => setDismissedPrizeBanner(true)}
                  style={{
                    background: "transparent",
                    border: "none",
                    color: "#92400E",
                    cursor: "pointer",
                    padding: "4px",
                    display: "flex",
                    alignItems: "center",
                  }}
                  title="Ocultar aviso"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {undeliveredList.map((undelivered) => {
              const monthLabel =
                undelivered.ymKey === "TESTE-SIMULACAO"
                  ? "Simulação"
                  : undelivered.customLabel || `${mNames[undelivered.month] || ""}/${undelivered.year}`;

              return (
                <div
                  key={undelivered.ymKey}
                  style={{
                    background: "rgba(255,255,255,0.72)",
                    border: "1px solid #F59E0B",
                    borderRadius: "9px",
                    padding: "8px 10px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: "8px",
                    flexWrap: "wrap",
                  }}
                >
                  <div style={{ fontSize: "0.8rem", color: "#4A3222", fontWeight: 700, flex: 1, minWidth: "180px" }}>
                    <span style={{ color: "#92400E", fontWeight: 800 }}>[{monthLabel}]</span>{" "}
                    <strong>{undelivered.winnerName}</strong> (Balão {undelivered.balloonIndex + 1}) →{" "}
                    <span style={{ color: "#B45309", fontWeight: 900 }}>{undelivered.prizeWon}</span>
                  </div>
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        await setPrizeDelivered(undelivered.ymKey, true);
                        const fresh = await getAdminPrizeOverview();
                        setPrizeOverview(fresh);
                      } catch {
                        alert("Erro ao marcar prêmio como entregue.");
                      }
                    }}
                    style={{
                      background: "#166534",
                      color: "#fff",
                      border: "none",
                      borderRadius: "7px",
                      padding: "5px 10px",
                      fontSize: "0.73rem",
                      fontWeight: 800,
                      cursor: "pointer",
                      flexShrink: 0,
                    }}
                  >
                    Entregue ✅
                  </button>
                </div>
              );
            })}
          </div>
        );
      })()}

      {/* ANIVERSARIANTE(S) DO DIA */}
      {isAdmin && !dismissedBirthdayBanner && todayBirthdayPeople.length > 0 && (() => {
        const namesLabel = todayBirthdayPeople
          .map((p) => {
            const adminName = p.fullName || p.name;
            return p.age ? `${adminName} (${p.age} anos)` : adminName;
          })
          .join(" • ");
        const waNames =
          todayBirthdayPeople.length === 1
            ? todayBirthdayPeople[0].name
            : todayBirthdayPeople.length === 2
              ? `${todayBirthdayPeople[0].name} e ${todayBirthdayPeople[1].name}`
              : `${todayBirthdayPeople.slice(0, -1).map((p) => p.name).join(", ")} e ${todayBirthdayPeople[todayBirthdayPeople.length - 1].name}`;
        const waText = `🎂 Parabéns, ${waNames}! Que Deus abençoe muito ${todayBirthdayPeople.length > 1 ? "vocês" : "você"} e o serviço no Altar! 🙏🎉`;

        return (
          <div
            className="no-print"
            style={{
              margin: "0 0 12px 0",
              padding: "12px 14px",
              borderRadius: "12px",
              background: "linear-gradient(135deg, #FFFBF0 0%, #FDF2D6 55%, #FCE7B2 100%)",
              border: "1.5px solid #D4A44C",
              boxShadow: "0 4px 12px rgba(184, 146, 90, 0.18)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "10px",
            }}
          >
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 800, fontSize: "0.84rem", color: "#8C6530", display: "flex", alignItems: "center", gap: "6px" }}>
                <Cake size={16} />
                <span>
                  {todayBirthdayPeople.length > 1 ? "Aniversariantes de hoje" : "Aniversariante de hoje"}
                </span>
              </div>
              <div style={{ fontSize: "0.82rem", color: "#4A3222", fontWeight: 700, marginTop: "3px" }}>
                🎉 {namesLabel}
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "6px", flexShrink: 0 }}>
              <a
                href={`https://wa.me/?text=${encodeURIComponent(waText)}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  background: "#4A3222",
                  color: "#fff",
                  textDecoration: "none",
                  borderRadius: "8px",
                  padding: "6px 10px",
                  fontSize: "0.74rem",
                  fontWeight: 800,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "5px",
                }}
              >
                <MessageCircle size={13} />
                <span>WhatsApp</span>
              </a>
              <button
                type="button"
                onClick={() => setDismissedBirthdayBanner(true)}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "#8C6530",
                  cursor: "pointer",
                  padding: "4px",
                  display: "flex",
                  alignItems: "center",
                }}
                title="Ocultar aviso"
              >
                <X size={16} />
              </button>
            </div>
          </div>
        );
      })()}

      {/* ALERTA DE 3+ FALTAS (SEM PRESENÇA) NO MÊS ATUAL */}
      {isAdmin && !dismissedAbsenceBanner && monthlyAbsencesData.listThreePlus.length > 0 && (() => {
        const list = monthlyAbsencesData.listThreePlus;
        const previewNames = list
          .slice(0, 2)
          .map((item) => `${item.userName.split(" ")[0]} (${item.count} faltas)`)
          .join(" • ");

        return (
          <div
            className="no-print"
            style={{
              margin: "0 0 12px 0",
              padding: "12px 14px",
              borderRadius: "12px",
              background: "linear-gradient(135deg, #FEE2E2 0%, #FEF2F2 100%)",
              border: "1.5px solid #EF4444",
              boxShadow: "0 4px 12px rgba(185, 28, 28, 0.14)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "10px",
            }}
          >
            <div
              onClick={() => setShowMonthlyAbsencesModal(true)}
              style={{ flex: 1, minWidth: 0, cursor: "pointer" }}
            >
              <div style={{ fontWeight: 800, fontSize: "0.84rem", color: "#991B1B", display: "flex", alignItems: "center", gap: "6px" }}>
                <AlertTriangle size={16} />
                <span>
                  {list.length} {list.length === 1 ? "servo(a) com 3+ faltas neste mês" : "servos(as) com 3+ faltas neste mês"}
                </span>
              </div>
              <div style={{ fontSize: "0.76rem", color: "#7F1D1D", marginTop: "3px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {previewNames}{list.length > 2 ? ` e +${list.length - 2}` : ""}
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "6px", flexShrink: 0 }}>
              <button
                type="button"
                onClick={() => setShowMonthlyAbsencesModal(true)}
                style={{
                  background: "#B91C1C",
                  color: "#fff",
                  border: "none",
                  borderRadius: "8px",
                  padding: "6px 10px",
                  fontSize: "0.74rem",
                  fontWeight: 800,
                  cursor: "pointer",
                }}
              >
                Ver e Suspender
              </button>
              <button
                type="button"
                onClick={() => setDismissedAbsenceBanner(true)}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "#991B1B",
                  cursor: "pointer",
                  padding: "4px",
                  display: "flex",
                  alignItems: "center",
                }}
                title="Ocultar aviso"
              >
                <X size={16} />
              </button>
            </div>
          </div>
        );
      })()}

      {/* AVISO AO LOGAR: AUSÊNCIAS PROGRAMADAS FUTURAS */}
      {isAdmin && !dismissedUnavBanner && (() => {
        const now = new Date();
        const brNow = new Date(now.toLocaleString("en-US", { timeZone: "America/Sao_Paulo" }));
        const todayStr = `${brNow.getFullYear()}-${String(brNow.getMonth() + 1).padStart(2, "0")}-${String(brNow.getDate()).padStart(2, "0")}`;

        const upcoming = Object.entries(unavailabilitiesMap)
          .flatMap(([uid, items]) => {
            const memberName =
              servasList.find((s) => s.id === uid)?.name ||
              allUsers.find((u) => u.id === uid)?.name ||
              "Membro";
            return (items || [])
              .filter((item) => item.date >= todayStr)
              .map((item) => ({ userName: memberName, date: item.date, reason: item.reason }));
          })
          .sort((a, b) => a.date.localeCompare(b.date));

        if (upcoming.length === 0) return null;

        const previewText = upcoming
          .slice(0, 2)
          .map((u) => {
            const shortDate = new Date(u.date + "T12:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
            return `${u.userName.split(" ")[0]} (${shortDate}${u.reason ? ` - ${u.reason}` : ""})`;
          })
          .join(" • ");

        return (
          <div
            className="no-print"
            style={{
              margin: "0 0 12px 0",
              padding: "12px 14px",
              borderRadius: "12px",
              background: "linear-gradient(135deg, #FEF3C7 0%, #FFFBEB 100%)",
              border: "1.5px solid #F59E0B",
              boxShadow: "0 4px 12px rgba(180, 83, 9, 0.12)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "10px",
            }}
          >
            <div
              onClick={() => setShowAllUnavModal(true)}
              style={{ flex: 1, minWidth: 0, cursor: "pointer" }}
            >
              <div style={{ fontWeight: 800, fontSize: "0.84rem", color: "#92400E", display: "flex", alignItems: "center", gap: "6px" }}>
                <Calendar size={15} />
                <span>
                  {upcoming.length} {upcoming.length === 1 ? "ausência programada registrada" : "ausências programadas registradas"}
                </span>
              </div>
              <div style={{ fontSize: "0.76rem", color: "#78350F", marginTop: "3px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {previewText}{upcoming.length > 2 ? ` e +${upcoming.length - 2}` : ""}
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "6px", flexShrink: 0 }}>
              <button
                type="button"
                onClick={() => setShowAllUnavModal(true)}
                style={{
                  background: "#B45309",
                  color: "#fff",
                  border: "none",
                  borderRadius: "8px",
                  padding: "6px 10px",
                  fontSize: "0.74rem",
                  fontWeight: 800,
                  cursor: "pointer",
                }}
              >
                Ver todas
              </button>
              <button
                type="button"
                onClick={() => setDismissedUnavBanner(true)}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "#92400E",
                  cursor: "pointer",
                  padding: "4px",
                  display: "flex",
                  alignItems: "center",
                }}
                title="Ocultar aviso"
              >
                <X size={16} />
              </button>
            </div>
          </div>
        );
      })()}

      {/* ─── NAVEGAÇÃO DE ABAS (Fixa no rodapé no celular) ──────────────── */}
      {isAdmin && (
        <nav className="admin-tabs no-print">
          <button
            className={`admin-tab ${activeTab === "escalas" ? "active" : ""}`}
            onClick={() => setActiveTab("escalas")}
          >
            <Calendar size={18} />
            <span>Escalas</span>
          </button>
          <button
            className={`admin-tab ${activeTab === "servas" ? "active" : ""}`}
            onClick={() => setActiveTab("servas")}
          >
            <Users size={18} />
            <span>Servos</span>
          </button>
          <button
            className={`admin-tab ${activeTab === "logs" ? "active" : ""}`}
            onClick={() => setActiveTab("logs")}
          >
            <ClipboardList size={18} />
            <span>Acessos</span>
          </button>
        </nav>
      )}

      {/* ═══════════════════ ABA: ESCALAS ═══════════════════ */}
      {(activeTab === "escalas" || !isAdmin) && (
        <>
          {/* RESUMO COMPACTO EM UMA LINHA */}
          {isAdmin && (
            <div
              className="no-print"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "8px",
                padding: "8px 14px",
                background: "#FFFFFF",
                border: `1px solid ${theme.colors.borderLight}`,
                borderRadius: "10px",
                marginBottom: "10px",
                fontSize: "0.78rem",
                color: theme.colors.textSecondary,
                fontWeight: 600,
                flexWrap: "wrap",
              }}
            >
              <span><strong style={{ color: theme.colors.primary }}>{filteredMasses.length}</strong> missas</span>
              <span>•</span>
              <span><strong style={{ color: "#166534" }}>{publishedCount}</strong> publicadas</span>
              <span>•</span>
              <span><strong style={{ color: "#1D4ED8" }}>{openCount}</strong> abertas</span>
              {(massesWithPhotoCount > 0 || onlyWithPhotos) && (
                <>
                  <span>•</span>
                  <button
                    type="button"
                    onClick={() => setOnlyWithPhotos((prev) => !prev)}
                    style={{
                      background: onlyWithPhotos ? "#166534" : "#DCFCE7",
                      color: onlyWithPhotos ? "#FFFFFF" : "#166534",
                      border: "1px solid #86EFAC",
                      borderRadius: "8px",
                      padding: "2px 8px",
                      fontSize: "0.74rem",
                      fontWeight: 800,
                      cursor: "pointer",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "4px",
                    }}
                    title="Filtrar apenas missas com foto enviada pela equipe (últimos 7 dias)"
                  >
                    <Camera size={12} />
                    <span>{onlyWithPhotos ? "Mostrando Fotos (Ver todas)" : `${massesWithPhotoCount} foto(s)`}</span>
                  </button>
                </>
              )}
            </div>
          )}

          {/* BARRA DE AÇÕES: NOVA MISSA + FILTRAR + FERRAMENTAS */}
          {isAdmin && !editingId && (
            <div style={{ marginBottom: "12px" }} className="no-print">
              <div className="admin-action-bar" style={{ marginBottom: 0 }}>
                <button
                  type="button"
                  onClick={() => setShowCreateForm(!showCreateForm)}
                  className="btn-action-primary"
                  style={showCreateForm ? { background: theme.colors.dangerDark } : {}}
                >
                  {showCreateForm ? <X size={16} /> : <PlusCircle size={16} />}
                  <span>{showCreateForm ? "Fechar" : "Nova Missa"}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowFilterSection(!showFilterSection)}
                  className="btn-action-secondary"
                  style={
                    startDate || endDate
                      ? { background: "#EFECE6", borderColor: theme.colors.primary, flex: 0.9 }
                      : { flex: 0.9 }
                  }
                >
                  <Filter size={16} />
                  <span>{startDate || endDate ? "Filtro Ativo" : "Filtrar"}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowToolsModal(true)}
                  className="btn-action-secondary"
                  style={{ flex: 1 }}
                  title="Central de Ferramentas e Relatórios"
                >
                  <LayoutGrid size={16} />
                  <span>Ferramentas</span>
                </button>
              </div>
            </div>
          )}

          {/* MURAL DE AVISOS COLAPSÁVEL */}
          {isAdmin && (
            <div className="notice-accordion no-print" style={{ marginBottom: "14px" }}>
              <button
                type="button"
                className="notice-accordion-header"
                onClick={() => setShowNoticeSection(!showNoticeSection)}
              >
                <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <Megaphone size={18} />
                  Gerenciar Mural de Avisos
                </span>
                {showNoticeSection ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
              </button>
              {showNoticeSection && (
                <div className="notice-accordion-body">
                  <NoticeBoard />
                </div>
              )}
            </div>
          )}

          {/* FORMULÁRIO COLAPSÁVEL DE NOVA MISSA */}
          {isAdmin && !editingId && showCreateForm && (
            <div className="new-mass-card no-print" style={{ animation: "slideDown 0.25s ease" }}>
              <div className="section-title">
                <PlusCircle size={18} />
                <span>Cadastrar Nova Missa</span>
              </div>
              <MassForm {...massFormProps} isInline={false} />
            </div>
          )}

          {/* FILTRO DE DATAS COLAPSÁVEL */}
          {(showFilterSection || startDate || endDate) && (
            <div className="new-mass-card no-print" style={{ padding: "14px", marginBottom: "14px", animation: "slideDown 0.2s ease" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                <span style={{ fontWeight: 700, fontSize: "0.85rem", color: theme.colors.primary, display: "flex", alignItems: "center", gap: "6px" }}>
                  <Filter size={15} /> Filtrar Período de Missas
                </span>
                {(startDate || endDate) && (
                  <button
                    type="button"
                    onClick={() => { setStartDate(""); setEndDate(""); }}
                    style={{ background: "none", border: "none", color: theme.colors.danger, fontSize: "0.75rem", fontWeight: 700, cursor: "pointer" }}
                  >
                    Limpar Filtro
                  </button>
                )}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                <div className="form-group">
                  <label>De</label>
                  <input type="date" className="form-input" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                </div>
                <div className="form-group">
                  <label>Até</label>
                  <input type="date" className="form-input" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                </div>
              </div>
            </div>
          )}

          {/* PREVIEW DA IA */}
          {showAiPreview && (
            <div className="new-mass-card no-print" style={{ border: `2px solid ${theme.colors.secondary}` }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                <h3 style={{ color: theme.colors.primary, margin: 0, fontSize: "1rem", display: "flex", alignItems: "center", gap: "8px" }}>
                  <Camera size={18} /> Missas Identificadas ({aiExtractedMasses.length})
                </h3>
                <button onClick={() => setShowAiPreview(false)} style={{ background: "none", border: "none", color: "#666", cursor: "pointer" }}><X size={18} /></button>
              </div>

              <div style={{ maxHeight: "260px", overflowY: "auto", marginBottom: "14px", display: "flex", flexDirection: "column", gap: "6px" }}>
                {aiExtractedMasses.map((m, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "8px 12px",
                      background: "#F7F5F0",
                      borderRadius: "8px",
                      border: `1px solid ${theme.colors.borderLight}`,
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 700, fontSize: "0.86rem", color: "#23170F" }}>
                        {new Date(m.date + "T12:00:00").toLocaleDateString("pt-BR")} às {m.time}
                      </div>
                      <div style={{ fontSize: "0.76rem", color: theme.colors.textSecondary }}>
                        {m.name || m.local || "Santuário"}
                      </div>
                    </div>
                    <button
                      onClick={() => setAiExtractedMasses(prev => prev.filter((_, i) => i !== idx))}
                      style={{ background: "none", border: "none", color: "#B91C1C", cursor: "pointer", padding: "4px" }}
                      title="Remover"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>

              <div style={{ display: "flex", gap: "8px" }}>
                <button
                  onClick={handleConfirmAiMasses}
                  disabled={isAiLoading}
                  className="btn-action-primary"
                >
                  {isAiLoading ? <Loader2 className="animate-spin" size={16} /> : <Check size={16} />}
                  <span>CONFIRMAR TODAS</span>
                </button>
                <button
                  onClick={() => setShowAiPreview(false)}
                  className="btn-action-secondary"
                >
                  CANCELAR
                </button>
              </div>
            </div>
          )}

          {/* LISTA DE MISSAS AGRUPADA POR DIA (COM ABAS DE HORÁRIO EM DIAS COM MÚLTIPLAS MISSAS) */}
          <div className="mass-list">
            {groupedAdminMasses.length === 0 ? (
              <div style={{ textAlign: "center", padding: "40px 20px", background: "#fff", borderRadius: "14px", border: `1px dashed ${theme.colors.border}`, color: theme.colors.textMuted }}>
                <Calendar size={32} style={{ opacity: 0.35, marginBottom: "8px" }} />
                <p style={{ margin: 0, fontWeight: 600 }}>Nenhuma missa encontrada para o período.</p>
              </div>
            ) : (
              groupedAdminMasses.map((group) => {
                const dayNum = group.dateObj.toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo", day: "2-digit" });
                const monthShort = group.dateObj.toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo", month: "short" }).replace(".", "").toUpperCase();
                const weekdayLabel = group.dateObj.toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo", weekday: "long" });
                const hasSolemnity = group.masses.some((m) => m.isSolemnity);
                const isMultiMassDay = group.masses.length > 1;
                const dayTitle = group.masses.find((m) => m.name)?.name || weekdayLabel;

                // Se estiver editando uma missa deste dia, exibe ela; caso contrário usa a aba de horário selecionada (padrão: 1ª missa do dia)
                const editingInGroup = group.masses.find((m) => m.id === editingId);
                const activeMassSelection = editingInGroup
                  ? editingInGroup.id
                  : selectedDayMassId[group.dateKey] || group.masses[0].id;

                const visibleMasses =
                  !isMultiMassDay || activeMassSelection === "ALL"
                    ? group.masses
                    : group.masses.filter((m) => m.id === activeMassSelection);

                const finalMassesToShow = visibleMasses.length > 0 ? visibleMasses : [group.masses[0]];

                return (
                  <div
                    key={group.dateKey}
                    style={{
                      background: "#FFFFFF",
                      borderRadius: "16px",
                      border: hasSolemnity ? "1.5px solid #D97706" : `1px solid ${theme.colors.borderLight}`,
                      boxShadow: "0 3px 12px rgba(44, 26, 16, 0.06)",
                      marginBottom: "16px",
                      overflow: "hidden",
                    }}
                  >
                    {/* CABEÇALHO DO DIA */}
                    <div
                      style={{
                        background: hasSolemnity
                          ? "linear-gradient(135deg, #B45309 0%, #D97706 100%)"
                          : "linear-gradient(135deg, #4A3222 0%, #5A3E2B 100%)",
                        color: "#FDFBF7",
                        padding: "12px 16px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: "12px",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "12px", minWidth: 0, flex: 1 }}>
                        <div
                          style={{
                            background: "rgba(255,255,255,0.15)",
                            border: "1px solid rgba(230, 199, 134, 0.45)",
                            borderRadius: "10px",
                            padding: "6px 12px",
                            textAlign: "center",
                            lineHeight: 1.05,
                            flexShrink: 0,
                          }}
                        >
                          <div style={{ fontSize: "1.3rem", fontWeight: 900, color: "#E6C786" }}>{dayNum}</div>
                          <div style={{ fontSize: "0.68rem", fontWeight: 800, letterSpacing: "0.05em", marginTop: "2px" }}>{monthShort}</div>
                        </div>
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <div style={{ fontWeight: 800, fontSize: "0.96rem", lineHeight: 1.25, wordBreak: "break-word" }}>
                            {dayTitle}
                          </div>
                          <div style={{ fontSize: "0.74rem", opacity: 0.88, textTransform: "capitalize", marginTop: "2px" }}>
                            {weekdayLabel} • {group.masses.length} {group.masses.length === 1 ? "horário" : "horários neste dia"}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* SELETOR DE HORÁRIOS (QUANDO HÁ 2 OU MAIS MISSAS NO MESMO DIA — EX: DOMINGO COM 5 MISSAS) */}
                    {isMultiMassDay && (
                      <div
                        className="no-print"
                        style={{
                          display: "flex",
                          gap: "6px",
                          overflowX: "auto",
                          padding: "10px 14px",
                          background: "#FAF8F5",
                          borderBottom: `1px solid ${theme.colors.borderLight}`,
                          scrollbarWidth: "none",
                        }}
                      >
                        {group.masses.map((m) => {
                          const tStr = new Date(m.date).toLocaleTimeString("pt-BR", {
                            timeZone: "America/Sao_Paulo",
                            hour: "2-digit",
                            minute: "2-digit",
                          });
                          const confCount = m.signups.filter((s: any) => s.status !== "RESERVA").length;
                          const isSelectedTab = activeMassSelection === m.id;

                          return (
                            <button
                              key={m.id}
                              type="button"
                              onClick={() => setSelectedDayMassId((prev) => ({ ...prev, [group.dateKey]: m.id }))}
                              style={{
                                padding: "7px 12px",
                                borderRadius: "10px",
                                border: isSelectedTab ? `1.5px solid ${theme.colors.primary}` : `1px solid ${theme.colors.border}`,
                                background: isSelectedTab ? theme.colors.primary : "#FFFFFF",
                                color: isSelectedTab ? "#FFFFFF" : "#23170F",
                                fontWeight: 800,
                                fontSize: "0.78rem",
                                whiteSpace: "nowrap",
                                cursor: "pointer",
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "6px",
                                boxShadow: isSelectedTab ? "0 2px 8px rgba(74,50,34,0.2)" : "none",
                              }}
                            >
                              <span
                                style={{
                                  width: "7px",
                                  height: "7px",
                                  borderRadius: "50%",
                                  background: m.published ? "#22C55E" : "#F59E0B",
                                  display: "inline-block",
                                }}
                                title={m.published ? "Publicada" : "Rascunho"}
                              />
                              <span>{tStr}</span>
                              {m.hasPhoto && <span title="Foto da equipe enviada">📸</span>}
                              <span
                                style={{
                                  fontSize: "0.68rem",
                                  opacity: isSelectedTab ? 0.9 : 0.7,
                                  fontWeight: 700,
                                }}
                              >
                                ({confCount}/{m.maxServers})
                              </span>
                            </button>
                          );
                        })}

                        <button
                          type="button"
                          onClick={() => setSelectedDayMassId((prev) => ({ ...prev, [group.dateKey]: "ALL" }))}
                          style={{
                            padding: "7px 11px",
                            borderRadius: "10px",
                            border: activeMassSelection === "ALL" ? `1.5px solid ${theme.colors.primary}` : `1px solid ${theme.colors.border}`,
                            background: activeMassSelection === "ALL" ? theme.colors.primary : "#FFFFFF",
                            color: activeMassSelection === "ALL" ? "#FFFFFF" : theme.colors.textSecondary,
                            fontWeight: 700,
                            fontSize: "0.74rem",
                            whiteSpace: "nowrap",
                            cursor: "pointer",
                          }}
                        >
                          Todas ({group.masses.length})
                        </button>
                      </div>
                    )}

                    {/* CONTEÚDO DA(S) MISSA(S) SELECIONADA(S) */}
                    <div>
                      {finalMassesToShow.map((mass, idxInView) => {
                        if (editingId === mass.id) {
                          return (
                            <div key={mass.id} style={{ padding: "16px", background: "#FFFBEB", borderTop: idxInView > 0 ? `2px dashed ${theme.colors.border}` : "none" }}>
                              <div className="section-title" style={{ color: "#92400E" }}>
                                <Edit size={18} /> <span>Editando horário: {new Date(mass.date).toLocaleTimeString("pt-BR", { timeZone: "America/Sao_Paulo", hour: "2-digit", minute: "2-digit" })}</span>
                              </div>
                              <MassForm {...massFormProps} isInline={true} mass={mass} />
                            </div>
                          );
                        }

                        const massDateObj = new Date(mass.date);
                        const timeStr = massDateObj.toLocaleTimeString("pt-BR", {
                          timeZone: "America/Sao_Paulo",
                          hour: "2-digit",
                          minute: "2-digit",
                        });
                        const isPublished = mass.published;
                        const userIsIn = mass.signups.some((s) => s.userId === user.id);
                        const confirmados = mass.signups.filter((s: any) => s.status !== "RESERVA");
                        const vagasRestantes = mass.maxServers - confirmados.length;
                        const showNameList = isAdmin || isPublished;
                        const isAddExpanded = expandedAddMassId === mass.id;
                        const selectedForThisMass = selectedUserToAdd[mass.id] || [];

                        return (
                          <div
                            key={mass.id}
                            style={{
                              padding: "14px 16px",
                              borderTop: idxInView > 0 ? `2px dashed ${theme.colors.border}` : "none",
                            }}
                          >
                            {/* BARRA DO HORÁRIO: HORA + LOCAL + STATUS + AÇÕES DA MISSA */}
                            <div
                              style={{
                                display: "flex",
                                flexWrap: "wrap",
                                alignItems: "center",
                                justifyContent: "space-between",
                                gap: "8px",
                                padding: "8px 12px",
                                background: "#F7F5F0",
                                borderRadius: "10px",
                                marginBottom: "12px",
                              }}
                            >
                              <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                                <span style={{ fontWeight: 900, fontSize: "0.95rem", color: theme.colors.primary, display: "inline-flex", alignItems: "center", gap: "4px" }}>
                                  <Clock size={15} /> {timeStr}
                                </span>
                                {mass.local && (
                                  <span style={{ fontSize: "0.78rem", fontWeight: 700, color: theme.colors.textSecondary, display: "inline-flex", alignItems: "center", gap: "3px" }}>
                                    <MapPin size={13} /> {mass.local}
                                  </span>
                                )}
                                <span style={{ fontSize: "0.76rem", fontWeight: 800, color: vagasRestantes > 0 ? "#166534" : "#B91C1C" }}>
                                  • {confirmados.length}/{mass.maxServers} vagas
                                </span>
                              </div>

                              {isAdmin && (
                                <div className="no-print" style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
                                  {mass.hasPhoto ? (
                                    <button
                                      type="button"
                                      onClick={() => handleOpenPhotoModal(mass.id)}
                                      className="chip-toggle"
                                      style={{
                                        background: "#DCFCE7",
                                        color: "#166534",
                                        border: "1px solid #86EFAC",
                                        padding: "5px 9px",
                                        display: "inline-flex",
                                        alignItems: "center",
                                        gap: "4px",
                                        fontWeight: 800,
                                      }}
                                      title={`Ver foto enviada por ${mass.photoUploadedBy || "equipe"} e conferir presença`}
                                    >
                                      <Camera size={13} /> Foto
                                    </button>
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={() => handleOpenPhotoModal(mass.id)}
                                      className="btn-card-icon"
                                      style={{ width: 30, height: 30, background: "#fff" }}
                                      title="Enviar ou conferir foto da equipe"
                                    >
                                      <Camera size={14} />
                                    </button>
                                  )}
                                  <button
                                    type="button"
                                    onClick={() => handleTogglePublish(mass.id, mass.published)}
                                    className="chip-toggle"
                                    style={{
                                      background: mass.published ? "#DCFCE7" : "#FEF3C7",
                                      color: mass.published ? "#166534" : "#92400E",
                                      padding: "5px 9px",
                                    }}
                                  >
                                    {mass.published ? "● Pública" : "○ Rascunho"}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleToggleOpen(mass.id, mass.open)}
                                    className="chip-toggle"
                                    style={{
                                      background: mass.open ? "#DBEAFE" : "#E5E7EB",
                                      color: mass.open ? "#1E40AF" : "#4B5563",
                                      padding: "5px 9px",
                                    }}
                                  >
                                    {mass.open ? <><LockOpen size={12} /> Aberta</> : <><Lock size={12} /> Fechada</>}
                                  </button>
                                  <button
                                    type="button"
                                    className="btn-card-icon"
                                    style={{ width: 30, height: 30, background: "#fff" }}
                                    onClick={() => handleStartEdit(mass)}
                                    title="Editar missa ou sortear funções"
                                  >
                                    <Edit size={14} />
                                  </button>
                                  <button
                                    type="button"
                                    className="btn-card-icon danger"
                                    style={{ width: 30, height: 30 }}
                                    onClick={() => handleDeleteMass(mass.id)}
                                    title="Excluir missa"
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                </div>
                              )}
                            </div>

                            {!isAdmin && (
                              <button
                                onClick={() => handleToggleSignup(mass.id)}
                                style={{
                                  width: "100%",
                                  padding: "10px",
                                  marginBottom: "12px",
                                  borderRadius: "8px",
                                  fontWeight: "bold",
                                  cursor: "pointer",
                                  background: userIsIn ? "#FEE2E2" : vagasRestantes > 0 ? "#DCFCE7" : "#E5E7EB",
                                  color: userIsIn ? "#B91C1C" : vagasRestantes > 0 ? "#166534" : "#6B7280",
                                  border: "none",
                                }}
                                disabled={!userIsIn && vagasRestantes <= 0}
                              >
                                {userIsIn ? "SAIR DA ESCALA" : vagasRestantes > 0 ? "ENTRAR NA ESCALA" : "LOTADO"}
                              </button>
                            )}

                            {/* LISTA DE INSCRITOS EM LINHA ÚNICA LIMPA */}
                            {showNameList && (
                              <div>
                                {mass.signups.length === 0 ? (
                                  <div style={{ textAlign: "center", padding: "12px", fontSize: "0.8rem", color: theme.colors.textMuted, background: "#FAF8F5", borderRadius: "8px" }}>
                                    Nenhum(a) servo(a) escalado(a) neste horário.
                                  </div>
                                ) : (
                                  <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                                    {mass.signups
                                      .slice()
                                      .sort((a, b) => {
                                        const statusA = (a as any).status === "RESERVA" ? 1 : 0;
                                        const statusB = (b as any).status === "RESERVA" ? 1 : 0;
                                        if (statusA !== statusB) return statusA - statusB;
                                        const wA = getRoleWeight(a.role);
                                        const wB = getRoleWeight(b.role);
                                        if (wA !== wB) return wA - wB;
                                        return (a.user.name || "").localeCompare(b.user.name || "");
                                      })
                                      .map((signup) => {
                                        const isReserva = (signup as any).status === "RESERVA";
                                        const isSwap = (signup as any).isSubstitution;
                                        const substName = (signup as any).substitutedName;
                                        const rowStreak =
                                          isAdmin && !isReserva && (Boolean(signup.role) || mass.published)
                                            ? getConsecutiveRoleStreak(
                                              signup.userId,
                                              mass.id,
                                              mass.date,
                                              signup.role || "Auxiliar",
                                              masses
                                            )
                                            : null;
                                        const hasRowStreakWarning = Boolean(rowStreak && rowStreak.count >= 3);

                                        if (swappingSignupId === signup.id) {
                                          return (
                                            <div key={signup.id} className="admin-signup-row" style={{ background: "#EFF6FF", borderColor: "#BFDBFE" }}>
                                              <div style={{ fontSize: "0.78rem", fontWeight: 700, color: "#1E40AF" }}>
                                                Substituir {formatServoName(signup.user.name, signup.userId)} por:
                                              </div>
                                              <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                                                <select
                                                  autoFocus
                                                  value={selectedReplacementId}
                                                  onChange={(e) => setSelectedReplacementId(e.target.value)}
                                                  style={{ flex: 1, padding: "8px" }}
                                                >
                                                  <option value="">Selecione o(a) substituto(a)...</option>
                                                  {allUsers
                                                    .filter((u) => {
                                                      const massDateBr = new Date(mass.date).toLocaleDateString("en-CA", { timeZone: "America/Sao_Paulo" });
                                                      return !(unavailabilitiesMap[u.id] || []).some((unav) => unav.date === massDateBr);
                                                    })
                                                    .map((u) => (
                                                      <option key={u.id} value={u.id}>{formatServoName(u.name, u.id)}</option>
                                                    ))}
                                                </select>
                                                <button
                                                  type="button"
                                                  onClick={handleExecuteSwap}
                                                  style={{ padding: "8px 12px", background: "#1D4ED8", color: "#fff", border: "none", borderRadius: "8px", cursor: "pointer" }}
                                                >
                                                  <Save size={16} />
                                                </button>
                                                <button
                                                  type="button"
                                                  onClick={() => setSwappingSignupId(null)}
                                                  style={{ padding: "8px 12px", background: "#E5E7EB", color: "#374151", border: "none", borderRadius: "8px", cursor: "pointer" }}
                                                >
                                                  <X size={16} />
                                                </button>
                                              </div>
                                            </div>
                                          );
                                        }

                                        return (
                                          <div
                                            key={signup.id}
                                            style={{
                                              display: "flex",
                                              alignItems: "center",
                                              justifyContent: "space-between",
                                              gap: "8px",
                                              padding: "8px 10px",
                                              borderRadius: "9px",
                                              border: isReserva
                                                ? "1px solid #FDE68A"
                                                : hasRowStreakWarning
                                                  ? "1.5px solid #F59E0B"
                                                  : signup.present
                                                    ? "1px solid #BBF7D0"
                                                    : "1px solid #EFECE6",
                                              background: isReserva
                                                ? "#FFFBEB"
                                                : hasRowStreakWarning
                                                  ? "#FFFBEB"
                                                  : signup.present
                                                    ? "#F0FDF4"
                                                    : "#FFFFFF",
                                              flexWrap: "wrap",
                                            }}
                                          >
                                            {/* ESQUERDA: CHECK DE PRESENÇA + NOME */}
                                            <div style={{ display: "flex", alignItems: "center", gap: "8px", minWidth: "130px", flex: 1 }}>
                                              {isAdmin && !isReserva && (
                                                <button
                                                  type="button"
                                                  onClick={() => handleTogglePresence(signup.id)}
                                                  title={signup.present ? "Presença confirmada (clique para desmarcar)" : "Clique para confirmar presença"}
                                                  style={{
                                                    width: "24px",
                                                    height: "24px",
                                                    borderRadius: "50%",
                                                    border: signup.present ? "none" : "1.5px solid #C4B5A3",
                                                    background: signup.present ? "#16A34A" : "#FAF8F5",
                                                    color: signup.present ? "#FFFFFF" : "transparent",
                                                    display: "flex",
                                                    alignItems: "center",
                                                    justifyContent: "center",
                                                    cursor: "pointer",
                                                    flexShrink: 0,
                                                    padding: 0,
                                                  }}
                                                >
                                                  <Check size={14} strokeWidth={3} />
                                                </button>
                                              )}
                                              <div style={{ minWidth: 0 }}>
                                                <div style={{ fontSize: "0.88rem", fontWeight: 700, color: "#23170F", lineHeight: 1.2 }}>
                                                  {formatServoName(signup.user.name, signup.userId)}
                                                </div>
                                                {(isReserva || (isSwap && substName) || hasRowStreakWarning) && (
                                                  <div style={{ display: "flex", gap: "6px", alignItems: "center", marginTop: "2px", flexWrap: "wrap" }}>
                                                    {isReserva && (
                                                      <span style={{ fontSize: "0.65rem", background: "#FEF3C7", color: "#B45309", padding: "1px 5px", borderRadius: "4px", fontWeight: 800 }}>
                                                        RESERVA
                                                      </span>
                                                    )}
                                                    {isSwap && substName && (
                                                      <span style={{ fontSize: "0.68rem", color: "#6B7280", fontWeight: 600 }}>
                                                        🔄 Subst. {formatServoName(substName)}
                                                      </span>
                                                    )}
                                                    {hasRowStreakWarning && rowStreak && (
                                                      <span
                                                        title={`Datas seguidas nesta função: ${rowStreak.massDates.join(" → ")}`}
                                                        style={{
                                                          fontSize: "0.66rem",
                                                          background: "#FEF3C7",
                                                          color: "#B45309",
                                                          border: "1px solid #F59E0B",
                                                          padding: "1px 6px",
                                                          borderRadius: "5px",
                                                          fontWeight: 800,
                                                          display: "inline-flex",
                                                          alignItems: "center",
                                                          gap: "3px",
                                                        }}
                                                      >
                                                        ⚠️ {rowStreak.count}ª seguida nesta função ({rowStreak.massDates.join(", ")})
                                                      </span>
                                                    )}
                                                  </div>
                                                )}
                                              </div>
                                            </div>

                                            {/* DIREITA: FUNÇÃO + AÇÕES DISCRETAS */}
                                            <div style={{ display: "flex", alignItems: "center", gap: "6px", flexShrink: 0 }}>
                                              {isAdmin ? (
                                                <select
                                                  className="role-select"
                                                  style={{ minWidth: "118px", padding: "5px 8px" }}
                                                  value={signup.role || "Auxiliar"}
                                                  onChange={(e) => handleChangeRole(signup.id, e.target.value, mass, signup)}
                                                >
                                                  <option value="Auxiliar">Auxiliar</option>
                                                  <option value="Cerimoniária">{formatRole("Cerimoniária", signup.user.name, signup.userId)}</option>
                                                  <option value="Librífera">{formatRole("Librífera", signup.user.name, signup.userId)}</option>
                                                  {(getUserGender(signup.userId, signup.user.name) === "M" || signup.role === "Turiferário") && (
                                                    <option value="Turiferário">Turiferário</option>
                                                  )}
                                                  <option value="Naveteiro">{formatRole("Naveteiro", signup.user.name, signup.userId)}</option>
                                                  <option value="Lava-pés">Lava-pés</option>
                                                  <option value="Leituras">Leituras</option>
                                                  <option value="Matraca">Matraca</option>
                                                </select>
                                              ) : (
                                                <span className="tag-role" style={{ margin: 0 }}>
                                                  {formatRole(signup.role, signup.user.name, signup.userId)}
                                                </span>
                                              )}

                                              {isAdmin && (
                                                <div className="no-print" style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                                                  {isReserva ? (
                                                    <button
                                                      type="button"
                                                      onClick={() => handlePromote(signup.id)}
                                                      style={{ width: 28, height: 28, borderRadius: "7px", border: "1px solid #FDE68A", background: "#FEF3C7", color: "#B45309", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", padding: 0 }}
                                                      title="Promover para titular"
                                                    >
                                                      <ArrowUpCircle size={14} />
                                                    </button>
                                                  ) : (
                                                    <button
                                                      type="button"
                                                      onClick={() => setSwappingSignupId(signup.id)}
                                                      style={{ width: 28, height: 28, borderRadius: "7px", border: "1px solid #E5DEC9", background: "#FAF8F5", color: "#5A4332", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", padding: 0 }}
                                                      title="Substituir servo(a)"
                                                    >
                                                      <RefreshCw size={13} />
                                                    </button>
                                                  )}
                                                  <button
                                                    type="button"
                                                    onClick={() => handleRemoveSignup(signup.id)}
                                                    style={{ width: 28, height: 28, borderRadius: "7px", border: "1px solid #FECACA", background: "#FEF2F2", color: "#B91C1C", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", padding: 0 }}
                                                    title="Remover da escala"
                                                  >
                                                    <Trash2 size={13} />
                                                  </button>
                                                </div>
                                              )}
                                            </div>
                                          </div>
                                        );
                                      })}
                                  </div>
                                )}

                                {/* ADICIONAR SERVO(A) NA ESCALA */}
                                {isAdmin && (
                                  <div className="no-print" style={{ marginTop: "8px" }}>
                                    {!isAddExpanded ? (
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setExpandedAddMassId(mass.id);
                                          setAddSearchTerm("");
                                        }}
                                        style={{
                                          width: "100%",
                                          padding: "8px",
                                          background: "transparent",
                                          border: `1px dashed ${theme.colors.border}`,
                                          borderRadius: "8px",
                                          color: theme.colors.primary,
                                          fontWeight: 700,
                                          fontSize: "0.76rem",
                                          cursor: "pointer",
                                          display: "flex",
                                          alignItems: "center",
                                          justifyContent: "center",
                                          gap: "6px",
                                        }}
                                      >
                                        <UserPlus size={14} /> Adicionar Servo(a)
                                      </button>
                                    ) : (
                                      <div style={{ padding: "12px", background: "#F7F5F0", borderRadius: "10px", border: `1px solid ${theme.colors.border}` }}>
                                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                                          <strong style={{ fontSize: "0.8rem", color: theme.colors.primary }}>
                                            Selecionar servo(a) ({selectedForThisMass.length})
                                          </strong>
                                          <button
                                            type="button"
                                            onClick={() => setExpandedAddMassId(null)}
                                            style={{ background: "none", border: "none", color: "#666", cursor: "pointer" }}
                                          >
                                            <X size={16} />
                                          </button>
                                        </div>

                                        <input
                                          type="text"
                                          placeholder="Buscar nome..."
                                          value={addSearchTerm}
                                          onChange={(e) => setAddSearchTerm(e.target.value)}
                                          style={{ padding: "8px 10px", fontSize: "0.84rem", marginBottom: "8px" }}
                                        />

                                        <div style={{ maxHeight: "160px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "4px", marginBottom: "10px" }}>
                                          {allUsers
                                            .filter((u) => !mass.signups.some((s) => s.userId === u.id))
                                            .filter((u) => {
                                              const massDateBr = new Date(mass.date).toLocaleDateString("en-CA", { timeZone: "America/Sao_Paulo" });
                                              return !(unavailabilitiesMap[u.id] || []).some((unav) => unav.date === massDateBr);
                                            })
                                            .filter((u) => !addSearchTerm.trim() || u.name.toLowerCase().includes(addSearchTerm.toLowerCase()))
                                            .map((u) => {
                                              const isSelected = selectedForThisMass.includes(u.id);
                                              return (
                                                <button
                                                  key={u.id}
                                                  type="button"
                                                  onClick={() => toggleSelectUserForMass(mass.id, u.id)}
                                                  style={{
                                                    display: "flex",
                                                    justifyContent: "space-between",
                                                    alignItems: "center",
                                                    padding: "8px 10px",
                                                    borderRadius: "6px",
                                                    border: `1px solid ${isSelected ? theme.colors.primary : "#E5DEC9"}`,
                                                    background: isSelected ? theme.colors.primary : "#ffffff",
                                                    color: isSelected ? "#ffffff" : "#23170F",
                                                    fontWeight: 600,
                                                    fontSize: "0.82rem",
                                                    textAlign: "left",
                                                    textTransform: "none",
                                                    cursor: "pointer",
                                                  }}
                                                >
                                                  <span>{formatServoName(u.name, u.id)}</span>
                                                  {isSelected && <Check size={15} />}
                                                </button>
                                              );
                                            })}
                                        </div>

                                        <button
                                          type="button"
                                          onClick={() => handleAddUserToMass(mass.id)}
                                          disabled={selectedForThisMass.length === 0}
                                          className="btn-action-primary"
                                          style={{ width: "100%", opacity: selectedForThisMass.length === 0 ? 0.5 : 1 }}
                                        >
                                          <PlusCircle size={15} />
                                          <span>Confirmar Adição ({selectedForThisMass.length})</span>
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </>
      )}

      {/* ═══════════════════ ABA: SERVOS (CARDS MOBILE-FIRST) ═══════════════════ */}
      {activeTab === "servas" && isAdmin && (
        <div className="servas-tab-content" style={{ animation: "slideDown 0.25s ease" }}>
          {/* MODAL DE CRIAÇÃO/EDIÇÃO */}
          {showServaModal && (
            <div className="serva-modal-overlay" onClick={() => setShowServaModal(false)}>
              <div className="serva-modal" onClick={(e) => e.stopPropagation()}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px" }}>
                  <h3 style={{ margin: 0, color: theme.colors.primary, display: "flex", alignItems: "center", gap: "8px", fontSize: "1.05rem" }}>
                    {editingServa ? <><Edit size={18} /> Editar Cadastro</> : <><PlusCircle size={18} /> Novo(a) Servo(a)</>}
                  </h3>
                  <button onClick={() => setShowServaModal(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "#666" }}><X size={20} /></button>
                </div>

                {servaError && (
                  <div style={{ background: "#FEE2E2", color: "#B91C1C", padding: "10px 12px", borderRadius: "8px", marginBottom: "14px", fontSize: "0.82rem", fontWeight: "bold" }}>
                    {servaError}
                  </div>
                )}

                <form onSubmit={handleSaveServa} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  <div className="form-group">
                    <label>Nome Completo *</label>
                    <input className="form-input" type="text" value={servaForm.name} onChange={(e) => setServaForm(p => ({ ...p, name: e.target.value }))} required />
                  </div>
                  <div className="form-group">
                    <label>Email de Acesso *</label>
                    <input className="form-input" type="email" value={servaForm.email} onChange={(e) => setServaForm(p => ({ ...p, email: e.target.value }))} required />
                  </div>
                  {!editingServa && (
                    <div className="form-group">
                      <label>Senha *</label>
                      <input className="form-input" type="password" value={servaForm.password} onChange={(e) => setServaForm(p => ({ ...p, password: e.target.value }))} required />
                    </div>
                  )}
                  <div className="form-group">
                    <label>Data de Nascimento</label>
                    <input className="form-input" type="date" value={servaForm.birthDate} onChange={(e) => setServaForm(p => ({ ...p, birthDate: e.target.value }))} />
                  </div>
                  <div className="form-group">
                    <label>Sexo (Flexão de Cargos na Escala)</label>
                    <select className="form-input" value={servaForm.gender} onChange={(e) => setServaForm(p => ({ ...p, gender: e.target.value as "M" | "F" | "" }))}>
                      <option value="">Automático pelo nome</option>
                      <option value="F">Feminino (Serva — Cerimoniária, Librífera...)</option>
                      <option value="M">Masculino (Servo — Cerimoniário, Turiferário...)</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Status no Grupo</label>
                    <select className="form-input" value={servaForm.role} onChange={(e) => setServaForm(p => ({ ...p, role: e.target.value }))}>
                      <option value="USER">Servo(a) Ativo(a)</option>
                      <option value="em_formacao">Em Formação (Acesso ao AVA)</option>
                      <option value="INATIVO">Inativo(a) (Sem acesso ao app)</option>
                    </select>
                  </div>
                  <div style={{ display: "flex", gap: "8px", marginTop: "6px" }}>
                    <button type="submit" disabled={servaLoading} className="btn-create" style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}>
                      {servaLoading ? <Loader2 className="animate-spin" size={16} /> : <Check size={16} />}
                      {editingServa ? "SALVAR" : "CADASTRAR"}
                    </button>
                    <button type="button" onClick={() => setShowServaModal(false)} style={{ padding: "12px 16px", background: "#EFECE6", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "bold", color: "#5A4332" }}>
                      CANCELAR
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* TOPO DA ABA DE SERVOS: BUSCA + BOTÃO NOVO + FILTROS RÁPIDOS */}
          <div style={{ display: "flex", gap: "8px", marginBottom: "10px" }}>
            <div style={{ position: "relative", flex: 1 }}>
              <Search size={16} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#8C7360" }} />
              <input
                type="text"
                placeholder="Buscar por nome ou email..."
                value={servaSearch}
                onChange={(e) => setServaSearch(e.target.value)}
                style={{ paddingLeft: "36px", height: "42px" }}
              />
            </div>
            <button
              type="button"
              onClick={() => handleOpenServaModal()}
              className="btn-action-primary"
              style={{ flex: "0 0 auto", padding: "0 14px", height: "42px" }}
            >
              <PlusCircle size={16} />
              <span>Novo(a)</span>
            </button>
          </div>

          <div style={{ display: "flex", gap: "6px", overflowX: "auto", paddingBottom: "8px", marginBottom: "10px", scrollbarWidth: "none" }}>
            {[
              { id: "ALL", label: `Todos (${servasList.length})` },
              { id: "ACTIVE", label: `Ativos (${servasList.filter(s => s.role !== "em_formacao" && s.role !== "INATIVO").length})` },
              {
                id: "SUSPENDED",
                label: `Suspensos (${servasList.filter(s => suspensionsMap[s.id] && suspensionsMap[s.id].until >= todayBrStr).length})`,
              },
              { id: "FORMACAO", label: `Formação (${servasList.filter(s => s.role === "em_formacao").length})` },
              { id: "INATIVO", label: `Inativos (${servasList.filter(s => s.role === "INATIVO").length})` },
              { id: "M", label: "Servos (M)" },
              { id: "F", label: "Servas (F)" },
            ].map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setServaFilter(f.id as any)}
                style={{
                  padding: "6px 12px",
                  borderRadius: "8px",
                  border: `1px solid ${servaFilter === f.id ? theme.colors.primary : theme.colors.border}`,
                  background: servaFilter === f.id ? theme.colors.primary : "#ffffff",
                  color: servaFilter === f.id ? "#ffffff" : theme.colors.textSecondary,
                  fontSize: "0.75rem",
                  fontWeight: 700,
                  whiteSpace: "nowrap",
                  cursor: "pointer",
                  textTransform: "none",
                }}
              >
                {f.label}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setServaSortByDays((prev) => !prev)}
              style={{
                padding: "6px 12px",
                borderRadius: "8px",
                border: `1px solid ${servaSortByDays ? "#B8925A" : theme.colors.border}`,
                background: servaSortByDays ? "#FEF3C7" : "#ffffff",
                color: servaSortByDays ? "#92400E" : theme.colors.textSecondary,
                fontSize: "0.75rem",
                fontWeight: 700,
                whiteSpace: "nowrap",
                cursor: "pointer",
                textTransform: "none",
                display: "inline-flex",
                alignItems: "center",
                gap: "4px",
              }}
              title="Ordenar pelos que estão há mais dias sem escala"
            >
              <Clock size={13} />
              <span>Mais dias sem escala</span>
            </button>
            <button
              type="button"
              onClick={() => setShowAllUnavModal(true)}
              style={{
                padding: "6px 12px",
                borderRadius: "8px",
                border: "1px solid #FDE68A",
                background: "#FEF3C7",
                color: "#92400E",
                fontSize: "0.75rem",
                fontWeight: 700,
                whiteSpace: "nowrap",
                cursor: "pointer",
                textTransform: "none",
                display: "inline-flex",
                alignItems: "center",
                gap: "4px",
              }}
              title="Ver todas as ausências registradas pelos membros"
            >
              <Calendar size={13} />
              <span>Ausências ({Object.values(unavailabilitiesMap).reduce((sum, arr) => sum + arr.length, 0)})</span>
            </button>
          </div>

          {/* LISTA DE MEMBROS EM CARDS RESPONSIVOS */}
          {servaLoading && servasList.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px", color: "#888" }}>
              <Loader2 className="animate-spin" size={24} style={{ margin: "0 auto 10px" }} />
              <p>Carregando membros...</p>
            </div>
          ) : filteredServasList.length === 0 ? (
            <div style={{ textAlign: "center", padding: "36px 20px", background: "#fff", borderRadius: "12px", border: `1px dashed ${theme.colors.border}`, color: "#888" }}>
              Nenhum membro encontrado para este filtro.
            </div>
          ) : (
            <div className="servos-grid">
              {filteredServasList.map((serva) => {
                const resolvedGender = serva.gender || getUserGender(serva.id, serva.name);
                const unavList = unavailabilitiesMap[serva.id] || [];
                const initials = serva.name
                  .trim()
                  .split(/\s+/)
                  .slice(0, 2)
                  .map(p => p[0]?.toUpperCase() || "")
                  .join("");

                const isInactive = serva.role === "INATIVO";
                const activeSusp = suspensionsMap[serva.id] && suspensionsMap[serva.id].until >= todayBrStr ? suspensionsMap[serva.id] : null;
                const monthAbsInfo = monthlyAbsencesData.byUser[serva.id];
                const daysInfo = getDaysWithoutScaleInfo(serva);
                const age = getAgeFromBirthDate(serva.birthDate);

                return (
                  <div
                    key={serva.id}
                    className="servo-member-card"
                    style={isInactive ? { opacity: 0.72, background: "#FAF8F5", borderStyle: "dashed" } : {}}
                  >
                    <div style={{ display: "flex", gap: "10px", alignItems: "flex-start", minWidth: 0, flex: 1 }}>
                      <div className="servo-avatar" style={isInactive ? { background: "#E5E7EB", color: "#6B7280", borderColor: "#D1D5DB" } : {}}>
                        {initials}
                      </div>
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div style={{ fontWeight: 800, fontSize: "0.92rem", color: isInactive ? "#6B7280" : "#23170F", marginBottom: "2px", wordBreak: "break-word" }}>
                          {serva.name}
                        </div>
                        <div style={{ fontSize: "0.76rem", color: "#6B7280", wordBreak: "break-all", marginBottom: "6px" }}>
                          {serva.email}
                        </div>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: "5px", alignItems: "center" }}>
                          <span style={{ background: "#F7F5F0", color: theme.colors.primary, border: `1px solid ${theme.colors.border}`, padding: "2px 7px", borderRadius: "6px", fontWeight: 700, fontSize: "0.68rem" }}>
                            {resolvedGender === "M" ? "Servo" : "Serva"}
                          </span>
                          {isInactive ? (
                            <span style={{ background: "#FEE2E2", color: "#991B1B", padding: "2px 7px", borderRadius: "6px", fontSize: "0.68rem", fontWeight: 800 }}>
                              Inativo(a) • Sem Acesso
                            </span>
                          ) : serva.role === "em_formacao" ? (
                            <span style={{ background: "#E0F2FE", color: "#0369A1", padding: "2px 7px", borderRadius: "6px", fontSize: "0.68rem", fontWeight: 700 }}>
                              Em Formação
                            </span>
                          ) : (
                            <span style={{ background: "#DCFCE7", color: "#166534", padding: "2px 7px", borderRadius: "6px", fontSize: "0.68rem", fontWeight: 700 }}>
                              Ativo(a)
                            </span>
                          )}
                          {serva.birthDate && (
                            <span
                              title={`Nascimento: ${new Date(serva.birthDate.split("T")[0] + "T12:00:00").toLocaleDateString("pt-BR")}`}
                              style={{ fontSize: "0.7rem", color: "#5A4332", fontWeight: 600 }}
                            >
                              🎂 {new Date(serva.birthDate.split("T")[0] + "T12:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })}
                              {age !== null ? ` • ${age} ${age === 1 ? "ano" : "anos"}` : ""}
                            </span>
                          )}
                          {daysInfo && (
                            <span
                              title={daysInfo.tooltip}
                              style={{
                                fontSize: "0.68rem",
                                color: daysInfo.color,
                                background: daysInfo.bg,
                                border: `1px solid ${daysInfo.border}`,
                                padding: "2px 7px",
                                borderRadius: "6px",
                                fontWeight: 700,
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "4px",
                              }}
                            >
                              <Clock size={11} />
                              <span>{daysInfo.label}</span>
                            </span>
                          )}
                          {activeSusp && (
                            <button
                              type="button"
                              onClick={() => handleOpenSuspensionModal(serva.id, serva.name)}
                              style={{
                                fontSize: "0.68rem",
                                background: "#FEE2E2",
                                color: "#991B1B",
                                border: "1px solid #FCA5A5",
                                padding: "2px 7px",
                                borderRadius: "6px",
                                fontWeight: 800,
                                cursor: "pointer",
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "4px",
                              }}
                              title={`Suspenso de escalas de ${new Date(activeSusp.from + "T12:00:00").toLocaleDateString("pt-BR")} até ${new Date(activeSusp.until + "T12:00:00").toLocaleDateString("pt-BR")}`}
                            >
                              <Ban size={11} />
                              <span>Suspenso até {new Date(activeSusp.until + "T12:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })}</span>
                            </button>
                          )}
                          {monthAbsInfo && monthAbsInfo.count >= 3 && (
                            <button
                              type="button"
                              onClick={() =>
                                handleOpenSuspensionModal(
                                  serva.id,
                                  serva.name,
                                  `${monthAbsInfo.count} faltas no mês`,
                                  monthAbsInfo.count
                                )
                              }
                              style={{
                                fontSize: "0.68rem",
                                background: "#FEF2F2",
                                color: "#B91C1C",
                                border: "1px solid #F87171",
                                padding: "2px 7px",
                                borderRadius: "6px",
                                fontWeight: 800,
                                cursor: "pointer",
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "4px",
                              }}
                              title={`Faltas no mês atual: ${monthAbsInfo.dates.join(", ")}`}
                            >
                              <AlertTriangle size={11} />
                              <span>{monthAbsInfo.count} faltas no mês</span>
                            </button>
                          )}
                          {unavList.length > 0 && (
                            <button
                              type="button"
                              onClick={() => setUnavModalServa({ name: serva.name, items: unavList })}
                              style={{
                                fontSize: "0.68rem",
                                background: "#FEF3C7",
                                color: "#B45309",
                                border: "1px solid #FDE68A",
                                padding: "2px 7px",
                                borderRadius: "6px",
                                fontWeight: 700,
                                cursor: "pointer",
                              }}
                              title="Clique para ver as datas e motivos"
                            >
                              📅 {unavList.length} ausência(s)
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: "flex", gap: "6px", flexShrink: 0 }}>
                      {!isInactive && (
                        <button
                          type="button"
                          onClick={() => handleOpenSuspensionModal(serva.id, serva.name)}
                          className="btn-card-icon"
                          style={
                            activeSusp
                              ? { background: "#FEE2E2", color: "#991B1B", borderColor: "#F87171" }
                              : { background: "#FAF8F5", color: "#5A4332", borderColor: theme.colors.border }
                          }
                          title={activeSusp ? "Gerenciar/Remover suspensão de escalas" : "Suspender de pegar escalas por período (mantém acesso ao app)"}
                        >
                          <Ban size={15} />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleToggleActiveServa(serva)}
                        className="btn-card-icon"
                        style={
                          isInactive
                            ? { background: "#DCFCE7", color: "#166534", borderColor: "#BBF7D0" }
                            : { background: "#FEF3C7", color: "#B45309", borderColor: "#FDE68A" }
                        }
                        title={isInactive ? "Reativar acesso ao app" : "Inativar acesso ao app (sem excluir cadastro)"}
                      >
                        {isInactive ? <UserCheck size={15} /> : <UserX size={15} />}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleOpenServaModal(serva)}
                        className="btn-card-icon"
                        title="Editar cadastro"
                      >
                        <Edit size={15} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteServa(serva)}
                        className="btn-card-icon danger"
                        title="Excluir cadastro permanentemente"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ═══════════════════ ABA: LOGS ═══════════════════ */}
      {activeTab === "logs" && isAdmin && (
        <div style={{ animation: "slideDown 0.25s ease" }}>
          <div
            style={{
              background: "#fff",
              borderRadius: "14px",
              padding: "16px",
              border: `1px solid ${theme.colors.borderLight}`,
              boxShadow: `0 2px 10px ${theme.colors.shadowBase}`,
            }}
          >
            <Suspense fallback={<div style={{ padding: 20, textAlign: "center" }}>Carregando logs...</div>}>
              <LoginLogs />
            </Suspense>
          </div>
        </div>
      )}
      {/* MODAL DE AUSÊNCIAS REGISTRADAS */}
      {(unavModalServa || showAllUnavModal) && (
        <div
          onClick={() => {
            setUnavModalServa(null);
            setShowAllUnavModal(false);
          }}
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0,0,0,0.55)",
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "16px",
            backdropFilter: "blur(3px)",
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: "#FAF8F5",
              width: "100%",
              maxWidth: "430px",
              maxHeight: "80vh",
              borderRadius: "16px",
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
              border: `1px solid ${theme.colors.border}`,
              boxShadow: "0 20px 50px rgba(0,0,0,0.3)",
            }}
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
                <div style={{ fontWeight: 800, fontSize: "1rem" }}>
                  {unavModalServa ? `Ausências — ${unavModalServa.name}` : "Todas as Ausências Registradas"}
                </div>
                <div style={{ fontSize: "0.74rem", opacity: 0.9 }}>
                  Indisponibilidades informadas pelos membros
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setUnavModalServa(null);
                  setShowAllUnavModal(false);
                }}
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

            <div style={{ padding: "14px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "8px" }}>
              {(() => {
                const rows = unavModalServa
                  ? unavModalServa.items.map((item) => ({
                    userName: unavModalServa.name,
                    date: item.date,
                    reason: item.reason,
                  }))
                  : Object.entries(unavailabilitiesMap).flatMap(([uid, items]) => {
                    const memberName =
                      servasList.find((s) => s.id === uid)?.name ||
                      allUsers.find((u) => u.id === uid)?.name ||
                      "Membro";
                    return (items || []).map((item) => ({
                      userName: memberName,
                      date: item.date,
                      reason: item.reason,
                    }));
                  });

                rows.sort((a, b) => a.date.localeCompare(b.date));

                if (rows.length === 0) {
                  return (
                    <div style={{ textAlign: "center", padding: "24px 10px", color: "#888", fontSize: "0.86rem" }}>
                      Nenhuma ausência registrada até o momento.
                    </div>
                  );
                }

                return rows.map((r, i) => (
                  <div
                    key={`${r.userName}-${r.date}-${i}`}
                    style={{
                      background: "#fff",
                      border: "1px solid #E5DEC9",
                      borderRadius: "10px",
                      padding: "10px 12px",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      gap: "10px",
                    }}
                  >
                    <div style={{ minWidth: 0 }}>
                      {!unavModalServa && (
                        <div style={{ fontWeight: 800, fontSize: "0.86rem", color: "#23170F" }}>
                          {r.userName}
                        </div>
                      )}
                      <div style={{ fontSize: "0.78rem", color: "#5A4332", fontWeight: 600 }}>
                        {r.reason || "Indisponível"}
                      </div>
                    </div>
                    <span
                      style={{
                        background: "#FEF3C7",
                        color: "#92400E",
                        border: "1px solid #FDE68A",
                        padding: "3px 8px",
                        borderRadius: "8px",
                        fontSize: "0.74rem",
                        fontWeight: 800,
                        whiteSpace: "nowrap",
                      }}
                    >
                      {new Date(r.date + "T12:00:00").toLocaleDateString("pt-BR")}
                    </span>
                  </div>
                ));
              })()}
            </div>
          </div>
        </div>
      )}

      {/* MODAL: SERVOS COM 3+ FALTAS NO MÊS */}
      {showMonthlyAbsencesModal && isAdmin && (
        <div
          onClick={() => setShowMonthlyAbsencesModal(false)}
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0,0,0,0.6)",
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "16px",
            backdropFilter: "blur(3px)",
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: "#FAF8F5",
              width: "100%",
              maxWidth: "460px",
              maxHeight: "82vh",
              borderRadius: "16px",
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
              border: "1.5px solid #EF4444",
              boxShadow: "0 20px 50px rgba(0,0,0,0.35)",
            }}
          >
            <div
              style={{
                background: "linear-gradient(135deg, #991B1B 0%, #DC2626 100%)",
                color: "#fff",
                padding: "14px 16px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div>
                <div style={{ fontWeight: 800, fontSize: "1rem", display: "flex", alignItems: "center", gap: "7px" }}>
                  <AlertTriangle size={18} />
                  <span>Servos com 3+ Faltas no Mês</span>
                </div>
                <div style={{ fontSize: "0.74rem", opacity: 0.92 }}>
                  Escalados em missas já encerradas sem confirmação de presença
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowMonthlyAbsencesModal(false)}
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

            <div style={{ padding: "14px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "10px" }}>
              {monthlyAbsencesData.listThreePlus.length === 0 ? (
                <div style={{ textAlign: "center", padding: "24px 10px", color: "#888", fontSize: "0.86rem" }}>
                  Nenhum servo atingiu 3 faltas neste mês.
                </div>
              ) : (
                monthlyAbsencesData.listThreePlus.map((item) => {
                  const activeSusp =
                    suspensionsMap[item.userId] && suspensionsMap[item.userId].until >= todayBrStr
                      ? suspensionsMap[item.userId]
                      : null;

                  return (
                    <div
                      key={item.userId}
                      style={{
                        background: "#fff",
                        border: "1px solid #FECACA",
                        borderRadius: "12px",
                        padding: "12px",
                        display: "flex",
                        flexDirection: "column",
                        gap: "8px",
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                        <div style={{ fontWeight: 800, fontSize: "0.92rem", color: "#23170F" }}>
                          {item.userName}
                        </div>
                        <span
                          style={{
                            background: "#FEE2E2",
                            color: "#991B1B",
                            border: "1px solid #F87171",
                            padding: "2px 8px",
                            borderRadius: "8px",
                            fontSize: "0.74rem",
                            fontWeight: 800,
                          }}
                        >
                          {item.count} faltas no mês
                        </span>
                      </div>
                      <div style={{ fontSize: "0.76rem", color: "#5A4332", fontWeight: 600 }}>
                        Missas sem presença: {item.dates.join(" • ")}
                      </div>
                      {activeSusp && (
                        <div style={{ fontSize: "0.74rem", color: "#991B1B", fontWeight: 800, background: "#FEF2F2", padding: "5px 8px", borderRadius: "7px" }}>
                          🚫 Já suspenso(a) até {new Date(activeSusp.until + "T12:00:00").toLocaleDateString("pt-BR")}
                          {activeSusp.reason ? ` (${activeSusp.reason})` : ""}
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          setShowMonthlyAbsencesModal(false);
                          handleOpenSuspensionModal(
                            item.userId,
                            item.userName,
                            `${item.count} faltas no mês`,
                            item.count
                          );
                        }}
                        style={{
                          padding: "8px 12px",
                          borderRadius: "8px",
                          border: "none",
                          background: activeSusp ? "#4A3222" : "#B91C1C",
                          color: "#fff",
                          fontWeight: 800,
                          fontSize: "0.78rem",
                          cursor: "pointer",
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: "6px",
                        }}
                      >
                        <Ban size={14} />
                        <span>{activeSusp ? "Gerenciar Suspensão" : "Suspender de Pegar Escalas"}</span>
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL: SUSPENDER DE PEGAR ESCALAS POR PERÍODO */}
      {suspensionModalServa && isAdmin && (
        <div
          onClick={() => setSuspensionModalServa(null)}
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0,0,0,0.6)",
            zIndex: 10020,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "16px",
            backdropFilter: "blur(3px)",
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: "#FAF8F5",
              width: "100%",
              maxWidth: "420px",
              borderRadius: "16px",
              overflow: "hidden",
              border: `1.5px solid ${theme.colors.border}`,
              boxShadow: "0 20px 50px rgba(0,0,0,0.35)",
            }}
          >
            <div
              style={{
                background: "linear-gradient(135deg, #7F1D1D 0%, #B91C1C 100%)",
                color: "#fff",
                padding: "14px 16px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div>
                <div style={{ fontWeight: 800, fontSize: "0.98rem", display: "flex", alignItems: "center", gap: "7px" }}>
                  <Ban size={18} />
                  <span>Suspender Escalas — {suspensionModalServa.name}</span>
                </div>
                <div style={{ fontSize: "0.73rem", opacity: 0.92 }}>
                  Mantém acesso ao app, mas impede de pegar novas escalas no período
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSuspensionModalServa(null)}
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

            <form onSubmit={handleSaveSuspension} style={{ padding: "16px", display: "flex", flexDirection: "column", gap: "12px" }}>
              <div style={{ fontSize: "0.76rem", color: "#5A4332", fontWeight: 700 }}>
                Atalhos rápidos a partir de hoje:
              </div>
              <div style={{ display: "flex", gap: "8px" }}>
                {[7, 15, 30].map((days) => (
                  <button
                    key={days}
                    type="button"
                    onClick={() => {
                      const t = getTodayBrDateStr();
                      setSuspensionFrom(t);
                      setSuspensionUntil(addDaysToDateStr(t, days));
                    }}
                    style={{
                      flex: 1,
                      padding: "7px 8px",
                      borderRadius: "8px",
                      border: `1px solid ${theme.colors.border}`,
                      background: "#FFFFFF",
                      color: theme.colors.primary,
                      fontWeight: 800,
                      fontSize: "0.76rem",
                      cursor: "pointer",
                    }}
                  >
                    {days} dias
                  </button>
                ))}
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                <div className="form-group">
                  <label>De (Início) *</label>
                  <input
                    type="date"
                    className="form-input"
                    value={suspensionFrom}
                    onChange={(e) => setSuspensionFrom(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Até (Fim) *</label>
                  <input
                    type="date"
                    className="form-input"
                    value={suspensionUntil}
                    min={suspensionFrom || undefined}
                    onChange={(e) => setSuspensionUntil(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Motivo (Opcional — exibido para o membro)</label>
                <input
                  type="text"
                  className="form-input"
                  value={suspensionReason}
                  onChange={(e) => setSuspensionReason(e.target.value)}
                  placeholder="Ex: 3 faltas sem aviso no mês"
                />
              </div>

              <div style={{ display: "flex", gap: "8px", marginTop: "4px", flexWrap: "wrap" }}>
                <button
                  type="submit"
                  disabled={suspensionLoading}
                  style={{
                    flex: 1,
                    padding: "11px 14px",
                    borderRadius: "9px",
                    border: "none",
                    background: "#B91C1C",
                    color: "#fff",
                    fontWeight: 800,
                    fontSize: "0.84rem",
                    cursor: suspensionLoading ? "not-allowed" : "pointer",
                  }}
                >
                  {suspensionLoading ? "Salvando..." : "Confirmar Suspensão"}
                </button>
                {suspensionModalServa.current && (
                  <button
                    type="button"
                    disabled={suspensionLoading}
                    onClick={() => handleRemoveSuspension(suspensionModalServa.id)}
                    style={{
                      padding: "11px 12px",
                      borderRadius: "9px",
                      border: "1px solid #BBF7D0",
                      background: "#DCFCE7",
                      color: "#166534",
                      fontWeight: 800,
                      fontSize: "0.8rem",
                      cursor: "pointer",
                    }}
                  >
                    Remover Suspensão
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
