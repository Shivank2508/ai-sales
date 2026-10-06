import React, { useState } from "react";
import { Link, useParams, useNavigate, useSearchParams } from "react-router-dom";
import {
  useCampaign,
  usePublishCampaign,
  usePauseCampaign,
  useArchiveCampaign,
  useDeleteCampaign,
} from "../hooks/useCampaigns";
import { useSurveyByCampaign } from "../../surveys/hooks/useSurveys";
import { useSurveyResponses } from "../../responses/hooks/useResponses";
import { useConversations } from "../../conversations/hooks/useConversations";
import { useCampaignAnalytics } from "../../analytics/hooks/useAnalytics";
import { useAIAgents, useAssignCampaign } from "../../ai-agents/hooks/useAgents";
import { CampaignStatus, CampaignType, ResponseStatus } from "../../../types";
import { StatusBadge, CampaignTypeBadge } from "../../../components/common/StatusBadge";
import { StatCard } from "../../../components/common/StatCard";
import { LoadingSpinner } from "../../../components/common/LoadingSpinner";
import { ErrorState } from "../../../components/common/ErrorState";
import { ConfirmModal } from "../../../components/common/ConfirmModal";
import {
  ArrowLeft,
  Workflow,
  Play,
  Pause,
  Archive,
  Trash2,
  Edit,
  Eye,
  CheckCircle2,
  Calendar,
  Building,
  Package,
  Users,
  Clock,
  Sparkles,
  Bot,
  MessagesSquare,
  BarChart3,
  Settings,
  Layers,
  FileQuestion,
  TrendingUp,
  ThumbsUp,
  ThumbsDown,
  ExternalLink,
  ShieldCheck,
  Globe,
} from "lucide-react";

