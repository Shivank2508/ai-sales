import { Request, Response } from "express";
import { FollowUpService } from "./follow-up.service";

export class FollowUpController {
    private readonly service = new FollowUpService();

    createFromConversation = async (req: Request, res: Response) => {
        const conversationId = String(req.body.conversationId || "");
        if (!conversationId) {
            return res.status(400).json({
                success: false,
                message: "conversationId is required",
            });
        }
        const followUp = await this.service.createFromConversation(conversationId);
        return res.status(201).json({
            success: true,
            data: followUp,
        });
    };

    complete = async (req: Request, res: Response) => {
        const followUpId = String(req.params.followUpId || req.params.id || "");
        if (!followUpId) {
            return res.status(400).json({ success: false, message: "followUpId is required" });
        }

        const followUp = await this.service.complete(followUpId);
        return res.status(200).json({
            success: true,
            data: followUp,
        });
    };

    cancel = async (req: Request, res: Response) => {
        const followUpId = String(req.params.followUpId || req.params.id || "");
        if (!followUpId) {
            return res.status(400).json({ success: false, message: "followUpId is required" });
        }

        const followUp = await this.service.cancel(followUpId);
        return res.status(200).json({
            success: true,
            data: followUp,
        });
    };

    getPendingByProduct = async (req: Request, res: Response) => {
        const productId = String(req.params.productId || req.params.id || "");
        if (!productId) {
            return res.status(400).json({ success: false, message: "productId is required" });
        }

        const followUps = await this.service.getPendingByProduct(productId);

        res.status(200).json({
            success: true,
            data: followUps,
        });
    };
}