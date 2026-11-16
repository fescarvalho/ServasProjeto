import { useState, useEffect, lazy, Suspense } from "react";
import {
  Shield,
  FileText,
  Edit,
  PlusCircle,
  X,
  Trash2,
  CheckCircle as _CheckCircle,
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
  QrCode
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
    <form onSubmit={handleSubmit} className="form-grid" style={isInline ? { padding: "10px" } : {}}>
      <div className="form-group full-width">
        <label>Nome (Opcional)</label>
        <input className="form-input" type="text" value={newName} onChange={(e) => setNewName(e.target.value)} />
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
        <label>Data</label>
        <input className="form-input" type="date" value={newDate} onChange={(e) => setNewDate(e.target.value)} required />
      </div>
      <div className="form-group">
        <label>Hora</label>
        <input className="form-input" type="time" value={newTime} onChange={(e) => setNewTime(e.target.value)} required />
      </div>
      <div className="form-group full-width">
        <label style={{ color: theme.colors.dangerDark }}>Prazo (Opcional)</label>
        <input className="form-input" type="datetime-local" value={newDeadline} onChange={(e) => setNewDeadline(e.target.value)} />
      </div>
      <div className="form-group" style={{ gridColumn: isInline ? "1 / -1" : "auto" }}>
        <label>Vagas</label>
        <input className="form-input" type="number" value={newMax} onChange={(e) => setNewMax(Number(e.target.value))} min="1" />
      </div>
      <div className="form-group" style={{ gridColumn: isInline ? "1 / -1" : "auto", display: "flex", alignItems: "center" }}>
        <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", fontWeight: "bold", color: theme.colors.primary, marginTop: "22px" }}>
          <input type="checkbox" checked={newIsSolemnity} onChange={(e) => setNewIsSolemnity(e.target.checked)} style={{ width: "18px", height: "18px", cursor: "pointer" }} />
          👑 Solenidade (Destacar card)
        </label>
      </div>

      <div className="form-group" style={{ gridColumn: isInline ? "1 / -1" : "auto" }}>
        <label>Pontos (Override)</label>
        <input
          className="form-input"
          type="number"
          value={newPoints}
          onChange={(e) => setNewPoints(e.target.value)}
          min="1"
          placeholder="Vazio = regra automática"
        />
        <p style={{ fontSize: "0.65rem", color: "#888", marginTop: "4px" }}>
          Regra padrão: {pointsPreview}
        </p>
      </div>

      {isInline && mass && allMasses && localSignups && setLocalSignups && (
        <div className="form-group full-width" style={{ marginTop: "10px", padding: "15px", background: "#f8f9fa", borderRadius: "8px", border: "1px solid #e0e0e0" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
            <h4 style={{ margin: 0, color: theme.colors.primary }}>Pré-visualização da Escala</h4>
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
              style={{ background: theme.colors.secondary, color: "#fff", border: "none", padding: "8px 12px", borderRadius: "6px", cursor: "pointer", fontWeight: "bold", fontSize: "0.85rem", display: "flex", gap: "5px", alignItems: "center" }}
            >
              <RefreshCw size={14} /> GERAR ESCALA AUTOMÁTICA
            </button>
          </div>

          {localSignups.length === 0 ? (
            <p style={{ fontSize: "0.85rem", color: "#666" }}>Nenhuma inscrição para esta missa.</p>
          ) : (
            <div style={{ maxHeight: "220px", overflowY: "auto", border: "1px solid #ddd", borderRadius: "4px", background: "#fff" }}>
              <table className="admin-table" style={{ margin: 0 }}>
                <thead style={{ position: "sticky", top: 0, background: "#f1f1f1" }}>
                  <tr>
                    <th style={{ padding: "8px", fontSize: "0.8rem", textAlign: "left" }}>Servo(a)</th>
                    <th style={{ padding: "8px", fontSize: "0.8rem", textAlign: "left" }}>Status</th>
                    <th style={{ padding: "8px", fontSize: "0.8rem", textAlign: "left" }}>Função</th>
                  </tr>
                </thead>
                <tbody>
                  {localSignups.map((s: Signup) => {
                    const targetDateStr = newDate || new Date(mass.date).toISOString().split("T")[0];
                    const unavItem = (unavailabilitiesMap[s.userId] || []).find((u) => u.date === targetDateStr);
                    return (
                    <tr key={s.id} style={{ borderBottom: "1px solid #eee", background: unavItem ? "#fff8e1" : "transparent" }}>
                      <td style={{ padding: "8px", fontSize: "0.85rem" }}>
                        {s.user?.name || 'Desconhecido'} {s.isSubstitution && <span style={{ color: "#888", fontSize: "0.7rem" }}>(Subst.)</span>}
                        {unavItem && (
                          <div style={{ fontSize: "0.7rem", color: "#b45309", fontWeight: "bold" }}>
                            ⚠️ Indisponível ({unavItem.reason || "Ausência programada"})
                          </div>
                        )}
                      </td>
                      <td style={{ padding: "8px", fontSize: "0.85rem", color: s.status === 'CONFIRMADO' ? '#2e7d32' : '#ed6c02', fontWeight: "bold" }}>{s.status}</td>
                      <td style={{ padding: "8px" }}>
                        <select
                          value={s.role || ""}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (setLocalSignups) {
                              setLocalSignups((prev: Signup[]) => prev.map((item: Signup) => item.id === s.id ? { ...item, role: val || null } : item));
                            }
                          }}
                          style={{ padding: "4px", fontSize: "0.85rem", borderRadius: "4px", border: "1px solid #ccc" }}
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
                      </td>
                    </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
          <p style={{ fontSize: "0.75rem", color: "#888", marginTop: "8px", fontStyle: "italic" }}>
            As alterações feitas aqui só serão salvas ao clicar em "SALVAR ALTERAÇÕES".
          </p>
        </div>
      )}

      {/* OPÇÃO DE RECORRÊNCIA — visível apenas na criação */}
      {!isInline && (
        <div className="form-group full-width" style={{ borderTop: `1px dashed ${theme.colors.borderDark}`, paddingTop: "12px", marginTop: "4px" }}>
          <label style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer", color: theme.colors.secondary, fontWeight: "bold", fontSize: "0.95rem" }}>
            <input
              type="checkbox"
              checked={repeatWeekly}
              onChange={(e) => {
                setRepeatWeekly(e.target.checked);
                if (!e.target.checked) setRepeatUntil("");
              }}
              style={{ width: "18px", height: "18px", cursor: "pointer" }}
            />
            🔁 Repetir toda semana
          </label>
          {repeatWeekly && (
            <div style={{ marginTop: "10px", display: "flex", flexDirection: "column", gap: "4px" }}>
              <label style={{ fontSize: "0.85rem", color: "#555", fontWeight: "bold" }}>Repetir até (data final):</label>
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

      <div style={{ display: "flex", gap: "10px", marginTop: "10px", gridColumn: "1 / -1" }}>
        <button type="submit" className="btn-create" style={{ background: isInline ? theme.colors.warning : theme.colors.primary, flex: 1 }}>
          {isInline ? "SALVAR ALTERAÇÕES" : (repeatWeekly ? "✓ CRIAR MISSAS RECORRENTES" : "CRIAR MISSA")}
        </button>
        {isInline && (
          <button type="button" onClick={handleCancelEdit} style={{ padding: "10px", background: theme.colors.borderDark, border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "bold", color: theme.colors.textMain }}>
            CANCELAR
          </button>
        )}
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

  // Use mass hook for mass operations
  const { createMass, deleteMass, togglePublish, toggleOpen, patchMass, uploadScheduleImage } = useMasses();

  // AI States
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiExtractedMasses, setAiExtractedMasses] = useState<any[]>([]);
  const [showAiPreview, setShowAiPreview] = useState(false);

  // Use signup hook for all signup operations
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

  // Modais
  const [showTextModal, setShowTextModal] = useState(false);
  const [showRankingModal, setShowRankingModal] = useState(false);
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [showReminderModal, setShowReminderModal] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);
  const [unavailabilitiesMap, setUnavailabilitiesMap] = useState<Record<string, UnavailabilityItem[]>>({});

  // Form visibility
  const [showCreateForm, setShowCreateForm] = useState(false);

  // ── SISTEMA DE ABAS ──
  const [activeTab, setActiveTab] = useState<"escalas" | "servas" | "logs" | "quizzes">("escalas");

  // ── CRUD DE SERVOS ──
  const [servasList, setServasList] = useState<ServaData[]>([]);
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

  // Filtros
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

  // Carrega lista completa de servos quando a aba é ativada
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
      // Recarrega lista simples também para os selects de inscrição
      getUsersList().then(setAllUsers).catch(console.error);
    } catch (err: any) {
      const msg = err.response?.data?.error || "Erro ao salvar serva";
      setServaError(msg);
    } finally {
      setServaLoading(false);
    }
  }

  async function handleDeleteServa(serva: ServaData) {
    if (!confirm(`Deseja realmente remover a serva "${serva.name}"?\n\nTodos os dados relacionados (inscrições, logs, etc.) serão removidos permanentemente.`)) return;
    try {
      setServaLoading(true);
      await deleteServa(serva.id);
      await loadServas();
      getUsersList().then(setAllUsers).catch(console.error);
      onUpdate(); // Atualiza dados de missas que podem ter sido afetadas
    } catch (err) {
      console.error("Erro ao remover serva:", err);
      alert("Erro ao remover serva.");
    } finally {
      setServaLoading(false);
    }
  }

  const filteredMasses = masses.filter((mass) => {
    const massDate = new Date(mass.date);
    // Ajusta para o timezone local antes de extrair YYYY-MM-DD
    const massDateStr = new Date(massDate.getTime() - massDate.getTimezoneOffset() * 60000).toISOString().split("T")[0];

    if (startDate && massDateStr < startDate) return false;
    if (endDate && massDateStr > endDate) return false;

    // Se o usuário não usar os filtros de data, oculta as missas de dias anteriores
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

    // Configura os signups num estado local para edição em lote
    setLocalSignups(JSON.parse(JSON.stringify(mass.signups)));

    // Fill states with mass data
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
    // Limpa o formulário
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

      // Se mudou para "Aberto" (!currentOpen === true), gerar aviso no WhatsApp
      if (!currentOpen) {
        const mass = masses.find(m => m.id === id);
        // Só faz sentido notificar vaga aberta se a missa já estiver publicada e visível para as servas
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
        // Para edições, usar patchMass pois ele pode levar atualizações aninhadas de Signups e lidar com payloads customizados.
        const diffSignups = localSignups.filter(ls => {
          const orig = masses.find(m => m.id === editingId)?.signups.find(s => s.id === ls.id);
          if (!orig) return false;
          return orig.role !== ls.role || orig.status !== ls.status;
        });

        const patchPayload: any = {
          ...payload
        };

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
        // Cria uma missa por semana até a data final
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
    if (!confirm("Tem certeza que deseja promover esta serva para a escala oficial?"))
      return;
    try {
      await promoteSignup(signupId);
    } catch (error) {
      console.error(error);
      alert("Erro ao promover serva.");
    }
  }

  async function handleRemoveSignup(signupId: string) {
    if (!confirm("Tem certeza que deseja remover esta serva da escala?")) return;
    try {
      await removeSignup(signupId);
    } catch (error) {
      console.error(error);
      alert("Erro ao remover serva.");
    }
  }

  async function handleExecuteSwap() {
    if (!swappingSignupId || !selectedReplacementId) return;
    try {
      await swapSignup(swappingSignupId, selectedReplacementId);
      setSwappingSignupId(null);
      setSelectedReplacementId("");
    } catch (error) {
      console.error("Erro ao realizar troca.");
      alert("Erro ao realizar troca.");
    }
  }

  async function handleAddUserToMass(massId: string) {
    const usersIdsToAdd = selectedUserToAdd[massId];
    if (!usersIdsToAdd || usersIdsToAdd.length === 0) {
      alert("Selecione pelo menos uma serva para adicionar.");
      return;
    }

    // Process add requests concurrently
    try {
      await Promise.all(usersIdsToAdd.map(userId => toggleSignup(userId, massId)));
      // Clear selection after all are added
      setSelectedUserToAdd(prev => ({ ...prev, [massId]: [] }));
    } catch (error) {
      console.error(error);
      alert("Erro ao adicionar servas.");
    }
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
      // Reset input
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
          maxServers: 4 // Padrão
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

  // MassForm agora é componente externo — passamos as props
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

  return (
    <div className="admin-container">
      {/* MODAIS */}
      <Suspense fallback={null}>
        {showTextModal && isAdmin && <ScaleModal masses={filteredMasses} onClose={() => setShowTextModal(false)} />}
        {showRankingModal && isAdmin && <RankingModal masses={masses} onClose={() => setShowRankingModal(false)} />}
        {showStatsModal && isAdmin && <StatisticsModal masses={masses} onClose={() => setShowStatsModal(false)} />}
        {showReminderModal && isAdmin && <ReminderModal masses={masses} onClose={() => setShowReminderModal(false)} />}
      </Suspense>
      {showQrModal && isAdmin && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.65)",
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
            backdropFilter: "blur(3px)",
          }}
          onClick={() => setShowQrModal(false)}
        >
          <div
            style={{
              background: "white",
              width: "100%",
              maxWidth: "380px",
              borderRadius: "14px",
              padding: "28px 24px",
              textAlign: "center",
              boxShadow: "0 12px 30px rgba(0,0,0,0.3)",
              border: `1px solid ${theme.colors.borderLight}`,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ margin: "0 0 6px 0", color: theme.colors.primary, fontSize: "1.15rem" }}>
              QR Code de Check-in (Sacristia)
            </h3>
            <p style={{ margin: "0 0 16px 0", fontSize: "0.84rem", color: theme.colors.textSecondary }}>
              Imprima e fixe na sacristia. Ao escanear com a câmera do celular no dia da missa, a presença do(a) servo(a) é confirmada automaticamente.
            </p>
            <div style={{ padding: "16px", background: "#fff", border: `2px solid ${theme.colors.border}`, borderRadius: "12px", display: "inline-block", marginBottom: "16px" }}>
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent("https://servasdoaltar.vercel.app/escalas?checkin=1")}`}
                alt="QR Code Check-in Sacristia"
                width={200}
                height={200}
                style={{ display: "block" }}
              />
            </div>
            <div style={{ display: "flex", gap: "10px" }}>
              <button
                onClick={() => window.print()}
                style={{ flex: 1, padding: "11px", background: theme.colors.primaryGradient, color: "white", border: "none", borderRadius: "8px", fontWeight: "bold", cursor: "pointer" }}
              >
                🖨️ Imprimir
              </button>
              <button
                onClick={() => setShowQrModal(false)}
                style={{ flex: 1, padding: "11px", background: "#f5f5f5", color: "#555", border: "none", borderRadius: "8px", fontWeight: "bold", cursor: "pointer" }}
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="admin-header no-print">
        <div className="header-brand">
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Shield size={28} />
            <div>
              <h1>{isAdmin ? "Painel Admin" : "Escala de Servos"}</h1>
              <span>{user.name}</span>
            </div>
          </div>
        </div>
        <div className="header-actions" style={{ display: "flex", gap: "10px", flexWrap: "wrap", justifyContent: "center" }}>
          {isAdmin && (
            <>
              <button className="btn-header" onClick={() => setShowStatsModal(true)} style={{ background: "#e3f2fd", color: "#1565c0", border: "1px solid #90caf9" }}>
                <BarChart2 size={16} /> RELATÓRIO
              </button>
              <button className="btn-header" onClick={() => setShowRankingModal(true)} style={{ background: "#fff8e1", color: "#f57f17", border: "1px solid #ffca28" }}>
                <Trophy size={16} /> RANKING
              </button>
              <button className="btn-header" onClick={() => setShowTextModal(true)} style={{ background: "#e8f5e9", color: "#2e7d32", border: "1px solid #a5d6a7" }}>
                <Edit size={16} /> GERAR TEXTO
              </button>
              <button className="btn-header" onClick={() => setShowReminderModal(true)} style={{ background: "#EFECE6", color: "#4A3222", border: "1px solid #D5CBB8" }}>
                <Megaphone size={16} /> LEMBRETES
              </button>
              <button className="btn-header" onClick={() => setShowQrModal(true)} style={{ background: "#EFECE6", color: "#4A3222", border: "1px solid #D5CBB8" }} title="QR Code de Check-in da Sacristia">
                <QrCode size={16} /> CHECK-IN QR
              </button>
              <button className="btn-header btn-white" onClick={() => setViewMode("pdf")}>
                <FileText size={16} /> PDF
              </button>
            </>
          )}
          <button className="btn-header btn-dark" onClick={onLogout}>
            <X size={16} /> SAIR
          </button>
        </div>
      </div>

      {isAdmin && <NoticeBoard />}

      {/* ── SISTEMA DE ABAS ── */}
      {isAdmin && (
        <div className="admin-tabs no-print">
          <button
            className={`admin-tab ${activeTab === "escalas" ? "active" : ""}`}
            onClick={() => setActiveTab("escalas")}
          >
            <Calendar size={18} /> Escalas
          </button>
          <button
            className={`admin-tab ${activeTab === "servas" ? "active" : ""}`}
            onClick={() => setActiveTab("servas")}
          >
            <Users size={18} /> Servos
          </button>
          <button
            className={`admin-tab ${activeTab === "logs" ? "active" : ""}`}
            onClick={() => setActiveTab("logs")}
          >
            <ClipboardList size={18} /> Logs
          </button>
          <button
            className={`admin-tab ${activeTab === "quizzes" ? "active" : ""}`}
            onClick={() => setActiveTab("quizzes")}
          >
            <FileText size={18} /> AVA
          </button>
        </div>
      )}

      {/* ═══════════════════ ABA: ESCALAS ═══════════════════ */}
      {(activeTab === "escalas" || !isAdmin) && (
        <>
          {/* HISTÓRICO DE ACESSOS */}
          {isAdmin && (
            <div className="no-print" style={{ marginBottom: "20px", display: "flex", gap: "10px" }}>
              <label
                style={{
                  flex: 1,
                  padding: "12px 16px",
                  background: "#EFECE6",
                  color: "#4A3222",
                  border: "1px solid #D5CBB8",
                  borderRadius: "10px",
                  cursor: isAiLoading ? "not-allowed" : "pointer",
                  fontWeight: "bold",
                  fontSize: "0.9rem",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  transition: "all 0.2s",
                }}
              >
                {isAiLoading ? (
                  <Loader2 className="animate-spin" size={18} />
                ) : (
                  <Camera size={18} />
                )}
                {isAiLoading ? "Lendo Arquivo..." : "Criar via Arquivo (Foto/PDF)"}
                <input
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={handleAiUpload}
                  style={{ display: "none" }}
                  disabled={isAiLoading}
                />
              </label>
            </div>
          )}

          {/* PREVIEW DA IA */}
          {showAiPreview && (
            <div className="no-print" style={{
              background: "#fff",
              borderRadius: "12px",
              marginBottom: "20px",
              padding: "20px",
              boxShadow: "0 10px 25px rgba(44, 26, 16, 0.15)",
              border: "2px solid #D5CBB8",
              animation: "slideDown 0.3s ease"
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px" }}>
                <h3 style={{ color: "#4A3222", margin: 0, display: "flex", alignItems: "center", gap: "10px" }}>
                  <Camera /> Missas Identificadas pela IA
                </h3>
                <button onClick={() => setShowAiPreview(false)} style={{ background: "none", border: "none", color: "#666", cursor: "pointer" }}><X /></button>
              </div>

              <div style={{ maxHeight: "300px", overflowY: "auto", marginBottom: "15px", border: "1px solid #eee", borderRadius: "8px" }}>
                <table className="admin-table" style={{ margin: 0 }}>
                  <thead>
                    <tr style={{ background: "#EFECE6" }}>
                      <th style={{ padding: "10px", textAlign: "left" }}>Data</th>
                      <th style={{ padding: "10px", textAlign: "left" }}>Hora</th>
                      <th style={{ padding: "10px", textAlign: "left" }}>Local</th>
                      <th style={{ padding: "10px", textAlign: "center", width: "50px" }}>Ação</th>
                    </tr>
                  </thead>
                  <tbody>
                    {aiExtractedMasses.map((m, idx) => (
                      <tr key={idx}>
                        <td style={{ padding: "10px" }}>{new Date(m.date + "T12:00:00").toLocaleDateString("pt-BR")}</td>
                        <td style={{ padding: "10px" }}>{m.time}</td>
                        <td style={{ padding: "10px", fontWeight: "bold" }}>{m.name || m.local}</td>
                        <td style={{ padding: "10px", textAlign: "center" }}>
                          <button
                            onClick={() => setAiExtractedMasses(prev => prev.filter((_, i) => i !== idx))}
                            style={{ background: "none", border: "none", color: "#d32f2f", cursor: "pointer" }}
                            title="Remover"
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div style={{ display: "flex", gap: "10px" }}>
                <button
                  onClick={handleConfirmAiMasses}
                  disabled={isAiLoading}
                  style={{
                    flex: 1,
                    padding: "12px",
                    background: "#4A3222",
                    color: "#fff",
                    border: "none",
                    borderRadius: "8px",
                    fontWeight: "bold",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px"
                  }}
                >
                  {isAiLoading ? <Loader2 className="animate-spin" size={18} /> : <Check size={18} />}
                  CRIAR TODAS ESTAS MISSAS
                </button>
                <button
                  onClick={() => setShowAiPreview(false)}
                  style={{ padding: "12px", background: "#f5f5f5", color: "#666", border: "none", borderRadius: "8px", fontWeight: "bold", cursor: "pointer" }}
                >
                  CANCELAR
                </button>
              </div>
              <p style={{ fontSize: "0.8rem", color: "#888", marginTop: "10px", textAlign: "center" }}>
                Nota: Todas as missas serão criadas com 4 vagas e como rascunho (não públicas).
              </p>
            </div>
          )}

          {/* BOTÃO E FORMULÁRIO DE NOVA MISSA (COLAPSÁVEL) */}
          {isAdmin && !editingId && (
            <div className="no-print" style={{ marginBottom: "20px" }}>
              <button
                onClick={() => setShowCreateForm(!showCreateForm)}
                className="btn-create"
                style={{
                  width: "100%",
                  padding: "16px",
                  background: showCreateForm ? theme.colors.dangerDark : theme.colors.primary,
                  color: "white",
                  border: "none",
                  borderRadius: "12px",
                  cursor: "pointer",
                  fontWeight: "bold",
                  fontSize: "1rem",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "10px",
                  transition: "all 0.3s ease",
                  boxShadow: theme.colors.shadowBase
                }}
              >
                <PlusCircle size={20} />
                <span>{showCreateForm ? "Fechar Formulário" : "Nova Missa"}</span>
              </button>

              {showCreateForm && (
                <div
                  className="new-mass-card"
                  style={{
                    borderColor: theme.colors.dangerLight,
                    background: theme.colors.backgroundLight,
                    marginTop: "10px",
                    animation: "slideDown 0.3s ease"
                  }}
                >
                  <MassForm {...massFormProps} isInline={false} />
                </div>
              )}
            </div>
          )}

          {/* FILTROS */}
          <div className="filter-section no-print" style={{ background: "#fff", padding: "20px", borderRadius: "16px", marginBottom: "20px", boxShadow: theme.colors.shadowBase }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", color: theme.colors.primary, fontWeight: "bold", marginBottom: "15px" }}>
              <Filter size={18} /> Filtrar Datas
            </div>
            <div style={{ display: "flex", gap: "15px", alignItems: "flex-end", flexWrap: "wrap" }}>
              <input type="date" className="form-input" value={startDate} onChange={(e) => setStartDate(e.target.value)} style={{ padding: "8px" }} />
              <input type="date" className="form-input" value={endDate} onChange={(e) => setEndDate(e.target.value)} style={{ padding: "8px" }} />
              <button onClick={() => { setStartDate(""); setEndDate(""); }} style={{ background: theme.colors.background, border: `1px solid ${theme.colors.border}`, padding: "10px 15px", borderRadius: "8px", cursor: "pointer" }}>
                Limpar
              </button>
            </div>
          </div>

          {/* LISTA DE MISSAS */}
          <div className="mass-list">
            {filteredMasses.map((mass) => {
              // --- MODO DE EDIÇÃO INLINE ---
              if (editingId === mass.id) {
                return (
                  <div key={mass.id} className="new-mass-card no-print" style={{ borderColor: "#F59E0B", background: "#FFFBEB", marginBottom: "20px" }}>
                    <div className="section-title" style={{ color: "#B45309" }}>
                      <Edit size={20} /> <span>Editando: {mass.name || "Missa"}</span>
                    </div>
                    <MassForm {...massFormProps} isInline={true} mass={mass} />
                  </div>
                );
              }

              // --- MODO DE VISUALIZAÇÃO (CARD NORMAL) ---
              const isPublished = mass.published;
              const userIsIn = mass.signups.some(s => s.userId === user.id);
              const confirmados = mass.signups.filter((s: any) => s.status !== "RESERVA");
              const vagasRestantes = mass.maxServers - confirmados.length;
              const showNameList = isAdmin || isPublished;

              return (
                <div key={mass.id} className="mass-list-item">
                  <div style={{ flex: 1 }}>
                    <div style={{ marginBottom: 15 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                        <div>
                          {mass.name && <div className="mass-label">{mass.name}</div>}
                          {mass.isSolemnity && <span style={{ fontSize: "0.75rem", background: "#fef3c7", color: "#b45309", padding: "2px 8px", borderRadius: "10px", fontWeight: "bold", display: "inline-block", marginTop: "4px" }}>👑 SOLENIDADE</span>}
                        </div>
                        {isAdmin && (
                          <div style={{ display: "flex", gap: "5px", marginLeft: "10px" }}>
                            <button onClick={() => handleTogglePublish(mass.id, mass.published)} className="no-print" style={{ background: mass.published ? "#e8f5e9" : "#fff3e0", color: mass.published ? "#2e7d32" : "#ef6c00", padding: "4px 8px", borderRadius: "20px", fontSize: "0.75rem", fontWeight: "bold" }}>{mass.published ? "● Pública" : "○ Rascunho"}</button>
                            <button onClick={() => handleToggleOpen(mass.id, mass.open)} className="no-print" style={{ background: mass.open ? "#e3f2fd" : "#eceff1", color: mass.open ? "#1976d2" : "#546e7a", padding: "4px 8px", borderRadius: "20px" }}>{mass.open ? <LockOpen size={14} /> : <Lock size={14} />}</button>
                          </div>
                        )}
                      </div>
                      <h3 className="mass-date-title">{new Date(mass.date).toLocaleString("pt-BR", { weekday: "long", day: "2-digit", month: "long", hour: "2-digit", minute: "2-digit" })}</h3>
                      <div style={{ marginTop: "5px", color: vagasRestantes > 0 ? "#2e7d32" : "#c62828", fontWeight: "bold", fontSize: "0.9rem", display: "flex", alignItems: "center", gap: "5px" }}>
                        <UserIcon size={14} />{vagasRestantes > 0 ? `${vagasRestantes} vaga(s) disponível(is)` : "LOTADO"}<span style={{ color: "#666", fontWeight: "normal" }}>({confirmados.length}/{mass.maxServers})</span>
                      </div>
                    </div>

                    {!isAdmin && (
                      <button onClick={() => handleToggleSignup(mass.id)} style={{ width: "100%", padding: "10px", marginTop: "10px", marginBottom: "15px", borderRadius: "8px", fontWeight: "bold", cursor: "pointer", background: userIsIn ? "#ffebee" : (vagasRestantes > 0 ? "#e8f5e9" : "#e0e0e0"), color: userIsIn ? "#c62828" : (vagasRestantes > 0 ? "#2e7d32" : "#9e9e9e"), border: "none" }} disabled={!userIsIn && vagasRestantes <= 0}>
                        {userIsIn ? "SAIR DA ESCALA" : (vagasRestantes > 0 ? "ENTRAR NA ESCALA" : "LOTADO")}
                      </button>
                    )}

                    {showNameList && (
                      <div style={{ overflowX: "auto" }}>
                        <table className="admin-table">
                          <tbody>
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
                                    <tr key={signup.id} style={{ background: "#e3f2fd" }}>
                                      <td colSpan={2} style={{ padding: "10px" }}>
                                        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                                          <select autoFocus value={selectedReplacementId} onChange={(e) => setSelectedReplacementId(e.target.value)} style={{ flex: 1, padding: "6px" }}>
                                            <option value="">Trocar por...</option>
                                            {allUsers.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
                                          </select>
                                          <button onClick={handleExecuteSwap}><Save size={16} /></button>
                                          <button onClick={() => setSwappingSignupId(null)}><X size={16} /></button>
                                        </div>
                                      </td>
                                    </tr>
                                  );
                                }

                                return (
                                  <tr key={signup.id} style={{ backgroundColor: isReserva ? "#fff3e0" : "transparent" }}>
                                    <td>
                                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                        {isAdmin && (
                                          <div style={{ display: "flex", gap: "4px" }}>
                                            <button onClick={() => handleRemoveSignup(signup.id)} className="icon-btn-small" style={{ color: "#c62828", border: "none", background: "none" }}><Trash2 size={14} /></button>
                                            {isReserva && <button onClick={() => handlePromote(signup.id)} className="icon-btn-small" style={{ color: "#ef6c00", border: "none", background: "none" }}><ArrowUpCircle size={16} /></button>}
                                            {!isReserva && <button onClick={() => setSwappingSignupId(signup.id)} className="icon-btn-small" style={{ color: "#1976d2", border: "none", background: "none" }}><RefreshCw size={14} /></button>}
                                            {!isReserva && <button
                                              onClick={() => handleTogglePresence(signup.id)}
                                              style={{
                                                border: "none",
                                                borderRadius: "6px",
                                                padding: "3px 8px",
                                                fontSize: "0.7rem",
                                                fontWeight: "bold",
                                                cursor: "pointer",
                                                background: signup.present ? "#e8f5e9" : "#ffebee",
                                                color: signup.present ? "#2e7d32" : "#c62828",
                                                minWidth: "60px",
                                              }}
                                              title={signup.present ? "Marcar como faltou" : "Marcar como presente"}
                                            >
                                              {signup.present ? "✅ Presente" : "❌ Faltou"}
                                            </button>}
                                          </div>
                                        )}
                                        <div style={{ display: "flex", flexDirection: "column" }}>
                                          <span style={{ fontWeight: signup.present ? "bold" : "normal" }}>
                                            {signup.user.name} {isSwap && substName && <span style={{ fontSize: "0.75rem", fontWeight: "normal", color: "#666" }}>(Subst. {substName})</span>}
                                          </span>
                                          {isReserva && <span style={{ fontSize: "0.65rem", color: "#ef6c00", fontWeight: "bold" }}>RESERVA</span>}
                                        </div>
                                      </div>
                                    </td>
                                    <td style={{ textAlign: "right" }}>
                                      {isAdmin ? (
                                        <select className="role-select" value={signup.role || "Auxiliar"} onChange={(e) => handleChangeRole(signup.id, e.target.value)}>
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
                                      ) : <span>{formatRole(signup.role, signup.user.name, signup.userId)}</span>}
                                    </td>
                                  </tr>
                                );
                              })}
                          </tbody>
                        </table>

                        {isAdmin && (
                          <div className="no-print" style={{ marginTop: "15px", padding: "12px", background: "#f8f9fa", borderRadius: "8px", border: "1px dashed #ccc", display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
                            <select
                              multiple
                              value={selectedUserToAdd[mass.id] || []}
                              onChange={(e) => {
                                const selectedOptions = Array.from(e.target.selectedOptions, option => option.value);
                                setSelectedUserToAdd(prev => ({ ...prev, [mass.id]: selectedOptions }));
                              }}
                              style={{ flex: 1, minWidth: "200px", padding: "8px", borderRadius: "6px", border: "1px solid #ccc", minHeight: "80px" }}
                            >
                              <option value="" disabled>Selecione um(a) ou mais servos(as)...</option>
                              {allUsers
                                .filter(u => !mass.signups.some(s => s.userId === u.id))
                                .map(u => (
                                  <option key={u.id} value={u.id}>{u.name}</option>
                                ))
                              }
                            </select>
                            <button
                              onClick={() => handleAddUserToMass(mass.id)}
                              disabled={!selectedUserToAdd[mass.id] || selectedUserToAdd[mass.id].length === 0}
                              style={{ padding: "8px 12px", background: selectedUserToAdd[mass.id]?.length > 0 ? theme.colors.primary : "#ccc", color: "white", border: "none", borderRadius: "6px", fontWeight: "bold", cursor: selectedUserToAdd[mass.id]?.length > 0 ? "pointer" : "not-allowed", display: "flex", alignItems: "center", gap: "5px", transition: "all 0.2s" }}
                            >
                              <PlusCircle size={16} /> Adicionar
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  {isAdmin && (
                    <div className="mass-actions">
                      <button onClick={() => handleStartEdit(mass)} style={{ border: "none", background: "none" }}><Edit size={22} /></button>
                      <button onClick={() => handleDeleteMass(mass.id)} style={{ border: "none", background: "none" }}><Trash2 size={22} /></button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* ═══════════════════ ABA: SERVAS ═══════════════════ */}
      {activeTab === "servas" && isAdmin && (
        <div className="servas-tab-content" style={{ animation: "slideDown 0.3s ease" }}>
          {/* MODAL DE CRIAÇÃO/EDIÇÃO */}
          {showServaModal && (
            <div className="serva-modal-overlay" onClick={() => setShowServaModal(false)}>
              <div className="serva-modal" onClick={(e) => e.stopPropagation()}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                  <h3 style={{ margin: 0, color: theme.colors.primary, display: "flex", alignItems: "center", gap: "8px" }}>
                    {editingServa ? <><Edit size={20} /> Editar Servo(a)</> : <><PlusCircle size={20} /> Novo(a) Servo(a)</>}
                  </h3>
                  <button onClick={() => setShowServaModal(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "#666" }}><X size={22} /></button>
                </div>

                {servaError && (
                  <div style={{ background: "#ffebee", color: "#c62828", padding: "10px 14px", borderRadius: "8px", marginBottom: "15px", fontSize: "0.85rem", fontWeight: "bold" }}>
                    {servaError}
                  </div>
                )}

                <form onSubmit={handleSaveServa} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                  <div className="form-group">
                    <label>Nome *</label>
                    <input className="form-input" type="text" value={servaForm.name} onChange={(e) => setServaForm(p => ({ ...p, name: e.target.value }))} required />
                  </div>
                  <div className="form-group">
                    <label>Email *</label>
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
                      <option value="M">Masculino (Servo — Cerimoniário, Librífero...)</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Status</label>
                    <select className="form-input" value={servaForm.role} onChange={(e) => setServaForm(p => ({ ...p, role: e.target.value }))}>
                      <option value="USER">Servo(a) Ativo(a)</option>
                      <option value="em_formacao">Em Formação</option>
                    </select>
                  </div>
                  <div style={{ display: "flex", gap: "10px", marginTop: "5px" }}>
                    <button type="submit" disabled={servaLoading} className="btn-create" style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
                      {servaLoading ? <Loader2 className="animate-spin" size={18} /> : <Check size={18} />}
                      {editingServa ? "SALVAR ALTERAÇÕES" : "CADASTRAR"}
                    </button>
                    <button type="button" onClick={() => setShowServaModal(false)} style={{ padding: "12px 20px", background: "#f5f5f5", border: "none", borderRadius: "10px", cursor: "pointer", fontWeight: "bold", color: "#666" }}>
                      CANCELAR
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* BOTÃO NOVO SERVO */}
          <button
            onClick={() => handleOpenServaModal()}
            style={{
              width: "100%",
              padding: "16px",
              background: theme.colors.primary,
              color: "white",
              border: "none",
              borderRadius: "10px",
              cursor: "pointer",
              fontWeight: "bold",
              fontSize: "1rem",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "10px",
              marginBottom: "20px",
              boxShadow: theme.colors.shadowBase,
              transition: "all 0.3s ease",
            }}
          >
            <PlusCircle size={20} /> Novo(a) Servo(a)
          </button>

          {/* LISTA DE SERVOS */}
          <div className="servas-card" style={{ background: "#fff", borderRadius: "12px", padding: "20px", boxShadow: `0 2px 12px ${theme.colors.shadowBase}` }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", color: theme.colors.primary, fontWeight: "bold", marginBottom: "15px", fontSize: "1.05rem" }}>
              <Users size={20} /> Servos e Servas Cadastrados ({servasList.length})
            </div>

            {servaLoading && servasList.length === 0 ? (
              <div style={{ textAlign: "center", padding: "40px", color: "#888" }}>
                <Loader2 className="animate-spin" size={24} style={{ margin: "0 auto 10px" }} />
                <p>Carregando lista...</p>
              </div>
            ) : servasList.length === 0 ? (
              <p style={{ textAlign: "center", padding: "30px", color: "#888" }}>Nenhum(a) servo(a) cadastrado(a).</p>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table className="admin-table" style={{ width: "100%" }}>
                  <thead>
                    <tr style={{ background: "#EFECE6", borderBottom: "2px solid #D5CBB8" }}>
                      <th style={{ padding: "12px 14px", textAlign: "left", fontSize: "0.8rem", color: theme.colors.primary, fontWeight: "700" }}>Nome</th>
                      <th style={{ padding: "12px 14px", textAlign: "left", fontSize: "0.8rem", color: theme.colors.primary, fontWeight: "700" }}>Email</th>
                      <th style={{ padding: "12px 14px", textAlign: "center", fontSize: "0.8rem", color: theme.colors.primary, fontWeight: "700" }}>Perfil</th>
                      <th style={{ padding: "12px 14px", textAlign: "center", fontSize: "0.8rem", color: theme.colors.primary, fontWeight: "700" }}>Status</th>
                      <th style={{ padding: "12px 14px", textAlign: "center", fontSize: "0.8rem", color: theme.colors.primary, fontWeight: "700" }}>Nascimento</th>
                      <th style={{ padding: "12px 14px", textAlign: "center", fontSize: "0.8rem", color: theme.colors.primary, fontWeight: "700", width: "90px" }}>Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {servasList.map((serva) => {
                      const resolvedGender = serva.gender || getUserGender(serva.id, serva.name);
                      const unavCount = (unavailabilitiesMap[serva.id] || []).length;
                      return (
                      <tr key={serva.id} style={{ borderBottom: "1px solid #f0f0f0", transition: "background 0.15s" }} onMouseEnter={(e) => (e.currentTarget.style.background = "#fafafa")} onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
                        <td style={{ padding: "12px 14px", fontWeight: "600", color: "#333" }}>
                          {serva.name}
                          {unavCount > 0 && (
                            <div style={{ fontSize: "0.72rem", color: "#b45309", fontWeight: "normal" }}>
                              📅 {unavCount} data(s) indisponível(is)
                            </div>
                          )}
                        </td>
                        <td style={{ padding: "12px 14px", color: "#666", fontSize: "0.9rem" }}>{serva.email}</td>
                        <td style={{ padding: "12px 14px", textAlign: "center", fontSize: "0.8rem" }}>
                          <span style={{ background: "#F7F5F0", color: theme.colors.primary, border: `1px solid ${theme.colors.border}`, padding: "3px 8px", borderRadius: "6px", fontWeight: "bold", fontSize: "0.75rem" }}>
                            {resolvedGender === "M" ? "Servo" : "Serva"}
                          </span>
                        </td>
                        <td style={{ padding: "12px 14px", textAlign: "center", color: "#666", fontSize: "0.9rem" }}>
                          {serva.role === 'em_formacao' ? (
                            <span style={{ background: "#e1f5fe", color: "#0277bd", padding: "4px 8px", borderRadius: "6px", fontSize: "0.75rem", fontWeight: "bold" }}>Formação</span>
                          ) : (
                            <span style={{ background: "#e8f5e9", color: "#2e7d32", padding: "4px 8px", borderRadius: "6px", fontSize: "0.75rem", fontWeight: "bold" }}>Ativo(a)</span>
                          )}
                        </td>
                        <td style={{ padding: "12px 14px", textAlign: "center", color: "#666", fontSize: "0.9rem" }}>
                          {serva.birthDate ? new Date(serva.birthDate.split("T")[0] + "T12:00:00").toLocaleDateString("pt-BR") : "—"}
                        </td>
                        <td style={{ padding: "12px 14px", textAlign: "center" }}>
                          <div style={{ display: "flex", gap: "8px", justifyContent: "center" }}>
                            <button onClick={() => handleOpenServaModal(serva)} title="Editar" style={{ background: "#e3f2fd", border: "none", borderRadius: "8px", padding: "6px 8px", cursor: "pointer", color: "#1565c0", transition: "all 0.15s" }}>
                              <Edit size={16} />
                            </button>
                            <button onClick={() => handleDeleteServa(serva)} title="Excluir" style={{ background: "#ffebee", border: "none", borderRadius: "8px", padding: "6px 8px", cursor: "pointer", color: "#c62828", transition: "all 0.15s" }}>
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ═══════════════════ ABA: QUIZZES ═══════════════════ */}
      {isAdmin && activeTab === "quizzes" && (
        <Suspense fallback={<div style={{ padding: 30, textAlign: "center" }}>Carregando AVA...</div>}>
          <AdminQuizManager />
        </Suspense>
      )}

      {/* ═══════════════════ ABA: LOGS ═══════════════════ */}
      {activeTab === "logs" && isAdmin && (
        <div style={{ animation: "slideDown 0.3s ease" }}>
          <div
            style={{
              background: "#fff",
              borderRadius: "16px",
              padding: "20px",
              boxShadow: `0 2px 12px ${theme.colors.shadowBase}`,
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