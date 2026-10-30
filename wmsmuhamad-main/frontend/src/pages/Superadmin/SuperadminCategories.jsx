import React, { useEffect, useState } from "react";
import DashboardLayout from "../../layout/DashboardLayout";
import api from "../../services/api";
import {
  Package,
  Search,
  Trash2,
  Edit2,
  Check,
  X,
  Plus,
  AlertTriangle,
  RefreshCw,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import "../../styles/superadmin.css";

function SuperadminCategories() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const [categories, setCategories] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  // Modals & Drawer State
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editDrawerOpen, setEditDrawerOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  // Form State
  const [categoryForm, setCategoryForm] = useState({
    category_name: "",
    description: ""
  });

  const [editData, setEditData] = useState({});

  useEffect(() => {
    document.title = "Product Categories | WMS Super Admin";
    loadData();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await api.get("/superadmin/categories");
      if (res.data && res.data.status === "success") {
        setCategories(res.data.data);
      }
    } catch (err) {
      console.error("Error loading categories:", err);
      setError("Gagal memuat kategori produk.");
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
      const res = await api.post("/superadmin/categories", categoryForm);
      if (res.data && res.data.status === "success") {
        showToast("Kategori baru berhasil dibuat.");
        setAddModalOpen(false);
        setCategoryForm({ category_name: "", description: "" });
        loadData();
      }
    } catch (err) {
      showToast(err.response?.data?.message || "Gagal membuat kategori baru.", false);
    }
  };

  const openEditDrawer = (cat) => {
    setEditData({
      category_id: cat.category_id,
      category_name: cat.category_name,
      description: cat.description || ""
    });
    setEditDrawerOpen(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await api.put(`/superadmin/categories/${editData.category_id}`, {
        category_name: editData.category_name,
        description: editData.description
      });
      if (res.data && res.data.status === "success") {
        showToast("Kategori berhasil diperbarui.");
        setEditDrawerOpen(false);
        loadData();
      }
    } catch (err) {
      showToast(err.response?.data?.message || "Gagal memperbarui kategori.", false);
    }
  };

  const triggerDelete = (category_id, name) => {
    setDeleteTarget({ category_id, name });
    setDeleteModalOpen(true);
  };

  const executeDelete = async () => {
    if (!deleteTarget) return;
    try {
      const res = await api.delete(`/superadmin/categories/${deleteTarget.category_id}`);
      if (res.data && res.data.status === "success") {
        showToast("Kategori berhasil dihapus.");
        setDeleteModalOpen(false);
        setDeleteTarget(null);
        loadData();
      }
    } catch (err) {
      showToast("Gagal menghapus kategori.", false);
    }
  };

  const filteredCategories = categories.filter((c) =>
    c.category_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalPages = Math.ceil(filteredCategories.length / ITEMS_PER_PAGE);
  const paginatedCategories = filteredCategories.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  return (
    <DashboardLayout title="Product Categories">
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
              placeholder="Cari kategori..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <button className="btn btn-outline" onClick={loadData} title="Refresh Data" style={{ height: "38px" }}>
            <RefreshCw size={14} />
          </button>
          <button className="btn btn-primary" onClick={() => setAddModalOpen(true)}>
            <Plus size={16} /> Tambah Kategori
          </button>
        </div>

        {/* Categories Table Bento Panel */}
        <div className="panel" style={{ padding: "0", overflow: "hidden" }}>
          <div className="table-wrap">
            {loading ? (
              <div style={{ textAlign: "center", padding: "40px", color: "var(--text-muted)" }}>
                Memuat data kategori...
              </div>
            ) : filteredCategories.length === 0 ? (
              <div style={{ textAlign: "center", padding: "40px", color: "var(--text-muted)" }}>
                Tidak ada kategori yang cocok.
              </div>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>ID Kategori</th>
                    <th>Nama Kategori</th>
                    <th>Deskripsi</th>
                    <th>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedCategories.map((c) => (
                    <tr key={c.category_id}>
                      <td><strong>#CAT-{c.category_id}</strong></td>
                      <td>{c.category_name}</td>
                      <td>{c.description || <span style={{ color: "var(--text-muted)" }}>Tidak ada deskripsi</span>}</td>
                      <td>
                        <div className="action-group">
                          <button
                            className="btn btn-edit btn-sm"
                            onClick={() => openEditDrawer(c)}
                            title="Edit"
                          >
                            <Edit2 size={12} />
                          </button>
                          <button
                            className="btn btn-del btn-sm"
                            onClick={() => triggerDelete(c.category_id, c.category_name)}
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

        {/* ADD CATEGORY MODAL */}
        {addModalOpen && (
          <div className="modal-overlay">
            <div className="sa-modal">
              <div className="sa-modal-header">
                <h3>Tambah Kategori Baru</h3>
                <button onClick={() => setAddModalOpen(false)} style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <X size={16} />
                </button>
              </div>
              <form onSubmit={handleCreateSubmit}>
                <div className="sa-modal-body">
                  <div className="form-group">
                    <label>Nama Kategori <span style={{ color: "red" }}>*</span></label>
                    <input
                      type="text"
                      required
                      placeholder="Contoh: Elektronik, Pakaian"
                      value={categoryForm.category_name}
                      onChange={(e) => setCategoryForm({ ...categoryForm, category_name: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label>Deskripsi</label>
                    <textarea
                      placeholder="Masukkan penjelasan kategori..."
                      value={categoryForm.description}
                      onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
                    />
                  </div>
                </div>
                <div className="sa-modal-footer">
                  <button type="button" className="btn btn-outline" onClick={() => setAddModalOpen(false)}>Batal</button>
                  <button type="submit" className="btn btn-primary">Simpan Kategori</button>
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
                <h3>Edit Kategori</h3>
                <button onClick={() => setEditDrawerOpen(false)} style={{ display: "flex", alignItems: "center", justifyContent: "center" }}><X size={16} /></button>
              </div>
              <form onSubmit={handleEditSubmit}>
                <div className="sa-modal-body">
                  <div className="form-group">
                    <label>Nama Kategori</label>
                    <input type="text" required value={editData.category_name || ""} onChange={(e) => setEditData({ ...editData, category_name: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label>Deskripsi</label>
                    <textarea value={editData.description || ""} onChange={(e) => setEditData({ ...editData, description: e.target.value })} />
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
                  <h3>Hapus Kategori</h3>
                </div>
                <button onClick={() => setDeleteModalOpen(false)} style={{ display: "flex", alignItems: "center", justifyContent: "center" }}><X size={16} /></button>
              </div>
              <div className="sa-modal-body">
                <p>Apakah Anda yakin ingin menghapus kategori <strong>{deleteTarget?.name}</strong>?</p>
                <p style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "8px" }}>Tindakan ini juga dapat merusak data relasi produk yang terikat ke kategori ini.</p>
              </div>
              <div className="sa-modal-footer">
                <button className="btn btn-outline" onClick={() => setDeleteModalOpen(false)}>Batal</button>
                <button className="btn btn-danger" onClick={executeDelete}>Hapus Kategori</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
);
}

export default SuperadminCategories;
