import React from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Menu,
  Bell,
  Search,
  Plus,
  Bot,
  Sparkles,
  ChevronRight,
  Globe,
} from "lucide-react";

export const Header: React.FC<{ onToggleSidebar: () => void }> = ({
  onToggleSidebar,
}) => {
  const location = useLocation();

  // Generate breadcrumb path
  const pathParts = location.pathname.split("/").filter(Boolean);

  return (
    <header className="navbar navbar-expand bg-white border-bottom px-3 py-2 sticky-top shadow-xs">
      <div className="container-fluid px-0 d-flex justify-content-between align-items-center">
        {/* Left: Mobile Toggle & Breadcrumbs */}
        <div className="d-flex align-items-center gap-3">
          <button
            className="btn btn-outline-secondary btn-sm d-md-none"
            onClick={onToggleSidebar}
            aria-label="Toggle Navigation"
          >
            <Menu size={18} />
          </button>

          <nav aria-label="breadcrumb">
            <ol className="breadcrumb mb-0 align-items-center" style={{ fontSize: "13px" }}>
              <li className="breadcrumb-item">
                <Link to="/campaigns" className="text-secondary text-decoration-none">
                  App
                </Link>
              </li>
              {pathParts.map((part, idx) => {
                const isLast = idx === pathParts.length - 1;
                const path = "/" + pathParts.slice(0, idx + 1).join("/");
                return (
                  <li
                    key={path}
                    className={`breadcrumb-item ${isLast ? "active fw-bold text-dark" : ""}`}
                    aria-current={isLast ? "page" : undefined}
                  >
                    {isLast ? (
                      part.replace("-", " ")
                    ) : (
                      <Link to={path} className="text-secondary text-decoration-none text-capitalize">
                        {part.replace("-", " ")}
                      </Link>
                    )}
                  </li>
                );
              })}
            </ol>
          </nav>
        </div>

        {/* Right: Quick Action & Live Agent Status */}
        <div className="d-flex align-items-center gap-2">
          {/* Live AI Status Pill */}
          <div
            className="d-none d-sm-flex align-items-center gap-2 px-2 py-1 bg-success-subtle text-success border border-success-subtle rounded-pill"
            style={{ fontSize: "11px", fontWeight: 600 }}
          >
            <span className="spinner-grow spinner-grow-sm" style={{ width: "6px", height: "6px" }}></span>
            <span>AI Voice Engine: Live</span>
          </div>

          <Link to="/campaigns/create" className="btn btn-primary btn-sm d-flex align-items-center gap-1">
            <Plus size={15} />
            <span className="d-none d-sm-inline">Create Campaign</span>
          </Link>

          <button className="btn btn-outline-secondary btn-sm p-1 rounded-circle" style={{ width: "32px", height: "32px" }}>
            <Bell size={15} />
          </button>
        </div>
      </div>
    </header>
  );
};
