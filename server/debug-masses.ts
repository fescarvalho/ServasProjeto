
import { prisma } from "./src/config/database";
import { parseDateTime } from "./src/utils/date.utils";

async function main() {
    console.log("Current time:", new Date().toISOString());

    // 1. Fetch masses for today and yesterday/tomorrow to be sure
    const masses = await prisma.mass.findMany({
        where: {
            // Just get all recent masses to find "today's"
            date: {
                gte: new Date(new Date().setDate(new Date().getDate() - 2)),
            }
        },
        include: {
            signups: {
                include: {
                    user: true
                }
            }
        },
        orderBy: {
            date: 'asc'
        }
    });

    console.log(`Found ${masses.length} recent masses.`);

    for (const mass of masses) {
        console.log("---------------------------------------------------");
        console.log(`Mass ID: ${mass.id}`);
        console.log(`Date: ${mass.date.toISOString()}`);
        console.log(`Name: ${mass.name}`);
        console.log(`Deadline: ${mass.deadline ? mass.deadline.toISOString() : "None"}`);
        console.log(`Open: ${mass.open}`);
        console.log(`Published: ${mass.published}`);
        console.log(`MaxServers: ${mass.maxServers}`);
        console.log(`Signups: ${mass.signups.length}`);
        console.log(`Confirmed: ${mass.signups.filter(s => s.status === 'CONFIRMADO').length}`);
        console.log(`Reserves: ${mass.signups.filter(s => s.status === 'RESERVA').length}`);

        // Check if "today"
        const today = new Date();
        // Simple check if same day (ignoring timezone issues for a sec, just looking at relative)
        const isToday = mass.date.getDate() === today.getDate() &&
            mass.date.getMonth() === today.getMonth() &&
            mass.date.getFullYear() === today.getFullYear();

        if (isToday) {
            console.log(">>> THIS IS TODAY'S MASS <<<");
        }
    }
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
