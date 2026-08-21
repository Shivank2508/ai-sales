class PCMProcessor extends AudioWorkletProcessor {
    process(inputs, outputs, parameters) {
        const input = inputs[0]
        if (input && input.length > 0) {
            const channel = input[0]
            if (channel) {
                const buffer = new Float32Array(channel)
                this.port.postMessage(buffer)
            }

        }

        return true
    }
}

registerProcessor("pcm-processor", PCMProcessor)