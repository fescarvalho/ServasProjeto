import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.API_GEMINI || "");

export interface ExtractedMass {
    date: string; // YYYY-MM-DD
    time: string; // HH:mm
    local: string; // Local da missa (ex: SANTA TEREZINHA, SAO FRANCISCO, SANTUARIO)
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
                Analise a imagem fornecida e extraia as missas dos seguintes locais:
                - SANTUARIO
                - SANTA TEREZINHA
                - SAO FRANCISCO
                
                IMPORTANTE: Ignore qualquer outra comunidade, capela ou local que não seja um dos três listados acima.
                
                Regras de extração:
                1. A data deve estar no formato YYYY-MM-DD. O ano é 2026.
                2. O horário deve estar no formato HH:mm (24h).
                3. O campo "local" deve ser exatamente um dos seguintes valores:
                   - "SANTUARIO" para missas na Matriz/Igreja Matriz/Santuário ou quando estiver escrito apenas MATRIZ
                   - "SANTA TEREZINHA" para missas em Santa Terezinha ou Popular Nova
                   - "SAO FRANCISCO" para missas em São Francisco ou Balneário
                
                Retorne APENAS um array JSON válido no seguinte formato:
                [
                    { "date": "2026-03-01", "time": "07:00", "local": "SANTUARIO" },
                    { "date": "2026-03-01", "time": "09:00", "local": "SANTA TEREZINHA" },
                    { "date": "2026-03-01", "time": "19:00", "local": "SAO FRANCISCO" },
                    ...
                ]
                Não inclua nenhuma explicação ou formatação markdown. Apenas o array puro ou um array vazio [] se não houver missas nos locais listados.
            `;

            const imageParts = [{
                inlineData: { data: imageBuffer.toString("base64"), mimeType },
            }];

            const result = await model.generateContent([prompt, ...imageParts]);
            const response = await result.response;
            const text = response.text().trim();

            const cleanJson = text.replace(/```json/g, "").replace(/```/g, "").trim();
            const extracted: ExtractedMass[] = JSON.parse(cleanJson);

            // Filtro de segurança: apenas locais permitidos
            const allowedLocals = ["SANTUARIO", "SANTA TEREZINHA", "SAO FRANCISCO"];
            return extracted.filter(m => allowedLocals.some(loc => m.local.toUpperCase().includes(loc.toUpperCase())));

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
