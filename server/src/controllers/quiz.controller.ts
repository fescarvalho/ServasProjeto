import { Request, Response } from "express";
import { prisma } from "../config/database";

// Pegar todos os quizzes que o usuário pode responder ou já respondeu
export async function getAvailableQuizzes(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.userId;
    if (!userId) {
      res.status(401).json({ error: "Não autorizado" });
      return;
    }

    // Busca quizzes ativos
    const quizzes = await prisma.quiz.findMany({
      where: { isActive: true },
      orderBy: { createdAt: "desc" },
    });

    // Busca resultados do usuário
    const results = await prisma.quizResult.findMany({
      where: { userId },
    });

    const response = quizzes.map((quiz) => {
      const userResult = results.find((r) => r.quizId === quiz.id);

      return {
        id: quiz.id,
        title: quiz.title,
        description: quiz.description,
        timeLimitMinutes: quiz.timeLimitMinutes,
        questions: quiz.questions, 
        isAnswered: !!userResult,
        score: userResult ? userResult.totalScore : undefined,
        answers: userResult ? userResult.answers : undefined,
      };
    });

    res.json(response);
  } catch (error) {
    console.error("Erro ao buscar quizzes:", error);
    res.status(500).json({ error: "Erro interno ao buscar quizzes" });
  }
}

export async function submitQuizResult(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.userId;
    if (!userId) {
      res.status(401).json({ error: "Não autorizado" });
      return;
    }

    const id = req.params.id as string;
    const { timeSpentSeconds, answers } = req.body; 

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      res.status(404).json({ error: "Usuário não encontrado." });
      return;
    }

    const responderName = user.name;

    const existingResult = await prisma.quizResult.findFirst({
      where: { quizId: id, userId }
    });

    if (existingResult) {
      res.status(400).json({ error: "Você já respondeu a este quiz." });
      return;
    }

    const quiz = await prisma.quiz.findUnique({
      where: { id },
    });

    if (!quiz) {
      res.status(404).json({ error: "Quiz não encontrado." });
      return;
    }

    // Calcular pontuação
    let totalScore = 0;
    const questions = quiz.questions as any[];

    if (Array.isArray(questions)) {
      questions.forEach((q, index) => {
        const userAnswerIndex = answers[index.toString()];
        
        // Verifica se a resposta foi fornecida e se está correta
        if (userAnswerIndex !== undefined && userAnswerIndex !== null) {
          const selectedOption = q.options[userAnswerIndex];
          if (selectedOption && selectedOption.isCorrect) {
            totalScore += 1; // 1 ponto por acerto
          }
        }
      });
    }

    // Salvar resultado
    const result = await prisma.quizResult.create({
      data: {
        quizId: id,
        userId,
        responderName,
        totalScore,
        timeSpentSeconds,
        answers: answers || {},
      },
    });

    res.json(result);
  } catch (error) {
    console.error("Erro ao submeter quiz:", error);
    res.status(500).json({ error: "Erro interno ao salvar resultado do quiz" });
  }
}