export const CampaignDetailsPage: React.FC = () => {
  const { campaignId = "" } = useParams<{ campaignId: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Active Tab: overview | survey | flow | responses | conversations | analytics | settings
  const activeTab = searchParams.get("tab") || "overview";
  const setTab = (tab: string) => setSearchParams({ tab });

  // Queries
  const { data: campaign, isLoading, isError, error, refetch } = useCampaign(campaignId);
  const { data: survey, isLoading: surveyLoading } = useSurveyByCampaign(campaignId);
  const { data: responses } = useSurveyResponses(campaignId);
  const { data: conversations } = useConversations(campaignId);
  const { data: analytics } = useCampaignAnalytics(campaignId);
  const { data: agents } = useAIAgents();

  // Mutations
  const publishMutation = usePublishCampaign();
  const pauseMutation = usePauseCampaign();
  const archiveMutation = useArchiveCampaign();
  const deleteMutation = useDeleteCampaign();
  const assignAgentMutation = useAssignCampaign();

  // Confirm Modal state
  const [confirmAction, setConfirmAction] = useState<"publish" | "pause" | "archive" | "delete" | null>(null);
  const [selectedAgentId, setSelectedAgentId] = useState("");

  if (isLoading) return <LoadingSpinner message="Loading campaign details..." />;
  if (isError || !campaign) {
    return (
      <ErrorState
        title="Campaign Not Found"
        message={error?.message || `Unable to load campaign ${campaignId}.`}
        onRetry={() => refetch()}
      />
    );
  }

  const handleConfirmAction = async () => {
    if (!confirmAction) return;
    if (confirmAction === "publish") {
      await publishMutation.mutateAsync(campaign._id);
    } else if (confirmAction === "pause") {
      await pauseMutation.mutateAsync(campaign._id);
    } else if (confirmAction === "archive") {
      await archiveMutation.mutateAsync(campaign._id);
    } else if (confirmAction === "delete") {
      await deleteMutation.mutateAsync(campaign._id);
      navigate("/campaigns");
    }
    setConfirmAction(null);
  };

  const questionCount = survey?.questions?.length || 0;
  const totalConditions =
    survey?.questions?.reduce((acc, q) => acc + (q.conditionGroups?.length || 0), 0) || 0;

  return (
    <div className="d-flex flex-column gap-3">
      {/* Top Header Card */}
      <div className="card shadow-sm border">
        <div className="card-body p-4">
          <div className="d-flex flex-wrap justify-content-between align-items-start gap-3">
            <div>
              <div className="d-flex align-items-center gap-2 mb-2">
                <Link to="/campaigns" className="btn btn-outline-secondary btn-sm p-1" title="Back to Campaigns">
                  <ArrowLeft size={16} />
                </Link>
                <StatusBadge status={campaign.status} />
                <CampaignTypeBadge type={campaign.type} />
                <span className="badge bg-light text-secondary border small">
                  {campaign.language || "en-IN"}
                </span>
              </div>

              <h1 className="h4 fw-bold mb-1 text-dark">{campaign.name}</h1>
              <p className="text-secondary small mb-3" style={{ maxWidth: "720px" }}>
                {campaign.description || "No description provided."}
              </p>

              {/* Sub-meta chips */}
              <div className="d-flex flex-wrap gap-3 small text-muted">
                <div className="d-flex align-items-center gap-1">
                  <Building size={14} className="text-secondary" />
                  <span>Business: <strong>{campaign.businessName || "P&G Consumer Insights"}</strong></span>
                </div>
                <div className="d-flex align-items-center gap-1">
                  <Package size={14} className="text-secondary" />
                  <span>Product: <strong>{campaign.product || "Core Platform"}</strong></span>
                </div>
                <div className="d-flex align-items-center gap-1">
                  <Calendar size={14} className="text-secondary" />
                  <span>
                    Timeline: {campaign.startDate ? new Date(campaign.startDate).toLocaleDateString() : "Immediate"}
                    {campaign.endDate ? ` → ${new Date(campaign.endDate).toLocaleDateString()}` : " (Ongoing)"}
                  </span>
                </div>
              </div>
            </div>

            {/* Actions Bar */}
            <div className="d-flex align-items-center gap-2 flex-wrap">
              <Link to={`/campaigns/${campaign._id}/survey`} className="btn btn-primary btn-sm d-flex align-items-center gap-1 shadow-sm">
                <Workflow size={15} />
                <span>Survey Builder</span>
              </Link>

              {campaign.status === CampaignStatus.ACTIVE ? (
                <button
                  className="btn btn-outline-warning btn-sm d-flex align-items-center gap-1"
                  onClick={() => setConfirmAction("pause")}
                >
                  <Pause size={14} />
                  <span>Pause</span>
                </button>
              ) : (
                <button
                  className="btn btn-success btn-sm d-flex align-items-center gap-1"
                  onClick={() => setConfirmAction("publish")}
                  disabled={questionCount === 0}
                  title={questionCount === 0 ? "Survey must have questions" : "Publish live"}
                >
                  <Play size={14} />
                  <span>Publish</span>
                </button>
              )}

              <button
                className="btn btn-outline-secondary btn-sm d-flex align-items-center gap-1"
                onClick={() => setConfirmAction("archive")}
              >
                <Archive size={14} />
                <span>Archive</span>
              </button>

              <button
                className="btn btn-outline-danger btn-sm p-1"
                title="Delete Campaign"
                onClick={() => setConfirmAction("delete")}
              >
                <Trash2 size={15} />
              </button>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="card-footer bg-white border-top px-3 py-0">
          <ul className="nav nav-tabs border-0 gap-1" style={{ fontSize: "13.5px" }}>
            {[
              { id: "overview", label: "Overview", icon: Layers },
              { id: "survey", label: "Survey", icon: FileQuestion, badge: questionCount ? `${questionCount} Qs` : undefined },
              { id: "flow", label: "Flow Preview", icon: Workflow },
              { id: "responses", label: "Responses", icon: Users, badge: campaign.responsesCount ? String(campaign.responsesCount) : undefined },
              { id: "conversations", label: "Conversations", icon: MessagesSquare },
              { id: "analytics", label: "Analytics", icon: BarChart3 },
              { id: "settings", label: "Settings", icon: Settings },
            ].map((t) => {
              const Icon = t.icon;
              const isActive = activeTab === t.id;
              return (
                <li key={t.id} className="nav-item">
                  <button
                    className={`nav-link border-0 py-3 px-3 d-flex align-items-center gap-2 ${
                      isActive ? "active border-bottom border-primary border-3 fw-bold text-primary" : "text-secondary"
                    }`}
                    onClick={() => setTab(t.id)}
                  >
                    <Icon size={16} />
                    <span>{t.label}</span>
                    {t.badge && <span className="badge bg-secondary-subtle text-secondary small py-0">{t.badge}</span>}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      </div>

      {/* Tab Content Rendering */}
      {activeTab === "overview" && renderOverviewTab()}
      {activeTab === "survey" && renderSurveyTab()}
      {activeTab === "flow" && renderFlowTab()}
      {activeTab === "responses" && renderResponsesTab()}
      {activeTab === "conversations" && renderConversationsTab()}
      {activeTab === "analytics" && renderAnalyticsTab()}
      {activeTab === "settings" && renderSettingsTab()}

      {/* Confirmation Modal */}
      {confirmAction && (
        <ConfirmModal
          isOpen={Boolean(confirmAction)}
          title={
            confirmAction === "publish"
              ? "Publish Campaign Live?"
              : confirmAction === "pause"
              ? "Pause Active Campaign?"
              : confirmAction === "archive"
              ? "Archive Campaign?"
              : "Delete Campaign?"
          }
          message={
            confirmAction === "publish"
              ? `Publish "${campaign.name}"? The conversational AI voice agent will start actively interviewing consumers.`
              : confirmAction === "delete"
              ? `Permanently delete "${campaign.name}"? All associated questions and data will be erased.`
              : `Proceed with ${confirmAction} action on "${campaign.name}".`
          }
          variant={confirmAction === "publish" ? "success" : confirmAction === "delete" ? "danger" : "warning"}
          confirmText={confirmAction === "publish" ? "Publish Live" : confirmAction === "delete" ? "Delete" : "Confirm"}
          onConfirm={handleConfirmAction}
          onCancel={() => setConfirmAction(null)}
          isLoading={publishMutation.isPending || pauseMutation.isPending || archiveMutation.isPending || deleteMutation.isPending}
        />
      )}
    </div>
  );

  // 1. OVERVIEW TAB
  function renderOverviewTab() {
    return (
      <div className="d-flex flex-column gap-3">
        {/* KPI Metric Cards */}
        <div className="row g-3">
          <div className="col-12 col-sm-6 col-lg-3">
            <StatCard
              title="Total Responses"
              value={campaign?.responsesCount || 0}
              subtitle="All consumer interviews"
              icon={Users}
              variant="primary"
            />
          </div>
          <div className="col-12 col-sm-6 col-lg-3">
            <StatCard
              title="Completed Responses"
              value={campaign?.completedResponsesCount || 0}
              subtitle="100% full surveys"
              icon={CheckCircle2}
              variant="success"
            />
          </div>
          <div className="col-12 col-sm-6 col-lg-3">
            <StatCard
              title="Completion Rate"
              value={`${campaign?.completionRate || 0}%`}
              subtitle="Optimized with branch logic"
              icon={TrendingUp}
              variant="purple"
            />
          </div>
          <div className="col-12 col-sm-6 col-lg-3">
            <StatCard
              title="Average Duration"
              value={`${campaign?.avgDurationSeconds || 0}s`}
              subtitle="Voice speech time"
              icon={Clock}
              variant="info"
            />
          </div>
        </div>

        {/* Intent Breakdown Cards */}
        <div className="row g-3">
          <div className="col-12 col-md-4">
            <div className="card shadow-sm border p-3">
              <div className="d-flex justify-content-between align-items-center mb-1">
                <span className="small fw-semibold text-success d-flex align-items-center gap-1">
                  <ThumbsUp size={14} /> Positive Intent
                </span>
                <span className="fw-bold">{campaign?.positiveIntentPercentage || 0}%</span>
              </div>
              <div className="progress" style={{ height: "6px" }}>
                <div className="progress-bar bg-success" style={{ width: `${campaign?.positiveIntentPercentage || 0}%` }}></div>
              </div>
            </div>
          </div>

          <div className="col-12 col-md-4">
            <div className="card shadow-sm border p-3">
              <div className="d-flex justify-content-between align-items-center mb-1">
                <span className="small fw-semibold text-warning-emphasis d-flex align-items-center gap-1">
                  <Sparkles size={14} /> Neutral / Maybe
                </span>
                <span className="fw-bold">{campaign?.neutralIntentPercentage || 0}%</span>
              </div>
              <div className="progress" style={{ height: "6px" }}>
                <div className="progress-bar bg-warning" style={{ width: `${campaign?.neutralIntentPercentage || 0}%` }}></div>
              </div>
            </div>
          </div>

          <div className="col-12 col-md-4">
            <div className="card shadow-sm border p-3">
              <div className="d-flex justify-content-between align-items-center mb-1">
                <span className="small fw-semibold text-danger d-flex align-items-center gap-1">
                  <ThumbsDown size={14} /> Negative / Churn
                </span>
                <span className="fw-bold">{campaign?.negativeIntentPercentage || 0}%</span>
              </div>
              <div className="progress" style={{ height: "6px" }}>
                <div className="progress-bar bg-danger" style={{ width: `${campaign?.negativeIntentPercentage || 0}%` }}></div>
              </div>
            </div>
          </div>
        </div>

        {/* Linked Survey & Lifecycle Card */}
        <div className="row g-3">
          <div className="col-12 col-lg-8">
            <div className="card shadow-sm border h-100">
              <div className="card-header bg-white py-3 d-flex justify-content-between align-items-center">
                <div className="fw-bold fs-6 text-dark d-flex align-items-center gap-2">
                  <Workflow size={18} className="text-primary" />
                  <span>Survey Workflow Configuration</span>
                </div>
                {survey ? (
                  <span className="badge bg-success-subtle text-success border">✓ Linked</span>
                ) : (
                  <span className="badge bg-warning-subtle text-warning border">Needs Survey</span>
                )}
              </div>
              <div className="card-body p-4">
                {survey ? (
                  <div>
                    <h5 className="fw-bold mb-1 fs-6">{survey.name}</h5>
                    <p className="text-secondary small mb-3">{survey.description || "Interactive consumer survey."}</p>

                    <div className="row g-2 mb-3">
                      <div className="col-4">
                        <div className="p-2 border rounded-2 bg-light small">
                          <span className="text-muted d-block" style={{ fontSize: "11px" }}>Total Questions</span>
                          <strong className="fs-6">{questionCount}</strong>
                        </div>
                      </div>
                      <div className="col-4">
                        <div className="p-2 border rounded-2 bg-light small">
                          <span className="text-muted d-block" style={{ fontSize: "11px" }}>Branch Logic Rules</span>
                          <strong className="fs-6 text-primary">{totalConditions}</strong>
                        </div>
                      </div>
                      <div className="col-4">
                        <div className="p-2 border rounded-2 bg-light small">
                          <span className="text-muted d-block" style={{ fontSize: "11px" }}>Language</span>
                          <strong className="fs-6">{survey.language}</strong>
                        </div>
                      </div>
                    </div>

                    <div className="d-flex gap-2">
                      <Link to={`/campaigns/${campaign?._id}/survey`} className="btn btn-primary btn-sm px-3">
                        <Workflow size={14} className="me-1" />
                        <span>Open Survey Builder</span>
                      </Link>
                      <Link to={`/campaigns/${campaign?._id}/survey/preview`} className="btn btn-outline-secondary btn-sm px-3">
                        <Play size={14} className="me-1" />
                        <span>Preview Simulation</span>
                      </Link>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-secondary small mb-3">This campaign does not have an attached survey yet.</p>
                    <Link to={`/campaigns/${campaign?._id}/survey`} className="btn btn-primary btn-sm">
                      Create Survey Now
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="col-12 col-lg-4">
            <div className="card shadow-sm border h-100">
              <div className="card-header bg-white py-3">
                <span className="fw-bold fs-6 text-dark">AI Agent Assignment</span>
              </div>
              <div className="card-body p-3">
                <div className="d-flex align-items-center gap-3 mb-3">
                  <div
                    className="rounded-circle bg-primary-subtle text-primary p-2 d-flex align-items-center justify-content-center"
                    style={{ width: "42px", height: "42px" }}
                  >
                    <Bot size={24} />
                  </div>
                  <div>
                    <div className="fw-bold small text-dark">Sarah (Voice AI Specialist)</div>
                    <div className="text-muted small" style={{ fontSize: "11px" }}>Multilingual • 94.2% Accuracy</div>
                  </div>
                </div>

                <div className="bg-light p-2 rounded-2 small text-secondary mb-3" style={{ fontSize: "12px" }}>
                  Assigned to conduct automated outbound research calls in <strong>{campaign?.language || "en-IN"}</strong>.
                </div>

                <Link to={`/ai-agents`} className="btn btn-outline-primary btn-sm w-100">
                  Manage AI Agents
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 2. SURVEY TAB
  function renderSurveyTab() {
    return (
      <div className="card shadow-sm border p-4">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h5 className="fw-bold mb-1 fs-6">Survey Questions & Structure</h5>
            <p className="text-secondary small mb-0">Overview of configured questions, prompt types, and conditions.</p>
          </div>
          <Link to={`/campaigns/${campaign?._id}/survey`} className="btn btn-primary btn-sm d-flex align-items-center gap-1">
            <Workflow size={15} />
            <span>Launch Visual Builder</span>
          </Link>
        </div>

        {survey?.questions && survey.questions.length > 0 ? (
          <div className="d-flex flex-column gap-2">
            {survey.questions.map((q, idx) => (
              <div key={q.questionId} className="card border p-3 bg-light-subtle">
                <div className="d-flex justify-content-between align-items-center mb-1">
                  <div className="d-flex align-items-center gap-2">
                    <span className="badge bg-primary text-white">Q{idx + 1}</span>
                    <span className="badge bg-secondary-subtle text-secondary">{q.type.replace("_", " ")}</span>
                    {q.required && <span className="badge bg-danger-subtle text-danger">Required</span>}
                  </div>
                  {q.conditionGroups && q.conditionGroups.length > 0 && (
                    <span className="badge bg-purple-subtle text-purple border">
                      {q.conditionGroups.length} Logic Group(s)
                    </span>
                  )}
                </div>
                <div className="fw-semibold text-dark mb-1">{q.text}</div>
                {q.options && (
                  <div className="d-flex flex-wrap gap-1 mt-2">
                    {q.options.map((opt, oIdx) => (
                      <span key={oIdx} className="badge bg-white text-secondary border small">
                        {opt.label}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-5">
            <p className="text-secondary small">No questions created yet.</p>
            <Link to={`/campaigns/${campaign?._id}/survey`} className="btn btn-primary btn-sm">
              Add First Question
            </Link>
          </div>
        )}
      </div>
    );
  }

  // 3. FLOW TAB
  function renderFlowTab() {
    return (
      <div className="card shadow-sm border p-4">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h5 className="fw-bold mb-1 fs-6">Visual Flowchart Preview</h5>
            <p className="text-secondary small mb-0">Interactive diagram of survey pathways and conditional decisions.</p>
          </div>
          <Link to={`/campaigns/${campaign?._id}/survey/flow`} className="btn btn-outline-primary btn-sm">
            <ExternalLink size={14} className="me-1" />
            <span>Full Flow Mode</span>
          </Link>
        </div>

        <div className="d-flex flex-column align-items-center gap-3 py-3">
          {/* Start Node */}
          <div className="p-3 border rounded-3 bg-primary-subtle text-center" style={{ maxWidth: "420px" }}>
            <span className="badge bg-primary text-white mb-1">START</span>
            <div className="small fw-bold">"{survey?.welcomeMessage || "Welcome Greeting"}"</div>
          </div>

          <div className="text-muted fw-bold">↓</div>

          {/* Question Sequence */}
          {(survey?.questions || []).map((q, idx) => (
            <React.Fragment key={q.questionId}>
              <div className="card border p-3 text-start shadow-xs" style={{ width: "100%", maxWidth: "560px" }}>
                <div className="d-flex justify-content-between align-items-center mb-1">
                  <span className="badge bg-dark text-white">Q{idx + 1} ({q.type})</span>
                </div>
                <div className="fw-bold small mb-2">{q.text}</div>
                {q.conditionGroups && q.conditionGroups.length > 0 && (
                  <div className="bg-light p-2 rounded small text-purple border border-purple-subtle">
                    {q.conditionGroups.map((g, gIdx) => (
                      <div key={gIdx}>
                        ↳ IF condition met ➔ <strong>{g.action === "end_survey" ? "END SURVEY" : `Jump to ${g.nextQuestionId}`}</strong>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              {idx < (survey?.questions?.length || 0) - 1 && <div className="text-muted fw-bold">↓ Next Question</div>}
            </React.Fragment>
          ))}

          <div className="text-muted fw-bold">↓</div>

          {/* End Node */}
          <div className="p-3 border rounded-3 bg-success-subtle text-center" style={{ maxWidth: "420px" }}>
            <span className="badge bg-success text-white mb-1">END SURVEY</span>
            <div className="small fw-bold">"{survey?.endMessage || "Thank you message"}"</div>
          </div>
        </div>
      </div>
    );
  }

  // 4. RESPONSES TAB
  function renderResponsesTab() {
    return (
      <div className="card shadow-sm border p-4">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <div>
            <h5 className="fw-bold mb-1 fs-6">Survey Responses ({responses?.length || 0})</h5>
            <p className="text-secondary small mb-0">Consumer responses captured via Voice AI calls and web links.</p>
          </div>
        </div>

        {responses && responses.length > 0 ? (
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0" style={{ fontSize: "13px" }}>
              <thead className="table-light text-secondary small text-uppercase">
                <tr>
                  <th>Response ID</th>
                  <th>Customer</th>
                  <th>Phone / Email</th>
                  <th>Status</th>
                  <th>Answers</th>
                  <th>Intent</th>
                  <th>Duration</th>
                  <th className="text-end">Action</th>
                </tr>
              </thead>
              <tbody>
                {responses.map((r) => (
                  <tr key={r._id} style={{ cursor: "pointer" }} onClick={() => navigate(`/campaigns/${campaign?._id}/responses/${r._id}`)}>
                    <td className="fw-bold text-dark">{r.responseId}</td>
                    <td>{r.leadName || "Anonymous"}</td>
                    <td className="text-muted small">{r.leadPhone || r.leadEmail || "N/A"}</td>
                    <td>
                      <StatusBadge status={r.status} />
                    </td>
                    <td>
                      <span className="badge bg-light text-dark border">{r.answers?.length || 0} answers</span>
                    </td>
                    <td>
                      <span
                        className={`badge ${
                          r.overallIntent === "positive"
                            ? "bg-success-subtle text-success"
                            : r.overallIntent === "negative"
                            ? "bg-danger-subtle text-danger"
                            : "bg-secondary-subtle text-secondary"
                        }`}
                      >
                        {r.overallIntent || "neutral"}
                      </span>
                    </td>
                    <td className="text-muted">{r.durationSeconds ? `${r.durationSeconds}s` : "-"}</td>
                    <td className="text-end">
                      <Link to={`/campaigns/${campaign?._id}/responses/${r._id}`} className="btn btn-outline-primary btn-sm p-1">
                        <Eye size={14} />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-5">
            <p className="text-secondary small">No responses recorded yet.</p>
          </div>
        )}
      </div>
    );
  }

  // 5. CONVERSATIONS TAB
  function renderConversationsTab() {
    return (
      <div className="card shadow-sm border p-4">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <div>
            <h5 className="fw-bold mb-1 fs-6">AI Voice & Chat Conversations</h5>
            <p className="text-secondary small mb-0">Transcripts and audio recordings from customer sessions.</p>
          </div>
        </div>

        {conversations && conversations.length > 0 ? (
          <div className="d-flex flex-column gap-3">
            {conversations.map((conv) => (
              <div key={conv._id} className="card border p-3 shadow-xs">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <div className="d-flex align-items-center gap-2">
                    <span className="badge bg-primary text-white">Voice Call</span>
                    <strong className="text-dark small">{conv.customerName} ({conv.customerPhone})</strong>
                  </div>
                  <span className="text-muted small">{new Date(conv.startedAt).toLocaleString()}</span>
                </div>
                <p className="text-secondary small mb-3">{conv.summary}</p>

                {/* Transcript Snippet */}
                <div className="bg-light p-3 rounded-2 small d-flex flex-column gap-2 mb-2">
                  {conv.messages.slice(0, 4).map((msg) => (
                    <div key={msg.id} className="d-flex gap-2">
                      <strong className={msg.sender === "ai" ? "text-primary" : "text-dark"}>
                        {msg.sender === "ai" ? "AI Agent:" : `${conv.customerName}:`}
                      </strong>
                      <span className="text-secondary">{msg.text}</span>
                    </div>
                  ))}
                </div>

                <div className="d-flex justify-content-end">
                  <Link to={`/campaigns/${campaign?._id}/conversations`} className="btn btn-outline-secondary btn-sm">
                    View Full Transcript ({conv.messages.length} messages) →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-5">
            <p className="text-secondary small">No conversation logs yet.</p>
          </div>
        )}
      </div>
    );
  }

  // 6. ANALYTICS TAB
  function renderAnalyticsTab() {
    return (
      <div className="d-flex flex-column gap-3">
        <div className="card shadow-sm border p-4">
          <h5 className="fw-bold mb-3 fs-6">Campaign Performance Analytics</h5>

          {analytics?.aiInsights && (
            <div className="alert alert-info border-info-subtle bg-info-subtle mb-4">
              <div className="fw-bold small mb-2 d-flex align-items-center gap-1">
                <Sparkles size={16} />
                <span>AI-Generated Strategic Insights:</span>
              </div>
              <ul className="mb-0 small ps-3">
                {analytics.aiInsights.map((insight, idx) => (
                  <li key={idx} className="mb-1">{insight}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Breakdown Charts Table */}
          {analytics?.nonPurchaseReasons && (
            <div className="row g-3">
              <div className="col-12 col-md-6">
                <div className="card border p-3">
                  <h6 className="fw-bold small mb-3 text-secondary text-uppercase">Non-Purchase Churn Reasons</h6>
                  <div className="d-flex flex-column gap-2">
                    {analytics.nonPurchaseReasons.map((item, idx) => (
                      <div key={idx}>
                        <div className="d-flex justify-content-between small mb-1">
                          <span>{item.reason}</span>
                          <strong>{item.percentage}% ({item.count})</strong>
                        </div>
                        <div className="progress" style={{ height: "6px" }}>
                          <div className="progress-bar bg-danger" style={{ width: `${item.percentage}%` }}></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="col-12 col-md-6">
                <div className="card border p-3">
                  <h6 className="fw-bold small mb-3 text-secondary text-uppercase">Brand Distribution</h6>
                  <div className="d-flex flex-column gap-2">
                    {analytics.brandDistribution?.map((item, idx) => (
                      <div key={idx}>
                        <div className="d-flex justify-content-between small mb-1">
                          <span>{item.brand}</span>
                          <strong>{item.percentage}% ({item.count})</strong>
                        </div>
                        <div className="progress" style={{ height: "6px" }}>
                          <div className="progress-bar bg-primary" style={{ width: `${item.percentage}%` }}></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // 7. SETTINGS TAB
  function renderSettingsTab() {
    return (
      <div className="card shadow-sm border p-4" style={{ maxWidth: "680px" }}>
        <h5 className="fw-bold mb-3 fs-6">Campaign & AI Agent Settings</h5>

        <div className="d-flex flex-column gap-3">
          <div>
            <label className="form-label small fw-bold">Assigned Conversational AI Agent</label>
            <select
              className="form-select form-select-sm"
              value={selectedAgentId || campaign?.agentId || "agent-sarah-01"}
              onChange={(e) => setSelectedAgentId(e.target.value)}
            >
              <option value="agent-sarah-01">Sarah (Voice AI Specialist) - Multilingual</option>
              <option value="agent-alex-02">Alex (B2B Sales Advisor) - Inbound Qualifier</option>
            </select>
          </div>

          <div>
            <label className="form-label small fw-bold">Voice Synthesis Language</label>
            <select className="form-select form-select-sm" defaultValue={campaign?.language || "en-IN"}>
              <option value="en-IN">English (India) [en-IN]</option>
              <option value="en-US">English (US) [en-US]</option>
              <option value="hi-IN">Hindi [hi-IN]</option>
            </select>
          </div>

          <div>
            <label className="form-label small fw-bold">Conversation Mode</label>
            <div className="d-flex gap-3">
              <div className="form-check">
                <input className="form-check-input" type="radio" name="convMode" id="mVoice" defaultChecked />
                <label className="form-check-label small" htmlFor="mVoice">Voice Call</label>
              </div>
              <div className="form-check">
                <input className="form-check-input" type="radio" name="convMode" id="mText" />
                <label className="form-check-label small" htmlFor="mText">Web Chat</label>
              </div>
              <div className="form-check">
                <input className="form-check-input" type="radio" name="convMode" id="mBoth" />
                <label className="form-check-label small" htmlFor="mBoth">Multimodal (Both)</label>
              </div>
            </div>
          </div>

          <div className="pt-3 border-top">
            <button className="btn btn-primary btn-sm px-4" onClick={() => alert("Settings saved successfully.")}>
              Save Settings
            </button>
          </div>
        </div>
      </div>
    );
  }
};
