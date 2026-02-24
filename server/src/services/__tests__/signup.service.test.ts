import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import { prismaMock } from "../../__mocks__/prismaMock";
import { SIGNUP_STATUS } from "../../constants";
import {
    toggleSignup,
    removeSignup,
    promoteNextInLine,
    swapSignup
} from "../signup.service";

describe("Signup Service", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe("toggleSignup (Join/Leave)", () => {
        it("should throw error if mass is not found", async () => {
            prismaMock.mass.findUnique.mockResolvedValue(null);

            await expect(toggleSignup("user-1", "mass-missing")).rejects.toThrow(
                "Missa não encontrada"
            );
        });

        it("should throw error if mass is not open for signups", async () => {
            prismaMock.mass.findUnique.mockResolvedValue({
                id: "mass-1",
                open: false,
                signups: [],
            } as any);

            await expect(toggleSignup("user-1", "mass-1")).rejects.toThrow(
                "Inscrições fechadas para esta missa."
            );
        });

        it("should throw error if mass deadline has passed", async () => {
            // Deadline is 1 day ago
            const pastDeadline = new Date(Date.now() - 86400000);
            prismaMock.mass.findUnique.mockResolvedValue({
                id: "mass-1",
                open: true,
                deadline: pastDeadline,
                signups: [],
            } as any);

            await expect(toggleSignup("user-1", "mass-1")).rejects.toThrow(
                "Prazo de inscrição encerrado."
            );
        });

        it("should remove user if they are already signed up (Leave Scenario)", async () => {
            const existingSignup = {
                id: "signup-1",
                userId: "user-1",
                status: SIGNUP_STATUS.CONFIRMED,
            };

            prismaMock.mass.findUnique.mockResolvedValue({
                id: "mass-1",
                open: true,
                deadline: null,
                signups: [existingSignup],
            } as any);

            const result = await toggleSignup("user-1", "mass-1");

            expect(prismaMock.signup.delete).toHaveBeenCalledWith({
                where: { id: "signup-1" },
            });
            // Should also try to promote next in line because a CONFIRMED left
            expect(prismaMock.mass.findUnique).toHaveBeenCalledTimes(2); // One for toggle, one for promoteNextInLine
            expect(result.message).toBe("Signup removed successfully");
        });

        it("should join user as CONFIRMED if there is space available", async () => {
            prismaMock.mass.findUnique.mockResolvedValue({
                id: "mass-1",
                open: true,
                maxServers: 3,
                signups: [
                    { id: "s1", status: SIGNUP_STATUS.CONFIRMED },
                    { id: "s2", status: SIGNUP_STATUS.CONFIRMED }
                    // Only 2 confirmed, 1 slot left for the 3 max layout
                ],
            } as any);

            const result = await toggleSignup("new-user", "mass-1");

            expect(prismaMock.signup.create).toHaveBeenCalledWith({
                data: {
                    userId: "new-user",
                    massId: "mass-1",
                    status: SIGNUP_STATUS.CONFIRMED,
                },
            });
            expect(result.status).toBe(SIGNUP_STATUS.CONFIRMED);
            expect(result.message).toBe("Signup confirmed successfully!");
        });

        it("should join user as RESERVE if max capacity is reached", async () => {
            prismaMock.mass.findUnique.mockResolvedValue({
                id: "mass-1",
                open: true,
                maxServers: 2,
                signups: [
                    { id: "s1", status: SIGNUP_STATUS.CONFIRMED },
                    { id: "s2", status: SIGNUP_STATUS.CONFIRMED }
                    // 2 confirmed, 0 slots left
                ],
            } as any);

            const result = await toggleSignup("user-3", "mass-1");

            expect(prismaMock.signup.create).toHaveBeenCalledWith({
                data: {
                    userId: "user-3",
                    massId: "mass-1",
                    status: SIGNUP_STATUS.RESERVE, // Automatically drops to reserve
                },
            });
            expect(result.status).toBe(SIGNUP_STATUS.RESERVE);
            expect(result.message).toBe("Slots full. You are on the reserve list.");
        });
    });

    describe("Reserve List Logic (removeSignup & promoteNextInLine)", () => {
        it("should promote oldest RESERVE to CONFIRMED when a CONFIRMED user leaves", async () => {
            const signupToDelete = {
                id: "signup-1",
                massId: "mass-1",
                status: SIGNUP_STATUS.CONFIRMED,
            };

            const theReserveThatGetsPromoted = {
                id: "signup-reserve-1",
                status: SIGNUP_STATUS.RESERVE,
                createdAt: new Date("2024-01-01T10:00:00.000Z") // Arrived first
            };

            const theOtherReserve = {
                id: "signup-reserve-2",
                status: SIGNUP_STATUS.RESERVE,
                createdAt: new Date("2024-01-01T11:00:00.000Z") // Arrived later
            };

            prismaMock.signup.findUnique.mockResolvedValue(signupToDelete as any);

            // Mock the promoteNextInLine internal call
            prismaMock.mass.findUnique.mockResolvedValue({
                id: "mass-1",
                signups: [theReserveThatGetsPromoted, theOtherReserve]
            } as any);

            await removeSignup("signup-1");

            expect(prismaMock.signup.delete).toHaveBeenCalledWith({
                where: { id: "signup-1" }
            });

            // Make sure the first reserve gets updated to confirmed
            expect(prismaMock.signup.update).toHaveBeenCalledWith({
                where: { id: "signup-reserve-1" },
                data: { status: SIGNUP_STATUS.CONFIRMED }
            });
        });

        it("should NOT promote anyone if a RESERVE leaves", async () => {
            // If someone who is just a reserve drops out, nobody gets promoted into the confirmed slot
            const reserveToDelete = {
                id: "signup-res-leaving",
                massId: "mass-1",
                status: SIGNUP_STATUS.RESERVE,
            };

            prismaMock.signup.findUnique.mockResolvedValue(reserveToDelete as any);

            await removeSignup("signup-res-leaving");

            // Mass shouldn't even be searched for promotion list
            expect(prismaMock.mass.findUnique).not.toHaveBeenCalled();
            expect(prismaMock.signup.update).not.toHaveBeenCalled();
        });
    });

    describe("swapSignup", () => {
        it("should replace one user with another in a single transaction", async () => {
            const oldSignup = {
                id: "signup-1",
                massId: "mass-1",
                role: "LEITORA",
                userId: "user-1",
                user: { name: "Maria Clara" }
            };

            prismaMock.signup.findUnique.mockResolvedValue(oldSignup as any);

            await swapSignup("signup-1", "user-2");

            // Assuming transaction wraps both calls
            expect(prismaMock.$transaction).toHaveBeenCalled();

            // Extract the transaction argument elements safely by grabbing what was mocked
            const transactionCalls = prismaMock.$transaction.mock.calls[0][0] as any;

            // Since $transaction maps an array of promises when not using the interactive client, 
            // we'll just check if delete and create methods were spawned during this flow
            expect(prismaMock.signup.delete).toHaveBeenCalledWith({
                where: { id: "signup-1" }
            });

            expect(prismaMock.signup.create).toHaveBeenCalledWith({
                data: {
                    userId: "user-2",
                    massId: "mass-1",
                    role: "LEITORA",
                    status: SIGNUP_STATUS.CONFIRMED,
                    isSubstitution: true,
                    substitutedName: "Maria Clara", // Crucial detail
                }
            });
        });
    });
});
