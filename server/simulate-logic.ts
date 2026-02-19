
import { parseDateTime, parseDeadline } from "./src/utils/date.utils";

// Mock da Missa
const mockMass = {
    id: "mass-123",
    date: parseDateTime("2026-02-19", "19:00"), // Hoje às 19:00
    deadline: parseDateTime("2026-02-19", "12:00"), // Prazo hoje às 12:00
    maxServers: 4,
    open: true,
    signups: [
        { id: "1", status: "CONFIRMADO" },
        { id: "2", status: "CONFIRMADO" },
        { id: "3", status: "CONFIRMADO" },
        { id: "4", status: "CONFIRMADO" }, // Lotado
    ]
};

console.log("Missa:", mockMass);
console.log("Agora:", new Date().toISOString());

// Simulação da lógica de verificação (que não achamos no backend, mas vamos testar hipóteses)

// Hipótese 1: Prazo de inscrição
if (mockMass.deadline && new Date() > mockMass.deadline) {
    console.log("FALHA: Prazo de inscrição encerrado.");
} else {
    console.log("SUCESSO: Dentro do prazo.");
}

// Hipótese 2: Lotação (apenas se não houver fila de espera implementada corretamente)
const confirmedCount = mockMass.signups.filter(s => s.status === "CONFIRMADO").length;
if (confirmedCount >= mockMass.maxServers) {
    console.log(`AVISO: Missa lotada (${confirmedCount}/${mockMass.maxServers}). Próximo deve ir para RESERVA.`);
}

// Verificação manual dos horários
console.log("Deadline UTC:", mockMass.deadline?.toISOString());
console.log("Current UTC:", new Date().toISOString());
