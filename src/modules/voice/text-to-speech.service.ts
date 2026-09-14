import { SarvamAIClient } from "sarvamai";

export interface TextToSpeechResult {
    audioBase64: string;
    mimeType: string;
}

export class TextToSpeechService {

    private readonly client: SarvamAIClient;

    constructor() {
        const apiKey = process.env.SARVAM_API_KEY;

        if (!apiKey) {
            throw new Error(
                "SARVAM_API_KEY is not configured"
            );
        }

        this.client = new SarvamAIClient({
            apiSubscriptionKey: apiKey,
        });
    }

    async synthesize(
        text: string
    ): Promise<TextToSpeechResult> {

        const cleanText = text?.trim();

        if (!cleanText) {
            throw new Error(
                "Text is required for speech synthesis"
            );
        }

        const response =
            await this.client.textToSpeech.convert({
                model: "bulbul:v3",
                text: cleanText,
                language_code: "hi-IN",
                speaker: "ritu"
            });


        const audioBase64 = response.audios?.[0];

        if (!audioBase64) {
            throw new Error(
                "Sarvam TTS returned no audio"
            );
        }

        return {
            audioBase64,
            mimeType: "audio/wav",
        };
    }
}