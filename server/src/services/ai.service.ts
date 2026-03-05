import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.API_GEMINI || "");

export interface ExtractedMass {
    date: string; // YYYY-MM-DD
    time: string; // HH:mm
    name: string; // Local da missa (ex: MATRIZ, SÃO FRANCISCO, etc)
}

/**
 * Service to parse mass schedule images using Google Gemini AI
 */
export async function parseScheduleImage(imageBuffer: Buffer, mimeType: string): Promise<ExtractedMass[]> {
    // Lista de modelos para tentar (baseado na disponibilidade da chave)
    const modelsToTry = ["gemini-flash-latest", "gemini-2.5-flash", "gemini-2.0-flash", "gemini-pro-latest"];
    let lastError: any = null;

    for (const modelName of modelsToTry) {
        try {
            console.log(`Tentando processar com o modelo: ${modelName}...`);
            const model = genAI.getGenerativeModel({ model: modelName });

            const prompt = `
                Você é um assistente especializado em extrair horários de missas de imagens de agendas paroquiais.
                Analise a imagem fornecida e extraia APENAS as missas da MATRIZ.
                
                IMPORTANTE: Ignore qualquer outra comunidade, capela ou local que não seja a "MATRIZ".
                
                Regras de extração:
                1. A data deve estar no formato YYYY-MM-DD. O ano é 2026.
                2. O horário deve estar no formato HH:mm (24h).
                3. O nome deve ser obrigatoriamente "MATRIZ".
                
                Retorne APENAS um array JSON válido no seguinte formato:
                [
                    { "date": "2026-03-01", "time": "07:00", "name": "MATRIZ" },
                    ...
                ]
                Não inclua nenhuma explicação ou formatação markdown. Apenas o array puro ou um array vazio [] se não houver missas na Matriz.
            `;

            const imageParts = [{
                inlineData: { data: imageBuffer.toString("base64"), mimeType },
            }];

            const result = await model.generateContent([prompt, ...imageParts]);
            const response = await result.response;
            const text = response.text().trim();

            const cleanJson = text.replace(/```json/g, "").replace(/```/g, "").trim();
            const extracted: ExtractedMass[] = JSON.parse(cleanJson);

            // Filtro de segurança adicional no código para garantir apenas MATRIZ
            return extracted.filter(m => m.name.toUpperCase().includes("MATRIZ"));

        } catch (error: any) {
            console.error(`Erro no modelo ${modelName}:`, error.message);
            lastError = error;

            // Se for erro de quota (429) ou serviço ocupado (503), tenta o próximo modelo da lista
            if (error.message?.includes("429") || error.message?.includes("503") || error.message?.includes("404")) {
                continue;
            }
            break; // Se for outro tipo de erro, para a execução
        }
    }

    // Se chegar aqui, todos os modelos falharam
    let userMessage = "O serviço de IA está temporariamente indisponível (limite de cota atingido). Tente novamente em alguns minutos.";
    if (lastError?.message?.includes("404")) {
        userMessage = "Modelo de IA não encontrado. Por favor, verifique se a sua chave API do Gemini está ativa e configurada corretamente no .env";
    }

    throw new Error(userMessage);
}
