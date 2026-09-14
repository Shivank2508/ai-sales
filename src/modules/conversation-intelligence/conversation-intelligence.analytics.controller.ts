import { success } from "zod";
import { ConversationIntelligenceAnalyticsService } from "./conversation-intelligence.analytics.service";
import { Request, Response } from "express"

export class ConversationIntelligenceAnalyticsController {
    private readonly service = new ConversationIntelligenceAnalyticsService()
    getProductAnalytics = async (req: Request, res: Response) => {
        const { productId } = req.params;

        if (!productId) {
            return res.status(400).json({
                success: false,
                message: "productId is required",
            });
        }

        const analytics = await this.service.getProductAnalytics(productId)

        return res.status(200).json({
            success: true,
            data: analytics
        })
    }
}