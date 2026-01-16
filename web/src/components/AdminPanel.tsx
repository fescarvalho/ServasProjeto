import { useState } from 'react';
import { Shield, FileText, Share2, Edit, PlusCircle, X, Trash2 } from 'lucide-react';
import { api } from '../services/api';
import { Mass, FUNCOES } from '../types';
import { ScaleModal } from './ScaleModal';
import { OfficialDocument } from './OfficialDocument';

interface AdminPanelProps {
  masses: Mass[];
  onUpdate: () => void;
  onLogout: () => void;
}

export function AdminPanel({ masses, onUpdate, onLogout }: AdminPanelProps) {
  const [newDate, setNewDate] = useState('');
  const [newTime, setNewTime] = useState('');
  const [newName, setNewName] = useState('');
  const [newMax, setNewMax] = useState(4);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'dashboard' | 'pdf'>('dashboard');
  const [showTextModal, setShowTextModal] = useState(false);
  const [newDeadline, setNewDeadline] = useState('');

  if (viewMode === 'pdf') {
    return <OfficialDocument masses={masses} onBack={() => setViewMode('dashboard')} />;
  }

  function handleStartEdit(mass: Mass) {
    const d = new Date(mass.date);
    setEditingId(mass.id);
    setNewDate(d.toISOString().split('T')[0]);
    setNewTime(d.toLocaleTimeString('pt-BR', {hour:'2-digit', minute:'2-digit'}));
    setNewName(mass.name || '');
    setNewMax(mass.maxServers);
    
    // Se tiver deadline, preenche o campo. O input datetime-local pede formato YYYY-MM-DDTHH:MM
    if (mass.deadline) {
      const deadlineDate = new Date(mass.deadline);
      // Truque para ajustar fuso horário local no input
      const offset = deadlineDate.getTimezoneOffset() * 60000;
      const localISOTime = (new Date(deadlineDate.getTime() - offset)).toISOString().slice(0, 16);
      setNewDeadline(localISOTime);
    } else {
      setNewDeadline('');
    }
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function handleCancelEdit() { 
    setEditingId(null); setNewDate(''); setNewTime(''); setNewName(''); setNewMax(4); setNewDeadline(''); 
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
        deadline: newDeadline || null // Envia o prazo
      };
      
      if (editingId) await api.put(`/masses/${editingId}`, payload);
      else await api.post('/masses', payload);
      
      onUpdate(); handleCancelEdit();
    } catch (error) { alert("Erro"); }
  }

  async function handleDeleteMass(id: string) { if (confirm("Apagar?")) { await api.delete(`/masses/${id}`); onUpdate(); } }
  async function handleChangeRole(signupId: string, newRole: string) { await api.patch(`/signup/${signupId}/role`, { role: newRole }); onUpdate(); }

  return (
    <div className="container" style={{ maxWidth: '800px', padding: 20 }}>
      {showTextModal && <ScaleModal masses={masses} onClose={() => setShowTextModal(false)} />}

      <div className="no-print" style={{ background: '#333', color: 'white', padding: 20, borderRadius: 12, marginBottom: 30, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Shield size={24} />
          <div><h2 style={{ margin: 0, fontSize: 18, color: 'white' }}>Painel Admin</h2><p style={{ margin: 0, fontSize: 12, opacity: 0.7 }}>Gerenciamento</p></div>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
           <button onClick={() => setViewMode('pdf')} style={{ background: 'white', color: '#333', border: 'none', padding: '8px 12px', borderRadius: 6, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, fontWeight: 'bold' }}>
             <FileText size={16} /> Ver PDF Oficial
           </button>
           <button onClick={() => setShowTextModal(true)} style={{ background: '#25D366', color: 'white', border: 'none', padding: '8px 12px', borderRadius: 6, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, fontWeight: 'bold' }}>
             <Share2 size={16} /> WhatsApp
           </button>
           <button onClick={onLogout} style={{ background: '#555', color: 'white', border: 'none', padding: '8px 12px', borderRadius: 6, cursor: 'pointer' }}>Sair</button>
        </div>
      </div>

      <div className="card no-print" style={{ background: editingId ? '#fff8e1' : '#fff0f3', borderColor: editingId ? '#ffc107' : 'var(--rose-primary)' }}>
         <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 }}>
          <h3 style={{ margin: 0, color: editingId ? '#d39e00' : 'var(--rose-dark)', display: 'flex', alignItems: 'center', gap: 8 }}>{editingId ? <><Edit size={20} /> Editando</> : <><PlusCircle size={20} /> Nova Missa</>}</h3>
          {editingId && <button onClick={handleCancelEdit} style={{ background: 'transparent', border: '1px solid #d39e00', color: '#d39e00', padding: '5px 10px', borderRadius: 5, cursor: 'pointer' }}><X size={14} /> Cancelar</button>}
        </div>
        <form onSubmit={handleSubmit} style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div style={{ flex: 2, minWidth: 200 }}><label style={{ fontSize: 12, fontWeight: 600, color: '#666' }}>Nome</label><input type="text" value={newName} onChange={e => setNewName(e.target.value)} style={{ padding: 10 }} /></div>
          <div style={{ flex: 1, minWidth: 120 }}><label style={{ fontSize: 12, fontWeight: 600, color: '#666' }}>Data Missa</label><input type="date" value={newDate} onChange={e => setNewDate(e.target.value)} style={{ padding: 10 }} /></div>
          <div style={{ flex: 1, minWidth: 90 }}><label style={{ fontSize: 12, fontWeight: 600, color: '#666' }}>Hora</label><input type="time" value={newTime} onChange={e => setNewTime(e.target.value)} style={{ padding: 10 }} /></div>
          
          {/* CAMPO DE PRAZO LIMITE ADICIONADO AQUI */}
          <div style={{ flex: 1.5, minWidth: 160 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#d32f2f' }}>Prazo Inscrição (Opcional)</label>
            <input 
              type="datetime-local" 
              value={newDeadline} 
              onChange={e => setNewDeadline(e.target.value)} 
              style={{ padding: 10, borderColor: '#d32f2f', color: '#d32f2f', width: '100%' }} 
            />
          </div>

          <div style={{ width: 80 }}><label style={{ fontSize: 12, fontWeight: 600, color: '#666' }}>Vagas</label><input type="number" value={newMax} onChange={e => setNewMax(Number(e.target.value))} style={{ padding: 10 }} /></div>
          <button type="submit" className="btn-primary" style={{ padding: '12px 20px', border: 'none', height: 46, cursor: 'pointer', background: editingId ? '#ffc107' : 'var(--rose-primary)', color: editingId ? '#333' : 'white' }}>{editingId ? "Salvar" : "Criar"}</button>
        </form>
      </div>

      <div style={{ display: 'grid', gap: 20 }}>
        {masses.map(mass => (
          <div key={mass.id} style={{ background: 'white', padding: 20, borderRadius: 12, border: '1px solid #ddd', boxShadow: '0 2px 5px rgba(0,0,0,0.05)', position: 'relative' }}>
            <div className="no-print" style={{ position: 'absolute', top: 15, right: 15, display: 'flex', gap: 10 }}>
              <button onClick={() => handleStartEdit(mass)} style={{ background: 'transparent', border: 'none', color: '#ffc107', cursor: 'pointer' }}><Edit size={20} /></button>
              <button onClick={() => handleDeleteMass(mass.id)} style={{ background: 'transparent', border: 'none', color: '#ccc', cursor: 'pointer' }}><Trash2 size={20} /></button>
            </div>
            {mass.name && <h4 style={{ margin: '0 0 5px 0', color: 'var(--rose-dark)', fontSize: 14, textTransform: 'uppercase', letterSpacing: 1 }}>{mass.name}</h4>}
            <h3 style={{ margin: '0 0 15px 0', borderBottom: '1px solid #eee', paddingBottom: 10, color: '#333' }}>
              {new Date(mass.date).toLocaleString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long', hour: '2-digit', minute: '2-digit' })}
            </h3>
            {mass.signups.length === 0 ? <p style={{ color: '#999', fontSize: 14 }}>Nenhuma serva inscrita.</p> : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <tbody>
                  {mass.signups.map(signup => (
                    <tr key={signup.id} style={{ borderTop: '1px solid #f0f0f0' }}>
                      <td style={{ padding: 10, fontWeight: 600 }}>{signup.user.name}</td>
                      <td style={{ padding: 10 }}>
                        <select value={signup.role || "Auxiliar"} onChange={(e) => handleChangeRole(signup.id, e.target.value)} style={{ padding: 8, borderRadius: 6, border: '1px solid #ccc', width: '100%' }}>
                          {FUNCOES.map(f => <option key={f} value={f}>{f}</option>)}
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}