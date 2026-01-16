import { useEffect, useState } from 'react';
import { Flower } from 'lucide-react';
import { api } from './services/api';
import { Mass, UserData } from './types';
import { AdminPanel } from './components/AdminPanel';
import { UserPanel } from './components/UserPanel';

function App() {
  const [user, setUser] = useState<UserData | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [masses, setMasses] = useState<Mass[]>([]);

  function fetchMasses() { api.get('/masses').then(response => setMasses(response.data)); }
  useEffect(() => { fetchMasses(); }, []);
  
  async function handleLogin(e: React.FormEvent) { e.preventDefault(); try { const response = await api.post('/login', { email, password }); setUser(response.data); setError(''); } catch (err) { setError('Dados incorretos.'); } }
  
  async function handleToggleSignup(massId: string) { if (!user) return; try { await api.post('/toggle-signup', { userId: user.id, massId }); fetchMasses(); } catch (error) { alert("Ação não permitida."); } }

  // TELA DE LOGIN
  if (!user) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="card" style={{ width: '100%', maxWidth: '350px', textAlign: 'center' }}>
          <div style={{ color: 'var(--rose-primary)', marginBottom: 20 }}><Flower size={48} strokeWidth={1.5} /></div>
          <h2 style={{ marginBottom: 10 }}>Bem-vinda, Serva</h2>
          <form onSubmit={handleLogin}>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" style={{marginBottom: 15}} />
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Senha" style={{marginBottom: 25}} />
            {error && <p style={{ color: 'var(--danger)', fontSize: '0.9rem' }}>{error}</p>}
            <button type="submit" className="btn-primary" style={{ width: '100%', padding: '14px', border: 'none', cursor: 'pointer' }}>Entrar</button>
          </form>
        </div>
      </div>
    );
  }

  const isAdmin = user.email === 'admin@escala.com' || user.email === 'teste@serva.com';

  // DECIDE QUAL PAINEL MOSTRAR
  if (isAdmin) {
    return <AdminPanel masses={masses} onUpdate={fetchMasses} onLogout={() => setUser(null)} />;
  }

  return <UserPanel masses={masses} user={user} onToggleSignup={handleToggleSignup} onLogout={() => setUser(null)} />;
}

export default App;