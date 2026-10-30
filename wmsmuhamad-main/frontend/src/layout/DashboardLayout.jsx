
import React, { useState } from "react";
import Sidebar from "../component/common/Sidebar";
import ThemeToggle from "../component/common/ThemeToggle";
import { Menu, X } from "lucide-react";
import "../styles/sidebar.css"; // Ensure sidebar CSS is loaded

function DashboardLayout({ title, children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <div className="layout-wrapper">
      {/* Sidebar overlay backdrop for mobile */}
      {sidebarOpen && (
        <div 
          className="sidebar-overlay" 
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="main-content">
        <header className="main-header">
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <button 
              className="hamburger-btn" 
              onClick={toggleSidebar}
              aria-label="Toggle Sidebar"
            >
              {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
            <h2 className="header-title" style={{ margin: 0, fontSize: "16px", fontWeight: 700 }}>{title}</h2>
          </div>
          <ThemeToggle />
        </header>

        <main className="content-body">
          {children}
        </main>
      </div>
    </div>
  );
}

export default DashboardLayout;