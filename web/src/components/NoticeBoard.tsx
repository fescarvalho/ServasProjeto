import { useEffect, useState } from "react";
import { api } from "../services/api";
import { Notice } from "../types/types";
import { Trash2, Plus, Megaphone } from "lucide-react";

interface NoticeBoardProps {
  readOnly?: boolean;
}

export function NoticeBoard({ readOnly = false }: NoticeBoardProps) {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [newNotice, setNewNotice] = useState("");

  // --- O SEGREDO: Um "gatilho" numérico para forçar a atualização ---
  const [refreshKey, setRefreshKey] = useState(0);

  // 1. O useEffect depende do 'refreshKey'. Sempre que ele mudar, roda de novo.
  useEffect(() => {
    // Definimos a função AQUI DENTRO para evitar conflitos com o React
    const loadNotices = async () => {
      try {
        const response = await api.get("/notices");
        setNotices(response.data);
      } catch (error) {
        console.error("Erro ao buscar avisos", error);
      }
    };

    loadNotices();
  }, [refreshKey]); // <--- A mágica acontece aqui

  async function handleAddNotice(e: React.FormEvent) {
    e.preventDefault();
    if (!newNotice) return;
    try {
      await api.post("/notices", { text: newNotice });
      setNewNotice("");
      // Em vez de chamar fetch(), apenas mudamos o gatilho
      setRefreshKey((prev) => prev + 1);
    } catch (error) {
      console.error(error);
      alert("Erro ao criar aviso.");
    }
  }

  async function handleDeleteNotice(id: string) {
    if (confirm("Apagar aviso?")) {
      try {
        await api.delete(`/notices/${id}`);
        // Em vez de chamar fetch(), apenas mudamos o gatilho
        setRefreshKey((prev) => prev + 1);
      } catch (error) {
        console.error(error);
        alert("Erro ao apagar.");
      }
    }
  }

  if (notices.length === 0 && readOnly) return null;

  return (
    <div
      className="notice-board"
      style={{
        background: "#fff8e1",
        border: "1px solid #ffecb3",
        borderRadius: "12px",
        padding: "20px",
        marginBottom: "20px",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
          marginBottom: "15px",
          color: "#f57f17",
        }}
      >
        <Megaphone size={24} />
        <h3 style={{ margin: 0 }}>Mural de Avisos</h3>
      </div>

      {!readOnly && (
        <form
          onSubmit={handleAddNotice}
          style={{ display: "flex", gap: "10px", marginBottom: "20px" }}
        >
          <input
            type="text"
            value={newNotice}
            onChange={(e) => setNewNotice(e.target.value)}
            placeholder="Digite um novo aviso..."
            style={{
              flex: 1,
              padding: "10px",
              borderRadius: "8px",
              border: "1px solid #ddd",
            }}
          />
          <button
            type="submit"
            style={{
              background: "#f57f17",
              color: "white",
              border: "none",
              borderRadius: "8px",
              padding: "0 15px",
              cursor: "pointer",
            }}
          >
            <Plus size={20} />
          </button>
        </form>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        {notices.map((notice) => (
          <div
            key={notice.id}
            style={{
              background: "white",
              padding: "15px",
              borderRadius: "8px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              boxShadow: "0 2px 5px rgba(0,0,0,0.05)",
            }}
          >
            <span style={{ color: "#333", lineHeight: "1.4" }}>{notice.text}</span>

            {!readOnly && (
              <button
                onClick={() => handleDeleteNotice(notice.id)}
                style={{
                  background: "none",
                  border: "none",
                  color: "#d32f2f",
                  cursor: "pointer",
                }}
              >
                <Trash2 size={18} />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
