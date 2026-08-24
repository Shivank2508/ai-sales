import { useRef, useState } from "react";
import { RealtimeVoiceClient } from './voice/realtimeVoice';

function App() {
  const clientRef = useRef<RealtimeVoiceClient | null>(null);
  const [connected, setConnected] = useState(false)

  const [transcript, setTranscript] = useState<string>("")
  const [interimTranscript, setInterimTranscript] = useState<string>("")
  const [answer, setAnswer] = useState("")
  const [error, setError] = useState("")


  const connect = async () => {
    setError("")
    try {
      const client = new RealtimeVoiceClient({
        onReady: (conversationId) => {
          console.log("conversation", conversationId)
        },
        onTranscript: (text, isFinal) => {
          console.log("transcript", text, isFinal)
          if (isFinal) {
            setTranscript((current) => {
              const currentText = current.trim()
              const nextText = text.trim()

              if (!currentText || currentText === nextText) return nextText
              if (nextText.startsWith(currentText)) return nextText
              if (currentText.endsWith(nextText)) return currentText
              return `${currentText} ${nextText}`
            })
            setInterimTranscript("")
          } else {
            setInterimTranscript(text)
          }
        },
        onThinking: () => {
          console.log("AI thinking...");
        },
        onAnswer: (text) => {
          setAnswer(text)
        },
        onAudio: (audio, mimeType) => {
          console.log("received Audio", mimeType, audio)
        },
        onDone: () => {
          console.log("Turn Complete")
        },
        onError: (err) => {
          console.error("voice error", err)
          setError(err)
        }
      })
      await client.connect("6a6b258d3e6ed4dfa7cc579c", undefined, "en-IN")
      await client.initializeAudio()
      await client.startMicrophone()
      clientRef.current = client
      setConnected(true)
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to start voice"
      console.error("voice startup error", err)
      setError(message)
    }
  }


  const disconnect = () => {
    clientRef.current?.disconnect()

    clientRef.current = null
    setConnected(false)
  }
  return (

    <div>
      {!connected ? <button onClick={connect}>start voice</button>
        :
        <button onClick={disconnect}>stop Voice</button>}

      <div>
        {error && <p role="alert">Error: {error}</p>}

        <strong>
          Transcript:
        </strong>

        <p>
          {[transcript, interimTranscript].filter(Boolean).join(" ") || "Listening..."}
        </p>
      </div>

      <div>
        <strong>
          AI:
        </strong>

        <p>
          {answer}
        </p>
      </div>

    </div>
  )
}

export default App
