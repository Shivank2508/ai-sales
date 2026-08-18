import { AgentService } from "../agent/agent.service";
import { TextToSpeechService } from "./text-to-speech.service";
import { VoiceRequest, VoiceResponse } from "./voice.types";

export class VoiceService {
    constructor(
        private readonly agentService = new AgentService(),
        private readonly textToSpeechService =
            new TextToSpeechService()
    ) { }

    async processVoice(
        request: VoiceRequest
    ): Promise<VoiceResponse> {
        const startTime = Date.now();
        const { productId, conversationId, transcript } = request


        if (!productId) {
            throw new Error("productId is required");
        }

        if (!transcript?.trim()) {
            throw new Error("transcript is required");
        }

        const agentResponse =
            await this.agentService.run({
                productId,
                question: transcript.trim(),
                conversationId,
                channel: "VOICE",
            });
        const speech =
            await this.textToSpeechService.synthesize(
                agentResponse.answer
            );
        const durationMS =
            Date.now() - startTime;
        return {
            conversationId:
                agentResponse.conversationId,

            transcript:
                transcript.trim(),

            answer:
                agentResponse.answer,

            audioBase64:
                speech.audioBase64,

            mimeType:
                speech.mimeType,

            tool:
                agentResponse.tool,

            toolResult:
                agentResponse.toolResult,

            durationMS,
        };

    }
}