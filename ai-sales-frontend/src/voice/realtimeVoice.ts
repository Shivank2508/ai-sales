export interface RealtimeVoiceCallbacks {
    onReady?: (conversationId: string) => void
    onTranscript?: (text: string, isFinal: boolean) => void
    onThinking?: () => void
    onAnswer?: (text: string) => void
    onAudio?: (audioBase64: string, mimeType: string) => void
    onDone?: () => void
    onError?: (error: string) => void
}

export class RealtimeVoiceClient {
    private socket?: WebSocket;
    private audioContext?: AudioContext;
    private microphoneStream?: MediaStream;
    private workletNode?: AudioWorkletNode;
    private sourceNode?: MediaStreamAudioSourceNode;
    private conversationId?: string

    constructor(
        private readonly callbacks:
            RealtimeVoiceCallbacks = {}
    ) { }

    async connect(productID: string, conversationId?: string, languageCode = "hi-IN"): Promise<void> {
        this.conversationId = conversationId

        this.socket = new WebSocket("ws://localhost:8000/api/voice/realtime")

        await new Promise<void>((resolve, reject) => {
            if (!this.socket) {
                reject(new Error("WebSocket not created"))
                return
            }
            this.socket.onopen = () => {
                this.socket?.send(JSON.stringify({
                    type: "start",
                    productID,
                    conversationId,
                    languageCode
                }))
                resolve()
            }

            this.socket.onerror = () => {
                reject(
                    new Error("WebSocket connection failed")
                )
            }

        })

        this.socket.onmessage = (event) => {
            this.handleMessage(event.data)
        }

        this.socket.onclose = () => {

            console.log(
                "Realtime voice disconnected"
            );
        };
    }


    private handleMessage(raw: string) {
        try {
            const message = JSON.parse(raw)
            switch (message.type) {
                case "ready":
                    this.conversationId = message.conversationId || undefined
                    this.callbacks.onReady?.(message.conversationId)
                    break

                case "transcript":
                    this.callbacks.onTranscript?.(message.text, message.final);
                    break

                case "thinking":
                    this.callbacks.onThinking?.()
                    break

                case "answer":
                    this.callbacks.onAudio?.(message.audio, message.mimeType);
                    break

                case "done":
                    this.callbacks.onDone?.()
                    break

                case "error":
                    this.callbacks.onError?.(message.message)
                    break
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

        this.microphoneStream = await navigator.mediaDevices.getUserMedia({
            audio: {
                channelCount: 1,
                echoCancellation: true,
                noiseSuppression: true,
                autoGainControl: true
            }
        })

        this.audioContext = new AudioContext({ sampleRate: 16000 })

        await this.audioContext.audioWorklet.addModule("/src/voice/pcmProcessor.worklet.js")


        this.sourceNode = this.audioContext.createMediaStreamSource(this.microphoneStream)

        this.workletNode.port.onmessage = (event) => {
            const float32Samples = event.data as Float32Array

            const pcm16 = new this.floatToPCM16(float32Samples)

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
        this.microphoneStream?.getTracks().forEach(track => track.stop)
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
        this.startMicrophone();
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


    private arrayBufferToBase64(buffer: ArrayBuffer): string {
        const bytes = new Uint16Array(buffer)

        let binary = "";
        const chunkSize = 0x8000;

        for (let i = 0; i < bytes.length; i += chunkSize) {
            const chunk = bytes.subarray(i, i + chunkSize)
            binary += String.fromCharCode(...chunk)
        }

        return btoa(binary)

    }
}