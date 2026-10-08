import React from "react";
import { Link } from "react-router-dom";
import { useCampaigns } from "../../modules/campaigns/hooks/useCampaigns";
<<<<<<< HEAD
import { useDashboardMetrics, useBusinessInsights, useGenerateInsights } from "../../modules/analytics/hooks/useAnalytics";
=======
>>>>>>> 94fe2b87bc1486c095acfef3768ddd7065d8625a
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
<<<<<<< HEAD
  Sparkles,
  Bot,
  MessageSquare,
  Flame,
  AlertTriangle,
  Lightbulb,
  TrendingDown,
  RefreshCw,
  UploadCloud,
  FileQuestion,
  PhoneCall,
  BookOpen,
} from "lucide-react";

export const DashboardPage: React.FC = () => {
  const { data: campaigns, isLoading: campaignsLoading } = useCampaigns();
  const { data: metrics, isLoading: metricsLoading } = useDashboardMetrics();
  const { data: insightsData, isLoading: insightsLoading } = useBusinessInsights();
  const generateInsightsMutation = useGenerateInsights();

  if (campaignsLoading || metricsLoading) {
    return <LoadingSpinner message="Loading live sales intelligence dashboard..." />;
  }

  const totalLeads = metrics?.leads?.total || 0;
  const totalCampaigns = metrics?.campaigns?.total || campaigns?.length || 0;
  const activeCampaigns = metrics?.campaigns?.active || campaigns?.filter((c) => c.status === "active" || c.status === "running").length || 0;
  const totalResponses = metrics?.surveys?.totalSessions || 0;
  const completionRate = metrics?.surveys?.completionRate || 0;
  const totalConversations = metrics?.conversations?.total || 0;
  const avgSentiment = metrics?.intelligence?.avgSentimentScore || 0.5;
  const avgLeadScore = metrics?.intelligence?.avgLeadScore || 50;

  const insightsList = Array.isArray(insightsData)
    ? insightsData
    : (insightsData?.all || insightsData?.opportunities || []);
=======
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
>>>>>>> 94fe2b87bc1486c095acfef3768ddd7065d8625a

  return (
    <div className="d-flex flex-column gap-4">
      {/* Hero Welcome Banner */}
      <div className="card shadow-sm border bg-primary text-white p-4 overflow-hidden position-relative">
        <div className="row align-items-center">
          <div className="col-12 col-md-8">
<<<<<<< HEAD
            <span className="badge bg-white text-primary border mb-2">AI Sales Platform</span>
            <h1 className="h3 fw-bold mb-2">Campaign Outreach & Survey Intelligence</h1>
            <p className="text-white-50 small mb-3" style={{ maxWidth: "560px" }}>
              1. Create Campaign → 2. Build or Upload Survey → 3. AI Voice Calling Outreach with Knowledge Base Q&A.
=======
            <span className="badge bg-white text-primary border mb-2">AI Sales Intelligence Platform</span>
            <h1 className="h3 fw-bold mb-2">Welcome to AgentFlow Enterprise</h1>
            <p className="text-white-50 small mb-3" style={{ maxWidth: "560px" }}>
              Design conversational surveys, configure complex branching conditions, and execute autonomous voice AI research campaigns.
>>>>>>> 94fe2b87bc1486c095acfef3768ddd7065d8625a
            </p>
            <div className="d-flex gap-2">
              <Link to="/campaigns/create" className="btn btn-light text-primary btn-sm fw-bold px-3">
                <Plus size={15} className="me-1" />
<<<<<<< HEAD
                <span>1. Make Campaign</span>
              </Link>
              <Link to="/surveys" className="btn btn-outline-light btn-sm px-3">
                <FileQuestion size={15} className="me-1" />
                <span>2. Make Survey (Form / Upload)</span>
              </Link>
              <Link to="/campaigns" className="btn btn-success text-white btn-sm fw-bold px-3">
                <PhoneCall size={15} className="me-1" />
                <span>3. Run AI Calling</span>
=======
                <span>Create Campaign</span>
              </Link>
              <Link to="/ai-agents" className="btn btn-outline-light btn-sm px-3">
                <span>View AI Agents</span>
>>>>>>> 94fe2b87bc1486c095acfef3768ddd7065d8625a
              </Link>
            </div>
          </div>
        </div>
      </div>

<<<<<<< HEAD
      {/* 3-Step Direct Workflow Cards */}
      <div className="row g-3">
        <div className="col-12 col-md-4">
          <div className="card shadow-sm border h-100 p-3 hover-shadow transition">
            <div className="d-flex align-items-center justify-content-between mb-2">
              <span className="badge bg-primary text-white rounded-pill px-3 py-1">Step 1</span>
              <Megaphone size={20} className="text-primary" />
            </div>
            <h5 className="fw-bold fs-6 mb-1">Make Campaign</h5>
            <p className="text-secondary small mb-3">
              Define your target audience, value proposition, and AI sales voice opening hook.
            </p>
            <Link to="/campaigns/create" className="btn btn-outline-primary btn-sm w-100 d-flex align-items-center justify-content-center gap-1 mt-auto">
              <span>Create Campaign</span>
              <ArrowRight size={14} />
            </Link>
          </div>
        </div>

        <div className="col-12 col-md-4">
          <div className="card shadow-sm border h-100 p-3 hover-shadow transition">
            <div className="d-flex align-items-center justify-content-between mb-2">
              <span className="badge bg-purple text-white rounded-pill px-3 py-1" style={{ backgroundColor: "#7c3aed" }}>Step 2</span>
              <FileQuestion size={20} className="text-purple" style={{ color: "#7c3aed" }} />
            </div>
            <h5 className="fw-bold fs-6 mb-1">Make Survey (Form or Upload)</h5>
            <p className="text-secondary small mb-3">
              Design questions via visual builder or upload questionnaire files (JSON, CSV, PDF, DOCX).
            </p>
            <div className="d-flex gap-2 mt-auto">
              <Link to="/surveys" className="btn btn-outline-secondary btn-sm flex-fill d-flex align-items-center justify-content-center gap-1">
                <UploadCloud size={14} />
                <span>Upload</span>
              </Link>
              <Link to="/surveys" className="btn btn-primary btn-sm flex-fill d-flex align-items-center justify-content-center gap-1">
                <span>Form Builder</span>
                <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        </div>

        <div className="col-12 col-md-4">
          <div className="card shadow-sm border h-100 p-3 hover-shadow transition">
            <div className="d-flex align-items-center justify-content-between mb-2">
              <span className="badge bg-success text-white rounded-pill px-3 py-1">Step 3</span>
              <PhoneCall size={20} className="text-success" />
            </div>
            <h5 className="fw-bold fs-6 mb-1">Run AI Calling Campaign</h5>
            <p className="text-secondary small mb-3">
              AI calls leads to ask survey questions. If lead asks any off-survey question, AI answers from Knowledge Base!
            </p>
            <Link to="/campaigns" className="btn btn-success text-white btn-sm w-100 d-flex align-items-center justify-content-center gap-1 mt-auto">
              <span>Launch Calling Outreach</span>
              <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </div>

      {/* Top 6 KPI Stat Cards */}
      <div className="row g-3">
        <div className="col-6 col-md-4 col-lg-2">
          <StatCard
            title="Total Leads"
            value={totalLeads}
            subtitle={`${metrics?.leads?.conversionRate || 0}% conversion`}
            icon={Users}
            variant="primary"
          />
        </div>
        <div className="col-6 col-md-4 col-lg-2">
          <StatCard
            title="Active Campaigns"
            value={activeCampaigns}
            subtitle={`${totalCampaigns} total`}
            icon={Megaphone}
            variant="purple"
          />
        </div>
        <div className="col-6 col-md-4 col-lg-2">
          <StatCard
            title="Survey Responses"
            value={totalResponses}
            subtitle={`${completionRate}% completion`}
            icon={CheckCircle2}
            variant="success"
          />
        </div>
        <div className="col-6 col-md-4 col-lg-2">
          <StatCard
            title="Conversations"
            value={totalConversations}
            subtitle="Text & Voice AI"
            icon={MessageSquare}
            variant="info"
          />
        </div>
        <div className="col-6 col-md-4 col-lg-2">
          <StatCard
            title="Lead Fit Score"
            value={`${avgLeadScore}/100`}
            subtitle="AI Evaluated"
            icon={TrendingUp}
            variant="warning"
          />
        </div>
        <div className="col-6 col-md-4 col-lg-2">
          <StatCard
            title="Avg Sentiment"
            value={avgSentiment >= 0.6 ? "Positive" : avgSentiment >= 0.4 ? "Neutral" : "Negative"}
            subtitle={`Score: ${avgSentiment}`}
            icon={Bot}
            variant="primary"
          />
        </div>
      </div>

      {/* AI Business Insights Section */}
      <div className="card shadow-sm border">
        <div className="card-header bg-white py-3 d-flex justify-content-between align-items-center">
          <div className="d-flex align-items-center gap-2">
            <Sparkles className="text-warning" size={20} />
            <span className="fw-bold fs-6 text-dark">Executive AI Business Insights</span>
          </div>
          <button
            onClick={() => generateInsightsMutation.mutate()}
            disabled={generateInsightsMutation.isPending}
            className="btn btn-outline-primary btn-sm d-flex align-items-center gap-1"
          >
            <RefreshCw size={14} className={generateInsightsMutation.isPending ? "animate-spin" : ""} />
            <span>Refresh Insights</span>
          </button>
        </div>
        <div className="card-body p-3">
          {insightsLoading ? (
            <div className="p-3 text-center text-muted small">Loading AI insights...</div>
          ) : insightsList.length === 0 ? (
            <div className="p-4 text-center">
              <p className="text-muted small mb-2">No AI business insights generated yet.</p>
              <button
                onClick={() => generateInsightsMutation.mutate()}
                className="btn btn-primary btn-sm"
              >
                Analyze Database & Generate Insights
              </button>
            </div>
          ) : (
            <div className="row g-3">
              {insightsList.slice(0, 4).map((insight: any, idx: number) => {
                const isOpportunity = insight.type === "OPPORTUNITY";
                const isRisk = insight.type === "RISK";
                const isTrend = insight.type === "TREND";

                return (
                  <div key={idx} className="col-12 col-md-6">
                    <div
                      className={`card h-100 border p-3 ${
                        isOpportunity
                          ? "border-success bg-success bg-opacity-10"
                          : isRisk
                          ? "border-danger bg-danger bg-opacity-10"
                          : isTrend
                          ? "border-info bg-info bg-opacity-10"
                          : "border-warning bg-warning bg-opacity-10"
                      }`}
                    >
                      <div className="d-flex justify-content-between align-items-start mb-2">
                        <span
                          className={`badge ${
                            isOpportunity
                              ? "bg-success"
                              : isRisk
                              ? "bg-danger"
                              : isTrend
                              ? "bg-info text-dark"
                              : "bg-warning text-dark"
                          }`}
                        >
                          {isOpportunity && <Flame size={12} className="me-1" />}
                          {isRisk && <AlertTriangle size={12} className="me-1" />}
                          {isTrend && <TrendingUp size={12} className="me-1" />}
                          {!isOpportunity && !isRisk && !isTrend && <Lightbulb size={12} className="me-1" />}
                          {insight.type}
                        </span>
                        <span className="badge bg-secondary">{insight.impact} IMPACT</span>
                      </div>
                      <h6 className="fw-bold text-dark mb-1">{insight.title}</h6>
                      <p className="text-muted small mb-2">{insight.description}</p>
                      <div className="mt-auto pt-2 border-top border-light">
                        <strong className="text-dark small d-block">Recommended Action:</strong>
                        <span className="text-secondary small">{insight.recommendedAction}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
=======
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
>>>>>>> 94fe2b87bc1486c095acfef3768ddd7065d8625a
      </div>

      {/* Recent Campaigns Card */}
      <div className="card shadow-sm border">
        <div className="card-header bg-white py-3 d-flex justify-content-between align-items-center">
<<<<<<< HEAD
          <span className="fw-bold fs-6 text-dark">Active Campaigns & Research Flows</span>
=======
          <span className="fw-bold fs-6 text-dark">Active Research & Sales Campaigns</span>
>>>>>>> 94fe2b87bc1486c095acfef3768ddd7065d8625a
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
<<<<<<< HEAD
                  <th>Audience / Progress</th>
=======
                  <th>Responses</th>
>>>>>>> 94fe2b87bc1486c095acfef3768ddd7065d8625a
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
<<<<<<< HEAD
                      <strong>{c.stats?.contactedLeads || c.responsesCount || 0}</strong>
                      <span className="text-muted ms-1 small">
                        / {c.stats?.totalLeads || 1} leads ({c.stats?.responseRate || 0}%)
                      </span>
=======
                      <strong>{c.responsesCount || 0}</strong>
                      <span className="text-muted ms-1 small">responses</span>
>>>>>>> 94fe2b87bc1486c095acfef3768ddd7065d8625a
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
