import { useState, useEffect } from "react";
import { Megaphone, Trash2 } from "lucide-react";
import { api } from "../services/api";
import { Notice } from "../types/types";

export function NoticeBoard() {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [newNoticeText, setNewNoticeText] = useState("");

  useEffect(() => { loadNotices(); }, []);

  async function loadNotices() {
    const res = await api.get("/notices");
    setNotices(res.data);
  }

  async function handleAddNotice(e: React.FormEvent) {
    e.preventDefault();
    if (!newNoticeText.trim()) return;
    await api.post("/notices", { text: newNoticeText });
    setNewNoticeText("");
    loadNotices();
  }

  async function handleDeleteNotice(id: string) {
    if (confirm("Apagar este aviso?")) {
      await api.delete(`/notices/${id}`);
      loadNotices();
    }
  }

  return (
    <div className="no-print" style={{ background: "#fff3cd", padding: "15px", borderRadius: "12px", marginBottom: "20px", border: "1px solid #ffeeba" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#856404", fontWeight: "bold", marginBottom: "10px" }}>
        <Megaphone size={18} /> Mural de Avisos
      </div>
      <form onSubmit={handleAddNotice} style={{ display: "flex", gap: "10px", marginBottom: "15px" }}>
        <input type="text" placeholder="Escreva um aviso..." value={newNoticeText} onChange={(e) => setNewNoticeText(e.target.value)} style={{ flex: 1, padding: "8px", borderRadius: "6px", border: "1px solid #ddd" }} />
        <button type="submit" style={{ background: "#856404", color: "white", border: "none", padding: "0 15px", borderRadius: "6px", cursor: "pointer", fontWeight: "bold" }}>POSTAR</button>
      </form>
      {notices.length > 0 && (
        <ul style={{ listStyle: "none", padding: 0 }}>
          {notices.map(notice => (
            <li key={notice.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "white", padding: "8px 12px", borderRadius: "6px", marginBottom: "5px", border: "1px solid #eee" }}>
              <span>{notice.text}</span>
              <button onClick={() => handleDeleteNotice(notice.id)} style={{ background: "none", border: "none", color: "#c62828", cursor: "pointer" }}><Trash2 size={16} /></button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}