export interface VoiceLatencyMetrics {

    speechStartAt?: number;
    speechEndAt?: number;

    transcriptReceivedAt?: number;

    agentStartAt?: number;
    agentEndAt?: number;

    ttsStartAt?: number;
    firstAudioAt?: number;

    turnCompletedAt?: number;
}

export interface VoiceLatencyResult {

    speechToTranscriptMs?: number;

    transcriptToAgentMs?: number;

    agentDurationMs?: number;

    agentToTtsMs?: number;

    ttsFirstAudioMs?: number;

    totalResponseMs?: number;
}