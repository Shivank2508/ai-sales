import React from "react";
import { Link } from "react-router-dom";
import { useCampaigns } from "../../modules/campaigns/hooks/useCampaigns";
import { StatCard } from "../../components/common/StatCard";
import { StatusBadge, CampaignTypeBadge } from "../../components/common/StatusBadge";
import { LoadingSpinner } from "../../components/common/LoadingSpinner";
import {
  Megaphone,
  Users,
  CheckCircle2,
  TrendingUp,
  Clock,
  Plus,
  ArrowRight,
  Workflow,
  Sparkles,
  Bot,
  Layers,
} from "lucide-react";

export const DashboardPage: React.FC = () => {
  const { data: campaigns, isLoading } = useCampaigns();

  if (isLoading) return <LoadingSpinner message="Loading dashboard..." />;

  const totalCampaigns = campaigns?.length || 0;
  const activeCampaigns = campaigns?.filter((c) => c.status === "active").length || 0;
  const totalResponses = campaigns?.reduce((acc, c) => acc + (c.responsesCount || 0), 0) || 0;

  return (
    <div className="d-flex flex-column gap-4">
      {/* Hero Welcome Banner */}
      <div className="card shadow-sm border bg-primary text-white p-4 overflow-hidden position-relative">
        <div className="row align-items-center">
          <div className="col-12 col-md-8">
            <span className="badge bg-white text-primary border mb-2">AI Sales Intelligence Platform</span>
            <h1 className="h3 fw-bold mb-2">Welcome to AgentFlow Enterprise</h1>
            <p className="text-white-50 small mb-3" style={{ maxWidth: "560px" }}>
              Design conversational surveys, configure complex branching conditions, and execute autonomous voice AI research campaigns.
            </p>
            <div className="d-flex gap-2">
              <Link to="/campaigns/create" className="btn btn-light text-primary btn-sm fw-bold px-3">
                <Plus size={15} className="me-1" />
                <span>Create Campaign</span>
              </Link>
              <Link to="/ai-agents" className="btn btn-outline-light btn-sm px-3">
                <span>View AI Agents</span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Top 4 KPI Stat Cards */}
      <div className="row g-3">
        <div className="col-6 col-md-3">
          <StatCard
            title="Total Campaigns"
            value={totalCampaigns}
            subtitle={`${activeCampaigns} active now`}
            icon={Megaphone}
            variant="primary"
          />
        </div>
        <div className="col-6 col-md-3">
          <StatCard
            title="Consumer Responses"
            value={totalResponses}
            subtitle="Captured via Voice & Web"
            icon={Users}
            variant="success"
          />
        </div>
        <div className="col-6 col-md-3">
          <StatCard
            title="Avg Completion"
            value="89%"
            subtitle="Branching optimized"
            icon={TrendingUp}
            variant="purple"
          />
        </div>
        <div className="col-6 col-md-3">
          <StatCard
            title="Active AI Agents"
            value="2"
            subtitle="Voice & text ready"
            icon={Bot}
            variant="info"
          />
        </div>
      </div>

      {/* Recent Campaigns Card */}
      <div className="card shadow-sm border">
        <div className="card-header bg-white py-3 d-flex justify-content-between align-items-center">
          <span className="fw-bold fs-6 text-dark">Active Research & Sales Campaigns</span>
          <Link to="/campaigns" className="btn btn-outline-primary btn-sm">
            View All Campaigns →
          </Link>
        </div>
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0" style={{ fontSize: "13px" }}>
              <thead className="table-light text-secondary small text-uppercase">
                <tr>
                  <th className="ps-3">Campaign</th>
                  <th>Product</th>
                  <th>Type</th>
                  <th>Status</th>
                  <th>Responses</th>
                  <th className="text-end pe-3">Action</th>
                </tr>
              </thead>
              <tbody>
                {campaigns?.slice(0, 5).map((c) => (
                  <tr key={c._id}>
                    <td className="ps-3 fw-bold text-dark">{c.name}</td>
                    <td>{c.product || "Core Platform"}</td>
                    <td>
                      <CampaignTypeBadge type={c.type} />
                    </td>
                    <td>
                      <StatusBadge status={c.status} />
                    </td>
                    <td>
                      <strong>{c.responsesCount || 0}</strong>
                      <span className="text-muted ms-1 small">responses</span>
                    </td>
                    <td className="text-end pe-3">
                      <Link to={`/campaigns/${c._id}`} className="btn btn-outline-secondary btn-sm p-1">
                        Manage →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
