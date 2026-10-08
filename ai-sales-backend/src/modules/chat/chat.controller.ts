import { Request, Response, NextFunction } from "express";
import { ChatService } from "./chat.service";

export class ChatController {
    constructor(
        private readonly chatService = new ChatService()
    ) {}

    chat = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { productId, conversationId, message, leadId, campaignId, surveyId, surveySessionId, channel } = req.body;

            if (!message || !message.trim()) {
                return res.status(400).json({
                    success: false,
                    message: "message is required",
                });
            }

            const result = await this.chatService.chat({
                productId,
                conversationId,
                message: message.trim(),
                leadId,
                campaignId,
                surveyId,
                surveySessionId,
                channel,
            });

            return res.status(200).json({
                success: true,
                message: "Chat completed successfully.",
                data: result,
            });
        } catch (error) {
            next(error);
        }
    };

    listConversations = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { leadId, campaignId, productId, surveySessionId } = req.query;
            const conversations = await this.chatService.listConversations({
                leadId: leadId ? String(leadId) : undefined,
                campaignId: campaignId ? String(campaignId) : undefined,
                productId: productId ? String(productId) : undefined,
                surveySessionId: surveySessionId ? String(surveySessionId) : undefined,
            });

            return res.json({
                success: true,
                data: conversations,
            });
        } catch (error) {
            next(error);
        }
    };

    getConversation = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const conversationId = String(req.params.id || "");
            const conversation = await this.chatService.getConversation(conversationId);

            if (!conversation) {
                return res.status(404).json({
                    success: false,
                    message: "Conversation not found",
                });
            }

            return res.json({
                success: true,
                data: conversation,
            });
        } catch (error) {
            next(error);
        }
    };

    getProductConversations = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const productId = String(req.params.productId || "");
            const conversations = await this.chatService.getProductConversations(productId);

            return res.json({
                success: true,
                data: conversations,
            });
        } catch (error) {
            next(error);
        }
    };

    deleteConversation = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const conversationId = String(req.params.id || "");
            await this.chatService.deleteConversation(conversationId);

            return res.json({
                success: true,
                message: "Conversation deleted successfully.",
            });
        } catch (error) {
            next(error);
        }
    };
}