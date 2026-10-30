import React, { useEffect, useState } from "react";
import DashboardLayout from "../../layout/DashboardLayout";
import api from "../../services/api";
import authService from "../../services/authService";
import {
  Building2,
  Users,
  PackageCheck,
  AlertTriangle,
  Check,
  X,
  Edit2,
  RefreshCw,
  User,
  Package,
  Clock
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import "../../styles/superadmin.css";

function SuperadminPage() {
  const currentUser = authService.getCurrentUser();
  const navigate = useNavigate();

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

  const getUserStatusBadge = (status) => {
    switch (status) {
      case "active":
        return { className: "badge badge-success", icon: <Check size={12} />, text: "Aktif" };
      case "pending":
        return { className: "badge badge-warning", icon: <Clock size={12} />, text: "Pending" };
      default:
        return { className: "badge badge-danger", icon: <X size={12} />, text: "Nonaktif" };
    }
  };

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const [dashboardData, setDashboardData] = useState(null);
  const [usersList, setUsersList] = useState([]);

  // Edit Drawer for GR status
  const [editDrawerOpen, setEditDrawerOpen] = useState(false);
  const [editData, setEditData] = useState({});

  useEffect(() => {
    document.title = "Super Admin Dashboard | WMS";
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      setError("");

      const summaryRes = await api.get("/superadmin/dashboard-summary");
      if (summaryRes.data && summaryRes.data.status === "success") {
        setDashboardData(summaryRes.data.data);
      }

      const usersRes = await api.get("/superadmin/users");
      if (usersRes.data && usersRes.data.status === "success") {
        setUsersList(usersRes.data.data);
      }
    } catch (err) {
      console.error("Error loading superadmin data:", err);
      setError("Gagal memuat data dari server. Pastikan API backend berjalan.");
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

  // User activation from dashboard quick actions
  const handleActivateUser = async (id, name) => {
    try {
      const res = await api.post(`/superadmin/users/${id}/activate`);
      if (res.data && res.data.status === "success") {
        showToast(`User ${name} berhasil diaktifkan.`);
        loadInitialData();
      }
    } catch (err) {
      showToast("Gagal mengaktifkan user.", false);
    }
  };

  const handleRejectUser = async (id, name) => {
    if (window.confirm(`Apakah Anda yakin ingin menolak & menghapus pendaftaran ${name}?`)) {
      try {
        const res = await api.post(`/superadmin/users/${id}/reject`);
        if (res.data && res.data.status === "success") {
          showToast(`Pendaftaran ${name} telah ditolak dan dihapus.`);
          loadInitialData();
        }
      } catch (err) {
        showToast("Gagal menolak pendaftaran user.", false);
      }
    }
  };

  // GR Status edit
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
        loadInitialData();
      }
    } catch (err) {
      const errMsg = err.response?.data?.message || "Gagal memperbarui data.";
      showToast(errMsg, false);
    }
  };

  const pendingUsers = usersList.filter(u => u.status === "pending");

  const getUtilColor = (val) => {
    if (val >= 85) return "#EF4444";
    if (val >= 60) return "#F59E0B";
    return "#10B981";
  };

  if (loading && !dashboardData) {
    return (
      <DashboardLayout title="Super Admin Dashboard">
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "60vh", fontSize: "16px", fontWeight: "600", color: "#2c4fdb" }}>
          <RefreshCw size={20} style={{ animation: "spin 2s linear infinite", marginRight: "10px" }} /> Memuat dashboard Super Admin...
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Super Admin Dashboard">
      <div className="superadmin-container">

        {/* Alerts / Toast Messages */}
        {error && (
          <div style={{ padding: "12px 18px", background: "var(--status-danger-bg)", border: "1.5px solid var(--status-danger-border)", color: "var(--status-danger-text)", borderRadius: "8px", fontWeight: "600", display: "flex", alignItems: "center", gap: "8px" }}>
            <AlertTriangle size={18} /> {error}
          </div>
        )}
        {successMsg && (
          <div style={{ padding: "12px 18px", background: "var(--status-success-bg)", border: "1.5px solid var(--status-success-border)", color: "var(--status-success-text)", borderRadius: "8px", fontWeight: "600", display: "flex", alignItems: "center", gap: "8px" }}>
            <Check size={18} /> {successMsg}
          </div>
        )}

        {/* Dashboard Content */}
        {dashboardData && (
          <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            {/* Stats Summary Cards */}
            <div className="stats-grid">
              <div className="stat-card blue">
                <div className="stat-label">Total Warehouse</div>
                <div className="stat-value">{dashboardData.total_warehouses}</div>
                <div className="stat-sub">
                  <span style={{color:"#10B981", fontWeight:"700"}}>{dashboardData.active_warehouses} Aktif</span> • {dashboardData.maintenance_warehouses} Perbaikan
                </div>
              </div>
              <div className="stat-card green">
                <div className="stat-label">Good Receipts Bulan Ini</div>
                <div className="stat-value">{dashboardData.current_month_gr}</div>
                <div className="stat-sub">Semua Logistik Lintas Hub</div>
              </div>
              <div className="stat-card purple">
                <div className="stat-label">Total Pengguna</div>
                <div className="stat-value">{dashboardData.total_users}</div>
                <div className="stat-sub">
                  <span style={{color:"#10B981", fontWeight:"700"}}>{dashboardData.active_users} Aktif</span> • {dashboardData.pending_users_count} Pending
                </div>
              </div>
              <div className="stat-card red">
                <div className="stat-label">Stock Alerts</div>
                <div className="stat-value">{dashboardData.stock_alert_count}</div>
                <div className="stat-sub">SKU mendekati batas minimum</div>
              </div>
            </div>

            {/* Dashboard Grid */}
            <div className="dashboard-grid">
              {/* Left Column: Warehouse Capacity */}
              <div className="card">
                <div className="card-header">
                  <div className="card-title">Kapasitas Warehouse</div>
                  <button className="btn btn-outline btn-sm" onClick={() => navigate("/superadmin/warehouses")}>Manage →</button>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  {dashboardData.warehouses_capacity?.map((wh) => (
                    <div key={wh.warehouse_id}>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", fontWeight: "700", marginBottom: "4px" }}>
                        <span>{wh.warehouse_name}</span>
                        <span style={{ color: getUtilColor(wh.utilization) }}>{wh.utilization}%</span>
                      </div>
                      <div className="capacity-bar-track">
                        <div
                          className="capacity-bar-fill"
                          style={{
                            width: `${Math.min(wh.utilization, 100)}%`,
                            backgroundColor: getUtilColor(wh.utilization)
                          }}
                        />
                      </div>
                      <div className="capacity-labels">
                        <span>0</span>
                        <span>{wh.total_stock.toLocaleString('en-US')} / {wh.capacity.toLocaleString('en-US')} pallet</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right Column: User Pending Activation */}
              <div className="panel">
                <div className="panel-header">
                  <div className="panel-title">User Baru Menunggu Aktivasi</div>
                  <button className="btn btn-outline btn-sm" onClick={() => navigate("/superadmin/users")}>Manage →</button>
                </div>
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Nama</th>
                        <th>Role</th>
                        <th>Aksi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pendingUsers.length === 0 ? (
                        <tr>
                          <td colSpan="3" style={{ textAlign: "center", color: "var(--text-muted)", padding: "20px" }}>
                            Tidak ada user menunggu aktivasi.
                          </td>
                        </tr>
                      ) : (
                        pendingUsers.slice(0, 5).map((u) => (
                          <tr key={u.id}>
                            <td>
                              <strong>{u.name}</strong>
                              <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>{u.email}</div>
                            </td>
                            <td>
                              <span className={`badge badge-${u.role_id === 1 ? 'purple' : u.role_id === 3 ? 'teal' : 'info'}`}>
                                {u.role_id === 1 ? <Building2 size={11} /> : <User size={11} />} {u.role ? u.role.role_name : "PIC"}
                              </span>
                            </td>
                            <td>
                              <div className="action-group">
                                <button
                                  className="btn btn-success btn-sm"
                                  onClick={() => handleActivateUser(u.id, u.name)}
                                  title="Aktifkan Akun"
                                  style={{ display: "flex", alignItems: "center", justifyContent: "center" }}
                                >
                                  <Check size={14} />
                                </button>
                                <button
                                  className="btn btn-danger btn-sm"
                                  onClick={() => handleRejectUser(u.id, u.name)}
                                  title="Tolak & Hapus"
                                  style={{ display: "flex", alignItems: "center", justifyContent: "center" }}
                                >
                                  <X size={14} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Bottom Panel: Recent Goods Receipts */}
            <div className="panel">
              <div className="panel-header">
                <div className="panel-title">Good Receipts Terkini</div>
                <button className="btn btn-outline btn-sm" onClick={() => navigate("/superadmin/goods-receipts")}>Lihat Semua →</button>
              </div>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Nomor GR</th>
                      <th>Tanggal</th>
                      <th>Warehouse</th>
                      <th>Vendor</th>
                      <th>Item</th>
                      <th>Penerima</th>
                      <th>Status</th>
                      <th>Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dashboardData.recent_goods_receipts?.length === 0 ? (
                      <tr>
                        <td colSpan="8" style={{ textAlign: "center", color: "var(--text-muted)", padding: "20px" }}>
                          Belum ada transaksi Good Receipt.
                        </td>
                      </tr>
                    ) : (
                      dashboardData.recent_goods_receipts?.map((gr) => (
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
                          <td>
                            <div className="action-group">
                              <button
                                className="btn btn-edit btn-sm"
                                onClick={() => openEditDrawer(gr)}
                              >
                                <Edit2 size={12} /> Edit Status
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* EDIT MODAL for GR */}
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
                    <input
                      type="text"
                      disabled
                      style={{ background: "var(--border-color)", cursor: "not-allowed" }}
                      value={editData.gr_number}
                    />
                  </div>
                  <div className="form-group">
                    <label>Status QC / Verifikasi</label>
                    <select
                      value={editData.status}
                      onChange={(e) => setEditData({...editData, status: e.target.value})}
                    >
                      <option value="Completed">Completed</option>
                      <option value="Pending QC">Pending QC</option>
                      <option value="Partial">Partial</option>
                      <option value="Rejected">Rejected</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Catatan Admin</label>
                    <textarea
                      value={editData.notes}
                      placeholder="Masukkan catatan perubahan status atau informasi tambahan..."
                      onChange={(e) => setEditData({...editData, notes: e.target.value})}
                    />
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

export default SuperadminPage;
