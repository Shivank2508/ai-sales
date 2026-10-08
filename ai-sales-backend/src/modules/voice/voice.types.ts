import { AgentChannel } from "../agent/agent.types";

export { AgentChannel };


export interface VoiceRequest {
    productId?: string;
    conversationId?: string;
    transcript: string;
    channel?: AgentChannel;
    leadId?: string;
    campaignId?: string;
    surveySessionId?: string;
}

export interface VoiceResponse {
    conversationId: string;

    transcript: string;

    answer: string;

    audioBase64: string;

    mimeType: string;

    tool?: string;

    toolResult?: unknown;

    durationMS?: number;
}