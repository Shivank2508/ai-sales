import React from "react";
import { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  variant?: "primary" | "success" | "warning" | "info" | "purple";
  badge?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  variant = "primary",
  badge,
}) => {
  const colorClass =
    variant === "success"
      ? "text-success bg-success-subtle border-success-subtle"
      : variant === "warning"
      ? "text-warning bg-warning-subtle border-warning-subtle"
      : variant === "info"
      ? "text-info bg-info-subtle border-info-subtle"
      : variant === "purple"
      ? "text-purple bg-purple-subtle border-purple-subtle"
      : "text-primary bg-primary-subtle border-primary-subtle";

  return (
    <div className="card h-100 shadow-sm border">
      <div className="card-body p-3">
        <div className="d-flex justify-content-between align-items-center mb-2">
          <span className="text-secondary small fw-semibold text-uppercase" style={{ fontSize: "11px", letterSpacing: "0.03em" }}>
            {title}
          </span>
          <div className={`p-2 rounded-3 border ${colorClass}`}>
            <Icon size={18} />
          </div>
        </div>
        <div className="d-flex align-items-baseline gap-2">
          <h3 className="fw-bold mb-0">{value}</h3>
          {badge && <span className="badge bg-light text-dark border small">{badge}</span>}
        </div>
        {subtitle && <p className="text-muted small mb-0 mt-1" style={{ fontSize: "12px" }}>{subtitle}</p>}
      </div>
    </div>
  );
};
