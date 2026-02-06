import { useState, useEffect } from "react";
import {
  Shield,
  FileText,
  Share2,
  Edit,
  PlusCircle,
  X,
  Trash2,
  Filter,
  User as UserIcon,
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

const getRoleWeight = (role?: string) => {
  if (role === "Cerimoniária") return 1;
  if (role === "Librífera") return 2;
  return 3;
};

export function AdminPanel({ masses, user, onUpdate, onLogout }: AdminPanelProps) {
  const isAdmin = user.role === "ADMIN";

  // Estados
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

  // Filtros
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // ESTADO PARA TROCA (SWAP)
  const [allUsers, setAllUsers] = useState<{ id: string; name: string }[]>([]);
  const [swappingSignupId, setSwappingSignupId] = useState<string | null>(null); // Qual ID está sendo trocado?
  const [selectedReplacementId, setSelectedReplacementId] = useState(""); // Qual user foi escolhido?

  // Carrega lista de usuários ao montar
  useEffect(() => {
    if (isAdmin) {
      api
        .get("/users/list")
        .then((res) => setAllUsers(res.data))
        .catch(console.error);
    }
  }, [isAdmin]);

  const filteredMasses = masses.filter((mass) => {
    const massDate = new Date(mass.date).toISOString().split("T")[0];
    if (startDate && massDate < startDate) return false;
    if (endDate && massDate > endDate) return false;
    return true;
  });

  if (viewMode === "pdf" && isAdmin)
    return (
      <OfficialDocument masses={filteredMasses} onBack={() => setViewMode("dashboard")} />
    );

  // --- Funções CRUD ---
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
      alert("Erro ao alterar status.");
    }
  }
  async function handleToggleOpen(id: string, currentOpen: boolean) {
    try {
      await api.patch(`/masses/${id}/toggle-open`, { open: !currentOpen });
      onUpdate();
    } catch (error) {
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
    await api.patch(`/signup/${signupId}/role`, { role: newRole });
    onUpdate();
  }
  async function handleToggleSignup(massId: string) {
    try {
      await api.post("/toggle-signup", { userId: user.id, massId });
      onUpdate();
    } catch (error) {
      alert("Erro ao se inscrever/sair.");
    }
  }
  async function handleTogglePresence(signupId: string) {
    try {
      await api.patch(`/signup/${signupId}/toggle-presence`);
      onUpdate();
    } catch (error) {
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
      alert("Erro ao promover serva.");
    }
  }
  async function handleRemoveSignup(signupId: string) {
    if (!confirm("Tem certeza que deseja remover esta serva da escala?")) return;
    try {
      await api.delete(`/signup/${signupId}`);
      onUpdate();
    } catch (error) {
      alert("Erro ao remover serva.");
    }
  }

  // --- NOVA FUNÇÃO: EXECUTAR TROCA ---
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
      alert("Erro ao realizar troca. A serva selecionada talvez já esteja nesta missa.");
    }
  }

  return (
    <div className="admin-container">
      {showTextModal && isAdmin && (
        <ScaleModal masses={filteredMasses} onClose={() => setShowTextModal(false)} />
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
                style={{ borderColor: "#ef9a9a" }}
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

      <div
        className="filter-section no-print"
        style={{
          background: "#fff",
          padding: "20px",
          borderRadius: "16px",
          marginBottom: "20px",
          boxShadow: "0 2px 10px rgba(0,0,0,0.05)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            color: "#e91e63",
            fontWeight: "bold",
            marginBottom: "15px",
          }}
        >
          <Filter size={18} /> Filtrar Datas
        </div>
        <div
          style={{
            display: "flex",
            gap: "15px",
            alignItems: "flex-end",
            flexWrap: "wrap",
          }}
        >
          <input
            type="date"
            className="form-input"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            style={{ padding: "8px" }}
          />
          <input
            type="date"
            className="form-input"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            style={{ padding: "8px" }}
          />
          <button
            onClick={() => {
              setStartDate("");
              setEndDate("");
            }}
            style={{
              background: "#f5f5f5",
              border: "1px solid #ddd",
              padding: "10px 15px",
              borderRadius: "8px",
              cursor: "pointer",
            }}
          >
            Limpar
          </button>
        </div>
      </div>

      <div className="mass-list">
        {filteredMasses.map((mass) => {
          const isPublished = mass.published;
          const userIsIn = mass.signups.some((s) => s.userId === user.id);
          const confirmados = mass.signups.filter((s: any) => s.status !== "RESERVA");
          const vagasRestantes = mass.maxServers - confirmados.length;
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
                            border: mass.published
                              ? "1px solid #c8e6c9"
                              : "1px solid #ffe0b2",
                            padding: "4px 8px",
                            borderRadius: "20px",
                            cursor: "pointer",
                            fontSize: "0.75rem",
                            fontWeight: "bold",
                            display: "flex",
                            alignItems: "center",
                            gap: "5px",
                          }}
                        >
                          {mass.published ? "● Pública" : "○ Rascunho"}
                        </button>
                        <button
                          onClick={() => handleToggleOpen(mass.id, mass.open)}
                          className="no-print"
                          title={mass.open ? "Inscrições Abertas" : "Inscrições Fechadas"}
                          style={{
                            background: mass.open ? "#e3f2fd" : "#eceff1",
                            color: mass.open ? "#1976d2" : "#546e7a",
                            border: mass.open ? "1px solid #90caf9" : "1px solid #cfd8dc",
                            padding: "4px 8px",
                            borderRadius: "20px",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
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
                  <div
                    style={{
                      marginTop: "5px",
                      color: vagasRestantes > 0 ? "#2e7d32" : "#c62828",
                      fontWeight: "bold",
                      fontSize: "0.9rem",
                      display: "flex",
                      alignItems: "center",
                      gap: "5px",
                    }}
                  >
                    <UserIcon size={14} />
                    {vagasRestantes > 0
                      ? `${vagasRestantes} vaga(s) disponível(is)`
                      : "LOTADO"}
                    <span style={{ color: "#666", fontWeight: "normal" }}>
                      ({confirmados.length}/{mass.maxServers})
                    </span>
                  </div>
                </div>
                {!isAdmin && (
                  <button
                    onClick={() => handleToggleSignup(mass.id)}
                    style={{
                      width: "100%",
                      padding: "10px",
                      marginTop: "10px",
                      marginBottom: "15px",
                      borderRadius: "8px",
                      fontWeight: "bold",
                      cursor: "pointer",
                      background: userIsIn
                        ? "#ffebee"
                        : vagasRestantes > 0
                          ? "#e8f5e9"
                          : "#e0e0e0",
                      color: userIsIn
                        ? "#c62828"
                        : vagasRestantes > 0
                          ? "#2e7d32"
                          : "#9e9e9e",
                      border: "none",
                    }}
                    disabled={!userIsIn && vagasRestantes <= 0}
                  >
                    {userIsIn
                      ? "SAIR DA ESCALA"
                      : vagasRestantes > 0
                        ? "ENTRAR NA ESCALA"
                        : "LOTADO"}
                  </button>
                )}
                {showNameList ? (
                  mass.signups.length === 0 ? (
                    <p className="empty-msg">Nenhuma inscrita.</p>
                  ) : (
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
                              return a.user.name.localeCompare(b.user.name);
                            })
                            .map((signup) => {
                              const isReserva = (signup as any).status === "RESERVA";
                              const isSwap = (signup as any).isSubstitution; // Flag da substituição
                              const cerimoniariaOcupada = mass.signups.some(
                                (s) => s.role === "Cerimoniária" && s.id !== signup.id,
                              );
                              const libriferaOcupada = mass.signups.some(
                                (s) => s.role === "Librífera" && s.id !== signup.id,
                              );

                              // MODO DE EDIÇÃO (TROCA)
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
                                        <span
                                          style={{
                                            fontWeight: "bold",
                                            color: "#1565c0",
                                            fontSize: "0.85rem",
                                          }}
                                        >
                                          Trocar {signup.user.name} por:
                                        </span>
                                        <select
                                          autoFocus
                                          value={selectedReplacementId}
                                          onChange={(e) =>
                                            setSelectedReplacementId(e.target.value)
                                          }
                                          style={{
                                            flex: 1,
                                            padding: "6px",
                                            borderRadius: "4px",
                                            border: "1px solid #2196f3",
                                          }}
                                        >
                                          <option value="">Selecione...</option>
                                          {allUsers.map((u) => (
                                            <option key={u.id} value={u.id}>
                                              {u.name}
                                            </option>
                                          ))}
                                        </select>
                                        <button
                                          onClick={handleExecuteSwap}
                                          style={{
                                            background: "#2196f3",
                                            color: "white",
                                            border: "none",
                                            borderRadius: "4px",
                                            padding: "6px 10px",
                                            cursor: "pointer",
                                          }}
                                        >
                                          <Save size={16} />
                                        </button>
                                        <button
                                          onClick={() => setSwappingSignupId(null)}
                                          style={{
                                            background: "#e0e0e0",
                                            color: "#333",
                                            border: "none",
                                            borderRadius: "4px",
                                            padding: "6px 10px",
                                            cursor: "pointer",
                                          }}
                                        >
                                          <X size={16} />
                                        </button>
                                      </div>
                                    </td>
                                  </tr>
                                );
                              }

                              // MODO DE VISUALIZAÇÃO
                              return (
                                <tr
                                  key={signup.id}
                                  style={{
                                    backgroundColor: isReserva
                                      ? "#fff3e0"
                                      : "transparent",
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
                                            title="Remover"
                                            style={{
                                              background: "#ffebee",
                                              border: "1px solid #ffcdd2",
                                              borderRadius: "4px",
                                              width: 26,
                                              height: 26,
                                              display: "flex",
                                              alignItems: "center",
                                              justifyContent: "center",
                                              cursor: "pointer",
                                              color: "#c62828",
                                            }}
                                          >
                                            <Trash2 size={14} />
                                          </button>
                                          {isReserva && (
                                            <button
                                              onClick={() => handlePromote(signup.id)}
                                              title="Promover"
                                              style={{
                                                background: "#fff3e0",
                                                border: "1px solid #ffe0b2",
                                                borderRadius: "4px",
                                                width: 26,
                                                height: 26,
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "center",
                                                cursor: "pointer",
                                                color: "#ef6c00",
                                              }}
                                            >
                                              <ArrowUpCircle size={16} />
                                            </button>
                                          )}

                                          {/* BOTÃO DE TROCA (AZUL) */}
                                          {!isReserva && (
                                            <button
                                              onClick={() =>
                                                setSwappingSignupId(signup.id)
                                              }
                                              title="Substituir Serva"
                                              style={{
                                                background: "#e3f2fd",
                                                border: "1px solid #90caf9",
                                                borderRadius: "4px",
                                                width: 26,
                                                height: 26,
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "center",
                                                cursor: "pointer",
                                                color: "#1976d2",
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
                                              title="Presença"
                                              style={{
                                                background: "transparent",
                                                border: "none",
                                                cursor: "pointer",
                                                padding: 0,
                                                display: "flex",
                                                alignItems: "center",
                                              }}
                                            >
                                              <CheckCircle
                                                size={22}
                                                fill={signup.present ? "#e8f5e9" : "none"}
                                                color={
                                                  signup.present ? "#2e7d32" : "#e0e0e0"
                                                }
                                              />
                                            </button>
                                          )}
                                        </div>
                                      )}

                                      <div
                                        style={{
                                          display: "flex",
                                          flexDirection: "column",
                                        }}
                                      >
                                        <div
                                          style={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: "5px",
                                          }}
                                        >
                                          <span
                                            style={{
                                              fontWeight: signup.present
                                                ? "bold"
                                                : "normal",
                                              color: isReserva
                                                ? "#ef6c00"
                                                : signup.present
                                                  ? "#2e7d32"
                                                  : "#333",
                                            }}
                                          >
                                            {signup.user.name}
                                          </span>
                                          {/* ÍCONE VISUAL DE TROCA */}
                                          {isSwap && (
                                            <span
                                              title="Substituição Administrativa"
                                              style={{ fontSize: "0.8rem" }}
                                            >
                                              🔄
                                            </span>
                                          )}
                                        </div>

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
                                        {!isReserva && !signup.present && isAdmin && (
                                          <span
                                            style={{ fontSize: "0.65rem", color: "#999" }}
                                          >
                                            Pendente / Falta
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
                                        style={{ opacity: isReserva ? 0.6 : 1 }}
                                      >
                                        <option value="Auxiliar">Auxiliar</option>
                                        <option
                                          value="Cerimoniária"
                                          disabled={cerimoniariaOcupada}
                                        >
                                          Cerimoniária{" "}
                                          {cerimoniariaOcupada ? "(Ocupado)" : ""}
                                        </option>
                                        <option
                                          value="Librífera"
                                          disabled={libriferaOcupada}
                                        >
                                          Librífera {libriferaOcupada ? "(Ocupado)" : ""}
                                        </option>
                                      </select>
                                    ) : (
                                      <span
                                        style={{ fontSize: "0.85rem", color: "#666" }}
                                      >
                                        {signup.role || "Auxiliar"}
                                      </span>
                                    )}
                                  </td>
                                </tr>
                              );
                            })}
                        </tbody>
                      </table>
                    </div>
                  )
                ) : (
                  <div
                    style={{
                      fontStyle: "italic",
                      color: "#666",
                      padding: "10px",
                      background: "#f5f5f5",
                      borderRadius: "8px",
                      textAlign: "center",
                      display: "flex",
                      justifyContent: "center",
                      gap: "5px",
                    }}
                  >
                    <Lock size={16} /> A lista de nomes estará disponível após a
                    publicação oficial.
                  </div>
                )}
              </div>
              {isAdmin && (
                <div className="mass-actions">
                  <button className="icon-btn edit" onClick={() => handleStartEdit(mass)}>
                    <Edit size={22} />
                  </button>
                  <button
                    className="icon-btn delete"
                    onClick={() => handleDeleteMass(mass.id)}
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
