import React, { useState } from "react";
import { useBusinessInsights, useGenerateInsights } from "../../analytics/hooks/useAnalytics";
import { LoadingSpinner } from "../../../components/common/LoadingSpinner";
import {
  Sparkles,
  RefreshCw,
  Flame,
  AlertTriangle,
  TrendingUp,
  Lightbulb,
  CheckCircle,
  ArrowRight,
  TrendingDown,
  Target,
  BarChart2,
} from "lucide-react";

export const InsightsDashboardPage: React.FC = () => {
  const { data: insightsData, isLoading } = useBusinessInsights();
  const generateMutation = useGenerateInsights();
  const [filterType, setFilterType] = useState<string>("ALL");

  if (isLoading) return <LoadingSpinner message="Loading AI Business Insights..." />;

  const insightsList: any[] = Array.isArray(insightsData)
    ? insightsData
    : (insightsData?.all || insightsData?.opportunities || []);

  const opportunities = insightsList.filter((i) => i.type === "OPPORTUNITY");
  const risks = insightsList.filter((i) => i.type === "RISK");
  const trends = insightsList.filter((i) => i.type === "TREND");
  const recommendations = insightsList.filter((i) => i.type === "RECOMMENDATION");

  const filtered = filterType === "ALL"
    ? insightsList
    : insightsList.filter((i) => i.type === filterType);

  return (
    <div className="d-flex flex-column gap-4">
      {/* Header Banner */}
      <div className="card shadow-sm border p-4 bg-white">
        <div className="d-flex flex-wrap justify-content-between align-items-center gap-3">
          <div>
            <div className="d-flex align-items-center gap-2 mb-1">
              <Sparkles className="text-warning" size={24} />
              <h4 className="fw-bold text-dark mb-0">AI Business Insights & Executive Intelligence</h4>
            </div>
            <p className="text-muted small mb-0">
              Autonomous strategic analysis grounded in real campaign results, conversation signals, objection patterns, and lead scores.
            </p>
          </div>
          <button
            onClick={() => generateMutation.mutate()}
            disabled={generateMutation.isPending}
            className="btn btn-primary d-flex align-items-center gap-2 fw-bold px-3 py-2"
          >
            <RefreshCw size={16} className={generateMutation.isPending ? "animate-spin" : ""} />
            <span>{generateMutation.isPending ? "Analyzing Platform Data..." : "Re-Analyze Data with AI"}</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="row g-3">
        <div className="col-6 col-md-3">
          <div
            className={`card p-3 border cursor-pointer ${filterType === "OPPORTUNITY" ? "border-success bg-success bg-opacity-10" : ""}`}
            onClick={() => setFilterType(filterType === "OPPORTUNITY" ? "ALL" : "OPPORTUNITY")}
          >
            <div className="d-flex justify-content-between align-items-center mb-2">
              <span className="text-muted small fw-bold">OPPORTUNITIES</span>
              <Flame className="text-success" size={20} />
            </div>
            <h3 className="fw-bold text-dark mb-0">{opportunities.length}</h3>
            <span className="text-success small fw-bold">High Growth Potential</span>
          </div>
        </div>

        <div className="col-6 col-md-3">
          <div
            className={`card p-3 border cursor-pointer ${filterType === "RISK" ? "border-danger bg-danger bg-opacity-10" : ""}`}
            onClick={() => setFilterType(filterType === "RISK" ? "ALL" : "RISK")}
          >
            <div className="d-flex justify-content-between align-items-center mb-2">
              <span className="text-muted small fw-bold">RISKS IDENTIFIED</span>
              <AlertTriangle className="text-danger" size={20} />
            </div>
            <h3 className="fw-bold text-dark mb-0">{risks.length}</h3>
            <span className="text-danger small fw-bold">Action Required</span>
          </div>
        </div>

        <div className="col-6 col-md-3">
          <div
            className={`card p-3 border cursor-pointer ${filterType === "TREND" ? "border-info bg-info bg-opacity-10" : ""}`}
            onClick={() => setFilterType(filterType === "TREND" ? "ALL" : "TREND")}
          >
            <div className="d-flex justify-content-between align-items-center mb-2">
              <span className="text-muted small fw-bold">MARKET TRENDS</span>
              <TrendingUp className="text-info" size={20} />
            </div>
            <h3 className="fw-bold text-dark mb-0">{trends.length}</h3>
            <span className="text-info small fw-bold">Behavior Patterns</span>
          </div>
        </div>

        <div className="col-6 col-md-3">
          <div
            className={`card p-3 border cursor-pointer ${filterType === "RECOMMENDATION" ? "border-warning bg-warning bg-opacity-10" : ""}`}
            onClick={() => setFilterType(filterType === "RECOMMENDATION" ? "ALL" : "RECOMMENDATION")}
          >
            <div className="d-flex justify-content-between align-items-center mb-2">
              <span className="text-muted small fw-bold">RECOMMENDATIONS</span>
              <Lightbulb className="text-warning" size={20} />
            </div>
            <h3 className="fw-bold text-dark mb-0">{recommendations.length}</h3>
            <span className="text-warning small fw-bold">Revenue Drivers</span>
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="d-flex justify-content-between align-items-center">
        <div className="btn-group btn-group-sm">
          <button
            className={`btn ${filterType === "ALL" ? "btn-primary" : "btn-outline-secondary"}`}
            onClick={() => setFilterType("ALL")}
          >
            All Insights ({insightsList.length})
          </button>
          <button
            className={`btn ${filterType === "OPPORTUNITY" ? "btn-success" : "btn-outline-secondary"}`}
            onClick={() => setFilterType("OPPORTUNITY")}
          >
            Opportunities ({opportunities.length})
          </button>
          <button
            className={`btn ${filterType === "RISK" ? "btn-danger" : "btn-outline-secondary"}`}
            onClick={() => setFilterType("RISK")}
          >
            Risks ({risks.length})
          </button>
          <button
            className={`btn ${filterType === "TREND" ? "btn-info" : "btn-outline-secondary"}`}
            onClick={() => setFilterType("TREND")}
          >
            Trends ({trends.length})
          </button>
          <button
            className={`btn ${filterType === "RECOMMENDATION" ? "btn-warning" : "btn-outline-secondary"}`}
            onClick={() => setFilterType("RECOMMENDATION")}
          >
            Recommendations ({recommendations.length})
          </button>
        </div>
      </div>

      {/* Insights Cards List */}
      {filtered.length === 0 ? (
        <div className="card p-5 text-center shadow-sm border">
          <Sparkles size={36} className="text-muted mx-auto mb-2" />
          <h5 className="fw-bold text-dark">No Insights in this Category</h5>
          <p className="text-muted small mb-3">Re-analyze your active database to generate new strategic sales insights.</p>
          <div>
            <button
              onClick={() => generateMutation.mutate()}
              className="btn btn-primary btn-sm"
            >
              Analyze Database Now
            </button>
          </div>
        </div>
      ) : (
        <div className="row g-3">
          {filtered.map((insight: any, idx: number) => {
            const isOpportunity = insight.type === "OPPORTUNITY";
            const isRisk = insight.type === "RISK";
            const isTrend = insight.type === "TREND";

            return (
              <div key={idx} className="col-12 col-md-6">
                <div
                  className={`card h-100 border p-4 shadow-sm ${
                    isOpportunity
                      ? "border-success bg-white"
                      : isRisk
                      ? "border-danger bg-white"
                      : isTrend
                      ? "border-info bg-white"
                      : "border-warning bg-white"
                  }`}
                >
                  <div className="d-flex justify-content-between align-items-center mb-3">
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

                  <h5 className="fw-bold text-dark mb-2">{insight.title}</h5>
                  <p className="text-muted small mb-3">{insight.description}</p>

                  {insight.metricChange && (
                    <div className="p-2 bg-light rounded small text-secondary mb-3">
                      <strong>Observed Metric: </strong> {insight.metricChange}
                    </div>
                  )}

                  <div className="mt-auto pt-3 border-top">
                    <div className="d-flex align-items-start gap-2 bg-primary bg-opacity-10 p-3 rounded">
                      <Target className="text-primary mt-1" size={18} />
                      <div>
                        <strong className="text-primary small d-block mb-1">Recommended Next Action:</strong>
                        <span className="text-dark small">{insight.recommendedAction}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
