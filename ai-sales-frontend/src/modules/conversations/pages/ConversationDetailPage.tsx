import React from "react";
import { Link, useParams } from "react-router-dom";
import { useConversation } from "../hooks/useConversations";
import { LoadingSpinner } from "../../../components/common/LoadingSpinner";
import { ErrorState } from "../../../components/common/ErrorState";
import {
  ArrowLeft,
  Bot,
  User,
  Phone,
  Clock,
  Sparkles,
  Volume2,
  CheckCircle2,
  Tag,
} from "lucide-react";

export const ConversationDetailPage: React.FC = () => {
  const { conversationId = "" } = useParams<{ conversationId: string }>();
  const { data: conv, isLoading, isError, error, refetch } = useConversation(conversationId);

  if (isLoading) return <LoadingSpinner message="Loading conversation transcript..." />;
  if (isError || !conv) {
    return (
      <ErrorState
        title="Conversation Not Found"
        message={error?.message || "Unable to find the conversation."}
        onRetry={() => refetch()}
      />
    );
  }

  return (
    <div className="d-flex flex-column gap-3" style={{ maxWidth: "980px", margin: "0 auto" }}>
      {/* Header */}
      <div className="card shadow-sm border">
        <div className="card-body p-3 d-flex justify-content-between align-items-center">
          <div className="d-flex align-items-center gap-2">
            <Link to="/conversations" className="btn btn-outline-secondary btn-sm p-1">
              <ArrowLeft size={16} />
            </Link>
            <div>
              <div className="d-flex align-items-center gap-2">
                <h1 className="h5 fw-bold mb-0 text-dark">Call Transcript: {conv.customerName}</h1>
                <span className="badge bg-primary text-white">Voice Audio</span>
              </div>
              <span className="text-muted small" style={{ fontSize: "11px" }}>
                Conducted by {conv.agentName} • {new Date(conv.startedAt).toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Summary Card */}
      <div className="card shadow-sm border p-3 bg-light-subtle">
        <div className="d-flex align-items-center gap-2 mb-1 text-primary fw-bold small">
          <Sparkles size={15} />
          <span>AI Conversation Summary</span>
        </div>
        <p className="text-secondary small mb-0">{conv.summary || "No automated summary available."}</p>
      </div>

      {/* Transcript Chat Stream */}
      <div className="card shadow-sm border">
        <div className="card-header bg-white py-3">
          <span className="fw-bold fs-6 text-dark">Full Dialogue Stream ({conv.messages.length} utterances)</span>
        </div>
        <div className="card-body p-4 d-flex flex-column gap-3" style={{ maxHeight: "650px", overflowY: "auto" }}>
          {conv.messages.map((msg) => {
            const isAI = msg.sender === "ai";

            return (
              <div
                key={msg.id}
                className={`d-flex gap-3 align-items-start ${
                  isAI ? "" : "flex-row-reverse"
                }`}
              >
                {/* Avatar */}
                <div
                  className={`rounded-circle p-2 d-flex align-items-center justify-content-center text-white flex-shrink-0 shadow-xs ${
                    isAI ? "bg-primary" : "bg-dark"
                  }`}
                  style={{ width: "36px", height: "36px" }}
                >
                  {isAI ? <Bot size={18} /> : <User size={18} />}
                </div>

                {/* Message Bubble Card */}
                <div
                  className={`card border p-3 shadow-xs ${
                    isAI ? "bg-light-subtle" : "bg-primary text-white"
                  }`}
                  style={{ maxWidth: "72%", borderRadius: "14px" }}
                >
                  <div className="d-flex justify-content-between align-items-center mb-1 gap-3">
                    <strong style={{ fontSize: "12px" }}>
                      {isAI ? "Sarah (AI Voice)" : conv.customerName}
                    </strong>
                    <span className={isAI ? "text-muted small" : "text-white-50 small"} style={{ fontSize: "10px" }}>
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                    </span>
                  </div>

                  <p className="mb-2 small" style={{ fontSize: "13.5px", lineHeight: 1.4 }}>
                    {msg.text}
                  </p>

                  {/* AI Metadata Tags (Confidence, Intent, Question mapping) */}
                  {(msg.aiConfidence || msg.detectedIntent || msg.questionId) && (
                    <div className="d-flex flex-wrap gap-1 pt-2 border-top border-secondary-subtle">
                      {msg.questionId && (
                        <span className="badge bg-dark text-white small" style={{ fontSize: "9.5px" }}>
                          Q: {msg.questionId}
                        </span>
                      )}
                      {msg.detectedIntent && (
                        <span className="badge bg-success-subtle text-success border small" style={{ fontSize: "9.5px" }}>
                          Intent: {msg.detectedIntent}
                        </span>
                      )}
                      {msg.aiConfidence && (
                        <span className="badge bg-info-subtle text-info border small" style={{ fontSize: "9.5px" }}>
                          Confidence: {Math.round(msg.aiConfidence * 100)}%
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
