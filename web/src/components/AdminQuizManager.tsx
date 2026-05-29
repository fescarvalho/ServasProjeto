import { useState, useEffect } from "react";
import { PlusCircle, Trash2, ChevronDown, ChevronUp, BookOpen, Clock, Loader2, Save, X, Plus } from "lucide-react";
import { Quiz, QuizQuestion, QuizResult } from "../types/types";
import { adminQuizService } from "../services/adminQuizService";
import { theme } from "../theme/theme";

export function AdminQuizManager() {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedQuizId, setExpandedQuizId] = useState<string | null>(null);
  
  // Form state
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    timeLimitMinutes: 10,
    isActive: true,
    questions: [] as QuizQuestion[]
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadQuizzes();
  }, []);

  const loadQuizzes = async () => {
    try {
      setLoading(true);
      const data = await adminQuizService.getAllQuizzes();
      setQuizzes(data);
    } catch (error) {
      console.error("Erro ao carregar quizzes", error);
      alert("Erro ao carregar o AVA.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Deseja realmente apagar o AVA "${title}" e todos os seus resultados?`)) return;
    try {
      await adminQuizService.deleteQuiz(id);
      loadQuizzes();
    } catch (error) {
      console.error("Erro ao apagar quiz", error);
      alert("Erro ao apagar o AVA.");
    }
  };

  const handleDeleteResult = async (resultId: string, responderName: string) => {
    if (!confirm(`Deseja realmente apagar o resultado de "${responderName}"?`)) return;
    try {
      await adminQuizService.deleteQuizResult(resultId);
      loadQuizzes();
    } catch (error) {
      console.error("Erro ao apagar resultado", error);
      alert("Erro ao apagar o resultado.");
    }
  };

  const addQuestion = () => {
    setFormData(prev => ({
      ...prev,
      questions: [
        ...prev.questions,
        {
          id: `q_${Date.now()}`,
          text: "",
          options: [
            { text: "", isCorrect: true },
            { text: "", isCorrect: false }
          ]
        }
      ]
    }));
  };

  const updateQuestionText = (index: number, text: string) => {
    const newQuestions = [...formData.questions];
    newQuestions[index].text = text;
    setFormData({ ...formData, questions: newQuestions });
  };

  const removeQuestion = (index: number) => {
    const newQuestions = [...formData.questions];
    newQuestions.splice(index, 1);
    setFormData({ ...formData, questions: newQuestions });
  };

  const addOption = (qIndex: number) => {
    const newQuestions = [...formData.questions];
    newQuestions[qIndex].options.push({ text: "", isCorrect: false });
    setFormData({ ...formData, questions: newQuestions });
  };

  const updateOptionText = (qIndex: number, optIndex: number, text: string) => {
    const newQuestions = [...formData.questions];
    newQuestions[qIndex].options[optIndex].text = text;
    setFormData({ ...formData, questions: newQuestions });
  };

  const removeOption = (qIndex: number, optIndex: number) => {
    const newQuestions = [...formData.questions];
    if (newQuestions[qIndex].options.length <= 2) {
      alert("Uma pergunta deve ter pelo menos 2 opções.");
      return;
    }
    newQuestions[qIndex].options.splice(optIndex, 1);
    setFormData({ ...formData, questions: newQuestions });
  };

  const setCorrectOption = (qIndex: number, optIndex: number) => {
    const newQuestions = [...formData.questions];
    newQuestions[qIndex].options.forEach((opt, i) => {
      opt.isCorrect = i === optIndex;
    });
    setFormData({ ...formData, questions: newQuestions });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      alert("O título é obrigatório.");
      return;
    }
    if (formData.questions.length === 0) {
      alert("Adicione pelo menos uma pergunta.");
      return;
    }

    // Validate questions
    for (let i = 0; i < formData.questions.length; i++) {
      const q = formData.questions[i];
      if (!q.text.trim()) {
        alert(`A pergunta ${i + 1} precisa de um enunciado.`);
        return;
      }
      for (let j = 0; j < q.options.length; j++) {
        if (!q.options[j].text.trim()) {
          alert(`Preencha o texto de todas as opções na pergunta ${i + 1}.`);
          return;
        }
      }
      if (!q.options.some(opt => opt.isCorrect)) {
        alert(`Selecione uma opção correta para a pergunta ${i + 1}.`);
        return;
      }
    }

    try {
      setSaving(true);
      await adminQuizService.createQuiz(formData);
      setShowForm(false);
      setFormData({
        title: "",
        description: "",
        timeLimitMinutes: 10,
        isActive: true,
        questions: []
      });
      loadQuizzes();
    } catch (error) {
      console.error(error);
      alert("Erro ao criar AVA.");
    } finally {
      setSaving(false);
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}m ${s}s`;
  };

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", padding: "40px" }}>
        <Loader2 size={32} className="spin" color={theme.colors.primary} />
      </div>
    );
  }

  return (
    <div style={{ padding: "20px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <h2 style={{ color: theme.colors.textMain, margin: 0 }}>Gerenciar AVA</h2>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            style={{ display: "flex", alignItems: "center", gap: "8px", background: theme.colors.primary, color: "white", padding: "10px 16px", borderRadius: "8px", border: "none", fontWeight: "bold", cursor: "pointer" }}
          >
            <PlusCircle size={20} /> Novo AVA
          </button>
        )}
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} style={{ background: "white", padding: "20px", borderRadius: "12px", boxShadow: `0 4px 12px ${theme.colors.shadowBase}`, marginBottom: "30px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "20px" }}>
            <h3 style={{ margin: 0, color: theme.colors.primary }}>Criar Novo AVA</h3>
            <button type="button" onClick={() => setShowForm(false)} style={{ background: "none", border: "none", cursor: "pointer", color: theme.colors.textSecondary }}>
              <X size={24} />
            </button>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px", marginBottom: "20px" }}>
            <div style={{ gridColumn: "1 / -1" }}>
              <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold", color: theme.colors.textSecondary }}>Título</label>
              <input required type="text" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #ccc", boxSizing: "border-box" }} />
            </div>
            
            <div style={{ gridColumn: "1 / -1" }}>
              <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold", color: theme.colors.textSecondary }}>Descrição (Opcional)</label>
              <textarea value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #ccc", boxSizing: "border-box", minHeight: "80px" }} />
            </div>

            <div>
              <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold", color: theme.colors.textSecondary }}>Tempo Limite (minutos)</label>
              <input required type="number" min="1" value={formData.timeLimitMinutes} onChange={e => setFormData({ ...formData, timeLimitMinutes: Number(e.target.value) })} style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #ccc", boxSizing: "border-box" }} />
            </div>
            
            <div style={{ display: "flex", alignItems: "center", paddingTop: "25px" }}>
              <label style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer", fontWeight: "bold", color: theme.colors.textSecondary }}>
                <input type="checkbox" checked={formData.isActive} onChange={e => setFormData({ ...formData, isActive: e.target.checked })} style={{ width: "18px", height: "18px" }} />
                AVA Ativo (Visível)
              </label>
            </div>
          </div>

          <div style={{ borderTop: "2px solid #eee", paddingTop: "20px", marginBottom: "20px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px" }}>
              <h4 style={{ margin: 0, color: theme.colors.textMain }}>Perguntas ({formData.questions.length})</h4>
              <button type="button" onClick={addQuestion} style={{ display: "flex", alignItems: "center", gap: "5px", background: theme.colors.success, color: "white", padding: "6px 12px", borderRadius: "6px", border: "none", cursor: "pointer", fontWeight: "bold", fontSize: "0.85rem" }}>
                <Plus size={16} /> Adicionar Pergunta
              </button>
            </div>

            {formData.questions.map((q, qIndex) => (
              <div key={q.id} style={{ background: "#f8f9fa", padding: "15px", borderRadius: "8px", marginBottom: "15px", border: "1px solid #e0e0e0" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px" }}>
                  <strong>Pergunta {qIndex + 1}</strong>
                  <button type="button" onClick={() => removeQuestion(qIndex)} style={{ background: "none", border: "none", color: theme.colors.danger, cursor: "pointer", display: "flex", alignItems: "center" }}>
                    <Trash2 size={16} />
                  </button>
                </div>
                
                <input
                  type="text"
                  placeholder="Enunciado da pergunta"
                  value={q.text}
                  onChange={e => updateQuestionText(qIndex, e.target.value)}
                  style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #ccc", boxSizing: "border-box", marginBottom: "15px" }}
                />

                <div style={{ marginLeft: "15px" }}>
                  <p style={{ fontSize: "0.85rem", color: "#666", marginBottom: "8px", fontWeight: "bold" }}>Opções (Marque a correta):</p>
                  {q.options.map((opt, optIndex) => (
                    <div key={optIndex} style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
                      <input
                        type="radio"
                        name={`correct_opt_${qIndex}`}
                        checked={opt.isCorrect}
                        onChange={() => setCorrectOption(qIndex, optIndex)}
                        style={{ cursor: "pointer", width: "16px", height: "16px", accentColor: theme.colors.success }}
                      />
                      <input
                        type="text"
                        placeholder={`Opção ${optIndex + 1}`}
                        value={opt.text}
                        onChange={e => updateOptionText(qIndex, optIndex, e.target.value)}
                        style={{ flex: 1, padding: "8px", borderRadius: "4px", border: opt.isCorrect ? `2px solid ${theme.colors.success}` : "1px solid #ccc" }}
                      />
                      <button type="button" onClick={() => removeOption(qIndex, optIndex)} style={{ background: "none", border: "none", color: "#999", cursor: "pointer" }}>
                        <X size={16} />
                      </button>
                    </div>
                  ))}
                  <button type="button" onClick={() => addOption(qIndex)} style={{ background: "none", border: "none", color: theme.colors.primary, cursor: "pointer", fontSize: "0.85rem", fontWeight: "bold", padding: "5px 0" }}>
                    + Adicionar opção
                  </button>
                </div>
              </div>
            ))}
            {formData.questions.length === 0 && (
              <p style={{ textAlign: "center", color: "#888", fontStyle: "italic", padding: "20px" }}>Nenhuma pergunta adicionada.</p>
            )}
          </div>

          <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
            <button type="button" onClick={() => setShowForm(false)} style={{ padding: "10px 20px", border: "none", borderRadius: "8px", background: "#e0e0e0", color: "#333", fontWeight: "bold", cursor: "pointer" }}>
              Cancelar
            </button>
            <button type="submit" disabled={saving} style={{ display: "flex", alignItems: "center", gap: "8px", padding: "10px 20px", border: "none", borderRadius: "8px", background: theme.colors.primary, color: "white", fontWeight: "bold", cursor: "pointer", opacity: saving ? 0.7 : 1 }}>
              {saving ? <Loader2 size={18} className="spin" /> : <Save size={18} />}
              Salvar AVA
            </button>
          </div>
        </form>
      )}

      {/* Listagem de Quizzes */}
      {quizzes.length === 0 && !showForm ? (
        <div style={{ textAlign: "center", padding: "40px", background: "white", borderRadius: "12px", boxShadow: `0 4px 12px ${theme.colors.shadowBase}` }}>
          <BookOpen size={48} color={theme.colors.borderDark} style={{ marginBottom: "15px" }} />
          <h3 style={{ color: theme.colors.textSecondary }}>Nenhum AVA criado</h3>
          <p style={{ color: "#888" }}>Crie seu primeiro AVA para os servos em formação.</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
          {quizzes.map((quiz) => {
            const isExpanded = expandedQuizId === quiz.id;
            const results = quiz.results || [];
            
            return (
              <div key={quiz.id} style={{ background: "white", borderRadius: "12px", boxShadow: `0 2px 8px ${theme.colors.shadowBase}`, overflow: "hidden" }}>
                <div 
                  onClick={() => setExpandedQuizId(isExpanded ? null : quiz.id)}
                  style={{ padding: "20px", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center", borderLeft: `4px solid ${quiz.isActive ? theme.colors.primary : "#999"}` }}
                >
                  <div>
                    <h3 style={{ margin: "0 0 5px 0", color: theme.colors.textMain }}>{quiz.title}</h3>
                    <div style={{ display: "flex", gap: "15px", color: theme.colors.textSecondary, fontSize: "0.85rem", alignItems: "center" }}>
                      <span style={{ display: "flex", alignItems: "center", gap: "4px" }}><BookOpen size={14} /> {quiz.questions.length} perguntas</span>
                      <span style={{ display: "flex", alignItems: "center", gap: "4px" }}><Clock size={14} /> {quiz.timeLimitMinutes} min</span>
                      <span style={{ background: quiz.isActive ? "#e8f5e9" : "#eeeeee", color: quiz.isActive ? "#2e7d32" : "#616161", padding: "2px 8px", borderRadius: "12px", fontWeight: "bold" }}>
                        {quiz.isActive ? "Ativo" : "Inativo"}
                      </span>
                      <span>{results.length} resposta(s)</span>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: "15px", alignItems: "center" }}>
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleDelete(quiz.id, quiz.title); }}
                      style={{ background: "none", border: "none", color: theme.colors.danger, cursor: "pointer", padding: "5px" }}
                      title="Apagar AVA"
                    >
                      <Trash2 size={20} />
                    </button>
                    {isExpanded ? <ChevronUp size={24} color="#666" /> : <ChevronDown size={24} color="#666" />}
                  </div>
                </div>

                {isExpanded && (
                  <div style={{ padding: "20px", borderTop: "1px solid #eee", background: "#fafafa" }}>
                    <h4 style={{ margin: "0 0 15px 0", color: theme.colors.textMain }}>Resultados do AVA</h4>
                    
                    {results.length === 0 ? (
                      <p style={{ color: "#888", fontSize: "0.9rem", fontStyle: "italic", textAlign: "center", padding: "20px 0" }}>Nenhum servo respondeu a este AVA ainda.</p>
                    ) : (
                      <div style={{ overflowX: "auto" }}>
                        <table style={{ width: "100%", borderCollapse: "collapse", background: "white", borderRadius: "8px", overflow: "hidden", border: "1px solid #e0e0e0" }}>
                          <thead style={{ background: "#f5f5f5" }}>
                            <tr>
                              <th style={{ padding: "12px", textAlign: "left", fontSize: "0.85rem", color: "#555", borderBottom: "2px solid #ddd" }}>Nome do Servo</th>
                              <th style={{ padding: "12px", textAlign: "center", fontSize: "0.85rem", color: "#555", borderBottom: "2px solid #ddd" }}>Pontuação</th>
                              <th style={{ padding: "12px", textAlign: "center", fontSize: "0.85rem", color: "#555", borderBottom: "2px solid #ddd" }}>Tempo Gasto</th>
                              <th style={{ padding: "12px", textAlign: "right", fontSize: "0.85rem", color: "#555", borderBottom: "2px solid #ddd" }}>Data</th>
                            </tr>
                          </thead>
                          <tbody>
                            {results.map((r: QuizResult) => {
                              const percentage = (r.totalScore / quiz.questions.length) * 100;
                              const colorClass = percentage >= 70 ? theme.colors.success : (percentage >= 50 ? theme.colors.warning : theme.colors.danger);
                              
                              return (
                                <tr key={r.id} style={{ borderBottom: "1px solid #eee" }}>
                                  <td style={{ padding: "12px", fontWeight: "bold", color: theme.colors.textMain }}>{r.responderName}</td>
                                  <td style={{ padding: "12px", textAlign: "center", fontWeight: "bold", color: colorClass }}>
                                    {r.totalScore} / {quiz.questions.length} ({(percentage).toFixed(0)}%)
                                  </td>
                                  <td style={{ padding: "12px", textAlign: "center", color: theme.colors.textSecondary, fontSize: "0.9rem" }}>
                                    {formatTime(r.timeSpentSeconds)}
                                  </td>
                                  <td style={{ padding: "12px", textAlign: "right", color: theme.colors.textSecondary, fontSize: "0.85rem", whiteSpace: "nowrap" }}>
                                    {new Date(r.createdAt || "").toLocaleDateString("pt-BR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                                    <button 
                                      onClick={() => handleDeleteResult(r.id, r.responderName)}
                                      style={{ background: "none", border: "none", color: theme.colors.danger, cursor: "pointer", marginLeft: "15px", padding: "2px", verticalAlign: "middle" }}
                                      title="Apagar Resultado"
                                    >
                                      <Trash2 size={16} />
                                    </button>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
