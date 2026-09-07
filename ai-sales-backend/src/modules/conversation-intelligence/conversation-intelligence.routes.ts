import { Router } from "express";
import { ConversationIntelligenceController } from "./conversation-intelligence.controller";

const router = Router()

const controller = new ConversationIntelligenceController()

router.post("/analyze", controller.analyze)

export default router