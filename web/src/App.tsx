import { useEffect, useState, useCallback, lazy, Suspense } from "react";
import { Cross, RefreshCw } from "lucide-react";
import { useAuth } from "./hooks/useAuth";
import { useMasses } from "./hooks/useMasses";
import { useSignup } from "./hooks/useSignup";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { Routes, Route, Navigate } from "react-router-dom";
import { useRegisterSW } from "virtual:pwa-register/react";
import { theme } from "./theme/theme";
import { subscribeToPushNotifications } from "./services/push";
import { getLastOnline, setLastOnline } from "./services/storage/localStorage.service";

// Code-Splitting (Lazy Loading) para reduzir drasticamente o bundle inicial no celular
const AdminPanel = lazy(() => import("./components/AdminPanel").then((m) => ({ default: m.AdminPanel })));
const UserPanel = lazy(() => import("./components/UserPanel").then((m) => ({ default: m.UserPanel })));
const FormacaoPage = lazy(() => import("./pages/FormacaoPage").then((m) => ({ default: m.FormacaoPage })));
const ManualViewer = lazy(() => import("./components/ManualViewer").then((m) => ({ default: m.ManualViewer })));
const ModuleViewer = lazy(() => import("./pages/ModuleViewer").then((m) => ({ default: m.ModuleViewer })));
const QuizListPage = lazy(() => import("./pages/QuizListPage").then((m) => ({ default: m.QuizListPage })));
const QuizTakingPage = lazy(() => import("./pages/QuizTakingPage").then((m) => ({ default: m.QuizTakingPage })));

