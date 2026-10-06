import React from "react";
import { Link } from "react-router-dom";
import { useAIAgents } from "../hooks/useAgents";
import { LoadingSpinner } from "../../../components/common/LoadingSpinner";
import { EmptyState } from "../../../components/common/EmptyState";
import {
  Bot,
  Sparkles,
  Phone,
  MessageSquare,
  Globe,
  CheckCircle2,
  Clock,
  Play,
  Settings,
  ArrowRight,
} from "lucide-react";

export const AgentsListPage: React.FC = () => {
  const { data: agents, isLoading } = useAIAgents();

  if (isLoading) return <LoadingSpinner message="Loading AI Agents..." />;

  return (
    <div className="d-flex flex-column gap-3">
      {/* Header */}
      <div className="card shadow-sm border">
        <div className="card-body p-3 d-flex justify-content-between align-items-center">
          <div>
            <h1 className="h5 fw-bold mb-0 text-dark">Conversational AI Agents</h1>
            <span className="text-muted small" style={{ fontSize: "11px" }}>
              Voice and text autonomous agents trained to conduct consumer surveys and qualification calls.
            </span>
          </div>

          <Link to="/ai-agents/live-execution" className="btn btn-primary btn-sm d-flex align-items-center gap-1 shadow-sm">
            <Play size={14} />
            <span>Open Execution Monitor</span>
          </Link>
        </div>
      </div>

      {/* Agents Grid */}
      <div className="row g-3">
        {agents?.map((agent) => (
          <div key={agent._id} className="col-12 col-md-6">
            <div className="card shadow-sm border h-100 p-4 d-flex flex-column justify-content-between">
              <div>
                <div className="d-flex justify-content-between align-items-start mb-3">
                  <div className="d-flex align-items-center gap-3">
                    <div
                      className="rounded-circle bg-primary-subtle text-primary p-3 d-flex align-items-center justify-content-center shadow-xs"
                      style={{ width: "54px", height: "54px" }}
                    >
                      <Bot size={28} />
                    </div>
                    <div>
                      <h5 className="fw-bold fs-6 mb-1 text-dark">{agent.name}</h5>
                      <span className="badge bg-success-subtle text-success border small">
                        ● Online & Ready
                      </span>
                    </div>
                  </div>
                </div>

                <p className="text-secondary small mb-3">{agent.description}</p>

                {/* Capabilities Chips */}
                <div className="d-flex flex-wrap gap-1 mb-3">
                  {agent.capabilities.map((cap, cIdx) => (
                    <span key={cIdx} className="badge bg-light text-secondary border small text-capitalize">
                      {cap}
                    </span>
                  ))}
                  <span className="badge bg-purple-subtle text-purple border small">
                    Voice: {agent.voiceName}
                  </span>
                </div>

                {/* Performance Metrics */}
                <div className="row g-2 mb-3 bg-light p-2 rounded-2 text-center small">
                  <div className="col-4">
                    <span className="text-muted d-block" style={{ fontSize: "11px" }}>Conversations</span>
                    <strong className="text-dark">{agent.totalConversations}</strong>
                  </div>
                  <div className="col-4">
                    <span className="text-muted d-block" style={{ fontSize: "11px" }}>Accuracy Rate</span>
                    <strong className="text-success">{agent.successRate}%</strong>
                  </div>
                  <div className="col-4">
                    <span className="text-muted d-block" style={{ fontSize: "11px" }}>Latency</span>
                    <strong className="text-dark">{agent.avgResponseTimeMs}ms</strong>
                  </div>
                </div>
              </div>

              <div className="d-flex gap-2 border-top pt-3">
                <Link to={`/ai-agents/${agent._id}`} className="btn btn-outline-secondary btn-sm flex-grow-1">
                  Agent Settings
                </Link>
                <Link to={`/ai-agents/live-execution?agentId=${agent._id}`} className="btn btn-primary btn-sm flex-grow-1">
                  Test Agent Call →
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
