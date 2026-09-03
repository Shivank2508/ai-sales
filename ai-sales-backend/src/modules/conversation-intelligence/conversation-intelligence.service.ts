import { Types } from "mongoose";
import { ChatRepository } from "../chat/chat.repository";
import { TranscriptService } from "./transcript.service";
import { ConversationAnalysis, ConversationTranscript } from "./conversation-intelligence.types";
import { ConversationIntelligencePrompt } from "./conversation-intelligence.prompt";
import { deepseek } from "../../services/ai.openai";
import { validateConversationAnalysis } from "./conversation-intelligence.validator";

export class ConversationIntelligenceService {
    private readonly chatRepository = new ChatRepository()
    private readonly transcriptService = new TranscriptService()
    private readonly promptBuilder = new ConversationIntelligencePrompt()
    private readonly model = "deepseek-v4-flash";
    async getTranscript(conversationId: string): Promise<ConversationTranscript> {
        if (!Types.ObjectId.isValid(conversationId)) {
            throw new Error("Invalid conversationId")
        }

        const conversation = await this.chatRepository.findConversationById(conversationId)

        if (!conversation) {
            throw new Error("Conversation not found")
        }

        return this.transcriptService.buildTranscript(conversation)
    }

    async debugTranscript(conversationId: string): Promise<string> {
        const transcript = await this.getTranscript(conversationId)
        console.log("\n===== CONVERSATION TRANSCRIPT =====\n");
        console.log(transcript.text)
        console.log("\n===== END TRANSCRIPT =====\n");
        return transcript.text
    }

    async analyzeConversation(conversationId: string): Promise<ConversationAnalysis> {
        const transcript = await this.getTranscript(conversationId)

        if (!transcript.text.trim()) {
            "Conversation does not contain messages"
        }

        const systemPrompt = this.promptBuilder.buildSystemPrompt()

        const userPrompt = this.promptBuilder.buildUserPrompt(transcript.text)

        const response = await deepseek.chat.completions.create({
            model: this.model,
            messages: [{ role: "system", content: systemPrompt }, { role: "user", content: userPrompt }],
            temperature: 0,
        })

        const content = response.choices?.[0]?.message?.content
        if (!content) {
            throw new Error("DeepSeek returned an empty analysis");
        }
        const analysis = this.parseAnalysis(content);
        return validateConversationAnalysis(analysis);
    }

    private parseAnalysis(content: string): ConversationAnalysis {
        try {
            const cleaned = this.cleanJsonResponse(content)
            const parsed = JSON.parse(cleaned)
            return parsed as ConversationAnalysis;
        } catch (error) {
            console.error("Conversation analysis JSON parsing failed:", content);
            throw new Error("DeepSeek returned invalid conversation analysis JSON");
        }
    }

    private cleanJsonResponse(content: string): string {
        let result = content.trim()
        if (result.startsWith("```json")) {
            result = result.replace(/^```json\s*/i, "")
            result = result.replace(/\s*```$/i, "");
        } else if (
            result.startsWith("```")
        ) {
            result = result.replace(/^```\s*/i, "");
            result = result.replace(/\s*```$/i, "");
        }
        return result.trim();
    }
}