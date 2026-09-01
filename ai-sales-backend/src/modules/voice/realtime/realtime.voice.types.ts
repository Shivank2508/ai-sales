import { VoiceLatencyResult } from "./voice-latency.types";

export type RealtimeClientMessage = | {
    type: "start";
    productId: string;
    conversationId?: string;
    languageCode?: string;
}
    | {
        type: "audio";
        audio: string;
    }
    | {
        type: "stop";
    } | {
        type: "interrupt";
    };


export type RealtimeServerMessage = | {
    type: "ready";
    conversationId: string;
} | {
    type: "transcript";
    text: string;
    final: boolean;
} | {
    type: "thinking"
} | {
    type: "answer";
    text: string
} | {
    type: "audio";
    audio: string;
    mimeType: string
} | {
    type: "error";
    message: string;
} | {
    type: "done"
    latency?: VoiceLatencyResult;
} | {
    type: "interrupt";
};


