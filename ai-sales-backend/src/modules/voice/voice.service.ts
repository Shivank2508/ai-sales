import { AgentService } from "../agent/agent.service";
import { VoiceRequest, VoiceResponse } from "./voice.types";

export class VoiceService {
    constructor(
        private readonly agentService = new AgentService()
    ) { }

    async processVoice(
        request: VoiceRequest
    ): Promise<VoiceResponse> {
        const { productId, conversationId, transcript } = request

        if (!productId) {
            throw new Error("productId is required");
        }

        if (!transcript?.trim()) {
            throw new Error("transcript is required");
        }

        const agentResponse = await this.agentService.run({
            productId, question: transcript, conversationId
        })

        return {
            conversationId:
                agentResponse.conversationId,

            transcript,

            answer:
                agentResponse.answer,

            tool:
                agentResponse.tool,

            toolResult:
                agentResponse.toolResult,
        };

    }
}