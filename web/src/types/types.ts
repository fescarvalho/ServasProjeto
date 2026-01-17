export const FUNCOES = ["Cerimoniária", "Librífera", "Auxiliar"];

export interface Signup {
  id: string;
  userId: string;
  massId: string;
  role?: string; // Pode ser opcional se nem sempre tiver função definida
  user: {
    name: string;
  };
}

export interface UserData {
  id: string;
  name: string;
  email: string;
  role: string; // <--- ADICIONE ESTA LINHA OBRIGATÓRIA
}

export interface Mass {
  id: string;
  date: string;
  time?: string;
  name?: string;
  maxServers: number;
  deadline?: string;
  signups: Signup[];
}
