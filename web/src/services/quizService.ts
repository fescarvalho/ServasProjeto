import api from "./api";
import { Quiz, QuizResult } from "../types/types";

export const quizService = {
  getAvailableQuizzes: async (): Promise<Quiz[]> => {
    const response = await api.get("/quizzes");
    return response.data;
  },

  submitQuiz: async (id: string, timeSpentSeconds: number, answers: Record<string, number>, responderName: string): Promise<QuizResult> => {
    const response = await api.post(`/quizzes/${id}/submit`, {
      timeSpentSeconds,
      answers,
      responderName,
    });
    return response.data;
  },
};
