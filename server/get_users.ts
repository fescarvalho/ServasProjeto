import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const users = await prisma.user.findMany({
        where: { birthDate: { not: null } }
    });
    console.log(users.map(u => ({ name: u.name, birthDate: u.birthDate })));
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
