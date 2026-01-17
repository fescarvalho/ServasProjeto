import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Iniciando semeio de dados (Seed)...");

  // Limpa dados antigos
  await prisma.signup.deleteMany();
  await prisma.mass.deleteMany();
  await prisma.scale.deleteMany();
  await prisma.user.deleteMany();

  // 1. Criar o ADMIN (Use upsert para garantir que ele exista ou atualize)
  await prisma.user.upsert({
    where: { email: "coordenador@serva.com" }, // Seu e-mail de admin
    update: { role: "santaterezinha" },
    create: {
      name: "Admin",
      email: "coordenador@serva.com",
      password: "santaterezinha",
      role: "ADMIN", // <--- Importante: ADMIN em maiúsculo
    },
  });

  // 2. Criar a Serva de Teste
  const serva = await prisma.user.create({
    data: {
      name: "Serva Teste",
      email: "teste@serva.com",
      password: "123",
      role: "USER", // <--- ADICIONE ESTA LINHA! (Mesmo com default, é bom ser explícito)
    },
  });

  // 3. Criar uma Escala
  const escala = await prisma.scale.create({
    data: {
      name: "Escala de Janeiro",
      openDate: new Date(),
      closeDate: new Date(new Date().setDate(new Date().getDate() + 7)),
    },
  });

  // 4. Criar Missas
  await prisma.mass.createMany({
    data: [
      {
        date: new Date("2026-01-25T19:00:00Z"),
        maxServers: 4,
        scaleId: escala.id,
      },
      {
        date: new Date("2026-02-01T08:00:00Z"),
        maxServers: 2,
        scaleId: escala.id,
      },
    ],
  });

  console.log("✅ Dados inseridos com sucesso!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
