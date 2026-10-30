import { useState } from "react";
import DashboardLayout from "../../layout/DashboardLayout";

function MasterDataPage() {
  const [activeTab, setActiveTab] = useState("products");

  const tabs = [
    { key: "products", label: "Products" },
    { key: "vendors", label: "Vendors" },
    { key: "users", label: "Users" },
    { key: "warehouses", label: "Warehouses" },
    { key: "departments", label: "Departments" },
  ];

  const tabStyle = (key) => ({
    padding: "8px 20px",
    borderRadius: "8px",
    border: "none",
    fontSize: "13px",
    fontWeight: 600,
    cursor: "pointer",
    background: activeTab === key ? "#2C4FDB" : "#fff",
    color: activeTab === key ? "#fff" : "#6B7280",
    boxShadow: activeTab === key ? "0 2px 8px rgba(44,79,219,0.15)" : "none",
    transition: "all 0.2s",
  });

  return (
    <DashboardLayout title="Master Data">

      {/* Tab Bar */}
      <div style={{ display: "flex", gap: "8px", marginBottom: "20px", background: "#fff", padding: "8px", borderRadius: "12px", border: "1px solid #E2E8F0", width: "fit-content" }}>
        {tabs.map((tab) => (
          <button key={tab.key} style={tabStyle(tab.key)} onClick={() => setActiveTab(tab.key)}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Products */}
      {activeTab === "products" && (
        <div style={{ background: "#fff", borderRadius: "12px", border: "1px solid #E2E8F0" }}>
          <div style={{ padding: "16px 20px", borderBottom: "1px solid #E2E8F0", display: "flex", gap: "10px", alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", background: "#F8FAFF", border: "1.5px solid #E2E8F0", borderRadius: "8px", padding: "7px 12px", flex: 1, gap: "8px" }}>
              <span>🔎</span>
              <input placeholder="Search product..." style={{ border: "none", outline: "none", fontSize: "13px", width: "100%", background: "transparent" }} />
            </div>
            <select style={{ padding: "8px 12px", borderRadius: "8px", border: "1.5px solid #E2E8F0", fontSize: "13px" }}>
              <option>All Categories</option>
              <option>Kabel</option>
              <option>Komponen</option>
              <option>Mekanik</option>
            </select>
            <button style={{ padding: "8px 16px", borderRadius: "8px", border: "none", background: "#2C4FDB", color: "#fff", fontSize: "13px", fontWeight: 600, cursor: "pointer" }}>+ Add Product</button>
          </div>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
            <thead>
              <tr>
                {["Internal Code", "Product Name", "Category", "Unit", "Min Stock", "Available", "Status", "Action"].map((h) => (
                  <th key={h} style={{ textAlign: "left", padding: "10px 20px", background: "#F8FAFF", fontSize: "11px", fontWeight: 700, color: "#6B7280", textTransform: "uppercase", borderBottom: "1px solid #E2E8F0" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                { code: "INT-001", name: "Kabel NYM 2x1.5mm", cat: "Kabel", unit: "Roll", min: 20, avail: 148, status: "Active", color: "#D1FAE5", text: "#065F46" },
                { code: "INT-002", name: "Resistor 10kΩ 1/4W", cat: "Komponen", unit: "Pcs", min: 100, avail: 980, status: "Active", color: "#D1FAE5", text: "#065F46" },
                { code: "INT-003", name: "Bearing 6205ZZ", cat: "Mekanik", unit: "Pcs", min: 10, avail: 50, status: "Active", color: "#D1FAE5", text: "#065F46" },
                { code: "INT-004", name: "Kondensator 470uF", cat: "Komponen", unit: "Pcs", min: 50, avail: 495, status: "Active", color: "#D1FAE5", text: "#065F46" },
                { code: "INT-005", name: "IC NE555 Timer", cat: "Komponen", unit: "Pcs", min: 20, avail: 0, status: "Out of Stock", color: "#FEE2E2", text: "#991B1B" },
                { code: "INT-006", name: "Relay 12V SPDT", cat: "Komponen", unit: "Pcs", min: 15, avail: 0, status: "Inactive", color: "#F1F5F9", text: "#6B7280" },
              ].map((row, i) => (
                <tr key={i} style={{ borderBottom: "1px solid #E2E8F0" }}>
                  <td style={{ padding: "12px 20px" }}><span style={{ background: "#F1F5F9", padding: "2px 6px", borderRadius: "4px", fontSize: "11px", fontFamily: "monospace" }}>{row.code}</span></td>
                  <td style={{ padding: "12px 20px", fontWeight: 600 }}>{row.name}</td>
                  <td style={{ padding: "12px 20px", color: "#6B7280" }}>{row.cat}</td>
                  <td style={{ padding: "12px 20px", color: "#6B7280" }}>{row.unit}</td>
                  <td style={{ padding: "12px 20px", color: "#6B7280" }}>{row.min}</td>
                  <td style={{ padding: "12px 20px", fontWeight: 700, color: row.avail === 0 ? "#EF4444" : "#1A1F3C" }}>{row.avail}</td>
                  <td style={{ padding: "12px 20px" }}><span style={{ background: row.color, color: row.text, padding: "3px 10px", borderRadius: "20px", fontSize: "11px", fontWeight: 700 }}>{row.status}</span></td>
                  <td style={{ padding: "12px 20px" }}>
                    <div style={{ display: "flex", gap: "6px" }}>
                      <button style={{ padding: "4px 10px", borderRadius: "6px", border: "1.5px solid #E2E8F0", background: "#fff", fontSize: "12px", cursor: "pointer" }}>✏️ Edit</button>
                      <button style={{ padding: "4px 10px", borderRadius: "6px", border: "none", background: "#FEE2E2", color: "#991B1B", fontSize: "12px", cursor: "pointer" }}>🗑️</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Vendors */}
      {activeTab === "vendors" && (
        <div style={{ background: "#fff", borderRadius: "12px", border: "1px solid #E2E8F0" }}>
          <div style={{ padding: "16px 20px", borderBottom: "1px solid #E2E8F0", display: "flex", gap: "10px", alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", background: "#F8FAFF", border: "1.5px solid #E2E8F0", borderRadius: "8px", padding: "7px 12px", flex: 1, gap: "8px" }}>
              <span>🔎</span>
              <input placeholder="Search vendor..." style={{ border: "none", outline: "none", fontSize: "13px", width: "100%", background: "transparent" }} />
            </div>
            <button style={{ padding: "8px 16px", borderRadius: "8px", border: "none", background: "#2C4FDB", color: "#fff", fontSize: "13px", fontWeight: 600, cursor: "pointer" }}>+ Add Vendor</button>
          </div>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
            <thead>
              <tr>
                {["Vendor Name", "Contact Person", "Phone", "Email", "Status", "Action"].map((h) => (
                  <th key={h} style={{ textAlign: "left", padding: "10px 20px", background: "#F8FAFF", fontSize: "11px", fontWeight: 700, color: "#6B7280", textTransform: "uppercase", borderBottom: "1px solid #E2E8F0" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                { name: "PT. Sumber Makmur", contact: "Budi H.", phone: "021-5551234", email: "budi@sumbermakmur.com" },
                { name: "CV. Tekno Jaya", contact: "Siti R.", phone: "021-5559876", email: "siti@teknojaya.com" },
                { name: "PT. Global Supply", contact: "Ahmad F.", phone: "021-5554567", email: "ahmad@globalsupply.id" },
              ].map((row, i) => (
                <tr key={i} style={{ borderBottom: "1px solid #E2E8F0" }}>
                  <td style={{ padding: "12px 20px", fontWeight: 700 }}>{row.name}</td>
                  <td style={{ padding: "12px 20px" }}>{row.contact}</td>
                  <td style={{ padding: "12px 20px", color: "#6B7280" }}>{row.phone}</td>
                  <td style={{ padding: "12px 20px", color: "#6B7280" }}>{row.email}</td>
                  <td style={{ padding: "12px 20px" }}><span style={{ background: "#D1FAE5", color: "#065F46", padding: "3px 10px", borderRadius: "20px", fontSize: "11px", fontWeight: 700 }}>Active</span></td>
                  <td style={{ padding: "12px 20px" }}>
                    <div style={{ display: "flex", gap: "6px" }}>
                      <button style={{ padding: "4px 10px", borderRadius: "6px", border: "1.5px solid #E2E8F0", background: "#fff", fontSize: "12px", cursor: "pointer" }}>✏️ Edit</button>
                      <button style={{ padding: "4px 10px", borderRadius: "6px", border: "none", background: "#FEE2E2", color: "#991B1B", fontSize: "12px", cursor: "pointer" }}>🗑️</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Users */}
      {activeTab === "users" && (
        <div style={{ background: "#fff", borderRadius: "12px", border: "1px solid #E2E8F0" }}>
          <div style={{ padding: "16px 20px", borderBottom: "1px solid #E2E8F0", display: "flex", gap: "10px", alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", background: "#F8FAFF", border: "1.5px solid #E2E8F0", borderRadius: "8px", padding: "7px 12px", flex: 1, gap: "8px" }}>
              <span>🔎</span>
              <input placeholder="Search user..." style={{ border: "none", outline: "none", fontSize: "13px", width: "100%", background: "transparent" }} />
            </div>
            <select style={{ padding: "8px 12px", borderRadius: "8px", border: "1.5px solid #E2E8F0", fontSize: "13px" }}>
              <option>All Roles</option>
              <option>Master</option>
              <option>PIC</option>
              <option>QC</option>
            </select>
            <button style={{ padding: "8px 16px", borderRadius: "8px", border: "none", background: "#2C4FDB", color: "#fff", fontSize: "13px", fontWeight: 600, cursor: "pointer" }}>+ Add User</button>
          </div>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
            <thead>
              <tr>
                {["Full Name", "Email", "Role", "Warehouse", "Status", "Action"].map((h) => (
                  <th key={h} style={{ textAlign: "left", padding: "10px 20px", background: "#F8FAFF", fontSize: "11px", fontWeight: 700, color: "#6B7280", textTransform: "uppercase", borderBottom: "1px solid #E2E8F0" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                { name: "Muhammad Hafid Al Asyrofi", email: "hafid@electra.id", role: "Master", roleColor: "#EDE9FE", roleText: "#5B21B6", wh: "Main WH" },
                { name: "Muhammad Kasyfil Aziz", email: "kasyfil@electra.id", role: "PIC", roleColor: "#DBEAFE", roleText: "#1E40AF", wh: "Main WH" },
                { name: "Muhammad Habibi Dzikra", email: "habibi@electra.id", role: "QC", roleColor: "#FEF3C7", roleText: "#92400E", wh: "Main WH" },
              ].map((row, i) => (
                <tr key={i} style={{ borderBottom: "1px solid #E2E8F0" }}>
                  <td style={{ padding: "12px 20px", fontWeight: 700 }}>{row.name}</td>
                  <td style={{ padding: "12px 20px", color: "#6B7280" }}>{row.email}</td>
                  <td style={{ padding: "12px 20px" }}><span style={{ background: row.roleColor, color: row.roleText, padding: "3px 10px", borderRadius: "20px", fontSize: "11px", fontWeight: 700 }}>{row.role}</span></td>
                  <td style={{ padding: "12px 20px", color: "#6B7280" }}>{row.wh}</td>
                  <td style={{ padding: "12px 20px" }}><span style={{ background: "#D1FAE5", color: "#065F46", padding: "3px 10px", borderRadius: "20px", fontSize: "11px", fontWeight: 700 }}>Active</span></td>
                  <td style={{ padding: "12px 20px" }}>
                    <div style={{ display: "flex", gap: "6px" }}>
                      <button style={{ padding: "4px 10px", borderRadius: "6px", border: "1.5px solid #E2E8F0", background: "#fff", fontSize: "12px", cursor: "pointer" }}>✏️ Edit</button>
                      <button style={{ padding: "4px 10px", borderRadius: "6px", border: "none", background: "#FEE2E2", color: "#991B1B", fontSize: "12px", cursor: "pointer" }}>🗑️</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Warehouses */}
      {activeTab === "warehouses" && (
        <div style={{ background: "#fff", borderRadius: "12px", border: "1px solid #E2E8F0" }}>
          <div style={{ padding: "16px 20px", borderBottom: "1px solid #E2E8F0", display: "flex", gap: "10px", alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", background: "#F8FAFF", border: "1.5px solid #E2E8F0", borderRadius: "8px", padding: "7px 12px", flex: 1, gap: "8px" }}>
              <span>🔎</span>
              <input placeholder="Search warehouse..." style={{ border: "none", outline: "none", fontSize: "13px", width: "100%", background: "transparent" }} />
            </div>
            <button style={{ padding: "8px 16px", borderRadius: "8px", border: "none", background: "#2C4FDB", color: "#fff", fontSize: "13px", fontWeight: 600, cursor: "pointer" }}>+ Add Warehouse</button>
          </div>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
            <thead>
              <tr>
                {["Warehouse Name", "Address", "City", "PIC", "Status", "Action"].map((h) => (
                  <th key={h} style={{ textAlign: "left", padding: "10px 20px", background: "#F8FAFF", fontSize: "11px", fontWeight: 700, color: "#6B7280", textTransform: "uppercase", borderBottom: "1px solid #E2E8F0" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: "1px solid #E2E8F0" }}>
                <td style={{ padding: "12px 20px", fontWeight: 700 }}>Main Warehouse</td>
                <td style={{ padding: "12px 20px", color: "#6B7280" }}>Jl. Industri No.12</td>
                <td style={{ padding: "12px 20px", color: "#6B7280" }}>Cikarang</td>
                <td style={{ padding: "12px 20px" }}>Hafid</td>
                <td style={{ padding: "12px 20px" }}><span style={{ background: "#D1FAE5", color: "#065F46", padding: "3px 10px", borderRadius: "20px", fontSize: "11px", fontWeight: 700 }}>Active</span></td>
                <td style={{ padding: "12px 20px" }}>
                  <div style={{ display: "flex", gap: "6px" }}>
                    <button style={{ padding: "4px 10px", borderRadius: "6px", border: "1.5px solid #E2E8F0", background: "#fff", fontSize: "12px", cursor: "pointer" }}>✏️ Edit</button>
                    <button style={{ padding: "4px 10px", borderRadius: "6px", border: "none", background: "#FEE2E2", color: "#991B1B", fontSize: "12px", cursor: "pointer" }}>🗑️</button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {/* Departments */}
      {activeTab === "departments" && (
        <div style={{ background: "#fff", borderRadius: "12px", border: "1px solid #E2E8F0" }}>
          <div style={{ padding: "16px 20px", borderBottom: "1px solid #E2E8F0", display: "flex", gap: "10px", alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", background: "#F8FAFF", border: "1.5px solid #E2E8F0", borderRadius: "8px", padding: "7px 12px", flex: 1, gap: "8px" }}>
              <span>🔎</span>
              <input placeholder="Search department..." style={{ border: "none", outline: "none", fontSize: "13px", width: "100%", background: "transparent" }} />
            </div>
            <button style={{ padding: "8px 16px", borderRadius: "8px", border: "none", background: "#2C4FDB", color: "#fff", fontSize: "13px", fontWeight: 600, cursor: "pointer" }}>+ Add Department</button>
          </div>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
            <thead>
              <tr>
                {["Department Name", "Head", "Total Users", "Status", "Action"].map((h) => (
                  <th key={h} style={{ textAlign: "left", padding: "10px 20px", background: "#F8FAFF", fontSize: "11px", fontWeight: 700, color: "#6B7280", textTransform: "uppercase", borderBottom: "1px solid #E2E8F0" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                { name: "Production", head: "Budi Santoso", users: 12 },
                { name: "Engineering", head: "Sari Wulandari", users: 8 },
                { name: "Maintenance", head: "Ahmad Fauzi", users: 5 },
              ].map((row, i) => (
                <tr key={i} style={{ borderBottom: "1px solid #E2E8F0" }}>
                  <td style={{ padding: "12px 20px", fontWeight: 700 }}>{row.name}</td>
                  <td style={{ padding: "12px 20px" }}>{row.head}</td>
                  <td style={{ padding: "12px 20px", color: "#6B7280" }}>{row.users} users</td>
                  <td style={{ padding: "12px 20px" }}><span style={{ background: "#D1FAE5", color: "#065F46", padding: "3px 10px", borderRadius: "20px", fontSize: "11px", fontWeight: 700 }}>Active</span></td>
                  <td style={{ padding: "12px 20px" }}>
                    <div style={{ display: "flex", gap: "6px" }}>
                      <button style={{ padding: "4px 10px", borderRadius: "6px", border: "1.5px solid #E2E8F0", background: "#fff", fontSize: "12px", cursor: "pointer" }}>✏️ Edit</button>
                      <button style={{ padding: "4px 10px", borderRadius: "6px", border: "none", background: "#FEE2E2", color: "#991B1B", fontSize: "12px", cursor: "pointer" }}>🗑️</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

    </DashboardLayout>
  );
}

export default MasterDataPage;