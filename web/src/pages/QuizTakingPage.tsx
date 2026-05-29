import { useEffect, useState, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Clock, CheckCircle } from "lucide-react";
import { quizService } from "../services/quizService";
import { Quiz } from "../types/types";
import { theme } from "../theme/theme";

export function QuizTakingPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeLeft, setTimeLeft] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [finished, setFinished] = useState(false);
  const [score, setScore] = useState<number | null>(null);
  const [timeoutMsg, setTimeoutMsg] = useState(false);
  
  // Novos estados para o Nome
  const [responderName, setResponderName] = useState("");
  const [nameConfirmed, setNameConfirmed] = useState(false);

  // Use ref to keep track of latest values for auto-submit
  const stateRef = useRef({ id, answers, timeSpentSeconds: 0, responderName: "" });

  useEffect(() => {
    stateRef.current.answers = answers;
    stateRef.current.responderName = responderName;
  }, [answers, responderName]);

  useEffect(() => {
    async function loadQuiz() {
      try {
        const quizzes = await quizService.getAvailableQuizzes();
        const found = quizzes.find((q) => q.id === id);
        if (found) {
          setQuiz(found);
          setTimeLeft(found.timeLimitMinutes * 60);
        } else {
          alert("Quiz não encontrado.");
          navigate("/formacao/quizzes", { replace: true });
        }
      } catch (error) {
        console.error("Erro ao carregar quiz", error);
        navigate("/formacao/quizzes", { replace: true });
      } finally {
        setLoading(false);
      }
    }
    loadQuiz();
  }, [id, navigate]);

  const isTimeUp = timeLeft <= 0;

  useEffect(() => {
    if (loading || finished || !nameConfirmed || isTimeUp) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => Math.max(0, prev - 1));
    }, 1000);

    return () => clearInterval(timer);
  }, [loading, finished, nameConfirmed, isTimeUp]);

  useEffect(() => {
    if (quiz) {
      stateRef.current.timeSpentSeconds = quiz.timeLimitMinutes * 60 - timeLeft;
    }
    if (isTimeUp && nameConfirmed && !finished && !loading) {
      handleAutoSubmit();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft, nameConfirmed, finished, loading, quiz, isTimeUp]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const handleAutoSubmit = async () => {
    if (finished) return;
    setFinished(true);
    setTimeoutMsg(true);
    await submitFinal(true);
  };



  const submitFinal = async (isAuto: boolean) => {
    try {
      if (!quiz || !id) return;
      const finalTimeSpent = isAuto ? quiz.timeLimitMinutes * 60 : stateRef.current.timeSpentSeconds;
      
      const result = await quizService.submitQuiz(id, finalTimeSpent, stateRef.current.answers, stateRef.current.responderName);
      setScore(result.totalScore);
    } catch (error) {
      console.error("Erro ao enviar quiz:", error);
      alert("Houve um erro ao salvar suas respostas. Comunique o administrador.");
    }
  };

  const selectOption = (questionIndex: number, optionIndex: number) => {
    if (finished) return;
    setAnswers((prev) => ({
      ...prev,
      [questionIndex]: optionIndex,
    }));
  };

  if (loading) {
    return <div style={{ textAlign: "center", padding: "50px", color: theme.colors.textMain }}>Carregando...</div>;
  }

  if (!quiz) return null;

  if (finished && score !== null) {
    return (
      <div style={{ minHeight: "100vh", background: theme.colors.background, padding: "20px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        <div style={{ background: "white", padding: "30px", borderRadius: "16px", boxShadow: `0 4px 12px ${theme.colors.shadowBase}`, textAlign: "center", maxWidth: "400px", width: "100%" }}>
          <CheckCircle size={64} color={theme.colors.success} style={{ marginBottom: "20px" }} />
          <h2 style={{ color: theme.colors.textMain, marginBottom: "10px" }}>Quiz Concluído!</h2>
          
          {timeoutMsg && (
            <p style={{ color: theme.colors.dangerDark, fontWeight: "bold", marginBottom: "15px", padding: "10px", background: "#ffebee", borderRadius: "8px" }}>
              O tempo esgotou! Suas respostas até o momento foram salvas.
            </p>
          )}

          <p style={{ fontSize: "1.2rem", marginBottom: "30px" }}>
            Você acertou <strong>{score}</strong> de <strong>{quiz.questions?.length}</strong> perguntas.
          </p>
          
          <button
            onClick={() => navigate("/formacao/quizzes", { replace: true })}
            style={{ marginTop: "20px", padding: "12px 20px", borderRadius: "8px", border: `1px solid ${theme.colors.border}`, background: "white", color: theme.colors.textSecondary, fontWeight: "bold", cursor: "pointer" }}
          >
            Voltar para o AVA
          </button>
        </div>
      </div>
    );
  }

  if (!nameConfirmed) {
    return (
      <div style={{ minHeight: "100vh", background: theme.colors.background, padding: "20px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        <div style={{ background: "white", padding: "30px", borderRadius: "16px", boxShadow: `0 4px 12px ${theme.colors.shadowBase}`, maxWidth: "400px", width: "100%" }}>
          <h2 style={{ color: theme.colors.textMain, marginBottom: "10px", textAlign: "center" }}>Identificação</h2>
          <p style={{ color: theme.colors.textSecondary, marginBottom: "20px", textAlign: "center", fontSize: "0.9rem" }}>
            Como todos usam a mesma conta de Formação, precisamos do seu nome para registrar sua nota.
          </p>
          
          <input
            type="text"
            placeholder="Digite seu nome completo"
            value={responderName}
            onChange={(e) => setResponderName(e.target.value)}
            style={{ width: "100%", padding: "12px", borderRadius: "8px", border: `1px solid ${theme.colors.border}`, marginBottom: "20px", boxSizing: "border-box", fontSize: "1rem" }}
          />
          
          <button
            onClick={() => {
              if (responderName.trim().length < 3) {
                alert("Por favor, digite seu nome completo.");
                return;
              }
              setNameConfirmed(true);
            }}
            style={{ width: "100%", padding: "14px", border: "none", borderRadius: "8px", background: theme.colors.primary, color: "white", fontWeight: "bold", cursor: "pointer" }}
          >
            Começar Prova
          </button>
        </div>
      </div>
    );
  }

  const isLowTime = timeLeft <= 60;

  return (
    <div style={{ minHeight: "100vh", background: theme.colors.background, paddingBottom: "80px" }}>
      {/* Sticky Header with Timer */}
      <div style={{ position: "sticky", top: 0, zIndex: 10, background: "white", padding: "15px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", boxShadow: "0 2px 10px rgba(0,0,0,0.05)" }}>
        <div style={{ fontWeight: "bold", color: theme.colors.textMain }}>
          {quiz.title}
        </div>
        <div style={{ 
          display: "flex", alignItems: "center", gap: "8px", fontWeight: "bold", fontSize: "1.2rem", 
          color: isLowTime ? theme.colors.dangerDark : theme.colors.primary,
          background: isLowTime ? "#ffebee" : "#f5f5f5", padding: "5px 12px", borderRadius: "20px"
        }}>
          <Clock size={20} />
          <span>{formatTime(timeLeft)}</span>
        </div>
      </div>

      <div style={{ padding: "20px", maxWidth: "600px", margin: "0 auto" }}>
        {quiz.questions?.map((q, qIndex) => (
          <div key={q.id} style={{ background: "white", padding: "20px", borderRadius: "12px", marginBottom: "20px", boxShadow: `0 2px 8px ${theme.colors.shadowBase}` }}>
            <h3 style={{ fontSize: "1.1rem", color: theme.colors.textMain, marginBottom: "15px" }}>
              {qIndex + 1}. {q.text}
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {q.options.map((opt, oIndex) => {
                const isSelected = answers[qIndex] === oIndex;
                return (
                  <label 
                    key={oIndex} 
                    style={{ 
                      display: "flex", alignItems: "center", gap: "10px", padding: "12px 15px", 
                      borderRadius: "8px", border: `2px solid ${isSelected ? theme.colors.primary : theme.colors.border}`, 
                      background: isSelected ? `${theme.colors.primary}10` : "transparent",
                      cursor: "pointer", transition: "all 0.2s"
                    }}
                  >
                    <input
                      type="radio"
                      name={`question-${qIndex}`}
                      checked={isSelected}
                      onChange={() => selectOption(qIndex, oIndex)}
                      style={{ accentColor: theme.colors.primary, width: "18px", height: "18px" }}
                    />
                    <span style={{ color: theme.colors.textMain }}>{opt.text}</span>
                  </label>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Floating Submit Button */}
      <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: "white", padding: "15px", borderTop: `1px solid ${theme.colors.border}`, display: "flex", justifyContent: "center" }}>
        <button 
          className="quiz-submit-btn" 
          onClick={() => {
            if (confirm("Tem certeza que deseja finalizar e enviar o AVA?")) {
              setFinished(true);
              submitFinal(false);
            }
          }}
          style={{ width: "100%", padding: "15px", borderRadius: "8px", border: "none", background: theme.colors.primary, color: "white", fontWeight: "bold", fontSize: "1.1rem", display: "flex", justifyContent: "center", gap: "10px", alignItems: "center", cursor: "pointer", marginTop: "10px" }}
        >
          <CheckCircle size={24} />
          <span>Finalizar AVA</span>
        </button>
      </div>
    </div>
  );
}
