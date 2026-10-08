import { Router } from "express";
import { TwilioController } from "./twilio.controller";

const router = Router();
const controller = new TwilioController();

router.get("/status", controller.getStatus);
router.get("/debug", controller.debug);
router.get("/recent-calls", controller.getRecentCalls);
router.get("/notifications/:callSid", controller.getCallNotifications);
router.post("/call", controller.initiateCall);

// Webhook endpoints consumed by Twilio
router.post("/voice-webhook", controller.voiceWebhook);
router.get("/voice-webhook", controller.voiceWebhook);
router.post("/gather-webhook", controller.gatherWebhook);
router.post("/status-callback", controller.statusCallback);

export default router;
