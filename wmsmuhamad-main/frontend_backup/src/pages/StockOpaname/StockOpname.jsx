import DashboardLayout from "../../layout/DashboardLayout";

function StockOpnamePage() {
  const items = [
    { code: "INT-001", name: "Kabel NYM 2x1.5mm", category: "Kabel", zone: "A-01", system: 150, physical: 148 },
    { code: "INT-002", name: "Resistor 10kΩ", category: "Komponen", zone: "B-03", system: 980, physical: 980 },
    { code: "INT-003", name: "Bearing 6205ZZ", category: "Mekanik", zone: "A-02", system: 46, physical: 50 },
    { code: "INT-004", name: "Kondensator 470uF", category: "Komponen", zone: "B-01", system: 500, physical: 495 },
    { code: "INT-005", name: "Kapasitor Elco 100uF", category: "Komponen", zone: "B-02", system: 500, physical: 500 },
  ];

  return (
    <DashboardLayout title="Stock Opname">

      {/* Active Session Banner */}
      <div style={{ background: "linear-gradient(135deg, #1B2E6B, #2C4FDB)", borderRadius: "14px", padding: "20px 24px", marginBottom: "20px", display: "flex", alignItems: "center", justifyContent: "space-between", color: "#fff" }}>
        <div>
          <div style={{ fontSize: "11px", opacity: 0.7, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "4px" }}>Active Session</div>
          <div style={{ fontSize: "18px", fontWeight: 800 }}>OP-2025-0012</div>
          <div style={{ fontSize: "12px", opacity: 0.7, marginTop: "4px" }}>Started: 10 Jun 2025 · Warehouse: Main WH · By: Hafid</div>
        </div>
        <div style={{ display: "flex", gap: "10px" }}>
          {[{ label: "Total Items", value: "24", color: "#fff" }, { label: "Counted", value: "18", color: "#6EE7B7" }, { label: "Remaining", value: "6", color: "#FDE68A" }].map((s, i) => (
            <div key={i} style={{ textAlign: "center", background: "rgba(255,255,255,0.12)", padding: "12px 20px", borderRadius: "10px" }}>
              <div style={{ fontSize: "22px", fontWeight: 800, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: "10px", opacity: 0.7 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Physical Count Entry */}
      <div style={{ background: "#fff", borderRadius: "12px", border: "1px solid #E2E8F0", marginBottom: "20px" }}>
        <div style={{ padding: "14px 20px", borderBottom: "1px solid #E2E8F0", display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#2C4FDB", display: "inline-block" }}></span>
          <span style={{ fontWeight: 700, fontSize: "14px" }}>Physical Count Entry</span>
        </div>
        <div style={{ padding: "16px 20px" }}>
          {/* Search & Filter */}
          <div style={{ display: "flex", gap: "10px", marginBottom: "16px" }}>
            <div style={{ display: "flex", alignItems: "center", background: "#F8FAFF", border: "1.5px solid #E2E8F0", borderRadius: "8px", padding: "8px 12px", flex: 1, gap: "8px" }}>
              <span>🔎</span>
              <input placeholder="Search product..." style={{ border: "none", outline: "none", fontSize: "13px", width: "100%", background: "transparent" }} />
            </div>
            <select style={{ padding: "8px 12px", borderRadius: "8px", border: "1.5px solid #E2E8F0", fontSize: "13px" }}>
              <option>All Zones</option>
              <option>Zone A</option>
              <option>Zone B</option>
              <option>Zone C</option>
            </select>
          </div>

          {/* Table */}
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
            <thead>
              <tr>
                {["Internal Code", "Product Name", "Category", "Zone/Rack", "System Qty", "Physical Qty", "Discrepancy", "Notes"].map((h) => (
                  <th key={h} style={{ textAlign: "left", padding: "10px 14px", background: "#F8FAFF", fontSize: "11px", fontWeight: 700, color: "#6B7280", textTransform: "uppercase", borderBottom: "1px solid #E2E8F0" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {items.map((item, i) => {
                const diff = item.physical - item.system;
                return (
                  <tr key={i} style={{ borderBottom: "1px solid #E2E8F0" }}>
                    <td style={{ padding: "10px 14px" }}><span style={{ background: "#F1F5F9", padding: "2px 6px", borderRadius: "4px", fontSize: "11px", fontFamily: "monospace" }}>{item.code}</span></td>
                    <td style={{ padding: "10px 14px" }}>{item.name}</td>
                    <td style={{ padding: "10px 14px", color: "#6B7280" }}>{item.category}</td>
                    <td style={{ padding: "10px 14px", color: "#6B7280" }}>{item.zone}</td>
                    <td style={{ padding: "10px 14px" }}>{item.system}</td>
                    <td style={{ padding: "10px 14px" }}><input type="number" defaultValue={item.physical} style={{ width: "70px", padding: "5px 8px", border: "1.5px solid #E2E8F0", borderRadius: "6px", fontSize: "12px" }} /></td>
                    <td style={{ padding: "10px 14px" }}>
                      <span style={{ fontWeight: 700, color: diff === 0 ? "#6B7280" : diff > 0 ? "#065F46" : "#991B1B" }}>
                        {diff > 0 ? `+${diff}` : diff}
                      </span>
                    </td>
                    <td style={{ padding: "10px 14px" }}><input type="text" placeholder="Note..." style={{ width: "120px", padding: "5px 8px", border: "1.5px solid #E2E8F0", borderRadius: "6px", fontSize: "12px" }} /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "16px" }}>
            <button style={{ padding: "8px 20px", borderRadius: "8px", border: "1.5px solid #E2E8F0", background: "#fff", fontSize: "13px", fontWeight: 600, cursor: "pointer" }}>Save Progress</button>
            <button style={{ padding: "8px 20px", borderRadius: "8px", border: "none", background: "#2C4FDB", color: "#fff", fontSize: "13px", fontWeight: 600, cursor: "pointer" }}>Submit for Approval</button>
          </div>
        </div>
      </div>

      {/* Opname History */}
      <div style={{ background: "#fff", borderRadius: "12px", border: "1px solid #E2E8F0" }}>
        <div style={{ padding: "16px 20px", borderBottom: "1px solid #E2E8F0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontWeight: 700, fontSize: "14px" }}>Opname History</span>
          <button style={{ padding: "6px 14px", borderRadius: "8px", border: "none", background: "#2C4FDB", color: "#fff", fontSize: "12px", fontWeight: 600, cursor: "pointer" }}>+ New Session</button>
        </div>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
          <thead>
            <tr>
              {["Session ID", "Start Date", "End Date", "Conducted By", "Items", "Discrepancies", "Status", "Action"].map((h) => (
                <th key={h} style={{ textAlign: "left", padding: "10px 20px", background: "#F8FAFF", fontSize: "11px", fontWeight: 700, color: "#6B7280", textTransform: "uppercase", borderBottom: "1px solid #E2E8F0" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[
              { id: "OP-2025-0011", start: "01 Jun 2025", end: "02 Jun 2025", by: "Kasyfil", items: 24, disc: "3 items" },
              { id: "OP-2025-0010", start: "01 May 2025", end: "02 May 2025", by: "Hafid", items: 22, disc: "0 items" },
              { id: "OP-2025-0009", start: "01 Apr 2025", end: "02 Apr 2025", by: "Habibi", items: 20, disc: "5 items" },
            ].map((row, i) => (
              <tr key={i} style={{ borderBottom: "1px solid #E2E8F0" }}>
                <td style={{ padding: "12px 20px", fontWeight: 700 }}>{row.id}</td>
                <td style={{ padding: "12px 20px", color: "#6B7280" }}>{row.start}</td>
                <td style={{ padding: "12px 20px", color: "#6B7280" }}>{row.end}</td>
                <td style={{ padding: "12px 20px" }}>{row.by}</td>
                <td style={{ padding: "12px 20px" }}>{row.items}</td>
                <td style={{ padding: "12px 20px", color: row.disc === "0 items" ? "#6B7280" : "#EF4444", fontWeight: row.disc !== "0 items" ? 700 : 400 }}>{row.disc}</td>
                <td style={{ padding: "12px 20px" }}><span style={{ background: "#D1FAE5", color: "#065F46", padding: "3px 10px", borderRadius: "20px", fontSize: "11px", fontWeight: 700 }}>Approved</span></td>
                <td style={{ padding: "12px 20px" }}>
                  <div style={{ display: "flex", gap: "6px" }}>
                    <button style={{ padding: "4px 10px", borderRadius: "6px", border: "1.5px solid #E2E8F0", background: "#fff", fontSize: "12px", cursor: "pointer" }}>View</button>
                    <button style={{ padding: "4px 10px", borderRadius: "6px", border: "1.5px solid #E2E8F0", background: "#fff", fontSize: "12px", cursor: "pointer" }}>✏️</button>
                    <button style={{ padding: "4px 10px", borderRadius: "6px", border: "none", background: "#FEE2E2", color: "#991B1B", fontSize: "12px", cursor: "pointer" }}>🗑️</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

    </DashboardLayout>
  );
}

export default StockOpnamePage;