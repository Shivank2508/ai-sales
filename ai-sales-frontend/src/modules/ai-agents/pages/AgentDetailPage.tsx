import React, { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useAIAgent, useUpdateAgent } from "../hooks/useAgents";
import { LoadingSpinner } from "../../../components/common/LoadingSpinner";
import { ErrorState } from "../../../components/common/ErrorState";
import {
  ArrowLeft,
  Bot,
  Sparkles,
  Save,
  CheckCircle2,
  BookOpen,
  Volume2,
} from "lucide-react";

export const AgentDetailPage: React.FC = () => {
  const { agentId = "" } = useParams<{ agentId: string }>();
  const { data: agent, isLoading, isError, error, refetch } = useAIAgent(agentId);
  const updateMutation = useUpdateAgent();

  const [systemPrompt, setSystemPrompt] = useState("");

  React.useEffect(() => {
    if (agent) {
      setSystemPrompt(agent.systemPrompt);
    }
  }, [agent]);

  if (isLoading) return <LoadingSpinner message="Loading agent parameters..." />;
  if (isError || !agent) {
    return (
      <ErrorState
        title="Agent Not Found"
        message={error?.message || "Unable to find the agent."}
        onRetry={() => refetch()}
      />
    );
  }

  const handleSave = async () => {
    await updateMutation.mutateAsync({
      id: agent._id,
      updates: { systemPrompt },
    });
    alert("Agent configuration saved successfully.");
  };

  return (
    <div className="d-flex flex-column gap-3" style={{ maxWidth: "860px" }}>
      {/* Header */}
      <div className="card shadow-sm border">
        <div className="card-body p-3 d-flex justify-content-between align-items-center">
          <div className="d-flex align-items-center gap-2">
            <Link to="/ai-agents" className="btn btn-outline-secondary btn-sm p-1">
              <ArrowLeft size={16} />
            </Link>
            <div>
              <h1 className="h5 fw-bold mb-0 text-dark">{agent.name}</h1>
              <span className="text-muted small" style={{ fontSize: "11px" }}>
                Voice Persona & System Prompt Tuning
              </span>
            </div>
          </div>
          <button
            className="btn btn-primary btn-sm d-flex align-items-center gap-1"
            onClick={handleSave}
            disabled={updateMutation.isPending}
          >
            <Save size={14} />
            <span>Save Configuration</span>
          </button>
        </div>
      </div>

      <div className="card shadow-sm border p-4">
        <div className="mb-4">
          <label className="form-label small fw-bold">Agent Persona & System Instructions</label>
          <textarea
            className="form-control"
            rows={6}
            value={systemPrompt}
            onChange={(e) => setSystemPrompt(e.target.value)}
          />
        </div>

        <div className="row g-3">
          <div className="col-12 col-md-6">
            <label className="form-label small fw-bold">Speech Voice Model</label>
            <input type="text" className="form-control form-control-sm" defaultValue={agent.voiceName} disabled />
          </div>
          <div className="col-12 col-md-6">
            <label className="form-label small fw-bold">Primary Language</label>
            <input type="text" className="form-control form-control-sm" defaultValue={agent.language} disabled />
          </div>
        </div>
      </div>
    </div>
  );
};
