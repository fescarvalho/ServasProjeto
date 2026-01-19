import { useState, useEffect } from "react";
import {
  Shield, FileText, Share2, Edit, PlusCircle, X, Trash2, Filter, User as UserIcon, CheckCircle, Lock, Megaphone
} from "lucide-react";
import { api } from "../services/api";
import { Mass, FUNCOES, User, Notice } from "../types/types";
import { ScaleModal } from "./ScaleModal";
import { OfficialDocument } from "./OfficialDocument";
import { MonthlyReport } from "./MonthlyReport";
import "./css/AdminPanel.css";

interface AdminPanelProps {
  masses: Mass[];
  user: User;
  onUpdate: () => void;
  onLogout: () => void;
}

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
  const [showTextModal, setShowTextModal] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  
  // Estado dos Avisos
  const [notices, setNotices] = useState<Notice[]>([]);
  const [newNoticeText, setNewNoticeText] = useState("");

  // Carregar avisos ao abrir
  useEffect(() => {
    loadNotices();
  }, []);

  async function loadNotices() {
    const res = await api.get("/notices");
    setNotices(res.data);
  }

  async function handleAddNotice(e: React.FormEvent) {
    e.preventDefault();
    if (!newNoticeText.trim()) return;
    await api.post("/notices", { text: newNoticeText });
    setNewNoticeText("");
    loadNotices();
  }

  async function handleDeleteNotice(id: string) {
    if (confirm("Apagar este aviso?")) {
      await api.delete(`/notices/${id}`);
      loadNotices();
    }
  }

  const filteredMasses = masses.filter((mass) => {
    const massDate = new Date(mass.date).toISOString().split("T")[0];
    if (startDate && massDate < startDate) return false;
    if (endDate && massDate > endDate) return false;
    return true;
  });

  if (viewMode === "pdf" && isAdmin) {
    return <OfficialDocument masses={filteredMasses} onBack={() => setViewMode("dashboard")} />;
  }

  // --- FUNÇÕES DE MISSA ---
  function handleStartEdit(mass: Mass) {
    const d = new Date(mass.date);
    setEditingId(mass.id);
    const localDate = new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().split("T")[0];
    setNewDate(localDate);
    setNewTime(d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }));
    setNewName(mass.name || "");
    setNewMax(mass.maxServers);
    if (mass.deadline) {
      const deadlineDate = new Date(mass.deadline);
      const offset = deadlineDate.getTimezoneOffset() * 60000;
      setNewDeadline(new Date(deadlineDate.getTime() - offset).toISOString().slice(0, 16));
    } else { setNewDeadline(""); }
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function handleCancelEdit() {
    setEditingId(null); setNewDate(""); setNewTime(""); setNewName(""); setNewMax(4); setNewDeadline("");
  }

  async function handleTogglePublish(id: string, currentStatus: boolean) {
    try { await api.patch(`/masses/${id}`, { published: !currentStatus }); onUpdate(); } 
    catch (error) { alert("Erro ao alterar status."); }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!newDate) return;
    try {
      const payload = { date: newDate, time: newTime, maxServers: newMax, name: newName, deadline: newDeadline || null };
      if (editingId) await api.put(`/masses/${editingId}`, payload);
      else await api.post("/masses", payload);
      onUpdate(); handleCancelEdit();
    } catch (error) { alert("Erro ao salvar."); }
  }

  async function handleDeleteMass(id: string) {
    if (confirm("Apagar missa?")) { await api.delete(`/masses/${id}`); onUpdate(); }
  }

  async function handleChangeRole(signupId: string, newRole: string) {
    await api.patch(`/signup/${signupId}/role`, { role: newRole }); onUpdate();
  }

  async function handleToggleSignup(massId: string) {
    try { await api.post("/toggle-signup", { userId: user.id, massId }); onUpdate(); } 
    catch (error) { alert("Erro ao se inscrever/sair."); }
  }

  async function handleTogglePresence(signupId: string) {
    try { await api.patch(`/signup/${signupId}/toggle-presence`); onUpdate(); }
    catch (error) { alert("Erro ao confirmar presença."); }
  }

  return (
    <div className="admin-container">
      {showTextModal && isAdmin && <ScaleModal masses={filteredMasses} onClose={() => setShowTextModal(false)} />}

      {/* HEADER */}
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
              <MonthlyReport masses={filteredMasses} />
              <button className="btn-header btn-white" onClick={() => setViewMode("pdf")}><FileText size={16} /> VER PDF</button>
              <button className="btn-header btn-green" onClick={() => setShowTextModal(true)}><Share2 size={16} /> WHATSAPP</button>
            </>
          )}
          <button className="btn-header btn-dark" onClick={onLogout}><X size={16} /> SAIR</button>
        </div>
      </div>

      {/* ÁREA DE AVISOS (SÓ ADMIN VÊ E EDITA) */}
      {isAdmin && (
        <div className="no-print" style={{ background: "#fff3cd", padding: "15px", borderRadius: "12px", marginBottom: "20px", border: "1px solid #ffeeba" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#856404", fontWeight: "bold", marginBottom: "10px" }}>
            <Megaphone size={18} /> Mural de Avisos
          </div>
          
          <form onSubmit={handleAddNotice} style={{ display: "flex", gap: "10px", marginBottom: "15px" }}>
            <input 
              type="text" 
              placeholder="Escreva um aviso para as servas..." 
              value={newNoticeText}
              onChange={(e) => setNewNoticeText(e.target.value)}
              style={{ flex: 1, padding: "8px", borderRadius: "6px", border: "1px solid #ddd" }}
            />
            <button type="submit" style={{ background: "#856404", color: "white", border: "none", padding: "0 15px", borderRadius: "6px", cursor: "pointer", fontWeight: "bold" }}>
              POSTAR
            </button>
          </form>

          {notices.length > 0 && (
            <ul style={{ listStyle: "none", padding: 0 }}>
              {notices.map(notice => (
                <li key={notice.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "white", padding: "8px 12px", borderRadius: "6px", marginBottom: "5px", border: "1px solid #eee" }}>
                  <span>{notice.text}</span>
                  <button onClick={() => handleDeleteNotice(notice.id)} style={{ background: "none", border: "none", color: "#c62828", cursor: "pointer" }}><Trash2 size={16} /></button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* FORMULÁRIO (Admin) */}
      {isAdmin && (
        <div className="new-mass-card no-print" style={{ borderColor: editingId ? "#F59E0B" : "#FFCDD2", background: editingId ? "#FFFBEB" : "#FFF5F5" }}>
          <div className="section-title" style={{ color: editingId ? "#B45309" : "#C62828" }}>
            {editingId ? <Edit size={20} /> : <PlusCircle size={20} />}
            <span>{editingId ? "Editando Missa" : "Nova Missa"}</span>
            {editingId && <button onClick={handleCancelEdit} className="cancel-edit-btn">Cancelar</button>}
          </div>
          <form onSubmit={handleSubmit} className="form-grid">
            <div className="form-group full-width"><label>Nome (Opcional)</label><input className="form-input" type="text" value={newName} onChange={(e) => setNewName(e.target.value)} /></div>
            <div className="form-group"><label>Data</label><input className="form-input" type="date" value={newDate} onChange={(e) => setNewDate(e.target.value)} required /></div>
            <div className="form-group"><label>Hora</label><input className="form-input" type="time" value={newTime} onChange={(e) => setNewTime(e.target.value)} required /></div>
            <div className="form-group full-width"><label style={{ color: "#d32f2f" }}>Prazo (Opcional)</label><input className="form-input" type="datetime-local" value={newDeadline} onChange={(e) => setNewDeadline(e.target.value)} style={{ borderColor: "#ef9a9a" }} /></div>
            <div className="form-group"><label>Vagas</label><input className="form-input" type="number" value={newMax} onChange={(e) => setNewMax(Number(e.target.value))} min="1" /></div>
            <button type="submit" className="btn-create" style={{ background: editingId ? "#F59E0B" : "#D37474" }}>{editingId ? "SALVAR" : "CRIAR MISSA"}</button>
          </form>
        </div>
      )}

      {/* FILTROS */}
      <div className="filter-section no-print" style={{ background: "#fff", padding: "20px", borderRadius: "16px", marginBottom: "20px", boxShadow: "0 2px 10px rgba(0,0,0,0.05)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#e91e63", fontWeight: "bold", marginBottom: "15px" }}>
          <Filter size={18} /> Filtrar Datas
        </div>
        <div style={{ display: "flex", gap: "15px", alignItems: "flex-end", flexWrap: "wrap" }}>
          <input type="date" className="form-input" value={startDate} onChange={(e) => setStartDate(e.target.value)} style={{ padding: "8px" }} />
          <input type="date" className="form-input" value={endDate} onChange={(e) => setEndDate(e.target.value)} style={{ padding: "8px" }} />
          <button onClick={() => { setStartDate(""); setEndDate(""); }} style={{ background: "#f5f5f5", border: "1px solid #ddd", padding: "10px 15px", borderRadius: "8px", cursor: "pointer" }}>Limpar</button>
        </div>
      </div>

      {/* LISTA DE MISSAS */}
      <div className="mass-list">
        {filteredMasses.map((mass) => {
          const isPublished = mass.published;
          const userIsIn = mass.signups.some(s => s.userId === user.id);
          const vagasRestantes = mass.maxServers - mass.signups.length;
          const showNameList = isAdmin || isPublished;

          return (
            <div key={mass.id} className="mass-list-item">
              <div style={{ flex: 1 }}>
                
                <div style={{ marginBottom: 15 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div>{mass.name && <div className="mass-label">{mass.name}</div>}</div>
                    {isAdmin && (
                      <button 
                        onClick={() => handleTogglePublish(mass.id, mass.published)}
                        className="no-print"
                        style={{
                          background: mass.published ? "#e8f5e9" : "#fff3e0",
                          color: mass.published ? "#2e7d32" : "#ef6c00",
                          border: mass.published ? "1px solid #c8e6c9" : "1px solid #ffe0b2",
                          padding: "4px 12px", borderRadius: "20px", cursor: "pointer", fontSize: "0.75rem", fontWeight: "bold",
                          display: "flex", alignItems: "center", gap: "5px", marginLeft: "10px"
                        }}
                      >
                        {mass.published ? "● Pública" : "○ Rascunho"}
                      </button>
                    )}
                  </div>
                  <h3 className="mass-date-title">
                    {new Date(mass.date).toLocaleString("pt-BR", { weekday: "long", day: "2-digit", month: "long", hour: "2-digit", minute: "2-digit" })}
                  </h3>
                  <div style={{ marginTop: "5px", color: vagasRestantes > 0 ? "#2e7d32" : "#c62828", fontWeight: "bold", fontSize: "0.9rem", display: "flex", alignItems: "center", gap: "5px" }}>
                    <UserIcon size={14} />
                    {vagasRestantes > 0 ? `${vagasRestantes} vaga(s) disponível(is)` : "LOTADO"}
                    <span style={{ color: "#666", fontWeight: "normal" }}>({mass.signups.length}/{mass.maxServers})</span>
                  </div>
                </div>

                {!isAdmin && (
                  <button
                    onClick={() => handleToggleSignup(mass.id)}
                    style={{
                      width: "100%", padding: "10px", marginTop: "10px", marginBottom: "15px", borderRadius: "8px", fontWeight: "bold", cursor: "pointer",
                      background: userIsIn ? "#ffebee" : (vagasRestantes > 0 ? "#e8f5e9" : "#e0e0e0"),
                      color: userIsIn ? "#c62828" : (vagasRestantes > 0 ? "#2e7d32" : "#9e9e9e"),
                      border: "none"
                    }}
                    disabled={!userIsIn && vagasRestantes <= 0}
                  >
                    {userIsIn ? "SAIR DA ESCALA" : (vagasRestantes > 0 ? "ENTRAR NA ESCALA" : "LOTADO")}
                  </button>
                )}

                {showNameList ? (
                  mass.signups.length === 0 ? (
                    <p className="empty-msg">Nenhuma inscrita.</p>
                  ) : (
                    <div style={{ overflowX: "auto" }}>
                      <table className="admin-table">
                        <tbody>
                          {mass.signups.map((signup) => (
                            <tr key={signup.id}>
                              <td>
                                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                  {isAdmin && (
                                    <button
                                      onClick={() => handleTogglePresence(signup.id)}
                                      title={signup.present ? "Presença Confirmada" : "Marcar Presença"}
                                      style={{
                                        background: "none", border: "none", cursor: "pointer",
                                        color: signup.present ? "#2e7d32" : "#e0e0e0",
                                        padding: 0, display: "flex", transition: "color 0.2s"
                                      }}
                                    >
                                      <CheckCircle size={20} fill={signup.present ? "#e8f5e9" : "none"} />
                                    </button>
                                  )}
                                  <span style={{ fontWeight: signup.present ? "bold" : "normal", color: signup.present ? "#2e7d32" : "#333" }}>
                                    {signup.user.name}
                                  </span>
                                </div>
                              </td>
                              <td style={{ textAlign: "right" }}>
                                {isAdmin ? (
                                  <select className="role-select" value={signup.role || "Auxiliar"} onChange={(e) => handleChangeRole(signup.id, e.target.value)}>
                                    {FUNCOES.map((f) => <option key={f} value={f}>{f}</option>)}
                                  </select>
                                ) : (
                                  <span style={{ fontSize: "0.85rem", color: "#666" }}>{signup.role || "Auxiliar"}</span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )
                ) : (
                  <div style={{ fontStyle: "italic", color: "#666", padding: "10px", background: "#f5f5f5", borderRadius: "8px", textAlign: "center", display: "flex", justifyContent: "center", gap: "5px" }}>
                    <Lock size={16} /> A lista de nomes estará disponível após a publicação oficial.
                  </div>
                )}
              </div>

              {isAdmin && (
                <div className="mass-actions">
                  <button className="icon-btn edit" onClick={() => handleStartEdit(mass)}><Edit size={22} /></button>
                  <button className="icon-btn delete" onClick={() => handleDeleteMass(mass.id)}><Trash2 size={22} /></button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}