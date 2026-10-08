import React, { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useLead360 } from "../../analytics/hooks/useAnalytics";
import { LoadingSpinner } from "../../../components/common/LoadingSpinner";
import { StatusBadge } from "../../../components/common/StatusBadge";
import {
  User,
  Building,
  Mail,
  Phone,
  Briefcase,
  MapPin,
  Calendar,
  Sparkles,
  MessageSquare,
  Megaphone,
  CheckSquare,
  ArrowLeft,
  Flame,
  CheckCircle2,
  Clock,
  Award,
} from "lucide-react";

export const LeadDetailPage: React.FC = () => {
  const { leadId } = useParams<{ leadId: string }>();
  const [activeTab, setActiveTab] = useState<"overview" | "campaigns" | "surveys" | "conversations" | "intelligence">("overview");

  const { data: lead360, isLoading, error } = useLead360(leadId || "");

  if (isLoading) return <LoadingSpinner message="Loading Lead 360 profile..." />;

  if (error || !lead360?.lead) {
    return (
      <div className="alert alert-danger p-4 text-center">
        <h5>Lead Not Found</h5>
        <p className="text-muted mb-3">The requested lead profile could not be loaded.</p>
        <Link to="/leads" className="btn btn-outline-danger btn-sm">
          ← Back to Leads
        </Link>
      </div>
    );
  }

  const { lead, campaigns = [], surveys = [], conversations = [], followUps = [], intelligence = [] } = lead360;

  return (
    <div className="d-flex flex-column gap-4">
      {/* Top Navigation */}
      <div className="d-flex justify-content-between align-items-center">
        <Link to="/leads" className="btn btn-outline-secondary btn-sm d-flex align-items-center gap-1">
          <ArrowLeft size={14} />
          <span>Back to Leads</span>
        </Link>
        <div className="d-flex gap-2">
          <span className="badge bg-primary fs-6 px-3 py-2">
            <Award size={14} className="me-1" />
            AI Lead Score: {lead.score || 0}/100
          </span>
          <StatusBadge status={lead.status} />
        </div>
      </div>

      {/* Header Profile Card */}
      <div className="card shadow-sm border p-4 bg-white">
        <div className="row align-items-center g-3">
          <div className="col-auto">
            <div
              className="rounded-circle bg-primary bg-opacity-10 text-primary d-flex align-items-center justify-content-center fw-bold fs-3"
              style={{ width: "64px", height: "64px" }}
            >
              {lead.firstName ? lead.firstName.charAt(0).toUpperCase() : "L"}
            </div>
          </div>
          <div className="col">
            <h4 className="fw-bold text-dark mb-1">
              {lead.firstName} {lead.lastName || ""}
            </h4>
            <div className="d-flex flex-wrap gap-3 text-muted small">
              {lead.jobTitle && (
                <span className="d-flex align-items-center gap-1">
                  <Briefcase size={14} /> {lead.jobTitle}
                </span>
              )}
              {lead.companyName && (
                <span className="d-flex align-items-center gap-1">
                  <Building size={14} /> {lead.companyName}
                </span>
              )}
              {lead.email && (
                <span className="d-flex align-items-center gap-1">
                  <Mail size={14} /> {lead.email}
                </span>
              )}
              {lead.phone && (
                <span className="d-flex align-items-center gap-1">
                  <Phone size={14} /> {lead.phone}
                </span>
              )}
              {lead.location && (
                <span className="d-flex align-items-center gap-1">
                  <MapPin size={14} /> {lead.location}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <ul className="nav nav-tabs border-bottom">
        <li className="nav-item">
          <button
            className={`nav-link ${activeTab === "overview" ? "active fw-bold text-primary" : "text-secondary"}`}
            onClick={() => setActiveTab("overview")}
          >
            Overview & Details
          </button>
        </li>
        <li className="nav-item">
          <button
            className={`nav-link ${activeTab === "campaigns" ? "active fw-bold text-primary" : "text-secondary"}`}
            onClick={() => setActiveTab("campaigns")}
          >
            Campaigns ({campaigns.length})
          </button>
        </li>
        <li className="nav-item">
          <button
            className={`nav-link ${activeTab === "surveys" ? "active fw-bold text-primary" : "text-secondary"}`}
            onClick={() => setActiveTab("surveys")}
          >
            Surveys & Feedback ({surveys.length})
          </button>
        </li>
        <li className="nav-item">
          <button
            className={`nav-link ${activeTab === "conversations" ? "active fw-bold text-primary" : "text-secondary"}`}
            onClick={() => setActiveTab("conversations")}
          >
            Conversations ({conversations.length})
          </button>
        </li>
        <li className="nav-item">
          <button
            className={`nav-link ${activeTab === "intelligence" ? "active fw-bold text-primary" : "text-secondary"}`}
            onClick={() => setActiveTab("intelligence")}
          >
            AI Intelligence ({intelligence.length})
          </button>
        </li>
      </ul>

      {/* Tab Content */}
      <div className="tab-content">
        {/* OVERVIEW TAB */}
        {activeTab === "overview" && (
          <div className="row g-3">
            <div className="col-12 col-md-6">
              <div className="card shadow-sm border p-3 h-100">
                <h6 className="fw-bold text-dark border-bottom pb-2 mb-3">Company & Lead Profile</h6>
                <dl className="row mb-0 small">
                  <dt className="col-sm-4 text-muted">Company Size</dt>
                  <dd className="col-sm-8 text-dark">{lead.companySize || "N/A"}</dd>

                  <dt className="col-sm-4 text-muted">Industry</dt>
                  <dd className="col-sm-8 text-dark">{lead.industry || "N/A"}</dd>

                  <dt className="col-sm-4 text-muted">Website</dt>
                  <dd className="col-sm-8 text-dark">
                    {lead.companyWebsite ? (
                      <a href={lead.companyWebsite} target="_blank" rel="noreferrer" className="text-primary">
                        {lead.companyWebsite}
                      </a>
                    ) : (
                      "N/A"
                    )}
                  </dd>

                  <dt className="col-sm-4 text-muted">Source</dt>
                  <dd className="col-sm-8 text-dark">{lead.source || "Direct / Inbound"}</dd>

                  <dt className="col-sm-4 text-muted">Created Date</dt>
                  <dd className="col-sm-8 text-dark">{new Date(lead.createdAt || Date.now()).toLocaleDateString()}</dd>
                </dl>
              </div>
            </div>

            <div className="col-12 col-md-6">
              <div className="card shadow-sm border p-3 h-100">
                <h6 className="fw-bold text-dark border-bottom pb-2 mb-3">Engagement Summary</h6>
                <div className="d-flex flex-column gap-2">
                  <div className="d-flex justify-content-between p-2 bg-light rounded small">
                    <span className="text-muted">Total Campaigns Outreach:</span>
                    <strong className="text-dark">{campaigns.length}</strong>
                  </div>
                  <div className="d-flex justify-content-between p-2 bg-light rounded small">
                    <span className="text-muted">Surveys Completed:</span>
                    <strong className="text-dark">
                      {surveys.filter((s: any) => s.status === "completed").length} / {surveys.length}
                    </strong>
                  </div>
                  <div className="d-flex justify-content-between p-2 bg-light rounded small">
                    <span className="text-muted">Conversations Logged:</span>
                    <strong className="text-dark">{conversations.length}</strong>
                  </div>
                  <div className="d-flex justify-content-between p-2 bg-light rounded small">
                    <span className="text-muted">Follow-up Tasks:</span>
                    <strong className="text-dark">{followUps.length}</strong>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* CAMPAIGNS TAB */}
        {activeTab === "campaigns" && (
          <div className="card shadow-sm border p-3">
            <h6 className="fw-bold text-dark mb-3">Associated Campaigns</h6>
            {campaigns.length === 0 ? (
              <p className="text-muted small mb-0">This lead has not been enrolled in any campaign yet.</p>
            ) : (
              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0 small">
                  <thead className="table-light">
                    <tr>
                      <th>Campaign Name</th>
                      <th>Action Type</th>
                      <th>Status</th>
                      <th>Last Contacted</th>
                    </tr>
                  </thead>
                  <tbody>
                    {campaigns.map((c: any, idx: number) => (
                      <tr key={idx}>
                        <td className="fw-bold">{c.name || "Campaign"}</td>
                        <td>
                          <span className="badge bg-secondary">{c.action || "SURVEY"}</span>
                        </td>
                        <td>
                          <StatusBadge status={c.status} />
                        </td>
                        <td>{c.lastContactedAt ? new Date(c.lastContactedAt).toLocaleString() : "Pending"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* SURVEYS TAB */}
        {activeTab === "surveys" && (
          <div className="card shadow-sm border p-3">
            <h6 className="fw-bold text-dark mb-3">Survey Responses & Feedback</h6>
            {surveys.length === 0 ? (
              <p className="text-muted small mb-0">No survey responses recorded for this lead.</p>
            ) : (
              <div className="d-flex flex-column gap-3">
                {surveys.map((s: any, idx: number) => (
                  <div key={idx} className="border rounded p-3 bg-light">
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <strong className="text-dark">{s.name || "Survey Session"}</strong>
                      <span className="badge bg-success">{s.completionPercentage || 0}% Complete</span>
                    </div>
                    <div className="d-flex flex-column gap-2 mt-2">
                      {s.answers?.map((ans: any, aIdx: number) => (
                        <div key={aIdx} className="bg-white p-2 rounded border small">
                          <span className="text-secondary fw-bold">Q ({ans.questionId}):</span>
                          <p className="mb-0 text-dark">
                            <strong>Answer: </strong>
                            {typeof ans.normalizedAnswer === "object"
                              ? JSON.stringify(ans.normalizedAnswer)
                              : String(ans.normalizedAnswer !== undefined ? ans.normalizedAnswer : ans.rawAnswer)}
                          </p>
                          {ans.rawAnswer && ans.rawAnswer !== ans.normalizedAnswer && (
                            <span className="text-muted small">Raw Transcript: "{ans.rawAnswer}"</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* CONVERSATIONS TAB */}
        {activeTab === "conversations" && (
          <div className="card shadow-sm border p-3">
            <h6 className="fw-bold text-dark mb-3">Conversations & Transcripts</h6>
            {conversations.length === 0 ? (
              <p className="text-muted small mb-0">No conversations recorded for this lead yet.</p>
            ) : (
              <div className="d-flex flex-column gap-3">
                {conversations.map((conv: any, idx: number) => (
                  <div key={idx} className="border rounded p-3 bg-white">
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <strong className="text-primary">{conv.title || `Conversation ${conv.conversationId}`}</strong>
                      <span className="badge bg-info text-dark">{conv.channel || "CHAT"}</span>
                    </div>
                    <p className="text-muted small mb-2">{conv.messagesCount || 0} messages exchanged</p>
                    <Link to={`/conversations/${conv.conversationId}`} className="btn btn-outline-primary btn-sm">
                      View Full Conversation Transcript →
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* INTELLIGENCE TAB */}
        {activeTab === "intelligence" && (
          <div className="card shadow-sm border p-3">
            <h6 className="fw-bold text-dark mb-3">Conversation Intelligence & Sales Analysis</h6>
            {intelligence.length === 0 ? (
              <p className="text-muted small mb-0">No conversation intelligence reports generated yet.</p>
            ) : (
              <div className="d-flex flex-column gap-3">
                {intelligence.map((report: any, idx: number) => (
                  <div key={idx} className="border rounded p-3 bg-light">
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <span className="badge bg-primary">Intent: {report.intent}</span>
                      <span className="badge bg-warning text-dark">Lead Score: {report.leadScore || 50}/100</span>
                    </div>
                    <p className="text-dark small mb-2">
                      <strong>Executive Summary: </strong>
                      {report.summary}
                    </p>
                    {report.painPoints?.length > 0 && (
                      <div className="mb-2">
                        <strong className="small text-danger">Pain Points: </strong>
                        <span className="small text-dark">{report.painPoints.join(", ")}</span>
                      </div>
                    )}
                    {report.buyingSignals?.length > 0 && (
                      <div className="mb-2">
                        <strong className="small text-success">Buying Signals: </strong>
                        <span className="small text-dark">{report.buyingSignals.join(", ")}</span>
                      </div>
                    )}
                    <div className="p-2 bg-white rounded border border-warning mt-2 small">
                      <strong className="text-dark">Recommended Next Step: </strong>
                      <span className="text-secondary">{report.recommendedAction || report.nextBestAction}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
