import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  useCampaigns,
  usePublishCampaign,
  usePauseCampaign,
  useArchiveCampaign,
  useDeleteCampaign,
} from "../hooks/useCampaigns";
import { CampaignStatus, CampaignType, ICampaign } from "../../../types";
import { StatusBadge, CampaignTypeBadge } from "../../../components/common/StatusBadge";
import { LoadingSpinner } from "../../../components/common/LoadingSpinner";
import { ErrorState } from "../../../components/common/ErrorState";
import { EmptyState } from "../../../components/common/EmptyState";
import { ConfirmModal } from "../../../components/common/ConfirmModal";
import {
  Plus,
  Search,
  SlidersHorizontal,
  Play,
  Pause,
  Archive,
  Trash2,
  Edit,
  Eye,
  Workflow,
  MoreVertical,
  Layers,
  Calendar,
  Package,
  TrendingUp,
  FileSpreadsheet,
} from "lucide-react";

export const CampaignListPage: React.FC = () => {
  const navigate = useNavigate();

  // Filters
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");

  // Confirm Modal state
  const [confirmAction, setConfirmAction] = useState<{
    type: "publish" | "pause" | "archive" | "delete";
    campaign: ICampaign;
  } | null>(null);

  // Queries & Mutations
  const { data: campaigns, isLoading, isError, error, refetch } = useCampaigns({
    search,
    status: statusFilter,
    type: typeFilter,
  });

  const publishMutation = usePublishCampaign();
  const pauseMutation = usePauseCampaign();
  const archiveMutation = useArchiveCampaign();
  const deleteMutation = useDeleteCampaign();

  const handleConfirmAction = async () => {
    if (!confirmAction) return;
    const { type, campaign } = confirmAction;

    if (type === "publish") {
      await publishMutation.mutateAsync(campaign._id);
    } else if (type === "pause") {
      await pauseMutation.mutateAsync(campaign._id);
    } else if (type === "archive") {
      await archiveMutation.mutateAsync(campaign._id);
    } else if (type === "delete") {
      await deleteMutation.mutateAsync(campaign._id);
    }
    setConfirmAction(null);
  };

  return (
    <div className="d-flex flex-column gap-3">
      {/* Top Header */}
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-3">
        <div>
          <h1 className="h4 fw-bold mb-1">Campaigns</h1>
          <p className="text-secondary small mb-0">
            Create, manage, and monitor AI voice and web research campaigns.
          </p>
        </div>
        <Link to="/campaigns/create" className="btn btn-primary d-flex align-items-center gap-1 shadow-sm">
          <Plus size={16} />
          <span>Create Campaign</span>
        </Link>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="card shadow-sm border">
        <div className="card-body p-3">
          <div className="row g-2 align-items-center">
            {/* Search */}
            <div className="col-12 col-md-4">
              <div className="input-group input-group-sm">
                <span className="input-group-text bg-white text-muted">
                  <Search size={14} />
                </span>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Search campaigns, products..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>

            {/* Status Filter */}
            <div className="col-6 col-md-3">
              <select
                className="form-select form-select-sm"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">All Statuses</option>
                <option value={CampaignStatus.ACTIVE}>Active</option>
                <option value={CampaignStatus.DRAFT}>Draft</option>
                <option value={CampaignStatus.PAUSED}>Paused</option>
                <option value={CampaignStatus.COMPLETED}>Completed</option>
                <option value={CampaignStatus.ARCHIVED}>Archived</option>
              </select>
            </div>

            {/* Type Filter */}
            <div className="col-6 col-md-3">
              <select
                className="form-select form-select-sm"
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
              >
                <option value="all">All Campaign Types</option>
                <option value={CampaignType.PRODUCT_RESEARCH}>Product Research</option>
                <option value={CampaignType.SALES}>Sales Qualification</option>
                <option value={CampaignType.CUSTOMER_RETENTION}>Customer Retention</option>
                <option value={CampaignType.FEEDBACK}>Feedback</option>
                <option value={CampaignType.SURVEY}>General Survey</option>
              </select>
            </div>

            {/* View Mode Toggle */}
            <div className="col-12 col-md-2 d-flex justify-content-end gap-1">
              <button
                className={`btn btn-sm ${viewMode === "table" ? "btn-secondary" : "btn-outline-secondary"}`}
                onClick={() => setViewMode("table")}
                title="Table View"
              >
                <FileSpreadsheet size={14} />
              </button>
              <button
                className={`btn btn-sm ${viewMode === "grid" ? "btn-secondary" : "btn-outline-secondary"}`}
                onClick={() => setViewMode("grid")}
                title="Grid View"
              >
                <Layers size={14} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Campaign List Content */}
      {isLoading ? (
        <LoadingSpinner message="Loading campaigns..." />
      ) : isError ? (
        <ErrorState
          title="Error Loading Campaigns"
          message={error?.message || "Failed to load campaigns list."}
          onRetry={() => refetch()}
        />
      ) : !campaigns || campaigns.length === 0 ? (
        <EmptyState
          title="No campaigns found"
          description={
            search || statusFilter !== "all" || typeFilter !== "all"
              ? "No campaigns matched your current search filters. Try clearing filters."
              : "Get started by creating your first AI-driven research or sales campaign."
          }
          actionText="Create Campaign"
          onAction={() => navigate("/campaigns/create")}
        />
      ) : viewMode === "table" ? (
        /* TABLE VIEW */
        <div className="card shadow-sm border overflow-hidden">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0" style={{ fontSize: "13.5px" }}>
              <thead className="table-light text-secondary small text-uppercase" style={{ fontSize: "11px", letterSpacing: "0.04em" }}>
                <tr>
                  <th className="ps-3 py-3">Campaign</th>
                  <th>Business / Product</th>
                  <th>Type</th>
                  <th>Status</th>
                  <th>Responses</th>
                  <th>Completion Rate</th>
                  <th>Created</th>
                  <th className="text-end pe-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {campaigns.map((c) => (
                  <tr key={c._id} style={{ cursor: "pointer" }} onClick={() => navigate(`/campaigns/${c._id}`)}>
                    <td className="ps-3 py-3">
                      <div className="fw-bold text-dark">{c.name}</div>
                      <div className="text-muted small text-truncate" style={{ maxWidth: "280px", fontSize: "12px" }}>
                        {c.description || "No description"}
                      </div>
                    </td>
                    <td>
                      <div className="text-dark fw-semibold small">{c.product || "Core Platform"}</div>
                      <div className="text-muted small" style={{ fontSize: "11px" }}>{c.businessName || "Default Business"}</div>
                    </td>
                    <td>
                      <CampaignTypeBadge type={c.type} />
                    </td>
                    <td>
                      <StatusBadge status={c.status} />
                    </td>
                    <td>
                      <span className="fw-bold">{c.responsesCount || 0}</span>
                      <span className="text-muted ms-1 small">responses</span>
                    </td>
                    <td>
                      {c.completionRate !== undefined && c.completionRate > 0 ? (
                        <div className="d-flex align-items-center gap-2">
                          <div className="progress flex-grow-1" style={{ height: "5px", width: "60px" }}>
                            <div
                              className="progress-bar bg-success"
                              style={{ width: `${c.completionRate}%` }}
                            ></div>
                          </div>
                          <span className="small fw-semibold">{c.completionRate}%</span>
                        </div>
                      ) : (
                        <span className="text-muted small">0%</span>
                      )}
                    </td>
                    <td className="text-muted small">
                      {c.createdAt ? new Date(c.createdAt).toLocaleDateString() : "Recent"}
                    </td>
                    <td className="text-end pe-3" onClick={(e) => e.stopPropagation()}>
                      <div className="d-inline-flex align-items-center gap-1">
                        <Link
                          to={`/campaigns/${c._id}`}
                          className="btn btn-outline-secondary btn-sm p-1"
                          title="View Details"
                        >
                          <Eye size={14} />
                        </Link>
                        <Link
                          to={`/campaigns/${c._id}/survey`}
                          className="btn btn-outline-primary btn-sm p-1"
                          title="Open Survey Builder"
                        >
                          <Workflow size={14} />
                        </Link>
                        {c.status === CampaignStatus.ACTIVE ? (
                          <button
                            className="btn btn-outline-warning btn-sm p-1"
                            title="Pause Campaign"
                            onClick={() => setConfirmAction({ type: "pause", campaign: c })}
                          >
                            <Pause size={14} />
                          </button>
                        ) : (
                          <button
                            className="btn btn-outline-success btn-sm p-1"
                            title="Publish Live"
                            onClick={() => setConfirmAction({ type: "publish", campaign: c })}
                          >
                            <Play size={14} />
                          </button>
                        )}
                        <button
                          className="btn btn-outline-danger btn-sm p-1"
                          title="Delete Campaign"
                          onClick={() => setConfirmAction({ type: "delete", campaign: c })}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* GRID VIEW */
        <div className="row g-3">
          {campaigns.map((c) => (
            <div key={c._id} className="col-12 col-md-6 col-lg-4">
              <div
                className="card h-100 shadow-sm border hover-shadow"
                style={{ cursor: "pointer" }}
                onClick={() => navigate(`/campaigns/${c._id}`)}
              >
                <div className="card-body p-4 d-flex flex-column justify-content-between">
                  <div>
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <StatusBadge status={c.status} />
                      <CampaignTypeBadge type={c.type} />
                    </div>

                    <h5 className="card-title fw-bold text-dark mb-2 fs-6">{c.name}</h5>
                    <p className="card-text text-secondary small mb-3 text-truncate-2" style={{ fontSize: "12.5px" }}>
                      {c.description || "No description provided."}
                    </p>

                    <div className="bg-light p-2 rounded-2 mb-3 small">
                      <div className="d-flex justify-content-between text-muted mb-1" style={{ fontSize: "11px" }}>
                        <span>Target Product:</span>
                        <strong className="text-dark">{c.product || "Core Platform"}</strong>
                      </div>
                      <div className="d-flex justify-content-between text-muted" style={{ fontSize: "11px" }}>
                        <span>Audience:</span>
                        <span className="text-dark">{c.targetAudience || "General"}</span>
                      </div>
                    </div>
                  </div>

                  <div className="border-top pt-3 d-flex justify-content-between align-items-center">
                    <div>
                      <strong className="fs-6 text-dark">{c.responsesCount || 0}</strong>
                      <span className="text-muted ms-1 small">responses ({c.completionRate || 0}%)</span>
                    </div>

                    <Link
                      to={`/campaigns/${c._id}/survey`}
                      className="btn btn-sm btn-outline-primary d-flex align-items-center gap-1"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Workflow size={13} />
                      <span>Survey</span>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Confirmation Modal */}
      {confirmAction && (
        <ConfirmModal
          isOpen={Boolean(confirmAction)}
          title={
            confirmAction.type === "publish"
              ? "Publish Campaign Live?"
              : confirmAction.type === "pause"
              ? "Pause Active Campaign?"
              : confirmAction.type === "archive"
              ? "Archive Campaign?"
              : "Delete Campaign?"
          }
          message={
            confirmAction.type === "publish"
              ? `Are you sure you want to publish "${confirmAction.campaign.name}"? The conversational AI agent will immediately begin processing customer calls.`
              : confirmAction.type === "delete"
              ? `Are you sure you want to permanently delete "${confirmAction.campaign.name}"? This action cannot be undone.`
              : `Confirm ${confirmAction.type} action on "${confirmAction.campaign.name}".`
          }
          variant={
            confirmAction.type === "publish"
              ? "success"
              : confirmAction.type === "delete"
              ? "danger"
              : "warning"
          }
          confirmText={
            confirmAction.type === "publish"
              ? "Publish Now"
              : confirmAction.type === "delete"
              ? "Delete"
              : "Confirm"
          }
          onConfirm={handleConfirmAction}
          onCancel={() => setConfirmAction(null)}
          isLoading={
            publishMutation.isPending ||
            pauseMutation.isPending ||
            archiveMutation.isPending ||
            deleteMutation.isPending
          }
        />
      )}
    </div>
  );
};
