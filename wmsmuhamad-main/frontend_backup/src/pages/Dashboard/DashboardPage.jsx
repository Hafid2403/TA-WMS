import { useEffect, useState } from "react";
import DashboardLayout from "../../layout/DashboardLayout";
import api from "../../services/api";
import "../../styles/dashboard.css";

function DashboardPage() {
  const [summary, setSummary] = useState(null);
  const [goodsReceipts, setGoodsReceipts] = useState([]);
  const [materialRequests, setMaterialRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError("");

        // Parallel fetch for speed
        const [summaryRes, grRes, mrRes] = await Promise.all([
          api.get("/dashboard/summary"),
          api.get("/goods-receipt"),
          api.get("/material-request"),
        ]);

        if (summaryRes.data && summaryRes.data.status === "success") {
          setSummary(summaryRes.data.data);
        }
        if (grRes.data && grRes.data.status === "success") {
          setGoodsReceipts(grRes.data.data.slice(0, 3)); // show first 3
        }
        if (mrRes.data && mrRes.data.status === "success") {
          setMaterialRequests(mrRes.data.data.slice(0, 3)); // show first 3
        }
      } catch (err) {
        console.error("Dashboard error:", err);
        setError("Gagal memuat data ringkasan dashboard.");
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <DashboardLayout title="Dashboard">
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "60vh", fontSize: "16px", fontWeight: "600", color: "#2c4fdb" }}>
          🔄 Memuat data dashboard...
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout title="Dashboard">
        <div style={{ padding: "20px", background: "#fee2e2", border: "1px solid #fca5a5", color: "#b91c1c", borderRadius: "8px", fontWeight: "600" }}>
          ⚠️ {error}
        </div>
      </DashboardLayout>
    );
  }

  const criticalItems = summary?.critical_items || [];

  return (
    <DashboardLayout title="Dashboard">
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">Total SKUs</div>
          <div className="stat-value">{summary?.total_skus || 0}</div>
          <div className="stat-sub">Active Products</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Low Stock Items</div>
          <div className="stat-value">{summary?.critical_low_stock_count || 0}</div>
          <div className="stat-sub">Below Minimum</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Pending Requests</div>
          <div className="stat-value">{summary?.pending_material_requests || 0}</div>
          <div className="stat-sub">Awaiting Approval</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Active Opnames</div>
          <div className="stat-value">{summary?.active_stock_opnames || 0}</div>
          <div className="stat-sub">Sessions In Progress</div>
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
              {goodsReceipts.length > 0 ? (
                goodsReceipts.map((gr) => (
                  <tr key={gr.gr_id}>
                    <td style={{ padding: "11px 14px", borderBottom: "1px solid #E2E8F0", fontWeight: 700 }}>{gr.gr_number}</td>
                    <td style={{ padding: "11px 14px", borderBottom: "1px solid #E2E8F0" }}>{gr.vendor?.vendor_name || "-"}</td>
                    <td style={{ padding: "11px 14px", borderBottom: "1px solid #E2E8F0" }}>
                      {gr.receipt_date ? new Date(gr.receipt_date).toLocaleDateString("id-ID", { day: "2-digit", month: "short" }) : "-"}
                    </td>
                    <td style={{ padding: "11px 14px", borderBottom: "1px solid #E2E8F0" }}>
                      <span style={{
                        background: gr.qc_status === "passed" ? "#D1FAE5" : "#FEF3C7",
                        color: gr.qc_status === "passed" ? "#065F46" : "#92400E",
                        padding: "3px 10px",
                        borderRadius: "20px",
                        fontSize: "11px",
                        fontWeight: 700
                      }}>
                        {gr.qc_status}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" style={{ padding: "15px", textAlign: "center", color: "#6b7280" }}>Tidak ada penerimaan barang terbaru.</td>
                </tr>
              )}
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
              {materialRequests.length > 0 ? (
                materialRequests.map((mr) => (
                  <tr key={mr.mr_id}>
                    <td style={{ padding: "11px 14px", borderBottom: "1px solid #E2E8F0", fontWeight: 700 }}>{mr.mr_number}</td>
                    <td style={{ padding: "11px 14px", borderBottom: "1px solid #E2E8F0" }}>{mr.department?.department_name || "-"}</td>
                    <td style={{ padding: "11px 14px", borderBottom: "1px solid #E2E8F0" }}>
                      {mr.request_date ? new Date(mr.request_date).toLocaleDateString("id-ID", { day: "2-digit", month: "short" }) : "-"}
                    </td>
                    <td style={{ padding: "11px 14px", borderBottom: "1px solid #E2E8F0" }}>
                      <span style={{
                        background: mr.status === "approved" ? "#D1FAE5" : "#FEF3C7",
                        color: mr.status === "approved" ? "#065F46" : "#92400E",
                        padding: "3px 10px",
                        borderRadius: "20px",
                        fontSize: "11px",
                        fontWeight: 700
                      }}>
                        {mr.status}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" style={{ padding: "15px", textAlign: "center", color: "#6b7280" }}>Tidak ada permintaan barang tertunda.</td>
                </tr>
              )}
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
              <th style={{ textAlign: "left", padding: "10px 14px", background: "#F8FAFF", fontSize: "11px", fontWeight: 700, color: "#6B7280", textTransform: "uppercase", borderBottom: "1px solid #E2E8F0" }}>Warehouse</th>
              <th style={{ textAlign: "left", padding: "10px 14px", background: "#F8FAFF", fontSize: "11px", fontWeight: 700, color: "#6B7280", textTransform: "uppercase", borderBottom: "1px solid #E2E8F0" }}>Available</th>
              <th style={{ textAlign: "left", padding: "10px 14px", background: "#F8FAFF", fontSize: "11px", fontWeight: 700, color: "#6B7280", textTransform: "uppercase", borderBottom: "1px solid #E2E8F0" }}>Min Stock</th>
              <th style={{ textAlign: "left", padding: "10px 14px", background: "#F8FAFF", fontSize: "11px", fontWeight: 700, color: "#6B7280", textTransform: "uppercase", borderBottom: "1px solid #E2E8F0" }}>Stock Status</th>
            </tr>
          </thead>
          <tbody>
            {criticalItems.length > 0 ? (
              criticalItems.map((item, index) => (
                <tr key={index}>
                  <td style={{ padding: "11px 14px", borderBottom: "1px solid #E2E8F0" }}>
                    <span style={{ background: "#F1F5F9", padding: "3px 8px", borderRadius: "6px", fontSize: "11px", fontWeight: 600 }}>{item.internal_code}</span>
                  </td>
                  <td style={{ padding: "11px 14px", borderBottom: "1px solid #E2E8F0" }}>{item.product_name}</td>
                  <td style={{ padding: "11px 14px", borderBottom: "1px solid #E2E8F0" }}>{item.warehouse_name}</td>
                  <td style={{ padding: "11px 14px", borderBottom: "1px solid #E2E8F0", color: "#EF4444", fontWeight: 700 }}>
                    {item.qty_available} {item.unit}
                  </td>
                  <td style={{ padding: "11px 14px", borderBottom: "1px solid #E2E8F0" }}>{item.min_stock} {item.unit}</td>
                  <td style={{ padding: "11px 14px", borderBottom: "1px solid #E2E8F0" }}>
                    <span style={{
                      background: item.qty_available === 0 ? "#FEE2E2" : "#FEF3C7",
                      color: item.qty_available === 0 ? "#EF4444" : "#92400E",
                      padding: "3px 10px",
                      borderRadius: "20px",
                      fontSize: "11px",
                      fontWeight: 700
                    }}>
                      {item.qty_available === 0 ? "Critical" : "Low"}
                    </span>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" style={{ padding: "15px", textAlign: "center", color: "#10b981", fontWeight: "600" }}>✅ Semua stok produk dalam batas aman!</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </DashboardLayout>
  );
}

export default DashboardPage;