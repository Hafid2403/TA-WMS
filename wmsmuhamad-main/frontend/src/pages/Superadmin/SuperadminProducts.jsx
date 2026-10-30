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

function SuperadminProducts() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All Categories");
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  // Modals & Drawer State
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editDrawerOpen, setEditDrawerOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  // Form State
  const [productForm, setProductForm] = useState({
    product_name: "",
    internal_code: "",
    category_id: "",
    unit: "pcs",
    min_stock: 0,
    description: "",
    is_active: true
  });

  const [editData, setEditData] = useState({});

  useEffect(() => {
    document.title = "Product Catalog | WMS Super Admin";
    loadData();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, categoryFilter]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError("");

      const [prodRes, catRes] = await Promise.all([
        api.get("/superadmin/products"),
        api.get("/superadmin/categories")
      ]);

      if (prodRes.data && prodRes.data.status === "success") {
        setProducts(prodRes.data.data);
      }
      if (catRes.data && catRes.data.status === "success") {
        setCategories(catRes.data.data);
      }
    } catch (err) {
      console.error("Error loading product data:", err);
      setError("Gagal memuat data produk atau kategori.");
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
        product_name: productForm.product_name,
        internal_code: productForm.internal_code,
        category_id: Number(productForm.category_id),
        unit: productForm.unit,
        min_stock: Number(productForm.min_stock),
        description: productForm.description,
        is_active: productForm.is_active
      };

      const res = await api.post("/superadmin/products", payload);
      if (res.data && res.data.status === "success") {
        showToast("Produk berhasil ditambahkan.");
        setAddModalOpen(false);
        setProductForm({
          product_name: "",
          internal_code: "",
          category_id: "",
          unit: "pcs",
          min_stock: 0,
          description: "",
          is_active: true
        });
        loadData();
      }
    } catch (err) {
      showToast(err.response?.data?.message || "Gagal membuat produk baru.", false);
    }
  };

  const openEditDrawer = (prod) => {
    setEditData({
      product_id: prod.product_id,
      product_name: prod.product_name,
      internal_code: prod.internal_code,
      category_id: prod.category_id,
      unit: prod.unit,
      min_stock: prod.min_stock,
      description: prod.description || "",
      is_active: prod.is_active
    });
    setEditDrawerOpen(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        product_name: editData.product_name,
        internal_code: editData.internal_code,
        category_id: Number(editData.category_id),
        unit: editData.unit,
        min_stock: Number(editData.min_stock),
        description: editData.description,
        is_active: editData.is_active
      };

      const res = await api.put(`/superadmin/products/${editData.product_id}`, payload);
      if (res.data && res.data.status === "success") {
        showToast("Produk berhasil diperbarui.");
        setEditDrawerOpen(false);
        loadData();
      }
    } catch (err) {
      showToast(err.response?.data?.message || "Gagal memperbarui produk.", false);
    }
  };

  const triggerDelete = (product_id, name) => {
    setDeleteTarget({ product_id, name });
    setDeleteModalOpen(true);
  };

  const executeDelete = async () => {
    if (!deleteTarget) return;
    try {
      const res = await api.delete(`/superadmin/products/${deleteTarget.product_id}`);
      if (res.data && res.data.status === "success") {
        showToast("Produk berhasil dihapus.");
        setDeleteModalOpen(false);
        setDeleteTarget(null);
        loadData();
      }
    } catch (err) {
      showToast("Gagal menghapus produk.", false);
    }
  };

  // Filters
  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.product_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.internal_code.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      categoryFilter === "All Categories" || String(p.category_id) === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const totalPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE);
  const paginatedProducts = filteredProducts.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  return (
    <DashboardLayout title="Product Catalog Global">
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
              placeholder="Cari kode SKU atau nama produk..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <select
            className="filter-select"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            <option value="All Categories">Semua Kategori</option>
            {categories.map((cat) => (
              <option key={cat.category_id} value={String(cat.category_id)}>
                {cat.category_name}
              </option>
            ))}
          </select>
          <button className="btn btn-outline" onClick={loadData} title="Refresh Data" style={{ height: "38px" }}>
            <RefreshCw size={14} />
          </button>
          <button className="btn btn-primary" onClick={() => setAddModalOpen(true)}>
            <Plus size={16} /> Tambah Produk
          </button>
        </div>

        {/* Products Table Bento Panel */}
        <div className="panel" style={{ padding: "0", overflow: "hidden" }}>
          <div className="table-wrap">
            {loading ? (
              <div style={{ textAlign: "center", padding: "40px", color: "var(--text-muted)" }}>
                Memuat data produk...
              </div>
            ) : filteredProducts.length === 0 ? (
              <div style={{ textAlign: "center", padding: "40px", color: "var(--text-muted)" }}>
                Tidak ada data produk yang cocok.
              </div>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>Internal Code / SKU</th>
                    <th>Nama Produk</th>
                    <th>Kategori</th>
                    <th>Unit (UoM)</th>
                    <th>Stok Minimum</th>
                    <th>Status</th>
                    <th>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedProducts.map((p) => (
                    <tr key={p.product_id}>
                      <td><strong>{p.internal_code}</strong></td>
                      <td>{p.product_name}</td>
                      <td>
                        <span className="badge badge-info">
                          {p.category ? p.category.category_name : "N/A"}
                        </span>
                      </td>
                      <td>{p.unit}</td>
                      <td>{p.min_stock} {p.unit}</td>
                      <td>
                        <span className={`badge ${p.is_active ? 'badge-success' : 'badge-danger'}`}>
                          {p.is_active ? "Aktif" : "Nonaktif"}
                        </span>
                      </td>
                      <td>
                        <div className="action-group">
                          <button
                            className="btn btn-edit btn-sm"
                            onClick={() => openEditDrawer(p)}
                            title="Edit"
                          >
                            <Edit2 size={12} />
                          </button>
                          <button
                            className="btn btn-del btn-sm"
                            onClick={() => triggerDelete(p.product_id, p.product_name)}
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

        {/* ADD PRODUCT MODAL */}
        {addModalOpen && (
          <div className="modal-overlay">
            <div className="sa-modal">
              <div className="sa-modal-header">
                <h3>Tambah Produk Baru</h3>
                <button onClick={() => setAddModalOpen(false)} style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <X size={16} />
                </button>
              </div>
              <form onSubmit={handleCreateSubmit}>
                <div className="sa-modal-body">
                  <div className="form-group">
                    <label>Nama Produk <span style={{ color: "red" }}>*</span></label>
                    <input
                      type="text"
                      required
                      placeholder="Contoh: Pallet Kayu Standard"
                      value={productForm.product_name}
                      onChange={(e) => setProductForm({ ...productForm, product_name: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label>Internal Code / SKU <span style={{ color: "red" }}>*</span></label>
                    <input
                      type="text"
                      required
                      placeholder="Contoh: PLT-001"
                      value={productForm.internal_code}
                      onChange={(e) => setProductForm({ ...productForm, internal_code: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label>Kategori Produk <span style={{ color: "red" }}>*</span></label>
                    <select
                      required
                      value={productForm.category_id}
                      onChange={(e) => setProductForm({ ...productForm, category_id: e.target.value })}
                    >
                      <option value="">-- Pilih Kategori --</option>
                      {categories.map((cat) => (
                        <option key={cat.category_id} value={cat.category_id}>
                          {cat.category_name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                    <div className="form-group">
                      <label>Unit (UoM) <span style={{ color: "red" }}>*</span></label>
                      <input
                        type="text"
                        required
                        placeholder="Contoh: pcs, box, kg"
                        value={productForm.unit}
                        onChange={(e) => setProductForm({ ...productForm, unit: e.target.value })}
                      />
                    </div>
                    <div className="form-group">
                      <label>Min. Stock <span style={{ color: "red" }}>*</span></label>
                      <input
                        type="number"
                        min="0"
                        required
                        value={productForm.min_stock}
                        onChange={(e) => setProductForm({ ...productForm, min_stock: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Deskripsi</label>
                    <textarea
                      placeholder="Masukkan deskripsi produk..."
                      value={productForm.description}
                      onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label>Status</label>
                    <select
                      value={productForm.is_active ? "true" : "false"}
                      onChange={(e) => setProductForm({ ...productForm, is_active: e.target.value === "true" })}
                    >
                      <option value="true">Aktif</option>
                      <option value="false">Nonaktif</option>
                    </select>
                  </div>
                </div>
                <div className="sa-modal-footer">
                  <button type="button" className="btn btn-outline" onClick={() => setAddModalOpen(false)}>Batal</button>
                  <button type="submit" className="btn btn-primary">Simpan Produk</button>
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
                <h3>Edit Detail Produk</h3>
                <button onClick={() => setEditDrawerOpen(false)} style={{ display: "flex", alignItems: "center", justifyContent: "center" }}><X size={16} /></button>
              </div>
              <form onSubmit={handleEditSubmit}>
                <div className="sa-modal-body">
                  <div className="form-group">
                    <label>Nama Produk</label>
                    <input type="text" required value={editData.product_name || ""} onChange={(e) => setEditData({ ...editData, product_name: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label>Internal Code / SKU</label>
                    <input type="text" required value={editData.internal_code || ""} onChange={(e) => setEditData({ ...editData, internal_code: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label>Kategori</label>
                    <select required value={editData.category_id || ""} onChange={(e) => setEditData({ ...editData, category_id: e.target.value })}>
                      {categories.map((cat) => (
                        <option key={cat.category_id} value={cat.category_id}>{cat.category_name}</option>
                      ))}
                    </select>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                    <div className="form-group">
                      <label>Unit (UoM)</label>
                      <input type="text" required value={editData.unit || ""} onChange={(e) => setEditData({ ...editData, unit: e.target.value })} />
                    </div>
                    <div className="form-group">
                      <label>Min. Stock</label>
                      <input type="number" min="0" required value={editData.min_stock || 0} onChange={(e) => setEditData({ ...editData, min_stock: e.target.value })} />
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Deskripsi</label>
                    <textarea value={editData.description || ""} onChange={(e) => setEditData({ ...editData, description: e.target.value })} />
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
                  <h3>Hapus Produk</h3>
                </div>
                <button onClick={() => setDeleteModalOpen(false)} style={{ display: "flex", alignItems: "center", justifyContent: "center" }}><X size={16} /></button>
              </div>
              <div className="sa-modal-body">
                <p>Apakah Anda yakin ingin menghapus produk <strong>{deleteTarget?.name}</strong> dari katalog sistem?</p>
                <p style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "8px" }}>Tindakan ini tidak dapat dibatalkan.</p>
              </div>
              <div className="sa-modal-footer">
                <button className="btn btn-outline" onClick={() => setDeleteModalOpen(false)}>Batal</button>
                <button className="btn btn-danger" onClick={executeDelete}>Hapus Sekarang</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

export default SuperadminProducts;
