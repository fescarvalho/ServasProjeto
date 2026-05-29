import { Request, Response } from "express";
import { prisma } from "../config/database";
import { success, error, badRequest, unauthorized } from "../utils/response.utils";

export async function getAllQuizzesAdmin(req: Request, res: Response) {
  try {
    const quizzes = await prisma.quiz.findMany({
      include: {
        results: {
          orderBy: { createdAt: "desc" }
        }
      },
      orderBy: { createdAt: "desc" }
    });

    return success(res, quizzes);
  } catch (err) {
    console.error("Error fetching quizzes for admin:", err);
    return error(res, "Erro ao buscar quizzes.");
  }
}

export async function createQuizAdmin(req: Request, res: Response) {
  try {
    const { title, description, timeLimitMinutes, isActive, questions } = req.body;

    if (!title || !questions || !Array.isArray(questions) || questions.length === 0) {
      return badRequest(res, "Título e perguntas são obrigatórios.");
    }

    const quiz = await prisma.quiz.create({
      data: {
        title,
        description: description || "",
        timeLimitMinutes: Number(timeLimitMinutes) || 10,
        isActive: isActive !== undefined ? isActive : true,
        questions,
      }
    });

    return success(res, quiz, 201);
  } catch (err) {
    console.error("Error creating quiz:", err);
    return error(res, "Erro ao criar quiz.");
  }
}

export async function deleteQuizAdmin(req: Request, res: Response) {
  try {
    const id = req.params.id as string;

    await prisma.quiz.delete({
      where: { id }
    });

    return success(res, { message: "Quiz removido com sucesso." });
  } catch (err) {
    console.error("Error deleting quiz:", err);
    return error(res, "Erro ao excluir quiz.");
  }
}
