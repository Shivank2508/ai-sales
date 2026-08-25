export class RealtimeAudioPlayer {
    private audioContext?: AudioContext

    private nextStartTime = 0
    private activeSources = new Set<AudioBufferSourceNode>()

    private stopped = false

    async initialize(): Promise<void> {
        if (!this.audioContext) {
            this.audioContext = new AudioContext({ sampleRate: 24000 })
        }

        if (this.audioContext.state === "suspended") {
            await this.audioContext.resume()
        }

        this.nextStartTime = this.audioContext.currentTime
    }

    async playChunk(audioBase64: string): Promise<void> {
        if (!audioBase64) {
            return
        }

        if (this.stopped) {
            return
        }

        const audioBytes = this.base64ToUint8Array(audioBase64)
        const audioBuffer = await this.decodeAudio(audioBytes)

        if (this.stopped || !this.audioContext) {
            return
        }

        const source = this.audioContext.createBufferSource()
        source.buffer = audioBuffer

        source.connect(this.audioContext.destination)

        const currentTime = this.audioContext.currentTime
        const startTime = Math.max(currentTime, this.nextStartTime)

        source.start(startTime)

        this.nextStartTime = startTime + audioBuffer.duration

        this.activeSources.add(source)

        source.onended = () => {
            this.activeSources.delete(source)
        }
    }


    stop(): void {
<<<<<<< HEAD
        this.stopped = true;

        for (const source of this.activeSources) {
            try {
                source.stop(0);
            } catch {
                // Source may already be stopped
            }
        }

        this.activeSources.clear();

        if (this.audioContext) {
            this.nextStartTime = this.audioContext.currentTime;
=======
        this.stopped = true
        for (const source of this.activeSources) {
            try {
                source.stop()
            } catch {
                // Already stopped
            }
        }

        this.activeSources.clear()

        if (this.audioContext) {
            this.nextStartTime = this.audioContext.currentTime
>>>>>>> 536550350b4b35da11339aaac92e7790d49ece96
        }
    }

    reset(): void {
        this.stop();
        this.stopped = false;
        if (this.audioContext) {
            this.nextStartTime = this.audioContext.currentTime
        }
    }

    async close(): Promise<void> {
        this.stop()

        if (this.audioContext) {
            await this.audioContext.close()

            this.audioContext = undefined

        }
    }
    private base64ToUint8Array(base64: string): Uint8Array {
        const binary = window.atob(base64)
        const bytes = new Uint8Array(binary.length)
        for (let i = 0; i < binary.length; i++) {
            bytes[i] = binary.charCodeAt(i)
        }
        return bytes
    }

    private decodeAudio(bytes: Uint8Array): Promise<AudioBuffer> {
        if (!this.audioContext) {
            throw Error("Audio context is not initialized ")
        }

        const buffer = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer

        return this.audioContext.decodeAudioData(buffer)

    }
}