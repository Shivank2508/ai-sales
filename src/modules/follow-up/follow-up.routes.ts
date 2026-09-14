import { Router, } from "express";
import { FollowUpController, } from "./follow-up.controller";
const router = Router();
const controller = new FollowUpController();

router.post("/from-conversation", controller.createFromConversation);
router.get("/product/:productId", controller.getPendingByProduct);
router.patch("/:followUpId/complete", controller.complete);
router.patch("/:followUpId/cancel", controller.cancel);


export default router;