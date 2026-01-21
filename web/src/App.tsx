import { useEffect, useState } from "react";
import { Flower, RefreshCw } from "lucide-react"; // Adicionei RefreshCw para o ícone
import { api } from "./services/api";
import { Mass, UserData } from "./types/types";
import { AdminPanel } from "./components/AdminPanel";
import { UserPanel } from "./components/UserPanel";
// Importação do PWA (Virtual Module)
import { useRegisterSW } from "virtual:pwa-register/react"; 

function App() {
  // --- LÓGICA DO PWA (ATUALIZAÇÃO) ---
  const {
    needRefresh: [needRefresh], // <--- Removemos a vírgula e o setNeedRefresh
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      console.log("SW Registered: " + r);
    },
    onRegisterError(error) {
      console.log("SW registration error", error);
    },
  });

  // --- LÓGICA EXISTENTE DO APP ---
  const [user, setUser] = useState<UserData | null>(() => {
    const storedUser = localStorage.getItem("servas_user");
    if (storedUser) {
      try {
        return JSON.parse(storedUser);
      } catch (error) {
        console.error("Erro ao ler usuário salvo:", error);
        return null;
      }
    }
    return null;
  });

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [masses, setMasses] = useState<Mass[]>([]);
  const [loading, setLoading] = useState(false);

  async function fetchMasses() {
    try {
      setLoading(true);
      // Adicionei timestamp para evitar cache de API
      const response = await api.get(`/masses?t=${new Date().getTime()}`);
      const sorted = response.data.sort((a: Mass, b: Mass) => 
        new Date(a.date).getTime() - new Date(b.date).getTime()
      );
      setMasses(sorted);
    } catch (err) {
      console.error("Erro ao buscar missas:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (user) {
      fetchMasses();
    }
  }, []);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    try {
      const response = await api.post("/login", { email, password });
      const userData = response.data;
      setUser(userData);
      localStorage.setItem("servas_user", JSON.stringify(userData));
      setError("");
      await fetchMasses(); 
    } catch (err) {
      console.error(err);
      setError("E-mail ou senha incorretos.");
    }
  }

  function handleLogout() {
    setUser(null);
    setMasses([]);
    localStorage.removeItem("servas_user");
    setEmail("");
    setPassword("");
  }

  async function handleToggleSignup(massId: string) {
    if (!user) return;
    try {
      await api.post("/toggle-signup", { userId: user.id, massId });
      fetchMasses(); 
    } catch (error) {
      alert("Ação não permitida. Verifique se o prazo encerrou ou se está lotado.");
    }
  }

  // --- RENDERIZAÇÃO ---

  // 1. TELA DE LOGIN
  if (!user) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f5f5f5" }}>
        <div className="card" style={{ width: "100%", maxWidth: "350px", textAlign: "center", background: "white", padding: "40px", borderRadius: "12px", boxShadow: "0 4px 15px rgba(0,0,0,0.1)" }}>
          <div style={{ color: "#e91e63", marginBottom: 20, display: "flex", justifyContent: "center" }}>
            <Flower size={48} strokeWidth={1.5} />
          </div>
          <h2 style={{ marginBottom: 10, color: "#333" }}>Bem-vinda, Serva</h2>
          <p style={{ color: "#666", fontSize: "0.9rem", marginBottom: 30 }}>Faça login para ver a escala</p>

          <form onSubmit={handleLogin}>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Seu E-mail" style={{ marginBottom: 15, width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #ddd", boxSizing: "border-box" }} />
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Sua Senha" style={{ marginBottom: 25, width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #ddd", boxSizing: "border-box" }} />
            {error && <p style={{ color: "#d32f2f", fontSize: "0.9rem", marginBottom: 15 }}>{error}</p>}
            <button type="submit" style={{ width: "100%", padding: "14px", border: "none", cursor: "pointer", borderRadius: "8px", fontWeight: "bold", fontSize: "1rem", background: "#e91e63", color: "white" }}>
              ENTRAR
            </button>
          </form>
        </div>
        {/* Mesmo na tela de login, mostramos o botão de update se houver */}
        {needRefresh && <UpdateToast onUpdate={() => updateServiceWorker(true)} />}
      </div>
    );
  }

  // 2. LOADING SPINNER
  if (loading && masses.length === 0) {
    return (
      <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", height: "100vh", background: "#f5f5f5" }}>
        <style>{`
          .loader { border: 4px solid #f3f3f3; border-top: 4px solid #e91e63; border-radius: 50%; width: 40px; height: 40px; animation: spin 1s linear infinite; }
          @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        `}</style>
        <div className="loader"></div>
        <p style={{ color: "#666", fontWeight: "500", marginTop: "15px" }}>Buscando escala...</p>
      </div>
    );
  }

  // 3. PAINÉIS PRINCIPAIS
  return (
    <>
      {user.role === "ADMIN" ? (
        <AdminPanel masses={masses} user={user} onUpdate={fetchMasses} onLogout={handleLogout} />
      ) : (
        <UserPanel masses={masses} user={user} onToggleSignup={handleToggleSignup} onLogout={handleLogout} />
      )}

      {/* --- BOTÃO FLUTUANTE DE ATUALIZAÇÃO PWA --- */}
      {needRefresh && <UpdateToast onUpdate={() => updateServiceWorker(true)} />}
    </>
  );
}

// Componente visual do Toast de Atualização (Fica no final do arquivo)
function UpdateToast({ onUpdate }: { onUpdate: () => void }) {
  return (
    <div style={{
      position: 'fixed', bottom: '20px', left: '50%', transform: 'translateX(-50%)',
      background: '#333', color: 'white', padding: '15px 20px', borderRadius: '12px',
      display: 'flex', alignItems: 'center', gap: '15px', zIndex: 10000,
      boxShadow: '0 4px 12px rgba(0,0,0,0.3)', width: '90%', maxWidth: '400px'
    }}>
      <div style={{ flex: 1 }}>
        <span style={{ fontSize: '0.9rem', fontWeight: 'bold', display: 'block' }}>Nova versão disponível!</span>
        <span style={{ fontSize: '0.8rem', opacity: 0.8 }}>Atualize para ver as novidades.</span>
      </div>
      <button 
        onClick={onUpdate} 
        style={{
          background: '#e91e63', color: 'white', border: 'none', padding: '8px 15px',
          borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px'
        }}
      >
        <RefreshCw size={14} /> ATUALIZAR
      </button>
    </div>
  );
}

export default App;