import { useState, useEffect, Fragment } from "react";
import { PlusCircle, Trash2, ChevronDown, ChevronUp, BookOpen, Clock, Loader2, Save, X, Plus, Copy, Edit, ArrowUp, ArrowDown, Lock } from "lucide-react";
import { Quiz, QuizQuestion, QuizResult } from "../types/types";
import { adminQuizService } from "../services/adminQuizService";
import { theme } from "../theme/theme";

export function AdminQuizManager() {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedQuizId, setExpandedQuizId] = useState<string | null>(null);
  const [expandedResultId, setExpandedResultId] = useState<string | null>(null);
  
  // Form state
  const [showForm, setShowForm] = useState(false);
  const [editingQuizId, setEditingQuizId] = useState<string | null>(null);
  const [hasResponses, setHasResponses] = useState(false);
  const [saving, setSaving] = useState(false);
  
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    timeLimitMinutes: 10,
    status: "RASCUNHO" as "RASCUNHO" | "PUBLICADO" | "INATIVO",
    questions: [] as QuizQuestion[]
  });

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

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      timeLimitMinutes: 10,
      status: "RASCUNHO",
      questions: []
    });
    setEditingQuizId(null);
    setHasResponses(false);
    setShowForm(false);
  };

  const handleEdit = (quiz: Quiz) => {
    setFormData({
      title: quiz.title,
      description: quiz.description,
      timeLimitMinutes: quiz.timeLimitMinutes,
      status: quiz.status || "RASCUNHO",
      questions: JSON.parse(JSON.stringify(quiz.questions)) // Deep copy
    });
    setEditingQuizId(quiz.id);
    setHasResponses((quiz.results && quiz.results.length > 0) || false);
    setShowForm(true);
  };

  const handleDuplicate = async (id: string, title: string) => {
    if (!confirm(`Deseja duplicar o AVA "${title}"?`)) return;
    try {
      setLoading(true);
      await adminQuizService.duplicateQuiz(id);
      loadQuizzes();
    } catch (error) {
      console.error("Erro ao duplicar quiz", error);
      alert("Erro ao duplicar o AVA.");
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
    if (hasResponses) return;
    setFormData(prev => ({
      ...prev,
      questions: [
        ...prev.questions,
        {
          id: `q_${Date.now()}`,
          type: "MULTIPLE_CHOICE",
          text: "",
          rationale: "",
          options: [
            { text: "", isCorrect: true },
            { text: "", isCorrect: false }
          ]
        }
      ]
    }));
  };

  const updateQuestion = (index: number, updates: Partial<QuizQuestion>) => {
    if (hasResponses) return;
    const newQuestions = [...formData.questions];
    newQuestions[index] = { ...newQuestions[index], ...updates };
    setFormData({ ...formData, questions: newQuestions });
  };

  const removeQuestion = (index: number) => {
    if (hasResponses) return;
    const newQuestions = [...formData.questions];
    newQuestions.splice(index, 1);
    setFormData({ ...formData, questions: newQuestions });
  };

  const moveQuestion = (index: number, direction: 'up' | 'down') => {
    if (hasResponses) return;
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === formData.questions.length - 1) return;
    
    const newQuestions = [...formData.questions];
    const swapIndex = direction === 'up' ? index - 1 : index + 1;
    const temp = newQuestions[index];
    newQuestions[index] = newQuestions[swapIndex];
    newQuestions[swapIndex] = temp;
    
    setFormData({ ...formData, questions: newQuestions });
  };

  const addOption = (qIndex: number) => {
    if (hasResponses) return;
    const newQuestions = [...formData.questions];
    newQuestions[qIndex].options.push({ text: "", isCorrect: false });
    setFormData({ ...formData, questions: newQuestions });
  };

  const updateOptionText = (qIndex: number, optIndex: number, text: string) => {
    if (hasResponses) return;
    const newQuestions = [...formData.questions];
    newQuestions[qIndex].options[optIndex].text = text;
    setFormData({ ...formData, questions: newQuestions });
  };

  const removeOption = (qIndex: number, optIndex: number) => {
    if (hasResponses) return;
    const newQuestions = [...formData.questions];
    if (newQuestions[qIndex].options.length <= 2) {
      alert("Uma pergunta de múltipla escolha deve ter pelo menos 2 opções.");
      return;
    }
    newQuestions[qIndex].options.splice(optIndex, 1);
    setFormData({ ...formData, questions: newQuestions });
  };

  const setCorrectOption = (qIndex: number, optIndex: number) => {
    if (hasResponses) return;
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

    // Validate questions if not locked
    if (!hasResponses) {
      for (let i = 0; i < formData.questions.length; i++) {
        const q = formData.questions[i];
        if (!q.text.trim()) {
          alert(`A pergunta ${i + 1} precisa de um enunciado.`);
          return;
        }
        if (q.type === "MULTIPLE_CHOICE") {
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
      }
    }

    try {
      setSaving(true);
      if (editingQuizId) {
        await adminQuizService.updateQuiz(editingQuizId, formData);
      } else {
        await adminQuizService.createQuiz(formData);
      }
      resetForm();
      loadQuizzes();
    } catch (error) {
      console.error(error);
      alert("Erro ao salvar AVA.");
    } finally {
      setSaving(false);
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}m ${s}s`;
  };

  const getStatusBadge = (status?: string) => {
    switch(status) {
      case "PUBLICADO": return <span style={{ background: "#e8f5e9", color: "#2e7d32", padding: "4px 10px", borderRadius: "12px", fontWeight: "bold", fontSize: "0.8rem" }}>Publicado</span>;
      case "INATIVO": return <span style={{ background: "#eeeeee", color: "#616161", padding: "4px 10px", borderRadius: "12px", fontWeight: "bold", fontSize: "0.8rem" }}>Inativo</span>;
      case "RASCUNHO":
      default:
        return <span style={{ background: "#fff8e1", color: "#f57f17", padding: "4px 10px", borderRadius: "12px", fontWeight: "bold", fontSize: "0.8rem" }}>Rascunho</span>;
    }
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
            onClick={() => { resetForm(); setShowForm(true); }}
            style={{ display: "flex", alignItems: "center", gap: "8px", background: theme.colors.primary, color: "white", padding: "10px 16px", borderRadius: "8px", border: "none", fontWeight: "bold", cursor: "pointer" }}
          >
            <PlusCircle size={20} /> Novo AVA
          </button>
        )}
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} style={{ background: "white", padding: "20px", borderRadius: "12px", boxShadow: `0 4px 12px ${theme.colors.shadowBase}`, marginBottom: "30px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "20px" }}>
            <h3 style={{ margin: 0, color: theme.colors.primary }}>{editingQuizId ? "Editar AVA" : "Criar Novo AVA"}</h3>
            <button type="button" onClick={resetForm} style={{ background: "none", border: "none", cursor: "pointer", color: theme.colors.textSecondary }}>
              <X size={24} />
            </button>
          </div>
          
          {hasResponses && (
            <div style={{ background: "#fff3cd", color: "#856404", padding: "15px", borderRadius: "8px", marginBottom: "20px", display: "flex", alignItems: "center", gap: "10px", border: "1px solid #ffeeba" }}>
              <Lock size={20} />
              <div>
                <strong>Perguntas bloqueadas!</strong> Este AVA já possui respostas cadastradas. Para preservar a integridade das notas, não é possível alterar as questões. 
                Se precisar corrigir uma questão, utilize a opção "Duplicar" na lista.
              </div>
            </div>
          )}

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
            
            <div>
              <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold", color: theme.colors.textSecondary }}>Status</label>
              <select 
                value={formData.status} 
                onChange={e => setFormData({ ...formData, status: e.target.value as any })}
                style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #ccc", boxSizing: "border-box", background: "white" }}
              >
                {!hasResponses && <option value="RASCUNHO">Rascunho</option>}
                <option value="PUBLICADO">Publicado</option>
                <option value="INATIVO">Inativo</option>
              </select>
            </div>
          </div>

          <div style={{ borderTop: "2px solid #eee", paddingTop: "20px", marginBottom: "20px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px" }}>
              <h4 style={{ margin: 0, color: theme.colors.textMain }}>Perguntas ({formData.questions.length})</h4>
              {!hasResponses && (
                <button type="button" onClick={addQuestion} style={{ display: "flex", alignItems: "center", gap: "5px", background: theme.colors.success, color: "white", padding: "6px 12px", borderRadius: "6px", border: "none", cursor: "pointer", fontWeight: "bold", fontSize: "0.85rem" }}>
                  <Plus size={16} /> Adicionar Pergunta
                </button>
              )}
            </div>

            {formData.questions.map((q, qIndex) => (
              <div key={q.id} style={{ background: "#f8f9fa", padding: "15px", borderRadius: "8px", marginBottom: "15px", border: "1px solid #e0e0e0", opacity: hasResponses ? 0.7 : 1 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "15px", alignItems: "center" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <strong style={{ fontSize: "1.1rem" }}>{qIndex + 1}.</strong>
                    <select
                      disabled={hasResponses}
                      value={q.type || "MULTIPLE_CHOICE"}
                      onChange={e => updateQuestion(qIndex, { type: e.target.value as any })}
                      style={{ padding: "6px 10px", borderRadius: "6px", border: "1px solid #ccc" }}
                    >
                      <option value="MULTIPLE_CHOICE">Múltipla Escolha</option>
                      <option value="OPEN_ENDED">Aberta / Dissertativa</option>
                    </select>
                  </div>
                  <div style={{ display: "flex", gap: "5px" }}>
                    {!hasResponses && (
                      <>
                        <button type="button" onClick={() => moveQuestion(qIndex, 'up')} disabled={qIndex === 0} style={{ background: "white", border: "1px solid #ddd", borderRadius: "4px", padding: "4px", cursor: qIndex === 0 ? "not-allowed" : "pointer" }}><ArrowUp size={16} /></button>
                        <button type="button" onClick={() => moveQuestion(qIndex, 'down')} disabled={qIndex === formData.questions.length - 1} style={{ background: "white", border: "1px solid #ddd", borderRadius: "4px", padding: "4px", cursor: qIndex === formData.questions.length - 1 ? "not-allowed" : "pointer" }}><ArrowDown size={16} /></button>
                        <button type="button" onClick={() => removeQuestion(qIndex)} style={{ background: "white", border: "1px solid #ddd", color: theme.colors.danger, borderRadius: "4px", padding: "4px", cursor: "pointer", marginLeft: "10px" }}><Trash2 size={16} /></button>
                      </>
                    )}
                  </div>
                </div>
                
                <input
                  type="text"
                  placeholder="Enunciado da pergunta"
                  value={q.text}
                  onChange={e => updateQuestion(qIndex, { text: e.target.value })}
                  readOnly={hasResponses}
                  style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #ccc", boxSizing: "border-box", marginBottom: "15px", background: hasResponses ? "#eee" : "white" }}
                />

                {q.type === "OPEN_ENDED" ? (
                  <div style={{ marginLeft: "15px" }}>
                    <p style={{ fontSize: "0.85rem", color: "#666", marginBottom: "8px", fontWeight: "bold" }}>Gabarito Esperado (Opcional):</p>
                    <textarea 
                      placeholder="Resposta modelo para facilitar a correção..."
                      value={q.expectedAnswer || ""}
                      onChange={e => updateQuestion(qIndex, { expectedAnswer: e.target.value })}
                      readOnly={hasResponses}
                      style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #ccc", boxSizing: "border-box", minHeight: "80px", background: hasResponses ? "#eee" : "white" }}
                    />
                  </div>
                ) : (
                  <div style={{ marginLeft: "15px" }}>
                    <p style={{ fontSize: "0.85rem", color: "#666", marginBottom: "8px", fontWeight: "bold" }}>Opções (Marque a correta):</p>
                    {q.options.map((opt, optIndex) => (
                      <div key={optIndex} style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
                        <input
                          type="radio"
                          name={`correct_opt_${qIndex}`}
                          checked={opt.isCorrect}
                          onChange={() => setCorrectOption(qIndex, optIndex)}
                          disabled={hasResponses}
                          style={{ cursor: hasResponses ? "not-allowed" : "pointer", width: "16px", height: "16px", accentColor: theme.colors.success }}
                        />
                        <input
                          type="text"
                          placeholder={`Opção ${optIndex + 1}`}
                          value={opt.text}
                          onChange={e => updateOptionText(qIndex, optIndex, e.target.value)}
                          readOnly={hasResponses}
                          style={{ flex: 1, padding: "8px", borderRadius: "4px", border: opt.isCorrect ? `2px solid ${theme.colors.success}` : "1px solid #ccc", background: hasResponses ? "#eee" : "white" }}
                        />
                        {!hasResponses && (
                          <button type="button" onClick={() => removeOption(qIndex, optIndex)} style={{ background: "none", border: "none", color: "#999", cursor: "pointer" }}>
                            <X size={16} />
                          </button>
                        )}
                      </div>
                    ))}
                    {!hasResponses && (
                      <button type="button" onClick={() => addOption(qIndex)} style={{ background: "none", border: "none", color: theme.colors.primary, cursor: "pointer", fontSize: "0.85rem", fontWeight: "bold", padding: "5px 0", marginBottom: "10px" }}>
                        + Adicionar opção
                      </button>
                    )}
                    
                    <p style={{ fontSize: "0.85rem", color: "#666", marginBottom: "8px", fontWeight: "bold", marginTop: "10px" }}>Justificativa (Opcional):</p>
                    <input
                      type="text"
                      placeholder="Explicação da resposta correta"
                      value={q.rationale || ""}
                      onChange={e => updateQuestion(qIndex, { rationale: e.target.value })}
                      readOnly={hasResponses}
                      style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #ccc", boxSizing: "border-box", background: hasResponses ? "#eee" : "white" }}
                    />
                  </div>
                )}
              </div>
            ))}
            {formData.questions.length === 0 && (
              <p style={{ textAlign: "center", color: "#888", fontStyle: "italic", padding: "20px" }}>Nenhuma pergunta adicionada.</p>
            )}
          </div>

          <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
            <button type="button" onClick={resetForm} style={{ padding: "10px 20px", border: "none", borderRadius: "8px", background: "#e0e0e0", color: "#333", fontWeight: "bold", cursor: "pointer" }}>
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
                  style={{ padding: "20px", cursor: "pointer", display: "flex", flexWrap: "wrap", gap: "15px", justifyContent: "space-between", alignItems: "center", borderLeft: `4px solid ${quiz.status === "PUBLICADO" ? theme.colors.primary : "#999"}` }}
                >
                  <div style={{ flex: "1 1 250px" }}>
                    <h3 style={{ margin: "0 0 5px 0", color: theme.colors.textMain, display: "flex", flexWrap: "wrap", alignItems: "center", gap: "10px" }}>
                      {quiz.title}
                      {getStatusBadge(quiz.status)}
                    </h3>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "15px", color: theme.colors.textSecondary, fontSize: "0.85rem", alignItems: "center" }}>
                      <span style={{ display: "flex", alignItems: "center", gap: "4px" }}><BookOpen size={14} /> {quiz.questions.length} perguntas</span>
                      <span style={{ display: "flex", alignItems: "center", gap: "4px" }}><Clock size={14} /> {quiz.timeLimitMinutes} min</span>
                      <span>{results.length} resposta(s)</span>
                    </div>
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", alignItems: "center", justifyContent: "flex-start" }}>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDuplicate(quiz.id, quiz.title); }}
                      style={{ background: "none", border: "none", color: theme.colors.secondary, cursor: "pointer", padding: "5px", fontWeight: "bold", fontSize: "0.85rem", display: "flex", alignItems: "center", gap: "4px" }}
                      title="Duplicar AVA"
                    >
                      <Copy size={18} /> Duplicar
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleEdit(quiz); }}
                      style={{ background: "none", border: "none", color: theme.colors.primary, cursor: "pointer", padding: "5px", fontWeight: "bold", fontSize: "0.85rem", display: "flex", alignItems: "center", gap: "4px" }}
                      title="Editar AVA"
                    >
                      <Edit size={18} /> Editar
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleDelete(quiz.id, quiz.title); }}
                      style={{ background: "none", border: "none", color: theme.colors.danger, cursor: "pointer", padding: "5px", display: "flex", alignItems: "center" }}
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
                              const multipleChoiceQuestions = quiz.questions.filter(q => q.type !== "OPEN_ENDED").length;
                              const maxScore = multipleChoiceQuestions > 0 ? multipleChoiceQuestions : 1; // Prevent div by 0
                              const percentage = (r.totalScore / maxScore) * 100;
                              const colorClass = percentage >= 70 ? theme.colors.success : (percentage >= 50 ? theme.colors.warning : theme.colors.danger);
                              
                              const isResultExpanded = expandedResultId === r.id;
                              
                              return (
                                <Fragment key={r.id}>
                                  <tr 
                                    style={{ borderBottom: "1px solid #eee", cursor: "pointer", background: isResultExpanded ? "#f0f7ff" : "white" }}
                                    onClick={() => setExpandedResultId(isResultExpanded ? null : r.id)}
                                  >
                                    <td style={{ padding: "12px", fontWeight: "bold", color: theme.colors.textMain }}>{r.responderName}</td>
                                    <td style={{ padding: "12px", textAlign: "center", fontWeight: "bold", color: colorClass }}>
                                      {r.totalScore} / {maxScore} ({(percentage).toFixed(0)}%)
                                    </td>
                                    <td style={{ padding: "12px", textAlign: "center", color: theme.colors.textSecondary, fontSize: "0.9rem" }}>
                                      {formatTime(r.timeSpentSeconds)}
                                    </td>
                                    <td style={{ padding: "12px", textAlign: "right", color: theme.colors.textSecondary, fontSize: "0.85rem", whiteSpace: "nowrap" }}>
                                      {new Date(r.createdAt || "").toLocaleDateString("pt-BR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                                      <button 
                                        onClick={(e) => { e.stopPropagation(); setExpandedResultId(isResultExpanded ? null : r.id); }}
                                        style={{ background: "none", border: "none", color: theme.colors.primary, cursor: "pointer", marginLeft: "15px", padding: "2px", verticalAlign: "middle" }}
                                        title="Ver Respostas"
                                      >
                                        {isResultExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                      </button>
                                      <button 
                                        onClick={(e) => { e.stopPropagation(); handleDeleteResult(r.id, r.responderName); }}
                                        style={{ background: "none", border: "none", color: theme.colors.danger, cursor: "pointer", marginLeft: "10px", padding: "2px", verticalAlign: "middle" }}
                                        title="Apagar Resultado"
                                      >
                                        <Trash2 size={16} />
                                      </button>
                                    </td>
                                  </tr>
                                  {isResultExpanded && r.answers && (
                                    <tr>
                                      <td colSpan={4} style={{ padding: "15px", background: "#f8f9fa", borderBottom: "2px solid #ddd" }}>
                                        <h5 style={{ margin: "0 0 10px 0", color: theme.colors.textMain }}>Desempenho de {r.responderName}:</h5>
                                        
                                        {(() => {
                                          const wrongQuestions = quiz.questions.map((q, i) => ({ q, qIndex: i })).filter(({ q, qIndex }) => {
                                            if (q.type === "OPEN_ENDED") return false;
                                            const selectedOptIndex = r.answers![qIndex.toString()];
                                            return !q.options[selectedOptIndex]?.isCorrect;
                                          });

                                          const correctQuestions = quiz.questions.map((q, i) => ({ q, qIndex: i })).filter(({ q, qIndex }) => {
                                            if (q.type === "OPEN_ENDED") return false;
                                            const selectedOptIndex = r.answers![qIndex.toString()];
                                            return q.options[selectedOptIndex]?.isCorrect;
                                          });
                                          
                                          const openQuestions = quiz.questions.map((q, i) => ({ q, qIndex: i })).filter(({ q }) => q.type === "OPEN_ENDED");

                                          return (
                                            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                                              {wrongQuestions.length > 0 && (
                                                <div>
                                                  <h6 style={{ margin: "0 0 10px 0", color: theme.colors.danger, fontSize: "0.95rem" }}>❌ Respostas Incorretas (Múltipla Escolha)</h6>
                                                  <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                                                    {wrongQuestions.map(({ q, qIndex }) => {
                                                      const selectedOptIndex = r.answers![qIndex.toString()];
                                                      return (
                                                        <div key={q.id} style={{ padding: "10px", background: "white", borderRadius: "8px", borderLeft: `4px solid ${theme.colors.danger}` }}>
                                                          <p style={{ margin: "0 0 5px 0", fontWeight: "bold", fontSize: "0.9rem" }}>{qIndex + 1}. {q.text}</p>
                                                          <p style={{ margin: 0, fontSize: "0.85rem", color: theme.colors.danger }}>
                                                            <strong>Marcou:</strong> {selectedOptIndex !== undefined ? q.options[selectedOptIndex]?.text || "Opção excluída" : "Não respondeu"} ❌
                                                          </p>
                                                          <p style={{ margin: "3px 0 0 0", fontSize: "0.85rem", color: theme.colors.success }}>
                                                            <strong>Correta:</strong> {q.options.find(opt => opt.isCorrect)?.text}
                                                          </p>
                                                          {q.rationale && (
                                                            <p style={{ margin: "5px 0 0 0", fontSize: "0.8rem", color: "#666", fontStyle: "italic" }}>
                                                              💡 Justificativa: {q.rationale}
                                                            </p>
                                                          )}
                                                        </div>
                                                      );
                                                    })}
                                                  </div>
                                                </div>
                                              )}

                                              {correctQuestions.length > 0 && (
                                                <div>
                                                  <h6 style={{ margin: "0 0 10px 0", color: theme.colors.success, fontSize: "0.95rem" }}>✅ Respostas Corretas (Múltipla Escolha)</h6>
                                                  <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                                                    {correctQuestions.map(({ q, qIndex }) => {
                                                      const selectedOptIndex = r.answers![qIndex.toString()];
                                                      return (
                                                        <div key={q.id} style={{ padding: "10px", background: "white", borderRadius: "8px", borderLeft: `4px solid ${theme.colors.success}` }}>
                                                          <p style={{ margin: "0 0 5px 0", fontWeight: "bold", fontSize: "0.9rem" }}>{qIndex + 1}. {q.text}</p>
                                                          <p style={{ margin: 0, fontSize: "0.85rem", color: theme.colors.success }}>
                                                            <strong>Marcou:</strong> {selectedOptIndex !== undefined ? q.options[selectedOptIndex]?.text || "Opção excluída" : "Não respondeu"} ✅
                                                          </p>
                                                        </div>
                                                      );
                                                    })}
                                                  </div>
                                                </div>
                                              )}
                                              
                                              {openQuestions.length > 0 && (
                                                <div>
                                                  <h6 style={{ margin: "0 0 10px 0", color: theme.colors.primary, fontSize: "0.95rem" }}>📝 Respostas Dissertativas (Correção Manual)</h6>
                                                  <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                                                    {openQuestions.map(({ q, qIndex }) => {
                                                      const answerText = r.answers![qIndex.toString()] as any; // Para abertas, o frontend vai enviar string, vamos apenas exibir. (Requer ajuste no taking page depois).
                                                      return (
                                                        <div key={q.id} style={{ padding: "10px", background: "white", borderRadius: "8px", borderLeft: `4px solid ${theme.colors.primary}` }}>
                                                          <p style={{ margin: "0 0 5px 0", fontWeight: "bold", fontSize: "0.9rem" }}>{qIndex + 1}. {q.text}</p>
                                                          <div style={{ margin: "5px 0", padding: "8px", background: "#f5f5f5", borderRadius: "4px", fontSize: "0.85rem", color: "#333" }}>
                                                            <strong>Resposta do Aluno:</strong><br/>
                                                            {answerText || <span style={{color: "#999", fontStyle: "italic" }}>Não respondeu</span>}
                                                          </div>
                                                          {q.expectedAnswer && (
                                                            <div style={{ margin: "5px 0 0 0", padding: "8px", background: "#e8f5e9", borderRadius: "4px", fontSize: "0.85rem", color: "#2e7d32" }}>
                                                              <strong>Gabarito Esperado:</strong><br/>
                                                              {q.expectedAnswer}
                                                            </div>
                                                          )}
                                                        </div>
                                                      );
                                                    })}
                                                  </div>
                                                </div>
                                              )}
                                              
                                              {wrongQuestions.length === 0 && correctQuestions.length === 0 && openQuestions.length === 0 && (
                                                <p style={{ fontSize: "0.9rem", color: "#666", fontStyle: "italic" }}>Nenhuma resposta registrada.</p>
                                              )}
                                            </div>
                                          );
                                        })()}
                                      </td>
                                    </tr>
                                  )}
                                </Fragment>
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
