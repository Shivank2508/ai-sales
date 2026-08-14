import { Request, Response } from "express";
import { VoiceService } from "./voice.service";

export class VoiceController {

    constructor(
        private readonly voiceService =
            new VoiceService()
    ) { }

    processVoice = async (
        req: Request,
        res: Response
    ) => {

        const result =
            await this.voiceService.processVoice(
                req.body
            );

        return res.status(200).json({
            success: true,
            data: result,
        });
    };
}