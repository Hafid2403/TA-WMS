import DashboardLayout from "../../layout/DashboardLayout";

function QCInspectionPage() {
  return (
    <DashboardLayout title="QC Inspection">

      {/* Stat Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px", marginBottom: "20px" }}>
        <div className="stat-card">
          <div className="stat-label">Pending Inspection</div>
          <div className="stat-value">7</div>
          <div className="stat-sub">Items awaiting QC</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Passed Today</div>
          <div className="stat-value">24</div>
          <div className="stat-sub">Items accepted</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Rejected Today</div>
          <div className="stat-value">3</div>
          <div className="stat-sub">Items returned to vendor</div>
        </div>
      </div>

      {/* Pending Inspection Panel */}
      <div style={{ background: "#fff", borderRadius: "12px", border: "1px solid #E2E8F0", marginBottom: "20px" }}>
        <div style={{ padding: "14px 20px", borderBottom: "1px solid #E2E8F0", display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#F59E0B", display: "inline-block" }}></span>
          <span style={{ fontWeight: 700, fontSize: "14px" }}>GR-2025-0085 — CV. Tekno Jaya</span>
          <span style={{ background: "#FEF3C7", color: "#92400E", padding: "3px 10px", borderRadius: "20px", fontSize: "11px", fontWeight: 700 }}>Pending Inspection</span>
        </div>

        <div style={{ padding: "16px 20px" }}>
          {/* Info */}
          <div style={{ display: "flex", gap: "16px", fontSize: "12px", color: "#6B7280", marginBottom: "20px" }}>
            <span>📅 Received: 08 Jun 2025</span>
            <span>👤 PIC: Hafid</span>
            <span>📦 3 items</span>
          </div>

          {/* Steps */}
          <div style={{ display: "flex", alignItems: "center", marginBottom: "24px" }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "4px" }}>
              <div style={{ width: "28px", height: "28px", borderRadius: "50%", background: "#D1FAE5", color: "#065F46", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", fontWeight: 700 }}>✓</div>
              <span style={{ fontSize: "11px", color: "#6B7280" }}>Received</span>
            </div>
            <div style={{ flex: 1, height: "2px", background: "#D1FAE5", margin: "0 8px", marginBottom: "16px" }}></div>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "4px" }}>
              <div style={{ width: "28px", height: "28px", borderRadius: "50%", background: "#2C4FDB", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", fontWeight: 700 }}>2</div>
              <span style={{ fontSize: "11px", color: "#2C4FDB", fontWeight: 700 }}>Inspection</span>
            </div>
            <div style={{ flex: 1, height: "2px", background: "#E2E8F0", margin: "0 8px", marginBottom: "16px" }}></div>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "4px" }}>
              <div style={{ width: "28px", height: "28px", borderRadius: "50%", background: "#F1F5F9", color: "#6B7280", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", fontWeight: 700 }}>3</div>
              <span style={{ fontSize: "11px", color: "#6B7280" }}>Update Stock</span>
            </div>
          </div>

          {/* QC Items */}
          {[
            { name: "Resistor 10kΩ 1/4W", code: "VND-010-R", received: 1000, accepted: 980, rejected: 20, status: "Partial" },
            { name: "Kapasitor Elco 100uF 25V", code: "VND-011-C", received: 500, accepted: 500, rejected: 0, status: "Passed" },
            { name: "IC NE555 Timer", code: "VND-012-I", received: 200, accepted: 0, rejected: 200, status: "Rejected" },
          ].map((item, i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 0", borderBottom: "1px solid #E2E8F0" }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: "13px", marginBottom: "4px" }}>{item.name}</div>
                <div style={{ fontSize: "11px", color: "#6B7280" }}>Code: {item.code} | Received: {item.received.toLocaleString()} pcs</div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "4px" }}>
                  <label style={{ fontSize: "10px", color: "#6B7280" }}>Accepted</label>
                  <input type="number" defaultValue={item.accepted} style={{ width: "70px", padding: "5px 8px", border: "1.5px solid #E2E8F0", borderRadius: "6px", fontSize: "12px", textAlign: "center" }} />
                </div>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "4px" }}>
                  <label style={{ fontSize: "10px", color: "#6B7280" }}>Rejected</label>
                  <input type="number" defaultValue={item.rejected} style={{ width: "70px", padding: "5px 8px", border: `1.5px solid ${item.rejected > 0 ? "#EF4444" : "#E2E8F0"}`, borderRadius: "6px", fontSize: "12px", textAlign: "center" }} />
                </div>
                <select style={{ padding: "6px 8px", borderRadius: "6px", border: "1.5px solid #E2E8F0", fontSize: "12px" }}>
                  <option>{item.status}</option>
                  <option>Passed</option>
                  <option>Partial</option>
                  <option>Rejected</option>
                </select>
              </div>
            </div>
          ))}

          {/* QC Notes */}
          <div style={{ marginTop: "16px" }}>
            <label style={{ fontSize: "12px", fontWeight: 600, color: "#374151", display: "block", marginBottom: "6px" }}>QC Notes</label>
            <textarea defaultValue="IC NE555 batch defective — all units failed continuity test. To be returned to vendor." style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1.5px solid #E2E8F0", fontSize: "13px", boxSizing: "border-box", minHeight: "70px", resize: "vertical" }} />
          </div>

          {/* Buttons */}
          <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "16px" }}>
            <button style={{ padding: "8px 20px", borderRadius: "8px", border: "1.5px solid #E2E8F0", background: "#fff", fontSize: "13px", fontWeight: 600, cursor: "pointer" }}>Save Draft</button>
            <button style={{ padding: "8px 20px", borderRadius: "8px", border: "none", background: "#2C4FDB", color: "#fff", fontSize: "13px", fontWeight: 600, cursor: "pointer" }}>Submit QC Result</button>
          </div>
        </div>
      </div>

      {/* Inspection History */}
      <div style={{ background: "#fff", borderRadius: "12px", border: "1px solid #E2E8F0" }}>
        <div style={{ padding: "16px 20px", borderBottom: "1px solid #E2E8F0" }}>
          <span style={{ fontWeight: 700, fontSize: "14px" }}>Inspection History</span>
        </div>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
          <thead>
            <tr>
              {["GR Number", "Product", "Received", "Accepted", "Rejected", "Status", "QC By", "Date"].map((h) => (
                <th key={h} style={{ textAlign: "left", padding: "10px 20px", background: "#F8FAFF", fontSize: "11px", fontWeight: 700, color: "#6B7280", textTransform: "uppercase", borderBottom: "1px solid #E2E8F0" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[
              { gr: "GR-2025-0086", product: "Kabel NYM 2x1.5mm", received: 100, accepted: 100, rejected: 0, status: "Passed", color: "#D1FAE5", text: "#065F46", by: "Kasyfil", date: "09 Jun" },
              { gr: "GR-2025-0086", product: "Bearing 6205ZZ", received: 50, accepted: 48, rejected: 2, status: "Partial", color: "#DBEAFE", text: "#1E40AF", by: "Kasyfil", date: "09 Jun" },
              { gr: "GR-2025-0084", product: "Relay 12V SPDT", received: 200, accepted: 0, rejected: 200, status: "Rejected", color: "#FEE2E2", text: "#991B1B", by: "Habibi", date: "07 Jun" },
            ].map((row, i) => (
              <tr key={i} style={{ borderBottom: "1px solid #E2E8F0" }}>
                <td style={{ padding: "12px 20px", fontWeight: 700 }}>{row.gr}</td>
                <td style={{ padding: "12px 20px" }}>{row.product}</td>
                <td style={{ padding: "12px 20px" }}>{row.received}</td>
                <td style={{ padding: "12px 20px" }}>{row.accepted}</td>
                <td style={{ padding: "12px 20px", color: "#EF4444", fontWeight: row.rejected > 0 ? 700 : 400 }}>{row.rejected}</td>
                <td style={{ padding: "12px 20px" }}><span style={{ background: row.color, color: row.text, padding: "3px 10px", borderRadius: "20px", fontSize: "11px", fontWeight: 700 }}>{row.status}</span></td>
                <td style={{ padding: "12px 20px" }}>{row.by}</td>
                <td style={{ padding: "12px 20px", color: "#6B7280" }}>{row.date}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

    </DashboardLayout>
  );
}

export default QCInspectionPage;