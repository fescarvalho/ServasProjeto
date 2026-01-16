export interface Signup {
    id: string;
    userId: string;
    role: string | null;
    user: { name: string };
  }
  
  export interface Mass {
    id: string;
    date: string;
    name?: string;
    deadline?: string;
    maxServers: number;
    _count: { signups: number };
    signups: Signup[];
  }
  
  export interface UserData {
    id: string;
    name: string;
    email: string;
  }
  
  export const FUNCOES = ["Cerimoniária", "Librífera", "Auxiliar"];