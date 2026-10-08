import { Router } from "express";
import { ConversationIntelligenceController } from "./conversation-intelligence.controller";
import { ConversationIntelligenceAnalyticsController } from "./conversation-intelligence.analytics.controller";

<<<<<<< HEAD
const router = Router();

const controller = new ConversationIntelligenceController();
const analyticsController = new ConversationIntelligenceAnalyticsController();

router.post("/analyze", controller.analyze);
router.post("/analyze/:conversationId", controller.analyze);
router.get("/conversation/:conversationId", controller.getAnalysis);
router.get("/:conversationId", controller.getAnalysis);
router.get("/analytics/product/:productId", analyticsController.getProductAnalytics);

export default router;
=======
const router = Router()

const controller = new ConversationIntelligenceController()
const analyticsController = new ConversationIntelligenceAnalyticsController()

router.post("/analyze", controller.analyze)

router.get("/analytics/product/:productId", analyticsController.getProductAnalytics);

export default router
>>>>>>> 94fe2b87bc1486c095acfef3768ddd7065d8625a
