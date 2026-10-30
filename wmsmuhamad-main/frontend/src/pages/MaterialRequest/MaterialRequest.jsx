import { useState, useEffect } from "react";
import DashboardLayout from "../../layout/DashboardLayout";
import api from "../../services/api";
import authService from "../../services/authService";
import { exportMaterialRequestPdf } from "../../utils/pdfExport";
import { 
  X, 
  Check, 
  ChevronLeft, 
  ChevronRight, 
  FileText, 
  Plus, 
  AlertTriangle,
  Clock 
} from "lucide-react";

function MaterialRequestPage() {
  const [loading, setLoading] = useState(false);
  const [requests, setRequests] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [products, setProducts] = useState([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [currentUser, setCurrentUser] = useState(null);

  // Form states
  const [deptId, setDeptId] = useState("");
  const [warehouseId, setWarehouseId] = useState("");
  const [requestedBy, setRequestedBy] = useState("");
  const [requestDate, setRequestDate] = useState(new Date().toISOString().split("T")[0]);
  const [notes, setNotes] = useState("");
  const [formItems, setFormItems] = useState([
    { product_id: "", qty_requested: 10 }
  ]);

  // Selected Detail Modal
  const [selectedRequest, setSelectedRequest] = useState(null);

  // Date range filters for history
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const [pendingPage, setPendingPage] = useState(1);
  const [historyPage, setHistoryPage] = useState(1);

  useEffect(() => {
    setHistoryPage(1);
  }, [startDate, endDate]);

  useEffect(() => {
    document.title = "Permintaan Material | Warehouse Management System";
    const user = authService.getCurrentUser();
    setCurrentUser(user);
    if (user) {
      setRequestedBy(user.name);
    }
    fetchData();
  }, []);

  useEffect(() => {
    if (warehouseId) {
      const fetchWarehouseProducts = async () => {
        try {
          const prodRes = await api.get(`/master/products?warehouse_id=${warehouseId}&assigned_only=true`);
          if (prodRes.data && prodRes.data.status === "success") {
            setProducts(prodRes.data.data);
            if (prodRes.data.data.length > 0) {
              setFormItems([{ product_id: prodRes.data.data[0].product_id, qty_requested: 10 }]);
            } else {
              setFormItems([{ product_id: "", qty_requested: 10 }]);
            }
          }
        } catch (err) {
          console.error("Error fetching warehouse products:", err);
        }
      };
      fetchWarehouseProducts();
    } else {
      setProducts([]);
      setFormItems([{ product_id: "", qty_requested: 10 }]);
    }
  }, [warehouseId]);

  const handleExportPDF = async (request) => {
    try {
      setLoading(true);
      const res = await api.get(`/master/warehouse-signatures?warehouse_id=${request.warehouse_id}&document_type=material_request`);
      if (res.data && res.data.status === "success" && res.data.data) {
        exportMaterialRequestPdf(request, res.data.data.columns);
      } else {
        exportMaterialRequestPdf(request);
      }
    } catch (err) {
      console.error("Error fetching signature settings for PDF export:", err);
      exportMaterialRequestPdf(request);
    } finally {
      setLoading(false);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    setError("");
    try {
      // 1. Fetch Material Requests
      const mrRes = await api.get("/material-request");
      if (mrRes.data && mrRes.data.status === "success") {
        setRequests(mrRes.data.data);
      }

      // 2. Fetch Departments
      const deptRes = await api.get("/master/departments");
      if (deptRes.data && deptRes.data.status === "success") {
        setDepartments(deptRes.data.data);
        if (deptRes.data.data.length > 0) {
          setDeptId(deptRes.data.data[0].department_id);
        }
      }

      // 3. Fetch Warehouses
      const whRes = await api.get("/master/warehouses");
      if (whRes.data && whRes.data.status === "success") {
        setWarehouses(whRes.data.data);
        if (whRes.data.data.length > 0) {
          const userWhId = authService.getCurrentUser()?.warehouse_id;
          const foundWh = userWhId ? whRes.data.data.find(w => w.warehouse_id === parseInt(userWhId)) : null;
          setWarehouseId(foundWh ? foundWh.warehouse_id : whRes.data.data[0].warehouse_id);
        }
      }

    } catch (err) {
      console.error("Error loading MR data:", err);
      setError("Gagal memuat data dari server.");
    } finally {
      setLoading(false);
    }
  };

  const handleAddItem = () => {
    if (products.length === 0) return;
    setFormItems([...formItems, { product_id: products[0].product_id, qty_requested: 1 }]);
  };

  const handleRemoveItem = (index) => {
    if (formItems.length === 1) return;
    setFormItems(formItems.filter((_, i) => i !== index));
  };

  const handleItemChange = (index, field, value) => {
    const updated = [...formItems];
    updated[index][field] = value;
    setFormItems(updated);
  };

  const handleSubmitRequest = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!deptId || !warehouseId) {
      setError("Silakan pilih Departemen dan Gudang.");
      return;
    }

    const invalidItem = formItems.find(item => !item.product_id || item.qty_requested <= 0);
    if (invalidItem) {
      setError("Pastikan semua produk dipilih dan jumlah lebih dari 0.");
      return;
    }

    try {
      setLoading(true);
      const payload = {
        department_id: parseInt(deptId),
        warehouse_id: parseInt(warehouseId),
        requested_by: requestedBy,
        request_date: requestDate,
        notes: notes,
        items: formItems.map(item => ({
          product_id: parseInt(item.product_id),
          qty_requested: parseFloat(item.qty_requested)
        }))
      };

      const res = await api.post("/material-request", payload);
      if (res.data && res.data.status === "success") {
        setSuccess("Material Request berhasil dibuat!");
        setNotes("");
        setFormItems([{ product_id: products[0]?.product_id || "", qty_requested: 10 }]);
        fetchData();
      }
    } catch (err) {
      console.error("Error submitting MR:", err);
      if (err.response && err.response.data && err.response.data.message) {
        setError(err.response.data.message);
      } else {
        setError("Gagal membuat Material Request.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (mrId) => {
    setError("");
    setSuccess("");
    try {
      setLoading(true);
      const res = await api.post(`/material-request/${mrId}/approve`);
      if (res.data && res.data.status === "success") {
        setSuccess(`Material Request berhasil disetujui! Stok otomatis dipotong.`);
        fetchData();
      }
    } catch (err) {
      console.error("Error approving MR:", err);
      if (err.response && err.response.data && err.response.data.message) {
        setError(err.response.data.message);
      } else {
        setError("Gagal menyetujui Material Request.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async (mrId) => {
    setError("");
    setSuccess("");
    const reason = prompt("Masukkan alasan penolakan:") || "Rejected by administrator";
    try {
      setLoading(true);
      const res = await api.post(`/material-request/${mrId}/reject`, { reason });
      if (res.data && res.data.status === "success") {
        setSuccess("Material Request ditolak.");
        fetchData();
      }
    } catch (err) {
      console.error("Error rejecting MR:", err);
      if (err.response && err.response.data && err.response.data.message) {
        setError(err.response.data.message);
      } else {
        setError("Gagal menolak Material Request.");
      }
    } finally {
      setLoading(false);
    }
  };

  // Stats
  const getStats = () => {
    let pending = 0;
    let approved = 0;
    let rejected = 0;
    let completed = 0;

    requests.forEach(r => {
      if (r.status === "pending") pending++;
      else if (r.status === "approved") approved++;
      else if (r.status === "rejected") rejected++;
      else if (r.status === "completed") completed++;
    });

    return { pending, approved, rejected, completed };
  };

  const stats = getStats();
  const pendingRequests = requests.filter(r => r.status === "pending");
  
  const getFilteredHistoryRequests = () => {
    let list = requests.filter(r => r.status !== "pending");
    if (startDate) {
      list = list.filter(r => r.request_date >= startDate);
    }
    if (endDate) {
      list = list.filter(r => r.request_date <= endDate);
    }
    return list;
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "approved":
        return { bg: "var(--status-info-bg)", text: "var(--status-info-text)", border: "var(--status-info-border)", label: "Approved", icon: <Clock size={12} /> };
      case "rejected":
        return { bg: "var(--status-danger-bg)", text: "var(--status-danger-text)", border: "var(--status-danger-border)", label: "Rejected", icon: <X size={12} /> };
      case "completed":
        return { bg: "var(--status-success-bg)", text: "var(--status-success-text)", border: "var(--status-success-border)", label: "Fulfilled", icon: <Check size={12} /> };
      default:
        return { bg: "var(--status-warning-bg)", text: "var(--status-warning-text)", border: "var(--status-warning-border)", label: "Pending", icon: <Clock size={12} /> };
    }
  };

  const isAuthorizedToApprove = currentUser?.role === "Master" || currentUser?.role === "PIC";

  const ITEMS_PER_PAGE = 10;

  const totalPendingPages = Math.ceil(pendingRequests.length / ITEMS_PER_PAGE);
  const paginatedPending = pendingRequests.slice((pendingPage - 1) * ITEMS_PER_PAGE, pendingPage * ITEMS_PER_PAGE);

  const filteredHistory = getFilteredHistoryRequests();
  const totalHistoryPages = Math.ceil(filteredHistory.length / ITEMS_PER_PAGE);
  const paginatedHistory = filteredHistory.slice((historyPage - 1) * ITEMS_PER_PAGE, historyPage * ITEMS_PER_PAGE);

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
    <DashboardLayout title="Material Request">
      {/* Stat Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "16px", marginBottom: "20px" }}>
        <div style={{ background: "var(--card-bg)", padding: "16px", borderRadius: "12px", border: "1px solid var(--border-color)", color: "var(--text-main)" }}>
          <div style={{ fontSize: "12px", color: "var(--text-muted)", fontWeight: 600 }}>Pending Approval</div>
          <div style={{ fontSize: "24px", fontWeight: 700, margin: "6px 0", color: "#F59E0B" }}>{stats.pending}</div>
          <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>Awaiting review</div>
        </div>
        <div style={{ background: "var(--card-bg)", padding: "16px", borderRadius: "12px", border: "1px solid var(--border-color)", color: "var(--text-main)" }}>
          <div style={{ fontSize: "12px", color: "var(--text-muted)", fontWeight: 600 }}>Approved</div>
          <div style={{ fontSize: "24px", fontWeight: 700, margin: "6px 0", color: "#2563EB" }}>{stats.approved}</div>
          <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>Approved requests</div>
        </div>
        <div style={{ background: "var(--card-bg)", padding: "16px", borderRadius: "12px", border: "1px solid var(--border-color)", color: "var(--text-main)" }}>
          <div style={{ fontSize: "12px", color: "var(--text-muted)", fontWeight: 600 }}>Rejected</div>
          <div style={{ fontSize: "24px", fontWeight: 700, margin: "6px 0", color: "#DC2626" }}>{stats.rejected}</div>
          <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>Declined requests</div>
        </div>
        <div style={{ background: "var(--card-bg)", padding: "16px", borderRadius: "12px", border: "1px solid var(--border-color)", color: "var(--text-main)" }}>
          <div style={{ fontSize: "12px", color: "var(--text-muted)", fontWeight: 600 }}>Completed / Fulfilled</div>
          <div style={{ fontSize: "24px", fontWeight: 700, margin: "6px 0", color: "#10B981" }}>{stats.completed}</div>
          <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>Inventory issued</div>
        </div>
      </div>

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

      {/* Grid Layout */}
      <div className="dashboard-two-col grid-split-mr">
        
        {/* Left Column: Form */}
        <div style={{ background: "var(--card-bg)", borderRadius: "12px", border: "1px solid var(--border-color)", color: "var(--text-main)" }}>
          <div style={{ padding: "14px 20px", borderBottom: "1px solid var(--border-color)", display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#2C4FDB", display: "inline-block" }}></span>
            <span style={{ fontWeight: 700, fontSize: "14px", color: "var(--text-main)" }}>New Material Request</span>
          </div>

          <form onSubmit={handleSubmitRequest} style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "12px" }}>
            <div className="grid-form-row">
              <div>
                <label style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-muted)", display: "block", marginBottom: "6px" }}>Department</label>
                <select 
                  value={deptId} 
                  onChange={(e) => setDeptId(e.target.value)}
                  style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1.5px solid var(--border-color)", fontSize: "13px", boxSizing: "border-box", background: "var(--input-bg)", color: "var(--text-main)" }}
                  required
                >
                  {departments.map(d => (
                    <option key={d.department_id} value={d.department_id}>{d.department_name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-muted)", display: "block", marginBottom: "6px" }}>Target Warehouse</label>
                <select 
                  value={warehouseId} 
                  onChange={(e) => setWarehouseId(e.target.value)}
                  style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1.5px solid var(--border-color)", fontSize: "13px", boxSizing: "border-box", background: "var(--input-bg)", color: "var(--text-main)" }}
                  required
                >
                  {warehouses.map(w => (
                    <option key={w.warehouse_id} value={w.warehouse_id}>{w.warehouse_name}</option>
                  ))}
                </select>
              </div>
            </div>

            {currentUser && currentUser.warehouse_id && warehouseId && parseInt(warehouseId) !== parseInt(currentUser.warehouse_id) && (
              <div style={{ padding: "12px 16px", borderRadius: "8px", background: "rgba(239, 68, 68, 0.1)", border: "1.5px solid #EF4444", color: "#EF4444", fontSize: "13px", fontWeight: "600", marginBottom: "12px", display: "flex", alignItems: "center", gap: "6px" }}>
                <AlertTriangle size={14} />
                <span>Anda tidak memiliki otoritas akses untuk memproses transaksi di warehouse ini.</span>
              </div>
            )}

            <div className="grid-form-row">
              <div>
                <label style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-muted)", display: "block", marginBottom: "6px" }}>Requested By</label>
                <input 
                  value={requestedBy} 
                  onChange={(e) => setRequestedBy(e.target.value)}
                  style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1.5px solid var(--border-color)", fontSize: "13px", boxSizing: "border-box", background: "var(--input-bg)", color: "var(--text-main)" }} 
                  required
                />
              </div>
              <div>
                <label style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-muted)", display: "block", marginBottom: "6px" }}>Request Date</label>
                <input 
                  type="date" 
                  value={requestDate} 
                  onChange={(e) => setRequestDate(e.target.value)}
                  style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1.5px solid var(--border-color)", fontSize: "13px", boxSizing: "border-box", background: "var(--input-bg)", color: "var(--text-main)" }} 
                  required
                />
              </div>
            </div>

            <div>
              <label style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-muted)", display: "block", marginBottom: "6px" }}>Notes</label>
              <textarea 
                placeholder="Alasan / perincian request material..." 
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1.5px solid var(--border-color)", fontSize: "13px", boxSizing: "border-box", minHeight: "70px", resize: "vertical", background: "var(--input-bg)", color: "var(--text-main)" }} 
              />
            </div>

            {/* Requested Items section */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "10px", marginBottom: "4px" }}>
              <span style={{ fontWeight: 700, fontSize: "13px", color: "var(--text-main)" }}>Requested Items</span>
              <button 
                type="button" 
                onClick={handleAddItem}
                style={{ padding: "5px 12px", borderRadius: "8px", border: "1.5px solid #2C4FDB", background: "var(--card-bg)", color: "#2C4FDB", fontSize: "12px", fontWeight: 600, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "4px" }}
              >
                <Plus size={14} /> Add Item
              </button>
            </div>

            <div style={{ width: "100%" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
                <thead>
                  <tr>
                    <th style={{ width: "25px", textAlign: "left", padding: "8px 4px", background: "var(--table-header-bg)", fontSize: "11px", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", borderBottom: "1px solid var(--border-color)" }}>#</th>
                    <th style={{ textAlign: "left", padding: "8px 4px", background: "var(--table-header-bg)", fontSize: "11px", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", borderBottom: "1px solid var(--border-color)" }}>Product</th>
                    <th style={{ width: "75px", textAlign: "left", padding: "8px 4px", background: "var(--table-header-bg)", fontSize: "11px", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", borderBottom: "1px solid var(--border-color)" }}>Qty Request</th>
                    <th style={{ width: "40px", textAlign: "left", padding: "8px 4px", background: "var(--table-header-bg)", fontSize: "11px", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", borderBottom: "1px solid var(--border-color)" }}>Unit</th>
                    <th style={{ width: "35px", textAlign: "center", padding: "8px 4px", background: "var(--table-header-bg)", fontSize: "11px", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", borderBottom: "1px solid var(--border-color)" }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {formItems.map((item, idx) => (
                    <tr key={idx} style={{ borderBottom: "1px solid var(--border-color)" }}>
                      <td style={{ padding: "8px 4px", color: "var(--text-main)" }}>{idx + 1}</td>
                      <td style={{ padding: "8px 4px" }}>
                        <select 
                          value={item.product_id}
                          onChange={(e) => handleItemChange(idx, "product_id", e.target.value)}
                          style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1.5px solid var(--border-color)", background: "var(--input-bg)", color: "var(--text-main)", fontSize: "12px", boxSizing: "border-box" }}
                          required
                        >
                          <option value="">Select Product...</option>
                          {products.map(p => (
                            <option key={p.product_id} value={p.product_id}>{p.product_name}</option>
                          ))}
                        </select>
                      </td>
                      <td style={{ padding: "8px 4px" }}>
                        <input 
                          type="number" 
                          value={item.qty_requested} 
                          onChange={(e) => handleItemChange(idx, "qty_requested", e.target.value)}
                          style={{ width: "100%", padding: "5px 6px", border: "1.5px solid var(--border-color)", borderRadius: "6px", fontSize: "12px", background: "var(--input-bg)", color: "var(--text-main)", boxSizing: "border-box" }} 
                          min="0.01"
                          step="any"
                          required
                        />
                      </td>
                      <td style={{ padding: "8px 4px", color: "var(--text-muted)", fontSize: "12px" }}>
                        {products.find(p => p.product_id === parseInt(item.product_id))?.unit || "-"}
                      </td>
                      <td style={{ padding: "8px 4px", textAlign: "center" }}>
                        <button 
                          type="button" 
                          onClick={() => handleRemoveItem(idx)}
                          style={{ padding: "4px 8px", borderRadius: "6px", border: "1.5px solid rgba(239, 68, 68, 0.3)", background: "rgba(239, 68, 68, 0.15)", color: "#EF4444", fontSize: "11px", cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center", transition: "all 0.2s" }}
                        >
                          <X size={12} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "12px" }}>
              <button type="button" style={{ padding: "8px 20px", borderRadius: "8px", border: "1.5px solid var(--border-color)", background: "var(--card-bg)", fontSize: "13px", fontWeight: 600, cursor: "pointer", color: "var(--text-main)" }}>Cancel</button>
              <button type="submit" disabled={loading || (currentUser && currentUser.warehouse_id && warehouseId && parseInt(warehouseId) !== parseInt(currentUser.warehouse_id))} style={{ padding: "8px 20px", borderRadius: "8px", border: "none", background: "#2C4FDB", color: "#fff", fontSize: "13px", fontWeight: 600, cursor: "pointer", opacity: (loading || (currentUser && currentUser.warehouse_id && warehouseId && parseInt(warehouseId) !== parseInt(currentUser.warehouse_id))) ? 0.7 : 1 }}>
                {loading ? "Submitting..." : "Submit Request"}
              </button>
            </div>
          </form>
        </div>

        {/* Right Column: Pending Approvals & History */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          
          {/* Pending Approval List */}
          <div style={{ background: "var(--card-bg)", borderRadius: "12px", border: "1px solid var(--border-color)", color: "var(--text-main)" }}>
            <div style={{ padding: "14px 20px", borderBottom: "1px solid var(--border-color)", display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#F59E0B", display: "inline-block" }}></span>
              <span style={{ fontWeight: 700, fontSize: "14px", color: "var(--text-main)" }}>Pending Approval ({pendingRequests.length})</span>
            </div>

            <div style={{ padding: "16px", display: "flex", flexDirection: "column", gap: "12px" }}>
              {paginatedPending.length === 0 ? (
                <div style={{ padding: "16px", textAlign: "center", color: "var(--text-muted)", fontSize: "13px" }}>Tidak ada request pending.</div>
              ) : (
                paginatedPending.map((row) => (
                  <div key={row.mr_id} style={{ border: "1.5px solid var(--border-color)", borderRadius: "10px", padding: "14px", background: "var(--table-header-bg)", color: "var(--text-main)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: "8px" }}>
                      <div>
                        <div style={{ fontSize: "13px", fontWeight: 700, color: "var(--text-main)" }}>{row.mr_number}</div>
                        <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>{row.department?.department_name} Dept · {row.requested_by}</div>
                      </div>
                      <span style={{ 
                        background: getStatusBadge("pending").bg, 
                        color: getStatusBadge("pending").text, 
                        border: `1.5px solid ${getStatusBadge("pending").border}`,
                        padding: "3px 10px", 
                        borderRadius: "20px", 
                        fontSize: "11px", 
                        fontWeight: 700,
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "4px"
                      }}>
                        {getStatusBadge("pending").icon} {getStatusBadge("pending").label}
                      </span>
                    </div>

                    <div style={{ fontSize: "12px", color: "var(--text-muted)", marginBottom: "10px" }}>
                      {row.items?.map(it => `${it.product?.product_name} (${it.qty_requested})`).join(", ")}
                    </div>

                    <div className="card-btn-row">
                      {isAuthorizedToApprove && (
                        <>
                          <button 
                            onClick={() => handleApprove(row.mr_id)}
                            style={{ flex: 1, padding: "6px", borderRadius: "8px", border: "1.5px solid var(--status-success-border)", background: "var(--status-success-bg)", color: "var(--status-success-text)", fontSize: "12px", fontWeight: 700, cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "4px", transition: "all 0.2s" }}
                          >
                            <Check size={12} /> Approve
                          </button>
                          <button 
                            onClick={() => handleReject(row.mr_id)}
                            style={{ flex: 1, padding: "6px", borderRadius: "8px", border: "1.5px solid var(--status-danger-border)", background: "var(--status-danger-bg)", color: "var(--status-danger-text)", fontSize: "12px", fontWeight: 700, cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "4px", transition: "all 0.2s" }}
                          >
                            <X size={12} /> Reject
                          </button>
                        </>
                      )}
                      <button 
                        onClick={() => setSelectedRequest(row)}
                        style={{ padding: "6px 12px", borderRadius: "6px", border: "1.5px solid var(--border-color)", background: "var(--card-bg)", fontSize: "12px", cursor: "pointer", color: "var(--text-main)", fontWeight: 600 }}
                      >
                        Detail
                      </button>
                      <button
                        onClick={() => handleExportPDF(row)}
                        style={{ padding: "6px 12px", borderRadius: "6px", border: "1.5px solid rgba(59, 130, 246, 0.3)", background: "rgba(59, 130, 246, 0.15)", color: "#3B82F6", fontSize: "12px", cursor: "pointer", fontWeight: 700, display: "inline-flex", alignItems: "center", gap: "4px", transition: "all 0.2s" }}
                        title="Export PDF"
                      >
                        <FileText size={12} /> PDF
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
            {renderPagination(pendingPage, setPendingPage, totalPendingPages, "Pending Approval")}
          </div>

          {/* MR History */}
          <div style={{ background: "var(--card-bg)", borderRadius: "12px", border: "1px solid var(--border-color)", color: "var(--text-main)" }}>
            <div style={{ padding: "14px 20px", borderBottom: "1px solid var(--border-color)", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "8px", background: "var(--table-header-bg)" }}>
              <span style={{ fontWeight: 700, fontSize: "14px", color: "var(--text-main)" }}>MR History Logs</span>
              <div className="date-range-picker">
                <input 
                  type="date" 
                  value={startDate} 
                  onChange={(e) => setStartDate(e.target.value)} 
                  style={{ padding: "4px 8px", borderRadius: "6px", border: "1px solid var(--border-color)", fontSize: "11px", background: "var(--input-bg)", color: "var(--text-main)" }} 
                />
                <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>to</span>
                <input 
                  type="date" 
                  value={endDate} 
                  onChange={(e) => setEndDate(e.target.value)} 
                  style={{ padding: "4px 8px", borderRadius: "6px", border: "1px solid var(--border-color)", fontSize: "11px", background: "var(--input-bg)", color: "var(--text-main)" }} 
                />
              </div>
            </div>

            <div className="table-wrap">
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
                <thead>
                  <tr>
                    {["MR No", "Dept", "Items", "Status", "Action"].map((h) => (
                      <th key={h} style={{ 
                        textAlign: ["Items", "Status", "Action"].includes(h) ? "center" : "left", 
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
                  {paginatedHistory.length === 0 ? (
                    <tr>
                      <td colSpan="5" style={{ padding: "16px", textAlign: "center", color: "var(--text-muted)" }}>Tidak ada riwayat.</td>
                    </tr>
                  ) : (
                    paginatedHistory.map((row) => {
                      const badge = getStatusBadge(row.status);
                      return (
                        <tr key={row.mr_id} style={{ borderBottom: "1px solid var(--border-color)" }}>
                          <td style={{ padding: "10px 14px", fontWeight: 700, color: "var(--text-main)" }}>{row.mr_number}</td>
                          <td style={{ padding: "10px 14px", color: "var(--text-main)" }}>{row.department?.department_name}</td>
                          <td style={{ padding: "10px 14px", textAlign: "center", color: "var(--text-muted)" }}>{row.items?.length || 0} items</td>
                          <td style={{ padding: "10px 14px", textAlign: "center" }}>
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
                          <td style={{ padding: "10px 14px", textAlign: "center" }}>
                            <button 
                              onClick={() => setSelectedRequest(row)}
                              style={{ padding: "4px 8px", borderRadius: "6px", border: "1.5px solid var(--border-color)", background: "var(--card-bg)", fontSize: "11px", cursor: "pointer", fontWeight: 600, color: "var(--text-main)" }}
                            >
                              View
                            </button>
                            <button
                              onClick={() => handleExportPDF(row)}
                              style={{ marginLeft: "4px", padding: "4px 8px", borderRadius: "6px", border: "1.5px solid rgba(59, 130, 246, 0.3)", background: "rgba(59, 130, 246, 0.15)", color: "#3B82F6", fontSize: "11px", cursor: "pointer", fontWeight: 700, display: "inline-flex", alignItems: "center", gap: "4px", transition: "all 0.2s" }}
                              title="Export PDF"
                            >
                              <FileText size={12} /> PDF
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
            {renderPagination(historyPage, setHistoryPage, totalHistoryPages, "MR History")}
          </div>

        </div>
      </div>

      {selectedRequest && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(15, 23, 42, 0.6)", backdropFilter: "blur(4px)", display: "flex", justifyContent: "center", alignItems: "flex-start", zIndex: 1000, overflowY: "auto", padding: "40px 16px" }}>
          <div style={{ background: "var(--modal-bg)", borderRadius: "12px", width: "480px", maxWidth: "100%", border: "1.5px solid var(--border-color)", overflow: "hidden", color: "var(--text-main)", boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.2)" }}>
            <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border-color)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontWeight: 700, color: "var(--text-main)" }}>Detail Request: {selectedRequest.mr_number}</span>
              <button onClick={() => setSelectedRequest(null)} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><X size={16} /></button>
            </div>
            <div style={{ padding: "20px", fontSize: "13px", display: "flex", flexDirection: "column", gap: "10px", color: "var(--text-main)", maxHeight: "65vh", overflowY: "auto" }}>
              <div><strong>Requested By:</strong> {selectedRequest.requested_by}</div>
              <div><strong>Department:</strong> {selectedRequest.department?.department_name}</div>
              <div><strong>Warehouse:</strong> {selectedRequest.warehouse?.warehouse_name}</div>
              <div><strong>Request Date:</strong> {new Date(selectedRequest.request_date).toLocaleDateString("id-ID")}</div>
              <div><strong>Status:</strong> 
                <span style={{ 
                  background: getStatusBadge(selectedRequest.status).bg, 
                  color: getStatusBadge(selectedRequest.status).text, 
                  border: `1.5px solid ${getStatusBadge(selectedRequest.status).border}`,
                  padding: "2px 10px", 
                  borderRadius: "20px", 
                  fontSize: "11px", 
                  fontWeight: 700, 
                  whiteSpace: "nowrap", 
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "4px",
                  marginLeft: "8px"
                }}>
                  {getStatusBadge(selectedRequest.status).icon} {getStatusBadge(selectedRequest.status).label}
                </span>
              </div>
              {selectedRequest.notes && (
                <div style={{ 
                  background: "var(--table-header-bg)", 
                  padding: "12px 16px", 
                  borderRadius: "8px", 
                  border: "1px solid var(--border-color)", 
                  marginTop: "6px",
                  wordBreak: "break-word", 
                  whiteSpace: "pre-wrap", 
                  overflowWrap: "break-word", 
                  maxWidth: "100%",
                  color: "var(--text-main)"
                }}>
                  <strong style={{ display: "block", marginBottom: "4px", color: "var(--text-muted)", fontSize: "11px", textTransform: "uppercase" }}>Notes</strong>
                  {selectedRequest.notes}
                </div>
              )}
              {selectedRequest.reject_reason && <div style={{ color: "#EF4444" }}><strong>Reject Reason:</strong> {selectedRequest.reject_reason}</div>}

              <div style={{ marginTop: "12px" }}>
                <strong style={{ display: "block", marginBottom: "6px" }}>Items requested:</strong>
                <div className="table-wrap">
                  <table style={{ width: "100%", minWidth: "400px", borderCollapse: "collapse" }}>
                    <thead>
                      <tr style={{ background: "var(--table-header-bg)" }}>
                        <th style={{ padding: "6px 10px", textAlign: "left", fontSize: "11px", color: "var(--text-muted)", textTransform: "uppercase" }}>Product</th>
                        <th style={{ padding: "6px 10px", textAlign: "left", fontSize: "11px", color: "var(--text-muted)", textTransform: "uppercase" }}>Code</th>
                        <th style={{ padding: "6px 10px", textAlign: "right", fontSize: "11px", color: "var(--text-muted)", textTransform: "uppercase" }}>Qty Requested</th>
                        <th style={{ padding: "6px 10px", textAlign: "right", fontSize: "11px", color: "var(--text-muted)", textTransform: "uppercase" }}>Unit</th>
                        <th style={{ padding: "6px 10px", textAlign: "right", fontSize: "11px", color: "var(--text-muted)", textTransform: "uppercase" }}>Qty Fulfilled</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedRequest.items?.map((it, i) => (
                        <tr key={i} style={{ borderBottom: "1px solid var(--border-color)" }}>
                          <td style={{ padding: "6px 10px", color: "var(--text-main)", fontWeight: 700 }}>{it.product?.product_name}</td>
                          <td style={{ padding: "6px 10px", color: "var(--text-muted)", fontFamily: "monospace" }}>{it.product?.internal_code || "-"}</td>
                          <td style={{ padding: "6px 10px", textAlign: "right", fontWeight: 700, color: "var(--text-main)" }}>{it.qty_requested}</td>
                          <td style={{ padding: "6px 10px", textAlign: "right", color: "var(--text-muted)" }}>{it.product?.unit || "pcs"}</td>
                          <td style={{ padding: "6px 10px", textAlign: "right", color: "#10B981", fontWeight: 700 }}>{it.qty_fulfilled}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
            <div style={{ padding: "12px 20px", background: "var(--table-header-bg)", borderTop: "1px solid var(--border-color)", display: "flex", justifyContent: "flex-end", gap: "10px" }}>
              <button 
                onClick={(e) => {
                  const btn = e.currentTarget;
                  const originalText = btn.innerHTML;
                  btn.innerHTML = "Generating...";
                  btn.disabled = true;
                  setTimeout(() => {
                    handleExportPDF(selectedRequest);
                    btn.innerHTML = originalText;
                    btn.disabled = false;
                  }, 400);
                }} 
                style={{ padding: "6px 16px", borderRadius: "8px", border: "1.5px solid var(--border-color)", background: "var(--card-bg)", cursor: "pointer", fontSize: "12px", fontWeight: 600, color: "var(--text-main)", display: "inline-flex", alignItems: "center", gap: "4px" }}
              >
                <FileText size={12} /> Export PDF
              </button>
              <button onClick={() => setSelectedRequest(null)} style={{ padding: "6px 16px", borderRadius: "8px", border: "1.5px solid var(--border-color)", background: "var(--card-bg)", cursor: "pointer", fontSize: "12px", fontWeight: 600, color: "var(--text-main)" }}>Tutup</button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

export default MaterialRequestPage;