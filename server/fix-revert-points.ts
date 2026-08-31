import { PrismaClient } from '@prisma/client';
import 'dotenv/config';

const prisma = new PrismaClient();

async function main() {
    console.log('=== REVERTENDO CORREÇÕES E APLICANDO REGRA: PADRÃO = 1 PT ===\n');

    const startDate = new Date('2026-08-01T00:00:00Z');
    const endDate = new Date('2026-08-31T23:59:59Z');

    const masses = await prisma.mass.findMany({
        where: { date: { gte: startDate, lte: endDate } },
        orderBy: { date: 'asc' }
    });

    for (const mass of masses) {
        const brazilDate = new Date(mass.date.toLocaleString("en-US", { timeZone: "America/Sao_Paulo" }));
        const monthDay = brazilDate.getDate();
        const day = brazilDate.getDay();
        const hour = brazilDate.getHours();
        const dateStr = mass.date.toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" });

        // Reverter 09/08 Dom 10h: 2 → 1
        if (monthDay === 9 && day === 0 && hour === 10 && mass.points === 2) {
            console.log(`⏪ Revertendo: ${dateStr} "${mass.name}" — 2 → 1 pt`);
            await prisma.mass.update({ where: { id: mass.id }, data: { points: 1 } });
        }

        // Reverter 16/08 Dom 10h: 2 → 1
        if (monthDay === 16 && day === 0 && hour === 10 && mass.points === 2) {
            console.log(`⏪ Revertendo: ${dateStr} "${mass.name}" — 2 → 1 pt`);
            await prisma.mass.update({ where: { id: mass.id }, data: { points: 1 } });
        }

        // Reverter 27/08 Qui 19h: 2 → 1
        if (monthDay === 27 && day === 4 && hour === 19 && mass.points === 2) {
            console.log(`⏪ Revertendo: ${dateStr} "${mass.name}" — 2 → 1 pt`);
            await prisma.mass.update({ where: { id: mass.id }, data: { points: 1 } });
        }
    }

    // Verificação final — ranking com regra padrão = 1
    console.log('\n=== RANKING AGOSTO 2026 (PADRÃO = 1 PT) ===\n');

    const updatedMasses = await prisma.mass.findMany({
        where: { date: { gte: startDate, lte: endDate } },
        include: { signups: { include: { user: true } } },
        orderBy: { date: 'asc' }
    });

    const servaPoints: Record<string, { name: string; totalPoints: number; presences: number }> = {};

    updatedMasses.forEach(mass => {
        // Regra: manual se existir, senão padrão = 1
        const points = (mass.points !== null && mass.points !== undefined) ? mass.points : 1;
        mass.signups.forEach(signup => {
            if (signup.present) {
                const userId = signup.userId;
                if (!servaPoints[userId]) {
                    servaPoints[userId] = { name: signup.user?.name || '?', totalPoints: 0, presences: 0 };
                }
                servaPoints[userId].totalPoints += points;
                servaPoints[userId].presences += 1;
            }
        });
    });

    const ranking = Object.values(servaPoints)
        .sort((a, b) => {
            if (b.totalPoints !== a.totalPoints) return b.totalPoints - a.totalPoints;
            if (b.presences !== a.presences) return b.presences - a.presences;
            return a.name.localeCompare(b.name);
        });

    ranking.forEach((s, i) => {
        console.log(`  ${i + 1}. ${s.name} — ${s.totalPoints} pts (${s.presences} presenças)`);
    });
}

main()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect());
