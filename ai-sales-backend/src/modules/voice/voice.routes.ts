import { Router } from "express";
import { VoiceController } from "./voice.controller";

const router = Router();

const voiceController =
    new VoiceController();

router.post(
    "/process",
    voiceController.processVoice
);

export default router;