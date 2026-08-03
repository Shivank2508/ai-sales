import { geminiEmbeddings } from "./ai.openai";

export interface EmbeddingResult {
    embedding: number[];
    dimensions: number;
}

export class EmbeddingService {
    // Note: The model is configured globally inside your GoogleGenerativeAIEmbeddings instantiation ("text-embedding-004")

    async embedText(text: string): Promise<EmbeddingResult> {
        const input = text.trim();
        if (!input) {
            throw new Error("Cannot embed empty text.");
        }

        try {
            // LangChain uses embedQuery for a single string input
            const embedding = await geminiEmbeddings.embedQuery(input);

            if (!embedding || embedding.length === 0) {
                throw new Error("Embedding generation returned an empty vector.");
            }

            return {
                embedding,
                dimensions: embedding.length,
            };
        } catch (error) {
            console.error("Gemini single text embedding failed:", error);
            throw new Error("Embedding generation failed.");
        }
    }

    async embedDocuments(texts: string[]): Promise<number[][]> {
        if (texts.length === 0) {
            return [];
        }

        try {
            // LangChain uses embedDocuments for an array of strings
            const embeddings = await geminiEmbeddings.embedDocuments(texts);
            return embeddings;
        } catch (error) {
            console.error("Gemini bulk document embedding failed:", error);
            throw error;
        }
    }
}
