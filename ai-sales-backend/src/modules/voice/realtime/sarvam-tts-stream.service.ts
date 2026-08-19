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
                output_audio_codec: "mp3",
                output_audio_bitrate: "128k",
                min_buffer_size: "50",
                max_chunk_length: 200
            }
        }))
        this.configured = true;
    }

    sendText(text: string): void {
        if (!text?.trim()) {
            return;
        }

        if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
            throw new Error(
                "Sarvam TTS WebSocket is not connected"
            );
        }
        if (!this.configured) {
            throw new Error(
                "Sarvam TTS WebSocket is not configured"
            );
        }
        this.socket.send(JSON.stringify({
            type: "text",
            data: {
                text: text.trim()
            }
        }))
    }


    flush(): void {
        if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
            return;
        }
        this.socket.send(
            JSON.stringify({
                type: "flush",
            })
        );

    }


    ping(): void {
        if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
            return;
        }

        this.socket.send(
            JSON.stringify({
                type: "ping",
            })
        );
    }

    close(): void {

        this.configured = false;

        this.socket?.close();

        this.socket =
            undefined;
    }


    private handleMessage(raw: string) {
        try {
            const message = JSON.parse(raw)

            if (message.type === "audio") {
                const audio = message.data?.audio
                const contentType = message.data?.content_type ?? "audio/mpeg"
                if (!audio) {
                    return;
                }

                this.options.onAudio(audio, contentType);
                return

            }

            if (message.type === "event") {
                const eventType = message.data?.event_type

                if (eventType === "completion") {
                    this.options.onComplete?.()
                }

                return

            }

            if (message.type === "error") {
                const errorMessage = message.error?.message ?? message.data?.message ?? "Sarvam TTS error";
                this.options.onError?.(
                    new Error(errorMessage)
                );
            }


        } catch (error) {

            this.options
                .onError?.(
                    error instanceof Error
                        ? error
                        : new Error(
                            "Invalid Sarvam TTS response"
                        )
                );
        }
    }
}