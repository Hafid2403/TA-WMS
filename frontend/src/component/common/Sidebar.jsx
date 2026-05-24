import { Link, useLocation, NavLink} from "react-router-dom";
import {
  LayoutDashboard,
  PackageCheck,
  SearchCheck,
  ClipboardList,
  Boxes,
  BarChart3,
  Database,
} from "lucide-react";
import "../../styles/sidebar.css"
function Sidebar() {
    const location = useLocation()

  const menuGroups = [
  {
    label: "Main Menu",
    items: [
      { name: "Dashboard", path: "/", icon: LayoutDashboard, end: true },
      { name: "Goods Receipt", path: "/goods-receipt", icon: PackageCheck },
      { name: "QC Inspection", path: "/qc-inspection", icon: SearchCheck },
      { name: "Material Request", path: "/material-request", icon: ClipboardList },
      { name: "Stock Opname", path: "/stock-opname", icon: Boxes },
    ],
  },
  {
    label: "Inventory",
    items: [
      { name: "Stock Overview", path: "/stock-overview", icon: BarChart3 },
      { name: "Master Data", path: "/master-data", icon: Database },
    ],
  },
];

    return  (
       <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="wms-badge">WMS</div>
        <div className="sidebar-heading">Warehouse Management</div>
        <div className="sidebar-org">PT. Electra Persada Utama</div>
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
      </aside>
    )
};

export default Sidebar;