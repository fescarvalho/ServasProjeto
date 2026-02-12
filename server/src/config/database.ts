import { PrismaClient } from "@prisma/client";

/**
 * Singleton instance of Prisma Client
 * Prevents multiple instances in development with hot reload
 */
class Database {
    private static instance: PrismaClient;

    static getInstance(): PrismaClient {
        if (!Database.instance) {
            Database.instance = new PrismaClient();
        }
        return Database.instance;
    }

    static async disconnect(): Promise<void> {
        if (Database.instance) {
            await Database.instance.$disconnect();
        }
    }
}

export const prisma = Database.getInstance();
export default Database;
