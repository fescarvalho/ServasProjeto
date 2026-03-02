import { useState, useEffect } from "react";
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
  User as UserIcon
} from "lucide-react";
import { Mass, User, Signup } from "../types/types";
import { useMasses } from "../hooks/useMasses";
import { useSignup } from "../hooks/useSignup";
import { getRoleWeight } from "../utils/format.utils";
import { toLocalDate, toLocalDateTime } from "../utils/date.utils";
import { APP_CONFIG } from "../constants/config";
import { getUsersList } from "../services/api/notice.service";
import { autoAssign } from "../utils/autoAssign";
import { ScaleModal } from "./ScaleModal";
import { OfficialDocument } from "./OfficialDocument";
import { StatisticsModal } from "./StatisticsModal";
import { RankingModal } from "./RankingModal";
import { NoticeBoard } from "./NoticeBoard";
import { theme } from "../theme/theme";
import "./css/AdminPanel.css";

// ── MassForm extracted OUTSIDE AdminPanel to prevent unmount on every keystroke ──
interface MassFormProps {
  isInline?: boolean;
  mass?: Mass;
  allMasses?: Mass[];
  localSignups?: Signup[];
  setLocalSignups?: React.Dispatch<React.SetStateAction<Signup[]>>;
  newName: string; setNewName: (v: string) => void;
  newDate: string; setNewDate: (v: string) => void;
  newTime: string; setNewTime: (v: string) => void;
  newDeadline: string; setNewDeadline: (v: string) => void;
  newMax: number; setNewMax: (v: number) => void;
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
  newName, setNewName,
  newDate, setNewDate,
  newTime, setNewTime,
  newDeadline, setNewDeadline,
  newMax, setNewMax,
  repeatWeekly, setRepeatWeekly,
  repeatUntil, setRepeatUntil,
  handleSubmit,
  handleCancelEdit,
}: MassFormProps) {
  return (
    <form onSubmit={handleSubmit} className="form-grid" style={isInline ? { padding: "10px" } : {}}>
      <div className="form-group full-width">
        <label>Nome (Opcional)</label>
        <input className="form-input" type="text" value={newName} onChange={(e) => setNewName(e.target.value)} />
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

      {isInline && mass && allMasses && localSignups && setLocalSignups && (
        <div className="form-group full-width" style={{ marginTop: "10px", padding: "15px", background: "#f8f9fa", borderRadius: "8px", border: "1px solid #e0e0e0" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
            <h4 style={{ margin: 0, color: theme.colors.primary }}>Pré-visualização da Escala</h4>
            <button
              type="button"
              onClick={() => {
                const newSignups = autoAssign({ ...mass, maxServers: newMax, signups: localSignups }, allMasses);
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
            <div style={{ maxHeight: "200px", overflowY: "auto", border: "1px solid #ddd", borderRadius: "4px", background: "#fff" }}>
              <table className="admin-table" style={{ margin: 0 }}>
                <thead style={{ position: "sticky", top: 0, background: "#f1f1f1" }}>
                  <tr>
                    <th style={{ padding: "8px", fontSize: "0.8rem", textAlign: "left" }}>Serva</th>
                    <th style={{ padding: "8px", fontSize: "0.8rem", textAlign: "left" }}>Status</th>
                    <th style={{ padding: "8px", fontSize: "0.8rem", textAlign: "left" }}>Função</th>
                  </tr>
                </thead>
                <tbody>
                  {localSignups.map((s: Signup) => (
                    <tr key={s.id} style={{ borderBottom: "1px solid #eee" }}>
                      <td style={{ padding: "8px", fontSize: "0.85rem" }}>{s.user?.name || 'Desconhecido'} {s.isSubstitution && <span style={{ color: "#888", fontSize: "0.7rem" }}>(Subst.)</span>}</td>
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
                          <option value="Cerimoniária">Cerimoniária</option>
                          <option value="Librífera">Librífera</option>
                        </select>
                      </td>
                    </tr>
                  ))}
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
  const { createMass, deleteMass, togglePublish, toggleOpen, patchMass } = useMasses();

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
  const [newMax, setNewMax] = useState<number>(APP_CONFIG.DEFAULT_MAX_SERVERS);
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

  // Form visibility
  const [showCreateForm, setShowCreateForm] = useState(false);

  // Filtros
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // ESTADO PARA TROCA (SWAP)
  const [allUsers, setAllUsers] = useState<{ id: string; name: string }[]>([]);
  const [swappingSignupId, setSwappingSignupId] = useState<string | null>(null);
  const [selectedReplacementId, setSelectedReplacementId] = useState("");

  // Carrega lista de usuários para o Admin
  useEffect(() => {
    if (isAdmin) {
      getUsersList()
        .then((users) => setAllUsers(users))
        .catch(console.error);
    }
  }, [isAdmin]);

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

    return true;
  });

  if (viewMode === "pdf" && isAdmin)
    return (
      <OfficialDocument masses={filteredMasses} onBack={() => setViewMode("dashboard")} />
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
    setNewMax(mass.maxServers);

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
    setNewMax(APP_CONFIG.DEFAULT_MAX_SERVERS);
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
          const text = encodeURIComponent(`📅 *Atenção, Servas!*\n\nAs inscrições para a missa do dia *${formattedDate}* foram *Abertas*!\n\nCorra no aplicativo e garanta o seu horário acessando a aba de Inscrições.\n🔗 https://servas.vercel.app`);

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
        deadline: newDeadline || null,
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
      console.error(error);
      alert("Erro ao realizar troca.");
    }
  }

  // MassForm agora é componente externo — passamos as props
  const massFormProps: MassFormProps = {
    allMasses: masses,
    localSignups, setLocalSignups,
    newName, setNewName,
    newDate, setNewDate,
    newTime, setNewTime,
    newDeadline, setNewDeadline,
    newMax, setNewMax,
    repeatWeekly, setRepeatWeekly,
    repeatUntil, setRepeatUntil,
    handleSubmit,
    handleCancelEdit,
  };

  return (
    <div className="admin-container">
      {/* MODAIS */}
      {showTextModal && isAdmin && <ScaleModal masses={filteredMasses} onClose={() => setShowTextModal(false)} />}
      {showRankingModal && isAdmin && <RankingModal masses={masses} onClose={() => setShowRankingModal(false)} />}
      {showStatsModal && isAdmin && <StatisticsModal masses={masses} onClose={() => setShowStatsModal(false)} />}

      <div className="admin-header no-print">
        <div className="header-brand">
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Shield size={28} />
            <div>
              <h1>{isAdmin ? "Painel Admin" : "Escala de Servas"}</h1>
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
                    <div>{mass.name && <div className="mass-label">{mass.name}</div>}</div>
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
                                      <option value="Cerimoniária">Cerimoniária</option>
                                      <option value="Librífera">Librífera</option>
                                    </select>
                                  ) : <span>{signup.role || "Auxiliar"}</span>}
                                </td>
                              </tr>
                            );
                          })}
                      </tbody>
                    </table>
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
    </div>
  );
}