import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import OpenAI from "openai";


export const geminiEmbeddings = new GoogleGenerativeAIEmbeddings({
    model: "gemini-embedding-001",
    apiKey: process.env.GEMINI_API_KEY
})




export const deepseek = new OpenAI({
    apiKey: process.env.DEEPSEEK_API_KEY,
    baseURL: "https://api.deepseek.com",
});