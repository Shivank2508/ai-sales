import React from "react";
import { Users, Search, Plus, Filter, Phone, Mail, Building } from "lucide-react";

export const LeadListPage: React.FC = () => {
  const leads = [
    { id: "1", name: "Rahul Sharma", phone: "+91 98765 43210", email: "rahul@example.com", status: "qualified", segment: "Tier-2 Metro" },
    { id: "2", name: "Amit Verma", phone: "+91 98111 22334", email: "amit@example.com", status: "contacted", segment: "Tier-1 Metro" },
    { id: "3", name: "Vikram Patel", phone: "+91 97234 56789", email: "vikram@example.com", status: "new", segment: "Tier-3 Town" },
    { id: "4", name: "Suresh Menon", phone: "+91 98450 11223", email: "suresh@example.com", status: "converted", segment: "Tier-2 Metro" },
  ];

  return (
    <div className="d-flex flex-column gap-3">
      <div className="card shadow-sm border p-3 d-flex justify-content-between align-items-center">
        <div>
          <h1 className="h5 fw-bold mb-0 text-dark">Leads & Audience Segments</h1>
          <span className="text-muted small" style={{ fontSize: "11px" }}>
            Target contacts for AI voice automated research calls and outbound campaigns.
          </span>
        </div>
        <button className="btn btn-primary btn-sm d-flex align-items-center gap-1">
          <Plus size={15} />
          <span>Import Leads</span>
        </button>
      </div>

      <div className="card shadow-sm border">
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0" style={{ fontSize: "13px" }}>
            <thead className="table-light text-secondary small text-uppercase">
              <tr>
                <th className="ps-3">Name</th>
                <th>Phone</th>
                <th>Email</th>
                <th>Segment</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {leads.map((l) => (
                <tr key={l.id}>
                  <td className="ps-3 fw-bold">{l.name}</td>
                  <td>{l.phone}</td>
                  <td className="text-muted">{l.email}</td>
                  <td><span className="badge bg-light text-dark border">{l.segment}</span></td>
                  <td><span className="badge bg-success-subtle text-success border text-capitalize">{l.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
