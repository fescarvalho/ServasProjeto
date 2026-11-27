import { apiClient } from "./client";
import { Mass, MassPhotoData } from "../../types/types";

export interface CreateMassData {
    date: string;
    time?: string;
    name?: string;
    local?: string;
    maxServers: number;
    deadline?: string | null;
    points?: number | null; // <-- Adicionado
}

export interface UpdateMassData extends Partial<CreateMassData> { }

/**
 * Busca todas as missas
 */
export async function getMasses(): Promise<Mass[]> {
    const timestamp = new Date().getTime();
    const response = await apiClient.get<Mass[]>(`/masses?t=${timestamp}`);

    // Ordena por data
    return response.data.sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );
}

/**
 * Cria uma nova missa
 */
export async function createMass(data: CreateMassData): Promise<Mass> {
    const response = await apiClient.post<Mass>("/masses", data);
    return response.data;
}

/**
 * Atualiza uma missa existente
 */
export async function updateMass(id: string, data: UpdateMassData): Promise<Mass> {
    const response = await apiClient.put<Mass>(`/masses/${id}`, data);
    return response.data;
}

/**
 * Deleta uma missa
 */
export async function deleteMass(id: string): Promise<void> {
    await apiClient.delete(`/masses/${id}`);
}

/**
 * Alterna o status de publicação de uma missa
 */
export async function togglePublish(id: string, published: boolean): Promise<Mass> {
    const response = await apiClient.patch<Mass>(`/masses/${id}`, { published });
    return response.data;
}

/**
 * Alterna o status de abertura de inscrições
 */
export async function toggleOpen(id: string, open: boolean): Promise<Mass> {
    const response = await apiClient.patch<Mass>(`/masses/${id}/toggle-open`, { open });
    return response.data;
}

/**
 * Patch mass (update genérico, ex: signups em aninhamento)
 */
export async function patchMass(id: string, data: any): Promise<Mass> {
    const response = await apiClient.patch<Mass>(`/masses/${id}`, data);
    return response.data;
}

/**
 * Envia imagem da agenda para ser processada pela IA
 */
export async function uploadScheduleImage(file: File): Promise<any[]> {
    const formData = new FormData();
    formData.append("schedule", file);

    const response = await apiClient.post<any[]>("/admin/upload-schedule", formData, {
        headers: {
            "Content-Type": "multipart/form-data",
        },
    });

    return response.data;
}

/**
 * Comprime e redimensiona a foto da equipe no próprio celular antes do envio (~70-120 KB)
 */
export function compressMassPhotoFile(file: File, maxDimension = 960, quality = 0.72): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onerror = () => reject(new Error("Não foi possível ler o arquivo de imagem."));
        reader.onload = () => {
            const img = new Image();
            img.onerror = () => reject(new Error("Arquivo de imagem inválido."));
            img.onload = () => {
                let { width, height } = img;
                if (width > maxDimension || height > maxDimension) {
                    if (width >= height) {
                        height = Math.round((height * maxDimension) / width);
                        width = maxDimension;
                    } else {
                        width = Math.round((width * maxDimension) / height);
                        height = maxDimension;
                    }
                }

                const canvas = document.createElement("canvas");
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext("2d");
                if (!ctx) {
                    reject(new Error("Falha ao processar imagem no navegador."));
                    return;
                }

                ctx.fillStyle = "#FFFFFF";
                ctx.fillRect(0, 0, width, height);
                ctx.drawImage(img, 0, 0, width, height);

                const dataUrl = canvas.toDataURL("image/jpeg", quality);
                resolve(dataUrl);
            };
            img.src = String(reader.result);
        };
        reader.readAsDataURL(file);
    });
}

/**
 * Busca a foto da equipe de uma missa sob demanda
 */
export async function getMassPhoto(massId: string): Promise<MassPhotoData> {
    const response = await apiClient.get<MassPhotoData>(`/masses/${massId}/photo?t=${Date.now()}`);
    return response.data;
}

/**
 * Envia/substitui a foto da equipe de uma missa (com timeout para detectar rede fraca e salvar offline)
 */
export async function uploadMassPhoto(
    massId: string,
    imageDataUrl: string,
    capturedAt?: string
): Promise<{ uploadedById: string; uploadedByName: string; uploadedAt: string }> {
    const response = await apiClient.post<{ uploadedById: string; uploadedByName: string; uploadedAt: string }>(
        `/masses/${massId}/photo`,
        { imageDataUrl, capturedAt },
        { timeout: 25000 }
    );
    return response.data;
}

/**
 * Remove a foto da equipe de uma missa (Admin)
 */
export async function deleteMassPhoto(massId: string): Promise<void> {
    await apiClient.delete(`/masses/${massId}/photo`);
}

/**
 * Confirma a presença de todos os servos confirmados de uma missa (Admin)
 */
export async function confirmAllMassPresence(massId: string): Promise<{ count: number }> {
    const response = await apiClient.post<{ count: number }>(`/masses/${massId}/confirm-all-presence`);
    return response.data;
}

/**
 * Faz o download da foto da equipe (converte dataURL em Blob para compatibilidade mobile e desktop)
 */
export function downloadMassPhotoFile(imageDataUrl: string, massDateIso: string): void {
    const d = new Date(massDateIso);
    const dateSlug = isNaN(d.getTime())
        ? "missa"
        : d
              .toLocaleString("pt-BR", {
                  timeZone: "America/Sao_Paulo",
                  day: "2-digit",
                  month: "2-digit",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
              })
              .replace(/[^\d]+/g, "-");

    const mimeMatch = imageDataUrl.match(/^data:image\/([a-zA-Z0-9+.-]+);base64,/);
    const rawExt = mimeMatch ? mimeMatch[1].toLowerCase() : "jpeg";
    const ext = rawExt === "jpeg" ? "jpg" : rawExt;
    const filename = `foto-equipe-${dateSlug}.${ext}`;

    try {
        const commaIdx = imageDataUrl.indexOf(",");
        if (commaIdx !== -1) {
            const header = imageDataUrl.slice(0, commaIdx);
            const base64 = imageDataUrl.slice(commaIdx + 1);
            const mime = header.match(/data:([^;]+)/)?.[1] || "image/jpeg";
            const binary = atob(base64);
            const bytes = new Uint8Array(binary.length);
            for (let i = 0; i < binary.length; i++) {
                bytes[i] = binary.charCodeAt(i);
            }
            const blob = new Blob([bytes], { type: mime });
            const blobUrl = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = blobUrl;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            setTimeout(() => URL.revokeObjectURL(blobUrl), 10000);
            return;
        }
    } catch {
        // fallback para dataURL direto abaixo
    }

    const a = document.createElement("a");
    a.href = imageDataUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}
