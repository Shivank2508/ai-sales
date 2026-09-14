import { VoiceLatencyMetrics, VoiceLatencyResult } from "./voice-latency.types";

export class VoiceLatencyService {

    createMetrics(): VoiceLatencyMetrics {

        return {};
    }

    calculate(
        metrics: VoiceLatencyMetrics
    ): VoiceLatencyResult {

        return {
            speechToTranscriptMs:
                this.diff(
                    metrics.speechStartAt,
                    metrics.transcriptReceivedAt
                ),

            transcriptToAgentMs:
                this.diff(
                    metrics.transcriptReceivedAt,
                    metrics.agentStartAt
                ),

            agentDurationMs:
                this.diff(
                    metrics.agentStartAt,
                    metrics.agentEndAt
                ),

            agentToTtsMs:
                this.diff(
                    metrics.agentEndAt,
                    metrics.ttsStartAt
                ),

            ttsFirstAudioMs:
                this.diff(
                    metrics.ttsStartAt,
                    metrics.firstAudioAt
                ),

            totalResponseMs:
                this.diff(
                    metrics.speechEndAt,
                    metrics.firstAudioAt
                ),
        };
    }

    private diff(
        start?: number,
        end?: number
    ): number | undefined {

        if (
            start === undefined ||
            end === undefined
        ) {
            return undefined;
        }

        return Math.max(
            0,
            end - start
        );
    }
}