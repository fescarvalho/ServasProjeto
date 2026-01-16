import { useState, useEffect } from 'react';
import { Flower, Calendar, FileText, User, Clock, AlertTriangle } from 'lucide-react';
import { Mass, UserData } from '../types';
import { OfficialDocument } from './OfficialDocument';

interface UserPanelProps {
  masses: Mass[];
  user: UserData;
  onToggleSignup: (massId: string) => void;
  onLogout: () => void;
}

// --- COMPONENTE DE CRONÔMETRO ---
function CountdownTimer({ deadline }: { deadline: string }) {
  const [timeLeft, setTimeLeft] = useState("");
  const [expired, setExpired] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date().getTime();
      const distance = new Date(deadline).getTime() - now;

      if (distance < 0) {
        setExpired(true);
        setTimeLeft("ENCERRADO");
        clearInterval(interval);
      } else {
        const days = Math.floor(distance / (1000 * 60 * 60 * 24));
        const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);
        
        setTimeLeft(`${days}d ${hours.toString().padStart(2,'0')}h ${minutes.toString().padStart(2,'0')}m ${seconds.toString().padStart(2,'0')}s`);
        setExpired(false);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [deadline]);

  if (expired) {
    return <span style={{ color: 'red', fontWeight: 'bold', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: 4 }}><AlertTriangle size={14} /> INSCRIÇÕES ENCERRADAS</span>;
  }

  return (
    <span style={{ color: '#d32f2f', fontWeight: 'bold', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: 4, background: '#ffebee', padding: '4px 8px', borderRadius: 4 }}>
      <Clock size={14} /> Encerra em: {timeLeft}
    </span>
  );
}

