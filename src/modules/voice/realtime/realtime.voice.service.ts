import { AgentService } from "../../agent/agent.service";

export class RealtimeVoiceService {
    constructor(
        private readonly agentService = new AgentService()
    ) { }

    async generateAnswer(productId: string, transcript: string, conversationId?: string) {
        if (!productId) {
            throw new Error(
                "productId is required"
            );
        }

        if (!transcript.trim()) {
            throw new Error(
                "Transcript is required"
            );
        }
        return this.agentService.run({
            productId,
            question: transcript.trim(),
            conversationId,
            channel: "VOICE",
        });


    }
}