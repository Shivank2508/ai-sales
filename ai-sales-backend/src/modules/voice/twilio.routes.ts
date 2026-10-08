import { Router } from "express";
import { TwilioController } from "./twilio.controller";

const router = Router();
const controller = new TwilioController();

router.get("/status", controller.getStatus);
router.get("/debug", controller.debug);
router.post("/call", controller.initiateCall);

// Webhook endpoints consumed by Twilio
router.post("/voice-webhook", controller.voiceWebhook);
router.get("/voice-webhook", controller.voiceWebhook);
router.post("/gather-webhook", controller.gatherWebhook);
router.post("/status-callback", controller.statusCallback);

export default router;
