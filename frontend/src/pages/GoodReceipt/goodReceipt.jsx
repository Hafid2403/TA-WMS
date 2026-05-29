import DashboardLayout from "../../layout/DashboardLayout";

function GoodsReceiptPage() {
  return (
    <DashboardLayout title="Goods Receipt">

     {/* Search & Action */}
      <div style={{ display: "flex", gap: "10px", marginBottom: "20px", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", background: "#fff", border: "1.5px solid #E2E8F0", borderRadius: "8px", padding: "8px 12px", flex: 1, gap: "8px" }}>
          <span>🔎</span>
          <input placeholder="Search GR Number, Vendor..." style={{ border: "none", outline: "none", fontSize: "13px", width: "100%", background: "transparent" }} />
        </div>
        <select style={{ padding: "8px 12px", borderRadius: "8px", border: "1.5px solid #E2E8F0", fontSize: "13px", background: "#fff", color: "#E2E8F0" }}>
          <option>All Status</option>
          <option>Pending QC</option>
          <option>Partial</option>
          <option>Completed</option>
          <option>Rejected</option>
        </select>
        <button style={{ padding: "8px 16px", background: "#2C4FDB", color: "#fff", border: "none", borderRadius: "8px", fontSize: "13px", fontWeight: 600, cursor: "pointer" }}>+ New Receipt</button>
      </div>

{/* New Goods Receipt Form */}
<div style={{ background: "#fff", borderRadius: "12px", border: "1px solid #E2E8F0", marginBottom: "20px" }}>
  <div style={{ padding: "14px 20px", borderBottom: "1px solid #E2E8F0", display: "flex", alignItems: "center", gap: "8px" }}>
    <span style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#2C4FDB", display: "inline-block" }}></span>
    <span style={{ fontWeight: 700, fontSize: "14px" }}>New Goods Receipt</span>
  </div>

  <div style={{ padding: "20px" }}>
    {/* Form Grid */}
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" }}>
      <div>
        <label style={{ fontSize: "12px", fontWeight: 600, color: "black", display: "block", marginBottom: "6px" }}>GR Number</label>
        <input defaultValue="GR-2025-0087" readOnly style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1.5px solid #E2E8F0", fontSize: "13px", background: "#F8FAFF", boxSizing: "border-box" }} />
      </div>
      <div>
        <label style={{ fontSize: "12px", fontWeight: 600, color: "black", display: "block", marginBottom: "6px" }}>Receipt Date</label>
        <input type="date" defaultValue="2025-06-10" style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1.5px solid #E2E8F0", fontSize: "13px", boxSizing: "border-box" }} />
      </div>
      <div>
        <label style={{ fontSize: "12px", fontWeight: 600, color: "black", display: "block", marginBottom: "6px" }}>Vendor</label>
        <select style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1.5px solid #E2E8F0", fontSize: "13px", boxSizing: "border-box" }}>
          <option>PT. Sumber Makmur</option>
          <option>CV. Tekno Jaya</option>
          <option>PT. Global Supply</option>
        </select>
      </div>
      <div>
        <label style={{ fontSize: "12px", fontWeight: 600, color: "black", display: "block", marginBottom: "6px" }}>Receipt Type</label>
        <select style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1.5px solid #E2E8F0", fontSize: "13px", boxSizing: "border-box" }}>
          <option>Good Receipt</option>
          <option>Pending Order</option>
          <option>Rejected</option>
        </select>
      </div>
      <div style={{ gridColumn: "span 2" }}>
        <label style={{ fontSize: "12px", fontWeight: 600, color: "black", display: "block", marginBottom: "6px" }}>Notes</label>
        <textarea placeholder="Additional notes..." style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1.5px solid #E2E8F0", fontSize: "13px", boxSizing: "border-box", minHeight: "70px", resize: "vertical" }} />
      </div>
    </div>

    {/* Items Table */}
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
      <span style={{ fontWeight: 700, fontSize: "13px" }}>Items Received</span>
      <button style={{ padding: "5px 12px", borderRadius: "8px", border: "1.5px solid #2C4FDB", background: "#fff", color: "#2C4FDB", fontSize: "12px", fontWeight: 600, cursor: "pointer" }}>+ Add Item</button>
    </div>
    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
      <thead>
        <tr>
          {["Number", "Vendor Product Code", "Product Name", "Category", "Qty Received", "Unit", "Action"].map((h) => (
            <th key={h} style={{ textAlign: "left", padding: "10px 14px", background: "#F8FAFF", fontSize: "11px", fontWeight: 700, color: "#6B7280", textTransform: "uppercase", borderBottom: "1px solid #E2E8F0" }}>{h}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        <tr style={{ borderBottom: "1px solid #E2E8F0" }}>
          <td style={{ padding: "10px 14px" }}>1</td>
          <td style={{ padding: "10px 14px" }}>VND-001-A</td>
          <td style={{ padding: "10px 14px" }}>Kabel NYM 2x1.5mm</td>
          <td style={{ padding: "10px 14px" }}>Kabel</td>
          <td style={{ padding: "10px 14px" }}><input type="number" defaultValue="100" style={{ width: "70px", padding: "5px 8px", border: "1.5px solid #E2E8F0", borderRadius: "6px", fontSize: "12px" }} /></td>
          <td style={{ padding: "10px 14px" }}>Roll</td>
          <td style={{ padding: "10px 14px" }}><button style={{ padding: "4px 10px", borderRadius: "6px", border: "none", background: "#FEE2E2", color: "#991B1B", fontSize: "12px", cursor: "pointer" }}>✕</button></td>
        </tr>
        <tr style={{ borderBottom: "1px solid #E2E8F0" }}>
          <td style={{ padding: "10px 14px" }}>2</td>
          <td style={{ padding: "10px 14px" }}>VND-002-B</td>
          <td style={{ padding: "10px 14px" }}>Kondensator 470uF</td>
          <td style={{ padding: "10px 14px" }}>Komponen</td>
          <td style={{ padding: "10px 14px" }}><input type="number" defaultValue="500" style={{ width: "70px", padding: "5px 8px", border: "1.5px solid #E2E8F0", borderRadius: "6px", fontSize: "12px" }} /></td>
          <td style={{ padding: "10px 14px" }}>Pcs</td>
          <td style={{ padding: "10px 14px" }}><button style={{ padding: "4px 10px", borderRadius: "6px", border: "none", background: "#FEE2E2", color: "#991B1B", fontSize: "12px", cursor: "pointer" }}>✕</button></td>
        </tr>
        <tr>
          <td style={{ padding: "10px 14px" }}>3</td>
          <td style={{ padding: "10px 14px" }}>VND-003-C</td>
          <td style={{ padding: "10px 14px" }}>Bearing 6205ZZ</td>
          <td style={{ padding: "10px 14px" }}>Mekanik</td>
          <td style={{ padding: "10px 14px" }}><input type="number" defaultValue="50" style={{ width: "70px", padding: "5px 8px", border: "1.5px solid #E2E8F0", borderRadius: "6px", fontSize: "12px" }} /></td>
          <td style={{ padding: "10px 14px" }}>Pcs</td>
          <td style={{ padding: "10px 14px" }}><button style={{ padding: "4px 10px", borderRadius: "6px", border: "none", background: "#FEE2E2", color: "#991B1B", fontSize: "12px", cursor: "pointer" }}>✕</button></td>
        </tr>
      </tbody>
    </table>

    {/* Action Buttons */}
    <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "16px" }}>
      <button style={{ padding: "8px 20px", borderRadius: "8px", border: "1.5px solid ", background: "#fff", color: "black", fontSize: "13px", fontWeight: 600, cursor: "pointer" }}>Cancel</button>
      <button style={{ padding: "8px 20px", borderRadius: "8px", border: "none", background: "#2C4FDB", color: "#fff", fontSize: "13px", fontWeight: 600, cursor: "pointer" }}>Save Receipt</button>
    </div>
  </div>
</div>
     

      {/* GR History Table */}
      <div style={{ background: "#fff", borderRadius: "12px", border: "1px solid #E2E8F0" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 20px", borderBottom: "1px solid #E2E8F0" }}>
          <span style={{ fontWeight: 700, fontSize: "14px" }}>Goods Receipt History</span>
          <span style={{ fontSize: "12px", color: "#6B7280" }}>Showing 5 of 48 records</span>
        </div>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
          <thead>
            <tr>
              {["GR Number", "Date", "Vendor", "Items", "Received By", "QC Status", "Action"].map((h) => (
                <th key={h} style={{ textAlign: "left", padding: "10px 20px", background: "#F8FAFF", fontSize: "11px", fontWeight: 700, color: "#6B7280", textTransform: "uppercase", borderBottom: "1px solid #E2E8F0" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[
              { gr: "GR-2025-0086", date: "09 Jun 2025", vendor: "PT. Sumber Makmur", items: "5 items", by: "Hafid", status: "Completed", color: "#D1FAE5", text: "#065F46", icon: "✓" },
              { gr: "GR-2025-0085", date: "08 Jun 2025", vendor: "CV. Tekno Jaya", items: "3 items", by: "Hafid", status: "Pending QC", color: "#FEF3C7", text: "#92400E", icon: "⏳" },
              { gr: "GR-2025-0084", date: "07 Jun 2025", vendor: "PT. Global Supply", items: "8 items", by: "Kasyfil", status: "Partial", color: "#DBEAFE", text: "#1E40AF", icon: "◑" },
              { gr: "GR-2025-0083", date: "06 Jun 2025", vendor: "PT. Sumber Makmur", items: "2 items", by: "Hafid", status: "Rejected", color: "#FEE2E2", text: "#991B1B", icon: "✕" },
              { gr: "GR-2025-0082", date: "05 Jun 2025", vendor: "CV. Tekno Jaya", items: "6 items", by: "Kasyfil", status: "Completed", color: "#D1FAE5", text: "#065F46", icon: "✓" },
            ].map((row, i) => (
              <tr key={i} style={{ borderBottom: "1px solid #E2E8F0" }}>
                <td style={{ padding: "12px 20px", fontWeight: 700 }}>{row.gr}</td>
                <td style={{ padding: "12px 20px", color: "#6B7280" }}>{row.date}</td>
                <td style={{ padding: "12px 20px" }}>{row.vendor}</td>
                <td style={{ padding: "12px 20px", color: "#6B7280" }}>{row.items}</td>
                <td style={{ padding: "12px 20px" }}>{row.by}</td>
                <td style={{ padding: "12px 20px" }}>
                  <span style={{ background: row.color, color: row.text, padding: "3px 10px", borderRadius: "20px", fontSize: "11px", fontWeight: 700 }}>{row.icon} {row.status}</span>
                </td>
                <td style={{ padding: "12px 20px" }}>
                  <div style={{ display: "flex", gap: "6px" }}>
                    <button style={{ padding: "4px 10px", borderRadius: "6px", border: "1.5px solid #E2E8F0", background: "#fff", fontSize: "12px", cursor: "pointer" }}>View</button>
                    <button style={{ padding: "4px 10px", borderRadius: "6px", border: "1.5px solid #E2E8F0", background: "#fff", fontSize: "12px", cursor: "pointer" }}>✏️ Edit</button>
                    <button style={{ padding: "4px 10px", borderRadius: "6px", border: "1.5px solid #FEE2E2", background: "#FEE2E2", color: "#991B1B", fontSize: "12px", cursor: "pointer" }}>🗑️</button>
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

export default GoodsReceiptPage;