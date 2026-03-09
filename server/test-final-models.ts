import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";

dotenv.config();

const key = process.env.API_GEMINI;
const genAI = new GoogleGenerativeAI(key || "");

async function testModels() {
    const models = ["gemini-flash-latest", "gemini-2.5-flash", "gemini-2.0-flash", "gemini-pro-latest"];

    for (const m of models) {
        try {
            console.log(`Testing ${m}...`);
            const model = genAI.getGenerativeModel({ model: m });
            const result = await model.generateContent("Diga 'OK' se estiver funcionando.");
            const response = await result.response;
            console.log(`${m}: SUCCESS - ${response.text().trim()}`);
            break; // Stop at first success
        } catch (e: any) {
            console.log(`${m}: FAILED - ${e.message}`);
        }
    }
}

testModels();
