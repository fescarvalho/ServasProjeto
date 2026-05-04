import { useEffect, useState, useCallback } from "react";
import { Flower, RefreshCw } from "lucide-react";
import { useAuth } from "./hooks/useAuth";
import { useMasses } from "./hooks/useMasses";
import { useSignup } from "./hooks/useSignup";
import { AdminPanel } from "./components/AdminPanel";
import { UserPanel } from "./components/UserPanel";
import { useRegisterSW } from "virtual:pwa-register/react";
import { theme } from "./theme/theme";
import { subscribeToPushNotifications } from "./services/push";
import { getLastOnline, setLastOnline } from "./services/storage/localStorage.service";

// Tempo máximo offline antes de forçar logout (2 minutos em ms)
const OFFLINE_TIMEOUT_MS = 2 * 60 * 1000;

function App() {
  // PWA Hook
  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      console.log("SW Registered: " + r);
    },
    onRegisterError(error) {
      console.log("SW registration error", error);
    },
  });

  // Authentication
  const { user, login, logout, error: authError } = useAuth();

  // Masses management
  const { masses, fetchMasses, isLoading } = useMasses();

  // Signup management
  const { toggleSignup } = useSignup(fetchMasses);

  // Login form state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // --- LÓGICA DE EXPIRAÇÃO POR TEMPO OFFLINE ---
  const checkExpiration = useCallback(() => {
    if (!user) return;

    const lastOnline = getLastOnline();
    const now = Date.now();

    if (lastOnline !== null && now - lastOnline > OFFLINE_TIMEOUT_MS) {
      // Ficou ausente/offline por mais de 2 minutos → força logout
      logout();
      return;
    }

    // Ainda dentro do prazo → atualiza o timestamp
    setLastOnline();
  }, [user, logout]);

  useEffect(() => {
    if (!user) return;

    // Verifica ao voltar a ter conexão (offline → online)
    const handleOnline = () => checkExpiration();

    // Verifica ao voltar do segundo plano (celular)
    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        checkExpiration();
      }
    };

    // Atualiza o timestamp enquanto está ativo e conectado (a cada 30s)
    const keepAlive = setInterval(() => {
      if (navigator.onLine && document.visibilityState === "visible") {
        setLastOnline();
      }
    }, 30_000);

    window.addEventListener("online", handleOnline);
    document.addEventListener("visibilitychange", handleVisibility);

    // Verifica também ao montar (app aberto/recarregado)
    checkExpiration();

    return () => {
      window.removeEventListener("online", handleOnline);
      document.removeEventListener("visibilitychange", handleVisibility);
      clearInterval(keepAlive);
    };
  }, [user, checkExpiration]);

  // Fetch masses when user logs in
  useEffect(() => {
    if (user) {
      fetchMasses();

      // Request push subscription upon successful login, passing the token explicitly
      setTimeout(() => {
        if (user.token) {
          subscribeToPushNotifications(user.token);
        }
      }, 1000);
    }
  }, [user, fetchMasses]);

  // --- LÓGICA DE ATUALIZAÇÃO DO PWA ---
  useEffect(() => {
    // Busca atualização ao montar o componente
    updateServiceWorker(false);

    // Busca atualização ao voltar do segundo plano
    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        updateServiceWorker(false);
      }
    };

    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, [updateServiceWorker]);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    try {
      await login(email, password);
    } catch (err) {
      // Error is handled by useAuth hook
    }
  }

  function handleLogout() {
    logout();
    setEmail("");
    setPassword("");
  }

  async function handleToggleSignup(massId: string) {
    if (!user) return;
    try {
      await toggleSignup(user.id, massId);
    } catch (error: any) {
      const message = error.response?.data?.error || "Erro ao realizar inscrição. Tente novamente.";
      alert(message);
    }
  }

  if (!user) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: theme.colors.background }}>
        <div className="card" style={{ width: "100%", maxWidth: "350px", textAlign: "center", background: "white", padding: "40px", borderRadius: "16px", boxShadow: `0 8px 32px ${theme.colors.shadowBase}` }}>
          <div style={{ color: theme.colors.primary, marginBottom: 20, display: "flex", justifyContent: "center" }}>
            <Flower size={48} strokeWidth={1.5} />
          </div>
          <h2 style={{ marginBottom: 10, color: theme.colors.primary, fontFamily: "'Playfair Display', serif" }}>Bem-vindo(a), Servo(a)</h2>
          <p style={{ color: theme.colors.textSecondary, fontSize: "0.9rem", marginBottom: 30 }}>Faça login para ver a escala</p>

          <form onSubmit={handleLogin}>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Seu E-mail" style={{ marginBottom: 15, width: "100%", padding: "12px", borderRadius: "10px", border: `1px solid ${theme.colors.border}`, boxSizing: "border-box", color: theme.colors.textMain }} />
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Sua Senha" style={{ marginBottom: 25, width: "100%", padding: "12px", borderRadius: "10px", border: `1px solid ${theme.colors.border}`, boxSizing: "border-box", color: theme.colors.textMain }} />
            {authError && <p style={{ color: theme.colors.dangerDark, fontSize: "0.9rem", marginBottom: 15 }}>{authError}</p>}
            <button type="submit" style={{ width: "100%", padding: "14px", border: "none", cursor: "pointer", borderRadius: "10px", fontWeight: "bold", fontSize: "1rem", background: theme.colors.primaryGradient, color: "#FDFBF7", letterSpacing: "1px" }}>
              ENTRAR
            </button>
          </form>
        </div>
        {needRefresh && <UpdateToast onUpdate={() => updateServiceWorker(true)} />}
      </div>
    );
  }

  // Loading spinner
  if (isLoading && masses.length === 0) {
    return (
      <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", height: "100vh", background: theme.colors.background }}>
        <style>{`
          .loader { border: 4px solid #f3f3f3; border-top: 4px solid ${theme.colors.primary}; border-radius: 50%; width: 40px; height: 40px; animation: spin 1s linear infinite; }
          @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        `}</style>
        <div className="loader"></div>
        <p style={{ color: theme.colors.textSecondary, fontWeight: "500", marginTop: "15px" }}>Buscando escala...</p>
      </div>
    );
  }

  // Main panels
  return (
    <>
      {user.role === "ADMIN" ? (
        <AdminPanel masses={masses} user={user} onUpdate={fetchMasses} onLogout={handleLogout} />
      ) : (
        <UserPanel masses={masses} user={user} onToggleSignup={handleToggleSignup} onLogout={handleLogout} />
      )}

      {needRefresh && <UpdateToast onUpdate={() => updateServiceWorker(true)} />}
    </>
  );
}

// Update toast component
function UpdateToast({ onUpdate }: { onUpdate: () => void }) {
  return (
    <div style={{
      position: 'fixed', bottom: '20px', left: '50%', transform: 'translateX(-50%)',
      background: theme.colors.textMain, color: 'white', padding: '15px 20px', borderRadius: '12px',
      display: 'flex', alignItems: 'center', gap: '15px', zIndex: 10000,
      boxShadow: theme.colors.shadowBase, width: '90%', maxWidth: '400px'
    }}>
      <div style={{ flex: 1 }}>
        <span style={{ fontSize: '0.9rem', fontWeight: 'bold', display: 'block' }}>Nova versão disponível!</span>
        <span style={{ fontSize: '0.8rem', opacity: 0.8 }}>Atualize para ver as novidades.</span>
      </div>
      <button
        onClick={onUpdate}
        style={{
          background: theme.colors.primary, color: 'white', border: 'none', padding: '8px 15px',
          borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px'
        }}
      >
        <RefreshCw size={14} /> ATUALIZAR
      </button>
    </div>
  );
}

export default App;