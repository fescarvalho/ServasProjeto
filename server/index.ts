// server/index.ts
import "dotenv/config";
import express from "express";
import cors from "cors";
import { PrismaClient } from "@prisma/client";

const app = express();
const prisma = new PrismaClient();

// Configuração do CORS para aceitar seu Frontend na Vercel
app.use(
  cors({
    origin: "*", // Libera para todos (ideal para testes iniciais)
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

// Rota de Login Simples
app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return res.status(404).json({ error: "Usuário não encontrado" });
    }

    if (user && user.password === password) {
      res.json({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role, // <--- ESSA LINHA É FUNDAMENTAL!
      });
    }

    return res.json(user);
  } catch (error) {
    return res.status(500).json({ error: "Erro interno no servidor" });
  }
});

app.post("/toggle-signup", async (req, res) => {
  const { userId, massId } = req.body;

  try {
    const mass = await prisma.mass.findUnique({
      where: { id: massId },
      include: { _count: { select: { signups: true } } },
    });

    if (!mass) return res.status(404).json({ error: "Missa não encontrada" });

    if (mass.deadline) {
      const agora = new Date();
      const limite = new Date(mass.deadline);

      if (agora > limite) {
        return res.status(400).json({
          error: "O prazo encerrou. Não é mais possível alterar sua inscrição.",
        });
      }
    }

    const existingSignup = await prisma.signup.findUnique({
      where: { userId_massId: { userId, massId } },
    });

    if (existingSignup) {
      await prisma.signup.delete({ where: { id: existingSignup.id } });
      return res.json({ status: "removed" });
    } else {
      if (mass._count.signups >= mass.maxServers) {
        return res.status(400).json({ error: "Missa lotada!" });
      }

      await prisma.signup.create({ data: { userId, massId } });
      return res.json({ status: "added" });
    }
  } catch (error) {
    return res.status(500).json({ error: "Erro ao atualizar inscrição" });
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

app.put("/masses/:id", async (req, res) => {
  const { id } = req.params;
  const { date, time, maxServers, name, deadline } = req.body;

  try {
    const dataCompleta = new Date(`${date}T${time}:00`);
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

app.post("/masses", async (req, res) => {
  const { date, time, maxServers, name, deadline } = req.body;

  try {
    const dataCompleta = new Date(`${date}T${time}:00`);
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

// Só inicia o servidor na porta se NÃO estivermos na Vercel (Produção)
if (process.env.NODE_ENV !== "production") {
  const PORT = process.env.PORT || 3001;
  app.listen(Number(PORT), "0.0.0.0", () => {
    console.log(`🚀 Server ready at: http://localhost:${PORT}`);
  });
}

// Exporta o app para a Vercel executar como Serverless Function
export default app;
