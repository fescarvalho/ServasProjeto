
import "dotenv/config";
import express from "express";
import cors from "cors";
import { PrismaClient } from "@prisma/client";
import jwt from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";

const app = express();
app.use(cors());
const prisma = new PrismaClient();

// --- MIDDLEWARE DE AUTENTICAÇÃO ---
function authMiddleware(req: Request, res: Response, next: NextFunction) {
  // 1. Pegamos o valor cru do cabeçalho
  const authHeader = req.headers.authorization;

  // 2. VERIFICAÇÃO DE SEGURANÇA (Resolve o erro do TypeScript):
  // Se não existir, OU se for uma lista (array), nós rejeitamos.
  if (!authHeader || typeof authHeader !== "string") {
    return res.status(401).json({ error: "Token não fornecido ou formato inválido" });
  }

  // Daqui para baixo, o TypeScript já sabe que 'authHeader' é obrigatóriamente uma STRING
  const parts = authHeader.split(" ");

  if (parts.length !== 2) {
    return res.status(401).json({ error: "Erro no Token" });
  }

  const [scheme, token] = parts;

  if (!/^Bearer$/i.test(scheme)) {
    return res.status(401).json({ error: "Token malformatado" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as { id: string };

    (req as any).userId = decoded.id;

    return next();
  } catch (err) {
    return res.status(401).json({ error: "Token inválido" });
  }
}

// Configuração do CORS
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

app.use(express.json());

app.get("/", (req, res) => {
  res.send("API com TypeScript rodando na Vercel! 🚀");
});

// --- ROTA DE LISTAGEM (COM FILTRO DE RASCUNHO) ---
// --- ROTA DE LISTAGEM (CORRIGIDA: MOSTRA TUDO PARA TODOS) ---
app.get("/masses", authMiddleware, async (req, res) => {
  // Não precisamos mais filtrar por usuário. Todo mundo vê a agenda.

  const masses = await prisma.mass.findMany({
    // Removemos o 'where: whereClause'
    include: { signups: { include: { user: true } } },
    orderBy: { date: "asc" },
  });

  res.json(masses);
});
// --- NOVA ROTA PATCH (PARA PUBLICAR/RASCUNHO) ---
app.patch<{ id: string }>("/masses/:id", authMiddleware, async (req, res) => {
  const { id } = req.params;
  const data = req.body;

  try {
    const updatedMass = await prisma.mass.update({
      where: { id: String(id) }, // Garante que é String
      data: data,
    });
    res.json(updatedMass);
  } catch (error) {
    res.status(500).json({ error: "Erro ao atualizar status da missa" });
  }
});

// Rota de Login
app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) return res.status(404).json({ error: "Usuário não encontrado" });

    if (user.password === password) {
      // Gera o Token
      const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET as string, {
        expiresIn: "7d",
      });

      return res.json({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        token: token, // Envia o token para o frontend
      });
    }

    return res.status(401).json({ error: "Senha incorreta" });
  } catch (error) {
    return res.status(500).json({ error: "Erro interno no servidor" });
  }
});

// Entrar ou Sair da Escala
app.post("/toggle-signup", async (req, res) => {
  const { userId, massId } = req.body;

  try {
    // Buscamos a missa e as inscrições ORDENADAS por data de chegada
    // Isso é essencial para saber quem é o primeiro da fila de reserva
    const mass = await prisma.mass.findUnique({
      where: { id: massId },
      include: { 
        signups: { 
          orderBy: { createdAt: "asc" } 
        } 
      },
    });

    if (!mass) return res.status(404).json({ error: "Missa não encontrada" });

    const existingSignup = mass.signups.find((s) => s.userId === userId);

    // ====================================================
    // CENÁRIO A: SAIR (DESISTÊNCIA)
    // ====================================================
    if (existingSignup) {
      // 1. Remove a inscrição da pessoa que clicou
      await prisma.signup.delete({
        where: { id: existingSignup.id },
      });

      // 2. LÓGICA DE PROMOÇÃO AUTOMÁTICA
      // Se a pessoa que saiu estava CONFIRMADA, abriu uma vaga oficial.
      // Precisamos puxar o primeiro da reserva para essa vaga.
      if (existingSignup.status === "CONFIRMADO") {
        
        // Procura a primeira pessoa que está como RESERVA
        const nextInLine = mass.signups.find((s) => s.status === "RESERVA");

        if (nextInLine) {
          await prisma.signup.update({
            where: { id: nextInLine.id },
            data: { status: "CONFIRMADO" },
          });
          // (Opcional) Aqui você poderia disparar um email/zap avisando que a pessoa subiu
        }
      }

      return res.json({ message: "Inscrição removida com sucesso" });
    }

    // ====================================================
    // CENÁRIO B: ENTRAR (INSCRIÇÃO)
    // ====================================================
    
    // 1. Conta quantas pessoas estão CONFIRMADAS de verdade
    const confirmedCount = mass.signups.filter(s => s.status === "CONFIRMADO").length;

    // 2. Decide o status: Tem vaga? CONFIRMADO. Lotou? RESERVA.
    let newStatus: "CONFIRMADO" | "RESERVA" = "CONFIRMADO";
    let message = "Inscrição confirmada com sucesso!";

    if (confirmedCount >= mass.maxServers) {
      newStatus = "RESERVA";
      message = "Vagas esgotadas. Você entrou na Lista de Reserva.";
    }

    // 3. Cria a inscrição com o status decidido
    await prisma.signup.create({
      data: { 
        userId, 
        massId, 
        status: newStatus 
      },
    });

    return res.json({ message, status: newStatus });

  } catch (error) {
    console.error(error); // Bom para debugar no terminal
    return res.status(500).json({ error: "Erro ao processar inscrição" });
  }
});

