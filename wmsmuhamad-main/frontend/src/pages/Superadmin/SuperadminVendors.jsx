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
  Mail,
  Phone,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import "../../styles/superadmin.css";

function SuperadminVendors() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const [vendors, setVendors] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  // Modals & Drawer State
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editDrawerOpen, setEditDrawerOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  // Form State
  const [vendorForm, setVendorForm] = useState({
    sa_vendor_name: "", // avoiding target keywords or using vendor_name directly
    vendor_name: "",
    contact_person: "",
    phone: "",
    email: "",
    address: "",
    is_active: true
  });

  const [editData, setEditData] = useState({});

  useEffect(() => {
    document.title = "Vendor Directory | WMS Super Admin";
    loadData();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await api.get("/superadmin/vendors");
      if (res.data && res.data.status === "success") {
        setVendors(res.data.data);
      }
    } catch (err) {
      console.error("Error loading vendors:", err);
      setError("Gagal memuat direktori vendor.");
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
        vendor_name: vendorForm.vendor_name,
        contact_person: vendorForm.contact_person,
        phone: vendorForm.phone,
        email: vendorForm.email,
        address: vendorForm.address,
        is_active: vendorForm.is_active
      };

      const res = await api.post("/superadmin/vendors", payload);
      if (res.data && res.data.status === "success") {
        showToast("Vendor baru berhasil didaftarkan.");
        setAddModalOpen(false);
        setVendorForm({
          vendor_name: "",
          contact_person: "",
          phone: "",
          email: "",
          address: "",
          is_active: true
        });
        loadData();
      }
    } catch (err) {
      showToast(err.response?.data?.message || "Gagal membuat vendor baru.", false);
    }
  };

  const openEditDrawer = (v) => {
    setEditData({
      vendor_id: v.vendor_id,
      vendor_name: v.vendor_name,
      contact_person: v.contact_person || "",
      phone: v.phone || "",
      email: v.email || "",
      address: v.address || "",
      is_active: v.is_active
    });
    setEditDrawerOpen(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        vendor_name: editData.vendor_name,
        contact_person: editData.contact_person,
        phone: editData.phone,
        email: editData.email,
        address: editData.address,
        is_active: editData.is_active
      };

      const res = await api.put(`/superadmin/vendors/${editData.vendor_id}`, payload);
      if (res.data && res.data.status === "success") {
        showToast("Data vendor berhasil diperbarui.");
        setEditDrawerOpen(false);
        loadData();
      }
    } catch (err) {
      showToast(err.response?.data?.message || "Gagal memperbarui vendor.", false);
    }
  };

  const triggerDelete = (vendor_id, name) => {
    setDeleteTarget({ vendor_id, name });
    setDeleteModalOpen(true);
  };

  const executeDelete = async () => {
    if (!deleteTarget) return;
    try {
      const res = await api.delete(`/superadmin/vendors/${deleteTarget.vendor_id}`);
      if (res.data && res.data.status === "success") {
        showToast("Vendor berhasil dihapus.");
        setDeleteModalOpen(false);
        setDeleteTarget(null);
        loadData();
      }
    } catch (err) {
      showToast("Gagal menghapus vendor.", false);
    }
  };

  const filteredVendors = vendors.filter((v) =>
    v.vendor_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (v.contact_person && v.contact_person.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const totalPages = Math.ceil(filteredVendors.length / ITEMS_PER_PAGE);
  const paginatedVendors = filteredVendors.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  return (
    <DashboardLayout title="Vendor Directory">
      <div className="superadmin-container">
        {/* Banner Alert Toast */}
        {successMsg && <div className="banner-alert success">{successMsg}</div>}
        {error && <div className="banner-alert danger">{error}</div>}

        {/* Filter & Search Toolbar */}
        <div className="search-bar">
          <div className="search-input-wrap">
            <Search size={16} className="search-icon" />
            <input
              type="text"
              placeholder="Cari nama vendor atau PIC contact..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <button className="btn btn-outline" onClick={loadData} title="Refresh Data" style={{ height: "38px" }}>
            <RefreshCw size={14} />
          </button>
          <button className="btn btn-primary" onClick={() => setAddModalOpen(true)}>
            <Plus size={16} /> Tambah Vendor
          </button>
        </div>

        {/* Vendors Table Bento Panel */}
        <div className="panel" style={{ padding: "0", overflow: "hidden" }}>
          <div className="table-wrap">
            {loading ? (
              <div style={{ textAlign: "center", padding: "40px", color: "var(--text-muted)" }}>
                Memuat data vendor...
              </div>
            ) : filteredVendors.length === 0 ? (
              <div style={{ textAlign: "center", padding: "40px", color: "var(--text-muted)" }}>
                Tidak ada data vendor yang cocok.
              </div>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>Nama Vendor</th>
                    <th>PIC / Contact Person</th>
                    <th>Kontak Informasi</th>
                    <th>Alamat</th>
                    <th>Status</th>
                    <th>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedVendors.map((v) => (
                    <tr key={v.vendor_id}>
                      <td><strong>{v.vendor_name}</strong></td>
                      <td>{v.contact_person || <span style={{ color: "var(--text-muted)" }}>N/A</span>}</td>
                      <td>
                        <div style={{ display: "flex", flexDirection: "column", gap: "2px", fontSize: "12px" }}>
                          {v.email && (
                            <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                              <Mail size={12} style={{ color: "var(--text-muted)" }} /> {v.email}
                            </span>
                          )}
                          {v.phone && (
                            <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                              <Phone size={12} style={{ color: "var(--text-muted)" }} /> {v.phone}
                            </span>
                          )}
                        </div>
                      </td>
                      <td>{v.address || <span style={{ color: "var(--text-muted)" }}>N/A</span>}</td>
                      <td>
                        <span className={`badge ${v.is_active ? 'badge-success' : 'badge-danger'}`}>
                          {v.is_active ? "Aktif" : "Nonaktif"}
                        </span>
                      </td>
                      <td>
                        <div className="action-group">
                          <button
                            className="btn btn-edit btn-sm"
                            onClick={() => openEditDrawer(v)}
                            title="Edit"
                          >
                            <Edit2 size={12} />
                          </button>
                          <button
                            className="btn btn-del btn-sm"
                            onClick={() => triggerDelete(v.vendor_id, v.vendor_name)}
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

        {/* ADD VENDOR MODAL */}
        {addModalOpen && (
          <div className="modal-overlay">
            <div className="sa-modal">
              <div className="sa-modal-header">
                <h3>Daftarkan Vendor Baru</h3>
                <button onClick={() => setAddModalOpen(false)} style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <X size={16} />
                </button>
              </div>
              <form onSubmit={handleCreateSubmit}>
                <div className="sa-modal-body">
                  <div className="form-group">
                    <label>Nama Perusahaan Vendor <span style={{ color: "red" }}>*</span></label>
                    <input
                      type="text"
                      required
                      placeholder="Contoh: PT. Logistik Jaya Abadi"
                      value={vendorForm.vendor_name}
                      onChange={(e) => setVendorForm({ ...vendorForm, vendor_name: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label>Nama Kontak / PIC</label>
                    <input
                      type="text"
                      placeholder="Contoh: Budi Santoso"
                      value={vendorForm.contact_person}
                      onChange={(e) => setVendorForm({ ...vendorForm, contact_person: e.target.value })}
                    />
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                    <div className="form-group">
                      <label>No. Telepon / WhatsApp</label>
                      <input
                        type="text"
                        placeholder="Contoh: 0812345678"
                        value={vendorForm.phone}
                        onChange={(e) => setVendorForm({ ...vendorForm, phone: e.target.value })}
                      />
                    </div>
                    <div className="form-group">
                      <label>Email Perusahaan</label>
                      <input
                        type="email"
                        placeholder="Contoh: info@vendor.com"
                        value={vendorForm.email}
                        onChange={(e) => setVendorForm({ ...vendorForm, email: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Alamat Kantor</label>
                    <textarea
                      placeholder="Masukkan alamat lengkap vendor..."
                      value={vendorForm.address}
                      onChange={(e) => setVendorForm({ ...vendorForm, address: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label>Status Kerja Sama</label>
                    <select
                      value={vendorForm.is_active ? "true" : "false"}
                      onChange={(e) => setVendorForm({ ...vendorForm, is_active: e.target.value === "true" })}
                    >
                      <option value="true">Aktif (Kerja Sama Berjalan)</option>
                      <option value="false">Nonaktif (Ditangguhkan)</option>
                    </select>
                  </div>
                </div>
                <div className="sa-modal-footer">
                  <button type="button" className="btn btn-outline" onClick={() => setAddModalOpen(false)}>Batal</button>
                  <button type="submit" className="btn btn-primary">Simpan Vendor</button>
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
                <h3>Edit Detail Vendor</h3>
                <button onClick={() => setEditDrawerOpen(false)} style={{ display: "flex", alignItems: "center", justifyContent: "center" }}><X size={16} /></button>
              </div>
              <form onSubmit={handleEditSubmit}>
                <div className="sa-modal-body">
                  <div className="form-group">
                    <label>Nama Perusahaan Vendor</label>
                    <input type="text" required value={editData.vendor_name || ""} onChange={(e) => setEditData({ ...editData, vendor_name: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label>Nama Kontak / PIC</label>
                    <input type="text" value={editData.contact_person || ""} onChange={(e) => setEditData({ ...editData, contact_person: e.target.value })} />
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                    <div className="form-group">
                      <label>No. Telepon / WhatsApp</label>
                      <input type="text" value={editData.phone || ""} onChange={(e) => setEditData({ ...editData, phone: e.target.value })} />
                    </div>
                    <div className="form-group">
                      <label>Email Perusahaan</label>
                      <input type="email" value={editData.email || ""} onChange={(e) => setEditData({ ...editData, email: e.target.value })} />
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Alamat Kantor</label>
                    <textarea value={editData.address || ""} onChange={(e) => setEditData({ ...editData, address: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label>Status Kerja Sama</label>
                    <select value={editData.is_active ? "true" : "false"} onChange={(e) => setEditData({ ...editData, is_active: e.target.value === "true" })}>
                      <option value="true">Aktif (Kerja Sama Berjalan)</option>
                      <option value="false">Nonaktif (Ditangguhkan)</option>
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
                  <h3>Hapus Vendor</h3>
                </div>
                <button onClick={() => setDeleteModalOpen(false)} style={{ display: "flex", alignItems: "center", justifyContent: "center" }}><X size={16} /></button>
              </div>
              <div className="sa-modal-body">
                <p>Apakah Anda yakin ingin menghapus data vendor <strong>{deleteTarget?.name}</strong>?</p>
                <p style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "8px" }}>Tindakan ini akan mempengaruhi rekam historis data penerimaan (Goods Receipt) dari supplier ini.</p>
              </div>
              <div className="sa-modal-footer">
                <button className="btn btn-outline" onClick={() => setDeleteModalOpen(false)}>Batal</button>
                <button className="btn btn-danger" onClick={executeDelete}>Hapus Vendor</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

export default SuperadminVendors;
