import dotenv from "dotenv";
import path from "path";

// Load environment-specific file
const env = process.env.NODE_ENV;
const envPath = path.resolve(process.cwd(), `.env.${env}`);
dotenv.config({ path: envPath });

// Fallback to .env if specific one doesn't exist or doesn't have all keys
dotenv.config();

const config = {
    NODE_ENV: process.env.NODE_ENV!,
    PORT: parseInt(process.env.PORT!, 10),
    DB_URL: process.env.MONGODB_URI!,
    DOMAIN_BASE: process.env.DOMAIN_BASE!,
    CORS_ORIGIN: process.env.CORS_ORIGIN!,
    ACCESS_TOKEN_SECRET: process.env.ACCESS_TOKEN_SECRET!,
    REFRESH_TOKEN_SECRET: process.env.REFRESH_TOKEN_SECRET!,
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID!,

    // AI / LLM
    GEMINI_API_KEY: process.env.GEMINI_API_KEY || "",
    LLM_MOCK_MODE: process.env.LLM_MOCK_MODE === "true",
    LLM_RATE_LIMIT_RPM: parseInt(process.env.LLM_RATE_LIMIT_RPM || "15", 10),
};

export default config;
