export const APP_CONFIG = {
    DEFAULT_MAX_SERVERS: 4,
    STORAGE_KEY: "servas_user",
    AUTO_SCROLL_DELAY: 300,
    TIMEZONE: "America/Sao_Paulo",
} as const;

export const API_CONFIG = {
    BASE_URL: (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1")
        ? "http://localhost:3001"
        : (import.meta.env.VITE_API_URL || "http://localhost:3001"),
} as const;
