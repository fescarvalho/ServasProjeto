import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, BookOpenCheck, Clock, ShieldAlert } from "lucide-react";
import { quizService } from "../services/quizService";
import { Quiz } from "../types/types";
import { theme } from "../theme/theme";
import "./FormacaoPage.css";

export function QuizListPage() {
  const navigate = useNavigate();
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadQuizzes() {
      try {
        const data = await quizService.getAvailableQuizzes();
        setQuizzes(data);
      } catch (error) {
        console.error("Erro ao carregar quizzes", error);
      } finally {
        setLoading(false);
      }
    }
    loadQuizzes();
  }, []);

  return (
    <div className="formacao-container" style={{ background: theme.colors.background, minHeight: "100vh" }}>
      <div className="formacao-topbar">
        <button onClick={() => navigate("/formacao")} style={{ background: "none", border: "none", color: theme.colors.primary, display: "flex", alignItems: "center", gap: "5px", cursor: "pointer", fontWeight: "bold" }}>
          <ArrowLeft size={20} />
          <span>Voltar</span>
        </button>
      </div>

      <div className="formacao-header">
        <h1 className="formacao-title">AVA</h1>
        <p className="formacao-subtitle">Teste seus conhecimentos para avançar na sua formação.</p>
      </div>

      <div className="modules-grid" style={{ padding: "0 20px" }}>
        {loading ? (
          <p style={{ textAlign: "center", width: "100%", color: theme.colors.textSecondary }}>Carregando AVA...</p>
        ) : quizzes.length === 0 ? (
          <p style={{ textAlign: "center", width: "100%", color: theme.colors.textSecondary }}>Nenhum AVA disponível no momento.</p>
        ) : (
          quizzes.map((quiz) => (
            <div
              key={quiz.id}
              className="module-card accessible"
              style={{
                borderTop: `4px solid ${theme.colors.primary}`,
              }}
              onClick={() => navigate(`/formacao/quizzes/${quiz.id}`)}
            >
              <div className="module-icon-wrapper">
                <ShieldAlert size={28} style={{ color: theme.colors.primary }} />
              </div>

              <div className="module-content">
                <h3>{quiz.title}</h3>
                <p>{quiz.description}</p>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", marginTop: "10px", fontSize: "0.85rem", color: theme.colors.textSecondary }}>
                  <Clock size={14} />
                  <span>{quiz.timeLimitMinutes} min</span>
                </div>

                <div className="module-open-hint" style={{ color: theme.colors.primary }}>
                  Iniciar AVA →
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
