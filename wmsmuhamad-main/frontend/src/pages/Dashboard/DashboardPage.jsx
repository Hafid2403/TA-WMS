import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../../layout/DashboardLayout";
import api from "../../services/api";
import authService from "../../services/authService";
import "../../styles/dashboard.css";
import { 
  Loader2, 
  AlertTriangle, 
  Info, 
  Package, 
  CheckCircle, 
  RefreshCw,
  Check,
  X,
  Clock
} from "lucide-react";

function DashboardPage() {
  const navigate = useNavigate();
  const currentUser = authService.getCurrentUser() || {};
  const userWhId = currentUser.warehouse_id;
  const [summary, setSummary] = useState(null);
  
  // Full datasets from BE
  const [goodsReceipts, setGoodsReceipts] = useState([]);
  const [materialRequests, setMaterialRequests] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [selectedWarehouseId, setSelectedWarehouseId] = useState(userWhId ? String(userWhId) : "All Warehouses");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Expand toggles
  const [showAllGR, setShowAllGR] = useState(false);
  const [showAllMR, setShowAllMR] = useState(false);
  const [showAllStock, setShowAllStock] = useState(false);

  // Search & Filter states for each table
  const [grSearch, setGrSearch] = useState("");
  const [grStatus, setGrStatus] = useState("All Status");
  const [grStartDate, setGrStartDate] = useState("");
  const [grEndDate, setGrEndDate] = useState("");

  const [mrSearch, setMrSearch] = useState("");
  const [mrStartDate, setMrStartDate] = useState("");
  const [mrEndDate, setMrEndDate] = useState("");

  const [stockSearch, setStockSearch] = useState("");
  const [stockStatus, setStockStatus] = useState("All Status");

  useEffect(() => {
    document.title = "Dashboard | Warehouse Management System";
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError("");

      const [summaryRes, grRes, mrRes, prodRes, whRes] = await Promise.all([
        api.get("/dashboard/summary"),
        api.get("/goods-receipt"),
        api.get("/material-request"),
        api.get("/master/products"),
        api.get("/master/warehouses")
      ]);

      if (summaryRes.data && summaryRes.data.status === "success") {
        setSummary(summaryRes.data.data);
      }
      if (grRes.data && grRes.data.status === "success") {
        setGoodsReceipts(grRes.data.data);
      }
      if (mrRes.data && mrRes.data.status === "success") {
        setMaterialRequests(mrRes.data.data);
      }
      if (prodRes.data && prodRes.data.status === "success") {
        setAllProducts(prodRes.data.data);
      }
      if (whRes.data && whRes.data.status === "success") {
        setWarehouses(whRes.data.data);
      }
    } catch (err) {
      console.error("Dashboard error:", err);
      setError("Gagal memuat data ringkasan dashboard.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout title="Dashboard">
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "60vh", fontSize: "16px", fontWeight: "600", color: "#2c4fdb", gap: "8px" }}>
          <Loader2 className="animate-spin" size={20} /> Memuat data dashboard...
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout title="Dashboard">
        <div style={{ padding: "20px", background: "#fee2e2", border: "1px solid #fca5a5", color: "#b91c1c", borderRadius: "8px", fontWeight: "600", display: "flex", alignItems: "center", gap: "8px" }}>
          <AlertTriangle size={18} /> {error}
        </div>
      </DashboardLayout>
    );
  }

  const getStatusBadgeStyles = (statusVal) => {
    const s = String(statusVal).toLowerCase();
    switch (s) {
      // Goods Receipt & Material Request statuses
      case "completed":
        return { bg: "var(--status-success-bg)", text: "var(--status-success-text)", border: "var(--status-success-border)", icon: <Check size={12} />, label: "Completed" };
      case "approved":
        return { bg: "var(--status-info-bg)", text: "var(--status-info-text)", border: "var(--status-info-border)", icon: <Check size={12} />, label: "Approved" };
      case "rejected":
        return { bg: "var(--status-danger-bg)", text: "var(--status-danger-text)", border: "var(--status-danger-border)", icon: <X size={12} />, label: "Rejected" };
      case "partial":
        return { bg: "var(--status-info-bg)", text: "var(--status-info-text)", border: "var(--status-info-border)", icon: <Clock size={12} />, label: "Partial" };
      case "pending qc":
      case "pending":
        return { bg: "var(--status-warning-bg)", text: "var(--status-warning-text)", border: "var(--status-warning-border)", icon: <Clock size={12} />, label: "Pending" };
      
      // Stock statuses
      case "in stock":
        return { bg: "var(--status-success-bg)", text: "var(--status-success-text)", border: "var(--status-success-border)", icon: <Check size={12} />, label: "In Stock" };
      case "low stock":
        return { bg: "var(--status-warning-bg)", text: "var(--status-warning-text)", border: "var(--status-warning-border)", icon: <AlertTriangle size={12} />, label: "Low Stock" };
      case "out of stock":
        return { bg: "var(--status-danger-bg)", text: "var(--status-danger-text)", border: "var(--status-danger-border)", icon: <X size={12} />, label: "Out of Stock" };

      default:
        return { bg: "var(--status-warning-bg)", text: "var(--status-warning-text)", border: "var(--status-warning-border)", icon: <Clock size={12} />, label: statusVal };
    }
  };

  // Derive GR internal status mapping
  const getGRStatus = (gr) => {
    if (!gr.items || gr.items.length === 0) return "Pending QC";
    const statuses = gr.items.map(item => item.qc_status);
    if (statuses.every(s => s === "passed")) return "Completed";
    if (statuses.every(s => s === "rejected")) return "Rejected";
    if (statuses.some(s => s === "passed" || s === "partial" || s === "rejected")) return "Partial";
    return "Pending QC";
  };

  // Derive Stock info/status
  const getProductStockData = (p) => {
    let available = 0;
    if (selectedWarehouseId === "All Warehouses") {
      available = p.stocks ? p.stocks.reduce((sum, s) => sum + parseInt(s.qty_available || 0), 0) : 0;
    } else {
      available = p.stocks ? p.stocks.filter(s => s.warehouse_id === parseInt(selectedWarehouseId)).reduce((sum, s) => sum + parseInt(s.qty_available || 0), 0) : 0;
    }

    let status = "In Stock";
    let color = "#D1FAE5";
    let text = "#065F46";

    if (available === 0) {
      status = "Out of Stock";
      color = "#FEE2E2";
      text = "#991B1B";
    } else if (available <= p.min_stock) {
      status = "Low Stock";
      color = "#FEF3C7";
      text = "#92400E";
    }

    return { available, status, color, text };
  };

  // Filter GR List
  const getFilteredGR = () => {
    let list = goodsReceipts;
    if (grStartDate) {
      list = list.filter(gr => gr.receipt_date >= grStartDate);
    }
    if (grEndDate) {
      list = list.filter(gr => gr.receipt_date <= grEndDate);
    }
    return list.filter(gr => {
      const vendorName = gr.vendor ? gr.vendor.vendor_name : "";
      const matchesSearch = 
        gr.gr_number.toLowerCase().includes(grSearch.toLowerCase()) ||
        vendorName.toLowerCase().includes(grSearch.toLowerCase());
      
      const status = getGRStatus(gr);
      const matchesStatus = grStatus === "All Status" || status === grStatus;

      const matchesWarehouse = selectedWarehouseId === "All Warehouses" || gr.warehouse_id === parseInt(selectedWarehouseId);

      return matchesSearch && matchesStatus && matchesWarehouse;
    });
  };

  // Filter MR List
  const getFilteredMR = () => {
    let list = materialRequests;
    if (mrStartDate) {
      list = list.filter(mr => mr.request_date >= mrStartDate);
    }
    if (mrEndDate) {
      list = list.filter(mr => mr.request_date <= mrEndDate);
    }
    return list.filter(mr => {
      const deptName = mr.department ? mr.department.department_name : "";
      const matchesSearch = mr.mr_number.toLowerCase().includes(mrSearch.toLowerCase()) ||
             deptName.toLowerCase().includes(mrSearch.toLowerCase());

      const matchesWarehouse = selectedWarehouseId === "All Warehouses" || mr.warehouse_id === parseInt(selectedWarehouseId);

      return matchesSearch && matchesWarehouse;
    });
  };

  // Filter Stock list: If showAllStock is false, show ONLY critical items. If true, show ALL products.
  const getFilteredStocks = () => {
    const list = allProducts.map(p => ({
      ...p,
      ...getProductStockData(p)
    }));

    const baseList = showAllStock ? list : list.filter(item => item.status === "Low Stock" || item.status === "Out of Stock");

    return baseList.filter(item => {
      const matchesSearch = 
        item.product_name.toLowerCase().includes(stockSearch.toLowerCase()) ||
        item.internal_code.toLowerCase().includes(stockSearch.toLowerCase());

      const matchesStatus = stockStatus === "All Status" || item.status === stockStatus;

      return matchesSearch && matchesStatus;
    });
  };

  // Dynamic counter computations based on selected warehouse
  const activeSkus = allProducts.length;
  const lowStockCount = allProducts.filter(p => {
    const { status } = getProductStockData(p);
    return status === "Low Stock" || status === "Out of Stock";
  }).length;
  const pendingMrCount = materialRequests.filter(mr => {
    const matchesWarehouse = selectedWarehouseId === "All Warehouses" || mr.warehouse_id === parseInt(selectedWarehouseId);
    return mr.status === "pending" && matchesWarehouse;
  }).length;
  const pendingGrCount = goodsReceipts.filter(gr => {
    const matchesWarehouse = selectedWarehouseId === "All Warehouses" || gr.warehouse_id === parseInt(selectedWarehouseId);
    return getGRStatus(gr) === "Pending QC" && matchesWarehouse;
  }).length;

  return (
    <DashboardLayout title="Dashboard">
      {/* Global Warehouse Filter Banner */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", background: "var(--card-bg)", padding: "14px 20px", borderRadius: "12px", border: "1px solid var(--border-color)", flexWrap: "wrap", gap: "10px" }}>
        <div>
          <span style={{ fontSize: "11px", color: "var(--text-muted)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>Global Monitoring Context</span>
          <h2 style={{ margin: "2px 0 0 0", fontSize: "16px", fontWeight: 800, color: "var(--text-main)" }}>Multi-Warehouse Overview</h2>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <label style={{ fontSize: "12px", fontWeight: 700, color: "var(--text-muted)" }}>Select Warehouse:</label>
          <select
            value={selectedWarehouseId}
            onChange={(e) => setSelectedWarehouseId(e.target.value)}
            disabled={!!userWhId}
            style={{ padding: "8px 16px", borderRadius: "8px", border: "1.5px solid var(--border-color)", fontSize: "13px", background: "var(--input-bg)", color: "var(--text-main)", fontWeight: 700, cursor: userWhId ? "not-allowed" : "pointer" }}
          >
            {!userWhId && <option value="All Warehouses">All Warehouses (Global)</option>}
            {warehouses.map(wh => (
              <option key={wh.warehouse_id} value={wh.warehouse_id}>
                {wh.warehouse_name} ({wh.city})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Notification Alert for Low Stock */}
      {lowStockCount > 0 && (
        <div className="sys-alert sys-alert-danger">
          <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <AlertTriangle size={18} /> NOTIFIKASI SYSTEM: Terdapat {lowStockCount} produk dengan level stok kritis di bawah minimum (Low Stock)!
          </span>
          <button onClick={() => setShowAllStock(true)} style={{ background: "#EF4444", color: "#fff", border: "none", padding: "6px 14px", borderRadius: "8px", cursor: "pointer", fontWeight: 600, fontSize: "11px" }}>Lihat Detail</button>
        </div>
      )}

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">Total SKUs</div>
          <div className="stat-value">{activeSkus}</div>
          <div className="stat-sub">Active Products</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Low Stock Items</div>
          <div className="stat-value">{lowStockCount}</div>
          <div className="stat-sub">Below Minimum</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Pending Requests</div>
          <div className="stat-value">{pendingMrCount}</div>
          <div className="stat-sub">Awaiting Approval</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Pending QC Inspection</div>
          <div className="stat-value">{pendingGrCount}</div>
          <div className="stat-sub">Inbound QC Hold</div>
        </div>
      </div>

      {/* Two Column Tables */}
      <div className="dashboard-two-col" style={{ marginBottom: "16px" }}>
        
        {/* Recent Goods Receipt */}
        <div className="stat-card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
            <span style={{ fontWeight: 700, fontSize: "14px" }}>Recent Goods Receipt</span>
            <button onClick={() => setShowAllGR(!showAllGR)} style={{ padding: "5px 12px", borderRadius: "8px", border: "1.5px solid var(--accent)", background: "transparent", color: "var(--accent)", fontSize: "12px", fontWeight: 600, cursor: "pointer" }}>
              {showAllGR ? "Show Less" : "View All"}
            </button>
          </div>

          {/* Interactive Filters on Dashboard */}
          {showAllGR && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "12px" }}>
              <input 
                placeholder="Cari No. GR..." 
                value={grSearch}
                onChange={(e) => setGrSearch(e.target.value)}
                style={{ flex: 1, minWidth: "120px", padding: "6px 10px", borderRadius: "6px", border: "1px solid var(--border-color)", fontSize: "12px", background: "var(--input-bg)", color: "var(--text-main)" }}
              />
              <select 
                value={grStatus}
                onChange={(e) => setGrStatus(e.target.value)}
                style={{ padding: "6px 10px", borderRadius: "6px", border: "1px solid var(--border-color)", fontSize: "12px", background: "var(--input-bg)", color: "var(--text-main)" }}
              >
                <option value="All Status">All Status</option>
                <option value="Pending QC">Pending QC</option>
                <option value="Partial">Partial</option>
                <option value="Completed">Completed</option>
                <option value="Rejected">Rejected</option>
              </select>
              <div className="date-range-picker">
                <input 
                  type="date" 
                  value={grStartDate} 
                  onChange={(e) => setGrStartDate(e.target.value)} 
                  style={{ padding: "5px 8px", borderRadius: "6px", border: "1px solid var(--border-color)", fontSize: "11px", background: "var(--input-bg)", color: "var(--text-main)" }} 
                />
                <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>to</span>
                <input 
                  type="date" 
                  value={grEndDate} 
                  onChange={(e) => setGrEndDate(e.target.value)} 
                  style={{ padding: "5px 8px", borderRadius: "6px", border: "1px solid var(--border-color)", fontSize: "11px", background: "var(--input-bg)", color: "var(--text-main)" }} 
                />
              </div>
            </div>
          )}

          <div className="table-wrap no-min-width">
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
              <thead>
                <tr>
                  <th style={{ textAlign: "left", padding: "10px 14px", background: "var(--table-header-bg)", fontSize: "11px", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", borderBottom: "1px solid var(--border-color)" }}>GR Number</th>
                  <th style={{ textAlign: "left", padding: "10px 14px", background: "var(--table-header-bg)", fontSize: "11px", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", borderBottom: "1px solid var(--border-color)" }}>Vendor</th>
                  <th style={{ textAlign: "left", padding: "10px 14px", background: "var(--table-header-bg)", fontSize: "11px", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", borderBottom: "1px solid var(--border-color)" }}>Date</th>
                  <th style={{ textAlign: "left", padding: "10px 14px", background: "var(--table-header-bg)", fontSize: "11px", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", borderBottom: "1px solid var(--border-color)" }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {getFilteredGR().length > 0 ? (
                  (showAllGR ? getFilteredGR() : getFilteredGR().slice(0, 3)).map((gr) => {
                    const status = getGRStatus(gr);
                    return (
                      <tr key={gr.gr_id}>
                        <td style={{ padding: "11px 14px", borderBottom: "1px solid var(--border-color)", fontWeight: 700, color: "var(--text-main)" }}>{gr.gr_number}</td>
                        <td style={{ padding: "11px 14px", borderBottom: "1px solid var(--border-color)", color: "var(--text-main)" }}>{gr.vendor?.vendor_name || "-"}</td>
                        <td style={{ padding: "11px 14px", borderBottom: "1px solid var(--border-color)", color: "var(--text-muted)" }}>
                          {gr.receipt_date ? new Date(gr.receipt_date).toLocaleDateString("id-ID", { day: "2-digit", month: "short" }) : "-"}
                        </td>
                        <td style={{ padding: "11px 14px", borderBottom: "1px solid var(--border-color)" }}>
                          <span style={{
                            background: getStatusBadgeStyles(status).bg,
                            color: getStatusBadgeStyles(status).text,
                            border: `1.5px solid ${getStatusBadgeStyles(status).border}`,
                            padding: "3px 10px",
                            borderRadius: "20px",
                            fontSize: "11px",
                            fontWeight: 700,
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "4px",
                            whiteSpace: "nowrap"
                          }}>
                            {getStatusBadgeStyles(status).icon} {getStatusBadgeStyles(status).label}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="4" style={{ padding: "15px", textAlign: "center", color: "#6b7280" }}>Tidak ada penerimaan barang ditemukan.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pending Material Request */}
        <div className="stat-card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
            <span style={{ fontWeight: 700, fontSize: "14px" }}>Pending Material Request</span>
            <button onClick={() => setShowAllMR(!showAllMR)} style={{ padding: "5px 12px", borderRadius: "8px", border: "1.5px solid var(--accent)", background: "transparent", color: "var(--accent)", fontSize: "12px", fontWeight: 600, cursor: "pointer" }}>
              {showAllMR ? "Show Less" : "View All"}
            </button>
          </div>

          {/* Interactive Search for MR */}
          {showAllMR && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "12px" }}>
              <input 
                placeholder="Cari No. MR atau Dept..." 
                value={mrSearch}
                onChange={(e) => setMrSearch(e.target.value)}
                style={{ flex: 1, minWidth: "120px", padding: "6px 10px", borderRadius: "6px", border: "1px solid var(--border-color)", fontSize: "12px", background: "var(--input-bg)", color: "var(--text-main)" }}
              />
              <div className="date-range-picker">
                <input 
                  type="date" 
                  value={mrStartDate} 
                  onChange={(e) => setMrStartDate(e.target.value)} 
                  style={{ padding: "5px 8px", borderRadius: "6px", border: "1px solid var(--border-color)", fontSize: "11px", background: "var(--input-bg)", color: "var(--text-main)" }} 
                />
                <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>to</span>
                <input 
                  type="date" 
                  value={mrEndDate} 
                  onChange={(e) => setMrEndDate(e.target.value)} 
                  style={{ padding: "5px 8px", borderRadius: "6px", border: "1px solid var(--border-color)", fontSize: "11px", background: "var(--input-bg)", color: "var(--text-main)" }} 
                />
              </div>
            </div>
          )}

          <div className="table-wrap no-min-width">
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
              <thead>
                <tr>
                  <th style={{ textAlign: "left", padding: "10px 14px", background: "var(--table-header-bg)", fontSize: "11px", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", borderBottom: "1px solid var(--border-color)" }}>MR Number</th>
                  <th style={{ textAlign: "left", padding: "10px 14px", background: "var(--table-header-bg)", fontSize: "11px", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", borderBottom: "1px solid var(--border-color)" }}>Dept</th>
                  <th style={{ textAlign: "left", padding: "10px 14px", background: "var(--table-header-bg)", fontSize: "11px", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", borderBottom: "1px solid var(--border-color)" }}>Date</th>
                  <th style={{ textAlign: "left", padding: "10px 14px", background: "var(--table-header-bg)", fontSize: "11px", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", borderBottom: "1px solid var(--border-color)" }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {getFilteredMR().length > 0 ? (
                  (showAllMR ? getFilteredMR() : getFilteredMR().slice(0, 3)).map((mr) => (
                    <tr key={mr.mr_id}>
                      <td style={{ padding: "11px 14px", borderBottom: "1px solid var(--border-color)", fontWeight: 700, color: "var(--text-main)" }}>{mr.mr_number}</td>
                      <td style={{ padding: "11px 14px", borderBottom: "1px solid var(--border-color)", color: "var(--text-main)" }}>{mr.department?.department_name || "-"}</td>
                      <td style={{ padding: "11px 14px", borderBottom: "1px solid var(--border-color)", color: "var(--text-muted)" }}>
                        {mr.request_date ? new Date(mr.request_date).toLocaleDateString("id-ID", { day: "2-digit", month: "short" }) : "-"}
                      </td>
                      <td style={{ padding: "11px 14px", borderBottom: "1px solid var(--border-color)" }}>
                        <span style={{
                          background: getStatusBadgeStyles(mr.status).bg,
                          color: getStatusBadgeStyles(mr.status).text,
                          border: `1.5px solid ${getStatusBadgeStyles(mr.status).border}`,
                          padding: "3px 10px",
                          borderRadius: "20px",
                          fontSize: "11px",
                          fontWeight: 700,
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "4px",
                          whiteSpace: "nowrap"
                        }}>
                          {getStatusBadgeStyles(mr.status).icon} {getStatusBadgeStyles(mr.status).label}
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

      </div>

      {/* Stock alert - Low Stock Items */}
      <div className="stat-card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
          <span style={{ fontWeight: 700, fontSize: "14px", display: "flex", alignItems: "center", gap: "6px" }}>
            {showAllStock ? (
              <>
                <Package size={16} /> Stock Overview — All Products
              </>
            ) : (
              <>
                <AlertTriangle size={16} /> Stock Alert — Low Stock Items
              </>
            )}
          </span>
          <button onClick={() => setShowAllStock(!showAllStock)} style={{ padding: "5px 12px", borderRadius: "8px", border: "1.5px solid var(--accent)", background: "transparent", color: "var(--accent)", fontSize: "12px", fontWeight: 600, cursor: "pointer" }}>
            {showAllStock ? "Show Less" : "Stock Overview"}
          </button>
        </div>

        {/* Interactive Search & Status filter for Stocks */}
        {showAllStock && (
          <div style={{ display: "flex", gap: "8px", marginBottom: "12px" }}>
            <input 
              placeholder="Cari nama produk..." 
              value={stockSearch}
              onChange={(e) => setStockSearch(e.target.value)}
              style={{ flex: 1, padding: "6px 10px", borderRadius: "6px", border: "1px solid var(--border-color)", fontSize: "12px", background: "var(--input-bg)", color: "var(--text-main)" }}
            />
            <select 
              value={stockStatus}
              onChange={(e) => setStockStatus(e.target.value)}
              style={{ padding: "6px 10px", borderRadius: "6px", border: "1px solid var(--border-color)", fontSize: "12px", background: "var(--input-bg)", color: "var(--text-main)" }}
            >
              <option value="All Status">All Status</option>
              <option value="In Stock">In Stock</option>
              <option value="Low Stock">Low Stock</option>
              <option value="Out of Stock">Out of Stock</option>
            </select>
          </div>
        )}

        <div className="table-wrap">
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
            <thead>
              <tr>
                <th style={{ textAlign: "left", padding: "10px 14px", background: "var(--table-header-bg)", fontSize: "11px", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", borderBottom: "1px solid var(--border-color)" }}>Internal Code</th>
                <th style={{ textAlign: "left", padding: "10px 14px", background: "var(--table-header-bg)", fontSize: "11px", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", borderBottom: "1px solid var(--border-color)" }}>Product Name</th>
                <th style={{ textAlign: "left", padding: "10px 14px", background: "var(--table-header-bg)", fontSize: "11px", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", borderBottom: "1px solid var(--border-color)" }}>Available</th>
                <th style={{ textAlign: "left", padding: "10px 14px", background: "var(--table-header-bg)", fontSize: "11px", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", borderBottom: "1px solid var(--border-color)" }}>Min Stock</th>
                <th style={{ textAlign: "left", padding: "10px 14px", background: "var(--table-header-bg)", fontSize: "11px", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", borderBottom: "1px solid var(--border-color)" }}>Stock Status</th>
              </tr>
            </thead>
            <tbody>
              {getFilteredStocks().length > 0 ? (
                getFilteredStocks().map((item, index) => (
                  <tr key={index}>
                    <td style={{ padding: "11px 14px", borderBottom: "1px solid var(--border-color)" }}>
                      <span style={{ background: "var(--item-hover)", color: "var(--text-main)", padding: "3px 8px", borderRadius: "6px", fontSize: "11px", fontWeight: 600 }}>{item.internal_code}</span>
                    </td>
                    <td style={{ padding: "11px 14px", borderBottom: "1px solid var(--border-color)", color: "var(--text-main)" }}>{item.product_name}</td>
                    <td style={{ padding: "11px 14px", borderBottom: "1px solid var(--border-color)", color: item.status === "In Stock" ? "#10B981" : "#EF4444", fontWeight: 700 }}>
                      {item.available} {item.unit || "pcs"}
                    </td>
                    <td style={{ padding: "11px 14px", borderBottom: "1px solid var(--border-color)", color: "var(--text-main)" }}>{item.min_stock} {item.unit || "pcs"}</td>
                    <td style={{ padding: "11px 14px", borderBottom: "1px solid var(--border-color)" }}>
                      <span style={{
                        background: getStatusBadgeStyles(item.status).bg,
                        color: getStatusBadgeStyles(item.status).text,
                        border: `1.5px solid ${getStatusBadgeStyles(item.status).border}`,
                        padding: "3px 10px",
                        borderRadius: "20px",
                        fontSize: "11px",
                        fontWeight: 700,
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "4px",
                        whiteSpace: "nowrap"
                      }}>
                        {getStatusBadgeStyles(item.status).icon} {getStatusBadgeStyles(item.status).label}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" style={{ padding: "15px", textAlign: "center", color: "#10b981", fontWeight: "600" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}>
                      <CheckCircle size={16} /> Semua stok produk dalam batas aman!
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardLayout>
  );
}

export default DashboardPage;