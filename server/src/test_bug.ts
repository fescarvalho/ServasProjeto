import { prisma } from "./config/database";
import { toggleSignup } from "./services/signup.service";

async function run() {
    try {
        const users = await prisma.user.findMany({ take: 3 });
        if (users.length < 3) return;

        let mass = await prisma.mass.findFirst({
            where: { open: true },
        });

        if (!mass) {
            console.log("No open mass found");
            return;
        }

        // Clear deadline to avoid errors
        mass = await prisma.mass.update({
            where: { id: mass.id },
            data: { deadline: null }
        });

        console.log(`Testing with mass ${mass.id}`);
        
        await prisma.signup.deleteMany({ where: { massId: mass.id } });

        console.log(`Adding first user`);
        const res1 = await toggleSignup(users[0].id, mass.id);
        console.log("Result 1:", res1);

        console.log(`Adding second user`);
        const res2 = await toggleSignup(users[1].id, mass.id);
        console.log("Result 2:", res2);

        const updatedMass = await prisma.mass.findUnique({
             where: { id: mass.id },
             include: { signups: true }
        });
        console.log("Final signups count:", updatedMass?.signups.length);

    } catch (e: any) {
        console.error("Error occurred:", e.message || e);
    } finally {
        await prisma.$disconnect();
    }
}
run();
