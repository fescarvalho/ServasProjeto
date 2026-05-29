import api from "./api";
import { Quiz } from "../types/types";

export const adminQuizService = {
  getAllQuizzes: async (): Promise<Quiz[]> => {
    const response = await api.get("/admin/quizzes");
    return response.data;
  },

  createQuiz: async (quizData: Partial<Quiz>): Promise<Quiz> => {
    const response = await api.post("/admin/quizzes", quizData);
    return response.data;
  },

  deleteQuiz: async (id: string): Promise<void> => {
    await api.delete(`/admin/quizzes/${id}`);
  },

  deleteQuizResult: async (id: string): Promise<void> => {
    await api.delete(`/admin/quiz-results/${id}`);
  },
};
