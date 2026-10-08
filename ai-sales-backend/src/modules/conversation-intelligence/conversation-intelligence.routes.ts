import { Router } from "express";
import { ConversationIntelligenceController } from "./conversation-intelligence.controller";
import { ConversationIntelligenceAnalyticsController } from "./conversation-intelligence.analytics.controller";

const router = Router();

const controller = new ConversationIntelligenceController();
const analyticsController = new ConversationIntelligenceAnalyticsController();

router.post("/analyze", controller.analyze);
router.post("/analyze/:conversationId", controller.analyze);
router.get("/conversation/:conversationId", controller.getAnalysis);
router.get("/:conversationId", controller.getAnalysis);
router.get("/analytics/product/:productId", analyticsController.getProductAnalytics);

export default router;