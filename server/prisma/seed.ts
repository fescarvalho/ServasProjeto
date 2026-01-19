import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Iniciando o seed...");

  // 1. Criar Usuário Admin
  const adminEmail = "coordenador@serva.com";

  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      name: "Coordenador",
      email: adminEmail,
      role: "ADMIN",
      password: "123456", // <--- ADICIONADO (Obrigatório)
    },
  });
  console.log(`👤 Admin garantido: ${admin.email}`);

  // 2. Criar Usuário Serva
  const userEmail = "maria@serva.com";
  await prisma.user.upsert({
    where: { email: userEmail },
    update: {},
    create: {
      name: "Maria Serva",
      email: userEmail,
      role: "USER",
      password: "123456", // <--- ADICIONADO (Obrigatório)
    },
  });
  // 3. Criar Missas (Sem tabela Scale)
  const today = new Date();

  // Missa 1: Próximo Domingo (Pública)
  const date1 = new Date(today);
  date1.setDate(today.getDate() + (7 - today.getDay()));
  date1.setHours(10, 0, 0, 0);

  await prisma.mass.create({
    data: {
      date: date1,
      name: "Missa Dominical",
      maxServers: 4,
      published: true,
    },
  });

  // Missa 2: Daqui a 2 semanas (Rascunho)
  const date2 = new Date(today);
  date2.setDate(today.getDate() + 14);
  date2.setHours(19, 0, 0, 0);

  await prisma.mass.create({
    data: {
      date: date2,
      name: "Missa Especial",
      maxServers: 6,
      published: false,
    },
  });

  console.log("✅ Missas criadas com sucesso!");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
