import { Router } from "express";
import { ConversationIntelligenceController } from "./conversation-intelligence.controller";
import { ConversationIntelligenceAnalyticsController } from "./conversation-intelligence.analytics.controller";

const router = Router()

const controller = new ConversationIntelligenceController()
const analyticsController = new ConversationIntelligenceAnalyticsController()

router.post("/analyze", controller.analyze)

router.get("/analytics/product/:productId", analyticsController.getProductAnalytics);

export default router