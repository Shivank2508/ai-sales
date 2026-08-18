import { Router } from "express";
import { VoiceController } from "./voice.controller";
import multer from "multer";

const router = Router();
const upload = multer({
    dest: "uploads/voice/",
});
const voiceController =
    new VoiceController();

router.post(
    "/process",
    upload.single("audio"),
    voiceController.processVoice
);

router.post(
    "/speak",
    upload.single("audio"),
    voiceController.speak
);


export default router;