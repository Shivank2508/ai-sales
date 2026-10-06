import React from "react";
import { FolderPlus, LucideIcon } from "lucide-react";

interface EmptyStateProps {
  title: string;
  description: string;
  actionText?: string;
  onAction?: () => void;
  icon?: LucideIcon;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  actionText,
  onAction,
  icon: Icon = FolderPlus,
}) => {
  return (
    <div className="card border-dashed p-5 text-center my-4 bg-light-subtle">
      <div className="d-flex justify-content-center mb-3">
        <div className="p-3 bg-primary-subtle text-primary rounded-circle">
          <Icon size={32} />
        </div>
      </div>
      <h5 className="fw-bold mb-1">{title}</h5>
      <p className="text-secondary small mb-3 mx-auto" style={{ maxWidth: "420px" }}>
        {description}
      </p>
      {actionText && onAction && (
        <div>
          <button className="btn btn-primary btn-sm px-3" onClick={onAction}>
            {actionText}
          </button>
        </div>
      )}
    </div>
  );
};
