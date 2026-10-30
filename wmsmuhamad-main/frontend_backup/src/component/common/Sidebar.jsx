import { Link, useLocation, NavLink} from "react-router-dom";
import {
  LayoutDashboard,
  PackageCheck,
  SearchCheck,
  ClipboardList,
  Boxes,
  BarChart3,
  Database,
  LogOut,
} from "lucide-react";
import "../../styles/sidebar.css";
import authService from "../../services/authService";

function Sidebar() {
  const location = useLocation();
  const user = authService.getCurrentUser();
  const role = user.role || "Master";

  const menuGroups = [
    {
      label: "Main Menu",
      items: [
        { name: "Dashboard", path: "/dashboard", icon: LayoutDashboard, end: true, roles: ["Master"] },
        { name: "Goods Receipt", path: "/goods-receipt", icon: PackageCheck, roles: ["Master", "PIC"] },
        { name: "QC Inspection", path: "/qc-inspection", icon: SearchCheck, roles: ["Master", "QC"] },
        { name: "Material Request", path: "/material-request", icon: ClipboardList, roles: ["Master", "PIC"] },
        { name: "Stock Opname", path: "/stock-opname", icon: Boxes, roles: ["Master", "PIC"] },
      ].filter(item => !item.roles || item.roles.includes(role)),
    },
    {
      label: "Inventory",
      items: [
        { name: "Stock Overview", path: "/stock-overview", icon: BarChart3, roles: ["Master", "PIC", "QC"] },
        { name: "Master Data", path: "/master-data", icon: Database, roles: ["Master"] },
      ].filter(item => !item.roles || item.roles.includes(role)),
    },
  ].filter(group => group.items.length > 0);

  const handleLogout = async () => {
    await authService.logout();
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="wms-badge">WMS</div>
        <div className="sidebar-heading">Warehouse Management</div>
        <div className="sidebar-org">PT. Electra Persada Utama</div>
        {user.name && (
          <div style={{ fontSize: "11px", color: "#00c2cb", marginTop: "8px", fontWeight: "600" }}>
            👤 {user.name} ({role})
          </div>
        )}
      </div>

      <div className="sidebar-nav">
        {menuGroups.map((group) => (
          <div key={group.label}>
            <div className="nav-label">{group.label}</div>

            {group.items.map((item) => {
              const Icon = item.icon;

              return (
                <NavLink
                  key={item.name}
                  to={item.path}
                  end={item.end || false}
                  className={({ isActive }) =>
                    isActive ? "nav-item active" : "nav-item"
                  }
                >
                  <Icon className="icon" size={18} />
                  <span>{item.name}</span>
                </NavLink>
              );
            })}
          </div>
        ))}
      </div>

      <div style={{ padding: "16px", borderTop: "1px solid rgba(255, 255, 255, 0.08)" }}>
        <button
          onClick={handleLogout}
          className="nav-item"
          style={{
            background: "none",
            border: "none",
            width: "100%",
            textAlign: "left",
            cursor: "pointer",
            padding: "10px 0",
            color: "#ff6b6b",
          }}
        >
          <LogOut className="icon" size={18} style={{ color: "#ff6b6b" }} />
          <span style={{ fontWeight: 600 }}>Sign Out</span>
        </button>
      </div>
    </aside>
  );
}

export default Sidebar;