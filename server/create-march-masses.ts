import { prisma } from "./src/config/database";
import { parseDateTime } from "./src/utils/date.utils";
import process from "process";

const massesToCreate = [
    { date: "2026-03-12", time: "19:00" },
    { date: "2026-03-15", time: "07:00" },
    { date: "2026-03-15", time: "10:15" },
    { date: "2026-03-15", time: "19:00" },
    { date: "2026-03-19", time: "19:00" },
    { date: "2026-03-22", time: "07:00" },
    { date: "2026-03-22", time: "10:15" },
    { date: "2026-03-22", time: "19:00" },
    { date: "2026-03-27", time: "19:00" },
    { date: "2026-03-29", time: "07:00" },
    { date: "2026-03-29", time: "19:00" },
];

async function main() {
    console.log(`Creating ${massesToCreate.length} masses...`);

    for (const data of massesToCreate) {
        const dateTime = parseDateTime(data.date, data.time);

        // Verifica se já existe para evitar duplicatas se o script for rodado novamente
        const existing = await prisma.mass.findFirst({
            where: {
                date: dateTime,
                name: "MATRIZ"
            }
        });

        if (existing) {
            console.log(`Mass already exists: ${existing.id} - ${existing.date.toISOString()} - ${existing.name}`);
            continue;
        }

        const mass = await prisma.mass.create({
            data: {
                date: dateTime,
                name: "MATRIZ",
                maxServers: 4,
                published: false,
                open: false,
            }
        });

        console.log(`Created mass: ${mass.id} - ${mass.date.toISOString()} - ${mass.name}`);
    }

    console.log("Finished creating masses.");

    // Final check
    const allRecent = await prisma.mass.findMany({
        where: {
            date: {
                gte: new Date("2026-03-09T00:00:00Z")
            },
            name: "MATRIZ"
        },
        orderBy: { date: 'asc' }
    });

    console.log("\nSummary of MATRIZ masses from 09/03/2026:");
    allRecent.forEach(m => {
        console.log(`${m.date.toISOString()} | Slots: ${m.maxServers} | Published: ${m.published} | Open: ${m.open}`);
    });
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
