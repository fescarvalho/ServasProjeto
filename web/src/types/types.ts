export const FUNCOES = ["Cerimoniária", "Librífera", "Auxiliar"];

export interface Signup {
  id: string;
  userId: string;
  massId: string;
  role: string | null;
  present: boolean;
  status: "CONFIRMADO" | "RESERVA";
  isSubstitution: boolean; // <-- Adicionar este
  substitutedName?: string; // <-- Adicionar este
  user: {
    name: string;
  };
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

export interface UserData {
  id: string;
  name: string;
  email: string;
  role: string;
}

export interface Mass {
  id: string;
  date: string;
  time?: string;
  name?: string;
  maxServers: number;
  deadline?: string;
  published: boolean;
  signups: Signup[];

  _count?: {
    signups: number;
  };
}

export interface Notice {
  id: string;
  text: string;
  active: boolean;
  createdAt: string;
}

export interface Mass {
  id: string;
  date: string;
  name?: string;
  deadline?: string;
  maxServers: number;
  published: boolean;
  open: boolean;
  signups: Signup[];
}
