import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Iniciando semeio de dados (Seed)...')

  // Limpa dados antigos para evitar duplicidade
  await prisma.signup.deleteMany()
  await prisma.mass.deleteMany()
  await prisma.scale.deleteMany()
  await prisma.user.deleteMany()

  // 1. Criar uma serva de teste (você pode usar para logar depois)
  const serva = await prisma.user.create({
    data: {
      name: 'Serva Teste',
      email: 'teste@serva.com',
      password: '123', // Em produção, usaremos criptografia
    },
  })

  // 2. Criar uma Escala para o mês
  const escala = await prisma.scale.create({
    data: {
      name: 'Escala de Janeiro',
      openDate: new Date(),
      closeDate: new Date(new Date().setDate(new Date().getDate() + 7)), // Fecha em 7 dias
    },
  })

  // 3. Criar Missas de exemplo
  await prisma.mass.createMany({
    data: [
      {
        date: new Date('2026-01-25T19:00:00Z'),
        maxServers: 4,
        scaleId: escala.id,
      },
      {
        date: new Date('2026-02-01T08:00:00Z'),
        maxServers: 2,
        scaleId: escala.id,
      },
    ],
  })

  console.log('✅ Dados inseridos com sucesso!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })