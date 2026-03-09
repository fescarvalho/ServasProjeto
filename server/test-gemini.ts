import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";
import * as fs from "fs";

dotenv.config();

const key = process.env.API_GEMINI;
console.log("API Key found:", key ? "YES (starts with " + key.substring(0, 4) + ")" : "NO");

const genAI = new GoogleGenerativeAI(key || "");

async function test() {
    try {
        console.log("Testing Gemini API with text prompt...");
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });
        const result = await model.generateContent("Diga 'Olá Mundo' para testar a conexão.");
        const response = await result.response;
        console.log("Response:", response.text());
        console.log("Gemini Connection: SUCCESS");
    } catch (error: any) {
        console.error("Gemini Connection: FAILED");
        console.error("Error details:", error.message);
        if (error.response) {
            console.error("Response data:", error.response.data);
        }
    }
}

test();
