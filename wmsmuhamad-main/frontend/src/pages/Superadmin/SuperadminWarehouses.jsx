import React, { useEffect, useState } from "react";
import DashboardLayout from "../../layout/DashboardLayout";
import api from "../../services/api";
import {
  Building2,
  Search,
  Trash2,
  Edit2,
  Check,
  X,
  Plus,
  AlertTriangle,
  RefreshCw,
  MapPin,
  User,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import "../../styles/superadmin.css";

function SuperadminWarehouses() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const [warehouses, setWarehouses] = useState([]);
  const [usersList, setUsersList] = useState([]);

  // Search & Filters
  const [whSearch, setWhSearch] = useState("");
  const [whStatusFilter, setWhStatusFilter] = useState("All Status");
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  // Modal / Drawer state
  const [addWhModalOpen, setAddWhModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [editDrawerOpen, setEditDrawerOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  // Form state
  const [whForm, setWhForm] = useState({
    warehouse_name: "",
    address: "",
    city: "",
    capacity: 10000,
    pic_id: "",
    status: "active"
  });

  const [editData, setEditData] = useState({});

  useEffect(() => {
    document.title = "Warehouse Management | WMS Super Admin";
    loadData();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [whSearch, whStatusFilter]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError("");

      const whRes = await api.get("/superadmin/warehouses");
      if (whRes.data && whRes.data.status === "success") {
        setWarehouses(whRes.data.data);
      }

      const usersRes = await api.get("/superadmin/users");
      if (usersRes.data && usersRes.data.status === "success") {
        setUsersList(usersRes.data.data);
      }
    } catch (err) {
      console.error("Error loading warehouse data:", err);
      setError("Gagal memuat data warehouse dari server.");
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

  const getWarehouseStatusBadge = (status) => {
    switch (status) {
      case "active":
        return { className: "badge badge-success", icon: <Check size={12} />, text: "Aktif" };
      case "maintenance":
        return { className: "badge badge-warning", icon: <AlertTriangle size={12} />, text: "Perbaikan" };
      default:
        return { className: "badge badge-danger", icon: <X size={12} />, text: "Nonaktif" };
    }
  };

  const getUtilColor = (val) => {
    if (val >= 85) return "#EF4444";
    if (val >= 60) return "#F59E0B";
    return "#10B981";
  };

  // --- ACTIONS ---

  const handleCreateWhSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        warehouse_name: whForm.warehouse_name,
        address: whForm.address,
        city: whForm.city,
        capacity: Number(whForm.capacity),
        pic_id: whForm.pic_id ? Number(whForm.pic_id) : null,
        status: whForm.status
      };

      const res = await api.post("/superadmin/warehouses", payload);
      if (res.data && res.data.status === "success") {
        showToast("Warehouse baru berhasil ditambahkan.");
        setAddWhModalOpen(false);
        setWhForm({
          warehouse_name: "",
          address: "",
          city: "",
          capacity: 10000,
          pic_id: "",
          status: "active"
        });
        loadData();
      }
    } catch (err) {
      const errMsg = err.response?.data?.message || "Gagal menambahkan warehouse.";
      showToast(errMsg, false);
    }
  };

  const openEditDrawer = (data) => {
    setEditData({
      warehouse_id: data.warehouse_id,
      warehouse_name: data.warehouse_name,
      address: data.address,
      city: data.city,
      capacity: data.capacity,
      pic_id: data.pic_id || "",
      status: data.status
    });
    setEditDrawerOpen(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        warehouse_name: editData.warehouse_name,
        address: editData.address,
        city: editData.city,
        capacity: Number(editData.capacity),
        pic_id: editData.pic_id ? Number(editData.pic_id) : null,
        status: editData.status
      };

      const res = await api.put(`/superadmin/warehouses/${editData.warehouse_id}`, payload);
      if (res.data && res.data.status === "success") {
        showToast("Data warehouse berhasil diperbarui.");
        setEditDrawerOpen(false);
        loadData();
      }
    } catch (err) {
      const errMsg = err.response?.data?.message || "Gagal memperbarui data.";
      showToast(errMsg, false);
    }
  };

  const triggerDelete = (id, name) => {
    setDeleteTarget({ id, name });
    setDeleteModalOpen(true);
  };

  const executeDelete = async () => {
    if (!deleteTarget) return;
    try {
      const res = await api.delete(`/superadmin/warehouses/${deleteTarget.id}`);
      if (res.data && res.data.status === "success") {
        showToast("Warehouse berhasil dihapus.");
        setDeleteModalOpen(false);
        setDeleteTarget(null);
        loadData();
      }
    } catch (err) {
      showToast("Gagal menghapus warehouse.", false);
    }
  };

  // --- FILTERS ---

  const filteredWarehouses = warehouses.filter(wh => {
    const matchesSearch = wh.warehouse_name.toLowerCase().includes(whSearch.toLowerCase()) ||
                          wh.city.toLowerCase().includes(whSearch.toLowerCase());
    const matchesStatus = whStatusFilter === "All Status" || wh.status === whStatusFilter.toLowerCase();
    return matchesSearch && matchesStatus;
  });

  const totalPages = Math.ceil(filteredWarehouses.length / ITEMS_PER_PAGE);
  const paginatedWarehouses = filteredWarehouses.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  if (loading) {
    return (
      <DashboardLayout title="Warehouse Management">
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "60vh", fontSize: "16px", fontWeight: "600", color: "#2c4fdb" }}>
          <RefreshCw size={20} style={{ animation: "spin 2s linear infinite", marginRight: "10px" }} /> Memuat data warehouse...
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Warehouse Management">
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
              placeholder="Cari nama warehouse atau kota..."
              value={whSearch}
              onChange={(e) => setWhSearch(e.target.value)}
            />
          </div>
          <select
            className="filter-select"
            value={whStatusFilter}
            onChange={(e) => setWhStatusFilter(e.target.value)}
          >
            <option value="All Status">Semua Status</option>
            <option value="Active">Aktif</option>
            <option value="Maintenance">Perbaikan</option>
            <option value="Inactive">Nonaktif</option>
          </select>
          <button className="btn btn-primary" onClick={() => setAddWhModalOpen(true)}>
            <Plus size={16} /> Tambah Warehouse
          </button>
        </div>

        {/* Warehouse Grid */}
        <div className="wh-grid">
          {paginatedWarehouses.length === 0 ? (
            <div style={{ gridColumn: "1 / -1", textAlign: "center", padding: "40px", color: "var(--text-muted)", background: "var(--card-bg)", borderRadius: "12px", border: "1px solid var(--border-color)" }}>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "10px" }}>
                <Building2 size={32} style={{ color: "var(--text-muted)" }} />
                <span>Tidak ada warehouse yang cocok dengan filter.</span>
              </div>
            </div>
          ) : (
            paginatedWarehouses.map((wh) => {
              const util = wh.capacity > 0 ? Math.round((wh.total_stock / wh.capacity) * 100) : 0;
              return (
                <div className="wh-card" key={wh.warehouse_id}>
                  <div className="wh-card-left">
                    <div className="wh-header" style={{ marginBottom: 0 }}>
                      <div>
                        <div className="wh-name">{wh.warehouse_name}</div>
                        <div className="wh-location"><MapPin size={12} /> {wh.city}</div>
                      </div>
                      <span className={getWarehouseStatusBadge(wh.status).className}>
                        {getWarehouseStatusBadge(wh.status).icon} {getWarehouseStatusBadge(wh.status).text}
                      </span>
                    </div>
                    <div className="wh-pic" style={{ marginTop: "20px", borderTop: "1px solid var(--border-color)", paddingTop: "12px" }}>
                      <User size={12} /> 
                      <span>PIC: <strong>{wh.pic_name}</strong></span>
                    </div>
                  </div>

                  <div className="wh-card-right">
                    <div className="capacity-labels">
                      <span>Kapasitas</span>
                      <span style={{ fontWeight: "700", color: getUtilColor(util) }}>
                        {util}% ({wh.total_stock} / {wh.capacity} Pallets)
                      </span>
                    </div>
                    <div className="capacity-bar-track">
                      <div
                        className="capacity-bar-fill"
                        style={{
                          width: `${Math.min(util, 100)}%`,
                          backgroundColor: getUtilColor(util)
                        }}
                      />
                    </div>

                    <div className="wh-stats">
                      <div className="wh-stat">
                        <div className="wh-stat-val">{wh.gr_month_count}</div>
                        <div className="wh-stat-label">GR Bulan Ini</div>
                      </div>
                      <div className="wh-stat">
                        <div className="wh-stat-val">{wh.sku_count}</div>
                        <div className="wh-stat-label">SKU</div>
                      </div>
                      <div className="wh-stat">
                        <div className="wh-stat-val">{wh.users_count}</div>
                        <div className="wh-stat-label">Users</div>
                      </div>
                    </div>

                    <div className="wh-card-actions">
                      <button
                        className="btn btn-edit"
                        onClick={() => openEditDrawer(wh)}
                      >
                        <Edit2 size={12} /> Edit
                      </button>
                      <button
                        className="btn btn-del"
                        onClick={() => triggerDelete(wh.warehouse_id, wh.warehouse_name)}
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Pagination Footer */}
        {!loading && totalPages > 1 && (
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 20px", border: "1.5px solid var(--border-color)", background: "var(--table-header-bg)", borderRadius: "12px", marginTop: "20px", flexWrap: "wrap", gap: "10px" }}>
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

        {/* MODAL: ADD WAREHOUSE */}
        {addWhModalOpen && (
          <div className="modal-overlay">
            <div className="modal-box">
              <button className="modal-close-btn" onClick={() => setAddWhModalOpen(false)} style={{ display: "flex", alignItems: "center", justifyContent: "center" }}><X size={16} /></button>
              <div className="modal-title">Tambah Warehouse Baru</div>
              <div className="modal-sub">Daftarkan fasilitas penyimpanan baru ke dalam sistem logistik.</div>

              <form onSubmit={handleCreateWhSubmit}>
                <div style={{ display: "flex", flexDirection: "column", gap: "12px", flex: 1, overflowY: "auto", paddingRight: "4px" }}>
                  <div className="form-group">
                    <label>Nama Warehouse</label>
                    <input
                      id="wh_name"
                      type="text"
                      required
                      placeholder="Contoh: Warehouse Jakarta Timur"
                      value={whForm.warehouse_name}
                      onChange={(e) => setWhForm({...whForm, warehouse_name: e.target.value})}
                    />
                  </div>
                  <div className="form-group">
                    <label>Alamat Lengkap</label>
                    <input
                      id="wh_address"
                      type="text"
                      required
                      value={whForm.address}
                      onChange={(e) => setWhForm({...whForm, address: e.target.value})}
                    />
                  </div>
                  <div className="form-grid" style={{ gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                    <div className="form-group">
                      <label>Kota</label>
                      <input
                        id="wh_city"
                        type="text"
                        required
                        value={whForm.city}
                        onChange={(e) => setWhForm({...whForm, city: e.target.value})}
                      />
                    </div>
                    <div className="form-group">
                      <label>Kapasitas (Pallet)</label>
                      <input
                        id="wh_capacity"
                        type="number"
                        required
                        min="0"
                        value={whForm.capacity}
                        onChange={(e) => setWhForm({...whForm, capacity: e.target.value})}
                      />
                    </div>
                  </div>
                  <div className="form-grid" style={{ gridTemplateColumns: "1.2fr 0.8fr", gap: "10px" }}>
                    <div className="form-group">
                      <label>PIC Penanggungjawab</label>
                      <select
                        id="wh_pic"
                        value={whForm.pic_id}
                        onChange={(e) => setWhForm({...whForm, pic_id: e.target.value})}
                      >
                        <option value="">Belum Ditentukan</option>
                        {usersList.map(u => (
                          <option key={u.id} value={u.id}>{u.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Status</label>
                      <select
                        id="wh_status"
                        value={whForm.status}
                        onChange={(e) => setWhForm({...whForm, status: e.target.value})}
                      >
                        <option value="active">Aktif</option>
                        <option value="maintenance">Perbaikan</option>
                        <option value="inactive">Nonaktif</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="modal-actions">
                  <button type="button" className="btn btn-outline" onClick={() => setAddWhModalOpen(false)}>Batal</button>
                  <button type="submit" className="btn btn-primary">Simpan</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL: DELETE CONFIRMATION */}
        {deleteModalOpen && deleteTarget && (
          <div className="modal-overlay">
            <div className="modal-box">
              <div className="modal-title" style={{ color: "var(--danger)" }}>Hapus Warehouse?</div>
              <div className="modal-sub">
                Apakah Anda yakin ingin menghapus <strong>{deleteTarget.name}</strong>? Tindakan ini bersifat permanen dan tidak dapat dibatalkan.
              </div>
              <div className="modal-actions">
                <button className="btn btn-outline" onClick={() => { setDeleteModalOpen(false); setDeleteTarget(null); }}>Batal</button>
                <button className="btn btn-primary" style={{ background: "var(--danger)" }} onClick={executeDelete}>Ya, Hapus</button>
              </div>
            </div>
          </div>
        )}

        {/* EDIT MODAL */}
        {editDrawerOpen && (
          <div className="modal-overlay">
            <div className="sa-modal">
              <div className="sa-modal-header">
                <h3>Edit Warehouse</h3>
                <button onClick={() => setEditDrawerOpen(false)} style={{ display: "flex", alignItems: "center", justifyContent: "center" }}><X size={16} /></button>
              </div>
              <form onSubmit={handleEditSubmit}>
                <div className="sa-modal-body">
                  <div className="form-group">
                    <label>Nama Warehouse</label>
                    <input type="text" required value={editData.warehouse_name} onChange={(e) => setEditData({...editData, warehouse_name: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label>Alamat Lengkap</label>
                    <textarea required value={editData.address} onChange={(e) => setEditData({...editData, address: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label>Kota</label>
                    <input type="text" required value={editData.city} onChange={(e) => setEditData({...editData, city: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label>Kapasitas (Pallet)</label>
                    <input type="number" required min="0" value={editData.capacity} onChange={(e) => setEditData({...editData, capacity: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label>PIC Penanggungjawab</label>
                    <select value={editData.pic_id} onChange={(e) => setEditData({...editData, pic_id: e.target.value})}>
                      <option value="">Belum Ditentukan</option>
                      {usersList.map(u => (
                        <option key={u.id} value={u.id}>{u.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Status</label>
                    <select value={editData.status} onChange={(e) => setEditData({...editData, status: e.target.value})}>
                      <option value="active">Aktif</option>
                      <option value="maintenance">Perbaikan</option>
                      <option value="inactive">Nonaktif</option>
                    </select>
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

export default SuperadminWarehouses;
