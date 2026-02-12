export const SIGNUP_STATUS = {
    CONFIRMED: "CONFIRMADO",
    RESERVE: "RESERVA",
} as const;

export const USER_ROLES = {
    ADMIN: "ADMIN",
    USER: "USER",
} as const;

export const HTTP_STATUS = {
    OK: 200,
    CREATED: 201,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    NOT_FOUND: 404,
    INTERNAL_SERVER_ERROR: 500,
} as const;
