import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const key = process.env.API_GEMINI;

async function checkModels() {
    try {
        console.log("Checking models via direct REST call...");
        const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${key}`;
        const response = await axios.get(url);
        console.log("Models found:");
        response.data.models.forEach((m: any) => {
            console.log(`- ${m.name}`);
        });
    } catch (error: any) {
        console.error("REST Call FAILED");
        if (error.response) {
            console.error("Status:", error.response.status);
            console.error("Data:", JSON.stringify(error.response.data, null, 2));
        } else {
            console.error("Error:", error.name, error.message);
        }
    }
}

checkModels();
