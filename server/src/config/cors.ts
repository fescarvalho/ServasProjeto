import { CorsOptions } from "cors";

const ALLOWED_ORIGINS = new Set([
    "https://servasdoaltar.vercel.app",
    "http://localhost:5173",
    "http://localhost:3000",
    "http://127.0.0.1:5173",
    ...(process.env.FRONTEND_URL ? [process.env.FRONTEND_URL.trim()] : []),
]);

export const corsConfig: CorsOptions = {
    origin: (origin, callback) => {
        // Permite requisições sem Origin (ex: crons/mobile nativo) ou de origens autorizadas
        if (!origin || ALLOWED_ORIGINS.has(origin) || origin.endsWith(".vercel.app") && origin.includes("servas")) {
            return callback(null, true);
        }
        return callback(new Error("Origem não permitida pelo CORS"));
    },
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization"],
};
