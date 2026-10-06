import React from "react";
import { Link, useParams } from "react-router-dom";
import { useSurveyResponse } from "../hooks/useResponses";
import { useCampaign } from "../../campaigns/hooks/useCampaigns";
import { StatusBadge } from "../../../components/common/StatusBadge";
import { LoadingSpinner } from "../../../components/common/LoadingSpinner";
import { ErrorState } from "../../../components/common/ErrorState";
import {
  ArrowLeft,
  User,
  Phone,
  Mail,
  Calendar,
  Clock,
  Sparkles,
  Bot,
  CheckCircle2,
  FileQuestion,
  Tag,
  ShieldCheck,
} from "lucide-react";

export const ResponseDetailPage: React.FC = () => {
  const { campaignId = "", responseId = "" } = useParams<{
    campaignId: string;
    responseId: string;
  }>();

  const { data: campaign } = useCampaign(campaignId);
  const { data: response, isLoading, isError, error, refetch } = useSurveyResponse(responseId);

  if (isLoading) return <LoadingSpinner message="Loading response details..." />;
  if (isError || !response) {
    return (
      <ErrorState
        title="Response Not Found"
        message={error?.message || "Unable to find the requested response."}
        onRetry={() => refetch()}
      />
    );
  }

  return (
    <div className="d-flex flex-column gap-3">
      {/* Header */}
      <div className="card shadow-sm border">
        <div className="card-body p-3 d-flex justify-content-between align-items-center">
          <div className="d-flex align-items-center gap-2">
            <Link to={`/campaigns/${campaignId}?tab=responses`} className="btn btn-outline-secondary btn-sm p-1">
              <ArrowLeft size={16} />
            </Link>
            <div>
              <div className="d-flex align-items-center gap-2">
                <h1 className="h5 fw-bold mb-0 text-dark">Response: {response.responseId}</h1>
                <StatusBadge status={response.status} />
              </div>
              <span className="text-muted small" style={{ fontSize: "11px" }}>
                Campaign: {campaign?.name} • Submitted on {new Date(response.startedAt).toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Respondent Metadata Row */}
      <div className="row g-3">
        <div className="col-12 col-md-4">
          <div className="card shadow-sm border p-3 h-100">
            <span className="text-secondary small fw-bold text-uppercase mb-2 d-block" style={{ fontSize: "11px" }}>
              Customer Profile
            </span>
            <div className="d-flex align-items-center gap-2 mb-2">
              <User size={16} className="text-primary" />
              <strong className="text-dark small">{response.leadName || "Anonymous Consumer"}</strong>
            </div>
            <div className="d-flex align-items-center gap-2 text-muted small mb-1">
              <Phone size={14} />
              <span>{response.leadPhone || "+91 98765 43210"}</span>
            </div>
            {response.leadEmail && (
              <div className="d-flex align-items-center gap-2 text-muted small">
                <Mail size={14} />
                <span>{response.leadEmail}</span>
              </div>
            )}
          </div>
        </div>

        <div className="col-12 col-md-4">
          <div className="card shadow-sm border p-3 h-100">
            <span className="text-secondary small fw-bold text-uppercase mb-2 d-block" style={{ fontSize: "11px" }}>
              Interview Stats
            </span>
            <div className="d-flex justify-content-between text-muted small mb-1">
              <span>Completion:</span>
              <strong className="text-success">{response.completionPercentage}%</strong>
            </div>
            <div className="d-flex justify-content-between text-muted small mb-1">
              <span>Call Duration:</span>
              <strong className="text-dark">{response.durationSeconds || 120}s</strong>
            </div>
            <div className="d-flex justify-content-between text-muted small">
              <span>Extraction Engine:</span>
              <span className="badge bg-primary-subtle text-primary border">AI Voice NLU</span>
            </div>
          </div>
        </div>

        <div className="col-12 col-md-4">
          <div className="card shadow-sm border p-3 h-100">
            <span className="text-secondary small fw-bold text-uppercase mb-2 d-block" style={{ fontSize: "11px" }}>
              Overall Sentiment Intent
            </span>
            <div className="d-flex align-items-center gap-2 mb-1">
              <span
                className={`badge fs-6 ${
                  response.overallIntent === "positive"
                    ? "bg-success text-white"
                    : response.overallIntent === "negative"
                    ? "bg-danger text-white"
                    : "bg-secondary text-white"
                }`}
              >
                {response.overallIntent ? response.overallIntent.toUpperCase() : "POSITIVE_INTENT"}
              </span>
            </div>
            <p className="text-muted small mb-0" style={{ fontSize: "11.5px" }}>
              Categorized based on repeat intent and user feedback sentiment.
            </p>
          </div>
        </div>
      </div>

      {/* Answers Breakdown */}
      <div className="card shadow-sm border">
        <div className="card-header bg-white py-3">
          <span className="fw-bold fs-6 text-dark">Survey Answers Breakdown ({response.answers.length} Questions)</span>
        </div>
        <div className="card-body p-4 d-flex flex-column gap-3">
          {response.answers.map((ans, idx) => (
            <div key={idx} className="card border p-3 bg-light-subtle shadow-xs">
              {/* Question Header */}
              <div className="d-flex justify-content-between align-items-center mb-2">
                <div className="d-flex align-items-center gap-2">
                  <span className="badge bg-dark text-white">Q{idx + 1} ({ans.questionId})</span>
                  <strong className="text-dark small">{ans.questionText || `Question Prompt #${idx + 1}`}</strong>
                </div>
                {ans.confidence && (
                  <span className="badge bg-success-subtle text-success border small">
                    AI Confidence: {Math.round(ans.confidence * 100)}%
                  </span>
                )}
              </div>

              {/* 3-Column Answer Comparison Card */}
              <div className="row g-2 mt-1">
                {/* 1. Raw Spoken Answer */}
                <div className="col-12 col-md-5">
                  <div className="p-3 border rounded-2 bg-white h-100">
                    <span className="text-muted small fw-bold d-block mb-1" style={{ fontSize: "11px" }}>
                      RAW SPOKEN TRANSCRIPT
                    </span>
                    <p className="text-dark small mb-0 fst-italic">"{ans.rawAnswer}"</p>
                  </div>
                </div>

                {/* 2. Normalized Output */}
                <div className="col-12 col-md-4">
                  <div className="p-3 border rounded-2 bg-white h-100">
                    <span className="text-muted small fw-bold d-block mb-1" style={{ fontSize: "11px" }}>
                      NORMALIZED STRUCTURED VALUE
                    </span>
                    <code className="text-primary fw-bold" style={{ fontSize: "13px" }}>
                      {Array.isArray(ans.normalizedAnswer)
                        ? JSON.stringify(ans.normalizedAnswer)
                        : String(ans.normalizedAnswer)}
                    </code>
                  </div>
                </div>

                {/* 3. AI Extraction Metadata */}
                <div className="col-12 col-md-3">
                  <div className="p-3 border rounded-2 bg-white h-100 d-flex flex-column justify-content-between">
                    <div>
                      <span className="text-muted small fw-bold d-block mb-1" style={{ fontSize: "11px" }}>
                        EXTRACTED BY
                      </span>
                      <span className="badge bg-purple-subtle text-purple border small">
                        <Bot size={11} className="me-1" /> {ans.extractedBy.toUpperCase()}
                      </span>
                    </div>
                    {ans.intent && (
                      <div className="mt-2">
                        <span className="text-muted small d-block" style={{ fontSize: "10px" }}>DETECTED INTENT</span>
                        <span className="badge bg-info-subtle text-info border small">{ans.intent}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
