import { X } from "lucide-react";
import { Mass, FUNCOES } from "../types/types";

interface ScaleModalProps {
  masses: Mass[];
  onClose: () => void;
}

export function ScaleModal({ masses, onClose }: ScaleModalProps) {
  const generateText = () => {
    let fullText = "*🌸 ESCALA DAS SERVAS 🌸*\n\n";
    masses.forEach((mass) => {
      const d = new Date(mass.date);
      const dia = d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
      const sem = d
        .toLocaleDateString("pt-BR", { weekday: "long" })
        .split("-")[0]
        .toUpperCase();
      const hora = d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
      const nome = mass.name ? ` (${mass.name})` : "";

      fullText += `📅 *${dia} – ${sem}* às ${hora}h${nome}\n`;
      FUNCOES.forEach((funcao) => {
        const serva = mass.signups.find((s) => s.role === funcao);
        if (serva) fullText += `   • ${funcao}: ${serva.user.name}\n`;
      });
      fullText += "\n";
    });
    return fullText;
  };

  const texto = generateText();
  const copy = () => {
    navigator.clipboard.writeText(texto);
    alert("Copiado!");
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.8)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 999,
      }}
    >
      <div
        style={{
          background: "#222",
          padding: 20,
          borderRadius: 10,
          maxWidth: 500,
          width: "90%",
          color: "#ffd700",
        }}
      >
        <div
          style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}
        >
          <h3>Escala para WhatsApp</h3>
          <button
            onClick={onClose}
            style={{
              background: "transparent",
              border: "none",
              color: "#fff",
              cursor: "pointer",
            }}
          >
            <X />
          </button>
        </div>
        <textarea
          readOnly
          value={texto}
          style={{
            width: "100%",
            height: 300,
            background: "#000",
            color: "#ffd700",
            border: "1px solid #444",
            padding: 10,
            borderRadius: 5,
          }}
        />
        <button
          onClick={copy}
          style={{
            width: "100%",
            marginTop: 10,
            background: "#25D366",
            color: "white",
            padding: 12,
            border: "none",
            borderRadius: 5,
            fontWeight: "bold",
            cursor: "pointer",
          }}
        >
          Copiar Texto
        </button>
      </div>
    </div>
  );
}
