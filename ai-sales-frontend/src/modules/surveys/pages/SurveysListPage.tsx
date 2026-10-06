import React from "react";
import { Link } from "react-router-dom";
import { useCampaigns } from "../../campaigns/hooks/useCampaigns";
import { LoadingSpinner } from "../../../components/common/LoadingSpinner";
import { Workflow, Play } from "lucide-react";

export const SurveysListPage: React.FC = () => {
  const { data: campaigns, isLoading } = useCampaigns();

  if (isLoading) return <LoadingSpinner message="Loading surveys..." />;

  return (
    <div className="d-flex flex-column gap-3">
      <div className="card shadow-sm border p-3 d-flex justify-content-between align-items-center">
        <div>
          <h1 className="h5 fw-bold mb-0 text-dark">Survey Questionnaires</h1>
          <span className="text-muted small" style={{ fontSize: "11px" }}>
            Overview of all active and draft research surveys mapped to business campaigns.
          </span>
        </div>
      </div>

      <div className="row g-3">
        {campaigns?.map((c) => (
          <div key={c._id} className="col-12 col-md-6">
            <div className="card shadow-sm border h-100 p-3 d-flex flex-column justify-content-between">
              <div>
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <span className="badge bg-primary-subtle text-primary border small">{c.product || "Core"}</span>
                  <span className="badge bg-light text-secondary border small">{c.language || "en-IN"}</span>
                </div>
                <h5 className="fw-bold fs-6 mb-1 text-dark">{c.name} - Survey Flow</h5>
                <p className="text-secondary small mb-3">{c.description || "Interactive consumer research survey."}</p>
              </div>

              <div className="d-flex gap-2 border-top pt-3">
                <Link to={`/campaigns/${c._id}/survey`} className="btn btn-primary btn-sm flex-grow-1 d-flex align-items-center justify-content-center gap-1">
                  <Workflow size={14} />
                  <span>Open Survey Builder</span>
                </Link>
                <Link to={`/campaigns/${c._id}/survey/preview`} className="btn btn-outline-secondary btn-sm">
                  <Play size={14} />
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
