import jwt from "jsonwebtoken";
import { prisma } from "../config/database";
import { env } from "../config/env";

interface LoginData {
    email: string;
    password: string;
}

interface UserResponse {
    id: string;
    name: string;
    email: string;
    role: string;
    token: string;
}

/**
 * Authenticate user and generate JWT token
 */
export async function login(data: LoginData): Promise<UserResponse | null> {
    const { email, password } = data;

    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
        return null;
    }

    // TODO: Use bcrypt for password hashing in production
    if (user.password !== password) {
        return null;
    }

    // Registrar log de acesso apenas para Servas (não Admin)
    if (user.role !== "ADMIN") {
        try {
            await prisma.loginLog.create({ data: { userId: user.id } });
        } catch (logError: any) {
            console.error("[LoginLog] Falha ao registrar acesso:", logError?.message);
        }
    }

    const token = generateToken(user.id);

    return {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        token,
    };
}

/**
 * Generate JWT token for user
 */
export function generateToken(userId: string): string {
    return jwt.sign({ id: userId }, env.JWT_SECRET, {
        expiresIn: "7d",
    });
}
