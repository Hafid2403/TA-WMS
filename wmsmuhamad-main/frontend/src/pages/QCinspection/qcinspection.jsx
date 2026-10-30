import { useState, useEffect } from "react";
import DashboardLayout from "../../layout/DashboardLayout";
import api from "../../services/api";
import { 
  X, 
  Check, 
  ChevronLeft, 
  ChevronRight, 
  AlertTriangle, 
  Plus, 
  Edit2, 
  Calendar, 
  User, 
  Package, 
  CheckCircle2, 
  CheckCircle,
  FileText,
  Clock 
} from "lucide-react";

function QCInspectionPage() {
  const [loading, setLoading] = useState(false);
  const [receipts, setReceipts] = useState([]);
  const [selectedGrId, setSelectedGrId] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // QC Form values
  const [qcNotes, setQcNotes] = useState("");
  const [qcItems, setQcItems] = useState([]); // Array of { gr_item_id, qty_received, qty_accepted, qty_rejected, product_name, internal_code }

  // Date range filters for history
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    setCurrentPage(1);
  }, [startDate, endDate]);

  // Add Qty modal states
  const [selectedHistoryItem, setSelectedHistoryItem] = useState(null);
  const [qtyAcceptedAdd, setQtyAcceptedAdd] = useState("");
  const [qtyRejectedAdd, setQtyRejectedAdd] = useState("");
  const [addQcNotes, setAddQcNotes] = useState("");
  const [loadingAddQc, setLoadingAddQc] = useState(false);
  const [isEditProportion, setIsEditProportion] = useState(false);

  useEffect(() => {
    document.title = "Inspeksi QC | Warehouse Management System";
    fetchReceipts();
  }, []);

  const fetchReceipts = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await api.get("/goods-receipt");
      if (res.data && res.data.status === "success") {
        const allReceipts = res.data.data;
        setReceipts(allReceipts);

        // Find the first receipt that has at least one pending item
        const firstPending = allReceipts.find(gr => 
          gr.items && gr.items.some(item => item.qc_status === "pending")
        );

        if (firstPending) {
          setSelectedGrId(firstPending.gr_id);
          initQcForm(firstPending);
        } else {
          setSelectedGrId("");
          setQcItems([]);
        }
      }
    } catch (err) {
      console.error("Error fetching QC receipts:", err);
      setError("Gagal memuat data Goods Receipt.");
    } finally {
      setLoading(false);
    }
  };

  const initQcForm = (gr) => {
    if (!gr || !gr.items) return;
    // We only inspect items that are "pending"
    const pendingItems = gr.items.filter(item => item.qc_status === "pending");
    const itemsState = pendingItems.map(item => ({
      gr_item_id: item.gr_item_id,
      qty_received: item.qty_received,
      qty_accepted: "", // default: empty string for easy editing
      qty_rejected: "", // default: empty string for easy editing
      product_name: item.product ? item.product.product_name : "Product",
      internal_code: item.product ? item.product.internal_code : ""
    }));
    setQcItems(itemsState);
    setQcNotes("");
  };

  const handleGrSelectChange = (grId) => {
    setSelectedGrId(grId);
    const gr = receipts.find(r => r.gr_id === parseInt(grId));
    if (gr) {
      initQcForm(gr);
    }
  };

  const handleQtyChange = (index, field, val) => {
    const updated = [...qcItems];
    const item = updated[index];

    if (field === "qty_accepted") {
      item.qty_accepted = val;
    } else {
      item.qty_rejected = val;
    }

    setQcItems(updated);
  };

  const handleSubmitQc = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!selectedGrId || qcItems.length === 0) {
      setError("Tidak ada data inspeksi yang dipilih.");
      return;
    }

    // Verify sums do not exceed received amounts
    const hasExceededLimit = qcItems.some(
      item => ((parseInt(item.qty_accepted, 10) || 0) + (parseInt(item.qty_rejected, 10) || 0)) > item.qty_received
    );

    if (hasExceededLimit) {
      setError("Jumlah Diterima (Accepted) dan Ditolak (Rejected) tidak boleh melebihi jumlah total diterima.");
      return;
    }

    const hasNoInspection = qcItems.every(
      item => ((parseInt(item.qty_accepted, 10) || 0) + (parseInt(item.qty_rejected, 10) || 0)) === 0
    );

    if (hasNoInspection) {
      setError("Anda harus memeriksa minimal 1 item sebelum submit.");
      return;
    }

    try {
      setLoading(true);
      const payload = {
        items: qcItems.map(item => ({
          gr_item_id: item.gr_item_id,
          qty_accepted: parseInt(item.qty_accepted, 10) || 0,
          qty_rejected: parseInt(item.qty_rejected, 10) || 0,
          qc_notes: qcNotes || "QC Inspected"
        }))
      };

      const res = await api.post(`/goods-receipt/${selectedGrId}/qc`, payload);
      if (res.data && res.data.status === "success") {
        setSuccess("Laporan QC berhasil dikirim! Status QC pada Goods Receipt telah diperbarui. Stok gudang disesuaikan berdasarkan qty yang diterima.");
        setSelectedGrId("");
        setQcItems([]);
        fetchReceipts();
      }
    } catch (err) {
      console.error("Error submitting QC:", err);
      if (err.response && err.response.data && err.response.data.message) {
        setError(err.response.data.message);
      } else {
        setError("Gagal mengirim laporan QC.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAddQcSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    if (!selectedHistoryItem) return;

    if (isEditProportion) {
      const accepted = parseInt(qtyAcceptedAdd, 10);
      const rejected = parseInt(qtyRejectedAdd, 10);

      if (isNaN(accepted) || isNaN(rejected)) {
        setError("Masukkan jumlah accepted dan rejected.");
        return;
      }

      if (accepted < 0 || rejected < 0) {
        setError("Jumlah tidak boleh negatif.");
        return;
      }

      if ((accepted + rejected) !== selectedHistoryItem.qty_received) {
        setError(`Total accepted (${accepted}) dan rejected (${rejected}) harus sama dengan qty received (${selectedHistoryItem.qty_received}).`);
        return;
      }

      try {
        setLoadingAddQc(true);
        const payload = {
          qty_accepted: accepted,
          qty_rejected: rejected,
          qc_notes: addQcNotes || "QC Proportion Adjustment"
        };

        const res = await api.post(`/goods-receipt/item/${selectedHistoryItem.gr_item_id}/edit-qc-proportion`, payload);
        if (res.data && res.data.status === "success") {
          setSuccess("Proporsi QC berhasil diperbarui! Stok gudang disesuaikan.");
          setSelectedHistoryItem(null);
          setQtyAcceptedAdd("");
          setQtyRejectedAdd("");
          setAddQcNotes("");
          fetchReceipts();
        }
      } catch (err) {
        console.error("Error editing QC proportion:", err);
        if (err.response && err.response.data && err.response.data.message) {
          setError(err.response.data.message);
        } else {
          setError("Gagal memperbarui proporsi QC.");
        }
      } finally {
        setLoadingAddQc(false);
      }
    } else {
      const acceptedAdd = parseInt(qtyAcceptedAdd, 10) || 0;
      const rejectedAdd = parseInt(qtyRejectedAdd, 10) || 0;
      const totalNew = selectedHistoryItem.qty_accepted + selectedHistoryItem.qty_rejected + acceptedAdd + rejectedAdd;

      if (acceptedAdd === 0 && rejectedAdd === 0) {
        setError("Masukkan tambahan jumlah yang diterima atau ditolak.");
        return;
      }

      if (totalNew > selectedHistoryItem.qty_received) {
        setError(`Akumulasi jumlah (${totalNew}) melebihi Qty Received (${selectedHistoryItem.qty_received}).`);
        return;
      }

      try {
        setLoadingAddQc(true);
        const payload = {
          qty_accepted_add: acceptedAdd,
          qty_rejected_add: rejectedAdd,
          qc_notes: addQcNotes || "QC Additional Inspection"
        };

        const res = await api.post(`/goods-receipt/item/${selectedHistoryItem.gr_item_id}/add-qc-qty`, payload);
        if (res.data && res.data.status === "success") {
          setSuccess("Tambahan kuantitas QC berhasil dicatat! Stok gudang disesuaikan.");
          setSelectedHistoryItem(null);
          setQtyAcceptedAdd("");
          setQtyRejectedAdd("");
          setAddQcNotes("");
          fetchReceipts();
        }
      } catch (err) {
        console.error("Error adding QC qty:", err);
        if (err.response && err.response.data && err.response.data.message) {
          setError(err.response.data.message);
        } else {
          setError("Gagal menambahkan kuantitas QC.");
        }
      } finally {
        setLoadingAddQc(false);
      }
    }
  };

  // Compile history: all items from all receipts that are NOT pending
  const getInspectionHistory = () => {
    const historyList = [];
    receipts.forEach(gr => {
      if (gr.items) {
        gr.items.forEach(item => {
          if (item.qc_status !== "pending") {
            if (startDate && item.qc_date < startDate) return;
            if (endDate && item.qc_date > endDate) return;

            historyList.push({
              gr_item_id: item.gr_item_id,
              gr_number: gr.gr_number,
              product_name: item.product ? item.product.product_name : "Product",
              qty_received: item.qty_received,
              qty_accepted: item.qty_accepted,
              qty_rejected: item.qty_rejected,
              qc_status: item.qc_status,
              qc_notes: item.qc_notes,
              qc_by: item.qc_inspector ? item.qc_inspector.name : (item.qcInspector ? item.qcInspector.name : "Inspector"),
              qc_date: item.qc_date
            });
          }
        });
      }
    });
    return historyList.sort((a, b) => new Date(b.qc_date) - new Date(a.qc_date));
  };

  // Stats computation
  const getStats = () => {
    let pendingCount = 0;
    let acceptedToday = 0;
    let rejectedToday = 0;

    receipts.forEach(gr => {
      if (gr.items) {
        gr.items.forEach(item => {
          if (item.qc_status === "pending") {
            pendingCount++;
          } else {
            acceptedToday += item.qty_accepted;
            rejectedToday += item.qty_rejected;
          }
        });
      }
    });

    return { pendingCount, acceptedToday, rejectedToday };
  };

  const stats = getStats();
  const activeGr = receipts.find(r => r.gr_id === parseInt(selectedGrId));

  const ITEMS_PER_PAGE = 10;
  const historyList = getInspectionHistory();
  const totalHistoryPages = Math.ceil(historyList.length / ITEMS_PER_PAGE);
  const paginatedHistory = historyList.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

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

  const getStatusBadgeStyles = (row) => {
    if (row.qty_accepted + row.qty_rejected === row.qty_received && row.qty_rejected > 0) {
      return { 
        bg: "var(--status-info-bg)", 
        text: "var(--status-info-text)", 
        border: "var(--status-info-border)", 
        label: "Lengkap dengan Reject",
        icon: <AlertTriangle size={12} />
      };
    }
    switch (row.qc_status) {
      case "passed":
        return { 
          bg: "var(--status-success-bg)", 
          text: "var(--status-success-text)", 
          border: "var(--status-success-border)", 
          label: "Passed",
          icon: <Check size={12} />
        };
      case "rejected":
        return { 
          bg: "var(--status-danger-bg)", 
          text: "var(--status-danger-text)", 
          border: "var(--status-danger-border)", 
          label: "Rejected",
          icon: <X size={12} />
        };
      case "partial":
        return { 
          bg: "var(--status-warning-bg)", 
          text: "var(--status-warning-text)", 
          border: "var(--status-warning-border)", 
          label: "Pending Order",
          icon: <Clock size={12} />
        };
      default:
        return { 
          bg: "var(--status-warning-bg)", 
          text: "var(--status-warning-text)", 
          border: "var(--status-warning-border)", 
          label: "Pending",
          icon: <Clock size={12} />
        };
    }
  };

  return (
    <DashboardLayout title="QC Inspection">
      {/* Stat Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "16px", marginBottom: "20px" }}>
        <div style={{ background: "var(--card-bg)", padding: "16px", borderRadius: "12px", border: "1px solid var(--border-color)", color: "var(--text-main)" }}>
          <div style={{ fontSize: "12px", color: "var(--text-muted)", fontWeight: 600 }}>Pending Inspection</div>
          <div style={{ fontSize: "28px", fontWeight: 700, margin: "8px 0" }}>{stats.pendingCount}</div>
          <div style={{ fontSize: "11px", color: "#F59E0B" }}>Items awaiting QC check</div>
        </div>
        <div style={{ background: "var(--card-bg)", padding: "16px", borderRadius: "12px", border: "1px solid var(--border-color)", color: "var(--text-main)" }}>
          <div style={{ fontSize: "12px", color: "var(--text-muted)", fontWeight: 600 }}>Total Accepted Items</div>
          <div style={{ fontSize: "28px", fontWeight: 700, margin: "8px 0", color: "#10B981" }}>{stats.acceptedToday.toLocaleString()}</div>
          <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>Approved & put into stock</div>
        </div>
        <div style={{ background: "var(--card-bg)", padding: "16px", borderRadius: "12px", border: "1px solid var(--border-color)", color: "var(--text-main)" }}>
          <div style={{ fontSize: "12px", color: "var(--text-muted)", fontWeight: 600 }}>Total Rejected Items</div>
          <div style={{ fontSize: "28px", fontWeight: 700, margin: "8px 0", color: "#EF4444" }}>{stats.rejectedToday.toLocaleString()}</div>
          <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>Flagged for vendor return</div>
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

      {/* Select Pending Goods Receipt */}
      {/* Select Pending Goods Receipt */}
      <div style={{ background: "var(--card-bg)", borderRadius: "12px", border: "1px solid var(--border-color)", padding: "16px 20px", marginBottom: "20px", display: "flex", alignItems: "center", gap: "12px", color: "var(--text-main)", flexWrap: "wrap" }}>
        <span style={{ fontWeight: 600, fontSize: "13px" }}>Pilih Goods Receipt untuk QC:</span>
        <select 
          value={selectedGrId} 
          onChange={(e) => handleGrSelectChange(e.target.value)}
          style={{ padding: "8px 12px", borderRadius: "8px", border: "1.5px solid var(--border-color)", fontSize: "13px", minWidth: "250px", background: "var(--input-bg)", color: "var(--text-main)", flex: 1 }}
        >
          <option value="">-- Pilih Goods Receipt --</option>
          {receipts.filter(r => r.items && r.items.some(i => i.qc_status === "pending")).map(r => (
            <option key={r.gr_id} value={r.gr_id}>{r.gr_number} — {r.vendor?.vendor_name}</option>
          ))}
        </select>
      </div>

      {/* Pending Inspection Panel */}
      {selectedGrId && activeGr ? (
        <div style={{ background: "var(--card-bg)", borderRadius: "12px", border: "1px solid var(--border-color)", marginBottom: "20px", color: "var(--text-main)" }}>
          <div style={{ padding: "14px 20px", borderBottom: "1px solid var(--border-color)", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "12px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
              <span style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#F59E0B", display: "inline-block" }}></span>
              <span style={{ fontWeight: 700, fontSize: "14px", color: "var(--text-main)" }}>{activeGr.gr_number} — {activeGr.vendor?.vendor_name}</span>
              <span style={{ background: "#FEF3C7", color: "#92400E", padding: "3px 10px", borderRadius: "20px", fontSize: "11px", fontWeight: 700 }}>Pending Inspection</span>
            </div>
            
            {/* Progression Bar in Header */}
            {(() => {
              const readyItems = qcItems.filter(item => ((parseInt(item.qty_accepted, 10) || 0) + (parseInt(item.qty_rejected, 10) || 0)) === item.qty_received).length;
              const totalItems = qcItems.length;
              const percent = totalItems > 0 ? Math.round((readyItems / totalItems) * 100) : 0;
              return (
                <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                  <span style={{ fontSize: "12px", fontWeight: 700, color: "var(--text-muted)" }}>Progress: {readyItems}/{totalItems} ({percent}%)</span>
                  <div style={{ width: "120px", height: "8px", background: "var(--border-color)", borderRadius: "4px", overflow: "hidden" }}>
                    <div style={{ width: `${percent}%`, height: "100%", background: percent === 100 ? "#10B981" : "#F59E0B", transition: "width 0.3s ease" }}></div>
                  </div>
                </div>
              );
            })()}
          </div>

          <form onSubmit={handleSubmitQc} style={{ padding: "16px 20px" }}>
            {/* Info */}
            <div style={{ display: "flex", gap: "16px", fontSize: "12px", color: "var(--text-muted)", marginBottom: "20px", alignItems: "center", flexWrap: "wrap" }}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}><Calendar size={14} /> Received: {new Date(activeGr.receipt_date).toLocaleDateString("id-ID")}</span>
              <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}><User size={14} /> Received By: {activeGr.receiver?.name}</span>
              <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}><Package size={14} /> {qcItems.length} items to inspect</span>
            </div>

            {/* QC Items */}
            {qcItems.map((item, i) => {
              const currentAllocated = (parseInt(item.qty_accepted, 10) || 0) + (parseInt(item.qty_rejected, 10) || 0);
              const isReady = currentAllocated === item.qty_received;
              const remaining = item.qty_received - currentAllocated;

              return (
                <div key={item.gr_item_id} style={{ display: "flex", flexDirection: "column", padding: "14px 0", borderBottom: "1px solid var(--border-color)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: "13px", marginBottom: "4px", color: "var(--text-main)" }}>{item.product_name}</div>
                      <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>Code: {item.internal_code} | Total Received: {item.qty_received.toLocaleString()} pcs</div>
                    </div>
                    
                    {/* Row Quick Action Buttons & Inputs */}
                    <div style={{ display: "flex", alignItems: "center", gap: "16px", flexWrap: "wrap" }}>
                      {/* Pass/Reject Quick Toggles */}
                      <div style={{ display: "flex", gap: "6px" }}>
                        <button
                          type="button"
                          onClick={() => {
                            const updated = [...qcItems];
                            updated[i].qty_accepted = item.qty_received;
                            updated[i].qty_rejected = 0;
                            setQcItems(updated);
                          }}
                          style={{ padding: "4px 8px", borderRadius: "6px", border: "1.5px solid rgba(16, 185, 129, 0.3)", background: "rgba(16, 185, 129, 0.15)", color: "#10B981", fontSize: "11px", fontWeight: 700, cursor: "pointer", transition: "all 0.2s" }}
                        >
                          Pass All
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const updated = [...qcItems];
                            updated[i].qty_accepted = 0;
                            updated[i].qty_rejected = item.qty_received;
                            setQcItems(updated);
                          }}
                          style={{ padding: "4px 8px", borderRadius: "6px", border: "1.5px solid rgba(239, 68, 68, 0.3)", background: "rgba(239, 68, 68, 0.15)", color: "#EF4444", fontSize: "11px", fontWeight: 700, cursor: "pointer", transition: "all 0.2s" }}
                        >
                          Reject All
                        </button>
                      </div>

                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "2px" }}>
                          <label style={{ fontSize: "10px", color: "var(--text-muted)" }}>Accepted</label>
                          <input 
                            type="number" 
                            value={item.qty_accepted} 
                            onChange={(e) => handleQtyChange(i, "qty_accepted", e.target.value)}
                            className="qc-accepted-input"
                            style={{ width: "75px", padding: "5px 8px", border: "1.5px solid var(--border-color)", borderRadius: "6px", fontSize: "12px", textAlign: "center", background: "var(--input-bg)", color: "var(--text-main)" }} 
                            min="0"
                            max={item.qty_received}
                            step="1"
                          />
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "2px" }}>
                          <label style={{ fontSize: "10px", color: "var(--text-muted)" }}>Rejected</label>
                          <input 
                            type="number" 
                            value={item.qty_rejected} 
                            onChange={(e) => handleQtyChange(i, "qty_rejected", e.target.value)}
                            className="qc-rejected-input"
                            style={{ width: "75px", padding: "5px 8px", border: `1.5px solid ${item.qty_rejected > 0 ? "#EF4444" : "var(--border-color)"}`, borderRadius: "6px", fontSize: "12px", textAlign: "center", background: "var(--input-bg)", color: "var(--text-main)" }} 
                            min="0"
                            max={item.qty_received}
                            step="1"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Real-time Validation Status */}
                  <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "6px" }}>
                    {isReady ? (
                      <span style={{ fontSize: "11px", color: "#059669", fontWeight: 700, display: "inline-flex", alignItems: "center", gap: "4px" }}><CheckCircle2 size={12} /> Cocok (Ready to Submit)</span>
                    ) : (
                      <span style={{ fontSize: "11px", color: "#D97706", fontWeight: 700, display: "inline-flex", alignItems: "center", gap: "4px" }}>
                        <AlertTriangle size={12} /> Kurang: {remaining} pcs dari total {item.qty_received} pcs
                      </span>
                    )}
                  </div>
                </div>
              );
            })}

            {/* QC Notes */}
            <div style={{ marginTop: "16px" }}>
              <label style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-muted)", display: "block", marginBottom: "6px" }}>QC Notes</label>
              <textarea 
                placeholder="Catatan inspeksi QC..." 
                value={qcNotes}
                onChange={(e) => setQcNotes(e.target.value)}
                style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1.5px solid var(--border-color)", fontSize: "13px", boxSizing: "border-box", minHeight: "70px", resize: "vertical", background: "var(--input-bg)", color: "var(--text-main)" }} 
              />
            </div>

            {/* Buttons */}
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "16px" }}>
              <button type="button" onClick={() => initQcForm(activeGr)} style={{ padding: "8px 20px", borderRadius: "8px", border: "1.5px solid var(--border-color)", background: "var(--card-bg)", color: "var(--text-main)", fontSize: "13px", fontWeight: 600, cursor: "pointer" }}>Reset Form</button>
              <button type="submit" disabled={loading} style={{ padding: "8px 20px", borderRadius: "8px", border: "none", background: "#2C4FDB", color: "#fff", fontSize: "13px", fontWeight: 600, cursor: "pointer", opacity: loading ? 0.7 : 1 }}>
                {loading ? "Submitting..." : "Submit QC Result"}
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div style={{ padding: "30px", background: "var(--table-header-bg)", border: "1px dashed var(--border-color)", borderRadius: "12px", textAlign: "center", color: "var(--text-muted)", fontSize: "14px", marginBottom: "20px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "8px" }}>
          <CheckCircle size={32} style={{ color: "#10B981" }} />
          <span>Semua Goods Receipt telah selesai diinspeksi QC!</span>
        </div>
      )}

      {/* Inspection History */}
      <div style={{ background: "var(--card-bg)", borderRadius: "12px", border: "1px solid var(--border-color)", color: "var(--text-main)" }}>
        <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border-color)", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px", background: "var(--table-header-bg)" }}>
          <span style={{ fontWeight: 800, fontSize: "14px", color: "var(--text-main)" }}>Inspection History Logs</span>
          
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
              {["GR Number", "Product", "Received", "Accepted", "Rejected", "Status", "QC By", "Notes", "Date", "Action"].map((h) => (
                <th key={h} style={{ 
                  textAlign: ["Received", "Accepted", "Rejected", "Status", "Action"].includes(h) ? "center" : "left", 
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
            {paginatedHistory.length === 0 ? (
              <tr>
                <td colSpan="10" style={{ padding: "20px", textAlign: "center", color: "var(--text-muted)" }}>Tidak ada riwayat inspeksi</td>
              </tr>
            ) : (
              paginatedHistory.map((row, i) => {
                const badge = getStatusBadgeStyles(row);
                const formattedDate = new Date(row.qc_date).toLocaleDateString("id-ID", {
                  day: "2-digit",
                  month: "short"
                });

                return (
                  <tr key={i} style={{ borderBottom: "1px solid var(--border-color)" }}>
                    <td style={{ padding: "12px 20px", fontWeight: 700, color: "var(--text-main)" }}>{row.gr_number}</td>
                    <td style={{ padding: "12px 20px", color: "var(--text-main)" }}>{row.product_name}</td>
                    <td style={{ padding: "12px 20px", textAlign: "center", color: "var(--text-main)" }}>{row.qty_received}</td>
                    <td style={{ padding: "12px 20px", textAlign: "center", color: "#10B981", fontWeight: 600 }}>{row.qty_accepted}</td>
                    <td style={{ padding: "12px 20px", textAlign: "center", color: row.qty_rejected > 0 ? "#EF4444" : "var(--text-muted)", fontWeight: row.qty_rejected > 0 ? 700 : 400 }}>{row.qty_rejected}</td>
                    <td style={{ padding: "12px 20px", textAlign: "center" }}>
                      <span style={{ 
                        background: badge.bg, 
                        color: badge.text, 
                        border: `1.5px solid ${badge.border}`,
                        padding: "3px 10px", 
                        borderRadius: "20px", 
                        fontSize: "11px", 
                        fontWeight: 700, 
                        whiteSpace: "nowrap", 
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "4px"
                      }}>
                        {badge.icon} {badge.label}
                      </span>
                    </td>
                    <td style={{ padding: "12px 20px", color: "var(--text-main)" }}>{row.qc_by}</td>
                    <td style={{ padding: "12px 20px", color: "var(--text-muted)", fontStyle: "italic" }}>{row.qc_notes || "-"}</td>
                    <td style={{ padding: "12px 20px", color: "var(--text-muted)" }}>{formattedDate}</td>
                    <td style={{ padding: "12px 20px", textAlign: "center" }}>
                      {(row.qty_accepted + row.qty_rejected) < row.qty_received ? (
                        <button
                          onClick={() => {
                            setIsEditProportion(false);
                            setSelectedHistoryItem(row);
                            setQtyAcceptedAdd("");
                            setQtyRejectedAdd("");
                            setAddQcNotes("");
                          }}
                          style={{
                            padding: "5px 10px",
                            borderRadius: "6px",
                            border: "none",
                            background: "#10B981",
                            color: "#fff",
                            fontSize: "11px",
                            fontWeight: 700,
                            cursor: "pointer",
                            transition: "all 0.2s",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "4px"
                          }}
                        >
                          <Plus size={12} /> Tambah Qty
                        </button>
                      ) : row.qty_rejected > 0 ? (
                        <button
                          onClick={() => {
                            setIsEditProportion(true);
                            setSelectedHistoryItem(row);
                            setQtyAcceptedAdd(row.qty_accepted.toString());
                            setQtyRejectedAdd(row.qty_rejected.toString());
                            setAddQcNotes(row.qc_notes || "");
                          }}
                          style={{
                            padding: "5px 10px",
                            borderRadius: "6px",
                            border: "1px solid #4338CA",
                            background: "transparent",
                            color: "#4338CA",
                            fontSize: "11px",
                            fontWeight: 700,
                            cursor: "pointer",
                            transition: "all 0.2s",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "4px"
                          }}
                        >
                          <Edit2 size={12} /> Edit Proporsi
                        </button>
                      ) : (
                        <span style={{ color: "#10B981", fontWeight: 700, fontSize: "12px", display: "inline-flex", alignItems: "center", gap: "4px" }}>
                          <Check size={14} /> Lengkap
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
        </div>
        {renderPagination(currentPage, setCurrentPage, totalHistoryPages, "QC History")}
      </div>

      {selectedHistoryItem && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.5)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1000 }}>
          <div style={{ background: "var(--modal-bg)", borderRadius: "12px", width: "400px", border: "1px solid var(--border-color)", overflow: "hidden", color: "var(--text-main)" }}>
            <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border-color)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontWeight: 700 }}>
                {isEditProportion ? "Edit Proporsi" : "Tambah Qty"}: {selectedHistoryItem.product_name}
              </span>
              <button onClick={() => setSelectedHistoryItem(null)} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><X size={16} /></button>
            </div>
            <form onSubmit={handleAddQcSubmit} style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "12px", fontSize: "13px" }}>
              <div>
                <span style={{ color: "var(--text-muted)" }}>GR Number:</span> <strong>{selectedHistoryItem.gr_number}</strong>
              </div>
              <div>
                <span style={{ color: "var(--text-muted)" }}>Qty Received:</span> <strong>{selectedHistoryItem.qty_received}</strong>
              </div>
              <div>
                <span style={{ color: "var(--text-muted)" }}>Current Inspected:</span> <strong style={{ color: "#10B981" }}>{selectedHistoryItem.qty_accepted} Acc</strong> / <strong style={{ color: "#EF4444" }}>{selectedHistoryItem.qty_rejected} Rej</strong>
              </div>
              
              {isEditProportion ? (
                <div style={{ background: "var(--table-header-bg)", padding: "10px", borderRadius: "8px", border: "1px solid var(--border-color)", fontSize: "11px", color: "#4338CA", fontWeight: 600, display: "inline-flex", alignItems: "center", gap: "6px" }}>
                  <FileText size={14} /> Atur ulang proporsi Qty Accepted dan Rejected. Total harus sama dengan {selectedHistoryItem.qty_received} pcs.
                </div>
              ) : (
                <div style={{ background: "var(--table-header-bg)", padding: "10px", borderRadius: "8px", border: "1px solid var(--border-color)", fontSize: "11px", color: "var(--text-muted)" }}>
                  Sisa yang belum diinspeksi: <strong>{selectedHistoryItem.qty_received - (selectedHistoryItem.qty_accepted + selectedHistoryItem.qty_rejected)}</strong> pcs.
                </div>
              )}
              
              <div>
                <label style={{ display: "block", marginBottom: "4px", fontWeight: 600 }}>
                  {isEditProportion ? "Qty Accepted Baru" : "Tambah Qty Accepted"}
                </label>
                <input
                  type="number"
                  min="0"
                  max={isEditProportion ? selectedHistoryItem.qty_received : (selectedHistoryItem.qty_received - (selectedHistoryItem.qty_accepted + selectedHistoryItem.qty_rejected))}
                  value={qtyAcceptedAdd}
                  onChange={(e) => setQtyAcceptedAdd(e.target.value)}
                  style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1.5px solid var(--border-color)", background: "var(--input-bg)", color: "var(--text-main)", boxSizing: "border-box" }}
                />
              </div>
              <div>
                <label style={{ display: "block", marginBottom: "4px", fontWeight: 600 }}>
                  {isEditProportion ? "Qty Rejected Baru" : "Tambah Qty Rejected"}
                </label>
                <input
                  type="number"
                  min="0"
                  max={isEditProportion ? selectedHistoryItem.qty_received : (selectedHistoryItem.qty_received - (selectedHistoryItem.qty_accepted + selectedHistoryItem.qty_rejected))}
                  value={qtyRejectedAdd}
                  onChange={(e) => setQtyRejectedAdd(e.target.value)}
                  style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1.5px solid var(--border-color)", background: "var(--input-bg)", color: "var(--text-main)", boxSizing: "border-box" }}
                />
              </div>
              <div>
                <label style={{ display: "block", marginBottom: "4px", fontWeight: 600 }}>QC Notes</label>
                <textarea
                  placeholder="Catatan inspeksi..."
                  value={addQcNotes}
                  onChange={(e) => setAddQcNotes(e.target.value)}
                  style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1.5px solid var(--border-color)", background: "var(--input-bg)", color: "var(--text-main)", minHeight: "60px", resize: "vertical", boxSizing: "border-box" }}
                />
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "8px" }}>
                <button type="button" onClick={() => setSelectedHistoryItem(null)} style={{ padding: "6px 16px", borderRadius: "8px", border: "1.5px solid var(--border-color)", background: "var(--card-bg)", color: "var(--text-main)", cursor: "pointer" }}>Batal</button>
                <button type="submit" disabled={loadingAddQc} style={{ padding: "6px 16px", borderRadius: "8px", border: "none", background: isEditProportion ? "#4338CA" : "#10B981", color: "#fff", cursor: "pointer", opacity: loadingAddQc ? 0.7 : 1 }}>
                  {loadingAddQc ? "Menyimpan..." : "Simpan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

export default QCInspectionPage;