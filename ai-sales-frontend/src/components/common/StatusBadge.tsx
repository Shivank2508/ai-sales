import React from "react";
import { CampaignStatus, CampaignType, ResponseStatus } from "../../types";

export const StatusBadge: React.FC<{ status: CampaignStatus | ResponseStatus | string }> = ({
  status,
}) => {
  switch (status) {
    case CampaignStatus.ACTIVE:
    case ResponseStatus.COMPLETED:
      return (
        <span className="badge bg-success-subtle text-success border border-success-subtle px-2 py-1">
          ● Active
        </span>
      );
    case CampaignStatus.DRAFT:
    case ResponseStatus.IN_PROGRESS:
      return (
        <span className="badge bg-secondary-subtle text-secondary border border-secondary-subtle px-2 py-1">
          Draft
        </span>
      );
    case CampaignStatus.PAUSED:
      return (
        <span className="badge bg-warning-subtle text-warning-emphasis border border-warning-subtle px-2 py-1">
          Paused
        </span>
      );
    case CampaignStatus.ARCHIVED:
    case ResponseStatus.ABANDONED:
    case ResponseStatus.FAILED:
      return (
        <span className="badge bg-danger-subtle text-danger border border-danger-subtle px-2 py-1">
          Archived
        </span>
      );
    case CampaignStatus.COMPLETED:
      return (
        <span className="badge bg-info-subtle text-info-emphasis border border-info-subtle px-2 py-1">
          Completed
        </span>
      );
    default:
      return <span className="badge bg-light text-dark border px-2 py-1">{status}</span>;
  }
};

export const CampaignTypeBadge: React.FC<{ type: CampaignType | string }> = ({ type }) => {
  switch (type) {
    case CampaignType.CUSTOMER_RETENTION:
      return (
        <span className="badge bg-purple-subtle text-purple border px-2 py-1">
          Retention
        </span>
      );
    case CampaignType.SALES:
      return (
        <span className="badge bg-primary-subtle text-primary border border-primary-subtle px-2 py-1">
          Sales
        </span>
      );
    case CampaignType.PRODUCT_RESEARCH:
      return (
        <span className="badge bg-info-subtle text-info border border-info-subtle px-2 py-1">
          Research
        </span>
      );
    case CampaignType.FEEDBACK:
      return (
        <span className="badge bg-secondary-subtle text-secondary border border-secondary-subtle px-2 py-1">
          Feedback
        </span>
      );
    default:
      return (
        <span className="badge bg-light text-secondary border px-2 py-1">
          {type}
        </span>
      );
  }
};
