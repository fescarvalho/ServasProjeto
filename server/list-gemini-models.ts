import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";

dotenv.config();

const key = process.env.API_GEMINI;
const genAI = new GoogleGenerativeAI(key || "");

async function listModels() {
    try {
        console.log("Listing models...");
        // In @google/generative-ai, listing models is a bit different
        // We might need to use the REST API directly or just try common names

        // Let's try gemini-1.5-flash-8b, gemini-1.5-pro, gemini-1.0-pro
        const modelsToTry = ["gemini-1.5-flash", "gemini-1.5-pro", "gemini-1.0-pro", "gemini-2.0-flash-exp"];

        for (const m of modelsToTry) {
            try {
                const model = genAI.getGenerativeModel({ model: m });
                const result = await model.generateContent("test");
                console.log(`Model ${m}: SUCCESS`);
            } catch (e: any) {
                console.log(`Model ${m}: FAILED - ${e.message}`);
            }
        }

    } catch (error: any) {
        console.error("Error:", error.message);
    }
}

listModels();
