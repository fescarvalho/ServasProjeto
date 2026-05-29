import { PrismaClient } from "@prisma/client";
import process from "process";

const prisma = new PrismaClient();

async function main() {
  const quiz = await prisma.quiz.create({
    data: {
      title: "Quiz de Formação Inicial",
      description: "Teste seus conhecimentos sobre o Altar e os objetos sagrados.",
      timeLimitMinutes: 1, // 1 minuto para testes rápidos, como pedido no plano
      isActive: true,
      questions: [
        {
          id: "q1",
          text: "Qual destas peças de linho é usada para purificar os vasos sagrados?",
          options: [
            { text: "Sanguíneo", isCorrect: true },
            { text: "Corporal", isCorrect: false },
            { text: "Manustérgio", isCorrect: false },
            { text: "Pala", isCorrect: false },
          ]
        },
        {
          id: "q2",
          text: "Onde o Santíssimo Sacramento é guardado?",
          options: [
            { text: "Credência", isCorrect: false },
            { text: "Presbitério", isCorrect: false },
            { text: "Sacrário", isCorrect: true },
            { text: "Ambão", isCorrect: false },
          ]
        },
        {
          id: "q3",
          text: "Qual é o tempo litúrgico que antecede o Natal?",
          options: [
            { text: "Quaresma", isCorrect: false },
            { text: "Advento", isCorrect: true },
            { text: "Tempo Comum", isCorrect: false },
            { text: "Páscoa", isCorrect: false },
          ]
        }
      ]
    }
  });

  console.log("Quiz criado com sucesso:", quiz.id);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
