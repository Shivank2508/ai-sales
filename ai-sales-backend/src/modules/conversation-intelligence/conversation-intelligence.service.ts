import { Types } from "mongoose";
import { ChatRepository } from "../chat/chat.repository";
import { TranscriptService } from "./transcript.service";

export class ConversationIntelligenceService {
    private readonly chatRepository = new ChatRepository()
    private readonly transcriptService = new TranscriptService()

    async getTranscript(conversationId: string): Promise<ConversationTranscript> {
        if (!Types.ObjectId.isValid(conversationId)) {
            throw new Error("Invalid conversationId")
        }
    }
}