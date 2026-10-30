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
  Settings,
  User,
  Shield,
  Building2,
  Users,
  Package,
  Layers,
  Tags,
  Truck,
  Briefcase,
  History,
} from "lucide-react";
import "../../styles/sidebar.css";
import authService from "../../services/authService";

function Sidebar({ isOpen, onClose }) {
  const location = useLocation();
  const user = authService.getCurrentUser() || {};
  const role = user.role || "Master";
  const displayName = user.name ? user.name.replace(new RegExp(`\\s*\\(${role}\\)\\s*$`, 'i'), '') : '';

  const isSuperAdmin = role === "Super Admin";

  // Superadmin gets a completely different menu hierarchy
  const superAdminMenuGroups = [
    {
      label: "Command Center",
      items: [
        { name: "Dashboard Overview", path: "/superadmin", icon: Shield, end: true },
        { name: "Warehouse Management", path: "/superadmin/warehouses", icon: Building2 },
        { name: "User Management", path: "/superadmin/users", icon: Users },
        { name: "Goods Receipts Global", path: "/superadmin/goods-receipts", icon: Package },
      ],
    },
    {
      label: "Master Registry",
      items: [
        { name: "Product Catalog", path: "/superadmin/products", icon: Layers },
        { name: "Product Categories", path: "/superadmin/categories", icon: Tags },
        { name: "Vendor Directory", path: "/superadmin/vendors", icon: Truck },
        { name: "Departments", path: "/superadmin/departments", icon: Briefcase },
      ],
    },
    {
      label: "System Security",
      items: [
        { name: "Audit Trail Logs", path: "/superadmin/audit-logs", icon: History },
      ],
    },
  ];

  // Standard role-based menu for non-superadmin users
  const standardMenuGroups = [
    {
      label: "Main Menu",
      items: [
        { name: "Dashboard", path: "/dashboard", icon: LayoutDashboard, end: true, roles: ["Master"] },
        { name: "Goods Receipt", path: "/goods-receipt", icon: PackageCheck, roles: ["Master", "PIC"] },
        { name: "QC Inspection", path: "/qc-inspection", icon: SearchCheck, roles: ["Master", "QC"] },
        { name: "Putaway", path: "/putaway", icon: Boxes, roles: ["Master", "PIC"] },
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

  const menuGroups = isSuperAdmin ? superAdminMenuGroups : standardMenuGroups;

  const handleLogout = async () => {
    await authService.logout();
  };

  return (
    <aside className={`sidebar ${isOpen ? "open" : ""}`}>
      <div className="sidebar-logo">
        <div className="wms-badge">WMS</div>
        <div className="sidebar-heading">Warehouse Management</div>
        <div className="sidebar-org">PT. Electra Persada Utama</div>
        {user.name && (
          <div style={{ fontSize: "11px", color: "#00c2cb", marginTop: "8px", fontWeight: "600", display: "flex", alignItems: "center", gap: "4px" }}>
            {isSuperAdmin ? <Shield size={12} /> : <User size={12} />} {displayName} ({role})
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
                  onClick={onClose}
                >
                  <Icon className="icon" size={18} />
                  <span>{item.name}</span>
                </NavLink>
              );
            })}
          </div>
        ))}
      </div>

      <div className="sidebar-footer">
        <NavLink
          to="/settings"
          className={({ isActive }) =>
            isActive ? "nav-item active" : "nav-item"
          }
          style={{ textDecoration: "none" }}
          onClick={onClose}
        >
          <Settings className="icon" size={18} />
          <span>Settings</span>
        </NavLink>

        <button
          onClick={handleLogout}
          className="nav-item"
          style={{
            background: "none",
            border: "none",
            width: "100%",
            textAlign: "left",
            cursor: "pointer",
            color: "#ff6b6b",
            fontFamily: "inherit"
          }}
        >
          <LogOut className="icon" size={18} style={{ color: "#ff6b6b" }} />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
}

export default Sidebar;