import React from "react";

export const LoadingSpinner: React.FC<{ message?: string; size?: "sm" | "md" | "lg" }> = ({
  message = "Loading...",
  size = "md",
}) => {
  const spinnerClass = size === "sm" ? "spinner-border-sm" : size === "lg" ? "spinner-border" : "spinner-border";
  return (
    <div className="d-flex flex-column align-items-center justify-content-center p-5 text-center">
      <div className={`spinner-border text-primary ${spinnerClass} mb-3`} role="status">
        <span className="visually-hidden">Loading...</span>
      </div>
      {message && <p className="text-secondary small mb-0">{message}</p>}
    </div>
  );
};
