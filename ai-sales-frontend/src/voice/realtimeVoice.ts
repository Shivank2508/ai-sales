import { RealtimeAudioPlayer } from "./RealtimeAudioPlayer"

export interface RealtimeVoiceCallbacks {
    onReady?: (conversationId: string) => void
    onTranscript?: (text: string, isFinal: boolean) => void
    onThinking?: () => void
    onAnswer?: (text: string) => void
    onAudio?: (audioBase64: string, mimeType: string) => void
    onDone?: () => void
    onError?: (error: string) => void
    onInterrupt?: () => void
}

export class RealtimeVoiceClient {
    private readonly callbacks: RealtimeVoiceCallbacks;
    private socket?: WebSocket;
    private audioContext?: AudioContext;
    private microphoneStream?: MediaStream;
    private workletNode?: AudioWorkletNode;
    private sourceNode?: MediaStreamAudioSourceNode;
    private conversationId?: string
    private readonly audioPlayer = new RealtimeAudioPlayer();
    private sessionReady = false

    constructor(
        callbacks: RealtimeVoiceCallbacks = {}
    ) {
        this.callbacks = callbacks;
    }
    async initializeAudio(): Promise<void> {
        await this.audioPlayer.initialize();
    }

    async connect(productID: string, conversationId?: string, languageCode = "en-IN"): Promise<void> {
        this.conversationId = conversationId
        this.sessionReady = false

        this.socket = new WebSocket("ws://localhost:8000/api/voice/realtime")

        const readyPromise = new Promise<void>((resolve, reject) => {
            if (!this.socket) {
                reject(new Error("WebSocket not created"))
                return
            }

            this.socket.onmessage = (event) => {
                this.handleMessage(event.data)

                try {
                    const message = JSON.parse(event.data)
                    if (message.type === "ready") {
                        resolve()
                    }
                    if (message.type === "error") {
                        reject(new Error(message.message))
                    }
                } catch {
                    reject(new Error("Invalid realtime server message"))
                }
            }

            this.socket.onclose = () => {
                reject(new Error("Voice session closed before it was ready"))
                console.log("[voice] WebSocket disconnected")
            }
        })

        await new Promise<void>((resolve, reject) => {
            if (!this.socket) {
                reject(new Error("WebSocket not created"))
                return
            }
            this.socket.onopen = () => {
                console.log("[voice] WebSocket connected; starting session")
                this.socket?.send(JSON.stringify({
                    type: "start",
                    productId: productID,
                    conversationId,
                    languageCode
                }))
                resolve()
            }

            this.socket.onerror = () => {
                console.error("[voice] WebSocket connection failed")
                reject(
                    new Error("WebSocket connection failed")
                )
            }

        })

        await readyPromise
    }


    private async handleMessage(raw: string): Promise<void> {
        try {
            const message = JSON.parse(raw)
            console.log("[voice] received", message.type, message)
            switch (message.type) {
                case "ready":
                    this.sessionReady = true
                    this.conversationId = message.conversationId || undefined
                    this.callbacks.onReady?.(message.conversationId)
                    break

                case "transcript":
                    this.callbacks.onTranscript?.(message.text, message.final);
                    break

                case "thinking":
                    this.audioPlayer.reset();
                    this.callbacks.onThinking?.()
                    break

                case "answer":
                    this.callbacks.onAnswer?.(message.text);
                    break;

                case "audio":
                    this.callbacks.onAudio?.(message.audio, message.mimeType);
                    await this.audioPlayer.playChunk(message.audio)
                    break

                case "done":
                    this.callbacks.onDone?.()
                    break

                case "interrupt":
                    this.audioPlayer.stop()
                    this.callbacks.onInterrupt?.()
                    break

                case "error":
                    console.error("[voice] server error", message.message)
                    this.callbacks.onError?.(message.message)
                    break

                default:
                    console.warn("[voice] unknown server message", message)
            }
        } catch (err) {
            console.error(
                "Invalid realtime message",
                err
            );
        }

    }


    async startMicrophone(): Promise<void> {
        if (!this.socket) {
            throw new Error("WebSocket is not connected")
        }

        if (!this.sessionReady) {
            throw new Error("Voice session is not ready yet")
        }

        if (!navigator.mediaDevices?.getUserMedia) {
            throw new Error("Microphone access is not supported in this browser");
        }

        try {
            this.microphoneStream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    channelCount: 1,
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true
                }
            });
        } catch (initialErr) {
            console.warn("[voice] Retrying getUserMedia with basic audio constraints...", initialErr);
            try {
                this.microphoneStream = await navigator.mediaDevices.getUserMedia({
                    audio: true
                });
            } catch (fallbackErr) {
                console.error("[voice] getUserMedia failed:", fallbackErr);
                const devices = await navigator.mediaDevices.enumerateDevices().catch(() => []);
                const hasMic = devices.some(d => d.kind === "audioinput");

                if (!hasMic) {
                    throw new Error("No microphone hardware found. Please connect a microphone/headphones and check macOS System Settings > Sound > Input.");
                }

                throw new Error("Microphone device not found or access denied. Please check browser site settings and macOS System Settings > Privacy & Security > Microphone.");
            }
        }

        this.audioContext = new AudioContext({ sampleRate: 16000 })

        await this.audioContext.audioWorklet.addModule("/src/voice/pcmProcessor.worklet.js")

        this.workletNode = new AudioWorkletNode(
            this.audioContext,
            "pcm-processor"
        )

        this.sourceNode = this.audioContext.createMediaStreamSource(this.microphoneStream)

        this.workletNode.port.onmessage = (event) => {
            const float32Samples = event.data as Float32Array

            const pcm16 = this.floatToPCM16(float32Samples)

            const base64 = this.arrayBufferToBase64(
                pcm16.buffer
            );
            this.sendAudio(
                base64
            );
        }
        this.sourceNode.connect(
            this.workletNode
        );
        console.log("[voice] microphone started")
    }

    private sendAudio(audioBase64: string) {
        if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
            return
        }

        this.socket.send(JSON.stringify({ type: "audio", audio: audioBase64 }))
    }

    stopMicrophone() {
        this.workletNode?.disconnect();
        this.sourceNode?.disconnect();
        this.microphoneStream?.getTracks().forEach(track => track.stop())
        this.audioContext?.close()
        this.workletNode = undefined
        this.sourceNode = undefined
        this.microphoneStream = undefined
        this.audioContext = undefined
    }

    stopSpeaking() {
        if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
            return
        }

        this.socket.send(
            JSON.stringify({
                type: "stop",
            })
        );
    }

    interrupt() {
        this.audioPlayer.stop()
        if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
            return
        }
        this.socket.send(
            JSON.stringify({
                type: "interrupt"
            })
        )
    }

    disconnect() {
        this.stopMicrophone();
        this.audioPlayer.stop();
        this.socket?.close();
        this.socket = undefined
    }

    getConversationId() {
        return this.conversationId
    }

    private floatToPCM16(input: Float32Array): Int16Array {
        const output = new Int16Array(input.length)

        for (let i = 0; i < input.length; i++) {
            const sample = Math.max(-1, Math.min(1, input[i]))
            output[i] = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
        }
        return output
    }


    private arrayBufferToBase64(buffer: ArrayBufferLike): string {
        const bytes = new Uint8Array(buffer)

        let binary = "";
        const chunkSize = 0x8000;

        for (let i = 0; i < bytes.length; i += chunkSize) {
            const chunk = bytes.subarray(i, i + chunkSize)
            binary += String.fromCharCode(...chunk)
        }

        return btoa(binary)

    }

}