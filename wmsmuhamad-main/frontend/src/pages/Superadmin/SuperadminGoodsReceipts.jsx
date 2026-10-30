import React, { useEffect, useState } from "react";
import DashboardLayout from "../../layout/DashboardLayout";
import api from "../../services/api";
import {
  Package,
  Search,
  Edit2,
  Check,
  X,
  AlertTriangle,
  RefreshCw,
  Clock,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import "../../styles/superadmin.css";

function SuperadminGoodsReceipts() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const [warehouses, setWarehouses] = useState([]);
  const [grList, setGrList] = useState([]);

  // Search & Filters
  const [grSearch, setGrSearch] = useState("");
  const [grWarehouseFilter, setGrWarehouseFilter] = useState("All Warehouses");
  const [grStatusFilter, setGrStatusFilter] = useState("All Status");
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  // Edit Drawer
  const [editDrawerOpen, setEditDrawerOpen] = useState(false);
  const [editData, setEditData] = useState({});

  const getGRStatusBadge = (status) => {
    switch (status) {
      case "Completed":
        return { className: "badge badge-success", icon: <Check size={12} /> };
      case "Rejected":
        return { className: "badge badge-danger", icon: <X size={12} /> };
      case "Partial":
        return { className: "badge badge-info", icon: <Clock size={12} /> };
      default:
        return { className: "badge badge-warning", icon: <Clock size={12} /> };
    }
  };

  useEffect(() => {
    document.title = "Goods Receipts Global | WMS Super Admin";
    loadData();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [grSearch, grWarehouseFilter, grStatusFilter]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError("");

      const [whRes, grRes] = await Promise.all([
        api.get("/superadmin/warehouses"),
        api.get("/superadmin/goods-receipts")
      ]);

      if (whRes.data && whRes.data.status === "success") {
        setWarehouses(whRes.data.data);
      }
      if (grRes.data && grRes.data.status === "success") {
        setGrList(grRes.data.data);
      }
    } catch (err) {
      console.error("Error loading GR data:", err);
      setError("Gagal memuat data Goods Receipt dari server.");
    } finally {
      setLoading(false);
    }
  };

  const showToast = (message, isSuccess = true) => {
    if (isSuccess) {
      setSuccessMsg(message);
      setTimeout(() => setSuccessMsg(""), 4000);
    } else {
      setError(message);
      setTimeout(() => setError(""), 4000);
    }
  };

  const openEditDrawer = (data) => {
    setEditData({
      gr_id: data.gr_id,
      gr_number: data.gr_number,
      notes: data.notes || "",
      status: data.status
    });
    setEditDrawerOpen(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        notes: editData.notes,
        status: editData.status
      };

      const res = await api.put(`/superadmin/goods-receipts/${editData.gr_id}`, payload);
      if (res.data && res.data.status === "success") {
        showToast("Status Goods Receipt berhasil diperbarui.");
        setEditDrawerOpen(false);
        loadData();
      }
    } catch (err) {
      const errMsg = err.response?.data?.message || "Gagal memperbarui data.";
      showToast(errMsg, false);
    }
  };

  // --- FILTERS ---
  const filteredGR = grList.filter(gr => {
    const matchesSearch = gr.gr_number.toLowerCase().includes(grSearch.toLowerCase()) ||
                          gr.vendor_name.toLowerCase().includes(grSearch.toLowerCase());
    const matchesWh = grWarehouseFilter === "All Warehouses" || String(gr.warehouse_id) === grWarehouseFilter;
    const matchesStatus = grStatusFilter === "All Status" || gr.status.toLowerCase() === grStatusFilter.toLowerCase();
    return matchesSearch && matchesWh && matchesStatus;
  });

  const totalPages = Math.ceil(filteredGR.length / ITEMS_PER_PAGE);
  const paginatedGR = filteredGR.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  return (
    <DashboardLayout title="Goods Receipts Global">
      <div className="superadmin-container">

        {/* Alerts */}
        {error && (
          <div style={{ padding: "12px 18px", background: "var(--status-danger-bg)", border: "1.5px solid var(--status-danger-border)", color: "var(--status-danger-text)", borderRadius: "8px", fontWeight: "600", display: "flex", alignItems: "center", gap: "8px", marginBottom: "20px" }}>
            <AlertTriangle size={18} /> {error}
          </div>
        )}
        {successMsg && (
          <div style={{ padding: "12px 18px", background: "var(--status-success-bg)", border: "1.5px solid var(--status-success-border)", color: "var(--status-success-text)", borderRadius: "8px", fontWeight: "600", display: "flex", alignItems: "center", gap: "8px", marginBottom: "20px" }}>
            <Check size={18} /> {successMsg}
          </div>
        )}

        {/* Search & Filters */}
        <div className="search-bar">
          <div className="search-input-wrap">
            <Search size={16} className="search-icon" />
            <input
              type="text"
              placeholder="Cari nomor GR atau vendor..."
              value={grSearch}
              onChange={(e) => setGrSearch(e.target.value)}
            />
          </div>
          <select
            className="filter-select"
            value={grWarehouseFilter}
            onChange={(e) => setGrWarehouseFilter(e.target.value)}
          >
            <option value="All Warehouses">Semua Warehouse</option>
            {warehouses.map(w => (
              <option key={w.warehouse_id} value={String(w.warehouse_id)}>{w.warehouse_name}</option>
            ))}
          </select>
          <select
            className="filter-select"
            value={grStatusFilter}
            onChange={(e) => setGrStatusFilter(e.target.value)}
          >
            <option value="All Status">Semua Status</option>
            <option value="Completed">Completed</option>
            <option value="Pending QC">Pending QC</option>
            <option value="Partial">Partial</option>
            <option value="Rejected">Rejected</option>
          </select>
          <button className="btn btn-outline" onClick={loadData} title="Refresh Data" style={{ height: "38px" }}>
            <RefreshCw size={14} style={{ animation: loading ? "spin 2s linear infinite" : "none" }} />
          </button>
        </div>

        {/* GR Table */}
        <div className="panel" style={{ padding: "0", overflow: "hidden" }}>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Nomor GR</th>
                  <th>Tanggal Penerimaan</th>
                  <th>Warehouse</th>
                  <th>Nama Vendor</th>
                  <th>Total SKU</th>
                  <th>Penerima (QC)</th>
                  <th>Status</th>
                  <th>Catatan</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="9" style={{ textAlign: "center", color: "var(--text-muted)", padding: "40px" }}>
                      Memuat data Goods Receipt...
                    </td>
                  </tr>
                ) : paginatedGR.length === 0 ? (
                  <tr>
                    <td colSpan="9" style={{ textAlign: "center", color: "var(--text-muted)", padding: "30px" }}>
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "10px" }}>
                        <Package size={32} style={{ color: "var(--text-muted)" }} />
                        <span>Tidak ada transaksi Good Receipt yang cocok.</span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginatedGR.map((gr) => (
                    <tr key={gr.gr_id}>
                      <td><strong>{gr.gr_number}</strong></td>
                      <td>{gr.receipt_date}</td>
                      <td>{gr.warehouse_name}</td>
                      <td>{gr.vendor_name}</td>
                      <td>{gr.items_count} SKU</td>
                      <td>{gr.received_by}</td>
                      <td>
                        <span className={getGRStatusBadge(gr.status).className}>
                          {getGRStatusBadge(gr.status).icon} {gr.status}
                        </span>
                      </td>
                      <td style={{ maxWidth: "150px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {gr.notes || "-"}
                      </td>
                      <td>
                        <button
                          className="btn btn-edit btn-sm"
                          onClick={() => openEditDrawer(gr)}
                          style={{ display: "flex", alignItems: "center", gap: "4px" }}
                        >
                          <Edit2 size={12} /> Edit Status
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer */}
          {!loading && totalPages > 1 && (
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 20px", borderTop: "1px solid var(--border-color)", background: "var(--table-header-bg)", flexWrap: "wrap", gap: "10px" }}>
              <span style={{ fontSize: "12px", color: "var(--text-muted)", fontWeight: "bold" }}>
                Menampilkan Halaman {currentPage} dari {totalPages}
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
          )}
        </div>

        {/* EDIT MODAL */}
        {editDrawerOpen && (
          <div className="modal-overlay">
            <div className="sa-modal">
              <div className="sa-modal-header">
                <h3>Edit Goods Receipt</h3>
                <button onClick={() => setEditDrawerOpen(false)} style={{ display: "flex", alignItems: "center", justifyContent: "center" }}><X size={16} /></button>
              </div>
              <form onSubmit={handleEditSubmit}>
                <div className="sa-modal-body">
                  <div className="form-group">
                    <label>Nomor Goods Receipt</label>
                    <input type="text" disabled style={{ background: "var(--border-color)", cursor: "not-allowed" }} value={editData.gr_number} />
                  </div>
                  <div className="form-group">
                    <label>Status QC / Verifikasi</label>
                    <select value={editData.status} onChange={(e) => setEditData({...editData, status: e.target.value})}>
                      <option value="Completed">Completed</option>
                      <option value="Pending QC">Pending QC</option>
                      <option value="Partial">Partial</option>
                      <option value="Rejected">Rejected</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Catatan Admin</label>
                    <textarea value={editData.notes} placeholder="Masukkan catatan perubahan status atau informasi tambahan..." onChange={(e) => setEditData({...editData, notes: e.target.value})} />
                  </div>
                </div>
                <div className="sa-modal-footer">
                  <button type="button" className="btn btn-outline" onClick={() => setEditDrawerOpen(false)}>Batal</button>
                  <button type="submit" className="btn btn-primary">Simpan Perubahan</button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </DashboardLayout>
  );
}

export default SuperadminGoodsReceipts;
