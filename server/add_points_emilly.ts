import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const emillyId = '288c2cb3-b97c-4b0c-b5ab-7a4ff068d681';
    
    // Create a mass on a Monday (gives 2 points)
    // 2026-05-11 is a Monday
    const mass = await prisma.mass.create({
        data: {
            date: new Date('2026-05-11T12:00:00Z'),
            name: 'Ajuste de Pontos (Emilly)',
            local: 'SISTEMA',
            published: false,
            open: false,
            maxServers: 1
        }
    });

    console.log('Mass created:', mass.id);

    // Add Emilly to this mass and mark as present
    const signup = await prisma.signup.create({
        data: {
            userId: emillyId,
            massId: mass.id,
            present: true,
            role: 'Auxiliar',
            status: 'CONFIRMADO'
        }
    });

    console.log('Signup created and marked present:', signup.id);
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
