// server/index.ts
import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';

const app = express();
const prisma = new PrismaClient();

app.use(express.json());
app.use(cors());

app.get('/', (req, res) => {
  res.send('API com TypeScript rodando!');
});

// Exemplo tipado
app.post('/users', async (req, res) => {
  const { name, email, password } = req.body;

  try {
    const user = await prisma.user.create({
      data: { name, email, password }
    });
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao criar usuário' });
  }
});
app.get('/masses', async (req, res) => {
  const masses = await prisma.mass.findMany({
    include: {
      _count: { select: { signups: true } },
      signups: { include: { user: true } }
    },
    orderBy: { date: 'asc' }
  });
  
  // Esse log vai te mostrar no terminal se o "name" está vindo
  console.log("DADOS ENVIADOS:", JSON.stringify(masses, null, 2));
  
  res.json(masses);
});

// Rota de Login Simples
app.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    // Busca o usuário pelo email
    const user = await prisma.user.findUnique({
      where: { email }
    });

    // Verificações básicas
    if (!user) {
      return res.status(404).json({ error: "Usuário não encontrado" });
    }

    if (user.password !== password) {
      return res.status(401).json({ error: "Senha incorreta" });
    }

    // Se deu tudo certo, devolve os dados do usuário
    return res.json(user);

  } catch (error) {
    return res.status(500).json({ error: "Erro interno no servidor" });
  }
});

app.post('/toggle-signup', async (req, res) => {
  const { userId, massId } = req.body;

  try {
    // Busca a missa para verificar o prazo antes de qualquer ação
    const mass = await prisma.mass.findUnique({
      where: { id: massId },
      include: { _count: { select: { signups: true } } }
    });

    if (!mass) return res.status(404).json({ error: "Missa não encontrada" });

    // 🛑 TRAVA DE PRAZO PARA QUALQUER ALTERAÇÃO (ENTRAR OU SAIR)
    if (mass.deadline) {
      const agora = new Date();
      const limite = new Date(mass.deadline);
      
      if (agora > limite) {
        return res.status(400).json({ error: "O prazo encerrou. Não é mais possível alterar sua inscrição." });
      }
    }

    // Se o prazo estiver OK, prosseguimos com a lógica de Inscrição/Desistência
    const existingSignup = await prisma.signup.findUnique({
      where: { userId_massId: { userId, massId } }
    });

    if (existingSignup) {
      // REMOVER INSCRIÇÃO
      await prisma.signup.delete({ where: { id: existingSignup.id } });
      return res.json({ status: 'removed' });
    } else {
      // ADICIONAR INSCRIÇÃO
      if (mass._count.signups >= mass.maxServers) {
        return res.status(400).json({ error: "Missa lotada!" });
      }

      await prisma.signup.create({ data: { userId, massId } });
      return res.json({ status: 'added' });
    }

  } catch (error) {
    return res.status(500).json({ error: "Erro ao atualizar inscrição" });
  }
});

app.patch('/signup/:id/role', async (req, res) => {
  const { id } = req.params; // ID da inscrição (Signup)
  const { role } = req.body; // A função (texto)

  try {
    const updatedSignup = await prisma.signup.update({
      where: { id },
      data: { role } // Atualiza só o campo role
    });
    res.json(updatedSignup);
  } catch (error) {
    res.status(500).json({ error: "Erro ao atualizar função" });
  }
});

app.put('/masses/:id', async (req, res) => {
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
        deadline: dataLimite
      }
    });

    res.json(updatedMass);
  } catch (error) {
    res.status(500).json({ error: "Erro ao atualizar missa" });
  }
});

// 1. ROTA PARA CRIAR MISSA
app.post('/masses', async (req, res) => {

  const { date, time, maxServers, name, deadline } = req.body;

  try {
    const dataCompleta = new Date(`${date}T${time}:00`);
    const dataLimite = deadline ? new Date(deadline) : null;

    let scale = await prisma.scale.findFirst();
    if (!scale) {
      scale = await prisma.scale.create({
        data: { name: "Geral", openDate: new Date(), closeDate: new Date() }
      });
    }

    const newMass = await prisma.mass.create({
      data: {
        date: dataCompleta,
        maxServers: Number(maxServers),
        scaleId: scale.id,
        name: name || null,
        deadline: dataLimite //
      }
    });

    res.json(newMass);
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Erro ao criar missa" });
  }
});

// 2. ROTA PARA DELETAR MISSA
app.delete('/masses/:id', async (req, res) => {
  const { id } = req.params;
  try {
    // Primeiro deleta as inscrições (faxina)
    await prisma.signup.deleteMany({ where: { massId: id } });
    // Depois deleta a missa
    await prisma.mass.delete({ where: { id } });
    
    res.json({ status: "deleted" });
  } catch (error) {
    res.status(500).json({ error: "Erro ao deletar missa" });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(Number(PORT), '0.0.0.0', () => {
  console.log(`🚀 Server ready at: http://0.0.0.0:${PORT}`);
});