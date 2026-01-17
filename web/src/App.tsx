import { useEffect, useState } from "react";
import { Flower } from "lucide-react";
import { api } from "./services/api";
import { Mass, UserData } from "./types/types";
import { AdminPanel } from "./components/AdminPanel";
import { UserPanel } from "./components/UserPanel";

function App() {
  // 1. CORREÇÃO: Inicialização "Lazy" (Preguiçosa) do Estado
  // O React executa isso apenas uma vez, antes da primeira renderização.
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

  // Função para buscar dados atualizados
  function fetchMasses() {
    api
      .get("/masses")
      .then((response) => setMasses(response.data))
      .catch((err) => console.error("Erro ao buscar missas:", err));
  }

  // 2. EFEITO DE INICIALIZAÇÃO
  // Agora ele serve APENAS para buscar dados externos (API), não para setar estado local síncrono.
  useEffect(() => {
    fetchMasses();
  }, []);

  // 3. LOGIN (Salva no navegador)
  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    try {
      const response = await api.post("/login", { email, password });

      const userData = response.data;
      setUser(userData);

      // SALVA O USUÁRIO NO NAVEGADOR
      localStorage.setItem("servas_user", JSON.stringify(userData));

      setError("");
    } catch (err) {
      console.error(err);
      setError("E-mail ou senha incorretos.");
    }
  }

  // 4. LOGOUT (Limpa o navegador)
  function handleLogout() {
    setUser(null);
    localStorage.removeItem("servas_user"); // Apaga o registro
    setEmail("");
    setPassword("");
  }

  async function handleToggleSignup(massId: string) {
    if (!user) return;
    try {
      await api.post("/toggle-signup", { userId: user.id, massId });
      fetchMasses(); // Atualiza a lista imediatamente
    } catch (error) {
      console.log(error);
      alert("Ação não permitida. Verifique se o prazo encerrou ou se está lotado.");
    }
  }

  // --- TELA DE LOGIN ---
  if (!user) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#f5f5f5",
        }}
      >
        <div
          className="card"
          style={{
            width: "100%",
            maxWidth: "350px",
            textAlign: "center",
            background: "white",
            padding: "40px",
            borderRadius: "12px",
            boxShadow: "0 4px 15px rgba(0,0,0,0.1)",
          }}
        >
          <div
            style={{
              color: "var(--rose-primary)",
              marginBottom: 20,
              display: "flex",
              justifyContent: "center",
            }}
          >
            <Flower size={48} strokeWidth={1.5} />
          </div>
          <h2 style={{ marginBottom: 10, color: "#333" }}>Bem-vinda, Serva</h2>
          <p style={{ color: "#666", fontSize: "0.9rem", marginBottom: 30 }}>
            Faça login para ver a escala
          </p>

          <form onSubmit={handleLogin}>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Seu E-mail"
              style={{
                marginBottom: 15,
                width: "100%",
                padding: "12px",
                borderRadius: "8px",
                border: "1px solid #ddd",
                boxSizing: "border-box",
              }}
            />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Sua Senha"
              style={{
                marginBottom: 25,
                width: "100%",
                padding: "12px",
                borderRadius: "8px",
                border: "1px solid #ddd",
                boxSizing: "border-box",
              }}
            />

            {error && (
              <p style={{ color: "#d32f2f", fontSize: "0.9rem", marginBottom: 15 }}>
                {error}
              </p>
            )}

            <button
              type="submit"
              className="btn-primary"
              style={{
                width: "100%",
                padding: "14px",
                border: "none",
                cursor: "pointer",
                borderRadius: "8px",
                fontWeight: "bold",
                fontSize: "1rem",
              }}
            >
              ENTRAR
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Verifica se é Admin pela regra 'ADMIN'
  const isAdmin = user.role === "ADMIN";

  if (isAdmin) {
    return <AdminPanel masses={masses} onUpdate={fetchMasses} onLogout={handleLogout} />;
  }

  return (
    <UserPanel
      masses={masses}
      user={user}
      onToggleSignup={handleToggleSignup}
      onLogout={handleLogout}
    />
  );
}

export default App;
