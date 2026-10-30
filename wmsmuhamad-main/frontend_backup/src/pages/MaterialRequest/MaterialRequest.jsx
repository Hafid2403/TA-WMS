import DashboardLayout from "../../layout/DashboardLayout";

function MaterialRequestPage() {
  return (
    <DashboardLayout title="Material Request">

      {/* Stat Cards */}
      <div className="stats-grid" style={{ marginBottom: "20px" }}>
        <div className="stat-card">
          <div className="stat-label">Pending Approval</div>
          <div className="stat-value">12</div>
          <div className="stat-sub">Awaiting review</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Approved</div>
          <div className="stat-value">38</div>
          <div className="stat-sub">This month</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Rejected</div>
          <div className="stat-value">5</div>
          <div className="stat-sub">This month</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Completed</div>
          <div className="stat-value">33</div>
          <div className="stat-sub">Fulfilled</div>
        </div>
      </div>

      {/* Two Column */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", alignItems: "start" }}>

        {/* New Material Request Form */}
        <div style={{ background: "#fff", borderRadius: "12px", border: "1px solid #E2E8F0" }}>
          <div style={{ padding: "14px 20px", borderBottom: "1px solid #E2E8F0", display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#2C4FDB", display: "inline-block" }}></span>
            <span style={{ fontWeight: 700, fontSize: "14px" }}>New Material Request</span>
          </div>
          <div style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "12px" }}>
            <div>
              <label style={{ fontSize: "12px", fontWeight: 600, color: "#374151", display: "block", marginBottom: "6px" }}>MR Number</label>
              <input defaultValue="MR-2025-0051" readOnly style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1.5px solid #E2E8F0", fontSize: "13px", background: "#F8FAFF", boxSizing: "border-box" }} />
            </div>
            <div>
              <label style={{ fontSize: "12px", fontWeight: 600, color: "#374151", display: "block", marginBottom: "6px" }}>Department</label>
              <select style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1.5px solid #E2E8F0", fontSize: "13px", boxSizing: "border-box" }}>
                <option>Production</option>
                <option>Engineering</option>
                <option>Maintenance</option>
              </select>
            </div>
            <div>
              <label style={{ fontSize: "12px", fontWeight: 600, color: "#374151", display: "block", marginBottom: "6px" }}>Requested By</label>
              <input defaultValue="Budi Santoso" style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1.5px solid #E2E8F0", fontSize: "13px", boxSizing: "border-box" }} />
            </div>
            <div>
              <label style={{ fontSize: "12px", fontWeight: 600, color: "#374151", display: "block", marginBottom: "6px" }}>Request Date</label>
              <input type="date" defaultValue="2025-06-10" style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1.5px solid #E2E8F0", fontSize: "13px", boxSizing: "border-box" }} />
            </div>
            <div>
              <label style={{ fontSize: "12px", fontWeight: 600, color: "#374151", display: "block", marginBottom: "6px" }}>Notes</label>
              <textarea defaultValue="Untuk produksi batch Juli 2025" style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1.5px solid #E2E8F0", fontSize: "13px", boxSizing: "border-box", minHeight: "70px", resize: "vertical" }} />
            </div>

            {/* Requested Items */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
              <span style={{ fontWeight: 700, fontSize: "13px" }}>Requested Items</span>
              <button style={{ padding: "5px 12px", borderRadius: "8px", border: "1.5px solid #2C4FDB", background: "#fff", color: "#2C4FDB", fontSize: "12px", fontWeight: 600, cursor: "pointer" }}>+ Add Item</button>
            </div>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
              <thead>
                <tr>
                  {["#", "Product", "Qty", "Unit", ""].map((h, i) => (
                    <th key={i} style={{ textAlign: "left", padding: "8px 10px", background: "#F8FAFF", fontSize: "11px", fontWeight: 700, color: "#6B7280", textTransform: "uppercase", borderBottom: "1px solid #E2E8F0" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr style={{ borderBottom: "1px solid #E2E8F0" }}>
                  <td style={{ padding: "8px 10px" }}>1</td>
                  <td style={{ padding: "8px 10px" }}>Kabel NYM 2x1.5mm</td>
                  <td style={{ padding: "8px 10px" }}><input type="number" defaultValue="20" style={{ width: "60px", padding: "4px 6px", border: "1.5px solid #E2E8F0", borderRadius: "6px", fontSize: "12px" }} /></td>
                  <td style={{ padding: "8px 10px" }}>Roll</td>
                  <td style={{ padding: "8px 10px" }}><button style={{ padding: "3px 8px", borderRadius: "6px", border: "none", background: "#FEE2E2", color: "#991B1B", fontSize: "12px", cursor: "pointer" }}>✕</button></td>
                </tr>
                <tr>
                  <td style={{ padding: "8px 10px" }}>2</td>
                  <td style={{ padding: "8px 10px" }}>Bearing 6205ZZ</td>
                  <td style={{ padding: "8px 10px" }}><input type="number" defaultValue="10" style={{ width: "60px", padding: "4px 6px", border: "1.5px solid #E2E8F0", borderRadius: "6px", fontSize: "12px" }} /></td>
                  <td style={{ padding: "8px 10px" }}>Pcs</td>
                  <td style={{ padding: "8px 10px" }}><button style={{ padding: "3px 8px", borderRadius: "6px", border: "none", background: "#FEE2E2", color: "#991B1B", fontSize: "12px", cursor: "pointer" }}>✕</button></td>
                </tr>
              </tbody>
            </table>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "8px" }}>
              <button style={{ padding: "8px 20px", borderRadius: "8px", border: "1.5px solid #E2E8F0", background: "#fff", fontSize: "13px", fontWeight: 600, cursor: "pointer" }}>Cancel</button>
              <button style={{ padding: "8px 20px", borderRadius: "8px", border: "none", background: "#2C4FDB", color: "#fff", fontSize: "13px", fontWeight: 600, cursor: "pointer" }}>Submit Request</button>
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

          {/* Pending Approval */}
          <div style={{ background: "#fff", borderRadius: "12px", border: "1px solid #E2E8F0" }}>
            <div style={{ padding: "14px 20px", borderBottom: "1px solid #E2E8F0", display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#F59E0B", display: "inline-block" }}></span>
              <span style={{ fontWeight: 700, fontSize: "14px" }}>Pending Approval</span>
            </div>
            <div style={{ padding: "16px", display: "flex", flexDirection: "column", gap: "10px" }}>
              {[
                { mr: "MR-2025-0050", dept: "Production", by: "Budi S.", date: "09 Jun", items: "3 items · Kabel NYM, Kondensator, Relay" },
                { mr: "MR-2025-0049", dept: "Engineering", by: "Sari W.", date: "08 Jun", items: "2 items · Bearing, IC NE555" },
              ].map((row, i) => (
                <div key={i} style={{ border: "1.5px solid #FEF3C7", borderRadius: "10px", padding: "14px", background: "#FFFBEB" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: "8px" }}>
                    <div>
                      <div style={{ fontSize: "13px", fontWeight: 700 }}>{row.mr}</div>
                      <div style={{ fontSize: "11px", color: "#6B7280" }}>{row.dept} Dept · {row.by} · {row.date}</div>
                    </div>
                    <span style={{ background: "#FEF3C7", color: "#92400E", padding: "3px 10px", borderRadius: "20px", fontSize: "11px", fontWeight: 700 }}>Pending</span>
                  </div>
                  <div style={{ fontSize: "12px", color: "#6B7280", marginBottom: "10px" }}>{row.items}</div>
                  <div style={{ display: "flex", gap: "8px" }}>
                    <button style={{ flex: 1, padding: "6px", borderRadius: "6px", border: "none", background: "#D1FAE5", color: "#065F46", fontSize: "12px", fontWeight: 600, cursor: "pointer" }}>✓ Approve</button>
                    <button style={{ flex: 1, padding: "6px", borderRadius: "6px", border: "none", background: "#FEE2E2", color: "#991B1B", fontSize: "12px", fontWeight: 600, cursor: "pointer" }}>✕ Reject</button>
                    <button style={{ padding: "6px 12px", borderRadius: "6px", border: "1.5px solid #E2E8F0", background: "#fff", fontSize: "12px", cursor: "pointer", color: "black", fontWeight: "bold"}}>Detail</button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* MR History */}
          <div style={{ background: "#fff", borderRadius: "12px", border: "1px solid #E2E8F0" }}>
            <div style={{ padding: "14px 20px", borderBottom: "1px solid #E2E8F0" }}>
              <span style={{ fontWeight: 700, fontSize: "14px" }}>MR History</span>
            </div>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
              <thead>
                <tr>
                  {["MR No", "Dept", "Items", "Status", "Date", "Action"].map((h) => (
                    <th key={h} style={{ textAlign: "left", padding: "10px 14px", background: "#F8FAFF", fontSize: "11px", fontWeight: 700, color: "#6B7280", textTransform: "uppercase", borderBottom: "1px solid #E2E8F0" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  { mr: "MR-2025-0048", dept: "Production", items: "4 items", status: "Completed", color: "#D1FAE5", text: "#065F46", date: "07 Jun" },
                  { mr: "MR-2025-0047", dept: "Maintenance", items: "2 items", status: "Approved", color: "#DBEAFE", text: "#1E40AF", date: "06 Jun" },
                  { mr: "MR-2025-0046", dept: "Engineering", items: "5 items", status: "Rejected", color: "#FEE2E2", text: "#991B1B", date: "05 Jun" },
                ].map((row, i) => (
                  <tr key={i} style={{ borderBottom: "1px solid #E2E8F0" }}>
                    <td style={{ padding: "10px 14px", fontWeight: 700 }}>{row.mr}</td>
                    <td style={{ padding: "10px 14px" }}>{row.dept}</td>
                    <td style={{ padding: "10px 14px", color: "#6B7280" }}>{row.items}</td>
                    <td style={{ padding: "10px 14px" }}><span style={{ background: row.color, color: row.text, padding: "3px 10px", borderRadius: "20px", fontSize: "11px", fontWeight: 700 }}>{row.status}</span></td>
                    <td style={{ padding: "10px 14px", color: "#6B7280" }}>{row.date}</td>
                    <td style={{ padding: "10px 14px" }}>
                      <div style={{ display: "flex", gap: "6px" }}>
                        <button style={{ padding: "4px 8px", borderRadius: "6px", border: "1.5px solid #E2E8F0", background: "#fff", fontSize: "11px", cursor: "pointer" }}>View</button>
                        <button style={{ padding: "4px 8px", borderRadius: "6px", border: "1.5px solid #E2E8F0", background: "#fff", fontSize: "11px", cursor: "pointer" }}>✏️</button>
                        <button style={{ padding: "4px 8px", borderRadius: "6px", border: "none", background: "#FEE2E2", color: "#991B1B", fontSize: "11px", cursor: "pointer" }}>🗑️</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

    </DashboardLayout>
  );
}

export default MaterialRequestPage;