// Tempo máximo sem renovação online antes de exigir novo login (180 dias em ms)
const OFFLINE_TIMEOUT_MS = 180 * 24 * 60 * 60 * 1000;

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

    const handleAuthExpired = () => {
      logout();
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("servas:auth-expired", handleAuthExpired);
    document.addEventListener("visibilitychange", handleVisibility);

    // Verifica também ao montar (app aberto/recarregado)
    checkExpiration();

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("servas:auth-expired", handleAuthExpired);
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

  return (
    <>
      <Suspense
        fallback={
          <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", height: "100vh", background: theme.colors.background }}>
            <div className="loader" style={{ border: `4px solid #f3f3f3`, borderTop: `4px solid ${theme.colors.primary}`, borderRadius: "50%", width: "40px", height: "40px", animation: "spin 1s linear infinite" }}></div>
            <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
            <p style={{ color: theme.colors.textSecondary, fontWeight: "500", marginTop: "15px" }}>Carregando...</p>
          </div>
        }
      >
      <Routes>
        <Route path="/login" element={
          user ? (
            <Navigate to={user.role === 'ADMIN' ? '/admin' : user.role === 'em_formacao' ? '/formacao' : '/escalas'} replace />
          ) : (
            <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: theme.colors.background }}>
              <div className="card" style={{ width: "100%", maxWidth: "360px", textAlign: "center", background: "white", padding: "40px 32px", borderRadius: "12px", border: `1px solid ${theme.colors.borderLight}`, boxShadow: `0 10px 30px ${theme.colors.shadowBase}` }}>
                <div style={{
                  width: 56,
                  height: 56,
                  margin: "0 auto 20px",
                  borderRadius: "12px",
                  background: theme.colors.primaryGradient,
                  border: `1px solid ${theme.colors.secondary}`,
                  color: "#FDFBF7",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: theme.colors.shadowPrimary
                }}>
                  <Cross size={28} strokeWidth={2.2} />
                </div>
                <h2 style={{ marginBottom: 4, color: theme.colors.primary, fontFamily: "'Cinzel', Georgia, serif", fontSize: "1.25rem", letterSpacing: "0.5px", lineHeight: 1.25 }}>
                  GRUPO DE SERVOS E SERVAS
                </h2>
                <p style={{ color: theme.colors.secondary, fontSize: "0.75rem", fontWeight: 700, letterSpacing: "0.3px", margin: "0 0 18px 0" }}>
                  Santuário Diocesano Nossa Senhora da Natividade
                </p>
                <p style={{ color: theme.colors.textSecondary, fontSize: "0.85rem", marginBottom: 24 }}>Acesse sua conta para continuar</p>

                <form onSubmit={handleLogin}>
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Seu E-mail" style={{ marginBottom: 14, width: "100%", padding: "12px 14px", borderRadius: "8px", border: `1px solid ${theme.colors.border}`, boxSizing: "border-box", color: theme.colors.textMain }} />
                  <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Sua Senha" style={{ marginBottom: 24, width: "100%", padding: "12px 14px", borderRadius: "8px", border: `1px solid ${theme.colors.border}`, boxSizing: "border-box", color: theme.colors.textMain }} />
                  {authError && <p style={{ color: theme.colors.dangerDark, fontSize: "0.9rem", marginBottom: 15 }}>{authError}</p>}
                  <button type="submit" style={{ width: "100%", padding: "14px", border: "none", cursor: "pointer", borderRadius: "8px", fontWeight: "bold", fontSize: "0.95rem", background: theme.colors.primaryGradient, color: "#FDFBF7", letterSpacing: "1px" }}>
                    ENTRAR
                  </button>
                </form>
              </div>
            </div>
          )
        } />


          {/* Rotas de Formação - Públicas, sem necessidade de login */}
          <Route path="/formacao" element={<FormacaoPage user={user ?? null} onLogout={handleLogout} />} />
          <Route path="/formacao/modulo/:id" element={<ModuleViewer />} />
          <Route path="/formacao/manual" element={<ManualViewer />} />
          
          <Route element={<ProtectedRoute user={user} allowedRoles={['em_formacao']} redirectPath="/escalas" />}>
            <Route path="/formacao/quizzes" element={<QuizListPage />} />
            <Route path="/formacao/quizzes/:id" element={<QuizTakingPage />} />
          </Route>

          {/* Rotas de Sistema - Acessível para as demais Servas, mas NÃO para em_formacao */}
          <Route element={<ProtectedRoute user={user} disallowedRoles={['em_formacao']} redirectPath="/formacao" />}>
            <Route path="/escalas" element={
              (isLoading && masses.length === 0) ? (
                <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", height: "100vh", background: theme.colors.background }}>
                  <div className="loader" style={{ border: `4px solid #f3f3f3`, borderTop: `4px solid ${theme.colors.primary}`, borderRadius: "50%", width: "40px", height: "40px", animation: "spin 1s linear infinite" }}></div>
                  <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
                  <p style={{ color: theme.colors.textSecondary, fontWeight: "500", marginTop: "15px" }}>Buscando escala...</p>
                </div>
              ) : (
                user?.role === "ADMIN" ? (
                  <Navigate to="/admin" replace />
                ) : (
                  <UserPanel masses={masses} user={user!} onToggleSignup={handleToggleSignup} onLogout={handleLogout} onUpdate={fetchMasses} />
                )
              )
            } />

            <Route path="/admin" element={
              (isLoading && masses.length === 0) ? (
                <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", height: "100vh", background: theme.colors.background }}>
                  <div className="loader" style={{ border: `4px solid #f3f3f3`, borderTop: `4px solid ${theme.colors.primary}`, borderRadius: "50%", width: "40px", height: "40px", animation: "spin 1s linear infinite" }}></div>
                  <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
                  <p style={{ color: theme.colors.textSecondary, fontWeight: "500", marginTop: "15px" }}>Carregando dados...</p>
                </div>
              ) : (
                user?.role === "ADMIN" ? (
                  <AdminPanel masses={masses} user={user!} onUpdate={fetchMasses} onLogout={handleLogout} />
                ) : (
                  <Navigate to="/escalas" replace />
                )
              )
            } />
          </Route>

        <Route path="*" element={<Navigate to={user ? (user.role === 'ADMIN' ? '/admin' : user.role === 'em_formacao' ? '/formacao' : '/escalas') : '/login'} replace />} />
      </Routes>
      </Suspense>

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