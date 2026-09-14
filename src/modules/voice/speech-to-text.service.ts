import fs from "fs";
import { SarvamAIClient } from "sarvamai";

export class SpeachToText {

    private readonly client: SarvamAIClient

    constructor() {
        if (!process.env.SARVAM_API_KEY) {
            throw new Error(
                "SARVAM_API_KEY is not configured"
            );
        }
        this.client = new SarvamAIClient({
            apiSubscriptionKey: process.env.SARVAM_API_KEY
        })
    }

    async transcribe(filePath: string): Promise<string> {
        if (!filePath) {
            throw new Error(
                "Audio file path is required"
            );
        }
        if (!fs.existsSync(filePath)) {
            throw new Error(
                `Audio file not found: ${filePath}`
            );
        }
        const audioFile = fs.createReadStream(filePath);

        const response = await this.client.speechToText.transcribe({
            file: audioFile,
            model: "saaras:v3",
            mode: "transcribe"
        })


        return response.transcript
    }
}