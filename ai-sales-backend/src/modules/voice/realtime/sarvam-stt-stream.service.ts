import WebSocket from "ws";

interface SarvamSTTStreamOptions {
    languageCode: string;
    onTranscript: (
        transcript: string,
        isFinal: boolean
    ) => void;
    onSpeechStart?: () => void;
    onSpeechEnd?: () => void;
    onError?: (
        error: Error
    ) => void;
}


export class SarvamSTTStreamService {
    private socket?: WebSocket

    constructor(
        private readonly options: SarvamSTTStreamOptions
    ) { }


    connect(): Promise<void> {
        const apiKey = process.env.SARVAM_API_KEY;

        if (!apiKey) {
            throw new Error(
                "SARVAM_API_KEY is not configured"
            );
        }

        const params = new URLSearchParams({
            "language-code": this.options.languageCode,
            model: "saaras:v3",
            mode: "transcribe",
            sample_rate: "16000",
            high_vad_sensitivity: "true",
            vad_signals: "true",
        })

        return new Promise((resolve, reject) => {
            this.socket = new WebSocket(`wss://api.sarvam.ai/speech-to-text/ws?${params.toString()}`,
                {
                    headers: {
                        "Api-Subscription-Key": apiKey,
                    }
                }
            );

            this.socket.once("open", () => {
                console.log("Sarvam STT connected");
                resolve();
            });

            this.socket.once("error", (error) => {
                this.options.onError?.(error);
                reject(error);
            });

            this.socket.on("message", (raw) => {
            try {
                const message = JSON.parse(raw.toString())
                if (message.type === "data") {
                    const transcript = message.data?.transcript;
                    if (transcript) {
                        this.options.onTranscript(transcript, true)
                    }
                }

                if (message.type === "events") {
                    const signal = message.data?.signal_type

                    if (signal === "START_SPEECH") {
                        this.options.onSpeechStart?.()
                    }
                    if (signal === "END_SPEECH") {
                        this.options.onSpeechEnd?.()
                    }
                }
            } catch (error) {

                this.options
                    .onError?.(
                        error instanceof Error
                            ? error
                            : new Error(
                                "Invalid Sarvam STT message"
                            )
                    );
            }
            });
        });
    }

    sendAudio(audioBase64: string) {
        if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
            console.warn("STT audio skipped: Sarvam STT is not connected");
            return;
        }

        this.socket.send(JSON.stringify({
            audio: {
                data: audioBase64,
                sample_rate: 16000,
                encoding: "audio/wav"
            }
        }))
    }


    flush() {

        if (
            !this.socket ||
            this.socket.readyState !==
            WebSocket.OPEN
        ) {
            return;
        }

        this.socket.send(
            JSON.stringify({
                type: "flush",
            })
        );
    }

    close() {
        this.socket?.close();
        this.socket = undefined;
    }


}