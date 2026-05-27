import DashboardLayout from "../../layout/DashboardLayout";
import "../../styles/dashboard.css";

function DashboardPage() {
  return (
      <DashboardLayout title="Dashboard">
      <div className="stats-grid">
        <div className="stat-card">
            <div className="stat-label">Total-Products</div>
            <div className="stat-value">142</div>
            <div className="stat-sub">Active Items</div>
        </div>
        <div className="stat-card">
            <div className="stat-label"> Low Stock items</div>
            <div className="stat-value">8</div>
            <div className="stat-sub">Below Minimum</div>
        </div>
         <div className="stat-card">
          <div className="stat-label">Pending Request</div>
          <div className="stat-value">12</div>
          <div className="stat-sub">Awaiting approval</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">GR This Month</div>
          <div className="stat-value">24</div>
          <div className="stat-sub">Goods received</div>
        </div>
      </div>
      {/* Two Column Tables */}
<div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" }}>
  
  {/* Recent Goods Receipt */}
  <div className="stat-card">
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
      <span style={{ fontWeight: 700, fontSize: "14px" }}>Recent Goods Receipt</span>
      <button style={{ padding: "5px 12px", borderRadius: "8px", border: "1.5px solid #2C4FDB", background: "#fff", color: "#2C4FDB", fontSize: "12px", fontWeight: 600, cursor: "pointer" }}>View All</button>
    </div>
    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
      <thead>
        <tr>
          <th style={{ textAlign: "left", padding: "10px 14px", background: "#F8FAFF", fontSize: "11px", fontWeight: 700, color: "#6B7280", textTransform: "uppercase", borderBottom: "1px solid #E2E8F0" }}>GR Number</th>
          <th style={{ textAlign: "left", padding: "10px 14px", background: "#F8FAFF", fontSize: "11px", fontWeight: 700, color: "#6B7280", textTransform: "uppercase", borderBottom: "1px solid #E2E8F0" }}>Vendor</th>
          <th style={{ textAlign: "left", padding: "10px 14px", background: "#F8FAFF", fontSize: "11px", fontWeight: 700, color: "#6B7280", textTransform: "uppercase", borderBottom: "1px solid #E2E8F0" }}>Date</th>
          <th style={{ textAlign: "left", padding: "10px 14px", background: "#F8FAFF", fontSize: "11px", fontWeight: 700, color: "#6B7280", textTransform: "uppercase", borderBottom: "1px solid #E2E8F0" }}>Status</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td style={{ padding: "11px 14px", borderBottom: "1px solid #E2E8F0", fontWeight: 700 }}>GR-2025-0086</td>
          <td style={{ padding: "11px 14px", borderBottom: "1px solid #E2E8F0" }}>PT. Sumber Makmur</td>
          <td style={{ padding: "11px 14px", borderBottom: "1px solid #E2E8F0" }}>09 Jun</td>
          <td style={{ padding: "11px 14px", borderBottom: "1px solid #E2E8F0" }}><span style={{ background: "#D1FAE5", color: "#065F46", padding: "3px 10px", borderRadius: "20px", fontSize: "11px", fontWeight: 700 }}>Completed</span></td>
        </tr>
        <tr>
          <td style={{ padding: "11px 14px", borderBottom: "1px solid #E2E8F0", fontWeight: 700 }}>GR-2025-0085</td>
          <td style={{ padding: "11px 14px", borderBottom: "1px solid #E2E8F0" }}>CV. Tekno Jaya</td>
          <td style={{ padding: "11px 14px", borderBottom: "1px solid #E2E8F0" }}>08 Jun</td>
          <td style={{ padding: "11px 14px", borderBottom: "1px solid #E2E8F0" }}><span style={{ background: "#FEF3C7", color: "#92400E", padding: "3px 10px", borderRadius: "20px", fontSize: "11px", fontWeight: 700 }}>Pending QC</span></td>
        </tr>
        <tr>
          <td style={{ padding: "11px 14px", fontWeight: 700 }}>GR-2025-0084</td>
          <td style={{ padding: "11px 14px" }}>PT. Global Supply</td>
          <td style={{ padding: "11px 14px" }}>07 Jun</td>
          <td style={{ padding: "11px 14px" }}><span style={{ background: "#DBEAFE", color: "#1E40AF", padding: "3px 10px", borderRadius: "20px", fontSize: "11px", fontWeight: 700 }}>Partial</span></td>
        </tr>
      </tbody>
    </table>
  </div>

  {/* Pending Material Request */}
  <div className="stat-card">
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
      <span style={{ fontWeight: 700, fontSize: "14px" }}>Pending Material Request</span>
      <button style={{ padding: "5px 12px", borderRadius: "8px", border: "1.5px solid #2C4FDB", background: "#fff", color: "#2C4FDB", fontSize: "12px", fontWeight: 600, cursor: "pointer" }}>View All</button>
    </div>
    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
      <thead>
        <tr>
          <th style={{ textAlign: "left", padding: "10px 14px", background: "#F8FAFF", fontSize: "11px", fontWeight: 700, color: "#6B7280", textTransform: "uppercase", borderBottom: "1px solid #E2E8F0" }}>MR Number</th>
          <th style={{ textAlign: "left", padding: "10px 14px", background: "#F8FAFF", fontSize: "11px", fontWeight: 700, color: "#6B7280", textTransform: "uppercase", borderBottom: "1px solid #E2E8F0" }}>Dept</th>
          <th style={{ textAlign: "left", padding: "10px 14px", background: "#F8FAFF", fontSize: "11px", fontWeight: 700, color: "#6B7280", textTransform: "uppercase", borderBottom: "1px solid #E2E8F0" }}>Date</th>
          <th style={{ textAlign: "left", padding: "10px 14px", background: "#F8FAFF", fontSize: "11px", fontWeight: 700, color: "#6B7280", textTransform: "uppercase", borderBottom: "1px solid #E2E8F0" }}>Status</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td style={{ padding: "11px 14px", borderBottom: "1px solid #E2E8F0", fontWeight: 700 }}>MR-2025-0050</td>
          <td style={{ padding: "11px 14px", borderBottom: "1px solid #E2E8F0" }}>Production</td>
          <td style={{ padding: "11px 14px", borderBottom: "1px solid #E2E8F0" }}>09 Jun</td>
          <td style={{ padding: "11px 14px", borderBottom: "1px solid #E2E8F0" }}><span style={{ background: "#FEF3C7", color: "#92400E", padding: "3px 10px", borderRadius: "20px", fontSize: "11px", fontWeight: 700 }}>Pending</span></td>
        </tr>
        <tr>
          <td style={{ padding: "11px 14px", borderBottom: "1px solid #E2E8F0", fontWeight: 700 }}>MR-2025-0049</td>
          <td style={{ padding: "11px 14px", borderBottom: "1px solid #E2E8F0" }}>Engineering</td>
          <td style={{ padding: "11px 14px", borderBottom: "1px solid #E2E8F0" }}>08 Jun</td>
          <td style={{ padding: "11px 14px", borderBottom: "1px solid #E2E8F0" }}><span style={{ background: "#FEF3C7", color: "#92400E", padding: "3px 10px", borderRadius: "20px", fontSize: "11px", fontWeight: 700 }}>Pending</span></td>
        </tr>
        <tr>
          <td style={{ padding: "11px 14px", fontWeight: 700 }}>MR-2025-0048</td>
          <td style={{ padding: "11px 14px" }}>Production</td>
          <td style={{ padding: "11px 14px" }}>07 Jun</td>
          <td style={{ padding: "11px 14px" }}><span style={{ background: "#D1FAE5", color: "#065F46", padding: "3px 10px", borderRadius: "20px", fontSize: "11px", fontWeight: 700 }}>Completed</span></td>
        </tr>
      </tbody>
    </table>
  </div>



</div>
<div className="stat-card">
  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
    <span style={{ fontWeight: 700, fontSize: "14px" }}>⚠️ Stock Alert — Low Stock Items</span>
    <button style={{ padding: "5px 12px", borderRadius: "8px", border: "1.5px solid #2C4FDB", background: "#fff", color: "#2C4FDB", fontSize: "12px", fontWeight: 600, cursor: "pointer" }}>Stock Overview</button>
  </div>
  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
    <thead>
      <tr>
        <th style={{ textAlign: "left", padding: "10px 14px", background: "#F8FAFF", fontSize: "11px", fontWeight: 700, color: "#6B7280", textTransform: "uppercase", borderBottom: "1px solid #E2E8F0" }}>Internal Code</th>
        <th style={{ textAlign: "left", padding: "10px 14px", background: "#F8FAFF", fontSize: "11px", fontWeight: 700, color: "#6B7280", textTransform: "uppercase", borderBottom: "1px solid #E2E8F0" }}>Product Name</th>
        <th style={{ textAlign: "left", padding: "10px 14px", background: "#F8FAFF", fontSize: "11px", fontWeight: 700, color: "#6B7280", textTransform: "uppercase", borderBottom: "1px solid #E2E8F0" }}>Category</th>
        <th style={{ textAlign: "left", padding: "10px 14px", background: "#F8FAFF", fontSize: "11px", fontWeight: 700, color: "#6B7280", textTransform: "uppercase", borderBottom: "1px solid #E2E8F0" }}>Available</th>
        <th style={{ textAlign: "left", padding: "10px 14px", background: "#F8FAFF", fontSize: "11px", fontWeight: 700, color: "#6B7280", textTransform: "uppercase", borderBottom: "1px solid #E2E8F0" }}>Min Stock</th>
        <th style={{ textAlign: "left", padding: "10px 14px", background: "#F8FAFF", fontSize: "11px", fontWeight: 700, color: "#6B7280", textTransform: "uppercase", borderBottom: "1px solid #E2E8F0" }}>Stock</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td style={{ padding: "11px 14px", borderBottom: "1px solid #E2E8F0" }}><span style={{ background: "#F1F5F9", padding: "3px 8px", borderRadius: "6px", fontSize: "11px", fontWeight: 600 }}>INT-005</span></td>
        <td style={{ padding: "11px 14px", borderBottom: "1px solid #E2E8F0" }}>IC NE555 Timer</td>
        <td style={{ padding: "11px 14px", borderBottom: "1px solid #E2E8F0" }}>Komponen</td>
        <td style={{ padding: "11px 14px", borderBottom: "1px solid #E2E8F0", color: "#EF4444", fontWeight: 700 }}>0</td>
        <td style={{ padding: "11px 14px", borderBottom: "1px solid #E2E8F0" }}>20</td>
       <td style={{ padding: "11px 14px", borderBottom: "1px solid #E2E8F0" }}>
  <span style={{ background: "#FEE2E2", color: "#EF4444", padding: "3px 10px", borderRadius: "20px", fontSize: "11px", fontWeight: 700 }}>Critical</span>
</td>
      </tr>
      <tr>
        <td style={{ padding: "11px 14px", borderBottom: "1px solid #E2E8F0" }}><span style={{ background: "#F1F5F9", padding: "3px 8px", borderRadius: "6px", fontSize: "11px", fontWeight: 600 }}>INT-006</span></td>
        <td style={{ padding: "11px 14px", borderBottom: "1px solid #E2E8F0" }}>Relay 12V SPDT</td>
        <td style={{ padding: "11px 14px", borderBottom: "1px solid #E2E8F0" }}>Komponen</td>
        <td style={{ padding: "11px 14px", borderBottom: "1px solid #E2E8F0", color: "#EF4444", fontWeight: 700 }}>0</td>
        <td style={{ padding: "11px 14px", borderBottom: "1px solid #E2E8F0" }}>15</td>
        <td style={{ padding: "11px 14px", borderBottom: "1px solid #E2E8F0" }}>
  <span style={{ background: "#FEE2E2", color: "#EF4444", padding: "3px 10px", borderRadius: "20px", fontSize: "11px", fontWeight: 700 }}>Critical</span>
</td>

      </tr>
      <tr>
        <td style={{ padding: "11px 14px" }}><span style={{ background: "#F1F5F9", padding: "3px 8px", borderRadius: "6px", fontSize: "11px", fontWeight: 600 }}>INT-001</span></td>
        <td style={{ padding: "11px 14px" }}>Kabel NYM 2x1.5mm</td>
        <td style={{ padding: "11px 14px" }}>Kabel</td>
        <td style={{ padding: "11px 14px", color: "#F59E0B", fontWeight: 700 }}>148</td>
        <td style={{ padding: "11px 14px" }}>200</td>
        <td style={{ padding: "11px 14px" }}>
  <span style={{ background: "#FEF3C7", color: "#92400E", padding: "3px 10px", borderRadius: "20px", fontSize: "11px", fontWeight: 700 }}>Low</span>
</td>
</tr>
    </tbody>
  </table>
</div>

    </DashboardLayout>
  );
}

export default DashboardPage;