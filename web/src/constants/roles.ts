export const ROLES = {
  CEREMONIAL: "Cerimoniária",
  BOOK_BEARER: "Librífera",
  AUXILIARY: "Auxiliar",
  LAVA_PES: "Lava-pés",
  LEITURAS: "Leituras",
  MATRACA: "Matraca",
} as const;

export const ROLE_LABELS: Record<string, string> = {
  "Cerimoniária": "Cerimoniário(a)",
  "Cerimoniário": "Cerimoniário(a)",
  "Cerimoniário(a)": "Cerimoniário(a)",
  "Librífera": "Librífero(a)",
  "Librífero": "Librífero(a)",
  "Librífero(a)": "Librífero(a)",
  "Auxiliar": "Auxiliar",
  "Lava-pés": "Lava-pés",
  "Leituras": "Leituras",
  "Matraca": "Matraca",
};

export function formatRole(role?: string | null): string {
  if (!role) return "Auxiliar";
  return ROLE_LABELS[role] || role;
}

export const USER_ROLES = {
  ADMIN: "ADMIN",
  USER: "USER",
} as const;

export const SIGNUP_STATUS = {
  CONFIRMED: "CONFIRMADO",
  RESERVE: "RESERVA",
} as const;

export type Role = typeof ROLES[keyof typeof ROLES];
export type UserRole = typeof USER_ROLES[keyof typeof USER_ROLES];
export type SignupStatus = typeof SIGNUP_STATUS[keyof typeof SIGNUP_STATUS];
