import React from "react";
import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  Megaphone,
  FileQuestion,
  MessagesSquare,
<<<<<<< HEAD
  PhoneCall,
=======
>>>>>>> 94fe2b87bc1486c095acfef3768ddd7065d8625a
  Bot,
  BookOpen,
  Package,
  CalendarClock,
  BarChart3,
  FileSpreadsheet,
  Settings,
  Sparkles,
} from "lucide-react";

interface NavItem {
  label: string;
  path: string;
  icon: React.ElementType;
  badge?: string;
}

const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
<<<<<<< HEAD
  { label: "1. Campaigns", path: "/campaigns", icon: Megaphone },
  { label: "2. Surveys & Forms", path: "/surveys", icon: FileQuestion },
  { label: "3. AI Voice Calling", path: "/ai-agents/live-execution", icon: PhoneCall, badge: "LIVE CALL" },
  { label: "Leads Database", path: "/leads", icon: Users },
  { label: "Knowledge Base", path: "/knowledge", icon: BookOpen },
  { label: "Analytics & Responses", path: "/analytics", icon: BarChart3 },
=======
  { label: "Campaigns", path: "/campaigns", icon: Megaphone },
  { label: "Surveys", path: "/surveys", icon: FileQuestion },
  { label: "Conversations", path: "/conversations", icon: MessagesSquare },
  { label: "AI Agents", path: "/ai-agents", icon: Bot, badge: "AI" },
  { label: "Leads", path: "/leads", icon: Users },
  { label: "Knowledge Base", path: "/knowledge", icon: BookOpen },
  { label: "Products", path: "/products", icon: Package },
  { label: "Follow-ups", path: "/follow-ups", icon: CalendarClock },
  { label: "Analytics", path: "/analytics", icon: BarChart3 },
  { label: "Reports", path: "/reports", icon: FileSpreadsheet },
  { label: "Settings", path: "/settings", icon: Settings },
>>>>>>> 94fe2b87bc1486c095acfef3768ddd7065d8625a
];

export const Sidebar: React.FC<{ isOpen: boolean; onCloseMobile?: () => void }> = ({
  isOpen,
  onCloseMobile,
}) => {
  return (
    <aside
      className={`app-sidebar bg-white border-end d-flex flex-column ${
        isOpen ? "open" : ""
      }`}
      style={{
        width: "260px",
        minHeight: "100vh",
        position: "sticky",
        top: 0,
        zIndex: 1020,
        transition: "transform 0.2s ease-in-out",
      }}
    >
      {/* Brand Header */}
      <div className="p-3 border-bottom d-flex align-items-center justify-content-between">
        <NavLink
          to="/campaigns"
          className="d-flex align-items-center gap-2 text-decoration-none text-dark"
        >
          <div
            className="rounded-3 p-2 bg-primary text-white d-flex align-items-center justify-content-center shadow-sm"
            style={{ width: "36px", height: "36px" }}
          >
            <Bot size={20} />
          </div>
          <div>
            <div className="fw-bold fs-6 lh-1 text-dark d-flex align-items-center gap-1">
              <span>AgentFlow</span>
              <span className="badge bg-primary-subtle text-primary p-1" style={{ fontSize: "9px" }}>
                AI
              </span>
            </div>
            <span className="text-muted" style={{ fontSize: "11px" }}>
              Sales Intelligence
            </span>
          </div>
        </NavLink>
      </div>

      {/* Navigation Links */}
      <div className="flex-grow-1 overflow-y-auto p-2">
        <div className="text-uppercase text-muted px-3 py-2 fw-semibold" style={{ fontSize: "10px", letterSpacing: "0.05em" }}>
          Main Menu
        </div>
        <ul className="nav nav-pills flex-column gap-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.path} className="nav-item">
                <NavLink
                  to={item.path}
                  onClick={onCloseMobile}
                  className={({ isActive }) =>
                    `nav-link d-flex align-items-center justify-content-between px-3 py-2 rounded-2 ${
                      isActive
                        ? "active bg-primary text-white fw-semibold"
                        : "text-secondary hover-bg-light"
                    }`
                  }
                >
                  <div className="d-flex align-items-center gap-2">
                    <Icon size={18} />
                    <span style={{ fontSize: "13.5px" }}>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className="badge bg-white text-primary border rounded-pill px-2 py-0" style={{ fontSize: "10px" }}>
                      {item.badge}
                    </span>
                  )}
                </NavLink>
              </li>
            );
          })}
        </ul>
      </div>

      {/* Bottom Business Workspace Profile */}
      <div className="p-3 border-top bg-light-subtle">
        <div className="d-flex align-items-center gap-2">
          <div
            className="rounded-circle bg-secondary-subtle text-dark fw-bold d-flex align-items-center justify-content-center"
            style={{ width: "32px", height: "32px", fontSize: "12px" }}
          >
            PG
          </div>
          <div className="overflow-hidden">
            <div className="text-truncate fw-semibold text-dark" style={{ fontSize: "12px" }}>
              P&G Consumer Insights
            </div>
            <div className="text-muted text-truncate" style={{ fontSize: "11px" }}>
              Enterprise Plan
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
};
