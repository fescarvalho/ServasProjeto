import { useState, useEffect, lazy, Suspense } from "react";
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
  User as UserIcon,
  Camera,
  Loader2,
  Check,
  Megaphone,
  Calendar,
  Users,
  ClipboardList,
  QrCode,
  ChevronDown,
  ChevronUp,
  Search,
  LogOut,
  Clock,
  MapPin,
  UserPlus,
  UserX,
  UserCheck
} from "lucide-react";
import { Mass, User, Signup } from "../types/types";
import { formatRole, setGlobalUserGenders, getUserGender } from "../constants/roles";
import { useMasses } from "../hooks/useMasses";
import { useSignup } from "../hooks/useSignup";
import { getRoleWeight } from "../utils/format.utils";
import { getMassPoints } from "../utils/ranking.utils";
import { toLocalDate, toLocalDateTime } from "../utils/date.utils";
import { APP_CONFIG } from "../constants/config";
import { getUsersList } from "../services/api/notice.service";
import {
  getServasList,
  createServa,
  updateServa,
  deleteServa,
  getUserMetadata,
  ServaData,
  UnavailabilityItem
} from "../services/api/user.service";
import { autoAssign } from "../utils/autoAssign";
import { NoticeBoard } from "./NoticeBoard";
import { theme } from "../theme/theme";
import "./css/AdminPanel.css";

const ScaleModal = lazy(() => import("./ScaleModal").then((m) => ({ default: m.ScaleModal })));
const OfficialDocument = lazy(() => import("./OfficialDocument").then((m) => ({ default: m.OfficialDocument })));
const StatisticsModal = lazy(() => import("./StatisticsModal").then((m) => ({ default: m.StatisticsModal })));
const RankingModal = lazy(() => import("./RankingModal").then((m) => ({ default: m.RankingModal })));
const LoginLogs = lazy(() => import("./LoginLogs").then((m) => ({ default: m.LoginLogs })));
const ReminderModal = lazy(() => import("./ReminderModal").then((m) => ({ default: m.ReminderModal })));
const AdminQuizManager = lazy(() => import("./AdminQuizManager").then((m) => ({ default: m.AdminQuizManager })));

// ── MassForm extracted OUTSIDE AdminPanel to prevent unmount on every keystroke ──
interface MassFormProps {
  isInline?: boolean;
  mass?: Mass;
  allMasses?: Mass[];
  localSignups?: Signup[];
  setLocalSignups?: React.Dispatch<React.SetStateAction<Signup[]>>;
  unavailabilitiesMap?: Record<string, UnavailabilityItem[]>;
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
  handleCancelEdit: () => void;
}

