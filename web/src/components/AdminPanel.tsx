import { useState } from "react";
import { Shield, FileText, Share2, Edit, PlusCircle, X, Trash2, Filter, User as UserIcon, CheckCircle, Lock, LockOpen, Trophy, BarChart2 } from "lucide-react";
import { api } from "../services/api";
import { Mass, FUNCOES, User } from "../types/types";
import { ScaleModal } from "./ScaleModal";
import { OfficialDocument } from "./OfficialDocument";
// Removi o MonthlyReport pois o StatisticsModal substitui ele com mais detalhes, 
// mas se quiser manter os dois, pode deixar. Vou usar o novo StatisticsModal.
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

export function AdminPanel({ masses, user, onUpdate, onLogout }: AdminPanelProps) {
  const isAdmin = user.role === "ADMIN";

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
  const [showStatsModal, setShowStatsModal] = useState(false); // <--- NOVO STATE

  // Filtros
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const filteredMasses = masses.filter((mass) => {
    const massDate = new Date(mass.date).toISOString().split("T")[0];
    if (startDate && massDate < startDate) return false;
    if (endDate && massDate > endDate) return false;
    return true;
  });

  if (viewMode === "pdf" && isAdmin) return <OfficialDocument masses={filteredMasses} onBack={() => setViewMode("dashboard")} />;

  // --- Funções CRUD ---
  function handleStartEdit(mass: Mass) {
    const d = new Date(mass.date); setEditingId(mass.id);
    const localDate = new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().split("T")[0];
    setNewDate(localDate); setNewTime(d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }));
    setNewName(mass.name || ""); setNewMax(mass.maxServers);
    if (mass.deadline) { const deadlineDate = new Date(mass.deadline); const offset = deadlineDate.getTimezoneOffset() * 60000; setNewDeadline(new Date(deadlineDate.getTime() - offset).toISOString().slice(0, 16)); } else { setNewDeadline(""); }
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
  function handleCancelEdit() { setEditingId(null); setNewDate(""); setNewTime(""); setNewName(""); setNewMax(4); setNewDeadline(""); }
  async function handleTogglePublish(id: string, currentStatus: boolean) { try { await api.patch(`/masses/${id}`, { published: !currentStatus }); onUpdate(); } catch (error) { alert("Erro ao alterar status."); } }
  async function handleToggleOpen(id: string, currentOpen: boolean) { try { await api.patch(`/masses/${id}/toggle-open`, { open: !currentOpen }); onUpdate(); } catch (error) { alert("Erro ao alterar cadeado."); } }
  async function handleSubmit(e: React.FormEvent) { e.preventDefault(); if (!newDate) return; try { const payload = { date: newDate, time: newTime, maxServers: newMax, name: newName, deadline: newDeadline || null }; if (editingId) await api.put(`/masses/${editingId}`, payload); else await api.post("/masses", payload); onUpdate(); handleCancelEdit(); } catch (error) { alert("Erro ao salvar."); } }
  async function handleDeleteMass(id: string) { if (confirm("Apagar missa?")) { await api.delete(`/masses/${id}`); onUpdate(); } }
  async function handleChangeRole(signupId: string, newRole: string) { await api.patch(`/signup/${signupId}/role`, { role: newRole }); onUpdate(); }
  async function handleToggleSignup(massId: string) { try { await api.post("/toggle-signup", { userId: user.id, massId }); onUpdate(); } catch (error) { alert("Erro ao se inscrever/sair."); } }
  async function handleTogglePresence(signupId: string) { try { await api.patch(`/signup/${signupId}/toggle-presence`); onUpdate(); } catch (error) { alert("Erro ao confirmar presença."); } }

  return (
    <div className="admin-container">
      {/* MODAIS */}
      {showTextModal && isAdmin && <ScaleModal masses={filteredMasses} onClose={() => setShowTextModal(false)} />}
      {showRankingModal && isAdmin && <GeneralRankingModal masses={masses} onClose={() => setShowRankingModal(false)} />}
      {showStatsModal && isAdmin && <StatisticsModal masses={masses} onClose={() => setShowStatsModal(false)} />}

      <div className="admin-header no-print">
        <div className="header-brand">
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Shield size={28} />
            <div><h1>{isAdmin ? "Painel Admin" : "Escala de Servas"}</h1><span>{user.name}</span></div>
          </div>
        </div>
        <div className="header-actions" style={{ display: "flex", gap: "10px", flexWrap: "wrap", justifyContent: "center" }}>
          {isAdmin && (
            <>
              {/* BOTÃO RELATÓRIO MENSAL */}
              <button 
                className="btn-header" 
                onClick={() => setShowStatsModal(true)} 
                style={{ background: "#e3f2fd", color: "#1565c0", border: "1px solid #90caf9" }}
              >
                <BarChart2 size={16} /> RELATÓRIO MENSAL
              </button>

              <button className="btn-header" onClick={() => setShowRankingModal(true)} style={{ background: "#fff8e1", color: "#f57f17", border: "1px solid #ffca28" }}><Trophy size={16} /> RANKING GERAL</button>
              <button className="btn-header btn-white" onClick={() => setViewMode("pdf")}><FileText size={16} /> VER PDF</button>
              <button className="btn-header btn-green" onClick={() => setShowTextModal(true)}><Share2 size={16} /> WHATSAPP</button>
            </>
          )}
          <button className="btn-header btn-dark" onClick={onLogout}><X size={16} /> SAIR</button>
        </div>
      </div>

      {isAdmin && <NoticeBoard />}

      {isAdmin && (
        <div className="new-mass-card no-print" style={{ borderColor: editingId ? "#F59E0B" : "#FFCDD2", background: editingId ? "#FFFBEB" : "#FFF5F5" }}>
          <div className="section-title" style={{ color: editingId ? "#B45309" : "#C62828" }}>
            {editingId ? <Edit size={20} /> : <PlusCircle size={20} />} <span>{editingId ? "Editando Missa" : "Nova Missa"}</span>
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

      <div className="filter-section no-print" style={{ background: "#fff", padding: "20px", borderRadius: "16px", marginBottom: "20px", boxShadow: "0 2px 10px rgba(0,0,0,0.05)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#e91e63", fontWeight: "bold", marginBottom: "15px" }}><Filter size={18} /> Filtrar Datas</div>
        <div style={{ display: "flex", gap: "15px", alignItems: "flex-end", flexWrap: "wrap" }}>
          <input type="date" className="form-input" value={startDate} onChange={(e) => setStartDate(e.target.value)} style={{ padding: "8px" }} />
          <input type="date" className="form-input" value={endDate} onChange={(e) => setEndDate(e.target.value)} style={{ padding: "8px" }} />
          <button onClick={() => { setStartDate(""); setEndDate(""); }} style={{ background: "#f5f5f5", border: "1px solid #ddd", padding: "10px 15px", borderRadius: "8px", cursor: "pointer" }}>Limpar</button>
        </div>
      </div>

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
                      <div style={{ display: "flex", gap: "5px", marginLeft: "10px" }}>
                        <button onClick={() => handleTogglePublish(mass.id, mass.published)} className="no-print" style={{ background: mass.published ? "#e8f5e9" : "#fff3e0", color: mass.published ? "#2e7d32" : "#ef6c00", border: mass.published ? "1px solid #c8e6c9" : "1px solid #ffe0b2", padding: "4px 8px", borderRadius: "20px", cursor: "pointer", fontSize: "0.75rem", fontWeight: "bold", display: "flex", alignItems: "center", gap: "5px" }}>
                          {mass.published ? "● Pública" : "○ Rascunho"}
                        </button>
                        <button onClick={() => handleToggleOpen(mass.id, mass.open)} className="no-print" title={mass.open ? "Inscrições Abertas" : "Inscrições Fechadas"} style={{ background: mass.open ? "#e3f2fd" : "#eceff1", color: mass.open ? "#1976d2" : "#546e7a", border: mass.open ? "1px solid #90caf9" : "1px solid #cfd8dc", padding: "4px 8px", borderRadius: "20px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          {mass.open ? <LockOpen size={14} /> : <Lock size={14} />}
                        </button>
                      </div>
                    )}
                  </div>
                  <h3 className="mass-date-title">{new Date(mass.date).toLocaleString("pt-BR", { weekday: "long", day: "2-digit", month: "long", hour: "2-digit", minute: "2-digit" })}</h3>
                  <div style={{ marginTop: "5px", color: vagasRestantes > 0 ? "#2e7d32" : "#c62828", fontWeight: "bold", fontSize: "0.9rem", display: "flex", alignItems: "center", gap: "5px" }}>
                    <UserIcon size={14} />{vagasRestantes > 0 ? `${vagasRestantes} vaga(s) disponível(is)` : "LOTADO"}<span style={{ color: "#666", fontWeight: "normal" }}>({mass.signups.length}/{mass.maxServers})</span>
                  </div>
                </div>
                {!isAdmin && (
                  <button onClick={() => handleToggleSignup(mass.id)} style={{ width: "100%", padding: "10px", marginTop: "10px", marginBottom: "15px", borderRadius: "8px", fontWeight: "bold", cursor: "pointer", background: userIsIn ? "#ffebee" : (vagasRestantes > 0 ? "#e8f5e9" : "#e0e0e0"), color: userIsIn ? "#c62828" : (vagasRestantes > 0 ? "#2e7d32" : "#9e9e9e"), border: "none" }} disabled={!userIsIn && vagasRestantes <= 0}>
                    {userIsIn ? "SAIR DA ESCALA" : (vagasRestantes > 0 ? "ENTRAR NA ESCALA" : "LOTADO")}
                  </button>
                )}
                {showNameList ? (
                  mass.signups.length === 0 ? <p className="empty-msg">Nenhuma inscrita.</p> : (
                    <div style={{ overflowX: "auto" }}>
                      <table className="admin-table">
                        <tbody>
                          {mass.signups.map((signup) => (
                            <tr key={signup.id}>
                              <td>
                                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                  {isAdmin && (
                                    <button onClick={() => handleTogglePresence(signup.id)} title={signup.present ? "Presença Confirmada" : "Marcar Presença"} style={{ background: "none", border: "none", cursor: "pointer", color: signup.present ? "#2e7d32" : "#e0e0e0", padding: 0, display: "flex", transition: "color 0.2s" }}>
                                      <CheckCircle size={20} fill={signup.present ? "#e8f5e9" : "none"} />
                                    </button>
                                  )}
                                  <span style={{ fontWeight: signup.present ? "bold" : "normal", color: signup.present ? "#2e7d32" : "#333" }}>{signup.user.name}</span>
                                </div>
                              </td>
                              <td style={{ textAlign: "right" }}>
                                {isAdmin ? (
                                  <select className="role-select" value={signup.role || "Auxiliar"} onChange={(e) => handleChangeRole(signup.id, e.target.value)}>
                                    {FUNCOES.map((f) => <option key={f} value={f}>{f}</option>)}
                                  </select>
                                ) : <span style={{ fontSize: "0.85rem", color: "#666" }}>{signup.role || "Auxiliar"}</span>}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )
                ) : <div style={{ fontStyle: "italic", color: "#666", padding: "10px", background: "#f5f5f5", borderRadius: "8px", textAlign: "center", display: "flex", justifyContent: "center", gap: "5px" }}><Lock size={16} /> A lista de nomes estará disponível após a publicação oficial.</div>}
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