import { useState, useEffect } from "react";
import DashboardLayout from "../../layout/DashboardLayout";
import api from "../../services/api";
import authService from "../../services/authService";
import {
  Search,
  Edit2,
  Trash2,
  Key,
  X,
  Check,
  Clipboard,
  FileSignature,
  Bell,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  User,
  Building2,
  Save
} from "lucide-react";

function MasterDataPage() {
  const getStatusBadgeStyles = (statusVal) => {
    const s = String(statusVal).toLowerCase();
    switch (s) {
      case "active":
      case "available":
        return { bg: "var(--status-success-bg)", text: "var(--status-success-text)", border: "var(--status-success-border)", icon: <Check size={12} />, label: "Active" };
      case "inactive":
      case "empty":
        return { bg: "var(--status-danger-bg)", text: "var(--status-danger-text)", border: "var(--status-danger-border)", icon: <X size={12} />, label: s === "empty" ? "Empty" : "Inactive" };
      case "low stock":
      case "out of stock":
        return { bg: "var(--status-warning-bg)", text: "var(--status-warning-text)", border: "var(--status-warning-border)", icon: <AlertTriangle size={12} />, label: "Low Stock" };
      default:
        return { bg: "var(--status-warning-bg)", text: "var(--status-warning-text)", border: "var(--status-warning-border)", icon: <AlertTriangle size={12} />, label: statusVal };
    }
  };

  const getUserRoleBadge = (role) => {
    const r = String(role).toUpperCase();
    if (r === "SUPERADMIN") {
      return { bg: "rgba(139, 92, 246, 0.15)", text: "#8B5CF6", border: "rgba(139, 92, 246, 0.3)", icon: <Building2 size={12} /> };
    } else if (r === "MASTER") {
      return { bg: "rgba(236, 72, 153, 0.15)", text: "#EC4899", border: "rgba(236, 72, 153, 0.3)", icon: <Building2 size={12} /> };
    } else if (r === "PIC") {
      return { bg: "rgba(20, 184, 166, 0.15)", text: "#20B8A6", border: "rgba(20, 184, 166, 0.3)", icon: <User size={12} /> };
    } else {
      return { bg: "rgba(245, 158, 11, 0.15)", text: "#F59E0B", border: "rgba(245, 158, 11, 0.3)", icon: <User size={12} /> };
    }
  };

  const [activeTab, setActiveTab] = useState("products");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Data states
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [users, setUsers] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [resetRequests, setResetRequests] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);

  // Signatures states
  const [sigWarehouseId, setSigWarehouseId] = useState("");
  const [sigDocType, setSigDocType] = useState("goods_receipt");
  const [sigColumns, setSigColumns] = useState([]);

  // Filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All Categories");
  const [selectedWarehouse, setSelectedWarehouse] = useState("");

  const [productsPage, setProductsPage] = useState(1);
  const [vendorsPage, setVendorsPage] = useState(1);
  const [usersPage, setUsersPage] = useState(1);
  const [warehousesPage, setWarehousesPage] = useState(1);
  const [departmentsPage, setDepartmentsPage] = useState(1);
  const [resetPage, setResetPage] = useState(1);

  useEffect(() => {
    setProductsPage(1);
    setVendorsPage(1);
    setUsersPage(1);
    setWarehousesPage(1);
    setDepartmentsPage(1);
    setResetPage(1);
  }, [activeTab, searchQuery, selectedCategory, selectedWarehouse]);

  // Modal CRUD states
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState("add"); // "add" | "edit"
  const [editingId, setEditingId] = useState(null);

  // Unified form inputs
  const [formData, setFormData] = useState({
    product_name: "",
    internal_code: "",
    category_id: "",
    category_name: "",
    unit: "pcs",
    min_stock: 0,
    warehouse_ids: [],
    vendor_name: "",
    contact_person: "",
    phone: "",
    email: "",
    role: "PIC",
    password: "",
    warehouse_name: "",
    address: "",
    city: "",
    department_name: "",
    head_name: "",
    is_active: true
  });

  const fetchData = async () => {
    setLoading(true);
    setError("");
    try {
      if (activeTab === "products") {
        const whParam = selectedWarehouse ? `?warehouse_id=${selectedWarehouse}` : "";
        const prodRes = await api.get(`/master/products${whParam}`);
        if (prodRes.data && prodRes.data.status === "success") {
          setProducts(prodRes.data.data);
        }
        const catRes = await api.get("/master/categories");
        if (catRes.data && catRes.data.status === "success") {
          setCategories(catRes.data.data);
        }
        // Fetch warehouses for filter dropdown
        const whRes = await api.get("/master/warehouses");
        if (whRes.data && whRes.data.status === "success") {
          setWarehouses(whRes.data.data);
        }
      } else if (activeTab === "vendors") {
        const res = await api.get("/master/vendors");
        if (res.data && res.data.status === "success") {
          setVendors(res.data.data);
        }
      } else if (activeTab === "warehouses") {
        const res = await api.get("/master/warehouses");
        if (res.data && res.data.status === "success") {
          setWarehouses(res.data.data);
        }
      } else if (activeTab === "departments") {
        const res = await api.get("/master/departments");
        if (res.data && res.data.status === "success") {
          setDepartments(res.data.data);
        }
      } else if (activeTab === "users") {
        const res = await api.get("/master/users");
        if (res.data && res.data.status === "success") {
          const mappedUsers = res.data.data.map(u => ({
            id: u.id,
            name: u.name,
            email: u.email,
            role: u.role ? u.role.role_name : "PIC",
            role_id: u.role_id,
            warehouse_name: u.warehouse ? u.warehouse.warehouse_name : "Global",
            warehouse_id: u.warehouse_id,
            is_active: !!u.is_active
          }));
          setUsers(mappedUsers);
        }
        // Fetch warehouses for dropdown populate in user form
        const whRes = await api.get("/master/warehouses");
        if (whRes.data && whRes.data.status === "success") {
          setWarehouses(whRes.data.data);
        }
      } else if (activeTab === "reset_requests") {
        const res = await api.get("/auth/password-reset-requests");
        if (res.data && res.data.status === "success") {
          setResetRequests(res.data.data);
        }
      } else if (activeTab === "signatures") {
        const whRes = await api.get("/master/warehouses");
        if (whRes.data && whRes.data.status === "success") {
          setWarehouses(whRes.data.data);
          if (whRes.data.data.length > 0 && !sigWarehouseId) {
            setSigWarehouseId(whRes.data.data[0].warehouse_id.toString());
          }
        }
      }
    } catch (err) {
      console.error("Error fetching master data:", err);
      setError("Gagal memuat data master. Silakan periksa koneksi Anda.");
    } finally {
      setLoading(false);
    }
  };

  const fetchSignatures = async () => {
    if (!sigWarehouseId || !sigDocType) return;
    try {
      setLoading(true);
      setError("");
      const res = await api.get(`/master/warehouse-signatures?warehouse_id=${sigWarehouseId}&document_type=${sigDocType}`);
      if (res.data && res.data.status === "success" && res.data.data) {
        setSigColumns(res.data.data.columns || []);
      } else {
        setSigColumns([
          { label: "Disetujui oleh", role: "Penerima", name: "", title: "Staff Gudang" },
          { label: "Mengetahui", role: "Kepala gudang", name: "", title: "Kepala Gudang" }
        ]);
      }
    } catch (err) {
      console.error("Error fetching signatures:", err);
      setError("Gagal memuat pengaturan tanda tangan.");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSignatures = async () => {
    if (!sigWarehouseId || !sigDocType) return;
    try {
      setLoading(true);
      setError("");
      setSuccess("");
      const res = await api.post("/master/warehouse-signatures", {
        warehouse_id: parseInt(sigWarehouseId),
        document_type: sigDocType,
        columns: sigColumns
      });
      if (res.data && res.data.status === "success") {
        setSuccess("Pengaturan tanda tangan berhasil disimpan!");
      }
    } catch (err) {
      console.error("Error saving signatures:", err);
      setError(err.response?.data?.message || "Gagal menyimpan pengaturan tanda tangan.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "signatures") {
      fetchSignatures();
    }
  }, [sigWarehouseId, sigDocType, activeTab]);

  useEffect(() => {
    document.title = "Data Master | Warehouse Management System";
    setCurrentUser(authService.getCurrentUser());
  }, []);

  useEffect(() => {
    fetchData();
  }, [activeTab, selectedWarehouse]);

  const tabs = [
    { key: "products", label: "Products" },
    { key: "vendors", label: "Vendors" },
    { key: "users", label: "Users" },
    { key: "warehouses", label: "Warehouses" },
    { key: "departments", label: "Departments" },
    { key: "signatures", label: <span style={{ display: "flex", alignItems: "center", gap: "6px" }}><FileSignature size={14} /> Kolom Tanda Tangan</span> },
  ];

  if (currentUser?.role === "Master" || currentUser?.role === "Super Admin") {
    tabs.push({ key: "reset_requests", label: <span style={{ display: "flex", alignItems: "center", gap: "6px" }}><Bell size={14} /> Reset Requests</span> });
  }

  const tabStyle = (key) => ({
    padding: "8px 20px",
    borderRadius: "8px",
    border: "none",
    fontSize: "13px",
    fontWeight: 600,
    cursor: "pointer",
    background: activeTab === key ? "#2C4FDB" : "var(--card-bg)",
    color: activeTab === key ? "#fff" : "var(--text-muted)",
    boxShadow: activeTab === key ? "0 2px 8px rgba(44,79,219,0.15)" : "none",
    transition: "all 0.2s",
    flexShrink: 0,
  });


  const getFilteredProducts = () => {
    return products.filter((p) => {
      const matchesSearch =
        p.product_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.internal_code.toLowerCase().includes(searchQuery.toLowerCase());
      
      const catName = p.category ? p.category.category_name : "";
      const matchesCat =
        selectedCategory === "All Categories" ||
        catName === selectedCategory;

      return matchesSearch && matchesCat;
    });
  };

  const getFilteredVendors = () => {
    return vendors.filter((v) =>
      v.vendor_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.contact_person.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.email.toLowerCase().includes(searchQuery.toLowerCase())
    );
  };

  const getFilteredUsers = () => {
    return users.filter((u) =>
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.role.toLowerCase().includes(searchQuery.toLowerCase())
    );
  };

  const getFilteredWarehouses = () => {
    return warehouses.filter((w) =>
      w.warehouse_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      w.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
      w.city.toLowerCase().includes(searchQuery.toLowerCase())
    );
  };

  const getFilteredDepartments = () => {
    return departments.filter((d) =>
      d.department_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.head_name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  };

  // CRUD Actions
  const handleOpenAddModal = () => {
    setModalMode("add");
    setEditingId(null);
    setFormData({
      product_name: "",
      internal_code: "",
      category_id: "",
      category_name: "",
      unit: "pcs",
      min_stock: 0,
      warehouse_ids: [],
      warehouse_stocks: {},
      vendor_name: "",
      contact_person: "",
      phone: "",
      email: "",
      role: "PIC",
      password: "",
      warehouse_name: (currentUser?.role === "Master" && warehouses[0]) ? warehouses[0].warehouse_name : "Main WH",
      address: "",
      city: "",
      department_name: "",
      head_name: "",
      name: "", // for user
      is_active: true
    });
    setError("");
    setSuccess("");
    setShowModal(true);
  };

  const handleOpenEditModal = (item) => {
    setModalMode("edit");
    setError("");
    setSuccess("");
    
    if (activeTab === "products") {
      const stocksMapping = {};
      if (item.stocks) {
        item.stocks.forEach(s => {
          stocksMapping[s.warehouse_id] = s.qty_available || 0;
        });
      }
      setEditingId(item.product_id);
      setFormData({
        product_name: item.product_name,
        internal_code: item.internal_code,
        category_id: item.category_id || "",
        category_name: item.category ? item.category.category_name : "",
        unit: item.unit || "pcs",
        min_stock: item.min_stock || 0,
        warehouse_ids: item.stocks ? item.stocks.map(s => s.warehouse_id) : [],
        warehouse_stocks: stocksMapping,
        is_active: !!item.is_active
      });
    } else if (activeTab === "vendors") {
      setEditingId(item.vendor_id);
      setFormData({
        vendor_name: item.vendor_name,
        contact_person: item.contact_person,
        phone: item.phone || "",
        email: item.email || "",
        is_active: !!item.is_active
      });
    } else if (activeTab === "users") {
      setEditingId(item.id);
      setFormData({
        name: item.name,
        email: item.email,
        role: item.role,
        warehouse_name: item.warehouse_name || "Main WH",
        password: item.password || "",
        is_active: !!item.is_active
      });
    } else if (activeTab === "warehouses") {
      setEditingId(item.warehouse_id);
      setFormData({
        warehouse_name: item.warehouse_name,
        address: item.address || "",
        city: item.city || "",
        is_active: !!item.is_active
      });
    } else if (activeTab === "departments") {
      setEditingId(item.department_id);
      setFormData({
        department_name: item.department_name,
        head_name: item.head_name || "",
        is_active: !!item.is_active
      });
    }
    setShowModal(true);
  };

  const handleDeleteItem = async (id) => {
    if (!window.confirm("Apakah Anda yakin ingin menghapus data master ini?")) return;
    setError("");
    setSuccess("");
    try {
      setLoading(true);
      if (activeTab === "products") {
        await api.delete(`/master/products/${id}`);
      } else if (activeTab === "vendors") {
        await api.delete(`/master/vendors/${id}`);
      } else if (activeTab === "warehouses") {
        await api.delete(`/master/warehouses/${id}`);
      } else if (activeTab === "departments") {
        await api.delete(`/master/departments/${id}`);
      } else if (activeTab === "users") {
        await api.delete(`/master/users/${id}`);
      }
      setSuccess("Data berhasil dihapus!");
      fetchData();
    } catch (err) {
      console.error("Delete error:", err);
      setError("Gagal menghapus data dari server.");
    } finally {
      setLoading(false);
    }
  };

  const handleResetUserPassword = async (user) => {
    if (!window.confirm(`Apakah Anda yakin ingin me-reset password untuk user ${user.name}?`)) {
      return;
    }
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      const res = await api.post(`/auth/reset-password/${user.id}`);
      if (res.data && res.data.status === "success") {
        const tempPass = res.data.data.temporary_password;
        setSuccess(`Password untuk ${user.name} berhasil di-reset! Password Sementara: ${tempPass} (Telah disalin ke clipboard)`);
        navigator.clipboard.writeText(tempPass).catch(() => {});
      }
    } catch (err) {
      setError(err.response?.data?.message || "Gagal me-reset password user.");
    } finally {
      setLoading(false);
    }
  };

  const handleModalSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    try {
      setLoading(true);
      let payload = {};
      let endpoint = "";

      if (activeTab === "products") {
        payload = {
          product_name: formData.product_name,
          internal_code: formData.internal_code,
          category_name: formData.category_name,
          unit: formData.unit,
          min_stock: parseFloat(formData.min_stock),
          warehouse_ids: formData.warehouse_ids || [],
          warehouse_stocks: formData.warehouse_stocks || {},
          is_active: formData.is_active ? 1 : 0
        };
        endpoint = "/master/products";
      } else if (activeTab === "vendors") {
        payload = {
          vendor_name: formData.vendor_name,
          contact_person: formData.contact_person,
          phone: formData.phone,
          email: formData.email,
          is_active: formData.is_active ? 1 : 0
        };
        endpoint = "/master/vendors";
      } else if (activeTab === "warehouses") {
        payload = {
          warehouse_name: formData.warehouse_name,
          address: formData.address,
          city: formData.city,
          is_active: formData.is_active ? 1 : 0
        };
        endpoint = "/master/warehouses";
      } else if (activeTab === "departments") {
        payload = {
          department_name: formData.department_name,
          head_name: formData.head_name,
          is_active: formData.is_active ? 1 : 0
        };
        endpoint = "/master/departments";
      } else if (activeTab === "users") {
        const selectedWh = warehouses.find(w => w.warehouse_name === formData.warehouse_name);
        const warehouse_id = selectedWh ? selectedWh.warehouse_id : (warehouses[0] ? warehouses[0].warehouse_id : null);
        const roleIdMap = { "Master": 1, "PIC": 2, "QC": 3 };
        const role_id = roleIdMap[formData.role] || 2;

        payload = {
          name: formData.name,
          email: formData.email,
          role_id: role_id,
          warehouse_id: warehouse_id,
          password: formData.password,
          is_active: formData.is_active ? 1 : 0
        };
        endpoint = "/master/users";
      }

      if (modalMode === "add") {
        await api.post(endpoint, payload);
      } else {
        await api.put(`${endpoint}/${editingId}`, payload);
      }

      setSuccess("Data master berhasil disimpan!");
      setShowModal(false);
      fetchData();
    } catch (err) {
      console.error("Save error:", err);
      if (err.response && err.response.data && err.response.data.message) {
        setError(err.response.data.message);
      } else {
        setError("Gagal menyimpan data master.");
      }
    } finally {
      setLoading(false);
    }
  };

  const ITEMS_PER_PAGE = 10;

  // Products
  const filteredProducts = getFilteredProducts();
  const totalProductsPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE);
  const paginatedProducts = filteredProducts.slice((productsPage - 1) * ITEMS_PER_PAGE, productsPage * ITEMS_PER_PAGE);

  // Vendors
  const filteredVendors = getFilteredVendors();
  const totalVendorsPages = Math.ceil(filteredVendors.length / ITEMS_PER_PAGE);
  const paginatedVendors = filteredVendors.slice((vendorsPage - 1) * ITEMS_PER_PAGE, vendorsPage * ITEMS_PER_PAGE);

  // Users
  const filteredUsers = getFilteredUsers();
  const totalUsersPages = Math.ceil(filteredUsers.length / ITEMS_PER_PAGE);
  const paginatedUsers = filteredUsers.slice((usersPage - 1) * ITEMS_PER_PAGE, usersPage * ITEMS_PER_PAGE);

  // Warehouses
  const filteredWarehouses = getFilteredWarehouses();
  const totalWarehousesPages = Math.ceil(filteredWarehouses.length / ITEMS_PER_PAGE);
  const paginatedWarehouses = filteredWarehouses.slice((warehousesPage - 1) * ITEMS_PER_PAGE, warehousesPage * ITEMS_PER_PAGE);

  // Departments
  const filteredDepartments = getFilteredDepartments();
  const totalDepartmentsPages = Math.ceil(filteredDepartments.length / ITEMS_PER_PAGE);
  const paginatedDepartments = filteredDepartments.slice((departmentsPage - 1) * ITEMS_PER_PAGE, departmentsPage * ITEMS_PER_PAGE);

  // Reset Requests
  const totalResetPages = Math.ceil(resetRequests.length / ITEMS_PER_PAGE);
  const paginatedReset = resetRequests.slice((resetPage - 1) * ITEMS_PER_PAGE, resetPage * ITEMS_PER_PAGE);

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
    <DashboardLayout title="Master Data">
      {/* Tab Bar */}
      <div className="scrollable-tabs" style={{ display: "flex", gap: "8px", marginBottom: "20px", background: "var(--card-bg)", padding: "8px", borderRadius: "12px", border: "1px solid var(--border-color)", width: "fit-content" }}>
        {tabs.map((tab) => (
          <button key={tab.key} style={tabStyle(tab.key)} onClick={() => {
            setActiveTab(tab.key);
            setSearchQuery("");
          }}>
            {tab.label}
          </button>
        ))}
      </div>


      {error && (
        <div style={{ padding: "12px 16px", background: "var(--status-danger-bg)", color: "var(--status-danger-text)", border: "1.5px solid var(--status-danger-border)", borderRadius: "8px", marginBottom: "20px", fontSize: "13px", fontWeight: 600, display: "flex", alignItems: "center", gap: "6px" }}>
          <X size={14} /> {error}
        </div>
      )}

      {success && (
        <div style={{ 
          padding: "16px 20px", 
          background: "var(--status-success-bg)", 
          color: "var(--status-success-text)", 
          borderRadius: "12px", 
          marginBottom: "20px", 
          fontSize: "14px", 
          border: "1.5px solid var(--status-success-border)",
          boxShadow: "0 4px 6px -1px rgba(16, 185, 129, 0.1)"
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
            <span style={{ fontWeight: 700, display: "flex", alignItems: "center", gap: "6px" }}><Check size={16} /> Berhasil!</span>
            <button 
              onClick={() => setSuccess("")} 
              style={{ background: "none", border: "none", color: "var(--status-success-text)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
            >
              <X size={16} />
            </button>
          </div>
          {success.includes("Password Sementara:") ? (
            <div>
              <p style={{ margin: "0 0 10px 0", fontSize: "13px" }}>
                Password untuk user berhasil di-reset. Silakan gunakan kredensial sementara berikut untuk login:
              </p>
              <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                <code style={{ 
                  background: "#FFF", 
                  padding: "8px 14px", 
                  borderRadius: "6px", 
                  border: "1px solid #A7F3D0", 
                  fontSize: "14px", 
                  fontFamily: "monospace", 
                  fontWeight: 700, 
                  letterSpacing: "1px",
                  color: "#047857"
                }}>
                  {success.split("Password Sementara: ")[1]?.split(" (")[0] || success}
                </code>
                <button
                  onClick={() => {
                    const pass = success.split("Password Sementara: ")[1]?.split(" (")[0];
                    if (pass) {
                      navigator.clipboard.writeText(pass);
                      alert("Password berhasil disalin kembali ke clipboard!");
                    }
                  }}
                  style={{ 
                    background: "#047857", 
                    color: "#FFF", 
                    border: "none", 
                    padding: "8px 14px", 
                    borderRadius: "6px", 
                    fontSize: "12px", 
                    fontWeight: 600, 
                    cursor: "pointer",
                    transition: "background 0.2s",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px"
                  }}
                >
                  <Clipboard size={12} /> Salin Password
                </button>
              </div>
            </div>
          ) : (
            <span style={{ fontSize: "13px", fontWeight: 600 }}>{success}</span>
          )}
        </div>
      )}

      {/* Products Tab */}
      {activeTab === "products" && (
        <div style={{ background: "var(--card-bg)", borderRadius: "12px", border: "1px solid var(--border-color)", color: "var(--text-main)" }}>
          <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border-color)", display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
            <div style={{ display: "flex", alignItems: "center", background: "var(--input-bg)", border: "1.5px solid var(--border-color)", borderRadius: "8px", padding: "7px 12px", flex: 1, minWidth: "200px", gap: "8px" }}>
              <Search size={14} style={{ color: "var(--text-muted)" }} />
              <input 
                placeholder="Search product..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ border: "none", outline: "none", fontSize: "13px", width: "100%", background: "transparent", color: "var(--text-main)" }} 
              />
            </div>
            <select 
              value={selectedCategory} 
              onChange={(e) => setSelectedCategory(e.target.value)}
              style={{ padding: "8px 12px", borderRadius: "8px", border: "1.5px solid var(--border-color)", fontSize: "13px", background: "var(--input-bg)", color: "var(--text-main)" }}
            >
              <option>All Categories</option>
              {categories.map((c) => (
                <option key={c.category_id} value={c.category_name}>{c.category_name}</option>
              ))}
            </select>
            <select 
              value={selectedWarehouse} 
              onChange={(e) => setSelectedWarehouse(e.target.value)}
              style={{ padding: "8px 12px", borderRadius: "8px", border: "1.5px solid var(--border-color)", fontSize: "13px", background: "var(--input-bg)", color: "var(--text-main)" }}
            >
              <option value="">All Warehouses</option>
              {warehouses.map((w) => (
                <option key={w.warehouse_id} value={w.warehouse_id}>{w.warehouse_name}</option>
              ))}
            </select>
            <button onClick={handleOpenAddModal} style={{ padding: "8px 16px", borderRadius: "8px", border: "none", background: "#2C4FDB", color: "#fff", fontSize: "13px", fontWeight: 600, cursor: "pointer" }}>+ Add Product</button>
          </div>

          {loading ? (
            <div style={{ padding: "40px", textAlign: "center", color: "var(--text-muted)", fontSize: "14px" }}>Memuat produk...</div>
          ) : (
            <>
              <div className="table-wrap">
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                  <thead>
                    <tr>
                      {["Internal Code", "Product Name", "Category", "Unit", "Min Stock", "Available", "Status", "Action"].map((h) => (
                        <th key={h} style={{ textAlign: "left", padding: "10px 20px", background: "var(--table-header-bg)", fontSize: "11px", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", borderBottom: "1px solid var(--border-color)" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedProducts.length === 0 ? (
                      <tr>
                        <td colSpan="8" style={{ padding: "20px", textAlign: "center", color: "var(--text-muted)" }}>Tidak ada produk ditemukan</td>
                      </tr>
                    ) : (
                      paginatedProducts.map((row) => (
                        <tr key={row.product_id} style={{ borderBottom: "1px solid var(--border-color)" }}>
                          <td style={{ padding: "12px 20px" }}><span style={{ background: "var(--table-header-bg)", border: "1px solid var(--border-color)", padding: "2px 6px", borderRadius: "4px", fontSize: "11px", fontFamily: "monospace", color: "var(--text-muted)" }}>{row.internal_code}</span></td>
                          <td style={{ padding: "12px 20px", fontWeight: 600, color: "var(--text-main)" }}>{row.product_name}</td>
                          <td style={{ padding: "12px 20px", color: "var(--text-muted)" }}>{row.category ? row.category.category_name : "-"}</td>
                          <td style={{ padding: "12px 20px", color: "var(--text-muted)" }}>{row.unit}</td>
                          <td style={{ padding: "12px 20px", color: "var(--text-muted)" }}>{row.min_stock}</td>
                          <td style={{ padding: "12px 20px", fontWeight: 700, color: row.stocks_sum_qty_available === 0 ? "#EF4444" : "var(--text-main)" }}>
                            {row.stocks_sum_qty_available || 0}
                          </td>
                          <td style={{ padding: "12px 20px" }}>
                            {(() => {
                              if (!row.is_active) {
                                const badge = getStatusBadgeStyles("Inactive");
                                return (
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
                                );
                              }

                              const stock = row.stocks_sum_qty_available || 0;
                              const minStock = row.min_stock || 0;
                              let statusText = "Available";

                              if (stock === 0) {
                                statusText = "Empty";
                              } else if (stock < minStock) {
                                statusText = "Low Stock";
                              }

                              const badge = getStatusBadgeStyles(statusText);

                              return (
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
                              );
                            })()}
                          </td>
                          <td style={{ padding: "12px 20px" }}>
                            <div style={{ display: "flex", gap: "6px" }}>
                              <button onClick={() => handleOpenEditModal(row)} style={{ padding: "4px 10px", borderRadius: "6px", border: "1.5px solid var(--border-color)", background: "var(--card-bg)", color: "var(--text-main)", fontSize: "12px", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px" }}><Edit2 size={12} /> Edit</button>
                              <button onClick={() => handleDeleteItem(row.product_id)} style={{ padding: "4px 10px", borderRadius: "6px", border: "1.5px solid rgba(239, 68, 68, 0.3)", background: "rgba(239, 68, 68, 0.15)", color: "#EF4444", fontSize: "12px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.2s" }}><Trash2 size={12} /></button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              {renderPagination(productsPage, setProductsPage, totalProductsPages, "Products")}
            </>
          )}
        </div>
      )}

      {/* Vendors Tab */}
      {activeTab === "vendors" && (
        <div style={{ background: "var(--card-bg)", borderRadius: "12px", border: "1px solid var(--border-color)", color: "var(--text-main)" }}>
          <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border-color)", display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
            <div style={{ display: "flex", alignItems: "center", background: "var(--input-bg)", border: "1.5px solid var(--border-color)", borderRadius: "8px", padding: "7px 12px", flex: 1, gap: "8px" }}>
              <Search size={14} style={{ color: "var(--text-muted)" }} />
              <input 
                placeholder="Search vendor..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ border: "none", outline: "none", fontSize: "13px", width: "100%", background: "transparent", color: "var(--text-main)" }} 
              />
            </div>
            <button onClick={handleOpenAddModal} style={{ padding: "8px 16px", borderRadius: "8px", border: "none", background: "#2C4FDB", color: "#fff", fontSize: "13px", fontWeight: 600, cursor: "pointer" }}>+ Add Vendor</button>
          </div>

          {loading ? (
            <div style={{ padding: "40px", textAlign: "center", color: "var(--text-muted)", fontSize: "14px" }}>Memuat vendor...</div>
          ) : (
            <>
              <div className="table-wrap">
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                  <thead>
                    <tr>
                      {["Vendor Name", "Contact Person", "Phone", "Email", "Status", "Action"].map((h) => (
                        <th key={h} style={{ textAlign: "left", padding: "10px 20px", background: "var(--table-header-bg)", fontSize: "11px", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", borderBottom: "1px solid var(--border-color)" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedVendors.length === 0 ? (
                      <tr>
                        <td colSpan="6" style={{ padding: "20px", textAlign: "center", color: "var(--text-muted)" }}>Tidak ada vendor ditemukan</td>
                      </tr>
                    ) : (
                      paginatedVendors.map((row) => (
                        <tr key={row.vendor_id} style={{ borderBottom: "1px solid var(--border-color)" }}>
                          <td style={{ padding: "12px 20px", fontWeight: 700, color: "var(--text-main)" }}>{row.vendor_name}</td>
                          <td style={{ padding: "12px 20px", color: "var(--text-main)" }}>{row.contact_person}</td>
                          <td style={{ padding: "12px 20px", color: "var(--text-muted)" }}>{row.phone}</td>
                          <td style={{ padding: "12px 20px", color: "var(--text-muted)" }}>{row.email}</td>
                          <td style={{ padding: "12px 20px" }}>
                            <span style={{ 
                              background: getStatusBadgeStyles(row.is_active ? "Active" : "Inactive").bg, 
                              color: getStatusBadgeStyles(row.is_active ? "Active" : "Inactive").text, 
                              border: `1.5px solid ${getStatusBadgeStyles(row.is_active ? "Active" : "Inactive").border}`,
                              padding: "3px 10px", 
                              borderRadius: "20px", 
                              fontSize: "11px", 
                              fontWeight: 700,
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "4px"
                            }}>
                              {getStatusBadgeStyles(row.is_active ? "Active" : "Inactive").icon}
                              {getStatusBadgeStyles(row.is_active ? "Active" : "Inactive").label}
                            </span>
                          </td>
                          <td style={{ padding: "12px 20px" }}>
                            <div style={{ display: "flex", gap: "6px" }}>
                              <button onClick={() => handleOpenEditModal(row)} style={{ padding: "4px 10px", borderRadius: "6px", border: "1.5px solid var(--border-color)", background: "var(--card-bg)", color: "var(--text-main)", fontSize: "12px", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px" }}><Edit2 size={12} /> Edit</button>
                              <button onClick={() => handleDeleteItem(row.vendor_id)} style={{ padding: "4px 10px", borderRadius: "6px", border: "1.5px solid rgba(239, 68, 68, 0.3)", background: "rgba(239, 68, 68, 0.15)", color: "#EF4444", fontSize: "12px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.2s" }}><Trash2 size={12} /></button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              {renderPagination(vendorsPage, setVendorsPage, totalVendorsPages, "Vendors")}

            </>
          )}
        </div>
      )}

      {/* Users Tab */}
      {activeTab === "users" && (
        <div style={{ background: "var(--card-bg)", borderRadius: "12px", border: "1px solid var(--border-color)", color: "var(--text-main)" }}>
          <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border-color)", display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
            <div style={{ display: "flex", alignItems: "center", background: "var(--input-bg)", border: "1.5px solid var(--border-color)", borderRadius: "8px", padding: "7px 12px", flex: 1, gap: "8px" }}>
              <Search size={14} style={{ color: "var(--text-muted)" }} />
              <input 
                placeholder="Search user..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ border: "none", outline: "none", fontSize: "13px", width: "100%", background: "transparent", color: "var(--text-main)" }} 
              />
            </div>
            <button onClick={handleOpenAddModal} style={{ padding: "8px 16px", borderRadius: "8px", border: "none", background: "#2C4FDB", color: "#fff", fontSize: "13px", fontWeight: 600, cursor: "pointer" }}>+ Add User</button>
          </div>

          <div className="table-wrap">
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
              <thead>
                <tr>
                  {["Full Name", "Email", "Role", "Warehouse", "Status", "Action"].map((h) => (
                    <th key={h} style={{ textAlign: "left", padding: "10px 20px", background: "var(--table-header-bg)", fontSize: "11px", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", borderBottom: "1px solid var(--border-color)" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paginatedUsers.length === 0 ? (
                  <tr>
                    <td colSpan="6" style={{ padding: "20px", textAlign: "center", color: "var(--text-muted)" }}>Tidak ada user ditemukan</td>
                  </tr>
                ) : (
                  paginatedUsers.map((row) => {
                    let roleColor = "#EDE9FE";
                    let roleText = "#5B21B6";
                    if (row.role === "PIC") {
                      roleColor = "#DBEAFE";
                      roleText = "#1E40AF";
                    } else if (row.role === "QC") {
                      roleColor = "#FEF3C7";
                      roleText = "#92400E";
                    }
                    return (
                      <tr key={row.id} style={{ borderBottom: "1px solid var(--border-color)" }}>
                        <td style={{ padding: "12px 20px", fontWeight: 700, color: "var(--text-main)" }}>{row.name}</td>
                        <td style={{ padding: "12px 20px", color: "var(--text-muted)" }}>{row.email}</td>
                        <td style={{ padding: "12px 20px" }}>
                          <span style={{ 
                            background: getUserRoleBadge(row.role).bg, 
                            color: getUserRoleBadge(row.role).text, 
                            border: `1.5px solid ${getUserRoleBadge(row.role).border}`,
                            padding: "3px 10px", 
                            borderRadius: "20px", 
                            fontSize: "11px", 
                            fontWeight: 700,
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "4px"
                          }}>
                            {getUserRoleBadge(row.role).icon} {row.role}
                          </span>
                        </td>
                        <td style={{ padding: "12px 20px", color: "var(--text-muted)" }}>{row.warehouse_name || "-"}</td>
                        <td style={{ padding: "12px 20px" }}>
                          <span style={{ 
                            background: getStatusBadgeStyles(row.is_active ? "Active" : "Inactive").bg, 
                            color: getStatusBadgeStyles(row.is_active ? "Active" : "Inactive").text, 
                            border: `1.5px solid ${getStatusBadgeStyles(row.is_active ? "Active" : "Inactive").border}`,
                            padding: "3px 10px", 
                            borderRadius: "20px", 
                            fontSize: "11px", 
                            fontWeight: 700,
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "4px"
                          }}>
                            {getStatusBadgeStyles(row.is_active ? "Active" : "Inactive").icon}
                            {getStatusBadgeStyles(row.is_active ? "Active" : "Inactive").label}
                          </span>
                        </td>
                        <td style={{ padding: "12px 20px" }}>
                          <div style={{ display: "flex", gap: "6px" }}>
                            <button onClick={() => handleOpenEditModal(row)} style={{ padding: "4px 10px", borderRadius: "6px", border: "1.5px solid var(--border-color)", background: "var(--card-bg)", color: "var(--text-main)", fontSize: "12px", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px" }}><Edit2 size={12} /> Edit</button>
                            <button onClick={() => handleResetUserPassword(row)} style={{ padding: "4px 10px", borderRadius: "6px", border: "1.5px solid rgba(16, 185, 129, 0.3)", background: "rgba(16, 185, 129, 0.15)", color: "#10B981", fontSize: "12px", cursor: "pointer", fontWeight: 700, display: "flex", alignItems: "center", gap: "4px", transition: "all 0.2s" }}><Key size={12} /> Reset</button>
                            <button onClick={() => handleDeleteItem(row.id)} style={{ padding: "4px 10px", borderRadius: "6px", border: "1.5px solid rgba(239, 68, 68, 0.3)", background: "rgba(239, 68, 68, 0.15)", color: "#EF4444", fontSize: "12px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.2s" }}><Trash2 size={12} /></button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {renderPagination(usersPage, setUsersPage, totalUsersPages, "Users")}
        </div>
      )}

      {/* Warehouses Tab */}
      {activeTab === "warehouses" && (
        <div style={{ background: "var(--card-bg)", borderRadius: "12px", border: "1px solid var(--border-color)", color: "var(--text-main)" }}>
          <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border-color)", display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
            <div style={{ display: "flex", alignItems: "center", background: "var(--input-bg)", border: "1.5px solid var(--border-color)", borderRadius: "8px", padding: "7px 12px", flex: 1, gap: "8px" }}>
              <Search size={14} style={{ color: "var(--text-muted)" }} />
              <input 
                placeholder="Search warehouse..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ border: "none", outline: "none", fontSize: "13px", width: "100%", background: "transparent", color: "var(--text-main)" }} 
              />
            </div>
            <button onClick={handleOpenAddModal} style={{ padding: "8px 16px", borderRadius: "8px", border: "none", background: "#2C4FDB", color: "#fff", fontSize: "13px", fontWeight: 600, cursor: "pointer" }}>+ Add Warehouse</button>
          </div>

          {loading ? (
            <div style={{ padding: "40px", textAlign: "center", color: "var(--text-muted)", fontSize: "14px" }}>Memuat gudang...</div>
          ) : (
            <>
              <div className="table-wrap">
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                  <thead>
                    <tr>
                      {["Warehouse Name", "Address", "City", "Status", "Action"].map((h) => (
                        <th key={h} style={{ textAlign: "left", padding: "10px 20px", background: "var(--table-header-bg)", fontSize: "11px", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", borderBottom: "1px solid var(--border-color)" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedWarehouses.length === 0 ? (
                      <tr>
                        <td colSpan="5" style={{ padding: "20px", textAlign: "center", color: "var(--text-muted)" }}>Tidak ada gudang ditemukan</td>
                      </tr>
                    ) : (
                      paginatedWarehouses.map((row) => (
                        <tr key={row.warehouse_id} style={{ borderBottom: "1px solid var(--border-color)" }}>
                          <td style={{ padding: "12px 20px", fontWeight: 700, color: "var(--text-main)" }}>{row.warehouse_name}</td>
                          <td style={{ padding: "12px 20px", color: "var(--text-muted)" }}>{row.address}</td>
                          <td style={{ padding: "12px 20px", color: "var(--text-muted)" }}>{row.city}</td>
                          <td style={{ padding: "12px 20px" }}>
                            <span style={{ 
                              background: getStatusBadgeStyles(row.is_active ? "Active" : "Inactive").bg, 
                              color: getStatusBadgeStyles(row.is_active ? "Active" : "Inactive").text, 
                              border: `1.5px solid ${getStatusBadgeStyles(row.is_active ? "Active" : "Inactive").border}`,
                              padding: "3px 10px", 
                              borderRadius: "20px", 
                              fontSize: "11px", 
                              fontWeight: 700,
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "4px"
                            }}>
                              {getStatusBadgeStyles(row.is_active ? "Active" : "Inactive").icon}
                              {getStatusBadgeStyles(row.is_active ? "Active" : "Inactive").label}
                            </span>
                          </td>
                          <td style={{ padding: "12px 20px" }}>
                            <div style={{ display: "flex", gap: "6px" }}>
                              <button onClick={() => handleOpenEditModal(row)} style={{ padding: "4px 10px", borderRadius: "6px", border: "1.5px solid var(--border-color)", background: "var(--card-bg)", color: "var(--text-main)", fontSize: "12px", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px" }}><Edit2 size={12} /> Edit</button>
                              <button onClick={() => handleDeleteItem(row.warehouse_id)} style={{ padding: "4px 10px", borderRadius: "6px", border: "1.5px solid rgba(239, 68, 68, 0.3)", background: "rgba(239, 68, 68, 0.15)", color: "#EF4444", fontSize: "12px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.2s" }}><Trash2 size={12} /></button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              {renderPagination(warehousesPage, setWarehousesPage, totalWarehousesPages, "Warehouses")}

            </>
          )}
        </div>
      )}

      {/* Departments Tab */}
      {activeTab === "departments" && (
        <div style={{ background: "var(--card-bg)", borderRadius: "12px", border: "1px solid var(--border-color)", color: "var(--text-main)" }}>
          <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border-color)", display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
            <div style={{ display: "flex", alignItems: "center", background: "var(--input-bg)", border: "1.5px solid var(--border-color)", borderRadius: "8px", padding: "7px 12px", flex: 1, gap: "8px" }}>
              <Search size={14} style={{ color: "var(--text-muted)" }} />
              <input 
                placeholder="Search department..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ border: "none", outline: "none", fontSize: "13px", width: "100%", background: "transparent", color: "var(--text-main)" }} 
              />
            </div>
            <button onClick={handleOpenAddModal} style={{ padding: "8px 16px", borderRadius: "8px", border: "none", background: "#2C4FDB", color: "#fff", fontSize: "13px", fontWeight: 600, cursor: "pointer" }}>+ Add Department</button>
          </div>

          {loading ? (
            <div style={{ padding: "40px", textAlign: "center", color: "var(--text-muted)", fontSize: "14px" }}>Memuat departemen...</div>
          ) : (
            <>
              <div className="table-wrap">
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                  <thead>
                    <tr>
                      {["Department Name", "Head of Dept", "Status", "Action"].map((h) => (
                        <th key={h} style={{ textAlign: "left", padding: "10px 20px", background: "var(--table-header-bg)", fontSize: "11px", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", borderBottom: "1px solid var(--border-color)" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedDepartments.length === 0 ? (
                      <tr>
                        <td colSpan="4" style={{ padding: "20px", textAlign: "center", color: "var(--text-muted)" }}>Tidak ada departemen ditemukan</td>
                      </tr>
                    ) : (
                      paginatedDepartments.map((row) => (
                        <tr key={row.department_id} style={{ borderBottom: "1px solid var(--border-color)" }}>
                          <td style={{ padding: "12px 20px", fontWeight: 700, color: "var(--text-main)" }}>{row.department_name}</td>
                          <td style={{ padding: "12px 20px", color: "var(--text-main)" }}>{row.head_name || "-"}</td>
                          <td style={{ padding: "12px 20px" }}>
                            <span style={{ 
                              background: getStatusBadgeStyles(row.is_active ? "Active" : "Inactive").bg, 
                              color: getStatusBadgeStyles(row.is_active ? "Active" : "Inactive").text, 
                              border: `1.5px solid ${getStatusBadgeStyles(row.is_active ? "Active" : "Inactive").border}`,
                              padding: "3px 10px", 
                              borderRadius: "20px", 
                              fontSize: "11px", 
                              fontWeight: 700,
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "4px"
                            }}>
                              {getStatusBadgeStyles(row.is_active ? "Active" : "Inactive").icon}
                              {getStatusBadgeStyles(row.is_active ? "Active" : "Inactive").label}
                            </span>
                          </td>
                          <td style={{ padding: "12px 20px" }}>
                            <div style={{ display: "flex", gap: "6px" }}>
                              <button onClick={() => handleOpenEditModal(row)} style={{ padding: "4px 10px", borderRadius: "6px", border: "1.5px solid var(--border-color)", background: "var(--card-bg)", color: "var(--text-main)", fontSize: "12px", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px" }}><Edit2 size={12} /> Edit</button>
                              <button onClick={() => handleDeleteItem(row.department_id)} style={{ padding: "4px 10px", borderRadius: "6px", border: "1.5px solid rgba(239, 68, 68, 0.3)", background: "rgba(239, 68, 68, 0.15)", color: "#EF4444", fontSize: "12px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.2s" }}><Trash2 size={12} /></button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              {renderPagination(departmentsPage, setDepartmentsPage, totalDepartmentsPages, "Departments")}

            </>
          )}
        </div>
      )}

      {/* Reset Requests Tab */}
      {activeTab === "reset_requests" && (
        <div style={{ background: "var(--card-bg)", borderRadius: "12px", border: "1px solid var(--border-color)", color: "var(--text-main)" }}>
          <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border-color)", display: "flex", gap: "10px", alignItems: "center" }}>
            <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 700 }}>Daftar Permintaan Reset Password</h3>
          </div>
          <div className="table-wrap">
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "13px" }}>
              <thead>
                <tr style={{ background: "var(--table-header-bg)", borderBottom: "1px solid var(--border-color)" }}>
                  {["No", "Nama Pengguna", "Email", "Role", "Tanggal Pengajuan", "Aksi"].map((h, i) => (
                    <th key={h} style={{ 
                      padding: "12px 20px", 
                      fontWeight: 700, 
                      color: "var(--text-muted)", 
                      textTransform: "uppercase", 
                      fontSize: "11px",
                      textAlign: i === 5 ? "center" : "left",
                      width: i === 0 ? "50px" : i === 5 ? "180px" : "auto"
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paginatedReset.length === 0 ? (
                  <tr>
                    <td colSpan="6" style={{ padding: "30px", textAlign: "center", color: "var(--text-muted)" }}>Tidak ada permintaan reset password yang tertunda.</td>
                  </tr>
                ) : (
                  paginatedReset.map((row, idx) => {
                    const reqDate = new Date(row.created_at).toLocaleDateString("id-ID", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit"
                    });
                    const absoluteIdx = (resetPage - 1) * ITEMS_PER_PAGE + idx + 1;
                    return (
                      <tr key={row.id} style={{ borderBottom: "1px solid var(--border-color)", transition: "background 0.2s" }}>
                        <td style={{ padding: "12px 20px", fontWeight: 600 }}>{absoluteIdx}</td>
                        <td style={{ padding: "12px 20px", fontWeight: 700, color: "var(--text-main)" }}>{row.user?.name || "-"}</td>
                        <td style={{ padding: "12px 20px" }}>{row.email}</td>
                        <td style={{ padding: "12px 20px" }}>
                          <span style={{ 
                            background: row.user?.role?.role_name === "QC" ? "#FEF3C7" : "#DBEAFE", 
                            color: row.user?.role?.role_name === "QC" ? "#92400E" : "#1E40AF", 
                            padding: "3px 10px", 
                            borderRadius: "20px", 
                            fontSize: "11px", 
                            fontWeight: 700 
                          }}>
                            {row.user?.role?.role_name || "-"}
                          </span>
                        </td>
                        <td style={{ padding: "12px 20px" }}>{reqDate}</td>
                        <td style={{ padding: "12px 20px", textAlign: "center" }}>
                          <button 
                            onClick={async () => {
                              if (window.confirm(`Apakah Anda yakin ingin me-reset password untuk ${row.user?.name}?`)) {
                                setLoading(true);
                                setError("");
                                setSuccess("");
                                try {
                                  const res = await api.post(`/auth/reset-password/${row.user_id}`);
                                  if (res.data && res.data.status === "success") {
                                    const tempPass = res.data.data.temporary_password;
                                    setSuccess(`Password untuk ${row.user?.name} berhasil di-reset! Password Sementara: ${tempPass} (Telah disalin ke clipboard)`);
                                    navigator.clipboard.writeText(tempPass).catch(() => {});
                                    // Refresh list
                                    const updated = await api.get("/auth/password-reset-requests");
                                    if (updated.data && updated.data.status === "success") {
                                      setResetRequests(updated.data.data);
                                    }
                                  }
                                } catch (err) {
                                  setError(err.response?.data?.message || "Gagal me-reset password.");
                                } finally {
                                  setLoading(false);
                                }
                              }
                            }}
                            style={{ 
                              padding: "6px 12px", 
                              borderRadius: "6px", 
                              border: "none", 
                              background: "#10B981", 
                              color: "#FFF", 
                              fontSize: "12px", 
                              cursor: "pointer", 
                              fontWeight: 600,
                              boxShadow: "0 2px 4px rgba(16, 185, 129, 0.15)",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "6px"
                            }}
                          >
                            <Key size={12} /> Approve & Reset
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
            {renderPagination(resetPage, setResetPage, totalResetPages, "Reset Requests")}
          </div>
        </div>
      )}

      {/* Signature Adjustment Tab */}
      {activeTab === "signatures" && (
        <div style={{ background: "var(--card-bg)", borderRadius: "12px", border: "1px solid var(--border-color)", color: "var(--text-main)", padding: "24px" }}>
          {/* Header Warehouse Selection */}
          <div className="dashboard-two-col" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "20px" }}>
            <div>
              <label style={{ display: "block", fontSize: "13px", fontWeight: 700, color: "var(--text-muted)", marginBottom: "8px" }}>Pilih Gudang</label>
              <select 
                value={sigWarehouseId}
                onChange={(e) => setSigWarehouseId(e.target.value)}
                style={{ width: "100%", padding: "10px 14px", borderRadius: "8px", border: "1.5px solid var(--border-color)", fontSize: "14px", background: "var(--input-bg)", color: "var(--text-main)", fontWeight: 600 }}
              >
                {warehouses.map((w) => (
                  <option key={w.warehouse_id} value={w.warehouse_id}>{w.warehouse_name}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ display: "block", fontSize: "13px", fontWeight: 700, color: "var(--text-muted)", marginBottom: "8px" }}>Jenis dokumen</label>
              <select 
                value={sigDocType}
                onChange={(e) => setSigDocType(e.target.value)}
                style={{ width: "100%", padding: "10px 14px", borderRadius: "8px", border: "1.5px solid var(--border-color)", fontSize: "14px", background: "var(--input-bg)", color: "var(--text-main)", fontWeight: 600 }}
              >
                <option value="goods_receipt">Goods Receipt (GR)</option>
                <option value="putaway">Putaway (PA)</option>
                <option value="stock_opname">Stock Opname (SO)</option>
                <option value="material_request">Material Request (MR)</option>
                <option value="goods_issue">Goods Issue (GI)</option>
              </select>
            </div>
          </div>

          <hr style={{ border: "none", borderTop: "1px solid var(--border-color)", margin: "20px 0" }} />

          {/* Kolom Tanda Tangan Section */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
            <span style={{ fontSize: "12px", fontWeight: 800, color: "var(--text-muted)", letterSpacing: "1px", textTransform: "uppercase" }}>KOLOM TANDA TANGAN</span>
            <span style={{ background: "var(--input-bg)", color: "var(--text-muted)", padding: "4px 10px", borderRadius: "20px", fontSize: "11px", fontWeight: 700, border: "1px solid var(--border-color)" }}>
              {sigColumns.length} kolom
            </span>
          </div>

          {/* Cards List */}
          <div style={{ display: "flex", flexDirection: "column", gap: "16px", marginBottom: "20px" }}>
            {sigColumns.map((col, index) => {
              const isReceiver = col.role === "receiver" || col.role === "Penerima";
              const roleBadgeColor = isReceiver ? 
                { bg: "var(--status-info-bg)", text: "var(--status-info-text)", border: "var(--status-info-border)" } : 
                { bg: "var(--status-success-bg)", text: "var(--status-success-text)", border: "var(--status-success-border)" };
              const selectedRoleValue = isReceiver ? "receiver" : "approver";
              const displayedRoleLabel = isReceiver ? "Penerima" : "Kepala gudang";

              return (
                <div key={index} style={{ border: "1.5px solid var(--border-color)", borderRadius: "12px", background: "var(--modal-bg)", overflow: "hidden" }}>
                  {/* Card Header */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 18px", borderBottom: "1px solid var(--border-color)", background: "var(--table-header-bg)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                      <span style={{ color: "var(--text-muted)", fontWeight: "bold", cursor: "grab" }}>⋮⋮</span>
                      <span style={{ width: "22px", height: "22px", borderRadius: "50%", background: "#2C4FDB", color: "#FFF", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: "11px", fontWeight: 800 }}>
                        {index + 1}
                      </span>
                      <span style={{ fontWeight: 800, fontSize: "14px", color: "var(--text-main)" }}>
                        {col.label || `Kolom ${index + 1}`}
                      </span>
                      <span style={{ 
                        background: roleBadgeColor.bg, 
                        color: roleBadgeColor.text, 
                        border: `1.5px solid ${roleBadgeColor.border}`,
                        padding: "2px 10px", 
                        borderRadius: "20px", 
                        fontSize: "11px", 
                        fontWeight: 700,
                        display: "inline-flex",
                        alignItems: "center"
                      }}>
                        {displayedRoleLabel}
                      </span>
                    </div>
                    <button 
                      type="button"
                      onClick={() => {
                        const updated = sigColumns.filter((_, idx) => idx !== index);
                        setSigColumns(updated);
                      }}
                      style={{ background: "none", border: "none", color: "#EF4444", fontWeight: "bold", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
                    >
                      <X size={14} />
                    </button>
                  </div>

                  {/* Card Body */}
                  <div className="dashboard-two-col" style={{ padding: "18px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>

                    <div>
                      <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "var(--text-muted)", marginBottom: "6px" }}>Label kolom</label>
                      <input 
                        type="text" 
                        value={col.label}
                        onChange={(e) => {
                          const updated = [...sigColumns];
                          updated[index].label = e.target.value;
                          setSigColumns(updated);
                        }}
                        placeholder="E.g., Disetujui oleh, Mengetahui..."
                        style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1.5px solid var(--border-color)", fontSize: "13px", boxSizing: "border-box", background: "var(--input-bg)", color: "var(--text-main)" }}
                      />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "var(--text-muted)", marginBottom: "6px" }}>Peran</label>
                      <select 
                        value={selectedRoleValue}
                        onChange={(e) => {
                          const updated = [...sigColumns];
                          updated[index].role = e.target.value;
                          setSigColumns(updated);
                        }}
                        style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1.5px solid var(--border-color)", fontSize: "13px", boxSizing: "border-box", background: "var(--input-bg)", color: "var(--text-main)" }}
                      >
                        <option value="receiver">Penerima</option>
                        <option value="approver">Kepala gudang</option>
                      </select>
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "var(--text-muted)", marginBottom: "6px" }}>Nama pejabat</label>
                      <input 
                        type="text" 
                        value={col.name}
                        onChange={(e) => {
                          const updated = [...sigColumns];
                          updated[index].name = e.target.value;
                          setSigColumns(updated);
                        }}
                        placeholder="Nama (opsional)"
                        style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1.5px solid var(--border-color)", fontSize: "13px", boxSizing: "border-box", background: "var(--input-bg)", color: "var(--text-main)" }}
                      />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "var(--text-muted)", marginBottom: "6px" }}>Jabatan</label>
                      <input 
                        type="text" 
                        value={col.title}
                        onChange={(e) => {
                          const updated = [...sigColumns];
                          updated[index].title = e.target.value;
                          setSigColumns(updated);
                        }}
                        placeholder="E.g., Staff Gudang, Kepala Gudang..."
                        style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1.5px solid var(--border-color)", fontSize: "13px", boxSizing: "border-box", background: "var(--input-bg)", color: "var(--text-main)" }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Add Column Button */}
          <button 
            type="button"
            onClick={() => {
              setSigColumns([...sigColumns, { label: "Disetujui oleh", role: "receiver", name: "", title: "Staff Gudang" }]);
            }}
            style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "2px dashed var(--border-color)", background: "transparent", color: "var(--text-muted)", fontSize: "13px", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", transition: "all 0.2s" }}
          >
            + Tambah kolom
          </button>

          {/* Save Button */}
          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "24px", borderTop: "1px solid var(--border-color)", paddingTop: "16px" }}>
            <button 
              type="button"
              onClick={handleSaveSignatures}
              disabled={loading}
              style={{ padding: "10px 24px", borderRadius: "8px", border: "none", background: "#2C4FDB", color: "#FFF", fontSize: "13px", fontWeight: 700, cursor: "pointer", opacity: loading ? 0.7 : 1, display: "inline-flex", alignItems: "center", gap: "6px" }}
            >
              {loading ? "Menyimpan..." : <><Save size={14} /> Simpan Pengaturan</>}
            </button>
          </div>
        </div>
      )}

      {/* CRUD Modal Dialog */}
      {showModal && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          background: "rgba(0, 0, 0, 0.5)",
          backdropFilter: "blur(4px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 9999
        }}>
          <div style={{
            background: "var(--modal-bg)",
            borderRadius: "16px",
            width: "500px",
            maxWidth: "90%",
            maxHeight: "90vh",
            overflowY: "auto",
            boxShadow: "0 20px 25px -5px rgba(0,0,0,0.3), 0 10px 10px -5px rgba(0,0,0,0.1)",
            border: "1px solid var(--border-color)",
            animation: "fadeIn 0.2s ease-out",
            color: "var(--text-main)"
          }}>
            {/* Modal Header */}
            <div style={{ padding: "18px 24px", borderBottom: "1px solid var(--border-color)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontWeight: 800, fontSize: "16px", color: "var(--text-main)" }}>
                {modalMode === "add" ? `Add New ${activeTab.charAt(0).toUpperCase() + activeTab.slice(1, -1)}` : `Edit ${activeTab.charAt(0).toUpperCase() + activeTab.slice(1, -1)}`}
              </span>
              <button onClick={() => setShowModal(false)} style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><X size={18} /></button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleModalSubmit} style={{ padding: "24px" }}>
              
              {/* Product Form Fields */}
              {activeTab === "products" && (
                <div style={{ display: "grid", gap: "14px" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "var(--text-muted)", marginBottom: "6px" }}>Product Name</label>
                    <input 
                      type="text" 
                      value={formData.product_name}
                      onChange={(e) => setFormData({ ...formData, product_name: e.target.value })}
                      style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1.5px solid var(--border-color)", fontSize: "13px", boxSizing: "border-box", background: "var(--input-bg)", color: "var(--text-main)" }}
                      required
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "var(--text-muted)", marginBottom: "6px" }}>Internal Code</label>
                    <input 
                      type="text" 
                      value={formData.internal_code}
                      onChange={(e) => setFormData({ ...formData, internal_code: e.target.value })}
                      style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1.5px solid var(--border-color)", fontSize: "13px", boxSizing: "border-box", background: "var(--input-bg)", color: "var(--text-main)" }}
                      required
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "var(--text-muted)", marginBottom: "6px" }}>Category</label>
                    <input 
                      type="text" 
                      placeholder="E.g., Electronics, Raw Materials..."
                      value={formData.category_name}
                      onChange={(e) => setFormData({ ...formData, category_name: e.target.value })}
                      style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1.5px solid var(--border-color)", fontSize: "13px", boxSizing: "border-box", background: "var(--input-bg)", color: "var(--text-main)" }}
                      required
                    />
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                    <div>
                      <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "var(--text-muted)", marginBottom: "6px" }}>Unit Satuan</label>
                      <input 
                        type="text" 
                        placeholder="E.g., pcs, box, roll..."
                        value={formData.unit}
                        onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                        style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1.5px solid var(--border-color)", fontSize: "13px", boxSizing: "border-box", background: "var(--input-bg)", color: "var(--text-main)" }}
                        required
                      />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "var(--text-muted)", marginBottom: "6px" }}>Min Stock</label>
                      <input 
                        type="number" 
                        value={formData.min_stock}
                        onChange={(e) => setFormData({ ...formData, min_stock: e.target.value })}
                        style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1.5px solid var(--border-color)", fontSize: "13px", boxSizing: "border-box", background: "var(--input-bg)", color: "var(--text-main)" }}
                        min="0"
                        step="any"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "var(--text-muted)", marginBottom: "6px" }}>Gudang yang Mengelola (Warehouses)</label>
                    <div style={{ display: "flex", flexDirection: "column", gap: "6px", padding: "8px 12px", background: "var(--table-header-bg)", borderRadius: "8px", border: "1px solid var(--border-color)", maxHeight: "180px", overflowY: "auto" }}>
                      {warehouses.map((wh) => {
                        const isChecked = formData.warehouse_ids?.includes(wh.warehouse_id);
                        return (
                          <div key={wh.warehouse_id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "10px", padding: "4px 0", borderBottom: "1px dashed var(--border-color)" }}>
                            <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", color: "var(--text-main)", cursor: "pointer", flex: 1, margin: 0 }}>
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={(e) => {
                                  const checked = e.target.checked;
                                  const updatedIds = checked
                                    ? [...(formData.warehouse_ids || []), wh.warehouse_id]
                                    : (formData.warehouse_ids || []).filter(id => id !== wh.warehouse_id);
                                  
                                  const updatedStocks = { ...(formData.warehouse_stocks || {}) };
                                  if (!checked) {
                                    delete updatedStocks[wh.warehouse_id];
                                  } else {
                                    updatedStocks[wh.warehouse_id] = updatedStocks[wh.warehouse_id] || 0;
                                  }
                                  
                                  setFormData({ ...formData, warehouse_ids: updatedIds, warehouse_stocks: updatedStocks });
                                }}
                                style={{ cursor: "pointer", width: "16px", height: "16px", margin: 0, flexShrink: 0 }}
                              />
                              <span style={{ fontWeight: 500 }}>{wh.warehouse_name}</span>
                            </label>
                            {isChecked && (
                              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                <span style={{ fontSize: "11px", color: "var(--text-muted)", fontWeight: "bold" }}>Qty:</span>
                                <input
                                  type="number"
                                  min="0"
                                  value={formData.warehouse_stocks?.[wh.warehouse_id] ?? 0}
                                  onChange={(e) => {
                                    const val = parseInt(e.target.value) || 0;
                                    setFormData({
                                      ...formData,
                                      warehouse_stocks: {
                                        ...(formData.warehouse_stocks || {}),
                                        [wh.warehouse_id]: val
                                      }
                                    });
                                  }}
                                  style={{
                                    width: "80px",
                                    padding: "4px 8px",
                                    borderRadius: "6px",
                                    border: "1px solid var(--border-color)",
                                    fontSize: "12px",
                                    background: "var(--input-bg)",
                                    color: "var(--text-main)",
                                    textAlign: "right"
                                  }}
                                />
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* Vendor Form Fields */}
              {activeTab === "vendors" && (
                <div style={{ display: "grid", gap: "14px" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "var(--text-muted)", marginBottom: "6px" }}>Vendor Name</label>
                    <input 
                      type="text" 
                      value={formData.vendor_name}
                      onChange={(e) => setFormData({ ...formData, vendor_name: e.target.value })}
                      style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1.5px solid var(--border-color)", fontSize: "13px", boxSizing: "border-box", background: "var(--input-bg)", color: "var(--text-main)" }}
                      required
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "var(--text-muted)", marginBottom: "6px" }}>Contact Person</label>
                    <input 
                      type="text" 
                      value={formData.contact_person}
                      onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
                      style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1.5px solid var(--border-color)", fontSize: "13px", boxSizing: "border-box", background: "var(--input-bg)", color: "var(--text-main)" }}
                      required
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "var(--text-muted)", marginBottom: "6px" }}>Phone Number</label>
                    <input 
                      type="text" 
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1.5px solid var(--border-color)", fontSize: "13px", boxSizing: "border-box", background: "var(--input-bg)", color: "var(--text-main)" }}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "var(--text-muted)", marginBottom: "6px" }}>Email</label>
                    <input 
                      type="email" 
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1.5px solid var(--border-color)", fontSize: "13px", boxSizing: "border-box", background: "var(--input-bg)", color: "var(--text-main)" }}
                    />
                  </div>
                </div>
              )}

              {/* User Form Fields */}
              {activeTab === "users" && (
                <div style={{ display: "grid", gap: "14px" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "var(--text-muted)", marginBottom: "6px" }}>Full Name</label>
                    <input 
                      type="text" 
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1.5px solid var(--border-color)", fontSize: "13px", boxSizing: "border-box", background: "var(--input-bg)", color: "var(--text-main)" }}
                      required
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "var(--text-muted)", marginBottom: "6px" }}>Email Address</label>
                    <input 
                      type="email" 
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1.5px solid var(--border-color)", fontSize: "13px", boxSizing: "border-box", background: "var(--input-bg)", color: "var(--text-main)" }}
                      required
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "var(--text-muted)", marginBottom: "6px" }}>Role Access</label>
                    <select 
                      value={formData.role}
                      onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                      style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1.5px solid var(--border-color)", fontSize: "13px", boxSizing: "border-box", background: "var(--input-bg)", color: "var(--text-main)" }}
                    >
                      <option value="Master" style={{ background: "var(--modal-bg)", color: "var(--text-main)" }}>Master</option>
                      <option value="PIC" style={{ background: "var(--modal-bg)", color: "var(--text-main)" }}>PIC</option>
                      <option value="QC" style={{ background: "var(--modal-bg)", color: "var(--text-main)" }}>QC</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "var(--text-muted)", marginBottom: "6px" }}>Assign Warehouse</label>
                    <select 
                      value={formData.warehouse_name}
                      onChange={(e) => setFormData({ ...formData, warehouse_name: e.target.value })}
                      style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1.5px solid var(--border-color)", fontSize: "13px", boxSizing: "border-box", background: "var(--input-bg)", color: "var(--text-main)" }}
                      disabled={currentUser?.role === "Master"}
                    >
                      {warehouses.length > 0 ? (
                        warehouses.map(wh => (
                          <option key={wh.warehouse_id} value={wh.warehouse_name} style={{ background: "var(--modal-bg)", color: "var(--text-main)" }}>
                            {wh.warehouse_name}
                          </option>
                        ))
                      ) : (
                        <option value="Main WH" style={{ background: "var(--modal-bg)", color: "var(--text-main)" }}>Main WH</option>
                      )}
                    </select>
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "var(--text-muted)", marginBottom: "6px" }}>Password Access</label>
                    <input 
                      type="password" 
                      placeholder={modalMode === "add" ? "Enter password..." : "Leave blank to keep current password"}
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1.5px solid var(--border-color)", fontSize: "13px", boxSizing: "border-box", background: "var(--input-bg)", color: "var(--text-main)" }}
                      required={modalMode === "add"}
                    />
                  </div>
                </div>
              )}

              {/* Warehouse Form Fields */}
              {activeTab === "warehouses" && (
                <div style={{ display: "grid", gap: "14px" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "var(--text-muted)", marginBottom: "6px" }}>Warehouse Name</label>
                    <input 
                      type="text" 
                      value={formData.warehouse_name}
                      onChange={(e) => setFormData({ ...formData, warehouse_name: e.target.value })}
                      style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1.5px solid var(--border-color)", fontSize: "13px", boxSizing: "border-box", background: "var(--input-bg)", color: "var(--text-main)" }}
                      required
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "var(--text-muted)", marginBottom: "6px" }}>Address</label>
                    <input 
                      type="text" 
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1.5px solid var(--border-color)", fontSize: "13px", boxSizing: "border-box", background: "var(--input-bg)", color: "var(--text-main)" }}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "var(--text-muted)", marginBottom: "6px" }}>City</label>
                    <input 
                      type="text" 
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1.5px solid var(--border-color)", fontSize: "13px", boxSizing: "border-box", background: "var(--input-bg)", color: "var(--text-main)" }}
                    />
                  </div>
                </div>
              )}

              {/* Department Form Fields */}
              {activeTab === "departments" && (
                <div style={{ display: "grid", gap: "14px" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "var(--text-muted)", marginBottom: "6px" }}>Department Name</label>
                    <input 
                      type="text" 
                      value={formData.department_name}
                      onChange={(e) => setFormData({ ...formData, department_name: e.target.value })}
                      style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1.5px solid var(--border-color)", fontSize: "13px", boxSizing: "border-box", background: "var(--input-bg)", color: "var(--text-main)" }}
                      required
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "var(--text-muted)", marginBottom: "6px" }}>Head of Department</label>
                    <input 
                      type="text" 
                      value={formData.head_name}
                      onChange={(e) => setFormData({ ...formData, head_name: e.target.value })}
                      style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1.5px solid var(--border-color)", fontSize: "13px", boxSizing: "border-box", background: "var(--input-bg)", color: "var(--text-main)" }}
                    />
                  </div>
                </div>
              )}

              {/* Active Toggle */}
              {(activeTab === "products" || activeTab === "vendors" || activeTab === "users" || activeTab === "warehouses" || activeTab === "departments") && (
                <div style={{ marginTop: "16px", display: "flex", alignItems: "center", gap: "8px", width: "fit-content" }}>
                  <input 
                    type="checkbox" 
                    id="is_active"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    style={{ cursor: "pointer", width: "16px", height: "16px", margin: 0, flexShrink: 0 }}
                  />
                  <label htmlFor="is_active" style={{ fontSize: "12px", fontWeight: 700, color: "var(--text-muted)", cursor: "pointer", whiteSpace: "nowrap" }}>Is Active</label>
                </div>
              )}

              {/* Modal Action Buttons */}
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "24px" }}>
                <button type="button" onClick={() => setShowModal(false)} style={{ padding: "8px 20px", borderRadius: "8px", border: "1.5px solid var(--border-color)", background: "var(--card-bg)", color: "var(--text-main)", fontSize: "13px", fontWeight: 600, cursor: "pointer" }}>Batal</button>
                <button type="submit" style={{ padding: "8px 20px", borderRadius: "8px", border: "none", background: "#2C4FDB", color: "#fff", fontSize: "13px", fontWeight: 600, cursor: "pointer" }}>
                  Simpan Data
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

export default MasterDataPage;