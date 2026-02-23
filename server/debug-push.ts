import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function check() {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const startOfTomorrow = new Date(tomorrow.setHours(0, 0, 0, 0));
    const endOfTomorrow = new Date(tomorrow.setHours(23, 59, 59, 999));

    console.log("Looking for masses between:", startOfTomorrow, "and", endOfTomorrow);

    const massesTomorrow = await prisma.mass.findMany({
        where: {
            date: {
                gte: startOfTomorrow,
                lte: endOfTomorrow,
            },
        },
        include: {
            signups: {
                include: {
                    user: {
                        include: { pushSubscriptions: true },
                    },
                },
            },
        },
    });

    console.log(`Found ${massesTomorrow.length} masses for tomorrow.`);

    for (const m of massesTomorrow) {
        console.log(`\nMass: ${m.name || 'Unnamed'} at ${m.date}`);
        console.log(`Total Signups: ${m.signups.length}`);
        for (const s of m.signups) {
            console.log(`  - User: ${s.user.name} | Status: ${s.status}`);
            console.log(`    Push Subscriptions: ${s.user.pushSubscriptions.length}`);
            s.user.pushSubscriptions.forEach(sub => {
                console.log(`      Endpoint: ${sub.endpoint.substring(0, 40)}...`);
            });
        }
    }
}

check().catch(console.error).finally(() => prisma.$disconnect());
