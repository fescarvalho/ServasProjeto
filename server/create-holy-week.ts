import { prisma } from "./src/config/database";
import { parseDateTime } from "./src/utils/date.utils";
import process from "process";

const massesToCreate = [
    { date: "2026-03-29", time: "07:00", name: "Santuário" },
    { date: "2026-03-29", time: "19:00", name: "Santuário" },
    { date: "2026-03-30", time: "07:00", name: "Santuário" },
    { date: "2026-03-30", time: "19:00", name: "Querendo" },
    { date: "2026-03-31", time: "07:00", name: "Santuário" },
    { date: "2026-03-31", time: "19:00", name: "Ourânia" },
    { date: "2026-04-01", time: "07:00", name: "Santuário" },
    { date: "2026-04-01", time: "18:30", name: "Igreja Pessoal" },
    { date: "2026-04-02", time: "19:30", name: "Santuário" },
    { date: "2026-04-03", time: "15:00", name: "Santuário" },
    { date: "2026-04-04", time: "20:00", name: "Santuário" },
    { date: "2026-04-05", time: "07:00", name: "Santuário" },
    { date: "2026-04-05", time: "08:30", name: "S. Francisco" },
    { date: "2026-04-05", time: "19:00", name: "Santuário" },
];

async function main() {
    console.log(`Creating ${massesToCreate.length} masses...`);

    for (const data of massesToCreate) {
        const dateTime = parseDateTime(data.date, data.time);

        const existing = await prisma.mass.findFirst({
            where: {
                date: dateTime,
                name: data.name
            }
        });

        if (existing) {
            console.log(`Mass already exists: ${existing.id} - ${existing.date.toISOString()} - ${existing.name}`);
            continue;
        }

        const mass = await prisma.mass.create({
            data: {
                date: dateTime,
                name: data.name,
                maxServers: 4,
                published: false,
                open: false,
            }
        });

        console.log(`Created mass: ${mass.id} - ${mass.date.toISOString()} - ${mass.name}`);
    }

    console.log("Finished creating masses.");
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
