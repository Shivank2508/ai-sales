import { Request, Response } from "express";
import { LeadAutomationService } from "./lead-automation.service";

export class LeadAutomationController {
    private readonly service = new LeadAutomationService()

    processConversation = async (req: Request, res: Response) => {

        const { leadId, conversationId } = req.body

        if (!leadId || !conversationId) {
            return res.status(400).json({
                success: false,
                message: "leadId and conversationId are required",
            });
        }

        const result = await this.service.processConversation(leadId, conversationId);
        return res.status(200).json({
            success: true,
            data: result,
        });

    }
}