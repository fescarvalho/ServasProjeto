export const ROLES = {
  CEREMONIAL: "Cerimoniária",
  BOOK_BEARER: "Librífera",
  THURIFER: "Turiferário",
  BOAT_BEARER: "Naveteiro",
  AUXILIARY: "Auxiliar",
  LAVA_PES: "Lava-pés",
  LEITURAS: "Leituras",
  MATRACA: "Matraca",
} as const;

export const ROLE_LABELS_NEUTRAL: Record<string, string> = {
  "Cerimoniária": "Cerimoniário(a)",
  "Cerimoniário": "Cerimoniário(a)",
  "Cerimoniário(a)": "Cerimoniário(a)",
  "Librífera": "Librífero(a)",
  "Librífero": "Librífero(a)",
  "Librífero(a)": "Librífero(a)",
  "Turiferário": "Turiferário",
  "Naveteiro": "Naveteiro(a)",
  "Naveteira": "Naveteiro(a)",
  "Naveteiro(a)": "Naveteiro(a)",
  "Auxiliar": "Auxiliar",
  "Lava-pés": "Lava-pés",
  "Leituras": "Leituras",
  "Matraca": "Matraca",
};

const ROLE_LABELS_MASC: Record<string, string> = {
  "Cerimoniária": "Cerimoniário",
  "Cerimoniário": "Cerimoniário",
  "Cerimoniário(a)": "Cerimoniário",
  "Librífera": "Librífero",
  "Librífero": "Librífero",
  "Librífero(a)": "Librífero",
  "Turiferário": "Turiferário",
  "Naveteiro": "Naveteiro",
  "Naveteira": "Naveteiro",
  "Naveteiro(a)": "Naveteiro",
};

const ROLE_LABELS_FEM: Record<string, string> = {
  "Cerimoniária": "Cerimoniária",
  "Cerimoniário": "Cerimoniária",
  "Cerimoniário(a)": "Cerimoniária",
  "Librífera": "Librífera",
  "Librífero": "Librífera",
  "Librífero(a)": "Librífera",
  "Turiferário": "Turiferário",
  "Naveteiro": "Naveteira",
  "Naveteira": "Naveteira",
  "Naveteiro(a)": "Naveteira",
};

// Cache em memória dos gêneros cadastrados pelo Admin
let userGenderMap: Record<string, "M" | "F"> = {};

export function setGlobalUserGenders(map: Record<string, "M" | "F">) {
  userGenderMap = { ...userGenderMap, ...map };
}

export function getUserGender(userId?: string | null, userName?: string | null): "M" | "F" | null {
  if (userId && userGenderMap[userId]) {
    return userGenderMap[userId];
  }
  if (!userName) return null;
  return inferGenderFromName(userName);
}

/**
 * Heurística inteligente para nomes brasileiros caso o sexo não tenha sido definido manualmente no painel
 */
export function inferGenderFromName(fullName: string): "M" | "F" {
  const first = fullName
    .trim()
    .split(/\s+/)[0]
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  if (!first) return "F";

  const maleExceptions = new Set([
    "luca", "lucas", "matheus", "mateus", "nicolas", "nikolas", "jonas", "elias",
    "isaias", "messias", "tobias", "josue", "noa", "noah", "davi", "levi", "yuri",
    "kaua", "caua", "lucca", "gianluca", "jorge", "felipe", "guilherme", "henrique",
    "pedro", "joao", "gabriel", "miguel", "rafael", "daniel", "samuel", "israel",
    "emanuel", "vitor", "victor", "arthur", "artur", "heitor", "igor",
    "caio", "theo", "teo", "enzo", "lorenzo", "bernardo", "leonardo", "eduardo",
    "ricardo", "fernando", "breno", "bruno", "diego", "diogo", "thiago", "tiago",
    "rodrigo", "gustavo", "otavio", "flavio", "julio", "marcio", "sergio", "fabricio",
    "mauricio", "vinicius", "luiz", "luis", "carlos", "marcos", "paulo", "andrey",
    "andre", "alexandre", "antonio", "francisco", "jose", "benicio", "murilo", "danilo"
  ]);

  const femaleExceptions = new Set([
    "alice", "beatriz", "liz", "isis", "iris", "ester", "esther", "raquel", "ruth",
    "rute", "noemi", "nicole", "simone", "ivone", "elen", "hellen", "suelen", "karen",
    "carmen", "yasmin", "iasmim", "miriam", "lilian", "vivian", "ingrid", "astrid",
    "malu", "manu", "gabi", "fabi", "dani", "mari", "tati", "camille", "jamile",
    "michele", "michelle", "gabriele", "gabrielle", "isabele", "isabelle", "caroline",
    "aline", "elaine", "jaqueline", "franciele", "graziele", "mariele", "aniele"
  ]);

  if (maleExceptions.has(first)) return "M";
  if (femaleExceptions.has(first)) return "F";

  if (first.endsWith("a") || first.endsWith("ane") || first.endsWith("elle") || first.endsWith("ele")) {
    return "F";
  }
  if (first.endsWith("o") || first.endsWith("os") || first.endsWith("or") || first.endsWith("el")) {
    return "M";
  }

  return "F";
}

/**
 * Formata o nome da função de acordo com o gênero do(a) servo(a) quando informado,
 * ou retorna a forma inclusiva padrão (ex: Cerimoniário(a)).
 */
export function formatRole(
  role?: string | null,
  genderOrName?: "M" | "F" | string | null,
  userId?: string | null
): string {
  if (!role) return "Auxiliar";

  let resolvedGender: "M" | "F" | null = null;
  if (userId && userGenderMap[userId]) {
    resolvedGender = userGenderMap[userId];
  } else if (genderOrName === "M" || genderOrName === "F") {
    resolvedGender = genderOrName;
  } else if (typeof genderOrName === "string" && genderOrName.trim().length > 0) {
    resolvedGender = inferGenderFromName(genderOrName);
  }

  if (resolvedGender === "M" && ROLE_LABELS_MASC[role]) {
    return ROLE_LABELS_MASC[role];
  }
  if (resolvedGender === "F" && ROLE_LABELS_FEM[role]) {
    return ROLE_LABELS_FEM[role];
  }

  return ROLE_LABELS_NEUTRAL[role] || role;
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
