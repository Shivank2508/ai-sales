import React from "react";
import { Link, useParams } from "react-router-dom";
import { useConversations } from "../hooks/useConversations";
import { LoadingSpinner } from "../../../components/common/LoadingSpinner";
import { EmptyState } from "../../../components/common/EmptyState";
import {
  MessagesSquare,
  Phone,
  Bot,
  User,
  Clock,
  Eye,
  ArrowRight,
  Sparkles,
} from "lucide-react";

export const ConversationListPage: React.FC = () => {
  const { campaignId } = useParams<{ campaignId?: string }>();
  const { data: conversations, isLoading } = useConversations(campaignId);

  if (isLoading) return <LoadingSpinner message="Loading conversation logs..." />;

  return (
    <div className="d-flex flex-column gap-3">
      {/* Header */}
      <div className="card shadow-sm border">
        <div className="card-body p-3 d-flex justify-content-between align-items-center">
          <div>
            <h1 className="h5 fw-bold mb-0 text-dark">Customer Conversations</h1>
            <span className="text-muted small" style={{ fontSize: "11px" }}>
              Audio recordings and transcripts from AI Voice research sessions.
            </span>
          </div>
        </div>
      </div>

      {/* List */}
      {!conversations || conversations.length === 0 ? (
        <EmptyState
          title="No conversations recorded yet"
          description="Customer calls and live chat transcripts will appear here automatically."
        />
      ) : (
        <div className="row g-3">
          {conversations.map((conv) => (
            <div key={conv._id} className="col-12 col-md-6">
              <div className="card shadow-sm border h-100 p-3">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <div className="d-flex align-items-center gap-2">
                    <span className="badge bg-primary text-white">Voice Call</span>
                    <strong className="text-dark small">{conv.customerName}</strong>
                  </div>
                  <span className="badge bg-success-subtle text-success border small">
                    {conv.sentiment.toUpperCase()}
                  </span>
                </div>

                <div className="d-flex align-items-center gap-2 text-muted small mb-2" style={{ fontSize: "11px" }}>
                  <span>{conv.customerPhone || "+91 98765 43210"}</span>
                  <span>•</span>
                  <span>Agent: {conv.agentName}</span>
                  <span>•</span>
                  <span>{conv.durationSeconds}s</span>
                </div>

                <p className="text-secondary small mb-3 text-truncate-2" style={{ fontSize: "12px" }}>
                  {conv.summary || "Conversation conducted via AI Voice Agent."}
                </p>

                {/* Transcript Snippet */}
                <div className="p-2 border rounded-2 bg-light small mb-3" style={{ fontSize: "11.5px" }}>
                  {conv.messages.slice(0, 2).map((m) => (
                    <div key={m.id} className="mb-1 text-truncate">
                      <strong>{m.sender === "ai" ? "AI:" : "Customer:"}</strong> {m.text}
                    </div>
                  ))}
                </div>

                <Link
                  to={`/conversations/${conv._id}`}
                  className="btn btn-outline-primary btn-sm mt-auto d-flex align-items-center justify-content-center gap-1"
                >
                  <Eye size={14} />
                  <span>View Transcript & Audio ({conv.messages.length} lines)</span>
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
