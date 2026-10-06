import React, { useState } from "react";
import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";

export const MainLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="d-flex min-vh-100 bg-light-subtle">
      {/* Sidebar */}
      <Sidebar
        isOpen={sidebarOpen}
        onCloseMobile={() => setSidebarOpen(false)}
      />

      {/* Backdrop for Mobile */}
      {sidebarOpen && (
        <div
          className="position-fixed inset-0 bg-dark bg-opacity-50 d-md-none"
          style={{ zIndex: 1015, top: 0, bottom: 0, left: 0, right: 0 }}
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content Area */}
      <div className="flex-grow-1 d-flex flex-column overflow-hidden">
        <Header onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
        <main className="flex-grow-1 p-3 p-md-4 overflow-y-auto">
          <div className="container-fluid px-0" style={{ maxWidth: "1400px" }}>
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};
