import React from "react";
import { CalendarClock, Plus, PhoneCall } from "lucide-react";

export const FollowUpListPage: React.FC = () => {
  const tasks = [
    { id: "1", customer: "Amit Verma", trigger: "Negative Intent (Cuts Concern)", scheduled: "Today, 4:00 PM", status: "pending", priority: "High" },
    { id: "2", customer: "Suresh Menon", trigger: "Expansion / Mach3 Upgrade Inquiry", scheduled: "Tomorrow, 11:00 AM", status: "scheduled", priority: "Medium" },
  ];

  return (
    <div className="d-flex flex-column gap-3">
      <div className="card shadow-sm border p-3 d-flex justify-content-between align-items-center">
        <div>
          <h1 className="h5 fw-bold mb-0 text-dark">Automated Follow-up Tasks</h1>
          <span className="text-muted small" style={{ fontSize: "11px" }}>
            Triggered based on customer intent and survey condition branching rules.
          </span>
        </div>
      </div>

      <div className="card shadow-sm border">
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0" style={{ fontSize: "13px" }}>
            <thead className="table-light text-secondary small text-uppercase">
              <tr>
                <th className="ps-3">Customer</th>
                <th>Trigger Event</th>
                <th>Scheduled Time</th>
                <th>Priority</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {tasks.map((t) => (
                <tr key={t.id}>
                  <td className="ps-3 fw-bold">{t.customer}</td>
                  <td>{t.trigger}</td>
                  <td>{t.scheduled}</td>
                  <td><span className="badge bg-danger-subtle text-danger border">{t.priority}</span></td>
                  <td><span className="badge bg-warning-subtle text-warning-emphasis border text-capitalize">{t.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
