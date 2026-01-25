import "dotenv/config";
import express from "express";
import cors from "cors";
import { PrismaClient } from "@prisma/client";
import jwt from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";

const app = express();
const prisma = new PrismaClient();

// --- CORREÇÃO 1: CONFIGURAÇÃO ÚNICA E PERMISSIVA DO CORS ---
// Coloque isso LOGO NO INÍCIO, antes de qualquer rota ou middleware
app.use(
  cors({
    origin: "*", // Aceita qualquer origem (Frontend do Codespaces, Localhost, Celular)
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"], // Adicione OPTIONS
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json());

// --- MIDDLEWARE DE AUTENTICAÇÃO ---
function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader || typeof authHeader !== "string") {
    return res.status(401).json({ error: "Token não fornecido ou formato inválido" });
  }

  const parts = authHeader.split(" ");
  if (parts.length !== 2) return res.status(401).json({ error: "Erro no Token" });

  const [scheme, token] = parts;
  if (!/^Bearer$/i.test(scheme)) return res.status(401).json({ error: "Token malformatado" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as { id: string };
    (req as any).userId = decoded.id;
    return next();
  } catch (err) {
    return res.status(401).json({ error: "Token inválido" });
  }
}

app.get("/", (req, res) => {
  res.send("API Rodando! 🚀");
});

// ... (MANTENHA O RESTANTE DAS SUAS ROTAS IGUAL AO SEU CÓDIGO ORIGINAL) ...
// ... Copie as rotas /masses, /login, /toggle-signup daqui para baixo ...

// ROTA DE LISTAGEM
app.get("/masses", authMiddleware, async (req, res) => {
  const masses = await prisma.mass.findMany({
    include: { signups: { include: { user: true } } },
    orderBy: { date: "asc" },
  });
  res.json(masses);
});

// LOGIN
app.post("/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(404).json({ error: "Usuário não encontrado" });

    if (user.password === password) {
      const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET as string, { expiresIn: "7d" });
      return res.json({ id: user.id, name: user.name, email: user.email, role: user.role, token });
    }
    return res.status(401).json({ error: "Senha incorreta" });
  } catch (error) {
    return res.status(500).json({ error: "Erro interno" });
  }
});

// ... (Pode manter o resto das rotas do seu código anterior aqui) ...

// SERVIDOR
if (process.env.NODE_ENV !== "production") {
  const PORT = process.env.PORT || 3001;
  // OUVIR EM 0.0.0.0 É ESSENCIAL PARA O CODESPACES
  app.listen(Number(PORT), "0.0.0.0", () => {
    console.log(`🚀 Server ready at port: ${PORT}`);
  });
}

export default app;