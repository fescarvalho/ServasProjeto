import dotenv from "dotenv";

dotenv.config();

interface EnvConfig {
    PORT: number;
    DATABASE_URL: string;
    JWT_SECRET: string;
    NODE_ENV: string;
}

function validateEnv(): EnvConfig {
    const requiredEnvVars = ["DATABASE_URL", "JWT_SECRET"];

    for (const envVar of requiredEnvVars) {
        if (!process.env[envVar]) {
            throw new Error(`Missing required environment variable: ${envVar}`);
        }
    }

    return {
        PORT: Number(process.env.PORT) || 3001,
        DATABASE_URL: process.env.DATABASE_URL!,
        JWT_SECRET: process.env.JWT_SECRET!,
        NODE_ENV: process.env.NODE_ENV || "development",
    };
}

export const env = validateEnv();
