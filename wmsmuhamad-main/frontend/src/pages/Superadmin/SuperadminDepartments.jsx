import React, { useEffect, useState } from "react";
import DashboardLayout from "../../layout/DashboardLayout";
import api from "../../services/api";
import {
  Users,
  Search,
  Trash2,
  Edit2,
  Check,
  X,
  Plus,
  AlertTriangle,
  RefreshCw,
  Briefcase,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import "../../styles/superadmin.css";

function SuperadminDepartments() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const [departments, setDepartments] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  // Modals & Drawer State
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editDrawerOpen, setEditDrawerOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  // Form State
  const [deptForm, setDeptForm] = useState({
    department_name: "",
    head_name: "",
    is_active: true
  });

  const [editData, setEditData] = useState({});

  useEffect(() => {
    document.title = "Departments | WMS Super Admin";
    loadData();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await api.get("/superadmin/departments");
      if (res.data && res.data.status === "success") {
        setDepartments(res.data.data);
      }
    } catch (err) {
      console.error("Error loading departments:", err);
      setError("Gagal memuat divisi departemen.");
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

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        department_name: deptForm.department_name,
        head_name: deptForm.head_name,
        is_active: deptForm.is_active
      };

      const res = await api.post("/superadmin/departments", payload);
      if (res.data && res.data.status === "success") {
        showToast("Departemen baru berhasil dibuat.");
        setAddModalOpen(false);
        setDeptForm({
          department_name: "",
          head_name: "",
          is_active: true
        });
        loadData();
      }
    } catch (err) {
      showToast(err.response?.data?.message || "Gagal membuat departemen baru.", false);
    }
  };

  const openEditDrawer = (d) => {
    setEditData({
      department_id: d.department_id,
      department_name: d.department_name,
      head_name: d.head_name || "",
      is_active: d.is_active
    });
    setEditDrawerOpen(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        department_name: editData.department_name,
        head_name: editData.head_name,
        is_active: editData.is_active
      };

      const res = await api.put(`/superadmin/departments/${editData.department_id}`, payload);
      if (res.data && res.data.status === "success") {
        showToast("Data departemen berhasil diperbarui.");
        setEditDrawerOpen(false);
        loadData();
      }
    } catch (err) {
      showToast(err.response?.data?.message || "Gagal memperbarui departemen.", false);
    }
  };

  const triggerDelete = (department_id, name) => {
    setDeleteTarget({ department_id, name });
    setDeleteModalOpen(true);
  };

  const executeDelete = async () => {
    if (!deleteTarget) return;
    try {
      const res = await api.delete(`/superadmin/departments/${deleteTarget.department_id}`);
      if (res.data && res.data.status === "success") {
        showToast("Departemen berhasil dihapus.");
        setDeleteModalOpen(false);
        setDeleteTarget(null);
        loadData();
      }
    } catch (err) {
      showToast("Gagal menghapus departemen.", false);
    }
  };

  const filteredDepts = departments.filter((d) =>
    d.department_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (d.head_name && d.head_name.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const totalPages = Math.ceil(filteredDepts.length / ITEMS_PER_PAGE);
  const paginatedDepts = filteredDepts.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  return (
    <DashboardLayout title="Departments">
      <div className="superadmin-container">
        {/* Banner Alert Toast */}
        {successMsg && <div className="banner-alert success">{successMsg}</div>}
        {error && <div className="banner-alert danger">{error}</div>}

        {/* Filter Toolbar */}
        <div className="search-bar">
          <div className="search-input-wrap">
            <Search size={16} className="search-icon" />
            <input
              type="text"
              placeholder="Cari nama departemen atau kepala divisi..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <button className="btn btn-outline" onClick={loadData} title="Refresh Data" style={{ height: "38px" }}>
            <RefreshCw size={14} />
          </button>
          <button className="btn btn-primary" onClick={() => setAddModalOpen(true)}>
            <Plus size={16} /> Tambah Departemen
          </button>
        </div>

        {/* Departments Table Bento Panel */}
        <div className="panel" style={{ padding: "0", overflow: "hidden" }}>
          <div className="table-wrap">
            {loading ? (
              <div style={{ textAlign: "center", padding: "40px", color: "var(--text-muted)" }}>
                Memuat data departemen...
              </div>
            ) : filteredDepts.length === 0 ? (
              <div style={{ textAlign: "center", padding: "40px", color: "var(--text-muted)" }}>
                Tidak ada data departemen yang cocok.
              </div>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>ID Divisi</th>
                    <th>Nama Departemen</th>
                    <th>Kepala Departemen (Head)</th>
                    <th>Status Keaktifan</th>
                    <th>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedDepts.map((d) => (
                    <tr key={d.department_id}>
                      <td><strong>#DEPT-{d.department_id}</strong></td>
                      <td>
                        <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                          <Briefcase size={14} style={{ color: "var(--text-muted)" }} /> {d.department_name}
                        </span>
                      </td>
                      <td>{d.head_name || <span style={{ color: "var(--text-muted)" }}>Belum ditentukan</span>}</td>
                      <td>
                        <span className={`badge ${d.is_active ? 'badge-success' : 'badge-danger'}`}>
                          {d.is_active ? "Aktif" : "Nonaktif"}
                        </span>
                      </td>
                      <td>
                        <div className="action-group">
                          <button
                            className="btn btn-edit btn-sm"
                            onClick={() => openEditDrawer(d)}
                            title="Edit"
                          >
                            <Edit2 size={12} />
                          </button>
                          <button
                            className="btn btn-del btn-sm"
                            onClick={() => triggerDelete(d.department_id, d.department_name)}
                            title="Hapus"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
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

        {/* ADD DEPARTMENT MODAL */}
        {addModalOpen && (
          <div className="modal-overlay">
            <div className="sa-modal">
              <div className="sa-modal-header">
                <h3>Tambah Departemen Baru</h3>
                <button onClick={() => setAddModalOpen(false)} style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <X size={16} />
                </button>
              </div>
              <form onSubmit={handleCreateSubmit}>
                <div className="sa-modal-body">
                  <div className="form-group">
                    <label>Nama Departemen <span style={{ color: "red" }}>*</span></label>
                    <input
                      type="text"
                      required
                      placeholder="Contoh: Divisi IT, Divisi Purchasing"
                      value={deptForm.department_name}
                      onChange={(e) => setDeptForm({ ...deptForm, department_name: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label>Kepala Departemen (Head Name)</label>
                    <input
                      type="text"
                      placeholder="Contoh: Hendra Wijaya"
                      value={deptForm.head_name}
                      onChange={(e) => setDeptForm({ ...deptForm, head_name: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label>Status</label>
                    <select
                      value={deptForm.is_active ? "true" : "false"}
                      onChange={(e) => setDeptForm({ ...deptForm, is_active: e.target.value === "true" })}
                    >
                      <option value="true">Aktif</option>
                      <option value="false">Nonaktif</option>
                    </select>
                  </div>
                </div>
                <div className="sa-modal-footer">
                  <button type="button" className="btn btn-outline" onClick={() => setAddModalOpen(false)}>Batal</button>
                  <button type="submit" className="btn btn-primary">Simpan Departemen</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* EDIT MODAL */}
        {editDrawerOpen && (
          <div className="modal-overlay">
            <div className="sa-modal">
              <div className="sa-modal-header">
                <h3>Edit Departemen</h3>
                <button onClick={() => setEditDrawerOpen(false)} style={{ display: "flex", alignItems: "center", justifyContent: "center" }}><X size={16} /></button>
              </div>
              <form onSubmit={handleEditSubmit}>
                <div className="sa-modal-body">
                  <div className="form-group">
                    <label>Nama Departemen</label>
                    <input type="text" required value={editData.department_name || ""} onChange={(e) => setEditData({ ...editData, department_name: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label>Kepala Departemen</label>
                    <input type="text" value={editData.head_name || ""} onChange={(e) => setEditData({ ...editData, head_name: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label>Status Keaktifan</label>
                    <select value={editData.is_active ? "true" : "false"} onChange={(e) => setEditData({ ...editData, is_active: e.target.value === "true" })}>
                      <option value="true">Aktif</option>
                      <option value="false">Nonaktif</option>
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

        {/* DELETE MODAL */}
        {deleteModalOpen && (
          <div className="modal-overlay">
            <div className="sa-modal delete">
              <div className="sa-modal-header" style={{ borderBottom: "none" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "var(--danger-color)" }}>
                  <AlertTriangle size={20} />
                  <h3>Hapus Departemen</h3>
                </div>
                <button onClick={() => setDeleteModalOpen(false)} style={{ display: "flex", alignItems: "center", justifyContent: "center" }}><X size={16} /></button>
              </div>
              <div className="sa-modal-body">
                <p>Apakah Anda yakin ingin menghapus departemen <strong>{deleteTarget?.name}</strong>?</p>
                <p style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "8px" }}>Tindakan ini mungkin mempengaruhi relasi permohonan material (Material Request) departemen terkait.</p>
              </div>
              <div className="sa-modal-footer">
                <button className="btn btn-outline" onClick={() => setDeleteModalOpen(false)}>Batal</button>
                <button className="btn btn-danger" onClick={executeDelete}>Hapus Departemen</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

export default SuperadminDepartments;
