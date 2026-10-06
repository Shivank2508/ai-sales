import React from "react";
import { AlertCircle, RotateCcw } from "lucide-react";

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = "Failed to load data",
  message = "An error occurred while communicating with the server.",
  onRetry,
}) => {
  return (
    <div className="card border-danger-subtle bg-danger-subtle p-4 my-4 text-center">
      <div className="d-flex justify-content-center mb-2">
        <AlertCircle size={32} className="text-danger" />
      </div>
      <h6 className="fw-bold text-danger mb-1">{title}</h6>
      <p className="text-danger-emphasis small mb-3">{message}</p>
      {onRetry && (
        <div>
          <button className="btn btn-outline-danger btn-sm" onClick={onRetry}>
            <RotateCcw size={14} className="me-1" />
            <span>Retry</span>
          </button>
        </div>
      )}
    </div>
  );
};
