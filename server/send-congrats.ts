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

async function main() {
    const query = process.argv[2];

    if (!query) {
        console.error("Por favor, forneça o e-mail ou nome da serva.");
        console.log("Uso: npx tsx send-congrats.ts <email ou nome>");
        process.exit(1);
    }

    // Find users matching email or name
    const users = await prisma.user.findMany({
        where: {
            OR: [
                { email: { contains: query, mode: "insensitive" } },
                { name: { contains: query, mode: "insensitive" } },
            ],
        },
        include: { pushSubscriptions: true },
    });

    if (users.length === 0) {
        console.log(`Nenhuma serva encontrada com o termo: "${query}"`);
        return;
    }

    if (users.length > 1) {
        console.log(`Foram encontradas ${users.length} servas. Por favor, seja mais específico (use o e-mail):`);
        users.forEach(u => console.log(` - ${u.name} (${u.email})`));
        return;
    }

    const user = users[0];

    if (user.pushSubscriptions.length === 0) {
        console.log(`A serva ${user.name} (${user.email}) não possui dispositivos registrados para receber notificações.`);
        return;
    }

    const userName = user.name.split(" ")[0];
    const payload = JSON.stringify({
        title: `Parabéns ${userName}! 🎉`,
        body: `Que a alegria de servir ao altar transborde em todos os dias da sua vida. Seu zelo e carinho nas missas no Santuário são um testemunho lindo de fé para todos nós. Que Deus te abençoe com muita saúde, paz e que sua caminhada seja sempre guiada pelo amor!`,
    });

    let sentCount = 0;

    for (const sub of user.pushSubscriptions) {
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
                console.log(`Notificação enviada com sucesso para um dispositivo de ${user.name}.`);
                sentCount++;
            } catch (err: any) {
                console.error("Erro ao enviar para o endpoint", sub.endpoint, err.statusCode);
                if (err.statusCode === 410 || err.statusCode === 404) {
                    console.log("Removendo endpoint inválido/expirado do banco...");
                    await prisma.pushSubscription.delete({ where: { endpoint: sub.endpoint } });
                }
            }
        }
    }

    console.log(`\nResumo: Foram enviadas ${sentCount} notificações para ${user.name}.`);
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
