import { useState } from "react";
import {
  Shield,
  FileText,
  Share2,
  Edit,
  PlusCircle,
  X,
  Trash2,
  Save,
} from "lucide-react";
import { api } from "../services/api";
import { Mass, FUNCOES } from "../types/types";
import { ScaleModal } from "./ScaleModal";
import { OfficialDocument } from "./OfficialDocument";
import "./css/AdminPanel.css"; // <--- Importante: O CSS que criamos

interface AdminPanelProps {
  masses: Mass[];
  onUpdate: () => void;
  onLogout: () => void;
}

export function AdminPanel({ masses, onUpdate, onLogout }: AdminPanelProps) {
  // Estados
  const [newDate, setNewDate] = useState("");
  const [newTime, setNewTime] = useState("");
  const [newName, setNewName] = useState("");
  const [newMax, setNewMax] = useState(4);
  const [newDeadline, setNewDeadline] = useState("");

  const [editingId, setEditingId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"dashboard" | "pdf">("dashboard");
  const [showTextModal, setShowTextModal] = useState(false);

  // Se for modo PDF, retorna o componente de documento
  if (viewMode === "pdf") {
    return <OfficialDocument masses={masses} onBack={() => setViewMode("dashboard")} />;
  }

  // Lógica de Edição (Mantida igual)
  function handleStartEdit(mass: Mass) {
    const d = new Date(mass.date);
    setEditingId(mass.id);
    setNewDate(d.toISOString().split("T")[0]);
    setNewTime(d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }));
    setNewName(mass.name || "");
    setNewMax(mass.maxServers);

    if (mass.deadline) {
      const deadlineDate = new Date(mass.deadline);
      const offset = deadlineDate.getTimezoneOffset() * 60000;
      const localISOTime = new Date(deadlineDate.getTime() - offset)
        .toISOString()
        .slice(0, 16);
      setNewDeadline(localISOTime);
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

  // Lógica de Envio (Mantida igual)
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
      console.error("Erro na operação:", error); // O erro agora é utilizado
      alert("Ocorreu um erro ao processar sua solicitação.");
    }
  }

  async function handleDeleteMass(id: string) {
    if (confirm("Tem certeza que deseja apagar esta missa?")) {
      await api.delete(`/masses/${id}`);
      onUpdate();
    }
  }

  async function handleChangeRole(signupId: string, newRole: string) {
    await api.patch(`/signup/${signupId}/role`, { role: newRole });
    onUpdate();
  }

  return (
    <div className="admin-container">
      {showTextModal && (
        <ScaleModal masses={masses} onClose={() => setShowTextModal(false)} />
      )}

      {/* --- HEADER --- */}
      <div className="admin-header no-print">
        <div className="header-brand">
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Shield size={28} />
            <div>
              <h1>Painel Admin</h1>
              <span>Gerenciamento</span>
            </div>
          </div>
        </div>

        <div className="header-actions">
          <button className="btn-header btn-white" onClick={() => setViewMode("pdf")}>
            <FileText size={16} /> VER PDF
          </button>

          <button className="btn-header btn-green" onClick={() => setShowTextModal(true)}>
            <Share2 size={16} /> WHATSAPP
          </button>

          <button className="btn-header btn-dark" onClick={onLogout}>
            <X size={16} /> SAIR
          </button>
        </div>
      </div>

      {/* --- FORMULÁRIO (Card Rosa) --- */}
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
          {editingId ? <Edit size={20} /> : <PlusCircle size={20} />}
          <span>{editingId ? "Editando Missa" : "Nova Missa"}</span>

          {editingId && (
            <button
              onClick={handleCancelEdit}
              style={{
                marginLeft: "auto",
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "#666",
                fontSize: "0.8rem",
                textDecoration: "underline",
              }}
            >
              Cancelar Edição
            </button>
          )}
        </div>

        <form onSubmit={handleSubmit} className="form-grid">
          {/* Nome */}
          <div className="form-group full-width">
            <label>Nome (Opcional)</label>
            <input
              className="form-input"
              type="text"
              placeholder="Ex: Missa de Cinzas"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
            />
          </div>

          {/* Data */}
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

          {/* Hora */}
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

          {/* Prazo */}
          <div className="form-group full-width">
            <label style={{ color: "#d32f2f" }}>Prazo de Inscrição (Opcional)</label>
            <input
              className="form-input"
              type="datetime-local"
              value={newDeadline}
              onChange={(e) => setNewDeadline(e.target.value)}
              style={{ borderColor: "#ef9a9a", color: "#c62828" }}
            />
          </div>

          {/* Vagas */}
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

          {/* Botão Submit */}
          <button
            type="submit"
            className="btn-create"
            style={{
              background: editingId ? "#F59E0B" : "#D37474",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
            }}
          >
            {editingId ? (
              <>
                <Save size={18} /> SALVAR ALTERAÇÕES
              </>
            ) : (
              "CRIAR MISSA"
            )}
          </button>
        </form>
      </div>

      {/* --- LISTA DE MISSAS --- */}
      <div className="mass-list">
        {masses.map((mass) => (
          <div key={mass.id} className="mass-list-item">
            {/* Esquerda: Informações e Tabela */}
            <div style={{ flex: 1 }}>
              <div style={{ marginBottom: 15 }}>
                {mass.name && (
                  <div
                    style={{
                      fontSize: "0.8rem",
                      fontWeight: "bold",
                      color: "#e91e63",
                      textTransform: "uppercase",
                      marginBottom: 4,
                    }}
                  >
                    {mass.name}
                  </div>
                )}
                <h3 style={{ margin: 0, fontSize: "1.2rem", color: "#333" }}>
                  {new Date(mass.date).toLocaleString("pt-BR", {
                    weekday: "long",
                    day: "2-digit",
                    month: "long",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </h3>
              </div>

              {/* Tabela de Inscritas */}
              {mass.signups.length === 0 ? (
                <p style={{ color: "#999", fontSize: "0.9rem", fontStyle: "italic" }}>
                  Nenhuma serva inscrita.
                </p>
              ) : (
                <div style={{ overflowX: "auto" }}>
                  <table
                    style={{
                      width: "100%",
                      borderCollapse: "collapse",
                      fontSize: "0.9rem",
                    }}
                  >
                    <tbody>
                      {mass.signups.map((signup) => (
                        <tr key={signup.id} style={{ borderBottom: "1px solid #f0f0f0" }}>
                          <td
                            style={{ padding: "8px 0", fontWeight: 600, color: "#444" }}
                          >
                            {signup.user.name}
                          </td>
                          <td style={{ padding: "8px 0", textAlign: "right" }}>
                            <select
                              value={signup.role || "Auxiliar"}
                              onChange={(e) =>
                                handleChangeRole(signup.id, e.target.value)
                              }
                              style={{
                                padding: "4px 8px",
                                borderRadius: 6,
                                border: "1px solid #ddd",
                                background: "white",
                                fontSize: "0.85rem",
                              }}
                            >
                              {FUNCOES.map((f) => (
                                <option key={f} value={f}>
                                  {f}
                                </option>
                              ))}
                            </select>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Direita: Botões de Ação */}
            <div className="mass-actions">
              <button
                className="icon-btn"
                style={{ color: "#F59E0B" }}
                onClick={() => handleStartEdit(mass)}
                title="Editar Missa"
              >
                <Edit size={22} />
              </button>

              <button
                className="icon-btn"
                style={{ color: "#EF4444" }}
                onClick={() => handleDeleteMass(mass.id)}
                title="Excluir Missa"
              >
                <Trash2 size={22} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
