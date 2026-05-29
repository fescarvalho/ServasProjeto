import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const mariaId = 'd34e4757-870b-401c-bed6-3d12d29398a5';
    
    // Create a mass on a Monday (gives 2 points)
    // 2026-05-12 is a Tuesday (also 2 points)
    const mass = await prisma.mass.create({
        data: {
            date: new Date('2026-05-12T12:00:00Z'),
            name: 'Ajuste de Pontos (Maria Eduarda)',
            local: 'SISTEMA',
            published: false,
            open: false,
            maxServers: 1
        }
    });

    console.log('Mass created:', mass.id);

    // Add Maria Eduarda to this mass and mark as present
    const signup = await prisma.signup.create({
        data: {
            userId: mariaId,
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