function MassForm({
  isInline = false,
  mass,
  allMasses,
  localSignups,
  setLocalSignups,
  unavailabilitiesMap = {},
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
          placeholder={`Padrão (${pointsPreview} pt)`}
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
                return (
                  <div
                    key={s.id}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      gap: "8px",
                      padding: "8px 10px",
                      background: unavItem ? "#FFFBEB" : "#fff",
                      borderRadius: "8px",
                      border: `1px solid ${unavItem ? "#FDE68A" : "#E5DEC9"}`,
                    }}
                  >
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ fontSize: "0.84rem", fontWeight: 700, color: "#23170F" }}>
                        {s.user?.name || "Desconhecido"}
                      </div>
                      <div style={{ fontSize: "0.7rem", fontWeight: 700, color: s.status === "CONFIRMADO" ? "#2E7D32" : "#D97706" }}>
                        {s.status}
                        {unavItem && ` • ⚠️ Indisponível (${unavItem.reason || "Ausência"})`}
                      </div>
                    </div>
                    <select
                      value={s.role || ""}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (setLocalSignups) {
                          setLocalSignups((prev: Signup[]) => prev.map((item: Signup) => item.id === s.id ? { ...item, role: val || null } : item));
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

  const { createMass, deleteMass, togglePublish, toggleOpen, patchMass, uploadScheduleImage } = useMasses();

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
  const [showQrModal, setShowQrModal] = useState(false);
  const [showNoticeSection, setShowNoticeSection] = useState(false);
  const [showFilterSection, setShowFilterSection] = useState(false);
  const [expandedAddMassId, setExpandedAddMassId] = useState<string | null>(null);
  const [addSearchTerm, setAddSearchTerm] = useState("");
  const [unavailabilitiesMap, setUnavailabilitiesMap] = useState<Record<string, UnavailabilityItem[]>>({});

  // Form visibility
  const [showCreateForm, setShowCreateForm] = useState(false);

  // ── SISTEMA DE ABAS ──
  const [activeTab, setActiveTab] = useState<"escalas" | "servas" | "logs" | "quizzes">("escalas");

  // ── CRUD DE SERVOS ──
  const [servasList, setServasList] = useState<ServaData[]>([]);
  const [servaSearch, setServaSearch] = useState("");
  const [servaFilter, setServaFilter] = useState<"ALL" | "ACTIVE" | "FORMACAO" | "INATIVO" | "M" | "F">("ALL");
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

  // Carrega lista de usuários e metadados para o Admin
  useEffect(() => {
    getUserMetadata()
      .then((meta) => {
        if (meta?.genders) setGlobalUserGenders(meta.genders);
        if (meta?.unavailabilities) setUnavailabilitiesMap(meta.unavailabilities);
      })
      .catch(() => {});

    if (isAdmin) {
      getUsersList()
        .then((users) => setAllUsers(users))
        .catch(console.error);
    }
  }, [isAdmin]);

  const loadServas = async () => {
    try {
      setServaLoading(true);
      const [list, meta] = await Promise.all([getServasList(), getUserMetadata()]);
      if (meta?.genders) setGlobalUserGenders(meta.genders);
      if (meta?.unavailabilities) setUnavailabilitiesMap(meta.unavailabilities);
      setServasList(list.filter(s => s.role !== "ADMIN"));
    } catch (err) {
      console.error("Erro ao carregar servos:", err);
    } finally {
      setServaLoading(false);
    }
  };

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

  const filteredMasses = masses.filter((mass) => {
    const massDate = new Date(mass.date);
    const massDateStr = new Date(massDate.getTime() - massDate.getTimezoneOffset() * 60000).toISOString().split("T")[0];

    if (startDate && massDateStr < startDate) return false;
    if (endDate && massDateStr > endDate) return false;

    if (!startDate && !endDate) {
      const today = new Date();
      const todayStr = new Date(today.getTime() - today.getTimezoneOffset() * 60000).toISOString().split("T")[0];
      if (massDateStr < todayStr) return false;
    }

    if (mass.name?.includes("Ajuste de Pontos")) return false;
    return true;
  });

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

      if (!currentOpen) {
        const mass = masses.find(m => m.id === id);
        if (mass) {
          const formattedDate = new Date(mass.date).toLocaleDateString("pt-BR", { day: "2-digit", month: "long" });
          const text = encodeURIComponent(`📅 *Atenção, Servos e Servas!*\n\nAs inscrições para a missa do dia *${formattedDate}* foram *Abertas*!\n\nCorra no aplicativo e garanta o seu horário acessando a aba de Inscrições.\n🔗 https://servasdoaltar.vercel.app/`);
          window.open(`https://api.whatsapp.com/send?text=${text}`, "_blank");
        }
      }
    } catch (error) {
      console.error(error);
      alert("Erro ao alterar cadeado.");
    }
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

  async function handleChangeRole(signupId: string, newRole: string) {
    try {
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

  const filteredServasList = servasList.filter((s) => {
    const matchesSearch =
      !servaSearch.trim() ||
      s.name.toLowerCase().includes(servaSearch.toLowerCase()) ||
      s.email.toLowerCase().includes(servaSearch.toLowerCase());
    if (!matchesSearch) return false;

    const g = s.gender || getUserGender(s.id, s.name);
    if (servaFilter === "ACTIVE") return s.role === "USER" || (!s.role);
    if (servaFilter === "FORMACAO") return s.role === "em_formacao";
    if (servaFilter === "INATIVO") return s.role === "INATIVO";
    if (servaFilter === "M") return g === "M" && s.role !== "INATIVO";
    if (servaFilter === "F") return g === "F" && s.role !== "INATIVO";
    return true;
  });

  return (
    <div className="admin-container">
      {/* MODAIS LAZY */}
      <Suspense fallback={null}>
        {showTextModal && isAdmin && <ScaleModal masses={filteredMasses} onClose={() => setShowTextModal(false)} />}
        {showRankingModal && isAdmin && <RankingModal masses={masses} onClose={() => setShowRankingModal(false)} />}
        {showStatsModal && isAdmin && <StatisticsModal masses={masses} onClose={() => setShowStatsModal(false)} />}
        {showReminderModal && isAdmin && <ReminderModal masses={masses} onClose={() => setShowReminderModal(false)} />}
      </Suspense>

      {showQrModal && isAdmin && (
        <div
          className="qr-print-overlay"
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.65)",
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "16px",
            overflowY: "auto",
          }}
          onClick={() => setShowQrModal(false)}
        >
          <div
            className="qr-print-card"
            style={{
              background: "white",
              width: "100%",
              maxWidth: "420px",
              borderRadius: "16px",
              padding: "28px 24px",
              textAlign: "center",
              boxShadow: "0 12px 30px rgba(0,0,0,0.3)",
              border: `2px solid ${theme.colors.primary}`,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ fontSize: "0.72rem", fontWeight: 800, letterSpacing: "1px", textTransform: "uppercase", color: theme.colors.textSecondary, marginBottom: "4px" }}>
              Santuário Diocesano N. Sra. da Natividade
            </div>
            <div style={{ fontSize: "0.82rem", fontWeight: 800, color: theme.colors.primary, fontFamily: "'Cinzel', Georgia, serif", marginBottom: "14px" }}>
              GRUPO DE SERVOS E SERVAS SANTA TEREZINHA
            </div>

            <div style={{ background: "#F7F5F0", border: `1px solid ${theme.colors.border}`, borderRadius: "10px", padding: "12px 14px", marginBottom: "16px" }}>
              <h2 style={{ margin: "0 0 4px 0", color: theme.colors.primary, fontSize: "1.25rem", fontFamily: "'Cinzel', Georgia, serif", letterSpacing: "0.5px" }}>
                CONFIRME SUA PRESENÇA
              </h2>
              <p style={{ margin: 0, fontSize: "0.88rem", color: theme.colors.textMain, fontWeight: 600 }}>
                Está escalado(a) para servir nesta Santa Missa? Realize seu check-in ao chegar na sacristia!
              </p>
            </div>

            <div style={{ padding: "16px", background: "#fff", border: `2px solid ${theme.colors.primary}`, borderRadius: "14px", display: "inline-block", marginBottom: "16px" }}>
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=260x260&data=${encodeURIComponent("https://servasdoaltar.vercel.app/escalas?checkin=1")}`}
                alt="QR Code Check-in de Presença"
                width={220}
                height={220}
                style={{ display: "block" }}
              />
            </div>

            <div style={{ textAlign: "left", background: "#FAF8F5", border: `1px solid ${theme.colors.borderLight}`, borderRadius: "10px", padding: "12px 14px", marginBottom: "16px", fontSize: "0.83rem", color: theme.colors.textMain, lineHeight: 1.5 }}>
              <strong style={{ display: "block", color: theme.colors.primary, marginBottom: "6px", fontSize: "0.84rem", textTransform: "uppercase" }}>
                📱 Como confirmar sua presença:
              </strong>
              <div><strong>1.</strong> Abra a câmera do seu celular e aponte para o QR Code acima.</div>
              <div><strong>2.</strong> Toque no link que aparecer na tela para abrir o aplicativo.</div>
              <div><strong>3.</strong> Pronto! Sua presença na escala de hoje será registrada automaticamente.</div>
            </div>

            <p style={{ margin: "0 0 18px 0", fontSize: "0.78rem", fontStyle: "italic", color: theme.colors.textSecondary, fontWeight: 600 }}>
              "Servir ao Altar com zelo, pontualidade e alegria."
            </p>

            <div className="no-print" style={{ display: "flex", gap: "10px" }}>
              <button
                type="button"
                onClick={() => window.print()}
                style={{ flex: 1.3, padding: "12px", background: theme.colors.primaryGradient, color: "white", border: "none", borderRadius: "8px", fontWeight: "bold", cursor: "pointer" }}
              >
                🖨️ Imprimir Cartaz
              </button>
              <button
                type="button"
                onClick={() => setShowQrModal(false)}
                style={{ flex: 0.7, padding: "12px", background: "#EFECE6", color: "#4A3222", border: "none", borderRadius: "8px", fontWeight: "bold", cursor: "pointer" }}
              >
                Fechar
              </button>
            </div>

            <style>{`
              @media print {
                body * {
                  visibility: hidden !important;
                }
                .qr-print-overlay,
                .qr-print-overlay * {
                  visibility: visible !important;
                }
                .qr-print-overlay {
                  position: absolute !important;
                  inset: 0 !important;
                  background: #ffffff !important;
                  padding: 0 !important;
                  display: flex !important;
                  align-items: center !important;
                  justify-content: center !important;
                }
                .qr-print-card {
                  box-shadow: none !important;
                  max-width: 520px !important;
                  width: 100% !important;
                  padding: 36px !important;
                  border: 3px solid #4A3222 !important;
                }
                .qr-print-card .no-print {
                  display: none !important;
                }
              }
            `}</style>
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

      {/* ─── 2. CENTRAL DE FERRAMENTAS RÁPIDAS (3x2 no mobile) ─────────────── */}
      {isAdmin && (
        <div className="admin-tools-grid no-print">
          <button className="tool-card-btn" onClick={() => setShowStatsModal(true)}>
            <div className="tool-card-icon" style={{ background: "#EFF6FF", color: "#1D4ED8" }}>
              <BarChart2 size={18} />
            </div>
            <span>Relatório</span>
          </button>

          <button className="tool-card-btn" onClick={() => setShowRankingModal(true)}>
            <div className="tool-card-icon" style={{ background: "#FEF3C7", color: "#B45309" }}>
              <Trophy size={18} />
            </div>
            <span>Ranking</span>
          </button>

          <button className="tool-card-btn" onClick={() => setShowTextModal(true)}>
            <div className="tool-card-icon" style={{ background: "#ECFDF5", color: "#047857" }}>
              <Edit size={18} />
            </div>
            <span>Texto Zap</span>
          </button>

          <button className="tool-card-btn" onClick={() => setShowReminderModal(true)}>
            <div className="tool-card-icon" style={{ background: "#F7F5F0", color: "#4A3222" }}>
              <Megaphone size={18} />
            </div>
            <span>Lembretes</span>
          </button>

          <button className="tool-card-btn" onClick={() => setShowQrModal(true)}>
            <div className="tool-card-icon" style={{ background: "#F7F5F0", color: "#4A3222" }}>
              <QrCode size={18} />
            </div>
            <span>QR Check-in</span>
          </button>

          <button className="tool-card-btn" onClick={() => setViewMode("pdf")}>
            <div className="tool-card-icon" style={{ background: "#FEF2F2", color: "#B91C1C" }}>
              <FileText size={18} />
            </div>
            <span>Gerar PDF</span>
          </button>
        </div>
      )}

      {/* ─── 3. MURAL DE AVISOS COLAPSÁVEL (Economiza espaço vertical no celular) ─ */}
      {isAdmin && (
        <div className="notice-accordion no-print">
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

      {/* ─── 4. NAVEGAÇÃO DE ABAS (Fixa no rodapé no celular) ──────────────── */}
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
            className={`admin-tab ${activeTab === "quizzes" ? "active" : ""}`}
            onClick={() => setActiveTab("quizzes")}
          >
            <FileText size={18} />
            <span>AVA</span>
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
          {/* RESUMO RÁPIDO (KPIs) */}
          {isAdmin && (
            <div className="admin-kpi-row no-print">
              <div className="admin-kpi-card">
                <div className="admin-kpi-value">{filteredMasses.length}</div>
                <div className="admin-kpi-label">Missas</div>
              </div>
              <div className="admin-kpi-card">
                <div className="admin-kpi-value" style={{ color: "#2E7D32" }}>{publishedCount}</div>
                <div className="admin-kpi-label">Publicadas</div>
              </div>
              <div className="admin-kpi-card">
                <div className="admin-kpi-value" style={{ color: "#1D4ED8" }}>{openCount}</div>
                <div className="admin-kpi-label">Inscrições Abertas</div>
              </div>
            </div>
          )}

          {/* BARRA DE AÇÕES PRINCIPAL: NOVA MISSA + IMPORTAR IA + FILTRAR */}
          {isAdmin && !editingId && (
            <div className="admin-action-bar no-print">
              <button
                type="button"
                onClick={() => setShowCreateForm(!showCreateForm)}
                className="btn-action-primary"
                style={showCreateForm ? { background: theme.colors.dangerDark } : {}}
              >
                {showCreateForm ? <X size={16} /> : <PlusCircle size={16} />}
                <span>{showCreateForm ? "Fechar" : "Nova Missa"}</span>
              </button>

              <label
                className="btn-action-secondary"
                style={{ cursor: isAiLoading ? "not-allowed" : "pointer", margin: 0 }}
              >
                {isAiLoading ? <Loader2 className="animate-spin" size={16} /> : <Camera size={16} />}
                <span>{isAiLoading ? "Lendo..." : "Agenda IA"}</span>
                <input
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={handleAiUpload}
                  style={{ display: "none" }}
                  disabled={isAiLoading}
                />
              </label>

              <button
                type="button"
                onClick={() => setShowFilterSection(!showFilterSection)}
                className="btn-action-secondary"
                style={
                  startDate || endDate
                    ? { background: "#EFECE6", borderColor: theme.colors.primary, flex: 0.85 }
                    : { flex: 0.85 }
                }
              >
                <Filter size={16} />
                <span>{startDate || endDate ? "Filtro Ativo" : "Filtrar"}</span>
              </button>
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

          {/* LISTA DE MISSAS (CARDS MOBILE-FIRST) */}
          <div className="mass-list">
            {filteredMasses.length === 0 ? (
              <div style={{ textAlign: "center", padding: "40px 20px", background: "#fff", borderRadius: "14px", border: `1px dashed ${theme.colors.border}`, color: theme.colors.textMuted }}>
                <Calendar size={32} style={{ opacity: 0.35, marginBottom: "8px" }} />
                <p style={{ margin: 0, fontWeight: 600 }}>Nenhuma missa encontrada para o período.</p>
              </div>
            ) : (
              filteredMasses.map((mass) => {
                if (editingId === mass.id) {
                  return (
                    <div key={mass.id} className="new-mass-card no-print" style={{ borderColor: "#D97706", background: "#FFFBEB" }}>
                      <div className="section-title" style={{ color: "#92400E" }}>
                        <Edit size={18} /> <span>Editando: {mass.name || "Missa"}</span>
                      </div>
                      <MassForm {...massFormProps} isInline={true} mass={mass} />
                    </div>
                  );
                }

                const massDateObj = new Date(mass.date);
                const isPublished = mass.published;
                const userIsIn = mass.signups.some(s => s.userId === user.id);
                const confirmados = mass.signups.filter((s: any) => s.status !== "RESERVA");
                const vagasRestantes = mass.maxServers - confirmados.length;
                const showNameList = isAdmin || isPublished;
                const isAddExpanded = expandedAddMassId === mass.id;
                const selectedForThisMass = selectedUserToAdd[mass.id] || [];

                return (
                  <div key={mass.id} className={`admin-mass-card ${mass.isSolemnity ? "solemnity" : ""}`}>
                    {/* TOPO DO CARD: DATA + TÍTULO/META + EDITAR/EXCLUIR */}
                    <div className="admin-mass-top">
                      <div style={{ display: "flex", gap: "12px", alignItems: "flex-start", flex: 1, minWidth: 0 }}>
                        <div className={`admin-date-box ${mass.isSolemnity ? "solemnity" : ""}`}>
                          <span className="day">{massDateObj.getDate()}</span>
                          <span className="month">
                            {massDateObj.toLocaleDateString("pt-BR", { month: "short" }).replace(".", "")}
                          </span>
                        </div>

                        <div className="admin-mass-meta">
                          {mass.isSolemnity && (
                            <span style={{ fontSize: "0.68rem", background: "#FEF3C7", color: "#B45309", border: "1px solid #FDE68A", padding: "2px 7px", borderRadius: "6px", fontWeight: 800, display: "inline-block", marginBottom: "4px" }}>
                              👑 SOLENIDADE
                            </span>
                          )}
                          <h3 className="admin-mass-title">
                            {mass.name || massDateObj.toLocaleDateString("pt-BR", { weekday: "long" })}
                          </h3>
                          <div className="admin-mass-sub">
                            <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                              <Clock size={13} />
                              {massDateObj.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                            </span>
                            <span style={{ textTransform: "capitalize" }}>
                              • {massDateObj.toLocaleDateString("pt-BR", { weekday: "short" }).replace(".", "")}
                            </span>
                            {mass.local && (
                              <span style={{ display: "inline-flex", alignItems: "center", gap: "3px", color: theme.colors.primary }}>
                                <MapPin size={13} /> {mass.local}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {isAdmin && (
                        <div className="admin-card-tools no-print">
                          <button
                            type="button"
                            className="btn-card-icon"
                            onClick={() => handleStartEdit(mass)}
                            title="Editar missa e sortear escala"
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            type="button"
                            className="btn-card-icon danger"
                            onClick={() => handleDeleteMass(mass.id)}
                            title="Excluir missa"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      )}
                    </div>

                    {/* BARRA DE STATUS (PÚBLICA/RASCUNHO + CADEADO + VAGAS) */}
                    <div className="admin-status-strip no-print">
                      {isAdmin ? (
                        <div className="status-toggles">
                          <button
                            type="button"
                            onClick={() => handleTogglePublish(mass.id, mass.published)}
                            className="chip-toggle"
                            style={{
                              background: mass.published ? "#DCFCE7" : "#FEF3C7",
                              color: mass.published ? "#166534" : "#92400E",
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
                            }}
                          >
                            {mass.open ? <><LockOpen size={13} /> Aberta</> : <><Lock size={13} /> Fechada</>}
                          </button>
                        </div>
                      ) : <div />}

                      <div style={{ fontSize: "0.78rem", fontWeight: 800, color: vagasRestantes > 0 ? "#166534" : "#B91C1C", display: "flex", alignItems: "center", gap: "5px" }}>
                        <UserIcon size={14} />
                        <span>{confirmados.length}/{mass.maxServers} vagas</span>
                        <span style={{ fontWeight: 600, opacity: 0.8 }}>
                          ({vagasRestantes > 0 ? `${vagasRestantes} livre${vagasRestantes > 1 ? "s" : ""}` : "Lotado"})
                        </span>
                      </div>
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
                          background: userIsIn ? "#FEE2E2" : (vagasRestantes > 0 ? "#DCFCE7" : "#E5E7EB"),
                          color: userIsIn ? "#B91C1C" : (vagasRestantes > 0 ? "#166534" : "#6B7280"),
                          border: "none",
                        }}
                        disabled={!userIsIn && vagasRestantes <= 0}
                      >
                        {userIsIn ? "SAIR DA ESCALA" : (vagasRestantes > 0 ? "ENTRAR NA ESCALA" : "LOTADO")}
                      </button>
                    )}

                    {/* LISTA DE INSCRITOS (CARDS COMPACTOS MOBILE-FIRST) */}
                    {showNameList && (
                      <div>
                        {mass.signups.length === 0 ? (
                          <div style={{ textAlign: "center", padding: "12px", fontSize: "0.8rem", color: theme.colors.textMuted, background: "#FAF8F5", borderRadius: "8px" }}>
                            Nenhum(a) servo(a) inscrito(a) nesta missa.
                          </div>
                        ) : (
                          <div className="admin-signups-list">
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

                                if (swappingSignupId === signup.id) {
                                  return (
                                    <div key={signup.id} className="admin-signup-row" style={{ background: "#EFF6FF", borderColor: "#BFDBFE" }}>
                                      <div style={{ fontSize: "0.78rem", fontWeight: 700, color: "#1E40AF" }}>
                                        Substituir {signup.user.name} por:
                                      </div>
                                      <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                                        <select
                                          autoFocus
                                          value={selectedReplacementId}
                                          onChange={(e) => setSelectedReplacementId(e.target.value)}
                                          style={{ flex: 1, padding: "8px" }}
                                        >
                                          <option value="">Selecione o(a) substituto(a)...</option>
                                          {allUsers.map((u) => (
                                            <option key={u.id} value={u.id}>{u.name}</option>
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
                                  <div key={signup.id} className={`admin-signup-row ${isReserva ? "reserva" : ""}`}>
                                    <div className="admin-signup-main">
                                      <div style={{ minWidth: 0, flex: 1 }}>
                                        <div className="admin-signup-name">
                                          {signup.user.name}
                                        </div>
                                        <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginTop: "2px" }}>
                                          {isSwap && substName && (
                                            <span style={{ fontSize: "0.7rem", color: "#6B7280", fontWeight: 600 }}>
                                              🔄 Subst. {substName}
                                            </span>
                                          )}
                                          {isReserva && (
                                            <span style={{ fontSize: "0.68rem", background: "#FEF3C7", color: "#B45309", padding: "1px 6px", borderRadius: "4px", fontWeight: 800 }}>
                                              FILA DE ESPERA
                                            </span>
                                          )}
                                        </div>
                                      </div>

                                      {isAdmin ? (
                                        <select
                                          className="role-select"
                                          value={signup.role || "Auxiliar"}
                                          onChange={(e) => handleChangeRole(signup.id, e.target.value)}
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
                                    </div>

                                    {isAdmin && (
                                      <div className="admin-signup-actions no-print">
                                        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                                          {!isReserva && (
                                            <button
                                              type="button"
                                              onClick={() => handleTogglePresence(signup.id)}
                                              className="chip-action"
                                              style={{
                                                background: signup.present ? "#DCFCE7" : "#FEE2E2",
                                                color: signup.present ? "#166534" : "#B91C1C",
                                              }}
                                            >
                                              {signup.present ? "✅ Presente" : "❌ Faltou"}
                                            </button>
                                          )}

                                          {!isReserva && (
                                            <button
                                              type="button"
                                              onClick={() => setSwappingSignupId(signup.id)}
                                              className="chip-action"
                                              style={{ background: "#EFF6FF", color: "#1D4ED8" }}
                                            >
                                              <RefreshCw size={12} /> Trocar
                                            </button>
                                          )}

                                          {isReserva && (
                                            <button
                                              type="button"
                                              onClick={() => handlePromote(signup.id)}
                                              className="chip-action"
                                              style={{ background: "#FEF3C7", color: "#B45309" }}
                                            >
                                              <ArrowUpCircle size={13} /> Promover
                                            </button>
                                          )}
                                        </div>

                                        <button
                                          type="button"
                                          onClick={() => handleRemoveSignup(signup.id)}
                                          className="chip-action"
                                          style={{ background: "transparent", color: "#B91C1C", padding: "4px 6px" }}
                                          title="Remover da escala"
                                        >
                                          <Trash2 size={14} />
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                          </div>
                        )}

                        {/* ADICIONAR SERVO(A) NA ESCALA (CHECKLIST COLAPSÁVEL AMIGÁVEL PARA CELULAR) */}
                        {isAdmin && (
                          <div className="no-print" style={{ marginTop: "10px" }}>
                            {!isAddExpanded ? (
                              <button
                                type="button"
                                onClick={() => {
                                  setExpandedAddMassId(mass.id);
                                  setAddSearchTerm("");
                                }}
                                style={{
                                  width: "100%",
                                  padding: "9px",
                                  background: "#FAF8F5",
                                  border: `1px dashed ${theme.colors.border}`,
                                  borderRadius: "8px",
                                  color: theme.colors.primary,
                                  fontWeight: 700,
                                  fontSize: "0.78rem",
                                  cursor: "pointer",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  gap: "6px",
                                }}
                              >
                                <UserPlus size={15} /> Adicionar Servo(a) na Escala
                              </button>
                            ) : (
                              <div style={{ padding: "12px", background: "#F7F5F0", borderRadius: "10px", border: `1px solid ${theme.colors.border}` }}>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                                  <strong style={{ fontSize: "0.8rem", color: theme.colors.primary }}>
                                    Toque nos nomes para selecionar ({selectedForThisMass.length})
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
                                    .filter(u => !mass.signups.some(s => s.userId === u.id))
                                    .filter(u => !addSearchTerm.trim() || u.name.toLowerCase().includes(addSearchTerm.toLowerCase()))
                                    .map(u => {
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
                                          <span>{u.name}</span>
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
                            <span style={{ fontSize: "0.7rem", color: "#6B7280" }}>
                              🎂 {new Date(serva.birthDate.split("T")[0] + "T12:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })}
                            </span>
                          )}
                          {serva.lastMassDate && (
                            <span style={{ fontSize: "0.68rem", color: isInactive ? "#991B1B" : "#5A4332", background: "#FAF8F5", border: "1px solid #E5DEC9", padding: "1px 6px", borderRadius: "6px" }}>
                              ⛪ Última: {new Date(serva.lastMassDate).toLocaleDateString("pt-BR")}
                            </span>
                          )}
                          {unavList.length > 0 && (
                            <span style={{ fontSize: "0.68rem", background: "#FEF3C7", color: "#B45309", padding: "2px 6px", borderRadius: "6px", fontWeight: 700 }}>
                              📅 {unavList.length} ausência(s)
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: "flex", gap: "6px", flexShrink: 0 }}>
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

      {/* ═══════════════════ ABA: QUIZZES (AVA) ═══════════════════ */}
      {isAdmin && activeTab === "quizzes" && (
        <Suspense fallback={<div style={{ padding: 30, textAlign: "center" }}>Carregando AVA...</div>}>
          <AdminQuizManager />
        </Suspense>
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
    </div>
  );
}
