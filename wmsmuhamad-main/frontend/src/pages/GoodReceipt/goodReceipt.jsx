import { useState, useEffect } from "react";
import DashboardLayout from "../../layout/DashboardLayout";
import api from "../../services/api";
import { exportGoodsReceiptPdf } from "../../utils/pdfExport";
import authService from "../../services/authService";
import { 
  X, 
  Check, 
  ChevronLeft, 
  ChevronRight, 
  AlertTriangle, 
  Plus, 
  Search, 
  ChevronUp, 
  ChevronDown, 
  Edit2, 
  FileText, 
  Trash2, 
  Clock, 
  ClipboardList 
} from "lucide-react";

function GoodsReceiptPage() {
  const currentUser = authService.getCurrentUser() || {};
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);
  const [returnsList, setReturnsList] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [products, setProducts] = useState([]);
  const [vendorProducts, setVendorProducts] = useState([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Tabs: "history", "pending", "retur", "items_log"
  const [activeTab, setActiveTab] = useState("history");

  // Toggle form
  const [showNewForm, setShowNewForm] = useState(false);

  // Edit modal state
  const [editingGR, setEditingGR] = useState(null);
  const [editVendorId, setEditVendorId] = useState("");
  const [editWarehouseId, setEditWarehouseId] = useState("");
  const [editReceiptDate, setEditReceiptDate] = useState("");
  const [editReceiptType, setEditReceiptType] = useState("");
  const [editNotes, setEditNotes] = useState("");
  const [editPoNumber, setEditPoNumber] = useState("");

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("All Status");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Expandable row tracking for grouping logs
  const [expandedGRs, setExpandedGRs] = useState({});

  // Form states
  const [vendorId, setVendorId] = useState("");
  const [poNumber, setPoNumber] = useState("");
  const [warehouseId, setWarehouseId] = useState("");
  const [receiptDate, setReceiptDate] = useState(new Date().toISOString().split("T")[0]);
  const [receiptType, setReceiptType] = useState("good_receipt");
  const [notes, setNotes] = useState("");
  const [formItems, setFormItems] = useState([
    { product_id: "", qty_received: "", vendor_product_code: "" }
  ]);

  const [currentPage, setCurrentPage] = useState(1);

  // Reset page to 1 when filters or tabs change
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, searchQuery, selectedStatus, startDate, endDate]);

  useEffect(() => {
    document.title = "Penerimaan Barang | Warehouse Management System";
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (showNewForm) {
      const refetchMasterData = async () => {
        try {
          const [vendorRes, vpRes] = await Promise.all([
            api.get("/master/vendors"),
            api.get("/master/vendor-products")
          ]);
          if (vendorRes.data && vendorRes.data.status === "success") {
            setVendors(vendorRes.data.data);
          }
          if (vpRes.data && vpRes.data.status === "success") {
            setVendorProducts(vpRes.data.data);
          }
        } catch (err) {
          console.error("Error refreshing master data inside modal:", err);
        }
      };
      refetchMasterData();
    } else {
      setProducts([]);
    }
  }, [showNewForm]);

  useEffect(() => {
    if (showNewForm && warehouseId) {
      const fetchWarehouseProducts = async () => {
        try {
          const prodRes = await api.get(`/master/products?warehouse_id=${warehouseId}&assigned_only=true`);
          if (prodRes.data && prodRes.data.status === "success") {
            setProducts(prodRes.data.data);
          }
        } catch (err) {
          console.error("Error fetching warehouse products:", err);
        }
      };
      fetchWarehouseProducts();
    }
  }, [warehouseId, showNewForm]);

  const handleExportPDF = async (receipt) => {
    try {
      setLoading(true);
      const res = await api.get(`/master/warehouse-signatures?warehouse_id=${receipt.warehouse_id}&document_type=goods_receipt`);
      if (res.data && res.data.status === "success" && res.data.data) {
        exportGoodsReceiptPdf(receipt, res.data.data.columns);
      } else {
        exportGoodsReceiptPdf(receipt);
      }
    } catch (err) {
      console.error("Error fetching signature settings for PDF export:", err);
      exportGoodsReceiptPdf(receipt);
    } finally {
      setLoading(false);
    }
  };

  const fetchInitialData = async () => {
    setLoading(true);
    setError("");
    try {
      // 1. Fetch GR History
      const histRes = await api.get("/goods-receipt");
      if (histRes.data && histRes.data.status === "success") {
        setHistory(histRes.data.data);
      }

      // 2. Fetch Returns List
      const retRes = await api.get("/returns");
      if (retRes.data && retRes.data.status === "success") {
        setReturnsList(retRes.data.data);
      }

      // 3. Fetch Vendors
      const vendorRes = await api.get("/master/vendors");
      if (vendorRes.data && vendorRes.data.status === "success") {
        setVendors(vendorRes.data.data);
        if (vendorRes.data.data.length > 0) {
          setVendorId(vendorRes.data.data[0].vendor_id);
        }
      }

      // 4. Fetch Warehouses
      const whRes = await api.get("/master/warehouses");
      if (whRes.data && whRes.data.status === "success") {
        setWarehouses(whRes.data.data);
        if (whRes.data.data.length > 0) {
          const userWhId = currentUser.warehouse_id;
          const foundWh = userWhId ? whRes.data.data.find(w => w.warehouse_id === parseInt(userWhId)) : null;
          setWarehouseId(foundWh ? foundWh.warehouse_id : whRes.data.data[0].warehouse_id);
        }
      }

      // 5. Fetch Vendor Products Catalog
      const vpRes = await api.get("/master/vendor-products");
      if (vpRes.data && vpRes.data.status === "success") {
        setVendorProducts(vpRes.data.data);
      }

    } catch (err) {
      console.error("Error loading Goods Receipt data:", err);
      setError("Gagal memuat data dari server.");
    } finally {
      setLoading(false);
    }
  };

  const handleAddItem = () => {
    setFormItems([...formItems, { product_id: "", qty_received: "", vendor_product_code: "" }]);
  };

  const handleRemoveItem = (index) => {
    if (formItems.length === 1) return;
    setFormItems(formItems.filter((_, i) => i !== index));
  };

  const handleItemChange = (index, field, value) => {
    if (field === "product_id" && value) {
      const isDuplicate = formItems.some((item, i) => i !== index && item.product_id === value);
      if (isDuplicate) {
        alert("Produk ini sudah dipilih di baris lain! Silakan pilih produk lain atau ubah kuantitas di baris yang sudah ada.");
        return;
      }
      // Auto-suggest vendor product code if it exists
      const matchedVp = vendorProducts.find(vp => vp.product_id === parseInt(value) && vp.vendor_id === parseInt(vendorId));
      const updated = [...formItems];
      updated[index].product_id = value;
      updated[index].vendor_product_code = matchedVp ? matchedVp.vendor_product_code : "";
      setFormItems(updated);
      return;
    }
    const updated = [...formItems];
    updated[index][field] = value;
    setFormItems(updated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!vendorId || !warehouseId) {
      setError("Silakan pilih Vendor dan Gudang.");
      return;
    }

    // Validate items
    const invalidItem = formItems.find(item => !item.product_id || item.qty_received <= 0);
    if (invalidItem) {
      setError("Pastikan semua item dipilih dan memiliki jumlah lebih dari 0.");
      return;
    }

    // item.product_id stores the selected product_id
    const payloadItems = formItems.map(item => ({
      product_id: parseInt(item.product_id),
      qty_received: parseInt(item.qty_received, 10),
      vendor_product_code: item.vendor_product_code || ""
    }));

    try {
      setLoading(true);
      const payload = {
        vendor_id: parseInt(vendorId),
        po_number: poNumber,
        warehouse_id: parseInt(warehouseId),
        receipt_date: receiptDate,
        receipt_type: receiptType,
        notes: notes,
        items: payloadItems
      };

      const res = await api.post("/goods-receipt", payload);
      if (res.data && res.data.status === "success") {
        setSuccess("Goods Receipt berhasil dibuat!");
        setVendorId("");
        setPoNumber("");
        setNotes("");
        setFormItems([{ product_id: "", qty_received: "", vendor_product_code: "" }]);
        setShowNewForm(false);
        fetchInitialData();
      }
    } catch (err) {
      console.error("Error creating Goods Receipt:", err);
      if (err.response && err.response.data && err.response.data.message) {
        setError(err.response.data.message);
      } else {
        setError("Gagal menyimpan Goods Receipt.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleOpenEdit = (gr) => {
    setEditingGR(gr);
    setEditVendorId(gr.vendor_id || "");
    setEditWarehouseId(gr.warehouse_id || "");
    
    // Extract YYYY-MM-DD from ISO format to render cleanly in date input
    const cleanDate = gr.receipt_date ? gr.receipt_date.split("T")[0] : "";
    setEditReceiptDate(cleanDate);
    
    setEditReceiptType(gr.receipt_type || "good_receipt");
    setEditNotes(gr.notes || "");
    setEditPoNumber(gr.purchase_order?.po_number || "");
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      await api.put(`/goods-receipt/${editingGR.gr_id}`, {
        vendor_id: parseInt(editVendorId),
        warehouse_id: parseInt(editWarehouseId),
        receipt_date: editReceiptDate,
        receipt_type: editReceiptType,
        notes: editNotes,
        po_number: editPoNumber,
      });
      setSuccess("Goods Receipt berhasil diperbarui!");
      setEditingGR(null);
      fetchInitialData();
    } catch (err) {
      setError(err.response?.data?.message || "Gagal memperbarui Goods Receipt.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteGR = async (grId) => {
    if (!window.confirm("Apakah Anda yakin ingin menghapus Goods Receipt ini? Tindakan ini tidak dapat dibatalkan.")) return;
    try {
      setLoading(true);
      await api.delete(`/goods-receipt/${grId}`);
      setSuccess("Goods Receipt berhasil dihapus!");
      fetchInitialData();
    } catch (err) {
      setError(err.response?.data?.message || "Gagal menghapus Goods Receipt.");
    } finally {
      setLoading(false);
    }
  };

  const getGRStatus = (gr) => {
    if (!gr.items || gr.items.length === 0) return "Pending QC";
    const statuses = gr.items.map(item => item.qc_status);
    if (statuses.every(s => s === "passed")) return "Completed";
    if (statuses.every(s => s === "rejected")) return "Rejected";
    if (statuses.some(s => s === "passed" || s === "partial" || s === "rejected")) return "Partial";
    return "Pending QC";
  };

  const getStatusBadge = (statusVal) => {
    const s = String(statusVal).toLowerCase();
    switch (s) {
      case "completed":
      case "passed":
        return { color: "var(--status-success-bg)", text: "var(--status-success-text)", border: "var(--status-success-border)", icon: <Check size={12} />, label: statusVal };
      case "rejected":
        return { color: "var(--status-danger-bg)", text: "var(--status-danger-text)", border: "var(--status-danger-border)", icon: <X size={12} />, label: statusVal };
      case "partial":
        return { color: "var(--status-info-bg)", text: "var(--status-info-text)", border: "var(--status-info-border)", icon: <Clock size={12} />, label: statusVal };
      default:
        return { color: "var(--status-warning-bg)", text: "var(--status-warning-text)", border: "var(--status-warning-border)", icon: <Clock size={12} />, label: statusVal };
    }
  };

  const getTotalQty = (items) => {
    if (!items || items.length === 0) return 0;
    return items.reduce((sum, item) => sum + Number(item.qty_received || 0), 0);
  };

  const getFilteredHistory = () => {
    let list = history;

    // Filter by date range
    if (startDate) {
      list = list.filter(gr => {
        const grDate = gr.receipt_date ? gr.receipt_date.split("T")[0].split(" ")[0] : "";
        return grDate >= startDate;
      });
    }
    if (endDate) {
      list = list.filter(gr => {
        const grDate = gr.receipt_date ? gr.receipt_date.split("T")[0].split(" ")[0] : "";
        return grDate <= endDate;
      });
    }

    if (activeTab === "pending") {
      list = list.filter(gr => {
        const s = getGRStatus(gr);
        return s === "Pending QC" || s === "Partial";
      });
    }

    return list.filter(gr => {
      const vendorName = gr.vendor ? gr.vendor.vendor_name : "";
      const matchesSearch = 
        gr.gr_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
        vendorName.toLowerCase().includes(searchQuery.toLowerCase());
      const status = getGRStatus(gr);
      const matchesStatus = selectedStatus === "All Status" || status === selectedStatus;
      return matchesSearch && matchesStatus;
    });
  };

  const getFilteredReturns = () => {
    let list = returnsList;

    if (startDate) {
      list = list.filter(ret => {
        const retDate = ret.return_date ? ret.return_date.split("T")[0].split(" ")[0] : "";
        return retDate >= startDate;
      });
    }
    if (endDate) {
      list = list.filter(ret => {
        const retDate = ret.return_date ? ret.return_date.split("T")[0].split(" ")[0] : "";
        return retDate <= endDate;
      });
    }

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      list = list.filter(ret => 
        (ret.goods_receipt_item?.goods_receipt?.gr_number || "").toLowerCase().includes(q) ||
        (ret.vendor?.vendor_name || "").toLowerCase().includes(q) ||
        (ret.product?.product_name || "").toLowerCase().includes(q)
      );
    }

    return list;
  };

  const toggleExpandGR = (grId) => {
    setExpandedGRs(prev => ({
      ...prev,
      [grId]: !prev[grId]
    }));
  };

  const ITEMS_PER_PAGE = 10;
  
  const filteredReturns = getFilteredReturns();
  const totalReturnsPages = Math.ceil(filteredReturns.length / ITEMS_PER_PAGE);
  const paginatedReturns = filteredReturns.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const filteredHistory = getFilteredHistory();
  const totalHistoryPages = Math.ceil(filteredHistory.length / ITEMS_PER_PAGE);
  const paginatedHistory = filteredHistory.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const renderPagination = (totalPages, label) => {
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
    <DashboardLayout title="Goods Receipt">
      {error && (
        <div style={{ padding: "12px 16px", background: "var(--status-danger-bg)", border: "1.5px solid var(--status-danger-border)", color: "var(--status-danger-text)", borderRadius: "8px", marginBottom: "20px", fontSize: "13px", fontWeight: 600, display: "flex", alignItems: "center", gap: "6px" }}>
          <AlertTriangle size={14} /> {error}
        </div>
      )}

      {success && (
        <div style={{ padding: "12px 16px", background: "var(--status-success-bg)", border: "1.5px solid var(--status-success-border)", color: "var(--status-success-text)", borderRadius: "8px", marginBottom: "20px", fontSize: "13px", fontWeight: 600, display: "flex", alignItems: "center", gap: "6px" }}>
          <Check size={14} /> {success}
        </div>
      )}

      {/* Dynamic Tab Navigation */}
      {/* Dynamic Tab Navigation */}
      <div className="scrollable-tabs" style={{ display: "flex", gap: "10px", marginBottom: "20px", borderBottom: "2px solid #E2E8F0", paddingBottom: "10px", width: "100%", overflowX: "auto", whiteSpace: "nowrap", WebkitOverflowScrolling: "touch" }}>
        {[
          { id: "history", label: "Goods Receipt History" },
          { id: "pending", label: "Pending Delivery Tracking" },
          { id: "retur", label: "Retur to Vendor Logs" },
          { id: "items_log", label: "Received Items Log" }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => { setActiveTab(tab.id); setSearchQuery(""); }}
            style={{
              padding: "10px 20px",
              borderRadius: "8px",
              border: "none",
              background: activeTab === tab.id ? "#2C4FDB" : "transparent",
              color: activeTab === tab.id ? "#fff" : "#6B7280",
              fontWeight: 700,
              fontSize: "13px",
              cursor: "pointer",
              transition: "all 0.2s",
              flexShrink: 0
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Header controls with Filters */}
      <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", gap: "12px", marginBottom: "20px", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", background: "var(--input-bg)", border: "1.5px solid var(--border-color)", borderRadius: "8px", padding: "8px 12px", flex: 1, minWidth: "240px", gap: "8px" }}>
          <Search size={14} style={{ color: "var(--text-muted)" }} />
          <input 
            placeholder="Search GR, vendor, or product..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ border: "none", outline: "none", fontSize: "13px", width: "100%", background: "transparent", color: "var(--text-main)" }} 
          />
        </div>

        {/* Temporal Filters */}
        <div className="date-range-picker">
          <input 
            type="date" 
            value={startDate} 
            onChange={(e) => setStartDate(e.target.value)}
            style={{ padding: "8px 12px", borderRadius: "8px", border: "1.5px solid var(--border-color)", fontSize: "12px", background: "var(--input-bg)", color: "var(--text-main)" }} 
          />
          <span style={{ fontSize: "12px", color: "var(--text-muted)", fontWeight: "bold" }}>to</span>
          <input 
            type="date" 
            value={endDate} 
            onChange={(e) => setEndDate(e.target.value)}
            style={{ padding: "8px 12px", borderRadius: "8px", border: "1.5px solid var(--border-color)", fontSize: "12px", background: "var(--input-bg)", color: "var(--text-main)" }} 
          />
          {(startDate || endDate) && (
            <button 
              onClick={() => { setStartDate(""); setEndDate(""); }}
              style={{ padding: "8px 12px", borderRadius: "8px", border: "none", background: "#FEE2E2", color: "#991B1B", fontSize: "12px", fontWeight: "bold", cursor: "pointer" }}
            >
              Clear Date
            </button>
          )}
        </div>

        {(activeTab === "history" || activeTab === "pending") && (
          <select 
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            style={{ padding: "8px 12px", borderRadius: "8px", border: "1.5px solid var(--border-color)", fontSize: "13px", background: "var(--input-bg)", color: "var(--text-main)" }}
          >
            <option>All Status</option>
            <option>Pending QC</option>
            <option>Partial</option>
            <option>Completed</option>
            <option>Rejected</option>
          </select>
        )}

        <button
          onClick={() => setShowNewForm(true)}
          style={{ padding: "10px 20px", borderRadius: "8px", border: "none", background: "#10B981", color: "#fff", fontSize: "13px", fontWeight: 700, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "6px" }}
        >
          <Plus size={14} /> New Receipt
        </button>
      </div>

      {/* New Goods Receipt Form Modal Overlay */}
      {showNewForm && (
        <div style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", background: "rgba(15, 23, 42, 0.6)", backdropFilter: "blur(4px)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1000, padding: "20px", boxSizing: "border-box" }}>
          <div style={{ background: "var(--modal-bg)", borderRadius: "12px", width: "100%", maxWidth: "700px", border: "1.5px solid var(--border-color)", boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.3), 0 8px 10px -6px rgba(0, 0, 0, 0.3)", overflow: "hidden", display: "flex", flexDirection: "column", maxHeight: "90vh" }}>
            <div style={{ padding: "18px 24px", borderBottom: "1px solid var(--border-color)", display: "flex", alignItems: "center", justifyContent: "space-between", background: "var(--table-header-bg)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#2C4FDB", display: "inline-block" }}></span>
                <span style={{ fontWeight: 800, fontSize: "15px", color: "var(--text-main)" }}>Buat Goods Receipt Baru</span>
              </div>
              <button onClick={() => setShowNewForm(false)} style={{ background: "none", border: "none", display: "flex", alignItems: "center", justifyContent: "center" }}><X size={16} /></button>
            </div>

            <form onSubmit={handleSubmit} style={{ padding: "24px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "16px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "16px" }}>
                <div>
                  <label style={{ fontSize: "12px", fontWeight: 700, color: "var(--text-muted)", display: "block", marginBottom: "6px" }}>Tanggal Penerimaan</label>
                  <input 
                    type="date" 
                    value={receiptDate} 
                    onChange={(e) => setReceiptDate(e.target.value)}
                    style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1.5px solid var(--border-color)", fontSize: "13px", boxSizing: "border-box", background: "var(--input-bg)", color: "var(--text-main)" }} 
                    required
                  />
                </div>
                <div>
                  <label style={{ fontSize: "12px", fontWeight: 700, color: "var(--text-muted)", display: "block", marginBottom: "6px" }}>Tipe Penerimaan</label>
                  <select 
                    value={receiptType}
                    onChange={(e) => setReceiptType(e.target.value)}
                    style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1.5px solid var(--border-color)", fontSize: "13px", boxSizing: "border-box", background: "var(--input-bg)", color: "var(--text-main)" }}
                  >
                    <option value="good_receipt">Good Receipt</option>
                    <option value="pending_order">Pending Order</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: "12px", fontWeight: 700, color: "var(--text-muted)", display: "block", marginBottom: "6px" }}>Vendor Supplier</label>
                  <select 
                    value={vendorId} 
                    onChange={(e) => {
                      setVendorId(e.target.value);
                      setFormItems([{ product_id: "", qty_received: "" }]);
                    }}
                    className="vendor-select"
                    style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1.5px solid var(--border-color)", fontSize: "13px", boxSizing: "border-box", background: "var(--input-bg)", color: "var(--text-main)" }}
                    required
                  >
                    <option value="">Pilih Vendor...</option>
                    {vendors.map(v => (
                      <option key={v.vendor_id} value={v.vendor_id}>{v.vendor_name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: "12px", fontWeight: 700, color: "var(--text-muted)", display: "block", marginBottom: "6px" }}>Gudang Penerima</label>
                  <select 
                    value={warehouseId} 
                    onChange={(e) => setWarehouseId(e.target.value)}
                    className="warehouse-select"
                    style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1.5px solid var(--border-color)", fontSize: "13px", boxSizing: "border-box", background: "var(--input-bg)", color: "var(--text-main)" }}
                    required
                  >
                    <option value="">Pilih Gudang...</option>
                    {warehouses.map(w => (
                      <option key={w.warehouse_id} value={w.warehouse_id}>{w.warehouse_name}</option>
                    ))}
                  </select>
                </div>
                {currentUser.warehouse_id && parseInt(warehouseId) !== parseInt(currentUser.warehouse_id) && (
                  <div style={{ gridColumn: "1 / -1", padding: "12px 16px", borderRadius: "8px", background: "rgba(239, 68, 68, 0.1)", border: "1.5px solid #EF4444", color: "#EF4444", fontSize: "13px", fontWeight: "600", display: "flex", alignItems: "center", gap: "8px" }}>
                    <AlertTriangle size={14} />
                    <span>Anda tidak memiliki otoritas akses untuk memproses transaksi di warehouse ini.</span>
                  </div>
                )}
                <div>
                  <label style={{ fontSize: "12px", fontWeight: 700, color: "var(--text-muted)", display: "block", marginBottom: "6px" }}>Kode PO</label>
                  <input 
                    type="text"
                    placeholder="Contoh: PO-2026-0001"
                    value={poNumber} 
                    onChange={(e) => setPoNumber(e.target.value)}
                    style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1.5px solid var(--border-color)", fontSize: "13px", boxSizing: "border-box", background: "var(--input-bg)", color: "var(--text-main)" }} 
                  />
                </div>
                <div style={{ gridColumn: "1 / -1" }}>
                  <label style={{ fontSize: "12px", fontWeight: 700, color: "var(--text-muted)", display: "block", marginBottom: "6px" }}>Catatan Tambahan</label>
                  <textarea 
                    placeholder="Catatan tambahan..." 
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1.5px solid var(--border-color)", fontSize: "13px", boxSizing: "border-box", minHeight: "60px", resize: "vertical", background: "var(--input-bg)", color: "var(--text-main)" }} 
                  />
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "8px" }}>
                <span style={{ fontWeight: 800, fontSize: "13px", color: "var(--text-main)" }}>Daftar Barang Diterima</span>
                <button 
                  type="button" 
                  onClick={handleAddItem}
                  style={{ padding: "5px 12px", borderRadius: "8px", border: "1.5px solid #2C4FDB", background: "var(--card-bg)", color: "#2C4FDB", fontSize: "12px", fontWeight: 700, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "4px" }}
                >
                  <Plus size={12} /> Tambah Item Barang
                </button>
              </div>
              
              <div style={{ border: "1.5px solid var(--border-color)", borderRadius: "8px", overflow: "auto", maxHeight: "220px", minHeight: "130px", flexShrink: 0 }}>
                <table style={{ width: "100%", minWidth: "600px", borderCollapse: "collapse", fontSize: "13px" }}>
                  <thead>
                    <tr>
                      {["No", "Nama Produk", "Kode Vendor", "Jumlah Diterima", "Aksi"].map((h) => (
                        <th key={h} style={{ textAlign: "left", padding: "10px 14px", background: "var(--table-header-bg)", fontSize: "11px", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", borderBottom: "1px solid var(--border-color)" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {formItems.map((item, index) => (
                      <tr key={index} style={{ borderBottom: "1px solid var(--border-color)" }}>
                        <td style={{ padding: "10px 14px", color: "var(--text-main)" }}>{index + 1}</td>
                        <td style={{ padding: "10px 14px" }}>
                          <select 
                            value={item.product_id}
                            onChange={(e) => handleItemChange(index, "product_id", e.target.value)}
                            className="product-select"
                            style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1.5px solid var(--border-color)", background: "var(--input-bg)", color: "var(--text-main)" }}
                            required
                          >
                            <option value="">Pilih Produk...</option>
                            {products.map(p => (
                              <option key={p.product_id} value={p.product_id}>
                                {p.product_name || "Unknown Product"} ({p.unit || "pcs"})
                              </option>
                            ))}
                          </select>
                        </td>
                        <td style={{ padding: "10px 14px" }}>
                          <input 
                            placeholder="Kode Vendor..." 
                            value={item.vendor_product_code || ""} 
                            onChange={(e) => handleItemChange(index, "vendor_product_code", e.target.value)}
                            style={{ width: "120px", padding: "5px 8px", border: "1.5px solid var(--border-color)", borderRadius: "6px", fontSize: "12px", background: "var(--input-bg)", color: "var(--text-main)" }} 
                            required
                          />
                        </td>
                        <td style={{ padding: "10px 14px" }}>
                          <input 
                            type="number" 
                            value={item.qty_received} 
                            onChange={(e) => handleItemChange(index, "qty_received", e.target.value)}
                            style={{ width: "90px", padding: "5px 8px", border: "1.5px solid var(--border-color)", borderRadius: "6px", fontSize: "12px", background: "var(--input-bg)", color: "var(--text-main)" }} 
                            min="1"
                            step="1"
                            required
                          />
                        </td>
                        <td style={{ padding: "10px 14px" }}>
                          <button 
                            type="button" 
                            onClick={() => handleRemoveItem(index)}
                            style={{ padding: "4px 10px", borderRadius: "6px", border: "1.5px solid rgba(239, 68, 68, 0.3)", background: "rgba(239, 68, 68, 0.15)", color: "#EF4444", fontSize: "12px", cursor: "pointer", fontWeight: 700, display: "inline-flex", alignItems: "center", gap: "4px", transition: "all 0.2s" }}
                          >
                            <X size={12} /> Hapus
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "12px", borderTop: "1px solid var(--border-color)", paddingTop: "16px" }}>
                <button type="button" onClick={() => setShowNewForm(false)} style={{ padding: "8px 20px", borderRadius: "8px", border: "1.5px solid var(--border-color)", background: "var(--card-bg)", color: "var(--text-main)", fontSize: "13px", fontWeight: 600, cursor: "pointer" }}>Batal</button>
                 <button type="submit" disabled={loading || (currentUser.warehouse_id && parseInt(warehouseId) !== parseInt(currentUser.warehouse_id))} style={{ padding: "8px 20px", borderRadius: "8px", border: "none", background: "#2C4FDB", color: "#fff", fontSize: "13px", fontWeight: 600, cursor: "pointer", opacity: (loading || (currentUser.warehouse_id && parseInt(warehouseId) !== parseInt(currentUser.warehouse_id))) ? 0.7 : 1 }}>
                  {loading ? "Menyimpan..." : "Simpan Penerimaan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Tables Display */}
      <div style={{ background: "var(--card-bg)", borderRadius: "12px", border: "1px solid var(--border-color)", color: "var(--text-main)", overflow: "hidden" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 20px", borderBottom: "1px solid var(--border-color)", background: "var(--table-header-bg)" }}>
          <span style={{ fontWeight: 800, fontSize: "14px", color: "var(--text-main)" }}>
            {activeTab === "history" && "Goods Receipt History Logs"}
            {activeTab === "pending" && "Pending QC / Partial Delivery List"}
            {activeTab === "retur" && "Return to Vendor Logs"}
            {activeTab === "items_log" && "Aggregated Received Items Log"}
          </span>
          <span style={{ fontSize: "12px", color: "var(--text-muted)", fontWeight: "bold" }}>
            Total: {activeTab === "items_log" || activeTab === "history" || activeTab === "pending" ? getFilteredHistory().length : getFilteredReturns().length} records
          </span>
        </div>
        
        {activeTab === "retur" ? (
          <>
            <div className="table-wrap">
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                <thead>
                  <tr style={{ background: "var(--table-header-bg)" }}>
                    {["Return Date", "Kode PO", "Vendor Name", "Product Name", "Qty Returned", "Reason", "Returned By", "Status"].map((h) => (
                      <th key={h} style={{ 
                        textAlign: h === "Qty Returned" ? "center" : "left", 
                        padding: "12px 20px", 
                        fontSize: "11px", 
                        fontWeight: 700, 
                        color: "var(--text-muted)", 
                        textTransform: "uppercase", 
                        borderBottom: "1px solid var(--border-color)" 
                      }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {paginatedReturns.length === 0 ? (
                    <tr>
                      <td colSpan="8" style={{ padding: "24px", textAlign: "center", color: "var(--text-muted)" }}>Tidak ada riwayat retur barang.</td>
                    </tr>
                  ) : (
                    paginatedReturns.map((row) => {
                      const formattedDate = new Date(row.return_date).toLocaleDateString("id-ID", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric"
                      });
                      return (
                        <tr key={row.return_id} style={{ borderBottom: "1px solid var(--border-color)" }}>
                          <td style={{ padding: "12px 20px", color: "var(--text-muted)" }}>{formattedDate}</td>
                          <td style={{ padding: "12px 20px", fontWeight: 700, color: "var(--text-main)" }}>{row.goods_receipt_item?.goods_receipt?.purchase_order?.po_number || row.goods_receipt_item?.goods_receipt?.gr_number || "-"}</td>
                          <td style={{ padding: "12px 20px", color: "var(--text-main)" }}>{row.vendor?.vendor_name || "-"}</td>
                          <td style={{ padding: "12px 20px", fontWeight: 600, color: "var(--text-main)" }}>{row.product?.product_name}</td>
                          <td style={{ padding: "12px 20px", textAlign: "center", fontWeight: 700, color: "#EF4444" }}>{row.qty_returned} {row.product?.unit || "pcs"}</td>
                          <td style={{ padding: "12px 20px", color: "var(--text-muted)", fontStyle: "italic" }}>{row.reason || "-"}</td>
                          <td style={{ padding: "12px 20px", color: "var(--text-main)" }}>{row.returner?.name || "-"}</td>
                          <td style={{ padding: "12px 20px" }}>
                            <span style={{ background: "#FEE2E2", color: "#991B1B", padding: "3px 10px", borderRadius: "20px", fontSize: "11px", fontWeight: 700 }}>
                              Returned
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
            {renderPagination(totalReturnsPages, "Retur")}
          </>
        ) : activeTab === "items_log" ? (
          <>
            <div className="table-wrap">
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                <thead>
                  <tr style={{ background: "var(--table-header-bg)" }}>
                    {["Date", "Kode PO", "Vendor Supplier", "Warehouse Target", "Received Items Summary", "Action"].map((h) => (
                      <th key={h} style={{ 
                        textAlign: h === "Action" ? "center" : "left", 
                        padding: "12px 20px", 
                        fontSize: "11px", 
                        fontWeight: 700, 
                        color: "var(--text-muted)", 
                        textTransform: "uppercase", 
                        borderBottom: "1px solid var(--border-color)" 
                      }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {paginatedHistory.length === 0 ? (
                    <tr>
                      <td colSpan="6" style={{ padding: "24px", textAlign: "center", color: "var(--text-muted)" }}>Tidak ada riwayat item masuk.</td>
                    </tr>
                  ) : (
                    paginatedHistory.map((row) => {
                      const formattedDate = new Date(row.receipt_date).toLocaleDateString("id-ID", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric"
                      });
                      const itemsSummaryText = row.items?.map(it => `${it.product?.product_name || "Product"} (${it.qty_received} ${it.product?.unit || "pcs"})`).join(", ") || "-";
                      const isExpanded = !!expandedGRs[row.gr_id];
                      return (
                        <>
                          <tr key={row.gr_id} style={{ borderBottom: "1px solid var(--border-color)", background: isExpanded ? "var(--table-header-bg)" : "transparent" }}>
                            <td style={{ padding: "12px 20px", color: "var(--text-muted)" }}>{formattedDate}</td>
                            <td style={{ padding: "12px 20px", fontWeight: 700, color: "var(--text-main)" }}>{row.purchase_order?.po_number || row.gr_number}</td>
                            <td style={{ padding: "12px 20px", color: "var(--text-main)" }}>{row.vendor?.vendor_name || "-"}</td>
                            <td style={{ padding: "12px 20px", color: "var(--text-muted)" }}>{row.warehouse?.warehouse_name || "-"}</td>
                            <td style={{ padding: "12px 20px", color: "var(--text-main)", maxWidth: "260px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={itemsSummaryText}>
                              {itemsSummaryText}
                            </td>
                            <td style={{ padding: "12px 20px", textAlign: "center" }}>
                              <button 
                                onClick={() => toggleExpandGR(row.gr_id)}
                                style={{ 
                                  padding: "5px 12px", 
                                  borderRadius: "6px", 
                                  border: "1.5px solid var(--border-color)", 
                                  background: "var(--card-bg)", 
                                  color: "var(--text-main)", 
                                  fontSize: "11px", 
                                  fontWeight: 700, 
                                  cursor: "pointer",
                                  transition: "all 0.2s",
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: "4px"
                                }}
                              >
                                {isExpanded ? <><ChevronUp size={12} /> Hide Items</> : <><ChevronDown size={12} /> View Items ({row.items?.length || 0})</>}
                              </button>
                            </td>
                          </tr>
                          {isExpanded && (
                            <tr key={`${row.gr_id}-expanded`}>
                              <td colSpan="6" style={{ padding: "12px 24px", background: "var(--table-header-bg)", borderBottom: "1px solid var(--border-color)" }}>
                                <div style={{ padding: "16px", background: "var(--card-bg)", borderRadius: "8px", border: "1px solid var(--border-color)", boxShadow: "inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)", overflowX: "auto" }}>
                                  <strong style={{ fontSize: "11px", color: "var(--text-muted)", display: "inline-flex", alignItems: "center", gap: "6px", marginBottom: "8px", textTransform: "uppercase" }}>
                                    <ClipboardList size={14} /> Detail Received Items for {row.purchase_order?.po_number || row.gr_number}
                                  </strong>
                                  <table style={{ width: "100%", minWidth: "600px", borderCollapse: "collapse", fontSize: "12px" }}>
                                    <thead>
                                      <tr style={{ borderBottom: "1.5px solid var(--border-color)" }}>
                                        <th style={{ padding: "6px 12px", textAlign: "left", color: "var(--text-muted)" }}>Internal Code</th>
                                        <th style={{ padding: "6px 12px", textAlign: "left", color: "var(--text-muted)" }}>Product Name</th>
                                        <th style={{ padding: "6px 12px", textAlign: "center", color: "var(--text-muted)" }}>Qty Received</th>
                                        <th style={{ padding: "6px 12px", textAlign: "center", color: "var(--text-muted)" }}>Rejection Qty</th>
                                        <th style={{ padding: "6px 12px", textAlign: "center", color: "var(--text-muted)" }}>QC Status</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {row.items?.map((it, i) => (
                                        <tr key={i} style={{ borderBottom: "1px solid var(--border-color)" }}>
                                          <td style={{ padding: "6px 12px" }}><span style={{ background: "var(--table-header-bg)", padding: "2px 6px", borderRadius: "4px", fontSize: "11px", fontFamily: "monospace", color: "var(--text-muted)" }}>{it.product?.internal_code || "-"}</span></td>
                                          <td style={{ padding: "6px 12px", fontWeight: 700, color: "var(--text-main)" }}>{it.product?.product_name}</td>
                                          <td style={{ padding: "6px 12px", textAlign: "center", fontWeight: 700, color: "#10B981" }}>{it.qty_received} {it.product?.unit || "pcs"}</td>
                                          <td style={{ padding: "6px 12px", textAlign: "center", fontWeight: 700, color: (it.qty_rejected ?? 0) > 0 ? "#EF4444" : "var(--text-muted)" }}>{it.qty_rejected ?? 0} {it.product?.unit || "pcs"}</td>
                                          <td style={{ padding: "6px 12px", textAlign: "center" }}>
                                            <span style={{ 
                                              background: getStatusBadge(it.qc_status).color,
                                              color: getStatusBadge(it.qc_status).text,
                                              border: `1.5px solid ${getStatusBadge(it.qc_status).border}`,
                                              padding: "3px 10px", 
                                              borderRadius: "20px", 
                                              fontSize: "11px", 
                                              fontWeight: 700,
                                              display: "inline-flex",
                                              alignItems: "center",
                                              gap: "4px"
                                            }}>
                                              {getStatusBadge(it.qc_status).icon} {getStatusBadge(it.qc_status).label}
                                            </span>
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              </td>
                            </tr>
                          )}
                        </>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
            {renderPagination(totalHistoryPages, "Item Masuk")}
          </>
        ) : (
          <>
            <div className="table-wrap">
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                <thead>
                  <tr style={{ background: "var(--table-header-bg)" }}>
                    {["Kode PO", "Date", "Vendor", "Warehouse", "Items / Total Qty", "Received By", "QC Status", "Aksi"].map((h) => (
                      <th key={h} style={{ 
                        textAlign: h === "QC Status" || h === "Aksi" ? "center" : "left", 
                        padding: "12px 20px", 
                        fontSize: "11px", 
                        fontWeight: 700, 
                        color: "var(--text-muted)", 
                        textTransform: "uppercase", 
                        borderBottom: "1px solid var(--border-color)" 
                      }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {paginatedHistory.length === 0 ? (
                    <tr>
                      <td colSpan="8" style={{ padding: "24px", textAlign: "center", color: "var(--text-muted)" }}>Tidak ada riwayat goods receipt.</td>
                    </tr>
                  ) : (
                    paginatedHistory.map((row) => {
                      const status = getGRStatus(row);
                      const badge = getStatusBadge(status);
                      const formattedDate = new Date(row.receipt_date).toLocaleDateString("id-ID", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric"
                      });

                      return (
                        <tr key={row.gr_id} style={{ borderBottom: "1px solid var(--border-color)" }}>
                          <td style={{ padding: "12px 20px", fontWeight: 700, color: "var(--text-main)" }}>{row.purchase_order?.po_number || row.gr_number}</td>
                          <td style={{ padding: "12px 20px", color: "var(--text-muted)" }}>{formattedDate}</td>
                          <td style={{ padding: "12px 20px", color: "var(--text-main)" }}>{row.vendor ? row.vendor.vendor_name : "-"}</td>
                          <td style={{ padding: "12px 20px", color: "var(--text-muted)" }}>{row.warehouse ? row.warehouse.warehouse_name : "-"}</td>
                          <td style={{ padding: "12px 20px", color: "var(--text-main)" }}>
                            <span style={{ fontWeight: 700 }}>{row.items ? row.items.length : 0}</span>
                            <span style={{ color: "var(--text-muted)", fontSize: "11px" }}> items</span>
                            <span style={{ color: "#10B981", fontWeight: 700, marginLeft: "6px" }}>({getTotalQty(row.items)})</span>
                          </td>
                          <td style={{ padding: "12px 20px", color: "var(--text-main)" }}>{row.receiver ? row.receiver.name : "-"}</td>
                          <td style={{ padding: "12px 20px", textAlign: "center" }}>
                            <span style={{ 
                              background: badge.color, 
                              color: badge.text, 
                              border: `1.5px solid ${badge.border}`,
                              padding: "3px 10px", 
                              borderRadius: "20px", 
                              fontSize: "11px", 
                              fontWeight: 700, 
                              display: "inline-flex", 
                              alignItems: "center",
                              gap: "4px"
                            }}>
                              {badge.icon} {status}
                            </span>
                          </td>
                          <td style={{ padding: "12px 20px" }}>
                            <div style={{ display: "flex", gap: "6px", justifyContent: "center" }}>
                              {currentUser.role !== "pic" && (
                                <button onClick={() => handleOpenEdit(row)} style={{ padding: "4px 8px", borderRadius: "6px", border: "1.5px solid rgba(44, 79, 219, 0.3)", background: "rgba(44, 79, 219, 0.1)", color: "#2C4FDB", fontSize: "12px", cursor: "pointer", fontWeight: 700, display: "inline-flex", alignItems: "center", justifyContent: "center", transition: "all 0.2s" }} title="Edit"><Edit2 size={12} /></button>
                              )}
                              <button onClick={() => handleExportPDF(row)} style={{ padding: "4px 8px", borderRadius: "6px", border: "1.5px solid rgba(16, 185, 129, 0.3)", background: "rgba(16, 185, 129, 0.1)", color: "#10B981", fontSize: "12px", cursor: "pointer", fontWeight: 700, display: "inline-flex", alignItems: "center", justifyContent: "center", transition: "all 0.2s" }} title="Export PDF"><FileText size={12} /></button>
                              {currentUser.role !== "pic" && (
                                <button onClick={() => handleDeleteGR(row.gr_id)} style={{ padding: "4px 8px", borderRadius: "6px", border: "1.5px solid rgba(239, 68, 68, 0.3)", background: "rgba(239, 68, 68, 0.15)", color: "#EF4444", fontSize: "12px", cursor: "pointer", fontWeight: 700, display: "inline-flex", alignItems: "center", justifyContent: "center", transition: "all 0.2s" }} title="Delete"><Trash2 size={12} /></button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
            {renderPagination(totalHistoryPages, "Goods Receipt")}
          </>
        )}
      </div>

      {/* Edit GR Modal */}
      {editingGR && (
        <div style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", background: "rgba(15, 23, 42, 0.6)", backdropFilter: "blur(4px)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1000, padding: "20px", boxSizing: "border-box" }}>
          <div style={{ background: "var(--modal-bg)", borderRadius: "12px", width: "100%", maxWidth: "500px", border: "1.5px solid var(--border-color)", overflow: "hidden", display: "flex", flexDirection: "column", maxHeight: "90vh" }}>
            <div style={{ padding: "18px 24px", borderBottom: "1px solid var(--border-color)", display: "flex", alignItems: "center", justifyContent: "space-between", background: "var(--table-header-bg)" }}>
              <span style={{ fontWeight: 800, fontSize: "15px", color: "var(--text-main)" }}>Edit Goods Receipt: {editingGR.gr_number}</span>
              <button onClick={() => setEditingGR(null)} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><X size={16} /></button>
            </div>
            <form onSubmit={handleEditSubmit} style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "16px", overflowY: "auto" }}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px" }}>
                <div>
                  <label style={{ fontSize: "12px", fontWeight: 700, color: "var(--text-muted)", display: "block", marginBottom: "6px" }}>Tanggal Penerimaan</label>
                  <input type="date" value={editReceiptDate} onChange={(e) => setEditReceiptDate(e.target.value)} style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1.5px solid var(--border-color)", fontSize: "13px", boxSizing: "border-box", background: "var(--input-bg)", color: "var(--text-main)" }} required />
                </div>
                <div>
                  <label style={{ fontSize: "12px", fontWeight: 700, color: "var(--text-muted)", display: "block", marginBottom: "6px" }}>Tipe Penerimaan</label>
                  <select value={editReceiptType} onChange={(e) => setEditReceiptType(e.target.value)} style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1.5px solid var(--border-color)", fontSize: "13px", boxSizing: "border-box", background: "var(--input-bg)", color: "var(--text-main)" }}>
                    <option value="good_receipt">Good Receipt</option>
                    <option value="pending_order">Pending Order</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: "12px", fontWeight: 700, color: "var(--text-muted)", display: "block", marginBottom: "6px" }}>Vendor</label>
                  <select value={editVendorId} onChange={(e) => setEditVendorId(e.target.value)} style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1.5px solid var(--border-color)", fontSize: "13px", boxSizing: "border-box", background: "var(--input-bg)", color: "var(--text-main)" }} required>
                    {vendors.map(v => (<option key={v.vendor_id} value={v.vendor_id}>{v.vendor_name}</option>))}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: "12px", fontWeight: 700, color: "var(--text-muted)", display: "block", marginBottom: "6px" }}>Gudang</label>
                  <select value={editWarehouseId} onChange={(e) => setEditWarehouseId(e.target.value)} style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1.5px solid var(--border-color)", fontSize: "13px", boxSizing: "border-box", background: "var(--input-bg)", color: "var(--text-main)" }} required>
                    {warehouses.map(w => (<option key={w.warehouse_id} value={w.warehouse_id}>{w.warehouse_name}</option>))}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: "12px", fontWeight: 700, color: "var(--text-muted)", display: "block", marginBottom: "6px" }}>Kode PO</label>
                  <input 
                    type="text" 
                    placeholder="Contoh: PO-2026-0001" 
                    value={editPoNumber} 
                    onChange={(e) => setEditPoNumber(e.target.value)} 
                    style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1.5px solid var(--border-color)", fontSize: "13px", boxSizing: "border-box", background: "var(--input-bg)", color: "var(--text-main)" }} 
                  />
                </div>
                {currentUser.warehouse_id && parseInt(editWarehouseId) !== parseInt(currentUser.warehouse_id) && (
                  <div style={{ gridColumn: "1 / -1", padding: "12px 16px", borderRadius: "8px", background: "rgba(239, 68, 68, 0.1)", border: "1.5px solid #EF4444", color: "#EF4444", fontSize: "13px", fontWeight: "600", display: "flex", alignItems: "center", gap: "8px" }}>
                    <AlertTriangle size={14} />
                    <span>Anda tidak memiliki otoritas akses untuk memproses transaksi di warehouse ini.</span>
                  </div>
                )}
                <div style={{ gridColumn: "1 / -1" }}>
                  <label style={{ fontSize: "12px", fontWeight: 700, color: "var(--text-muted)", display: "block", marginBottom: "6px" }}>Catatan</label>
                  <textarea value={editNotes} onChange={(e) => setEditNotes(e.target.value)} style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1.5px solid var(--border-color)", fontSize: "13px", boxSizing: "border-box", minHeight: "60px", resize: "vertical", background: "var(--input-bg)", color: "var(--text-main)" }} />
                </div>
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", borderTop: "1px solid var(--border-color)", paddingTop: "16px" }}>
                <button 
                  type="button" 
                  onClick={(e) => {
                    const btn = e.currentTarget;
                    const originalText = btn.innerHTML;
                    btn.innerHTML = "Generating...";
                    btn.disabled = true;
                    setTimeout(() => {
                      handleExportPDF(editingGR);
                      btn.innerHTML = originalText;
                      btn.disabled = false;
                    }, 400);
                  }} 
                  style={{ padding: "8px 20px", borderRadius: "8px", border: "1.5px solid var(--border-color)", background: "var(--card-bg)", color: "var(--text-main)", fontSize: "13px", fontWeight: 600, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "4px" }}
                >
                  <FileText size={14} /> Export PDF
                </button>
                <button type="button" onClick={() => setEditingGR(null)} style={{ padding: "8px 20px", borderRadius: "8px", border: "1.5px solid var(--border-color)", background: "var(--card-bg)", color: "var(--text-main)", fontSize: "13px", fontWeight: 600, cursor: "pointer" }}>Batal</button>
                <button type="submit" disabled={loading || (currentUser.warehouse_id && parseInt(editWarehouseId) !== parseInt(currentUser.warehouse_id))} style={{ padding: "8px 20px", borderRadius: "8px", border: "none", background: "#2C4FDB", color: "#fff", fontSize: "13px", fontWeight: 600, cursor: "pointer", opacity: (loading || (currentUser.warehouse_id && parseInt(editWarehouseId) !== parseInt(currentUser.warehouse_id))) ? 0.7 : 1 }}>{loading ? "Menyimpan..." : "Simpan Perubahan"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

export default GoodsReceiptPage;