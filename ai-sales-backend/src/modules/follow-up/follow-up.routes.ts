import { Router, } from "express";
import { FollowUpController, } from "./follow-up.controller";
import { LeadAutomationController } from "./lead-automation.controller";
const router = Router();
const controller = new FollowUpController();
const leadAutomationController = new LeadAutomationController();
router.post("/from-conversation", controller.createFromConversation);
router.get("/product/:productId", controller.getPendingByProduct);
router.patch("/:followUpId/complete", controller.complete);
router.patch("/:followUpId/cancel", controller.cancel);
router.post("/lead/process-conversation", leadAutomationController.processConversation);


export default router;