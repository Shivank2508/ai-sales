import { ConversationIntelligenceService } from "./conversation-intelligence.service";
import { Request, Response } from "express";

export class ConversationIntelligenceController {
    private readonly service = new ConversationIntelligenceService()

    analyze = async (req: Request, res: Response) => {
        try {
            const { conversationId } = req.body;

            if (!conversationId) {
                return res.status(400).json({
                    success: false,
                    message: "conversationId is required",
                });
            }

            const analysis = await this.service.analyzeConversation(conversationId);

            return res.status(200).json({
                success: true,
                data: analysis,
            });
        } catch (error: any) {
            console.error("Conversation intelligence analysis error:", error);
            return res.status(400).json({
                success: false,
                message: error?.message || "Failed to analyze conversation",
            });
        }
    }
}