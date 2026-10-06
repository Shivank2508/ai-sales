import React from "react";
import { Link, useParams } from "react-router-dom";
import { useCampaign } from "../../campaigns/hooks/useCampaigns";
import { useSurveyByCampaign } from "../hooks/useSurveys";
import { LoadingSpinner } from "../../../components/common/LoadingSpinner";
import { QuestionAction, QuestionType } from "../../../types";
import {
  ArrowLeft,
  Workflow,
  CornerDownRight,
  GitBranch,
  Play,
  CheckCircle2,
  HelpCircle,
  ExternalLink,
} from "lucide-react";

export const SurveyFlowPage: React.FC = () => {
  const { campaignId = "" } = useParams<{ campaignId: string }>();
  const { data: campaign } = useCampaign(campaignId);
  const { data: survey, isLoading } = useSurveyByCampaign(campaignId);

  if (isLoading) return <LoadingSpinner message="Generating Flow Diagram..." />;

  const questions = survey?.questions || [];

  return (
    <div className="d-flex flex-column gap-3">
      {/* Header */}
      <div className="card shadow-sm border">
        <div className="card-body p-3 d-flex justify-content-between align-items-center">
          <div className="d-flex align-items-center gap-2">
            <Link to={`/campaigns/${campaignId}/survey`} className="btn btn-outline-secondary btn-sm p-1">
              <ArrowLeft size={16} />
            </Link>
            <div>
              <h1 className="h5 fw-bold mb-0 text-dark">Visual Flow Preview</h1>
              <span className="text-muted small" style={{ fontSize: "11px" }}>
                {survey?.name || "Survey Flow"} ({questions.length} Questions)
              </span>
            </div>
          </div>

          <div className="d-flex gap-2">
            <Link to={`/campaigns/${campaignId}/survey`} className="btn btn-outline-primary btn-sm">
              <Workflow size={14} className="me-1" />
              <span>Back to Builder</span>
            </Link>
            <Link to={`/campaigns/${campaignId}/survey/preview`} className="btn btn-primary btn-sm">
              <Play size={14} className="me-1" />
              <span>Test Simulator</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Main Flow Canvas Container */}
      <div
        className="card shadow-sm border p-4 d-flex flex-column align-items-center gap-3 overflow-x-auto"
        style={{
          background: "radial-gradient(circle at center, rgba(99, 102, 241, 0.04) 1px, transparent 1px)",
          backgroundSize: "20px 20px",
          minHeight: "650px",
        }}
      >
        {/* START Node */}
        <div
          className="p-3 border rounded-3 bg-primary-subtle text-center shadow-xs"
          style={{ width: "100%", maxWidth: "480px", borderLeft: "4px solid var(--bs-primary)" }}
        >
          <div className="d-flex justify-content-center align-items-center gap-2 mb-1">
            <span className="badge bg-primary text-white">● START NODE</span>
            <span className="text-muted small">Welcome Greeting</span>
          </div>
          <p className="small text-secondary fst-italic mb-0">
            "{survey?.welcomeMessage || "Hello! Welcome to the survey."}"
          </p>
        </div>

        <div className="text-primary fw-bold">↓ Next Question</div>

        {/* Questions Node Sequence */}
        {questions.length === 0 ? (
          <div className="text-muted small py-4">No questions created yet.</div>
        ) : (
          questions.map((q, idx) => {
            const hasConditions = q.conditionGroups && q.conditionGroups.length > 0;

            return (
              <React.Fragment key={q.questionId}>
                <div
                  className="card border shadow-xs p-3 text-start"
                  style={{
                    width: "100%",
                    maxWidth: "580px",
                    borderLeft: "4px solid #6366f1",
                  }}
                >
                  {/* Top Bar */}
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <div className="d-flex align-items-center gap-2">
                      <span className="badge bg-dark text-white">Q{idx + 1}</span>
                      <span className="badge bg-secondary-subtle text-secondary small">
                        {q.type.replace("_", " ")}
                      </span>
                      {q.required && <span className="badge bg-danger-subtle text-danger small">Required</span>}
                    </div>

                    <span className="font-monospace text-muted small" style={{ fontSize: "11px" }}>
                      ID: {q.questionId}
                    </span>
                  </div>

                  {/* Question Text */}
                  <div className="fw-bold small text-dark mb-2">{q.text}</div>

                  {/* Options Chips */}
                  {q.options && (
                    <div className="d-flex flex-wrap gap-1 mb-2">
                      {q.options.map((opt, oIdx) => (
                        <span key={oIdx} className="badge bg-light text-secondary border small">
                          {opt.label}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Branch Logic Pathways */}
                  {hasConditions && (
                    <div className="p-2 rounded-2 bg-purple-subtle border border-purple-subtle mt-2 d-flex flex-column gap-1">
                      <div className="d-flex align-items-center gap-1 text-purple fw-bold small" style={{ fontSize: "11px" }}>
                        <GitBranch size={12} />
                        <span>CONDITIONAL BRANCHING PATHS:</span>
                      </div>

                      {q.conditionGroups!.map((group, gIdx) => (
                        <div
                          key={gIdx}
                          className="bg-white p-2 rounded small d-flex align-items-center justify-content-between border"
                          style={{ fontSize: "11.5px" }}
                        >
                          <div className="d-flex align-items-center gap-1">
                            <CornerDownRight size={13} className="text-purple" />
                            <span>
                              IF {group.rules.map((r) => `[${r.questionId} ${r.operator} "${r.value}"]`).join(` ${group.logic} `)}
                            </span>
                          </div>

                          <strong
                            className={group.action === QuestionAction.END_SURVEY ? "text-danger" : "text-success"}
                          >
                            {group.action === QuestionAction.END_SURVEY ? "⛔ END SURVEY" : `➔ Jump to ${group.nextQuestionId}`}
                          </strong>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {idx < questions.length - 1 && (
                  <div className="text-muted fw-bold small" style={{ fontSize: "11px" }}>
                    ↓ Default Sequential
                  </div>
                )}
              </React.Fragment>
            );
          })
        )}

        <div className="text-success fw-bold">↓ Complete</div>

        {/* END Node */}
        <div
          className="p-3 border rounded-3 bg-success-subtle text-center shadow-xs"
          style={{ width: "100%", maxWidth: "480px", borderLeft: "4px solid var(--bs-success)" }}
        >
          <div className="d-flex justify-content-center align-items-center gap-2 mb-1">
            <span className="badge bg-success text-white">● END SURVEY</span>
            <span className="text-muted small">Completion & Log Answer</span>
          </div>
          <p className="small text-secondary fst-italic mb-0">
            "{survey?.endMessage || "Thank you for completing our survey!"}"
          </p>
        </div>
      </div>
    </div>
  );
};
