import React, { useState } from "react";
import { CalendarClock, CheckCircle2, XCircle, PhoneCall, Mail, Clock, RefreshCw, AlertCircle, Sparkles } from "lucide-react";
import { useFollowUps, useCompleteFollowUp, useCancelFollowUp } from "../hooks/useFollowUps";
import { useProducts } from "../../products/hooks/useProducts";
import { LoadingSpinner } from "../../../components/common/LoadingSpinner";
import { ErrorState } from "../../../components/common/ErrorState";

export const FollowUpListPage: React.FC = () => {
  const { data: products } = useProducts();
  const [selectedProductId, setSelectedProductId] = useState("");

  const activeProductId = selectedProductId || (products && products[0]?._id) || "";

  const { data: tasks, isLoading, isError, error, refetch } = useFollowUps(activeProductId);
  const completeMutation = useCompleteFollowUp();
  const cancelMutation = useCancelFollowUp();

  const handleComplete = async (id: string) => {
    await completeMutation.mutateAsync({ followUpId: id, notes: "Marked completed by sales lead" });
  };

  const handleCancel = async (id: string) => {
    await cancelMutation.mutateAsync({ followUpId: id, reason: "Cancelled by agent" });
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority?.toUpperCase()) {
      case "HIGH":
      case "URGENT":
        return "badge bg-danger-subtle text-danger border border-danger-subtle";
      case "MEDIUM":
        return "badge bg-warning-subtle text-warning-emphasis border border-warning-subtle";
      default:
        return "badge bg-info-subtle text-info-emphasis border border-info-subtle";
    }
  };

  return (
    <div className="d-flex flex-column gap-3">
      {/* Header */}
      <div className="card shadow-sm border p-3 d-flex flex-row justify-content-between align-items-center">
        <div>
          <div className="d-flex align-items-center gap-2">
            <h1 className="h5 fw-bold mb-0 text-dark">Automated Sales Follow-ups</h1>
            <span className="badge bg-primary-subtle text-primary border rounded-pill">
              {tasks?.length || 0} Pending
            </span>
          </div>
          <span className="text-muted small" style={{ fontSize: "11px" }}>
            Triggered automatically from AI voice call transcripts, customer objections, and survey branching.
          </span>
        </div>
        <div className="d-flex align-items-center gap-2">
          {products && products.length > 0 && (
            <select
              className="form-select form-select-sm"
              style={{ width: "200px" }}
              value={activeProductId}
              onChange={(e) => setSelectedProductId(e.target.value)}
            >
              {products.map((p) => (
                <option key={p._id} value={p._id}>
                  {p.name}
                </option>
              ))}
            </select>
          )}
          <button
            className="btn btn-outline-secondary btn-sm d-flex align-items-center gap-1"
            onClick={() => refetch()}
            title="Refresh Tasks"
          >
            <RefreshCw size={14} />
            <span>Sync</span>
          </button>
        </div>
      </div>

      {/* Main Table */}
      {isLoading ? (
        <LoadingSpinner message="Fetching pending follow-ups from backend..." />
      ) : isError ? (
        <ErrorState message={(error as any)?.message || "Failed to load follow-ups."} onRetry={() => refetch()} />
      ) : !tasks || tasks.length === 0 ? (
        <div className="card shadow-sm border p-5 text-center">
          <CalendarClock size={36} className="mx-auto text-muted mb-2 opacity-50" />
          <h6 className="fw-bold text-secondary">No Pending Follow-ups</h6>
          <p className="text-muted small mb-0">
            Follow-up actions are created automatically when AI calls detect buyer signals or unresolved concerns.
          </p>
        </div>
      ) : (
        <div className="card shadow-sm border">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0" style={{ fontSize: "13px" }}>
              <thead className="table-light text-secondary small text-uppercase">
                <tr>
                  <th className="ps-3">Lead / Prospect</th>
                  <th>Action Type</th>
                  <th>Trigger / Reason</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th className="text-end pe-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {tasks.map((t) => (
                  <tr key={t._id}>
                    <td className="ps-3">
                      <div className="fw-bold text-dark">
                        {t.leadId?.firstName ? `${t.leadId.firstName} ${t.leadId.lastName || ""}` : "Lead Contact"}
                      </div>
                      <span className="text-muted small" style={{ fontSize: "11px" }}>
                        ID: {t._id.slice(-6)}
                      </span>
                    </td>
                    <td>
                      <span className="badge bg-light text-dark border fw-bold text-uppercase">
                        {t.actionType || "CALL"}
                      </span>
                    </td>
                    <td>
                      <div className="text-dark small">{t.triggerEvent || t.reason || "High Purchase Intent"}</div>
                      {t.notes && <span className="text-muted small" style={{ fontSize: "11px" }}>{t.notes}</span>}
                    </td>
                    <td>
                      <span className={getPriorityBadge(t.priority)}>{t.priority || "MEDIUM"}</span>
                    </td>
                    <td>
                      <span className="badge bg-warning-subtle text-warning-emphasis border text-uppercase">
                        {t.status}
                      </span>
                    </td>
                    <td className="text-end pe-3">
                      <div className="d-flex justify-content-end gap-1">
                        <button
                          className="btn btn-outline-success btn-sm p-1 d-flex align-items-center gap-1"
                          title="Complete Task"
                          onClick={() => handleComplete(t._id)}
                        >
                          <CheckCircle2 size={14} />
                          <span style={{ fontSize: "11px" }}>Complete</span>
                        </button>
                        <button
                          className="btn btn-outline-secondary btn-sm p-1"
                          title="Cancel Task"
                          onClick={() => handleCancel(t._id)}
                        >
                          <XCircle size={14} />
                        </button>
                      </div>
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
