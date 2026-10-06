import React from "react";
import { AlertTriangle, X } from "lucide-react";

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "danger" | "warning" | "primary" | "success";
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "danger",
  onConfirm,
  onCancel,
  isLoading = false,
}) => {
  if (!isOpen) return null;

  const btnClass =
    variant === "danger"
      ? "btn-danger"
      : variant === "warning"
      ? "btn-warning"
      : variant === "success"
      ? "btn-success"
      : "btn-primary";

  return (
    <div
      className="modal fade show d-block"
      tabIndex={-1}
      style={{ backgroundColor: "rgba(15, 23, 42, 0.7)", zIndex: 1055 }}
      onClick={onCancel}
    >
      <div
        className="modal-dialog modal-dialog-centered"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: "460px" }}
      >
        <div className="modal-content shadow-lg border-0">
          <div className="modal-header border-bottom py-3">
            <div className="d-flex align-items-center gap-2">
              <AlertTriangle
                size={20}
                className={
                  variant === "danger"
                    ? "text-danger"
                    : variant === "warning"
                    ? "text-warning"
                    : "text-primary"
                }
              />
              <h5 className="modal-title fs-6 fw-bold mb-0">{title}</h5>
            </div>
            <button
              type="button"
              className="btn-close"
              aria-label="Close"
              onClick={onCancel}
            ></button>
          </div>
          <div className="modal-body py-4">
            <p className="text-secondary small mb-0">{message}</p>
          </div>
          <div className="modal-footer border-top bg-light py-2">
            <button
              type="button"
              className="btn btn-sm btn-outline-secondary px-3"
              onClick={onCancel}
              disabled={isLoading}
            >
              {cancelText}
            </button>
            <button
              type="button"
              className={`btn btn-sm ${btnClass} px-3`}
              onClick={onConfirm}
              disabled={isLoading}
            >
              {isLoading ? "Processing..." : confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
