export const ROLES = {
  CEREMONIAL: "Cerimoniária",
  BOOK_BEARER: "Librífera",
  AUXILIARY: "Auxiliar",
} as const;

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
