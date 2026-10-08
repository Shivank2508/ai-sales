import React, { useState, useEffect, useRef } from "react";
import { Mic, MicOff, Volume2, Bot, Sparkles, Send, PhoneOff, PhoneCall, AlertCircle, CheckCircle2 } from "lucide-react";
import { RealtimeVoiceClient } from "./realtimeVoice";
import { RealtimeAudioPlayer } from "./RealtimeAudioPlayer";
import { agentApi } from "../modules/ai-agents/api/agentApi";

interface VoiceAssistantProps {
  productId: string;
  productName?: string;
  leadId?: string;
}

export const VoiceAssistant: React.FC<VoiceAssistantProps> = ({
  productId,
  productName = "Product",
  leadId,
}) => {
  const [mode, setMode] = useState<"voice" | "chat">("voice");
  const [isConnected, setIsConnected] = useState(false);
  const [isTalking, setIsTalking] = useState(false);
  const [aiState, setAiState] = useState<"idle" | "listening" | "thinking" | "speaking">("idle");
  const [transcript, setTranscript] = useState<string>("");
  const [conversationHistory, setConversationHistory] = useState<
    Array<{ role: "user" | "assistant" | "system"; text: string; time: string }>
  >([]);
  const [chatInput, setChatInput] = useState("");
  const [isSendingChat, setIsSendingChat] = useState(false);
  const [conversationId, setConversationId] = useState<string | undefined>(undefined);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const voiceClientRef = useRef<RealtimeVoiceClient | null>(null);
  const audioPlayerRef = useRef<RealtimeAudioPlayer | null>(null);

  const handleStartVoice = async () => {
    try {
      setErrorMessage(null);
      setAiState("listening");

      const player = new RealtimeAudioPlayer();
      await player.initialize();
      audioPlayerRef.current = player;

      const client = new RealtimeVoiceClient({
        onReady: (cid) => {
          setIsConnected(true);
          setConversationId(cid);
          setConversationHistory((prev) => [
            ...prev,
            { role: "system", text: "Connected to AI Realtime Voice Server", time: new Date().toLocaleTimeString() },
          ]);
        },
        onTranscript: (text, isFinal) => {
          setTranscript(text);
          if (isFinal) {
            setConversationHistory((prev) => [
              ...prev,
              { role: "user", text, time: new Date().toLocaleTimeString() },
            ]);
            setTranscript("");
          }
        },
        onThinking: () => {
          setAiState("thinking");
        },
        onAnswer: (text) => {
          setConversationHistory((prev) => [
            ...prev,
            { role: "assistant", text, time: new Date().toLocaleTimeString() },
          ]);
        },
        onAudio: async (audioBase64) => {
          setAiState("speaking");
          if (audioPlayerRef.current) {
            await audioPlayerRef.current.playChunk(audioBase64);
          }
        },
        onDone: () => {
          setAiState("listening");
        },
        onError: (err) => {
          setErrorMessage(err);
          setAiState("idle");
        },
      });

      await client.connect(productId, conversationId, "en-IN");
      await client.startMicrophone();
      voiceClientRef.current = client;
      setIsTalking(true);
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || "Failed to start microphone or connect to voice server.");
      setIsTalking(false);
      setAiState("idle");
    }
  };

  const handleStopVoice = () => {
    voiceClientRef.current?.disconnect();
    audioPlayerRef.current?.close();
    voiceClientRef.current = null;
    audioPlayerRef.current = null;
    setIsTalking(false);
    setIsConnected(false);
    setAiState("idle");
  };

  const handleSendTextMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || isSendingChat) return;

    const userMsg = chatInput.trim();
    setChatInput("");
    setConversationHistory((prev) => [
      ...prev,
      { role: "user", text: userMsg, time: new Date().toLocaleTimeString() },
    ]);
    setIsSendingChat(true);

    try {
      const res = await agentApi.sendChatMessage({
        message: userMsg,
        productId,
        productID: productId,
        conversationId,
        leadId,
      });

      if (res.conversationId) {
        setConversationId(res.conversationId);
      }

      setConversationHistory((prev) => [
        ...prev,
        {
          role: "assistant",
          text: res.reply || "I'm processing your inquiry based on our product knowledge.",
          time: new Date().toLocaleTimeString(),
        },
      ]);
    } catch (err: any) {
      setConversationHistory((prev) => [
        ...prev,
        {
          role: "system",
          text: `Error: ${err.message || "Could not reach agent service"}`,
          time: new Date().toLocaleTimeString(),
        },
      ]);
    } finally {
      setIsSendingChat(false);
    }
  };

  useEffect(() => {
    return () => {
      voiceClientRef.current?.disconnect();
      audioPlayerRef.current?.close();
    };
  }, []);

  return (
    <div className="card shadow-sm border p-4">
      {/* Top Header */}
      <div className="d-flex justify-content-between align-items-center mb-3">
        <div className="d-flex align-items-center gap-2">
          <div className="p-2 bg-primary-subtle text-primary rounded-3">
            <Bot size={22} />
          </div>
          <div>
            <h6 className="fw-bold mb-0 text-dark">Live AI Sales Agent ({productName})</h6>
            <span className="text-muted small" style={{ fontSize: "11px" }}>
              Powered by backend LangGraph & WebSocket Voice Engine
            </span>
          </div>
        </div>

        <div className="btn-group btn-group-sm">
          <button
            className={`btn ${mode === "voice" ? "btn-primary" : "btn-outline-secondary"}`}
            onClick={() => setMode("voice")}
          >
            Voice Call
          </button>
          <button
            className={`btn ${mode === "chat" ? "btn-primary" : "btn-outline-secondary"}`}
            onClick={() => setMode("chat")}
          >
            Text Chat
          </button>
        </div>
      </div>

      {errorMessage && (
        <div className="alert alert-danger p-2 small mb-3 d-flex align-items-center gap-2" role="alert">
          <AlertCircle size={16} />
          <span>{errorMessage}</span>
        </div>
      )}

      {mode === "voice" ? (
        <div className="d-flex flex-column align-items-center text-center my-3 gap-3">
          {/* Visual Avatar */}
          <div
            className={`rounded-circle p-4 text-white d-flex align-items-center justify-content-center shadow-lg transition-all ${
              isTalking
                ? aiState === "speaking"
                  ? "bg-primary pulse-speaking"
                  : aiState === "thinking"
                  ? "bg-warning"
                  : "bg-success"
                : "bg-secondary"
            }`}
            style={{ width: "90px", height: "90px" }}
          >
            {isTalking ? <Mic size={40} /> : <MicOff size={40} />}
          </div>

          <div>
            <h6 className="fw-bold mb-1">
              {isTalking
                ? aiState === "speaking"
                  ? "AI Speaking..."
                  : aiState === "thinking"
                  ? "AI Thinking & Retrieving Context..."
                  : "Listening to your voice..."
                : "Voice Assistant Ready"}
            </h6>
            <span className="text-muted small">
              {isTalking ? `WebSocket Active • Target: ${productName}` : "Click below to begin live voice conversation"}
            </span>
          </div>

          {transcript && (
            <div className="p-2 bg-light border rounded small w-100 text-start text-secondary">
              <em>"{transcript}"</em>
            </div>
          )}

          <div>
            {!isTalking ? (
              <button
                className="btn btn-success btn-lg d-flex align-items-center gap-2 shadow-sm px-4"
                onClick={handleStartVoice}
              >
                <PhoneCall size={20} />
                <span>Start AI Voice Call</span>
              </button>
            ) : (
              <button
                className="btn btn-danger btn-lg d-flex align-items-center gap-2 shadow-sm px-4"
                onClick={handleStopVoice}
              >
                <PhoneOff size={20} />
                <span>End Call</span>
              </button>
            )}
          </div>
        </div>
      ) : (
        /* Text Chat UI */
        <div className="d-flex flex-column gap-2">
          <div
            className="p-3 bg-light border rounded-3 overflow-y-auto d-flex flex-column gap-2"
            style={{ height: "260px" }}
          >
            {conversationHistory.length === 0 ? (
              <div className="text-center text-muted small my-auto">
                <Sparkles size={24} className="mx-auto mb-1 opacity-50" />
                <span>Ask questions about pricing, objections, features or qualification.</span>
              </div>
            ) : (
              conversationHistory.map((msg, idx) => (
                <div
                  key={idx}
                  className={`p-2 rounded-3 small max-w-75 ${
                    msg.role === "user"
                      ? "bg-primary text-white ms-auto text-end"
                      : msg.role === "assistant"
                      ? "bg-white border text-dark me-auto text-start"
                      : "bg-light-subtle text-muted mx-auto text-center font-monospace"
                  }`}
                  style={{ maxWidth: "80%" }}
                >
                  <div className="fw-bold mb-0" style={{ fontSize: "10px", opacity: 0.8 }}>
                    {msg.role.toUpperCase()} • {msg.time}
                  </div>
                  <div>{msg.text}</div>
                </div>
              ))
            )}
          </div>

          <form onSubmit={handleSendTextMessage} className="input-group">
            <input
              type="text"
              className="form-control form-control-sm"
              placeholder="Type message to AI sales agent..."
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              disabled={isSendingChat}
            />
            <button className="btn btn-primary btn-sm d-flex align-items-center gap-1" disabled={isSendingChat}>
              {isSendingChat ? <span className="spinner-border spinner-border-sm"></span> : <Send size={14} />}
              <span>Send</span>
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
