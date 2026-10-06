import React from "react";
import { FileSpreadsheet, Download, Filter } from "lucide-react";

export const ReportsPage: React.FC = () => {
  return (
    <div className="d-flex flex-column gap-3">
      <div className="card shadow-sm border p-3 d-flex justify-content-between align-items-center">
        <div>
          <h1 className="h5 fw-bold mb-0 text-dark">Executive Reports & CSV Exports</h1>
          <span className="text-muted small" style={{ fontSize: "11px" }}>
            Export normalized response data, conversation transcripts, and churn analysis.
          </span>
        </div>
      </div>

      <div className="row g-3">
        <div className="col-12 col-md-4">
          <div className="card shadow-sm border p-4 text-center">
            <FileSpreadsheet size={32} className="text-primary mx-auto mb-2" />
            <h6 className="fw-bold fs-6">Guard Consumer Study Responses</h6>
            <p className="text-secondary small mb-3">Complete 428 normalized survey records with transcripts.</p>
            <button className="btn btn-outline-primary btn-sm d-flex align-items-center justify-content-center gap-1">
              <Download size={14} />
              <span>Download CSV (245 KB)</span>
            </button>
          </div>
        </div>

        <div className="col-12 col-md-4">
          <div className="card shadow-sm border p-4 text-center">
            <FileSpreadsheet size={32} className="text-danger mx-auto mb-2" />
            <h6 className="fw-bold fs-6">Churn Root Cause Analysis</h6>
            <p className="text-secondary small mb-3">71 non-purchase reason breakdowns & sentiment tags.</p>
            <button className="btn btn-outline-primary btn-sm d-flex align-items-center justify-content-center gap-1">
              <Download size={14} />
              <span>Download CSV (82 KB)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