export function UserPanel({ masses, user, onToggleSignup, onLogout }: UserPanelProps) {
  const [activeTab, setActiveTab] = useState<'inscricoes' | 'documento'>('inscricoes');

  // Verifica se o prazo acabou
  const isExpired = (deadline?: string) => {
    if (!deadline) return false;
    return new Date() > new Date(deadline);
  };

  return (
    <div>
      <div className="header-hero no-print">
        <div className="container">
          <div style={{ display: 'flex', justifyContent: 'center', color: 'var(--rose-primary)', marginBottom: 10 }}><Flower size={40} strokeWidth={1} /></div>
          <h1>Escala das Servas</h1>
          <p>"Tudo é grande quando feito por amor."</p>
        </div>
      </div>
      
      <div className="container no-print" style={{ display: 'flex', justifyContent: 'center', gap: 10, marginTop: '-60px', marginBottom: 20 }}>
          <button onClick={() => setActiveTab('inscricoes')} style={{ flex: 1, padding: '15px', borderRadius: '12px', border: 'none', cursor: 'pointer', background: activeTab === 'inscricoes' ? 'white' : 'rgba(255,255,255,0.5)', color: activeTab === 'inscricoes' ? 'var(--rose-primary)' : '#666', fontWeight: 'bold', boxShadow: activeTab === 'inscricoes' ? '0 5px 15px rgba(0,0,0,0.1)' : 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <Calendar size={18} /> Inscrições
          </button>
          <button onClick={() => setActiveTab('documento')} style={{ flex: 1, padding: '15px', borderRadius: '12px', border: 'none', cursor: 'pointer', background: activeTab === 'documento' ? 'white' : 'rgba(255,255,255,0.5)', color: activeTab === 'documento' ? 'var(--rose-primary)' : '#666', fontWeight: 'bold', boxShadow: activeTab === 'documento' ? '0 5px 15px rgba(0,0,0,0.1)' : 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <FileText size={18} /> Documento PDF
          </button>
           <button onClick={onLogout} style={{ padding: '15px', borderRadius: '12px', border: 'none', background: 'rgba(255,255,255,0.3)', cursor: 'pointer', color: '#555' }}>Sair</button>
      </div>

      {activeTab === 'inscricoes' ? (
         <div className="container" style={{ marginTop: '-20px' }}>
            <div style={{ display: 'grid', gap: 20 }}>
                {masses.map(mass => {
                    const vagasRestantes = mass.maxServers - mass._count.signups;
                    const jaEstouInscrita = mass.signups.some(s => s.userId === user.id);
                    const minhaFuncao = mass.signups.find(s => s.userId === user.id)?.role;
                    const prazoEncerrado = isExpired(mass.deadline);

                    return (
                    <div key={mass.id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '15px', opacity: prazoEncerrado ? 0.7 : 1 }}>
                        
                        {mass.deadline && (
                          <div style={{ marginBottom: -10, display: 'flex', justifyContent: 'flex-end' }}>
                            <CountdownTimer deadline={mass.deadline} />
                          </div>
                        )}

                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                          <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                              <div style={{ background: 'var(--rose-primary)', color: 'white', padding: '10px 15px', borderRadius: '12px', textAlign: 'center', minWidth: '60px' }}>
                              <span style={{ display: 'block', fontSize: '1.2rem', fontWeight: 'bold', lineHeight: 1 }}>{new Date(mass.date).toLocaleDateString('pt-BR', { day: '2-digit' })}</span>
                              <span style={{ fontSize: '0.7rem', fontWeight: 600 }}>{new Date(mass.date).toLocaleDateString('pt-BR', { month: 'short' }).toUpperCase()}</span>
                              </div>
                              <div>
                              {mass.name && <div style={{ color: 'var(--rose-primary)', fontWeight: 'bold', fontSize: '0.9rem', marginBottom: 2 }}>{mass.name}</div>}
                              <h3 style={{ margin: 0, fontSize: '1.1rem', textTransform: 'capitalize' }}>{new Date(mass.date).toLocaleDateString('pt-BR', { weekday: 'long' })}</h3>
                              <span style={{ color: 'var(--text-light)', fontSize: '0.9rem' }}>Horário: {new Date(mass.date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                              </div>
                          </div>
                          {jaEstouInscrita && minhaFuncao && <div className="tag-role">{minhaFuncao}</div>}
                        </div>
                        
                        <div style={{ height: '1px', background: '#f0f0f0', width: '100%' }}></div>
                        
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-light)' }}>
                              <User size={18} />
                              <span style={{ fontSize: '0.9rem' }}><strong style={{ color: 'var(--rose-primary)' }}>{mass._count.signups}</strong> / {mass.maxServers} vagas</span>
                          </div>
                          
                          {/* BOTÃO DE AÇÃO */}
                          <button 
                            onClick={() => onToggleSignup(mass.id)}
                            // 🛑 BLOQUEIO TOTAL SE PRAZO ENCERRADO
                            disabled={prazoEncerrado || (!jaEstouInscrita && vagasRestantes <= 0)}
                            style={{
                              // Se prazo encerrado -> cinza para todo mundo
                              background: prazoEncerrado 
                                ? '#e0e0e0' 
                                : (jaEstouInscrita ? 'white' : (vagasRestantes > 0 ? 'var(--rose-primary)' : '#e0e0e0')),
                              
                              color: prazoEncerrado 
                                ? '#888' 
                                : (jaEstouInscrita ? 'var(--danger)' : (vagasRestantes > 0 ? 'white' : '#888')),
                              
                              border: jaEstouInscrita && !prazoEncerrado ? '1px solid var(--danger)' : 'none',
                              
                              padding: '10px 24px',
                              cursor: (!prazoEncerrado && (jaEstouInscrita || vagasRestantes > 0)) ? 'pointer' : 'not-allowed',
                              display: 'flex', alignItems: 'center', gap: 8
                            }}
                          >
                             {prazoEncerrado 
                                ? "Prazo Encerrado" 
                                : (jaEstouInscrita ? "Desistir" : (vagasRestantes > 0 ? "Servir" : "Lotado"))
                             }
                          </button>
                        </div>
                        
                        {/* MENSAGEM EXTRA SE ACABOU O PRAZO */}
                        {prazoEncerrado && (
                           <div style={{ textAlign: 'center', fontSize: '0.8rem', color: '#999', marginTop: -5 }}>
                             Inscrições encerradas. Contate a admin se necessário.
                           </div>
                        )}

                    </div>
                    )
                })}
            </div>
         </div>
      ) : (
         <OfficialDocument masses={masses} />
      )}
    </div>
  )
}