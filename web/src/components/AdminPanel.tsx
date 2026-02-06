import { useState, useEffect } from "react";
import {
  Shield,
  FileText,
  Share2,
  Edit,
  PlusCircle,
  X,
  Trash2,
  CheckCircle,
  Lock,
  LockOpen,
  Trophy,
  BarChart2,
  ArrowUpCircle,
  RefreshCw,
  Save,
} from "lucide-react";
import { api } from "../services/api";
import { Mass, User } from "../types/types";
import { ScaleModal } from "./ScaleModal";
import { OfficialDocument } from "./OfficialDocument";
import { StatisticsModal } from "./StatisticsModal";
import { GeneralRankingModal } from "./GeneralRankingModal";
import { NoticeBoard } from "./NoticeBoard";
import "./css/AdminPanel.css";

interface AdminPanelProps {
  masses: Mass[];
  user: User;
  onUpdate: () => void;
  onLogout: () => void;
}

const getRoleWeight = (role?: string | null) => {
  if (role === "Cerimoniária") return 1;
  if (role === "Librífera") return 2;
  return 3;
};

export function AdminPanel({ masses, user, onUpdate, onLogout }: AdminPanelProps) {
  const isAdmin = user.role === "ADMIN";

  // Estados de formulário
  const [newDate, setNewDate] = useState("");
  const [newTime, setNewTime] = useState("");
  const [newName, setNewName] = useState("");
  const [newMax, setNewMax] = useState(4);
  const [newDeadline, setNewDeadline] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"dashboard" | "pdf">("dashboard");

  // Modais
  const [showTextModal, setShowTextModal] = useState(false);
  const [showRankingModal, setShowRankingModal] = useState(false);
  const [showStatsModal, setShowStatsModal] = useState(false);

  // ESTADO PARA TROCA (SWAP)
  const [allUsers, setAllUsers] = useState<{ id: string; name: string }[]>([]);
  const [swappingSignupId, setSwappingSignupId] = useState<string | null>(null);
  const [selectedReplacementId, setSelectedReplacementId] = useState("");

  // Carrega lista de usuários para o Admin poder realizar trocas
  useEffect(() => {
    if (isAdmin) {
      api
        .get("/users/list")
        .then((res) => setAllUsers(res.data))
        .catch(console.error);
    }
  }, [isAdmin]);

  // Exibe o documento oficial se estiver no modo PDF
  if (viewMode === "pdf" && isAdmin)
    return <OfficialDocument masses={masses} onBack={() => setViewMode("dashboard")} />;

  // --- Funções Administrativas ---
  function handleStartEdit(mass: Mass) {
    const d = new Date(mass.date);
    setEditingId(mass.id);
    const localDate = new Date(d.getTime() - d.getTimezoneOffset() * 60000)
      .toISOString()
      .split("T")[0];
    setNewDate(localDate);
    setNewTime(d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }));
    setNewName(mass.name || "");
    setNewMax(mass.maxServers);
    if (mass.deadline) {
      const deadlineDate = new Date(mass.deadline);
      const offset = deadlineDate.getTimezoneOffset() * 60000;
      setNewDeadline(
        new Date(deadlineDate.getTime() - offset).toISOString().slice(0, 16),
      );
    } else {
      setNewDeadline("");
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function handleCancelEdit() {
    setEditingId(null);
    setNewDate("");
    setNewTime("");
    setNewName("");
    setNewMax(4);
    setNewDeadline("");
  }

  async function handleTogglePublish(id: string, currentStatus: boolean) {
    try {
      await api.patch(`/masses/${id}`, { published: !currentStatus });
      onUpdate();
    } catch (error) {
      console.error(error);
      alert("Erro ao alterar status.");
    }
  }

  async function handleToggleOpen(id: string, currentOpen: boolean) {
    try {
      await api.patch(`/masses/${id}/toggle-open`, { open: !currentOpen });
      onUpdate();
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
      if (editingId) await api.put(`/masses/${editingId}`, payload);
      else await api.post("/masses", payload);
      onUpdate();
      handleCancelEdit();
    } catch (error) {
      console.error(error);
      alert("Erro ao salvar.");
    }
  }

  async function handleDeleteMass(id: string) {
    if (confirm("Apagar missa?")) {
      await api.delete(`/masses/${id}`);
      onUpdate();
    }
  }

  async function handleChangeRole(signupId: string, newRole: string) {
    try {
      await api.patch(`/signup/${signupId}/role`, { role: newRole });
      onUpdate();
    } catch (error) {
      console.error(error);
    }
  }

  async function handleTogglePresence(signupId: string) {
    try {
      await api.patch(`/signup/${signupId}/toggle-presence`);
      onUpdate();
    } catch (error) {
      console.error(error);
      alert("Erro ao confirmar presença.");
    }
  }

  async function handlePromote(signupId: string) {
    if (!confirm("Tem certeza que deseja promover esta serva para a escala oficial?"))
      return;
    try {
      await api.patch(`/signup/${signupId}/promote`);
      onUpdate();
    } catch (error) {
      console.error(error);
      alert("Erro ao promover serva.");
    }
  }

  async function handleRemoveSignup(signupId: string) {
    if (!confirm("Tem certeza que deseja remover esta serva da escala?")) return;
    try {
      await api.delete(`/signup/${signupId}`);
      onUpdate();
    } catch (error) {
      console.error(error);
      alert("Erro ao remover serva.");
    }
  }

  async function handleExecuteSwap() {
    if (!swappingSignupId || !selectedReplacementId) return;
    try {
      await api.post("/signup/swap", {
        oldSignupId: swappingSignupId,
        newUserId: selectedReplacementId,
      });
      setSwappingSignupId(null);
      setSelectedReplacementId("");
      onUpdate();
    } catch (error) {
      console.error(error);
      alert("Erro ao realizar troca.");
    }
  }

  return (
    <div className="admin-container">
      {showTextModal && isAdmin && (
        <ScaleModal masses={masses} onClose={() => setShowTextModal(false)} />
      )}
      {showRankingModal && isAdmin && (
        <GeneralRankingModal masses={masses} onClose={() => setShowRankingModal(false)} />
      )}
      {showStatsModal && isAdmin && (
        <StatisticsModal masses={masses} onClose={() => setShowStatsModal(false)} />
      )}

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
        <div
          className="header-actions"
          style={{
            display: "flex",
            gap: "10px",
            flexWrap: "wrap",
            justifyContent: "center",
          }}
        >
          {isAdmin && (
            <>
              <button
                className="btn-header"
                onClick={() => setShowStatsModal(true)}
                style={{
                  background: "#e3f2fd",
                  color: "#1565c0",
                  border: "1px solid #90caf9",
                }}
              >
                <BarChart2 size={16} /> RELATÓRIO
              </button>
              <button
                className="btn-header"
                onClick={() => setShowRankingModal(true)}
                style={{
                  background: "#fff8e1",
                  color: "#f57f17",
                  border: "1px solid #ffca28",
                }}
              >
                <Trophy size={16} /> RANKING
              </button>
              <button className="btn-header btn-white" onClick={() => setViewMode("pdf")}>
                <FileText size={16} /> PDF
              </button>
              <button
                className="btn-header btn-green"
                onClick={() => setShowTextModal(true)}
              >
                <Share2 size={16} /> ZAP
              </button>
            </>
          )}
          <button className="btn-header btn-dark" onClick={onLogout}>
            <X size={16} /> SAIR
          </button>
        </div>
      </div>

      {isAdmin && <NoticeBoard />}

      {isAdmin && (
        <div
          className="new-mass-card no-print"
          style={{
            borderColor: editingId ? "#F59E0B" : "#FFCDD2",
            background: editingId ? "#FFFBEB" : "#FFF5F5",
          }}
        >
          <div
            className="section-title"
            style={{ color: editingId ? "#B45309" : "#C62828" }}
          >
            {editingId ? <Edit size={20} /> : <PlusCircle size={20} />}{" "}
            <span>{editingId ? "Editando Missa" : "Nova Missa"}</span>
            {editingId && (
              <button onClick={handleCancelEdit} className="cancel-edit-btn">
                Cancelar
              </button>
            )}
          </div>
          <form onSubmit={handleSubmit} className="form-grid">
            <div className="form-group full-width">
              <label>Nome (Opcional)</label>
              <input
                className="form-input"
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Data</label>
              <input
                className="form-input"
                type="date"
                value={newDate}
                onChange={(e) => setNewDate(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label>Hora</label>
              <input
                className="form-input"
                type="time"
                value={newTime}
                onChange={(e) => setNewTime(e.target.value)}
                required
              />
            </div>
            <div className="form-group full-width">
              <label style={{ color: "#d32f2f" }}>Prazo (Opcional)</label>
              <input
                className="form-input"
                type="datetime-local"
                value={newDeadline}
                onChange={(e) => setNewDeadline(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Vagas</label>
              <input
                className="form-input"
                type="number"
                value={newMax}
                onChange={(e) => setNewMax(Number(e.target.value))}
                min="1"
              />
            </div>
            <button
              type="submit"
              className="btn-create"
              style={{ background: editingId ? "#F59E0B" : "#D37474" }}
            >
              {editingId ? "SALVAR" : "CRIAR MISSA"}
            </button>
          </form>
        </div>
      )}

      <div className="mass-list">
        {masses.map((mass) => {
          const isPublished = mass.published;
          const showNameList = isAdmin || isPublished;

          return (
            <div key={mass.id} className="mass-list-item">
              <div style={{ flex: 1 }}>
                <div style={{ marginBottom: 15 }}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                    }}
                  >
                    <div>
                      {mass.name && <div className="mass-label">{mass.name}</div>}
                    </div>
                    {isAdmin && (
                      <div style={{ display: "flex", gap: "5px", marginLeft: "10px" }}>
                        <button
                          onClick={() => handleTogglePublish(mass.id, mass.published)}
                          className="no-print"
                          style={{
                            background: mass.published ? "#e8f5e9" : "#fff3e0",
                            color: mass.published ? "#2e7d32" : "#ef6c00",
                            padding: "4px 8px",
                            borderRadius: "20px",
                            fontSize: "0.75rem",
                            fontWeight: "bold",
                          }}
                        >
                          {mass.published ? "● Pública" : "○ Rascunho"}
                        </button>
                        <button
                          onClick={() => handleToggleOpen(mass.id, mass.open)}
                          className="no-print"
                          style={{
                            background: mass.open ? "#e3f2fd" : "#eceff1",
                            color: mass.open ? "#1976d2" : "#546e7a",
                            padding: "4px 8px",
                            borderRadius: "20px",
                          }}
                        >
                          {mass.open ? <LockOpen size={14} /> : <Lock size={14} />}
                        </button>
                      </div>
                    )}
                  </div>
                  <h3 className="mass-date-title">
                    {new Date(mass.date).toLocaleString("pt-BR", {
                      weekday: "long",
                      day: "2-digit",
                      month: "long",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </h3>
                </div>

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
                                    <div
                                      style={{
                                        display: "flex",
                                        gap: "10px",
                                        alignItems: "center",
                                      }}
                                    >
                                      <select
                                        autoFocus
                                        value={selectedReplacementId}
                                        onChange={(e) =>
                                          setSelectedReplacementId(e.target.value)
                                        }
                                        style={{ flex: 1, padding: "6px" }}
                                      >
                                        <option value="">Trocar por...</option>
                                        {allUsers.map((u) => (
                                          <option key={u.id} value={u.id}>
                                            {u.name}
                                          </option>
                                        ))}
                                      </select>
                                      <button onClick={handleExecuteSwap}>
                                        <Save size={16} />
                                      </button>
                                      <button onClick={() => setSwappingSignupId(null)}>
                                        <X size={16} />
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              );
                            }

                            return (
                              <tr
                                key={signup.id}
                                style={{
                                  backgroundColor: isReserva ? "#fff3e0" : "transparent",
                                }}
                              >
                                <td>
                                  <div
                                    style={{
                                      display: "flex",
                                      alignItems: "center",
                                      gap: "10px",
                                    }}
                                  >
                                    {isAdmin && (
                                      <div style={{ display: "flex", gap: "4px" }}>
                                        <button
                                          onClick={() => handleRemoveSignup(signup.id)}
                                          className="icon-btn-small"
                                          style={{
                                            color: "#c62828",
                                            border: "none",
                                            background: "none",
                                          }}
                                        >
                                          <Trash2 size={14} />
                                        </button>
                                        {isReserva && (
                                          <button
                                            onClick={() => handlePromote(signup.id)}
                                            className="icon-btn-small"
                                            style={{
                                              color: "#ef6c00",
                                              border: "none",
                                              background: "none",
                                            }}
                                          >
                                            <ArrowUpCircle size={16} />
                                          </button>
                                        )}
                                        {!isReserva && (
                                          <button
                                            onClick={() => setSwappingSignupId(signup.id)}
                                            className="icon-btn-small"
                                            style={{
                                              color: "#1976d2",
                                              border: "none",
                                              background: "none",
                                            }}
                                          >
                                            <RefreshCw size={14} />
                                          </button>
                                        )}
                                        {!isReserva && (
                                          <button
                                            onClick={() =>
                                              handleTogglePresence(signup.id)
                                            }
                                            style={{ border: "none", background: "none" }}
                                          >
                                            <CheckCircle
                                              size={22}
                                              color={
                                                signup.present ? "#2e7d32" : "#e0e0e0"
                                              }
                                              fill={signup.present ? "#e8f5e9" : "none"}
                                            />
                                          </button>
                                        )}
                                      </div>
                                    )}
                                    <div
                                      style={{ display: "flex", flexDirection: "column" }}
                                    >
                                      <span
                                        style={{
                                          fontWeight: signup.present ? "bold" : "normal",
                                        }}
                                      >
                                        {signup.user.name}{" "}
                                        {isSwap && substName && (
                                          <span
                                            style={{
                                              fontSize: "0.75rem",
                                              fontWeight: "normal",
                                              color: "#666",
                                            }}
                                          >
                                            (Subst. {substName})
                                          </span>
                                        )}
                                      </span>
                                      {isReserva && (
                                        <span
                                          style={{
                                            fontSize: "0.65rem",
                                            color: "#ef6c00",
                                            fontWeight: "bold",
                                          }}
                                        >
                                          RESERVA
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </td>
                                <td style={{ textAlign: "right" }}>
                                  {isAdmin ? (
                                    <select
                                      className="role-select"
                                      value={signup.role || "Auxiliar"}
                                      onChange={(e) =>
                                        handleChangeRole(signup.id, e.target.value)
                                      }
                                    >
                                      <option value="Auxiliar">Auxiliar</option>
                                      <option value="Cerimoniária">Cerimoniária</option>
                                      <option value="Librífera">Librífera</option>
                                    </select>
                                  ) : (
                                    <span>{signup.role || "Auxiliar"}</span>
                                  )}
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
                  <button
                    onClick={() => handleStartEdit(mass)}
                    style={{ border: "none", background: "none" }}
                  >
                    <Edit size={22} />
                  </button>
                  <button
                    onClick={() => handleDeleteMass(mass.id)}
                    style={{ border: "none", background: "none" }}
                  >
                    <Trash2 size={22} />
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
