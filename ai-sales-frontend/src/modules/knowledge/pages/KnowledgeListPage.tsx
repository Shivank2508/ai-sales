import React from "react";
import { BookOpen, Plus, FileText, CheckCircle2, Search } from "lucide-react";

export const KnowledgeListPage: React.FC = () => {
  const docs = [
    { id: "1", title: "Gillette Guard Product Specs & Razor Guide.pdf", type: "PDF", size: "2.4 MB", chunks: 42, status: "indexed" },
    { id: "2", title: "Indian Consumer Shaving Research FAQ.docx", type: "DOCX", size: "1.1 MB", chunks: 28, status: "indexed" },
    { id: "3", title: "Safety Comb & Blade Maintenance Manual.pdf", type: "PDF", size: "3.8 MB", chunks: 64, status: "indexed" },
  ];

  return (
    <div className="d-flex flex-column gap-3">
      <div className="card shadow-sm border p-3 d-flex justify-content-between align-items-center">
        <div>
          <h1 className="h5 fw-bold mb-0 text-dark">Knowledge Base & RAG Documents</h1>
          <span className="text-muted small" style={{ fontSize: "11px" }}>
            Documents indexed for AI voice agent real-time retrieval-augmented generation.
          </span>
        </div>
        <button className="btn btn-primary btn-sm d-flex align-items-center gap-1">
          <Plus size={15} />
          <span>Upload Document</span>
        </button>
      </div>

      <div className="card shadow-sm border">
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0" style={{ fontSize: "13px" }}>
            <thead className="table-light text-secondary small text-uppercase">
              <tr>
                <th className="ps-3">Document Title</th>
                <th>Format</th>
                <th>Size</th>
                <th>Chunks</th>
                <th>Vector Status</th>
              </tr>
            </thead>
            <tbody>
              {docs.map((d) => (
                <tr key={d.id}>
                  <td className="ps-3 fw-bold text-dark d-flex align-items-center gap-2">
                    <FileText size={16} className="text-primary" />
                    <span>{d.title}</span>
                  </td>
                  <td><span className="badge bg-light text-dark border">{d.type}</span></td>
                  <td className="text-muted">{d.size}</td>
                  <td><strong>{d.chunks}</strong> chunks</td>
                  <td><span className="badge bg-success-subtle text-success border">✓ Ready in Vector Store</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
