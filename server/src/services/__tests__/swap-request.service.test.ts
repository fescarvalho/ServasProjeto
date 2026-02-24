import { prismaMock } from "../../__mocks__/prismaMock";
import {
    createSwapRequest,
    acceptSwapRequest,
    cancelSwapRequest,
} from "../swap-request.service";
import * as signupService from "../signup.service";

// Mock the external service call
jest.mock("../signup.service", () => ({
    swapSignup: jest.fn(),
}));

import { describe, beforeEach, it, expect, jest } from "@jest/globals";

describe("Swap Request Service", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe("createSwapRequest", () => {
        it("should successfully create a swap request", async () => {
            // 1. Arrange
            const mockSignup = {
                id: "signup-123",
                userId: "user-requester",
                massId: "mass-123",
                createdAt: new Date(),
                updatedAt: new Date(),
                mass: {
                    id: "mass-123",
                    date: new Date(Date.now() + 86400000), // Date in the future (1 day)
                },
            };

            prismaMock.signup.findUnique.mockResolvedValue(mockSignup as any);
            prismaMock.swapRequest.findUnique.mockResolvedValue(null); // No existing pending request

            const expectedCreatedSwap = {
                id: "swap-123",
                signupId: "signup-123",
                requesterId: "user-requester",
                status: "PENDING",
                createdAt: new Date(),
                updatedAt: new Date(),
            };
            prismaMock.swapRequest.create.mockResolvedValue(expectedCreatedSwap as any);

            // 2. Act
            const result = await createSwapRequest("signup-123", "user-requester");

            // 3. Assert
            expect(prismaMock.signup.findUnique).toHaveBeenCalledWith({
                where: { id: "signup-123" },
                include: { mass: true },
            });
            expect(prismaMock.swapRequest.create).toHaveBeenCalledWith({
                data: { signupId: "signup-123", requesterId: "user-requester", status: "PENDING" },
            });
            expect(result).toEqual(expectedCreatedSwap);
        });

        it("should throw error if signup does not exist", async () => {
            prismaMock.signup.findUnique.mockResolvedValue(null);

            await expect(createSwapRequest("non-existent", "user-1")).rejects.toThrow(
                "Inscrição não encontrada."
            );
        });

        it("should throw error if user is not the signup owner", async () => {
            const mockSignup = { userId: "user-owner", mass: { date: new Date() } };
            prismaMock.signup.findUnique.mockResolvedValue(mockSignup as any);

            await expect(createSwapRequest("signup-1", "user-hacker")).rejects.toThrow(
                "Você não pode pedir substituição por outra serva."
            );
        });

        it("should throw error if mass has already happened", async () => {
            const pastDate = new Date(Date.now() - 86400000); // 1 day ago
            const mockSignup = { userId: "user-owner", mass: { date: pastDate } };
            prismaMock.signup.findUnique.mockResolvedValue(mockSignup as any);

            await expect(createSwapRequest("signup-1", "user-owner")).rejects.toThrow(
                "Não é possível pedir substituição para missas já realizadas."
            );
        });

        it("should throw error if a PENDING request already exists", async () => {
            const futureDate = new Date(Date.now() + 86400000);
            const mockSignup = { userId: "user-owner", mass: { date: futureDate } };
            prismaMock.signup.findUnique.mockResolvedValue(mockSignup as any);

            prismaMock.swapRequest.findUnique.mockResolvedValue({ status: "PENDING" } as any);

            await expect(createSwapRequest("signup-1", "user-owner")).rejects.toThrow(
                "Já existe um pedido de substituição em aberto para esta missa."
            );
        });
    });

    describe("acceptSwapRequest", () => {
        it("should successfully accept a swap request", async () => {
            const mockSwapReq = {
                id: "swap-1",
                status: "PENDING",
                requesterId: "user-1",
                signupId: "signup-1",
                signup: { massId: "mass-1" },
            };

            prismaMock.swapRequest.findUnique.mockResolvedValue(mockSwapReq as any);
            prismaMock.signup.findUnique.mockResolvedValue(null); // Acceptor isn't in this mass yet

            const result = await acceptSwapRequest("swap-1", "user-acceptor");

            expect(prismaMock.swapRequest.delete).toHaveBeenCalledWith({
                where: { id: "swap-1" },
            });
            expect(signupService.swapSignup).toHaveBeenCalledWith("signup-1", "user-acceptor");
            expect(result.message).toBe("Substituição realizada com sucesso!");
        });

        it("should throw error if acceptor is the requester", async () => {
            const mockSwapReq = {
                id: "swap-1",
                status: "PENDING",
                requesterId: "user-1", // Same as acceptor
            };

            prismaMock.swapRequest.findUnique.mockResolvedValue(mockSwapReq as any);

            await expect(acceptSwapRequest("swap-1", "user-1")).rejects.toThrow(
                "Você não pode aceitar seu próprio pedido de substituição."
            );
        });

        it("should throw error if acceptor is already in the mass", async () => {
            const mockSwapReq = {
                id: "swap-1",
                status: "PENDING",
                requesterId: "user-1",
                signup: { massId: "mass-1" },
            };

            prismaMock.swapRequest.findUnique.mockResolvedValue(mockSwapReq as any);

            // Simulate that acceptor already has a signup for this mass
            prismaMock.signup.findUnique.mockResolvedValue({ id: "existing-signup" } as any);

            await expect(acceptSwapRequest("swap-1", "user-acceptor")).rejects.toThrow(
                "Você já está inscrita nesta missa."
            );
        });
    });

    describe("cancelSwapRequest", () => {
        it("should allow requester to cancel their own request", async () => {
            const mockSwapReq = { id: "swap-1", status: "PENDING", requesterId: "user-1" };
            prismaMock.swapRequest.findUnique.mockResolvedValue(mockSwapReq as any);

            const mockUser = { id: "user-1", role: "USER" };
            prismaMock.user.findUnique.mockResolvedValue(mockUser as any);

            await cancelSwapRequest("swap-1", "user-1");

            expect(prismaMock.swapRequest.update).toHaveBeenCalledWith({
                where: { id: "swap-1" },
                data: { status: "CANCELLED" },
            });
        });

        it("should allow ADMIN to cancel someone else's request", async () => {
            const mockSwapReq = { id: "swap-1", status: "PENDING", requesterId: "user-1" };
            prismaMock.swapRequest.findUnique.mockResolvedValue(mockSwapReq as any);

            const mockAdmin = { id: "admin-1", role: "ADMIN" };
            prismaMock.user.findUnique.mockResolvedValue(mockAdmin as any);

            await cancelSwapRequest("swap-1", "admin-1");

            expect(prismaMock.swapRequest.update).toHaveBeenCalledWith({
                where: { id: "swap-1" },
                data: { status: "CANCELLED" },
            });
        });

        it("should throw error if regular user tries to cancel someone else's request", async () => {
            const mockSwapReq = { id: "swap-1", status: "PENDING", requesterId: "user-1" };
            prismaMock.swapRequest.findUnique.mockResolvedValue(mockSwapReq as any);

            const mockUser = { id: "user-attacker", role: "USER" };
            prismaMock.user.findUnique.mockResolvedValue(mockUser as any);

            await expect(cancelSwapRequest("swap-1", "user-attacker")).rejects.toThrow(
                "Você não tem permissão para cancelar este pedido."
            );
        });
    });
});
