import React, { useEffect, useState } from "react";
import DashboardLayout from "../../layout/DashboardLayout";
import api from "../../services/api";
import authService from "../../services/authService";
import {
  Building2,
  Users,
  Search,
  Trash2,
  Edit2,
  Check,
  X,
  Plus,
  AlertTriangle,
  RefreshCw,
  User,
  Clock,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import "../../styles/superadmin.css";

function SuperadminUsers() {
  const currentUser = authService.getCurrentUser();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const [warehouses, setWarehouses] = useState([]);
  const [usersList, setUsersList] = useState([]);
  const [rolesList, setRolesList] = useState([]);

  // Search & Filters
  const [userSearch, setUserSearch] = useState("");
  const [userRoleFilter, setUserRoleFilter] = useState("All Roles");
  const [userWarehouseFilter, setUserWarehouseFilter] = useState("All Warehouses");
  const [userStatusFilter, setUserStatusFilter] = useState("All Status");
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  // Modal / Drawer state
  const [addUserModalOpen, setAddUserModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [editDrawerOpen, setEditDrawerOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  // Form state
  const [userForm, setUserForm] = useState({
    name: "",
    email: "",
    password: "",
    role_id: "2",
    warehouse_id: "",
    status: "active"
  });

  const [editData, setEditData] = useState({});

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

  useEffect(() => {
    document.title = "User Management | WMS Super Admin";
    loadData();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [userSearch, userRoleFilter, userWarehouseFilter, userStatusFilter]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError("");

      const rolesRes = await api.get("/master/roles");
      if (rolesRes.data && rolesRes.data.status === "success") {
        setRolesList(rolesRes.data.data);
      }

      const whRes = await api.get("/superadmin/warehouses");
      if (whRes.data && whRes.data.status === "success") {
        setWarehouses(whRes.data.data);
      }

      const usersRes = await api.get("/superadmin/users");
      if (usersRes.data && usersRes.data.status === "success") {
        setUsersList(usersRes.data.data);
      }
    } catch (err) {
      console.error("Error loading user data:", err);
      setError("Gagal memuat data pengguna dari server.");
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

  // --- ACTIONS ---

  const handleActivateUser = async (id, name) => {
    try {
      const res = await api.post(`/superadmin/users/${id}/activate`);
      if (res.data && res.data.status === "success") {
        showToast(`User ${name} berhasil diaktifkan.`);
        loadData();
      }
    } catch (err) {
      showToast("Gagal mengaktifkan user.", false);
    }
  };

  const handleDeactivateUser = async (id, name) => {
    if (window.confirm(`Apakah Anda yakin ingin menonaktifkan user ${name}?`)) {
      try {
        const res = await api.post(`/superadmin/users/${id}/deactivate`);
        if (res.data && res.data.status === "success") {
          showToast(`User ${name} berhasil dinonaktifkan.`);
          loadData();
        }
      } catch (err) {
        showToast(err.response?.data?.message || "Gagal menonaktifkan user.", false);
      }
    }
  };

  const handleRejectUser = async (id, name) => {
    if (window.confirm(`Apakah Anda yakin ingin menolak & menghapus pendaftaran ${name}?`)) {
      try {
        const res = await api.post(`/superadmin/users/${id}/reject`);
        if (res.data && res.data.status === "success") {
          showToast(`Pendaftaran ${name} telah ditolak dan dihapus.`);
          loadData();
        }
      } catch (err) {
        showToast("Gagal menolak pendaftaran user.", false);
      }
    }
  };

  const handleCreateUserSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        name: userForm.name,
        email: userForm.email,
        password: userForm.password,
        role_id: Number(userForm.role_id),
        warehouse_id: userForm.warehouse_id ? Number(userForm.warehouse_id) : null,
        status: userForm.status
      };

      const res = await api.post("/superadmin/users", payload);
      if (res.data && res.data.status === "success") {
        showToast("User baru berhasil dibuat.");
        setAddUserModalOpen(false);
        setUserForm({
          name: "",
          email: "",
          password: "",
          role_id: "2",
          warehouse_id: "",
          status: "active"
        });
        loadData();
      }
    } catch (err) {
      const errMsg = err.response?.data?.message || "Gagal membuat user baru.";
      showToast(errMsg, false);
    }
  };

  const openEditDrawer = (data) => {
    setEditData({
      id: data.id,
      name: data.name,
      email: data.email,
      role_id: data.role_id,
      warehouse_id: data.warehouse_id || "",
      status: data.status,
      password: ""
    });
    setEditDrawerOpen(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        name: editData.name,
        email: editData.email,
        role_id: Number(editData.role_id),
        warehouse_id: editData.warehouse_id ? Number(editData.warehouse_id) : null,
        status: editData.status
      };
      if (editData.password) {
        payload.password = editData.password;
      }

      const res = await api.put(`/superadmin/users/${editData.id}`, payload);
      if (res.data && res.data.status === "success") {
        showToast("Data user berhasil diperbarui.");
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
      const res = await api.delete(`/superadmin/users/${deleteTarget.id}`);
      if (res.data && res.data.status === "success") {
        showToast("User berhasil dihapus.");
        setDeleteModalOpen(false);
        setDeleteTarget(null);
        loadData();
      }
    } catch (err) {
      showToast("Gagal menghapus user.", false);
    }
  };

  // --- FILTERS ---

  const filteredUsers = usersList.filter(u => {
    const matchesSearch = u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
                          u.email.toLowerCase().includes(userSearch.toLowerCase());
    const matchesRole = userRoleFilter === "All Roles" || String(u.role_id) === userRoleFilter;
    const matchesWh = userWarehouseFilter === "All Warehouses" || String(u.warehouse_id) === userWarehouseFilter;
    const matchesStatus = userStatusFilter === "All Status" || u.status === userStatusFilter.toLowerCase();
    return matchesSearch && matchesRole && matchesWh && matchesStatus;
  });

  const totalPages = Math.ceil(filteredUsers.length / ITEMS_PER_PAGE);
  const paginatedUsers = filteredUsers.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  if (loading) {
    return (
      <DashboardLayout title="User Management">
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "60vh", fontSize: "16px", fontWeight: "600", color: "#2c4fdb" }}>
          <RefreshCw size={20} style={{ animation: "spin 2s linear infinite", marginRight: "10px" }} /> Memuat data pengguna...
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="User Management">
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
              placeholder="Cari nama user atau email..."
              value={userSearch}
              onChange={(e) => setUserSearch(e.target.value)}
            />
          </div>
          <select
            className="filter-select"
            value={userRoleFilter}
            onChange={(e) => setUserRoleFilter(e.target.value)}
          >
            <option value="All Roles">Semua Role</option>
            {rolesList.map(r => (
              <option key={r.role_id} value={String(r.role_id)}>{r.role_name}</option>
            ))}
          </select>
          <select
            className="filter-select"
            value={userWarehouseFilter}
            onChange={(e) => setUserWarehouseFilter(e.target.value)}
          >
            <option value="All Warehouses">Semua Warehouse</option>
            {warehouses.map(w => (
              <option key={w.warehouse_id} value={String(w.warehouse_id)}>{w.warehouse_name}</option>
            ))}
          </select>
          <select
            className="filter-select"
            value={userStatusFilter}
            onChange={(e) => setUserStatusFilter(e.target.value)}
          >
            <option value="All Status">Semua Status</option>
            <option value="Active">Aktif</option>
            <option value="Inactive">Nonaktif</option>
          </select>
          <button className="btn btn-primary" onClick={() => setAddUserModalOpen(true)}>
            <Plus size={16} /> Tambah User
          </button>
        </div>

        {/* Users Table */}
        <div className="panel" style={{ padding: "0", overflow: "hidden" }}>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Nama User</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Warehouse</th>
                  <th>Status</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {paginatedUsers.length === 0 ? (
                  <tr>
                    <td colSpan="6" style={{ textAlign: "center", color: "var(--text-muted)", padding: "30px" }}>
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "10px" }}>
                        <Users size={32} style={{ color: "var(--text-muted)" }} />
                        <span>Tidak ada pengguna yang cocok.</span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginatedUsers.map((u) => (
                    <tr key={u.id}>
                      <td><strong>{u.name}</strong></td>
                      <td>{u.email}</td>
                      <td>
                        <span className={`badge badge-${
                          u.role_id === 1 ? 'purple' :
                          u.role_id === 2 ? 'info' :
                          u.role_id === 3 ? 'teal' : 'gray'
                        }`}>
                          {u.role_id === 1 ? <Building2 size={11} /> : <User size={11} />} {u.role ? u.role.role_name : "Super Admin"}
                        </span>
                      </td>
                      <td>{u.warehouse ? u.warehouse.warehouse_name : "Multi-Warehouse / Global"}</td>
                      <td>
                        <span className={getUserStatusBadge(u.status).className}>
                          {getUserStatusBadge(u.status).icon} {getUserStatusBadge(u.status).text}
                        </span>
                      </td>
                      <td>
                        <div className="action-group">
                          {u.status === "pending" && (
                            <>
                              <button
                                className="btn btn-success btn-sm"
                                onClick={() => handleActivateUser(u.id, u.name)}
                                title="Aktifkan"
                                style={{ display: "flex", alignItems: "center", justifyContent: "center" }}
                              >
                                <Check size={14} />
                              </button>
                              <button
                                className="btn btn-danger btn-sm"
                                onClick={() => handleRejectUser(u.id, u.name)}
                                title="Tolak"
                                style={{ display: "flex", alignItems: "center", justifyContent: "center" }}
                              >
                                <X size={14} />
                              </button>
                            </>
                          )}
                          {u.status === "inactive" && (
                            <button
                              className="btn btn-success btn-sm"
                              onClick={() => handleActivateUser(u.id, u.name)}
                              title="Aktifkan"
                              style={{ display: "flex", alignItems: "center", justifyContent: "center" }}
                            >
                              <Check size={14} />
                            </button>
                          )}
                          {u.status === "active" && u.id !== currentUser.id && (
                            <button
                              className="btn btn-danger btn-sm"
                              onClick={() => handleDeactivateUser(u.id, u.name)}
                              title="Nonaktifkan"
                              style={{ display: "flex", alignItems: "center", justifyContent: "center" }}
                            >
                              <X size={14} />
                            </button>
                          )}
                          <button
                            className="btn btn-edit btn-sm"
                            onClick={() => openEditDrawer(u)}
                            title="Edit User"
                          >
                            <Edit2 size={12} />
                          </button>
                          {u.role_id !== 4 && (
                            <button
                              className="btn btn-del btn-sm"
                              onClick={() => triggerDelete(u.id, u.name)}
                              title="Hapus User"
                            >
                              <Trash2 size={12} />
                            </button>
                          )}
                        </div>
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

        {/* MODAL: ADD USER */}
        {addUserModalOpen && (
          <div className="modal-overlay">
            <div className="modal-box">
              <button className="modal-close-btn" onClick={() => setAddUserModalOpen(false)} style={{ display: "flex", alignItems: "center", justifyContent: "center" }}><X size={16} /></button>
              <div className="modal-title">Tambah User Baru</div>
              <div className="modal-sub">Buat akun staf gudang atau administrator baru.</div>

              <form onSubmit={handleCreateUserSubmit}>
                <div style={{ display: "flex", flexDirection: "column", gap: "12px", flex: 1, overflowY: "auto", paddingRight: "4px" }}>
                  <div className="form-group">
                    <label>Nama Lengkap</label>
                    <input
                      id="user_name"
                      type="text"
                      required
                      value={userForm.name}
                      onChange={(e) => setUserForm({...userForm, name: e.target.value})}
                    />
                  </div>
                  <div className="form-group">
                    <label>Alamat Email</label>
                    <input
                      id="user_email"
                      type="email"
                      required
                      value={userForm.email}
                      onChange={(e) => setUserForm({...userForm, email: e.target.value})}
                    />
                  </div>
                  <div className="form-group">
                    <label>Password</label>
                    <input
                      id="user_password"
                      type="password"
                      required
                      placeholder="Min. 8 karakter"
                      value={userForm.password}
                      onChange={(e) => setUserForm({...userForm, password: e.target.value})}
                    />
                  </div>
                  <div className="form-grid" style={{ gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                    <div className="form-group">
                      <label>Role</label>
                      <select
                        id="user_role"
                        value={userForm.role_id}
                        onChange={(e) => setUserForm({...userForm, role_id: e.target.value})}
                      >
                        {rolesList.map(r => (
                          <option key={r.role_id} value={r.role_id}>{r.role_name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Status</label>
                      <select
                        id="user_status"
                        value={userForm.status}
                        onChange={(e) => setUserForm({...userForm, status: e.target.value})}
                      >
                        <option value="active">Aktif</option>
                        <option value="inactive">Nonaktif</option>
                      </select>
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Warehouse Tugas</label>
                    <select
                      id="user_warehouse"
                      value={userForm.warehouse_id}
                      onChange={(e) => setUserForm({...userForm, warehouse_id: e.target.value})}
                    >
                      <option value="">Multi-Warehouse / Global</option>
                      {warehouses.map(w => (
                        <option key={w.warehouse_id} value={w.warehouse_id}>{w.warehouse_name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="modal-actions">
                  <button type="button" className="btn btn-outline" onClick={() => setAddUserModalOpen(false)}>Batal</button>
                  <button type="submit" className="btn btn-primary">Buat Akun</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL: DELETE CONFIRMATION */}
        {deleteModalOpen && deleteTarget && (
          <div className="modal-overlay">
            <div className="modal-box">
              <div className="modal-title" style={{ color: "var(--danger)" }}>Hapus User?</div>
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
                <h3>Edit User</h3>
                <button onClick={() => setEditDrawerOpen(false)} style={{ display: "flex", alignItems: "center", justifyContent: "center" }}><X size={16} /></button>
              </div>
              <form onSubmit={handleEditSubmit}>
                <div className="sa-modal-body">
                  <div className="form-group">
                    <label>Nama Lengkap</label>
                    <input
                      type="text"
                      required
                      value={editData.name}
                      onChange={(e) => setEditData({...editData, name: e.target.value})}
                    />
                  </div>
                  <div className="form-group">
                    <label>Alamat Email</label>
                    <input
                      type="email"
                      required
                      value={editData.email}
                      onChange={(e) => setEditData({...editData, email: e.target.value})}
                    />
                  </div>
                  <div className="form-group">
                    <label>Password Baru (Opsional)</label>
                    <input
                      type="password"
                      placeholder="Kosongkan jika tidak ingin diubah"
                      value={editData.password || ""}
                      onChange={(e) => setEditData({...editData, password: e.target.value})}
                    />
                  </div>
                  <div className="form-group">
                    <label>Role</label>
                    <select
                      value={editData.role_id}
                      onChange={(e) => setEditData({...editData, role_id: e.target.value})}
                    >
                      {rolesList.map(r => (
                        <option key={r.role_id} value={r.role_id}>{r.role_name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Warehouse</label>
                    <select
                      value={editData.warehouse_id}
                      onChange={(e) => setEditData({...editData, warehouse_id: e.target.value})}
                    >
                      <option value="">Multi-Warehouse / Global</option>
                      {warehouses.map(w => (
                        <option key={w.warehouse_id} value={w.warehouse_id}>{w.warehouse_name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Status</label>
                    <select
                      value={editData.status}
                      onChange={(e) => setEditData({...editData, status: e.target.value})}
                      disabled={editData.id === currentUser.id}
                    >
                      <option value="active">Aktif</option>
                      <option value="inactive">Nonaktif</option>
                    </select>
                    {editData.id === currentUser.id && (
                      <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "4px" }}>
                        Anda tidak dapat menonaktifkan akun Anda sendiri.
                      </div>
                    )}
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

export default SuperadminUsers;
