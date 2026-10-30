import { useState, useEffect } from "react";
import DashboardLayout from "../../layout/DashboardLayout";
import api from "../../services/api";
import authService from "../../services/authService";
import { 
  ChevronLeft, 
  ChevronRight, 
  AlertTriangle, 
  Search,
  Check,
  X
} from "lucide-react";

function StockOverviewPage() {
  const currentUser = authService.getCurrentUser() || {};

  const getStatusBadgeStyles = (statusVal) => {
    const s = String(statusVal).toLowerCase();
    switch (s) {
      case "in stock":
        return { bg: "var(--status-success-bg)", text: "var(--status-success-text)", border: "var(--status-success-border)", icon: <Check size={12} />, label: "In Stock" };
      case "low stock":
        return { bg: "var(--status-warning-bg)", text: "var(--status-warning-text)", border: "var(--status-warning-border)", icon: <AlertTriangle size={12} />, label: "Low Stock" };
      case "out of stock":
        return { bg: "var(--status-danger-bg)", text: "var(--status-danger-text)", border: "var(--status-danger-border)", icon: <X size={12} />, label: "Out of Stock" };
      default:
        return { bg: "var(--status-warning-bg)", text: "var(--status-warning-text)", border: "var(--status-warning-border)", icon: <AlertTriangle size={12} />, label: statusVal };
    }
  };

  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [error, setError] = useState("");

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All Categories");
  const [selectedStatus, setSelectedStatus] = useState("All Status");
  const [selectedWarehouse, setSelectedWarehouse] = useState(() => {
    const user = authService.getCurrentUser();
    return user && user.warehouse_id ? String(user.warehouse_id) : "";
  });

  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedCategory, selectedStatus, selectedWarehouse]);

  const fetchData = async () => {
    setLoading(true);
    setError("");
    try {
      const prodRes = await api.get("/master/products");
      if (prodRes.data && prodRes.data.status === "success") {
        setProducts(prodRes.data.data);
      }

      const catRes = await api.get("/master/categories");
      if (catRes.data && catRes.data.status === "success") {
        setCategories(catRes.data.data);
      }

      const whRes = await api.get("/master/warehouses");
      if (whRes.data && whRes.data.status === "success") {
        setWarehouses(whRes.data.data);
      }
    } catch (err) {
      console.error("Error loading stock overview:", err);
      setError("Gagal memuat data stok dari server.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    document.title = "Ikhtisar Stok | Warehouse Management System";
    fetchData();
  }, []);

  const getProductStockData = (p) => {
    const filteredStocks = selectedWarehouse 
      ? (p.stocks ? p.stocks.filter(s => s.warehouse_id === parseInt(selectedWarehouse)) : [])
      : (p.stocks || []);

    const available = filteredStocks.reduce((sum, s) => sum + parseInt(s.qty_available || 0), 0);
    const reserved = filteredStocks.reduce((sum, s) => sum + parseInt(s.qty_reserved || 0), 0);
    
    // Get shelf coordinates from first stock entry
    let zoneLabel = "Staging";
    if (filteredStocks.length > 0) {
      const s = filteredStocks[0];
      if (s.zone && s.rack && s.bin) {
        zoneLabel = `${s.zone}-${s.rack}-${s.bin}`;
      }
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

    return { available, reserved, zoneLabel, status, color, text };
  };

  const getFilteredStocks = () => {
    return products.map(p => {
      const stockInfo = getProductStockData(p);
      return {
        ...p,
        ...stockInfo
      };
    }).filter(p => {
      const matchesSearch = 
        p.product_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.internal_code.toLowerCase().includes(searchQuery.toLowerCase());
      
      const catName = p.category ? p.category.category_name : "";
      const matchesCat = 
        selectedCategory === "All Categories" ||
        catName === selectedCategory;

      const matchesStatus = 
        selectedStatus === "All Status" ||
        p.status === selectedStatus;

      return matchesSearch && matchesCat && matchesStatus;
    });
  };

  const ITEMS_PER_PAGE = 10;
  const filteredStocks = getFilteredStocks();
  const totalStocksPages = Math.ceil(filteredStocks.length / ITEMS_PER_PAGE);
  const paginatedStocks = filteredStocks.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const renderPagination = (currentPage, setCurrentPage, totalPages, label) => {
    if (totalPages <= 1) return null;
    return (
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 20px", borderTop: "1px solid var(--border-color)", background: "var(--table-header-bg)" }}>
        <span style={{ fontSize: "12px", color: "var(--text-muted)", fontWeight: "bold" }}>
          Menampilkan Halaman {currentPage} dari {totalPages} ({label})
        </span>
        <div style={{ display: "flex", gap: "6px" }}>
          <button 
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            style={{ 
              padding: "5px 12px", 
              borderRadius: "6px", 
              border: "1.5px solid var(--border-color)", 
              background: currentPage === 1 ? "var(--input-bg)" : "var(--card-bg)", 
              color: currentPage === 1 ? "var(--text-muted)" : "var(--text-main)", 
              fontSize: "12px", 
              fontWeight: 700, 
              cursor: currentPage === 1 ? "not-allowed" : "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: "4px"
            }}
          >
            <ChevronLeft size={14} /> Prev
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
            <button
              key={p}
              onClick={() => setCurrentPage(p)}
              style={{
                padding: "5px 10px",
                borderRadius: "6px",
                border: "1.5px solid " + (currentPage === p ? "#2C4FDB" : "var(--border-color)"),
                background: currentPage === p ? "#2C4FDB" : "var(--card-bg)",
                color: currentPage === p ? "#fff" : "var(--text-main)",
                fontSize: "12px",
                fontWeight: 700,
                cursor: "pointer"
              }}
            >
              {p}
            </button>
          ))}
          <button 
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            style={{ 
              padding: "5px 12px", 
              borderRadius: "6px", 
              border: "1.5px solid var(--border-color)", 
              background: currentPage === totalPages ? "var(--input-bg)" : "var(--card-bg)", 
              color: currentPage === totalPages ? "var(--text-muted)" : "var(--text-main)", 
              fontSize: "12px", 
              fontWeight: 700, 
              cursor: currentPage === totalPages ? "not-allowed" : "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: "4px"
            }}
          >
            Next <ChevronRight size={14} />
          </button>
        </div>
      </div>
    );
  };

  return (
    <DashboardLayout title="Stock Overview">
      {error && (
        <div className="sys-alert sys-alert-danger" style={{ padding: "12px 16px", fontSize: "13px" }}>
          <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <AlertTriangle size={14} /> {error}
          </span>
        </div>
      )}

      {currentUser && currentUser.warehouse_id && selectedWarehouse && parseInt(selectedWarehouse) !== parseInt(currentUser.warehouse_id) && (
        <div className="sys-alert sys-alert-danger" style={{ padding: "12px 16px", fontSize: "13px" }}>
          <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <AlertTriangle size={14} />
            <span>Anda tidak memiliki otoritas akses untuk melihat inventory di warehouse lain.</span>
          </span>
        </div>
      )}

      {/* Search & Filter */}
      <div style={{ display: "flex", gap: "10px", marginBottom: "20px", alignItems: "center", flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", background: "var(--input-bg)", border: "1.5px solid var(--border-color)", borderRadius: "8px", padding: "8px 12px", flex: 1, minWidth: "200px", gap: "8px" }}>
          <Search size={14} style={{ color: "var(--text-muted)" }} />
          <input 
            placeholder="Search product..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ border: "none", outline: "none", fontSize: "13px", width: "100%", background: "transparent", color: "var(--text-main)" }} 
          />
        </div>
        <select 
          value={selectedWarehouse}
          onChange={(e) => setSelectedWarehouse(e.target.value)}
          disabled={!!currentUser.warehouse_id}
          style={{ padding: "8px 12px", borderRadius: "8px", border: "1.5px solid var(--border-color)", fontSize: "13px", background: "var(--input-bg)", color: "var(--text-main)", opacity: currentUser.warehouse_id ? 0.7 : 1 }}
        >
          {!currentUser.warehouse_id && <option value="">All Warehouses</option>}
          {warehouses.map(w => (
            <option key={w.warehouse_id} value={w.warehouse_id}>{w.warehouse_name}</option>
          ))}
        </select>
        <select 
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          style={{ padding: "8px 12px", borderRadius: "8px", border: "1.5px solid var(--border-color)", fontSize: "13px", background: "var(--input-bg)", color: "var(--text-main)" }}
        >
          <option>All Categories</option>
          {categories.map(c => (
            <option key={c.category_id} value={c.category_name}>{c.category_name}</option>
          ))}
        </select>
        <select 
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          style={{ padding: "8px 12px", borderRadius: "8px", border: "1.5px solid var(--border-color)", fontSize: "13px", background: "var(--input-bg)", color: "var(--text-main)" }}
        >
          <option>All Status</option>
          <option>In Stock</option>
          <option>Low Stock</option>
          <option>Out of Stock</option>
        </select>
      </div>

      {/* Table */}
      <div style={{ background: "var(--card-bg)", borderRadius: "12px", border: "1px solid var(--border-color)", color: "var(--text-main)" }}>
        <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border-color)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontWeight: 700, fontSize: "14px" }}>Inventory Stock</span>
          <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>Total: {filteredStocks.length} products</span>
        </div>
        
        {loading ? (
          <div style={{ padding: "40px", textAlign: "center", color: "var(--text-muted)", fontSize: "14px" }}>Memuat ikhtisar stok...</div>
        ) : (
          <>
            <div className="table-wrap">
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                <thead>
                  <tr>
                    {["Internal Code", "Product Name", "Category", "Available", "Reserved", "Min Stock", "Zone/Rack", "Status"].map((h) => (
                      <th key={h} style={{ textAlign: "left", padding: "10px 20px", background: "var(--table-header-bg)", fontSize: "11px", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", borderBottom: "1px solid var(--border-color)" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {paginatedStocks.length === 0 ? (
                    <tr>
                      <td colSpan="8" style={{ padding: "20px", textAlign: "center", color: "var(--text-muted)" }}>Tidak ada data inventaris stok ditemukan</td>
                    </tr>
                  ) : (
                    paginatedStocks.map((row) => (
                      <tr key={row.product_id} style={{ borderBottom: "1px solid var(--border-color)" }}>
                        <td style={{ padding: "12px 20px" }}><span style={{ background: "var(--table-header-bg)", border: "1px solid var(--border-color)", padding: "2px 6px", borderRadius: "4px", fontSize: "11px", fontFamily: "monospace", color: "var(--text-muted)" }}>{row.internal_code}</span></td>
                        <td style={{ padding: "12px 20px", fontWeight: 600, color: "var(--text-main)" }}>{row.product_name}</td>
                        <td style={{ padding: "12px 20px", color: "var(--text-muted)" }}>{row.category ? row.category.category_name : "-"}</td>
                        <td style={{ padding: "12px 20px", fontWeight: 700, color: row.available === 0 ? "#EF4444" : "var(--text-main)" }}>{row.available} {row.unit}</td>
                        <td style={{ padding: "12px 20px", color: "var(--text-muted)" }}>{row.reserved} {row.unit}</td>
                        <td style={{ padding: "12px 20px", color: "var(--text-muted)" }}>{row.min_stock} {row.unit}</td>
                        <td style={{ padding: "12px 20px", color: "var(--text-muted)" }}><span style={{ background: "var(--table-header-bg)", border: "1px solid var(--border-color)", padding: "2px 6px", borderRadius: "4px", fontSize: "11px", color: "var(--text-main)" }}>{row.zoneLabel}</span></td>
                        <td style={{ padding: "12px 20px" }}>
                          <span style={{ 
                            background: getStatusBadgeStyles(row.status).bg, 
                            color: getStatusBadgeStyles(row.status).text, 
                            border: `1.5px solid ${getStatusBadgeStyles(row.status).border}`,
                            padding: "3px 10px", 
                            borderRadius: "20px", 
                            fontSize: "11px", 
                            fontWeight: 700,
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "4px",
                            whiteSpace: "nowrap"
                          }}>
                            {getStatusBadgeStyles(row.status).icon} {getStatusBadgeStyles(row.status).label}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            {renderPagination(currentPage, setCurrentPage, totalStocksPages, "Stok Overview")}
          </>
        )}
      </div>
    </DashboardLayout>
  );
}

export default StockOverviewPage;