// Definir função (Cerimoniária/Librífera)
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

// Editar Missa
app.put("/masses/:id", async (req, res) => {
  const { id } = req.params;
  const { date, time, maxServers, name, deadline, open } = req.body;

  try {
    const [ano, mes, dia] = date.split("-").map(Number);
    const [hora, minuto] = time.split(":").map(Number);

    const dataCompleta = new Date(Date.UTC(ano, mes - 1, dia, hora, minuto));
    dataCompleta.setUTCHours(dataCompleta.getUTCHours() + 3);

    const dataLimite = deadline ? new Date(deadline) : null;

    // CORREÇÃO AQUI: Adicionamos ': any' para o TypeScript aceitar novos campos
    const dadosParaAtualizar: any = {
      date: dataCompleta,
      maxServers: Number(maxServers),
      name: name || null,
      deadline: dataLimite,
    };

    // Agora ele aceita adicionar o 'open' se ele existir
    if (open !== undefined) {
      dadosParaAtualizar.open = Boolean(open);
    }

    const updatedMass = await prisma.mass.update({
      where: { id },
      data: dadosParaAtualizar,
    });

    res.json(updatedMass);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao atualizar missa" });
  }
});
// CRIAR MISSA (CORRIGIDO: REMOVIDO SCALE)
app.post("/masses", async (req, res) => {
  const { date, time, maxServers, name, deadline, open } = req.body;

  try {
    const [ano, mes, dia] = date.split("-").map(Number);
    const [hora, minuto] = time.split(":").map(Number);

    const dataCompleta = new Date(Date.UTC(ano, mes - 1, dia, hora, minuto));
    dataCompleta.setUTCHours(dataCompleta.getUTCHours() + 3);

    const dataLimite = deadline ? new Date(deadline) : null;

    // REMOVI A PARTE QUE CRIAVA "SCALE", POIS APAGAMOS ESSA TABELA
    const newMass = await prisma.mass.create({
      data: {
        date: dataCompleta,
        maxServers: Number(maxServers),
        name: name || null,
        deadline: deadline ? new Date(deadline) : null,
        published: false, // Começa sempre como Rascunho
        open: Boolean(open)
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
// Rota para o Admin REMOVER uma serva da escala (excluir inscrição)
app.delete("/signup/:id", async (req, res) => {
  const { id } = req.params;

  try {
    // 1. Busca a inscrição antes de deletar para saber a Missa e o Status
    const signupToDelete = await prisma.signup.findUnique({
      where: { id },
    });

    if (!signupToDelete) return res.status(404).json({ error: "Inscrição não encontrada" });

    // 2. Deleta a inscrição
    await prisma.signup.delete({ where: { id } });

    // 3. LÓGICA DE PROMOÇÃO (Igual ao toggle-signup)
    // Se quem saiu estava CONFIRMADA, puxa a primeira da RESERVA
    if (signupToDelete.status === "CONFIRMADO") {
      const mass = await prisma.mass.findUnique({
        where: { id: signupToDelete.massId },
        include: { signups: { orderBy: { createdAt: "asc" } } },
      });

      if (mass) {
        const nextInLine = mass.signups.find((s) => s.status === "RESERVA");
        if (nextInLine) {
          await prisma.signup.update({
            where: { id: nextInLine.id },
            data: { status: "CONFIRMADO" },
          });
        }
      }
    }

    return res.json({ message: "Serva removida com sucesso." });
  } catch (error) {
    return res.status(500).json({ error: "Erro ao remover inscrição." });
  }
});


// Alternar se a inscrição está aberta ou fechada
app.patch("/masses/:id/toggle-open", async (req, res) => {
  const { id } = req.params;
  const { open } = req.body;
  const mass = await prisma.mass.update({
    where: { id },
    data: { open },
  });
  res.json(mass);
});

app.patch("/signup/:id/promote", async (req, res) => {
  const { id } = req.params;

  try {
    await prisma.signup.update({
      where: { id },
      data: { status: "CONFIRMADO" },
    });
    return res.json({ message: "Serva promovida com sucesso!" });
  } catch (error) {
    return res.status(500).json({ error: "Erro ao promover serva." });
  }
});

// Rota para confirmar/desconfirmar presença
app.patch("/signup/:id/toggle-presence", async (req, res) => {
  const { id } = req.params;
  try {
    // 1. Busca o estado atual
    const existing = await prisma.signup.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ error: "Inscrição não encontrada" });

    // 2. Inverte o valor (se era false vira true, e vice-versa)
    const updated = await prisma.signup.update({
      where: { id },
      data: { present: !existing.present },
    });
    
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: "Erro ao confirmar presença" });
  }
});


// --- ROTAS DE AVISOS (MURAL) ---

// 1. Listar Avisos Ativos
app.get("/notices", async (req, res) => {
  const notices = await prisma.notice.findMany({
    where: { active: true },
    orderBy: { createdAt: "desc" },
  });
  res.json(notices);
});

// 2. Criar Novo Aviso
app.post("/notices", async (req, res) => {
  const { text } = req.body;
  const notice = await prisma.notice.create({
    data: { text, active: true },
  });
  res.json(notice);
});

// 3. Apagar Aviso
app.delete("/notices/:id", async (req, res) => {
  const { id } = req.params;
  await prisma.notice.delete({ where: { id } });
  res.json({ success: true });
});
// --- SERVIDOR ---
if (process.env.NODE_ENV !== "production") {
  const PORT = process.env.PORT || 3001;
  app.listen(Number(PORT), "0.0.0.0", () => {
    console.log(`🚀 Server ready at: http://localhost:${PORT}`);
  });
}

export default app;