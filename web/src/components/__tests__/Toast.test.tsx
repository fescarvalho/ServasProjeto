import { render, screen, fireEvent } from "@testing-library/react";
import { ToastContainer } from "../Toast";
import type { ToastMessage } from "../Toast";
import { describe, it, expect, vi } from "vitest";

describe("ToastComponent", () => {
    it("renders multiple toasts correctly", () => {
        const mockToasts: ToastMessage[] = [
            { id: "1", type: "success", message: "Sucesso ao salvar!" },
            { id: "2", type: "error", message: "Erro ao processar!" },
        ];

        // eslint-disable-next-line @typescript-eslint/no-empty-function
        render(<ToastContainer toasts={mockToasts} onRemove={() => { }} />);

        expect(screen.getByText("Sucesso ao salvar!")).toBeInTheDocument();
        expect(screen.getByText("Erro ao processar!")).toBeInTheDocument();
    });

    it("calls onRemove when the close button is clicked", () => {
        const mockToasts: ToastMessage[] = [
            { id: "1", type: "info", message: "Aviso importante" },
        ];
        const mockRemove = vi.fn();

        render(<ToastContainer toasts={mockToasts} onRemove={mockRemove} />);

        // As the close button doesn't have text or role out of the box easily, 
        // we find it by clicking the parent/icon button (or just its X container)
        // The safest way here is to find the only button rendered.
        const closeButton = screen.getByRole("button");
        fireEvent.click(closeButton);

        expect(mockRemove).toHaveBeenCalledWith("1");
        expect(mockRemove).toHaveBeenCalledTimes(1);
    });
});
