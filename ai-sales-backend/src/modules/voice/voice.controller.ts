import { Request, Response } from "express";
import { VoiceService } from "./voice.service";
import { SpeachToText } from "./speech-to-text.service";

export class VoiceController {

    constructor(
        private readonly voiceService = new VoiceService(),
        private readonly speechToTextService = new SpeachToText()
    ) { }

    processVoice = async (
        req: Request,
        res: Response
    ) => {


        const { productId, conversationId } = req.body

        const file = req.file

        if (!productId) {
            throw new Error(
                "productId is required"
            );
        }

        if (!file) {
            throw new Error(
                "Audio file is required"
            );
        }
        const transcript = await this.speechToTextService.transcribe(file.path)



        const result =
            await this.voiceService.processVoice({
                productId,
                conversationId,
                transcript,
            }
            );

        return res.status(200).json({
            success: true,
            data: result,
        });
    };
}