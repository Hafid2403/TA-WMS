import DashboardLayout from "../../layout/DashboardLayout";

function StockOverviewPage() {
  const stocks = [
    { code: "INT-001", name: "Kabel NYM 2x1.5mm", category: "Kabel", available: 148, reserved: 10, min: 200, zone: "A-01", status: "Low Stock", color: "#FEF3C7", text: "#92400E" },
    { code: "INT-002", name: "Resistor 10kΩ 1/4W", category: "Komponen", available: 980, reserved: 0, min: 100, zone: "B-03", status: "In Stock", color: "#D1FAE5", text: "#065F46" },
    { code: "INT-003", name: "Bearing 6205ZZ", category: "Mekanik", available: 50, reserved: 5, min: 10, zone: "A-02", status: "In Stock", color: "#D1FAE5", text: "#065F46" },
    { code: "INT-004", name: "Kondensator 470uF", category: "Komponen", available: 495, reserved: 20, min: 50, zone: "B-01", status: "In Stock", color: "#D1FAE5", text: "#065F46" },
    { code: "INT-005", name: "IC NE555 Timer", category: "Komponen", available: 0, reserved: 0, min: 20, zone: "B-02", status: "Out of Stock", color: "#FEE2E2", text: "#991B1B" },
    { code: "INT-006", name: "Relay 12V SPDT", category: "Komponen", available: 0, reserved: 0, min: 15, zone: "C-01", status: "Out of Stock", color: "#FEE2E2", text: "#991B1B" },
  ];

  return (
    <DashboardLayout title="Stock Overview">

      {/* Search & Filter */}
      <div style={{ display: "flex", gap: "10px", marginBottom: "20px", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", background: "#fff", border: "1.5px solid #E2E8F0", borderRadius: "8px", padding: "8px 12px", flex: 1, gap: "8px" }}>
          <span>🔎</span>
          <input placeholder="Search product..." style={{ border: "none", outline: "none", fontSize: "13px", width: "100%", background: "transparent" }} />
        </div>
        <select style={{ padding: "8px 12px", borderRadius: "8px", border: "1.5px solid #E2E8F0", fontSize: "13px", background: "#fff" }}>
          <option>All Categories</option>
          <option>Kabel</option>
          <option>Komponen</option>
          <option>Mekanik</option>
        </select>
        <select style={{ padding: "8px 12px", borderRadius: "8px", border: "1.5px solid #E2E8F0", fontSize: "13px", background: "#fff" }}>
          <option>All Status</option>
          <option>In Stock</option>
          <option>Low Stock</option>
          <option>Out of Stock</option>
        </select>
      </div>

      {/* Table */}
      <div style={{ background: "#fff", borderRadius: "12px", border: "1px solid #E2E8F0" }}>
        <div style={{ padding: "16px 20px", borderBottom: "1px solid #E2E8F0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontWeight: 700, fontSize: "14px" }}>Inventory Stock</span>
          <span style={{ fontSize: "12px", color: "#6B7280" }}>Last updated: 10 Jun 2025</span>
        </div>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
          <thead>
            <tr>
              {["Internal Code", "Product Name", "Category", "Available", "Reserved", "Min Stock", "Zone/Rack", "Status"].map((h) => (
                <th key={h} style={{ textAlign: "left", padding: "10px 20px", background: "#F8FAFF", fontSize: "11px", fontWeight: 700, color: "#6B7280", textTransform: "uppercase", borderBottom: "1px solid #E2E8F0" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {stocks.map((row, i) => (
              <tr key={i} style={{ borderBottom: "1px solid #E2E8F0" }}>
                <td style={{ padding: "12px 20px" }}><span style={{ background: "#F1F5F9", padding: "2px 6px", borderRadius: "4px", fontSize: "11px", fontFamily: "monospace" }}>{row.code}</span></td>
                <td style={{ padding: "12px 20px", fontWeight: 600 }}>{row.name}</td>
                <td style={{ padding: "12px 20px", color: "#6B7280" }}>{row.category}</td>
                <td style={{ padding: "12px 20px", fontWeight: 700, color: row.available === 0 ? "#EF4444" : "#1A1F3C" }}>{row.available}</td>
                <td style={{ padding: "12px 20px", color: "#6B7280" }}>{row.reserved}</td>
                <td style={{ padding: "12px 20px", color: "#6B7280" }}>{row.min}</td>
                <td style={{ padding: "12px 20px", color: "#6B7280" }}>{row.zone}</td>
                <td style={{ padding: "12px 20px" }}><span style={{ background: row.color, color: row.text, padding: "3px 10px", borderRadius: "20px", fontSize: "11px", fontWeight: 700 }}>{row.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

    </DashboardLayout>
  );
}

export default StockOverviewPage;