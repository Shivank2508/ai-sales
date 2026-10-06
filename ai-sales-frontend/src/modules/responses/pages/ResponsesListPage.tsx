import React, { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useSurveyResponses } from "../hooks/useResponses";
import { useCampaign } from "../../campaigns/hooks/useCampaigns";
import { StatusBadge } from "../../../components/common/StatusBadge";
import { LoadingSpinner } from "../../../components/common/LoadingSpinner";
import { EmptyState } from "../../../components/common/EmptyState";
import { ErrorState } from "../../../components/common/ErrorState";
import {
  ArrowLeft,
  Search,
  Filter,
  Eye,
  Calendar,
  Clock,
  ThumbsUp,
  ThumbsDown,
  Sparkles,
} from "lucide-react";

export const ResponsesListPage: React.FC = () => {
  const { campaignId = "" } = useParams<{ campaignId: string }>();
  const { data: campaign } = useCampaign(campaignId);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const { data: responses, isLoading, isError, error, refetch } = useSurveyResponses(campaignId, {
    search,
    status: statusFilter,
  });

  return (
    <div className="d-flex flex-column gap-3">
      {/* Header */}
      <div className="card shadow-sm border">
        <div className="card-body p-3 d-flex justify-content-between align-items-center">
          <div className="d-flex align-items-center gap-2">
            <Link to={`/campaigns/${campaignId}`} className="btn btn-outline-secondary btn-sm p-1">
              <ArrowLeft size={16} />
            </Link>
            <div>
              <h1 className="h5 fw-bold mb-0 text-dark">Survey Responses</h1>
              <span className="text-muted small" style={{ fontSize: "11px" }}>
                Campaign: {campaign?.name} ({responses?.length || 0} Submissions)
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Filter */}
      <div className="card shadow-sm border">
        <div className="card-body p-3">
          <div className="row g-2">
            <div className="col-12 col-md-4">
              <div className="input-group input-group-sm">
                <span className="input-group-text bg-white text-muted">
                  <Search size={14} />
                </span>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Search respondent name, phone..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>
            <div className="col-6 col-md-3">
              <select
                className="form-select form-select-sm"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">All Statuses</option>
                <option value="completed">Completed</option>
                <option value="in_progress">In Progress</option>
                <option value="abandoned">Abandoned</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* List Content */}
      {isLoading ? (
        <LoadingSpinner message="Loading survey responses..." />
      ) : isError ? (
        <ErrorState message={error?.message} onRetry={() => refetch()} />
      ) : !responses || responses.length === 0 ? (
        <EmptyState
          title="No responses found"
          description="Customer responses will appear here as AI voice calls and web survey sessions are completed."
        />
      ) : (
        <div className="card shadow-sm border overflow-hidden">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0" style={{ fontSize: "13px" }}>
              <thead className="table-light text-secondary small text-uppercase">
                <tr>
                  <th className="ps-3 py-3">Response ID</th>
                  <th>Customer Name</th>
                  <th>Contact Info</th>
                  <th>Status</th>
                  <th>Answers</th>
                  <th>Intent</th>
                  <th>Duration</th>
                  <th>Completed At</th>
                  <th className="text-end pe-3">Action</th>
                </tr>
              </thead>
              <tbody>
                {responses.map((r) => (
                  <tr key={r._id}>
                    <td className="ps-3 fw-bold text-dark">{r.responseId}</td>
                    <td className="fw-semibold">{r.leadName || "Anonymous Consumer"}</td>
                    <td className="text-muted small">{r.leadPhone || r.leadEmail || "N/A"}</td>
                    <td>
                      <StatusBadge status={r.status} />
                    </td>
                    <td>
                      <span className="badge bg-light text-dark border">{r.answers?.length || 0} Questions</span>
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
                    <td className="text-muted small">
                      {r.completedAt ? new Date(r.completedAt).toLocaleString() : "In Progress"}
                    </td>
                    <td className="text-end pe-3">
                      <Link
                        to={`/campaigns/${campaignId}/responses/${r._id}`}
                        className="btn btn-outline-primary btn-sm p-1"
                        title="View Full Answer Breakdown"
                      >
                        <Eye size={14} />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
