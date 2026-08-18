import { WebSocket } from "ws";


interface SarvamTTSStreamOptions {
    languageCode: string;
    speaker?: string;
    onAudio: (
        audioBase64: string,
        contentType: string
    ) => void;
    onComplete?: () => void;
    onError?: (error: Error) => void;
}

export class SarvamTTSStreamService {
    private socket?: WebSocket
    private configured = false

    constructor(
        private readonly options: SarvamTTSStreamOptions
    ) { }

    connect(): void {
        const apiKey = process.env.SARVAM_API_KEY;
        if (!apiKey) {
            throw new Error(
                "SARVAM_API_KEY is not configured"
            );
        }

        const params = new URLSearchParams({
            model: "bulbul:v3",

            send_completion_event:
                "true",
        })

        this.socket = new WebSocket(`wss://api.sarvam.ai/text-to-speech/ws?${params.toString()}`,
            {
                headers: {
                    "Api-Subscription-Key":
                        apiKey,
                },
            }
        )

        this.socket.on("open", () => {
            this.configure();
        })

        this.socket.on("message", (raw) => {
            this.handleMessage(raw.toString())
        })

        this.socket.on(
            "error",
            (error) => {
                this.options.onError?.(error);
            }
        );

        this.socket.on("close", () => {
            this.configured = false
        })
    }


    private configure(): void {
        if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
            return;
        }


        this.socket.send(JSON.stringify({
            type: "config",
            data: {
                target_language_code: this.options.languageCode,
                speaker: this.options.speaker ?? "shubh",
                pace: 1.0,
                temperature: 0.6,
            }
        }))
    }
}