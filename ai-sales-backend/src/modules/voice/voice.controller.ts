import { Request, Response } from "express";
import { VoiceService } from "./voice.service";
import { SpeachToText } from "./speech-to-text.service";
import { TextToSpeechService } from "./text-to-speech.service";
import fs from "fs/promises";

export class VoiceController {
    constructor(
        private readonly voiceService = new VoiceService(),
        private readonly speechToTextService = new SpeachToText(),
        private readonly ttsService = new TextToSpeechService()
    ) {}

    processVoice = async (req: Request, res: Response) => {
        const { productId, conversationId, leadId, campaignId, surveySessionId, text } = req.body;
        const file = req.file;

        let transcript = text;

        if (file) {
            try {
                transcript = await this.speechToTextService.transcribe(file.path);
            } finally {
                await fs.unlink(file.path).catch(() => {});
            }
        }

        if (!transcript?.trim()) {
            return res.status(400).json({
                success: false,
                message: "Either audio file or text transcript is required",
            });
        }

        try {
            const result = await this.voiceService.processVoice({
                productId,
                conversationId,
                leadId,
                campaignId,
                surveySessionId,
                transcript: transcript.trim(),
            });

            return res.status(200).json({
                success: true,
                data: result,
            });
        } catch (error: any) {
            return res.status(500).json({
                success: false,
                message: error.message || "Failed to process voice",
            });
        }
    };

    synthesize = async (req: Request, res: Response) => {
        const { text, targetLanguage } = req.body;
        if (!text?.trim()) {
            return res.status(400).json({ success: false, message: "text is required" });
        }

        try {
            const speech = await this.ttsService.synthesize(text.trim());
            return res.status(200).json({
                success: true,
                data: speech,
            });
        } catch (error: any) {
            return res.status(500).json({
                success: false,
                message: error.message || "Failed to synthesize speech",
            });
        }
    };

    speak = async (req: Request, res: Response) => {
        const { productId, conversationId, leadId, campaignId, surveySessionId, text } = req.body;
        const file = req.file;

        let transcript = text;

        if (file) {
            try {
                transcript = await this.speechToTextService.transcribe(file.path);
            } finally {
                await fs.unlink(file.path).catch(() => {});
            }
        }

        if (!transcript?.trim()) {
            return res.status(400).json({
                success: false,
                message: "Either audio file or text transcript is required",
            });
        }

        try {
            const result = await this.voiceService.processVoice({
                productId,
                conversationId,
                leadId,
                campaignId,
                surveySessionId,
                transcript: transcript.trim(),
            });

            const audioBuffer = Buffer.from(result.audioBase64, "base64");

            res.setHeader("Content-Type", result.mimeType || "audio/wav");
            res.setHeader("Content-Length", audioBuffer.length);

            return res.status(200).send(audioBuffer);
        } catch (error: any) {
            return res.status(500).json({
                success: false,
                message: error.message || "Voice execution failed",
            });
        }
    };
}