import React, { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useAIAgents } from "../hooks/useAgents";
import { useCampaigns } from "../../campaigns/hooks/useCampaigns";
import {
  ArrowLeft,
  Bot,
  Phone,
  PhoneCall,
  PhoneOff,
  User,
  Volume2,
  Mic,
  Sparkles,
  CheckCircle2,
  Clock,
  Layers,
} from "lucide-react";

export const AgentExecutionPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const { data: agents } = useAIAgents();
  const { data: campaigns } = useCampaigns();

  const [selectedAgentId, setSelectedAgentId] = useState(
    searchParams.get("agentId") || "agent-sarah-01"
  );
  const [selectedCampaignId, setSelectedCampaignId] = useState("camp-guard-01");

  // Call status: idle | connecting | active | completed
  const [callStatus, setCallStatus] = useState<"idle" | "connecting" | "active" | "completed">("idle");
  // AI State: listening | thinking | speaking
  const [aiState, setAiState] = useState<"listening" | "thinking" | "speaking">("listening");
  const [callDuration, setCallDuration] = useState(0);

  // Call timer
  useEffect(() => {
    let interval: any;
    if (callStatus === "active") {
      interval = setInterval(() => setCallDuration((prev) => prev + 1), 1000);
    } else {
      setCallDuration(0);
    }
    return () => clearInterval(interval);
  }, [callStatus]);

  // Simulate alternating speech
  useEffect(() => {
    let timeout: any;
    if (callStatus === "active") {
      const cycle = () => {
        setAiState("speaking");
        timeout = setTimeout(() => {
          setAiState("listening");
          timeout = setTimeout(() => {
            setAiState("thinking");
            timeout = setTimeout(() => {
              cycle();
            }, 1500);
          }, 4000);
        }, 5000);
      };
      cycle();
    }
    return () => clearTimeout(timeout);
  }, [callStatus]);

  const handleStartCall = () => {
    setCallStatus("connecting");
    setTimeout(() => {
      setCallStatus("active");
    }, 1500);
  };

  const handleEndCall = () => {
    setCallStatus("completed");
  };

  const selectedAgent = agents?.find((a) => a._id === selectedAgentId) || agents?.[0];
  const selectedCampaign = campaigns?.find((c) => c._id === selectedCampaignId) || campaigns?.[0];

  return (
    <div className="d-flex flex-column gap-3" style={{ maxWidth: "1000px", margin: "0 auto" }}>
      {/* Header */}
      <div className="card shadow-sm border">
        <div className="card-body p-3 d-flex justify-content-between align-items-center">
          <div className="d-flex align-items-center gap-2">
            <Link to="/ai-agents" className="btn btn-outline-secondary btn-sm p-1">
              <ArrowLeft size={16} />
            </Link>
            <div>
              <h1 className="h5 fw-bold mb-0 text-dark">AI Agent Live Execution Monitor</h1>
              <span className="text-muted small" style={{ fontSize: "11px" }}>
                Real-time WebSocket audio stream & conversational intent engine.
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Execution Console */}
      <div className="row g-3">
        {/* Left: Call Controller */}
        <div className="col-12 col-md-5">
          <div className="card shadow-sm border p-4 h-100 d-flex flex-column justify-content-between">
            <div>
              <h6 className="fw-bold small mb-3 text-secondary text-uppercase">Execution Parameters</h6>

              <div className="mb-3">
                <label className="form-label small fw-bold">Active AI Agent</label>
                <select
                  className="form-select form-select-sm"
                  value={selectedAgentId}
                  onChange={(e) => setSelectedAgentId(e.target.value)}
                  disabled={callStatus === "active"}
                >
                  {agents?.map((a) => (
                    <option key={a._id} value={a._id}>
                      {a.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mb-3">
                <label className="form-label small fw-bold">Target Campaign & Survey</label>
                <select
                  className="form-select form-select-sm"
                  value={selectedCampaignId}
                  onChange={(e) => setSelectedCampaignId(e.target.value)}
                  disabled={callStatus === "active"}
                >
                  {campaigns?.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mb-4">
                <label className="form-label small fw-bold">Test Customer Target</label>
                <input
                  type="text"
                  className="form-control form-control-sm"
                  defaultValue="Rahul Sharma (+91 98765 43210)"
                  disabled={callStatus === "active"}
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div>
              {callStatus === "idle" || callStatus === "completed" ? (
                <button
                  className="btn btn-success btn-lg w-100 d-flex align-items-center justify-content-center gap-2 shadow-sm"
                  onClick={handleStartCall}
                >
                  <PhoneCall size={20} />
                  <span>Initiate AI Call</span>
                </button>
              ) : callStatus === "connecting" ? (
                <button className="btn btn-warning btn-lg w-100 text-white" disabled>
                  <span className="spinner-border spinner-border-sm me-2"></span>
                  Connecting Call...
                </button>
              ) : (
                <button
                  className="btn btn-danger btn-lg w-100 d-flex align-items-center justify-content-center gap-2 shadow-sm"
                  onClick={handleEndCall}
                >
                  <PhoneOff size={20} />
                  <span>Terminate Call</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Right: Live Audio & State Visualizer */}
        <div className="col-12 col-md-7">
          <div className="card shadow-sm border p-4 h-100 d-flex flex-column justify-content-between text-center bg-light-subtle">
            {/* Top Status */}
            <div className="d-flex justify-content-between align-items-center">
              <span className="badge bg-primary-subtle text-primary border small">
                Campaign: {selectedCampaign?.product || "Gillette Guard"}
              </span>
              <span className="fw-bold small text-dark d-flex align-items-center gap-1">
                <Clock size={14} /> {Math.floor(callDuration / 60)}:{(callDuration % 60).toString().padStart(2, "0")}
              </span>
            </div>

            {/* Center Avatar & Pulse Animation */}
            <div className="my-5 d-flex flex-column align-items-center justify-content-center">
              <div
                className={`rounded-circle p-4 text-white d-flex align-items-center justify-content-center shadow-lg transition-all ${
                  callStatus === "active"
                    ? aiState === "speaking"
                      ? "bg-primary pulse-speaking"
                      : aiState === "thinking"
                      ? "bg-purple"
                      : "bg-success"
                    : "bg-secondary"
                }`}
                style={{ width: "90px", height: "90px" }}
              >
                <Bot size={44} />
              </div>

              <h5 className="fw-bold mt-3 mb-1">{selectedAgent?.name || "Sarah AI"}</h5>
              <div className="d-flex align-items-center gap-2">
                <span
                  className={`badge ${
                    callStatus === "active"
                      ? aiState === "speaking"
                        ? "bg-primary text-white"
                        : aiState === "thinking"
                        ? "bg-purple text-white"
                        : "bg-success text-white"
                      : "bg-secondary text-white"
                  }`}
                >
                  {callStatus === "active"
                    ? `AI State: ${aiState.toUpperCase()}`
                    : callStatus === "completed"
                    ? "Call Completed"
                    : "Standby"}
                </span>
              </div>
            </div>

            {/* Bottom Transcript Live Box */}
            <div className="p-3 bg-white border rounded-3 text-start small">
              <span className="text-muted d-block fw-bold mb-1" style={{ fontSize: "11px" }}>
                REALTIME AUDIO TRANSCRIPT STREAM
              </span>
              <p className="mb-0 text-dark">
                {callStatus === "active"
                  ? aiState === "speaking"
                    ? '"Namaste! This is Sarah from Gillette Consumer Insights. Do you remember purchasing a Gillette Guard razor?"'
                    : aiState === "thinking"
                    ? "Processing intent classification via NLU engine..."
                    : "Listening to user response audio via WebRTC..."
                  : callStatus === "completed"
                  ? "Interview complete. Survey response recorded to database."
                  : "Click 'Initiate AI Call' to begin live conversational execution."}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
