import OpenAI from "openai";
import Groq from "groq-sdk";

export class LLMService {
    private static deepseekClient: OpenAI | null = null;
    private static groqClient: Groq | null = null;
    private static openaiClient: OpenAI | null = null;

    private static getDeepSeek(): OpenAI | null {
        if (!this.deepseekClient && process.env.DEEPSEEK_API_KEY) {
            this.deepseekClient = new OpenAI({
                apiKey: process.env.DEEPSEEK_API_KEY,
                baseURL: "https://api.deepseek.com",
            });
        }
        return this.deepseekClient;
    }

    private static getGroq(): Groq | null {
        if (!this.groqClient && process.env.GROQ_API_KEY) {
            this.groqClient = new Groq({
                apiKey: process.env.GROQ_API_KEY,
            });
        }
        return this.groqClient;
    }

    private static getOpenAI(): OpenAI | null {
        if (!this.openaiClient && (process.env.OPEN_API_KEY || process.env.OPENAI_API_KEY)) {
            this.openaiClient = new OpenAI({
                apiKey: process.env.OPEN_API_KEY || process.env.OPENAI_API_KEY,
            });
        }
        return this.openaiClient;
    }

    /**
     * Executes a chat completion returning structured JSON parsed as T.
     */
    public static async generateJSON<T = any>(
        systemPrompt: string,
        userPrompt: string,
        schemaDescription?: string
    ): Promise<T> {
        const fullSystemPrompt = `${systemPrompt}\n\nIMPORTANT: You must return ONLY valid, raw JSON (no markdown formatting, no \`\`\`json wrappers, no extra explanation).${
            schemaDescription ? `\n\nJSON Schema / Structure:\n${schemaDescription}` : ""
        }`;

        let rawResponse = "";

        // 1. Try Groq (ultra fast)
        const groq = this.getGroq();
        if (groq) {
            try {
                const response = await groq.chat.completions.create({
                    model: "llama-3.1-8b-instant",
                    messages: [
                        { role: "system", content: fullSystemPrompt },
                        { role: "user", content: userPrompt },
                    ],
                    temperature: 0.1,
                    response_format: { type: "json_object" },
                });
                rawResponse = response.choices[0]?.message?.content || "";
                if (rawResponse) {
                    return this.parseJSON<T>(rawResponse);
                }
            } catch (err: any) {
                console.warn("[LLMService] Groq JSON failed, falling back:", err?.message || err);
            }
        }

        // 2. Try DeepSeek
        const deepseek = this.getDeepSeek();
        if (deepseek) {
            try {
                const response = await deepseek.chat.completions.create({
                    model: "deepseek-chat",
                    messages: [
                        { role: "system", content: fullSystemPrompt },
                        { role: "user", content: userPrompt },
                    ],
                    temperature: 0.1,
                });
                rawResponse = response.choices[0]?.message?.content || "";
                if (rawResponse) {
                    return this.parseJSON<T>(rawResponse);
                }
            } catch (err: any) {
                console.warn("[LLMService] DeepSeek JSON failed, falling back:", err?.message || err);
            }
        }

        // 3. Try OpenAI
        const openai = this.getOpenAI();
        if (openai) {
            try {
                const response = await openai.chat.completions.create({
                    model: "gpt-4o-mini",
                    messages: [
                        { role: "system", content: fullSystemPrompt },
                        { role: "user", content: userPrompt },
                    ],
                    temperature: 0.1,
                    response_format: { type: "json_object" },
                });
                rawResponse = response.choices[0]?.message?.content || "";
                if (rawResponse) {
                    return this.parseJSON<T>(rawResponse);
                }
            } catch (err: any) {
                console.warn("[LLMService] OpenAI JSON failed:", err?.message || err);
            }
        }

        throw new Error("All LLM providers failed to generate valid JSON response.");
    }

    /**
     * Executes a chat completion returning a plain text string.
     */
    public static async generateText(
        systemPrompt: string,
        userPrompt: string
    ): Promise<string> {
        // 1. Try Groq
        const groq = this.getGroq();
        if (groq) {
            try {
                const response = await groq.chat.completions.create({
                    model: "llama-3.1-8b-instant",
                    messages: [
                        { role: "system", content: systemPrompt },
                        { role: "user", content: userPrompt },
                    ],
                    temperature: 0.3,
                });
                const text = response.choices[0]?.message?.content?.trim();
                if (text) return text;
            } catch (err: any) {
                console.warn("[LLMService] Groq text failed, falling back:", err?.message || err);
            }
        }

        // 2. Try DeepSeek
        const deepseek = this.getDeepSeek();
        if (deepseek) {
            try {
                const response = await deepseek.chat.completions.create({
                    model: "deepseek-chat",
                    messages: [
                        { role: "system", content: systemPrompt },
                        { role: "user", content: userPrompt },
                    ],
                    temperature: 0.3,
                });
                const text = response.choices[0]?.message?.content?.trim();
                if (text) return text;
            } catch (err: any) {
                console.warn("[LLMService] DeepSeek text failed, falling back:", err?.message || err);
            }
        }

        // 3. Try OpenAI
        const openai = this.getOpenAI();
        if (openai) {
            try {
                const response = await openai.chat.completions.create({
                    model: "gpt-4o-mini",
                    messages: [
                        { role: "system", content: systemPrompt },
                        { role: "user", content: userPrompt },
                    ],
                    temperature: 0.3,
                });
                const text = response.choices[0]?.message?.content?.trim();
                if (text) return text;
            } catch (err: any) {
                console.warn("[LLMService] OpenAI text failed:", err?.message || err);
            }
        }

        throw new Error("All LLM providers failed to generate text response.");
    }

    private static parseJSON<T>(raw: string): T {
        let clean = raw.trim();
        if (clean.startsWith("```json")) {
            clean = clean.replace(/^```json\s*/, "").replace(/\s*```$/, "");
        } else if (clean.startsWith("```")) {
            clean = clean.replace(/^```\s*/, "").replace(/\s*```$/, "");
        }
        return JSON.parse(clean) as T;
    }
}
