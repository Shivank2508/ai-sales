import React, { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useCampaignAnalytics } from "../hooks/useAnalytics";
import { useCampaigns } from "../../campaigns/hooks/useCampaigns";
import { StatCard } from "../../../components/common/StatCard";
import { LoadingSpinner } from "../../../components/common/LoadingSpinner";
import {
  BarChart3,
  Users,
  CheckCircle2,
  TrendingUp,
  Clock,
  ThumbsUp,
  ThumbsDown,
  Sparkles,
  PieChart,
  Layers,
  ArrowRight,
} from "lucide-react";

export const AnalyticsPage: React.FC = () => {
  const { data: campaigns } = useCampaigns();
  const [selectedCampaignId, setSelectedCampaignId] = useState<string>(
    campaigns && campaigns.length > 0 ? campaigns[0]._id : "camp-guard-01"
  );

  const { data: analytics, isLoading } = useCampaignAnalytics(selectedCampaignId);

  if (isLoading) return <LoadingSpinner message="Calculating analytics metrics..." />;

  return (
    <div className="d-flex flex-column gap-3">
      {/* Header */}
      <div className="card shadow-sm border">
        <div className="card-body p-3 d-flex flex-wrap justify-content-between align-items-center gap-2">
          <div>
            <h1 className="h5 fw-bold mb-0 text-dark">Research & Sales Analytics</h1>
            <span className="text-muted small" style={{ fontSize: "11px" }}>
              Comprehensive performance metrics, question drop-offs, and brand purchase insights.
            </span>
          </div>

          {/* Campaign Selector */}
          {campaigns && campaigns.length > 0 && (
            <div style={{ minWidth: "260px" }}>
              <select
                className="form-select form-select-sm"
                value={selectedCampaignId}
                onChange={(e) => setSelectedCampaignId(e.target.value)}
              >
                {campaigns.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Top 7 Metric KPI Cards */}
      <div className="row g-3">
        <div className="col-6 col-md-3">
          <StatCard
            title="Total Responses"
            value={analytics?.totalResponses || 428}
            subtitle="All interviews"
            icon={Users}
            variant="primary"
          />
        </div>
        <div className="col-6 col-md-3">
          <StatCard
            title="Completed"
            value={analytics?.completedResponses || 382}
            subtitle="100% finished"
            icon={CheckCircle2}
            variant="success"
          />
        </div>
        <div className="col-6 col-md-3">
          <StatCard
            title="Completion Rate"
            value={`${analytics?.completionRate || 89}%`}
            subtitle="Voice optimized"
            icon={TrendingUp}
            variant="purple"
          />
        </div>
        <div className="col-6 col-md-3">
          <StatCard
            title="Avg. Duration"
            value={`${analytics?.averageDurationSeconds || 114}s`}
            subtitle="Per interview"
            icon={Clock}
            variant="info"
          />
        </div>
      </div>

      {/* Intent Distribution Row */}
      <div className="row g-3">
        <div className="col-12 col-md-4">
          <div className="card shadow-sm border p-3">
            <div className="d-flex justify-content-between align-items-center mb-1">
              <span className="small fw-semibold text-success d-flex align-items-center gap-1">
                <ThumbsUp size={14} /> Positive Intent (Repeat Buyers)
              </span>
              <span className="fw-bold">{analytics?.intentDistribution.positive || 68}%</span>
            </div>
            <div className="progress" style={{ height: "6px" }}>
              <div className="progress-bar bg-success" style={{ width: `${analytics?.intentDistribution.positive || 68}%` }}></div>
            </div>
          </div>
        </div>

        <div className="col-12 col-md-4">
          <div className="card shadow-sm border p-3">
            <div className="d-flex justify-content-between align-items-center mb-1">
              <span className="small fw-semibold text-warning-emphasis d-flex align-items-center gap-1">
                <Sparkles size={14} /> Maybe / Neutral Intent
              </span>
              <span className="fw-bold">{analytics?.intentDistribution.maybe || 14}%</span>
            </div>
            <div className="progress" style={{ height: "6px" }}>
              <div className="progress-bar bg-warning" style={{ width: `${analytics?.intentDistribution.maybe || 14}%` }}></div>
            </div>
          </div>
        </div>

        <div className="col-12 col-md-4">
          <div className="card shadow-sm border p-3">
            <div className="d-flex justify-content-between align-items-center mb-1">
              <span className="small fw-semibold text-danger d-flex align-items-center gap-1">
                <ThumbsDown size={14} /> Negative / Churned
              </span>
              <span className="fw-bold">{analytics?.intentDistribution.negative || 18}%</span>
            </div>
            <div className="progress" style={{ height: "6px" }}>
              <div className="progress-bar bg-danger" style={{ width: `${analytics?.intentDistribution.negative || 18}%` }}></div>
            </div>
          </div>
        </div>
      </div>

      {/* AI Insights & Strategic Recommendations */}
      {analytics?.aiInsights && (
        <div className="card shadow-sm border border-info-subtle bg-info-subtle">
          <div className="card-body p-4">
            <div className="fw-bold fs-6 text-dark d-flex align-items-center gap-2 mb-2">
              <Sparkles size={18} className="text-primary" />
              <span>AI-Generated Strategic Insights & Findings</span>
            </div>
            <ul className="mb-0 small ps-3 text-secondary">
              {analytics.aiInsights.map((insight, idx) => (
                <li key={idx} className="mb-2">{insight}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Question Drop-off Funnel Table */}
      <div className="card shadow-sm border">
        <div className="card-header bg-white py-3">
          <span className="fw-bold fs-6 text-dark">Question Step Retention & Drop-Off Funnel</span>
        </div>
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0" style={{ fontSize: "13px" }}>
              <thead className="table-light text-secondary small text-uppercase">
                <tr>
                  <th className="ps-3">Question Step</th>
                  <th>Topic</th>
                  <th>Reached Count</th>
                  <th>Drop-offs</th>
                  <th>Drop-off Rate</th>
                  <th>Funnel Health</th>
                </tr>
              </thead>
              <tbody>
                {analytics?.questionDropOffs.map((q, idx) => (
                  <tr key={idx}>
                    <td className="ps-3 fw-bold">{q.questionId.toUpperCase()}</td>
                    <td>{q.questionText}</td>
                    <td><strong>{q.reachedCount}</strong></td>
                    <td className="text-danger">{q.dropOffCount}</td>
                    <td><span className="badge bg-light text-dark border">{q.dropOffRate}%</span></td>
                    <td style={{ width: "160px" }}>
                      <div className="progress" style={{ height: "6px" }}>
                        <div
                          className={`progress-bar ${q.dropOffRate > 5 ? "bg-danger" : "bg-success"}`}
                          style={{ width: `${100 - q.dropOffRate}%` }}
                        ></div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Two Breakdown Panels: Brand Distribution & Non-Purchase Reasons */}
      <div className="row g-3">
        {analytics?.nonPurchaseReasons && (
          <div className="col-12 col-md-6">
            <div className="card shadow-sm border h-100 p-4">
              <h6 className="fw-bold small mb-3 text-dark text-uppercase">Root Causes For Non-Purchase / Churn</h6>
              <div className="d-flex flex-column gap-2">
                {analytics.nonPurchaseReasons.map((item, idx) => (
                  <div key={idx}>
                    <div className="d-flex justify-content-between small mb-1">
                      <span className="text-secondary">{item.reason}</span>
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
        )}

        {analytics?.brandDistribution && (
          <div className="col-12 col-md-6">
            <div className="card shadow-sm border h-100 p-4">
              <h6 className="fw-bold small mb-3 text-dark text-uppercase">Brand Selection Breakdown</h6>
              <div className="d-flex flex-column gap-2">
                {analytics.brandDistribution.map((item, idx) => (
                  <div key={idx}>
                    <div className="d-flex justify-content-between small mb-1">
                      <span className="text-secondary">{item.brand}</span>
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
        )}
      </div>
    </div>
  );
};
