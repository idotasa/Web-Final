import { GoogleGenerativeAI } from "@google/generative-ai";
import config from "../config";

const genAI = new GoogleGenerativeAI(config.GEMINI_API_KEY);

/**
 * Generate a 384-dimension embedding for the given text.
 */
export async function embedText(text: string): Promise<number[]> {
    const model = genAI.getGenerativeModel({ model: "models/gemini-embedding-001" });
    
    try {
        const result = await model.embedContent(text);
        return result.embedding.values.slice(0, 384);
    } catch (error: any) {
        console.error("❌ [LLMClient] Embedding error:", error.message);
        throw error;
    }
}

/**
 * Send a chat completion request to Gemini.
 */
export async function chat(systemPrompt: string, userMessage: string): Promise<string> {
    const model = genAI.getGenerativeModel({
        model: "models/gemini-2.5-flash", 
        systemInstruction: systemPrompt,
    });
    const result = await model.generateContent(userMessage);
    return result.response.text();
}