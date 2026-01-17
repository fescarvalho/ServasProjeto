import { useEffect, useState } from "react";
import { Flower } from "lucide-react";
import { api } from "./services/api";
import { Mass, UserData } from "../src/types/types";
import { AdminPanel } from "./components/AdminPanel";
import { UserPanel } from "./components/UserPanel";

function App() {
  const [user, setUser] = useState<UserData | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [masses, setMasses] = useState<Mass[]>([]);

  // Carrega as missas ao iniciar
  function fetchMasses() {
    api.get("/masses").then((response) => setMasses(response.data));
  }

  useEffect(() => {
    fetchMasses();
  }, []);

  // Faz o login e salva o usuário (agora com a ROLE vindo do backend)
  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    try {
      const response = await api.post("/login", { email, password });
      setUser(response.data); // O backend deve enviar { id, name, email, role }
      setError("");
    } catch (err) {
      console.log(err);
      setError("E-mail ou senha incorretos.");
    }
  }

  // Função para a serva se inscrever/desinscrever (passada para o UserPanel)
  async function handleToggleSignup(massId: string) {
    if (!user) return;
    try {
      await api.post("/toggle-signup", { userId: user.id, massId });
      fetchMasses(); // Atualiza a lista após a ação
    } catch (error) {
      console.log(error);
      alert("Ação não permitida ou prazo encerrado.");
    }
  }

  // --- TELA DE LOGIN (Se não houver usuário logado) ---
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

  // --- LÓGICA DE DECISÃO DE PAINEL ---

  // AQUI ESTAVA O PROBLEMA: Substituímos a checagem de e-mail pela checagem de ROLE
  const isAdmin = user.role === "ADMIN";

  // Se for ADMIN, mostra o Painel Administrativo
  if (isAdmin) {
    return (
      <AdminPanel masses={masses} onUpdate={fetchMasses} onLogout={() => setUser(null)} />
    );
  }

  // Se for USER, mostra o Painel de Usuário (Servas)
  return (
    <UserPanel
      masses={masses}
      user={user}
      onToggleSignup={handleToggleSignup}
      onLogout={() => setUser(null)}
    />
  );
}

export default App;
