// server/index.ts
import "dotenv/config";
import express from "express";
import cors from "cors";
import { PrismaClient } from "@prisma/client";

const app = express();
const prisma = new PrismaClient();

// Configuração do CORS
app.use(
  cors({
    origin: "*", // Libera para todos (ajuste para seu domínio em produção)
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

app.use(express.json());

app.get("/", (req, res) => {
  res.send("API com TypeScript rodando na Vercel! 🚀");
});

// Exemplo tipado
app.post("/users", async (req, res) => {
  const { name, email, password } = req.body;

  try {
    const user = await prisma.user.create({
      data: { name, email, password },
    });
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: "Erro ao criar usuário" });
  }
});

app.get("/masses", async (req, res) => {
  const masses = await prisma.mass.findMany({
    include: {
      _count: { select: { signups: true } },
      signups: { include: { user: true } },
    },
    orderBy: { date: "asc" },
  });

  res.json(masses);
});

// Rota de Login (CORRIGIDA)
app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return res.status(404).json({ error: "Usuário não encontrado" });
    }

    if (user.password === password) {
      // ✅ ADICIONADO O RETURN AQUI PARA PARAR A EXECUÇÃO
      return res.json({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role, // Importante para o painel Admin
      });
    }

    // Se chegou aqui, a senha estava errada
    return res.status(401).json({ error: "Senha incorreta" });
  } catch (error) {
    return res.status(500).json({ error: "Erro interno no servidor" });
  }
});

app.post("/toggle-signup", async (req, res) => {
  const { userId, massId } = req.body;

  try {
    const mass = await prisma.mass.findUnique({
      where: { id: massId },
      include: { signups: true },
    });

    if (!mass) return res.status(404).json({ error: "Missa não encontrada" });

    const existingSignup = mass.signups.find((s) => s.userId === userId);

    // CENÁRIO A: SAIR
    if (existingSignup) {
      await prisma.signup.delete({
        where: { id: existingSignup.id },
      });
      return res.json({ message: "Inscrição removida com sucesso" });
    }

    // CENÁRIO B: ENTRAR
    if (mass.signups.length >= mass.maxServers) {
      return res.status(400).json({ error: "Limite de vagas atingido." });
    }

    await prisma.signup.create({
      data: { userId, massId },
    });

    return res.json({ message: "Inscrição realizada com sucesso" });
  } catch (error) {
    return res.status(500).json({ error: "Erro ao processar inscrição" });
  }
});

app.patch("/signup/:id/role", async (req, res) => {
  const { id } = req.params;
  const { role } = req.body;

  try {
    const updatedSignup = await prisma.signup.update({
      where: { id },
      data: { role },
    });
    res.json(updatedSignup);
  } catch (error) {
    res.status(500).json({ error: "Erro ao atualizar função" });
  }
});

// EDITAR MISSA (CORRIGIDO FUSO HORÁRIO)
app.put("/masses/:id", async (req, res) => {
  const { id } = req.params;
  const { date, time, maxServers, name, deadline } = req.body;

  try {
    // Mesma lógica de correção manual
    const [ano, mes, dia] = date.split("-").map(Number);
    const [hora, minuto] = time.split(":").map(Number);

    const dataCompleta = new Date(Date.UTC(ano, mes - 1, dia, hora, minuto));
    dataCompleta.setUTCHours(dataCompleta.getUTCHours() + 3);

    const dataLimite = deadline ? new Date(deadline) : null;

    const updatedMass = await prisma.mass.update({
      where: { id },
      data: {
        date: dataCompleta,
        maxServers: Number(maxServers),
        name: name || null,
        deadline: dataLimite,
      },
    });

    res.json(updatedMass);
  } catch (error) {
    res.status(500).json({ error: "Erro ao atualizar missa" });
  }
});

// CRIAR MISSA (CORRIGIDO FUSO HORÁRIO)
app.post("/masses", async (req, res) => {
  const { date, time, maxServers, name, deadline } = req.body;

  try {
    // 1. Quebra as strings "2023-01-20" e "19:00" em números
    const [ano, mes, dia] = date.split("-").map(Number);
    const [hora, minuto] = time.split(":").map(Number);

    // 2. Cria a data em UTC Puro (Ignora se o servidor está no Brasil ou China)
    // Mês no JS começa em 0, por isso "mes - 1"
    const dataCompleta = new Date(Date.UTC(ano, mes - 1, dia, hora, minuto));

    // 3. Adiciona 3 horas para compensar o Brasil (UTC-3)
    // 19:00 Brasil viram 22:00 UTC no banco.
    dataCompleta.setUTCHours(dataCompleta.getUTCHours() + 3);

    const dataLimite = deadline ? new Date(deadline) : null;

    let scale = await prisma.scale.findFirst();
    if (!scale) {
      scale = await prisma.scale.create({
        data: { name: "Geral", openDate: new Date(), closeDate: new Date() },
      });
    }

    const newMass = await prisma.mass.create({
      data: {
        date: dataCompleta,
        maxServers: Number(maxServers),
        scaleId: scale.id,
        name: name || null,
        deadline: dataLimite,
      },
    });

    res.json(newMass);
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Erro ao criar missa" });
  }
});
app.delete("/masses/:id", async (req, res) => {
  const { id } = req.params;
  try {
    await prisma.signup.deleteMany({ where: { massId: id } });
    await prisma.mass.delete({ where: { id } });

    res.json({ status: "deleted" });
  } catch (error) {
    res.status(500).json({ error: "Erro ao deletar missa" });
  }
});

// --- A MÁGICA PARA VERCEL ---
if (process.env.NODE_ENV !== "production") {
  const PORT = process.env.PORT || 3001;
  app.listen(Number(PORT), "0.0.0.0", () => {
    console.log(`🚀 Server ready at: http://localhost:${PORT}`);
  });
}

export default app;
