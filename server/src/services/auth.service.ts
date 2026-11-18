import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { prisma } from "../config/database";
import { env } from "../config/env";
import { checkAndAutoInactivateUser } from "./user.service";

const BCRYPT_HASH_REGEX = /^\$2[aby]\$\d{2}\$/;

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

    const isHashed = BCRYPT_HASH_REGEX.test(user.password);
    if (isHashed) {
        const passwordMatches = await bcrypt.compare(password, user.password);
        if (!passwordMatches) {
            return null;
        }
    } else {
        // Migração transparente de contas antigas em texto puro para bcrypt
        if (user.password !== password) {
            return null;
        }
        try {
            const hashedPassword = await bcrypt.hash(password, 10);
            await prisma.user.update({
                where: { id: user.id },
                data: { password: hashedPassword },
            });
        } catch (migrateErr: any) {
            console.error("[Auth] Falha ao migrar senha para bcrypt:", migrateErr?.message);
        }
    }

    if (user.role === "INATIVO") {
        throw new Error("USER_INATIVO");
    }

    // Verifica se passou de 3 meses (90 dias) sem nenhuma escala e inativa automaticamente
    const wasAutoInactivated = await checkAndAutoInactivateUser(user.id, user.role, user.email, undefined, user.name);
    if (wasAutoInactivated) {
        throw new Error("USER_INATIVO_3_MESES");
    }

    // Registrar log de acesso apenas para Servas (não Admin e não em_formacao)
    if (user.role !== "ADMIN" && user.role !== "em_formacao") {
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
        expiresIn: "180d",
    });
}
