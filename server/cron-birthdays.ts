import { PrismaClient } from "@prisma/client";
import webpush from "web-push";
import "dotenv/config";

const prisma = new PrismaClient();

const publicVapidKey = process.env.VAPID_PUBLIC_KEY || "";
const privateVapidKey = process.env.VAPID_PRIVATE_KEY || "";

if (!publicVapidKey || !privateVapidKey) {
    console.error("VAPID chaves não configuradas no .env");
    process.exit(1);
}

webpush.setVapidDetails(
    "mailto:contato@servas.com",
    publicVapidKey,
    privateVapidKey
);

async function checkBirthdays() {
    console.log("Iniciando verificação de aniversariantes do dia...");

    const today = new Date();
    const currentMonth = today.getMonth() + 1; // getMonth() returns 0-11
    const currentDay = today.getDate();

    // Find all users who have a birthday today
    // Prisma doesn't have a direct "extract month/day" function that works across all DBs easily in findMany,
    // so we'll fetch users with a birthDate and filter in memory since the user base is small.
    const users = await prisma.user.findMany({
        where: {
            birthDate: {
                not: null,
            },
        } as any,
        include: { pushSubscriptions: true } as any,
    });

    const birthdayGirls = users.filter((u: any) => {
        if (!u.birthDate) return false;
        return (
            u.birthDate.getUTCMonth() + 1 === currentMonth &&
            u.birthDate.getUTCDate() === currentDay
        );
    });

    if (birthdayGirls.length === 0) {
        console.log("Nenhuma serva faz aniversário hoje.");
        return;
    }

    console.log(`Encontradas ${birthdayGirls.length} aniversariantes hoje!`);

    let totalSent = 0;

    for (const user of birthdayGirls) {
        if (user.pushSubscriptions.length === 0) {
            console.log(`A serva ${user.name} faz aniversário mas não tem dispositivos para notificação.`);
            continue;
        }

        const userName = user.name.split(" ")[0];
        const payload = JSON.stringify({
            title: `Parabéns ${userName}! 🎉`,
            body: `Que a alegria de servir ao altar transborde em todos os dias da sua vida. Seu zelo e carinho nas missas no Santuário são um testemunho lindo de fé para todos nós. Que Deus te abençoe com muita saúde, paz e que sua caminhada seja sempre guiada pelo amor!`,
        });

        let sentForThisUser = 0;

        for (const sub of (user as any).pushSubscriptions) {
            if (sub.keys_p256dh && sub.keys_auth) {
                const pushSubscription = {
                    endpoint: sub.endpoint,
                    keys: {
                        p256dh: sub.keys_p256dh,
                        auth: sub.keys_auth,
                    },
                };

                try {
                    await webpush.sendNotification(pushSubscription, payload);
                    sentForThisUser++;
                    totalSent++;
                } catch (err: any) {
                    console.error("Erro ao enviar para o endpoint", sub.endpoint, err.statusCode);
                    if (err.statusCode === 410 || err.statusCode === 404) {
                        console.log("Removendo endpoint inválido/expirado do banco...");
                        await prisma.pushSubscription.delete({ where: { endpoint: sub.endpoint } });
                    }
                }
            }
        }

        console.log(`Notificações de aniversário enviadas para ${sentForThisUser} dispositivos de ${user.name}.`);
    }

    console.log(`\nResumo: Foram enviadas ${totalSent} notificações de aniversário no total.`);
}

checkBirthdays()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
