import { useState, useEffect } from "react";
import DashboardLayout from "../../layout/DashboardLayout";
import api from "../../services/api";
import authService from "../../services/authService";
import { exportStockOpnamePdf } from "../../utils/pdfExport";
import { 
  X, 
  Check, 
  ChevronLeft, 
  ChevronRight, 
  AlertTriangle, 
  Eye, 
  FileText,
  Clock 
} from "lucide-react";

function StockOpnamePage() {
  const [loading, setLoading] = useState(false);
  const [sessions, setSessions] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [products, setProducts] = useState([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [currentUser, setCurrentUser] = useState(null);

  // Active session count entries
  const [activeSession, setActiveSession] = useState(null);
  const [countItems, setCountItems] = useState([]); // Array of { product_id, name, code, category, system_qty, physical_qty, notes }

  // Start session form modal
  const [showStartModal, setShowStartModal] = useState(false);
  const [selectedWarehouseId, setSelectedWarehouseId] = useState("");
  const [opnameNotes, setOpnameNotes] = useState("");
  const [selectedDetail, setSelectedDetail] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Date range filters for history
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    setCurrentPage(1);
  }, [startDate, endDate]);

  useEffect(() => {
    document.title = "Stock Opname | Warehouse Management System";
    const user = authService.getCurrentUser();
    setCurrentUser(user);
    fetchData();
  }, []);

  const getAllowedWarehouses = () => {
    if (!currentUser) return [];
    if (currentUser.role === "Master") {
      return warehouses;
    }
    const userWhId = currentUser.warehouse_id ? parseInt(currentUser.warehouse_id) : null;
    return warehouses.filter(w => w.warehouse_id === userWhId);
  };

  const handleOpenStartModal = () => {
    const allowed = getAllowedWarehouses();
    if (allowed.length > 0) {
      setSelectedWarehouseId(allowed[0].warehouse_id);
    }
    setShowStartModal(true);
  };

  const handleExportPDF = async (session) => {
    try {
      setLoading(true);
      const res = await api.get(`/master/warehouse-signatures?warehouse_id=${session.warehouse_id}&document_type=stock_opname`);
      if (res.data && res.data.status === "success" && res.data.data) {
        exportStockOpnamePdf(session, res.data.data.columns);
      } else {
        exportStockOpnamePdf(session);
      }
    } catch (err) {
      console.error("Error fetching signature settings for PDF export:", err);
      exportStockOpnamePdf(session);
    } finally {
      setLoading(false);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    setError("");
    try {
      const loggedUser = authService.getCurrentUser();
      
      // 1. Fetch warehouses for new session trigger
      let whList = [];
      const whRes = await api.get("/master/warehouses");
      if (whRes.data && whRes.data.status === "success") {
        whList = whRes.data.data;
        setWarehouses(whList);
        
        const userWhId = loggedUser?.warehouse_id ? parseInt(loggedUser.warehouse_id) : null;
        if (loggedUser && loggedUser.role !== "Master" && userWhId) {
          setSelectedWarehouseId(userWhId);
        } else if (whList.length > 0) {
          setSelectedWarehouseId(whList[0].warehouse_id);
        }
      }

      // 2. Fetch all stock opname sessions
      let active = null;
      const res = await api.get("/stock-opname");
      if (res.data && res.data.status === "success") {
        const allSessions = res.data.data;
        setSessions(allSessions);

        // Find active draft or in-progress session
        active = allSessions.find(s => ["draft", "in_progress"].includes(s.status));
        setActiveSession(active || null);
      }

      // 3. Fetch products to get details (filtered by active warehouse if active session exists)
      let prodList = [];
      if (active) {
        const prodRes = await api.get(`/master/products?warehouse_id=${active.warehouse_id}&assigned_only=true`);
        if (prodRes.data && prodRes.data.status === "success") {
          prodList = prodRes.data.data;
          setProducts(prodList);
        }
        initCountSheet(active, prodList);
      } else {
        setProducts([]);
      }
    } catch (err) {
      console.error("Error loading Stock Opname data:", err);
      setError("Gagal memuat data Stock Opname.");
    } finally {
      setLoading(false);
    }
  };

  const initCountSheet = (session, prodList) => {
    if (!session) return;
    const currentProducts = prodList || products;
    
    // Map items from session items if they exist
    if (session.items && session.items.length > 0) {
      const itemsState = session.items.map(item => ({
        product_id: item.product_id,
        name: item.product ? item.product.product_name : "Product",
        code: item.product ? item.product.internal_code : "",
        category: item.product?.category ? item.product.category.category_name : "General",
        system_qty: item.system_qty,
        physical_qty: item.physical_qty !== null ? item.physical_qty : item.system_qty,
        notes: item.notes || ""
      }));
      setCountItems(itemsState);
    } else {
      // Initialize with all products in this warehouse
      const itemsState = currentProducts.map(p => {
        const stockEntry = p.stocks ? p.stocks.find(s => s.warehouse_id === session.warehouse_id) : null;
        return {
          product_id: p.product_id,
          name: p.product_name,
          code: p.internal_code,
          category: p.category ? p.category.category_name : "General",
          system_qty: stockEntry ? stockEntry.qty_available : 0,
          physical_qty: stockEntry ? stockEntry.qty_available : 0,
          notes: ""
        };
      });
      setCountItems(itemsState);
    }
  };

  const handlePhysicalQtyChange = (index, val) => {
    const updated = [...countItems];
    updated[index].physical_qty = parseFloat(val) || 0;
    setCountItems(updated);
  };

  const handleNotesChange = (index, val) => {
    const updated = [...countItems];
    updated[index].notes = val;
    setCountItems(updated);
  };

  const handleStartSession = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    if (!selectedWarehouseId) {
      setError("Silakan pilih gudang audit.");
      return;
    }

    try {
      setLoading(true);
      const payload = {
        warehouse_id: parseInt(selectedWarehouseId),
        notes: opnameNotes || "Scheduled Stock Audit"
      };

      const res = await api.post("/stock-opname/start", payload);
      if (res.data && res.data.status === "success") {
        setSuccess("Audit Stock Opname berhasil dimulai!");
        setShowStartModal(false);
        setOpnameNotes("");
        fetchData();
      }
    } catch (err) {
      console.error("Error starting opname:", err);
      if (err.response && err.response.data && err.response.data.message) {
        setError(err.response.data.message);
      } else {
        setError("Gagal memulai sesi Stock Opname.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitCounts = async (type) => {
    setError("");
    setSuccess("");
    if (!activeSession) return;

    try {
      setLoading(true);
      const payload = {
        items: countItems.map(item => ({
          product_id: item.product_id,
          physical_qty: item.physical_qty,
          notes: item.notes
        }))
      };

      const res = await api.post(`/stock-opname/${activeSession.opname_id}/count`, payload);
      if (res.data && res.data.status === "success") {
        setSuccess(type === "save" ? "Progress audit berhasil disimpan!" : "Audit stock opname berhasil dikirim untuk approval Master!");
        fetchData();
      }
    } catch (err) {
      console.error("Error submitting counts:", err);
      if (err.response && err.response.data && err.response.data.message) {
        setError(err.response.data.message);
      } else {
        setError("Gagal menyimpan data audit.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleApproveReconciliation = async (sessionId) => {
    setError("");
    setSuccess("");
    const notesInput = window.prompt("Apakah Anda yakin ingin menyetujui dan merekonsiliasi stock opname ini?\nMasukkan Catatan Rekonsiliasi / Approval Notes (Opsional):");
    if (notesInput === null) return; // User cancelled

    try {
      setLoading(true);
      const res = await api.post(`/stock-opname/${sessionId}/approve`, {
        notes: notesInput
      });
      if (res.data && res.data.status === "success") {
        setSuccess("Stock Opname berhasil disetujui! Level stock fisik telah direkonsiliasi.");
        fetchData();
      }
    } catch (err) {
      console.error("Error approving reconciliation:", err);
      if (err.response && err.response.data && err.response.data.message) {
        setError(err.response.data.message);
      } else {
        setError("Gagal menyetujui stock opname.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRejectReconciliation = async (sessionId) => {
    setError("");
    setSuccess("");
    const notesInput = window.prompt("Apakah Anda yakin ingin menolak laporan audit stock opname ini?\nMasukkan Alasan / Catatan Penolakan (Wajib):");
    if (notesInput === null) return; // User cancelled
    if (!notesInput.trim()) {
      alert("Alasan penolakan wajib diisi!");
      return;
    }

    try {
      setLoading(true);
      const res = await api.post(`/stock-opname/${sessionId}/reject`, {
        notes: notesInput
      });
      if (res.data && res.data.status === "success") {
        setSuccess("Laporan Stock Opname berhasil ditolak.");
        fetchData();
      }
    } catch (err) {
      console.error("Error rejecting reconciliation:", err);
      if (err.response && err.response.data && err.response.data.message) {
        setError(err.response.data.message);
      } else {
        setError("Gagal menolak stock opname.");
      }
    } finally {
      setLoading(false);
    }
  };

  const loadSessionDetail = async (id) => {
    setLoadingDetail(true);
    try {
      const res = await api.get(`/stock-opname/${id}`);
      if (res.data && res.data.status === "success") {
        setSelectedDetail(res.data.data);
      }
    } catch (err) {
      console.error("Error loading SO detail:", err);
      setError("Gagal memuat detail Stock Opname.");
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleExportPdfDirect = async (opnameId, event) => {
    const btn = event.currentTarget;
    const originalText = btn.innerHTML;
    btn.innerHTML = "...";
    btn.disabled = true;
    try {
      const res = await api.get(`/stock-opname/${opnameId}`);
      if (res.data && res.data.status === "success") {
        handleExportPDF(res.data.data);
      } else {
        alert("Gagal memuat data detail untuk PDF.");
      }
    } catch (err) {
      console.error(err);
      alert("Error memuat detail audit.");
    } finally {
      btn.innerHTML = originalText;
      btn.disabled = false;
    }
  };

  const getFilteredSessions = () => {
    let list = sessions;
    if (startDate) {
      list = list.filter(s => s.start_date >= startDate);
    }
    if (endDate) {
      list = list.filter(s => s.start_date <= endDate);
    }
    return list;
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "approved":
        return { bg: "var(--status-success-bg)", text: "var(--status-success-text)", border: "var(--status-success-border)", label: "Approved", icon: <Check size={12} /> };
      case "rejected":
        return { bg: "var(--status-danger-bg)", text: "var(--status-danger-text)", border: "var(--status-danger-border)", label: "Rejected", icon: <X size={12} /> };
      case "in_progress":
        return { bg: "var(--status-warning-bg)", text: "var(--status-warning-text)", border: "var(--status-warning-border)", label: "In Progress", icon: <Clock size={12} /> };
      case "completed":
        return { bg: "var(--status-info-bg)", text: "var(--status-info-text)", border: "var(--status-info-border)", label: "Pending Approval", icon: <Clock size={12} /> };
      default:
        return { bg: "var(--status-warning-bg)", text: "var(--status-warning-text)", border: "var(--status-warning-border)", label: "Draft", icon: <Clock size={12} /> };
    }
  };

  const isMaster = currentUser?.role === "Master";

  const ITEMS_PER_PAGE = 10;
  const filteredSessions = getFilteredSessions();
  const totalSessionsPages = Math.ceil(filteredSessions.length / ITEMS_PER_PAGE);
  const paginatedSessions = filteredSessions.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

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
    <DashboardLayout title="Stock Opname">
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

      {/* Active Session Banner */}
      {activeSession ? (
        <div style={{ background: "linear-gradient(135deg, #1B2E6B, #2C4FDB)", borderRadius: "14px", padding: "20px 24px", marginBottom: "20px", display: "flex", flexWrap: "wrap", gap: "16px", alignItems: "center", justifyContent: "space-between", color: "#fff" }}>
          <div>
            <div style={{ fontSize: "11px", opacity: 0.7, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "4px" }}>Active Audit Session</div>
            <div style={{ fontSize: "18px", fontWeight: 800 }}>{activeSession.notes || `SO-SESSION-${activeSession.opname_id}`}</div>
            <div style={{ fontSize: "12px", opacity: 0.7, marginTop: "4px" }}>
              Started: {new Date(activeSession.start_date).toLocaleDateString("id-ID")} · Warehouse: {activeSession.warehouse?.warehouse_name} · By: {activeSession.conductor?.name}
            </div>
          </div>
          <div style={{ display: "flex", gap: "10px" }}>
            <div style={{ textAlign: "center", background: "rgba(255,255,255,0.12)", padding: "12px 20px", borderRadius: "10px" }}>
              <div style={{ fontSize: "22px", fontWeight: 800, color: "#fff" }}>{countItems.length}</div>
              <div style={{ fontSize: "10px", opacity: 0.7 }}>Total SKUs</div>
            </div>
          </div>
        </div>
      ) : (
        <div style={{ background: "var(--table-header-bg)", border: "1.5px dashed var(--border-color)", borderRadius: "14px", padding: "24px", marginBottom: "20px", display: "flex", flexWrap: "wrap", gap: "16px", justifyContent: "space-between", alignItems: "center", color: "var(--text-main)" }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: "15px", color: "var(--text-main)", marginBottom: "4px" }}>No Active Stock Opname Session</div>
            <div style={{ fontSize: "13px", color: "var(--text-muted)" }}>Create a new audit session to verify inventory quantities on the shelves.</div>
            <div style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "8px", lineHeight: "1.6" }}>
              <strong>Alur Stock Opname:</strong> (1) Klik "+ Start Audit Session" → (2) Pilih gudang yang akan di-audit → (3) Sistem akan menampilkan seluruh produk di gudang tersebut beserta qty sistem → (4) Masukkan qty fisik hasil penghitungan nyata → (5) Submit laporan audit → (6) Master melakukan approval dan rekonsiliasi selisih.
            </div>
          </div>
          <button 
            onClick={handleOpenStartModal}
            style={{ padding: "10px 20px", borderRadius: "8px", border: "none", background: "#2C4FDB", color: "#fff", fontSize: "13px", fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap" }}
          >
            + Start Audit Session
          </button>
        </div>
      )}

      {/* Physical Count Entry */}
      {activeSession && (
        <div style={{ background: "var(--card-bg)", borderRadius: "12px", border: "1px solid var(--border-color)", marginBottom: "20px", color: "var(--text-main)" }}>
          <div style={{ padding: "14px 20px", borderBottom: "1px solid var(--border-color)", display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#2C4FDB", display: "inline-block" }}></span>
            <span style={{ fontWeight: 700, fontSize: "14px", color: "var(--text-main)" }}>Physical Count Entry</span>
          </div>
          <div style={{ padding: "16px 20px" }}>
            <div className="table-wrap">
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                <thead>
                  <tr>
                    {["Code", "Product Name", "Category", "System Qty", "Physical Qty", "Discrepancy", "Notes"].map((h) => (
                      <th key={h} style={{ 
                        textAlign: ["System Qty", "Physical Qty", "Discrepancy"].includes(h) ? "center" : "left", 
                        padding: "10px 14px", 
                        background: "var(--table-header-bg)", 
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
                  {countItems.map((item, i) => {
                    const diff = item.physical_qty - item.system_qty;
                    return (
                      <tr key={item.product_id} style={{ borderBottom: "1px solid var(--border-color)" }}>
                        <td style={{ padding: "10px 14px" }}><span style={{ background: "var(--table-header-bg)", border: "1px solid var(--border-color)", padding: "2px 6px", borderRadius: "4px", fontSize: "11px", fontFamily: "monospace", color: "var(--text-muted)" }}>{item.code}</span></td>
                        <td style={{ padding: "10px 14px", fontWeight: 600, color: "var(--text-main)" }}>{item.name}</td>
                        <td style={{ padding: "10px 14px", color: "var(--text-muted)" }}>{item.category}</td>
                        <td style={{ padding: "10px 14px", textAlign: "center", fontWeight: "bold", color: "var(--text-main)" }}>{item.system_qty}</td>
                        <td style={{ padding: "10px 14px", textAlign: "center" }}>
                          <input 
                            type="number" 
                            value={item.physical_qty} 
                            onChange={(e) => handlePhysicalQtyChange(i, e.target.value)}
                            style={{ width: "75px", padding: "5px 8px", border: "1.5px solid var(--border-color)", borderRadius: "6px", fontSize: "12px", textAlign: "center", background: "var(--input-bg)", color: "var(--text-main)" }} 
                            min="0"
                            step="any"
                          />
                        </td>
                        <td style={{ padding: "10px 14px", textAlign: "center" }}>
                          <span style={{ fontWeight: 700, color: diff === 0 ? "var(--text-muted)" : diff > 0 ? "#10B981" : "#EF4444" }}>
                            {diff > 0 ? `+${diff}` : diff}
                          </span>
                        </td>
                        <td style={{ padding: "10px 14px" }}>
                          <input 
                            type="text" 
                            placeholder="Note..." 
                            value={item.notes}
                            onChange={(e) => handleNotesChange(i, e.target.value)}
                            style={{ boxSizing: "border-box", width: "100%", minWidth: "150px", padding: "5px 8px", border: "1.5px solid var(--border-color)", borderRadius: "6px", fontSize: "12px", background: "var(--input-bg)", color: "var(--text-main)" }} 
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "16px" }}>
              <button onClick={() => handleSubmitCounts("save")} disabled={loading} style={{ padding: "8px 20px", borderRadius: "8px", border: "1.5px solid var(--border-color)", background: "var(--card-bg)", fontSize: "13px", fontWeight: 600, cursor: "pointer", color: "var(--text-main)" }}>Save Progress</button>
              <button onClick={() => handleSubmitCounts("submit")} disabled={loading} style={{ padding: "8px 20px", borderRadius: "8px", border: "none", background: "#2C4FDB", color: "#fff", fontSize: "13px", fontWeight: 600, cursor: "pointer" }}>Submit Audit Report</button>
            </div>
          </div>
        </div>
      )}

      {/* Opname History */}
      <div style={{ background: "var(--card-bg)", borderRadius: "12px", border: "1px solid var(--border-color)", color: "var(--text-main)" }}>
        <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border-color)", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px", background: "var(--table-header-bg)" }}>
          <span style={{ fontWeight: 800, fontSize: "14px", color: "var(--text-main)" }}>Opname History / Audit Logs</span>
          
          <div className="date-range-picker">
            <input 
              type="date" 
              value={startDate} 
              onChange={(e) => setStartDate(e.target.value)}
              style={{ padding: "6px 12px", borderRadius: "8px", border: "1.5px solid var(--border-color)", fontSize: "12px", background: "var(--input-bg)", color: "var(--text-main)" }} 
            />
            <span style={{ fontSize: "12px", color: "var(--text-muted)", fontWeight: "bold" }}>to</span>
            <input 
              type="date" 
              value={endDate} 
              onChange={(e) => setEndDate(e.target.value)}
              style={{ padding: "6px 12px", borderRadius: "8px", border: "1.5px solid var(--border-color)", fontSize: "12px", background: "var(--input-bg)", color: "var(--text-main)" }} 
            />
            {(startDate || endDate) && (
              <button 
                onClick={() => { setStartDate(""); setEndDate(""); }}
                style={{ padding: "6px 12px", borderRadius: "8px", border: "none", background: "#FEE2E2", color: "#991B1B", fontSize: "12px", fontWeight: "bold", cursor: "pointer" }}
              >
                Clear Date
              </button>
            )}
          </div>
        </div>
        <div className="table-wrap">
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
            <thead>
              <tr>
                {["Session ID", "Warehouse", "Start Date", "End Date", "Conducted By", "Reconciled By", "Status", "Action"].map((h) => (
                  <th key={h} style={{ 
                    textAlign: ["Start Date", "End Date", "Status", "Action"].includes(h) ? "center" : "left", 
                    padding: "10px 20px", 
                    background: "var(--table-header-bg)", 
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
              {paginatedSessions.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ padding: "20px", textAlign: "center", color: "var(--text-muted)" }}>Tidak ada riwayat stock opname.</td>
                </tr>
              ) : (
                paginatedSessions.map((row) => {
                  const badge = getStatusBadge(row.status);
                  const startFormatted = new Date(row.start_date).toLocaleDateString("id-ID");
                  const endFormatted = row.end_date ? new Date(row.end_date).toLocaleDateString("id-ID") : "-";

                  return (
                    <tr key={row.opname_id} style={{ borderBottom: "1px solid var(--border-color)" }}>
                      <td style={{ padding: "12px 20px", fontWeight: 700, color: "var(--text-main)" }}>SO-SESSION-{row.opname_id}</td>
                      <td style={{ padding: "12px 20px", color: "var(--text-main)" }}>{row.warehouse?.warehouse_name || "-"}</td>
                      <td style={{ padding: "12px 20px", textAlign: "center", color: "var(--text-muted)" }}>{startFormatted}</td>
                      <td style={{ padding: "12px 20px", textAlign: "center", color: "var(--text-muted)" }}>{endFormatted}</td>
                      <td style={{ padding: "12px 20px", color: "var(--text-main)" }}>{row.conductor?.name || "-"}</td>
                      <td style={{ padding: "12px 20px", color: "var(--text-main)" }}>{row.approver?.name || "-"}</td>
                      <td style={{ padding: "12px 20px", textAlign: "center" }}>
                        <span style={{ 
                          background: badge.bg, 
                          color: badge.text, 
                          border: `1.5px solid ${badge.border}`,
                          padding: "3px 10px", 
                          borderRadius: "20px", 
                          fontSize: "11px", 
                          fontWeight: 700, 
                          display: "inline-flex", 
                          alignItems: "center",
                          gap: "4px",
                          whiteSpace: "nowrap" 
                        }}>
                          {badge.icon} {badge.label}
                        </span>
                      </td>
                      <td style={{ padding: "12px 20px", textAlign: "center" }}>
                        <div style={{ display: "flex", gap: "6px", alignItems: "center", justifyContent: "center" }}>
                          <button
                            onClick={() => loadSessionDetail(row.opname_id)}
                            disabled={loadingDetail}
                            style={{ padding: "5px 10px", borderRadius: "6px", border: "1.5px solid var(--border-color)", background: "var(--card-bg)", color: "var(--text-main)", fontSize: "11px", fontWeight: 700, cursor: "pointer", transition: "all 0.2s", display: "inline-flex", alignItems: "center", gap: "4px" }}
                          >
                            <Eye size={12} /> Detail
                          </button>
                          <button
                            onClick={(e) => handleExportPdfDirect(row.opname_id, e)}
                            style={{ padding: "5px 10px", borderRadius: "6px", border: "1px solid #10B981", background: "transparent", color: "#10B981", fontSize: "11px", fontWeight: 700, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "4px" }}
                            title="Export PDF"
                          >
                            <FileText size={12} /> PDF
                          </button>
                          {isMaster && row.status === "completed" && (
                            <>
                              <button
                                onClick={() => handleApproveReconciliation(row.opname_id)}
                                style={{ padding: "5px 10px", borderRadius: "6px", border: "none", background: "#34D399", color: "#062F1E", fontSize: "11px", fontWeight: 700, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "4px" }}
                              >
                                <Check size={12} /> Approve
                              </button>
                              <button
                                onClick={() => handleRejectReconciliation(row.opname_id)}
                                style={{ padding: "5px 10px", borderRadius: "6px", border: "none", background: "#EF4444", color: "#FFF", fontSize: "11px", fontWeight: 700, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "4px" }}
                              >
                                <X size={12} /> Reject
                              </button>
                            </>
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
        {renderPagination(currentPage, setCurrentPage, totalSessionsPages, "Stock Opname Audit")}
      </div>

      {/* Start Session Modal */}
      {showStartModal && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.5)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1000 }}>
          <form onSubmit={handleStartSession} style={{ background: "var(--modal-bg)", borderRadius: "12px", width: "400px", border: "1px solid var(--border-color)", overflow: "hidden", color: "var(--text-main)" }}>
            <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border-color)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontWeight: 700, color: "var(--text-main)" }}>Start New Audit Session</span>
              <button type="button" onClick={() => setShowStartModal(false)} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><X size={16} /></button>
            </div>
            <div style={{ padding: "20px", fontSize: "13px", display: "flex", flexDirection: "column", gap: "12px", color: "var(--text-main)" }}>
              <div>
                <label style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-muted)", display: "block", marginBottom: "6px" }}>Select Warehouse</label>
                <select 
                  value={selectedWarehouseId} 
                  onChange={(e) => setSelectedWarehouseId(e.target.value)}
                  style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1.5px solid var(--border-color)", fontSize: "13px", boxSizing: "border-box", background: "var(--input-bg)", color: "var(--text-main)" }}
                  required
                >
                  {getAllowedWarehouses().map(w => (
                    <option key={w.warehouse_id} value={w.warehouse_id}>{w.warehouse_name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-muted)", display: "block", marginBottom: "6px" }}>Audit Title / Notes</label>
                <input 
                  placeholder="E.g., Akhir Bulan Mei 2026 Audit" 
                  value={opnameNotes} 
                  onChange={(e) => setOpnameNotes(e.target.value)}
                  style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1.5px solid var(--border-color)", fontSize: "13px", boxSizing: "border-box", background: "var(--input-bg)", color: "var(--text-main)" }}
                />
              </div>
            </div>
            <div style={{ padding: "12px 20px", background: "var(--table-header-bg)", borderTop: "1px solid var(--border-color)", display: "flex", justifyContent: "flex-end", gap: "10px" }}>
              <button type="button" onClick={() => setShowStartModal(false)} style={{ padding: "6px 16px", borderRadius: "8px", border: "1.5px solid var(--border-color)", background: "var(--card-bg)", cursor: "pointer", fontSize: "12px", fontWeight: 600, color: "var(--text-main)" }}>Batal</button>
              <button type="submit" disabled={loading} style={{ padding: "6px 16px", borderRadius: "8px", border: "none", background: "#2C4FDB", color: "#fff", cursor: "pointer", fontSize: "12px", fontWeight: 600, opacity: loading ? 0.7 : 1 }}>
                {loading ? "Starting..." : "Mulai Audit"}
              </button>
            </div>
          </form>
        </div>
      )}
      {/* View Detail Modal */}
      {selectedDetail && (
        <div style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", background: "rgba(15, 23, 42, 0.6)", backdropFilter: "blur(4px)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1000, padding: "20px", boxSizing: "border-box" }}>
          <div style={{ background: "var(--modal-bg)", borderRadius: "12px", width: "100%", maxWidth: "800px", border: "1.5px solid var(--border-color)", boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.3)", overflow: "hidden", display: "flex", flexDirection: "column", maxHeight: "90vh", color: "var(--text-main)" }}>
            <div style={{ padding: "18px 24px", borderBottom: "1px solid var(--border-color)", display: "flex", alignItems: "center", justifyContent: "space-between", background: "var(--table-header-bg)" }}>
              <span style={{ fontWeight: 800, fontSize: "15px", color: "var(--text-main)" }}>Detail Stock Opname: SO-SESSION-{selectedDetail.opname_id}</span>
              <button onClick={() => setSelectedDetail(null)} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><X size={16} /></button>
            </div>
            <div style={{ padding: "24px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "16px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "16px", background: "var(--table-header-bg)", padding: "16px", borderRadius: "8px", border: "1px solid var(--border-color)" }}>
                <div>
                  <div style={{ fontSize: "11px", color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase" }}>Warehouse</div>
                  <div style={{ fontSize: "14px", fontWeight: 700, marginTop: "2px" }}>{selectedDetail.warehouse?.warehouse_name}</div>
                </div>
                <div>
                  <div style={{ fontSize: "11px", color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase" }}>Status</div>
                  <div style={{ marginTop: "2px" }}>
                    <span style={{ 
                      background: getStatusBadge(selectedDetail.status).bg, 
                      color: getStatusBadge(selectedDetail.status).text, 
                      border: `1.5px solid ${getStatusBadge(selectedDetail.status).border}`,
                      padding: "2px 10px", 
                      borderRadius: "20px", 
                      fontSize: "11px", 
                      fontWeight: 700, 
                      whiteSpace: "nowrap", 
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "4px"
                    }}>
                      {getStatusBadge(selectedDetail.status).icon} {getStatusBadge(selectedDetail.status).label}
                    </span>
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: "11px", color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase" }}>Conducted By</div>
                  <div style={{ fontSize: "13px", fontWeight: 600, marginTop: "2px" }}>{selectedDetail.conductor?.name || "-"}</div>
                </div>
                <div>
                  <div style={{ fontSize: "11px", color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase" }}>Reconciled / Approved By</div>
                  <div style={{ fontSize: "13px", fontWeight: 600, marginTop: "2px" }}>{selectedDetail.approver?.name || "-"}</div>
                </div>
                <div style={{ gridColumn: "1 / -1" }}>
                  <div style={{ fontSize: "11px", color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase" }}>Audit Notes & Approval Logs</div>
                  <div style={{ fontSize: "13px", marginTop: "4px", color: "var(--text-main)", fontStyle: "italic", whiteSpace: "pre-line" }}>{selectedDetail.notes || "Tidak ada catatan."}</div>
                </div>
              </div>

              <div>
                <h4 style={{ margin: "0 0 10px 0", fontSize: "13px", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700 }}>Checked Items / Discrepancies</h4>
                <div className="table-wrap">
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
                    <thead>
                      <tr style={{ background: "var(--table-header-bg)" }}>
                        <th style={{ padding: "8px 10px", textAlign: "left", color: "var(--text-muted)" }}>Product</th>
                        <th style={{ padding: "8px 10px", textAlign: "left", color: "var(--text-muted)" }}>Category</th>
                        <th style={{ padding: "8px 10px", textAlign: "left", color: "var(--text-muted)" }}>Zone / Rack</th>
                        <th style={{ padding: "8px 10px", textAlign: "right", color: "var(--text-muted)" }}>System Qty</th>
                        <th style={{ padding: "8px 10px", textAlign: "right", color: "var(--text-muted)" }}>Physical Qty</th>
                        <th style={{ padding: "8px 10px", textAlign: "right", color: "var(--text-muted)" }}>Discrepancy</th>
                        <th style={{ padding: "8px 10px", textAlign: "left", color: "var(--text-muted)" }}>Item Notes</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedDetail.items?.map((it, i) => {
                        const disc = it.discrepancy;
                        const discColor = disc === 0 ? "var(--text-muted)" : disc > 0 ? "#10B981" : "#EF4444";
                        const discText = disc === 0 ? "0" : (disc > 0 ? `+${disc}` : `${disc}`);
                        const productStock = it.product?.stocks?.find(s => s.warehouse_id === selectedDetail.warehouse_id);
                        const zone = productStock?.zone || "A";
                        const rack = productStock?.rack || "01";
                        return (
                          <tr key={i} style={{ borderBottom: "1px solid var(--border-color)" }}>
                            <td style={{ padding: "8px 10px", color: "var(--text-main)", fontWeight: 700 }}>{it.product?.product_name}</td>
                            <td style={{ padding: "8px 10px", color: "var(--text-muted)" }}>{it.product?.category?.category_name || "-"}</td>
                            <td style={{ padding: "8px 10px" }}><span style={{ background: "var(--table-header-bg)", padding: "2px 6px", borderRadius: "4px", fontFamily: "monospace", fontSize: "11px", color: "var(--text-muted)" }}>Zone {zone} / Rack {rack}</span></td>
                            <td style={{ padding: "8px 10px", textAlign: "right", color: "var(--text-main)" }}>{it.system_qty} {it.product?.unit || "pcs"}</td>
                            <td style={{ padding: "8px 10px", textAlign: "right", fontWeight: 700, color: "var(--text-main)" }}>{it.physical_qty} {it.product?.unit || "pcs"}</td>
                            <td style={{ padding: "8px 10px", textAlign: "right", fontWeight: 700, color: discColor }}>{discText}</td>
                            <td style={{ padding: "8px 10px", color: "var(--text-muted)", fontStyle: "italic", maxWidth: "250px", wordBreak: "break-word", whiteSpace: "normal" }}>{it.notes || "-"}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
            <div style={{ padding: "14px 24px", background: "var(--table-header-bg)", borderTop: "1px solid var(--border-color)", display: "flex", justifyContent: "flex-end", gap: "10px" }}>
              {isMaster && selectedDetail.status === "completed" && (
                <>
                  <button 
                    onClick={() => {
                      const sId = selectedDetail.opname_id;
                      setSelectedDetail(null);
                      handleApproveReconciliation(sId);
                    }} 
                    style={{ padding: "8px 20px", borderRadius: "8px", border: "none", background: "#34D399", color: "#062F1E", fontSize: "13px", fontWeight: 700, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "4px" }}
                  >
                    <Check size={14} /> Reconcile & Approve
                  </button>
                  <button 
                    onClick={() => {
                      const sId = selectedDetail.opname_id;
                      setSelectedDetail(null);
                      handleRejectReconciliation(sId);
                    }} 
                    style={{ padding: "8px 20px", borderRadius: "8px", border: "none", background: "#EF4444", color: "#FFF", fontSize: "13px", fontWeight: 700, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "4px" }}
                  >
                    <X size={14} /> Reject
                  </button>
                </>
              )}
              <button 
                onClick={(e) => {
                  const btn = e.currentTarget;
                  const originalText = btn.innerHTML;
                  btn.innerHTML = "Generating...";
                  btn.disabled = true;
                  setTimeout(() => {
                    handleExportPDF(selectedDetail);
                    btn.innerHTML = originalText;
                    btn.disabled = false;
                  }, 400);
                }} 
                style={{ padding: "8px 20px", borderRadius: "8px", border: "1.5px solid var(--border-color)", background: "var(--card-bg)", color: "var(--text-main)", fontSize: "13px", fontWeight: 600, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "4px" }}
              >
                <FileText size={14} /> Export PDF
              </button>
              <button onClick={() => setSelectedDetail(null)} style={{ padding: "8px 20px", borderRadius: "8px", border: "1.5px solid var(--border-color)", background: "var(--card-bg)", color: "var(--text-main)", fontSize: "13px", fontWeight: 600, cursor: "pointer" }}>Close</button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

export default StockOpnamePage;