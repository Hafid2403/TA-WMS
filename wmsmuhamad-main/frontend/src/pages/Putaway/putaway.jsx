import { useState, useEffect } from "react";
import DashboardLayout from "../../layout/DashboardLayout";
import api from "../../services/api";
import authService from "../../services/authService";
import { exportPutawayLabelPdf } from "../../utils/pdfExport";
import { 
  X, 
  Check, 
  Search, 
  Download, 
  History, 
  Clock, 
  Printer, 
  Edit2, 
  Inbox, 
  Archive, 
  Calendar,
  ChevronLeft,
  ChevronRight
} from "lucide-react";

function PutawayPage() {
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("pending"); // "pending" | "history"
  const [putaways, setPutaways] = useState([]);
  const [goodsReceipts, setGoodsReceipts] = useState([]);
  const [pendingItems, setPendingItems] = useState([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [currentUser, setCurrentUser] = useState(null);

  // Expanded rack groups state
  const [expandedRacks, setExpandedRacks] = useState({});

  // Filters
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [warehouses, setWarehouses] = useState([]);
  const [selectedWarehouse, setSelectedWarehouse] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  // Place Modal
  const [selectedItem, setSelectedItem] = useState(null);
  const [zone, setZone] = useState("");
  const [rack, setRack] = useState("");
  const [bin, setBin] = useState("");
  const [qtyPlaced, setQtyPlaced] = useState("");
  const [placedDate, setPlacedDate] = useState(new Date().toISOString().split("T")[0]);

  // Edit Placement Modal
  const [editingPutaway, setEditingPutaway] = useState(null);
  const [editZone, setEditZone] = useState("");
  const [editRack, setEditRack] = useState("");
  const [editBin, setEditBin] = useState("");


  useEffect(() => {
    document.title = "Putaway Placement | Warehouse Management System";
    const user = authService.getCurrentUser();
    setCurrentUser(user);
    if (user && user.warehouse_id) {
      setSelectedWarehouse(String(user.warehouse_id));
    }
    fetchInitialData();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedWarehouse, activeTab, startDate, endDate]);

  const fetchInitialData = async () => {
    setLoading(true);
    setError("");
    try {
      // 1. Fetch putaway history
      const putRes = await api.get("/putaway");
      let putData = [];
      if (putRes.data && putRes.data.status === "success") {
        putData = putRes.data.data;
        setPutaways(putData);
      }

      // 2. Fetch goods receipts
      const grRes = await api.get("/goods-receipt");
      if (grRes.data && grRes.data.status === "success") {
        const grs = grRes.data.data;
        setGoodsReceipts(grs);
        
        // Calculate pending putaway items
        calculatePendingItems(grs, putData);
      }

      // 3. Fetch warehouses
      const whRes = await api.get("/master/warehouses");
      if (whRes.data && whRes.data.status === "success") {
        setWarehouses(whRes.data.data);
      }
    } catch (err) {
      console.error("Error loading Putaway data:", err);
      setError("Gagal memuat data Putaway.");
    } finally {
      setLoading(false);
    }
  };

  const calculatePendingItems = (grs, puts) => {
    const pendingList = [];
    
    // Group putaway totals by gr_item_id for easy lookup
    const putTotals = {};
    puts.forEach(p => {
      const itemId = p.gr_item_id;
      putTotals[itemId] = (putTotals[itemId] || 0) + parseFloat(p.qty_placed);
    });

    grs.forEach(gr => {
      if (!gr.items) return;
      gr.items.forEach(item => {
        // We only care about items that passed QC (either fully or partially)
        if (item.qc_status === "passed" || item.qc_status === "partial") {
          const qtyAccepted = parseFloat(item.qty_accepted) || 0;
          const qtyPlacedAlready = putTotals[item.gr_item_id] || 0;
          const qtyRemaining = qtyAccepted - qtyPlacedAlready;

          if (qtyRemaining > 0) {
            pendingList.push({
              gr_item_id: item.gr_item_id,
              gr_number: gr.gr_number,
              gr_date: gr.receipt_date,
              warehouse_id: gr.warehouse_id,
              warehouse_name: gr.warehouse?.warehouse_name || "Staging",
              product_id: item.product_id,
              product_name: item.product?.product_name || "Unknown Product",
              internal_code: item.product?.internal_code || "-",
              category_name: item.product?.category?.category_name || "General",
              unit: item.product?.unit || "pcs",
              qty_accepted: qtyAccepted,
              qty_placed_already: qtyPlacedAlready,
              qty_remaining: qtyRemaining
            });
          }
        }
      });
    });

    setPendingItems(pendingList);
  };

  const handleOpenPlaceModal = (item) => {
    setSelectedItem(item);
    setZone("A");
    setRack("01");
    setBin("01");
    setQtyPlaced(item.qty_remaining);
    setPlacedDate(new Date().toISOString().split("T")[0]);
  };

  const handleClosePlaceModal = () => {
    setSelectedItem(null);
  };

  const handleSubmitPutaway = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!selectedItem) return;

    const qty = parseFloat(qtyPlaced);
    if (isNaN(qty) || qty <= 0) {
      setError("Jumlah barang ditaruh harus lebih dari 0.");
      return;
    }

    if (qty > selectedItem.qty_remaining) {
      setError(`Jumlah barang ditaruh (${qty}) tidak boleh melebihi sisa barang (${selectedItem.qty_remaining}).`);
      return;
    }

    try {
      setLoading(true);
      const payload = {
        gr_item_id: selectedItem.gr_item_id,
        zone,
        rack,
        bin,
        qty_placed: qty,
        placed_date: placedDate
      };

      const res = await api.post("/putaway", payload);
      if (res.data && res.data.status === "success") {
        setSuccess(`Berhasil menaruh ${qty} unit ${selectedItem.product_name} di Zone ${zone} / Rack ${rack} / Bin ${bin}!`);
        handleClosePlaceModal();
        fetchInitialData();
      }
    } catch (err) {
      console.error("Error submitting Putaway placement:", err);
      if (err.response && err.response.data && err.response.data.message) {
        setError(err.response.data.message);
      } else {
        setError("Gagal merekam penempatan Putaway.");
      }
    } finally {
      setLoading(false);
    }
  };

  const toggleExpandRack = (key) => {
    setExpandedRacks(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleOpenEditModal = (row) => {
    setEditingPutaway(row);
    setEditZone(row.zone || "");
    setEditRack(row.rack || "");
    setEditBin(row.bin || "");
  };

  const handleSubmitEditPutaway = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    if (!editingPutaway) return;
    try {
      setLoading(true);
      const res = await api.put(`/putaway/${editingPutaway.putaway_id}`, {
        zone: editZone,
        rack: editRack,
        bin: editBin
      });
      if (res.data && res.data.status === "success") {
        setSuccess("Berhasil memperbarui lokasi penempatan Putaway!");
        setEditingPutaway(null);
        fetchInitialData();
      }
    } catch (err) {
      console.error("Error editing Putaway placement:", err);
      if (err.response && err.response.data && err.response.data.message) {
        setError(err.response.data.message);
      } else {
        setError("Gagal memperbarui lokasi penempatan.");
      }
    } finally {
      setLoading(false);
    }
  };

  const getAggregatedHistory = () => {
    const list = getFilteredHistory();
    const grouped = {};
    list.forEach(row => {
      const key = `${row.warehouse_id}-${row.zone}-${row.rack}-${row.bin}`;
      if (!grouped[key]) {
        grouped[key] = {
          key,
          warehouse_id: row.warehouse_id,
          warehouse_name: row.warehouse?.warehouse_name || "-",
          zone: row.zone,
          rack: row.rack,
          bin: row.bin,
          items: []
        };
      }
      grouped[key].items.push(row);
    });
    return Object.values(grouped);
  };

  // Filter history list
  const getFilteredHistory = () => {
    let list = putaways;

    if (selectedWarehouse) {
      list = list.filter(row => row.warehouse_id === parseInt(selectedWarehouse));
    }

    if (startDate) {
      list = list.filter(row => row.placed_date >= startDate);
    }
    if (endDate) {
      list = list.filter(row => row.placed_date <= endDate);
    }

    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      list = list.filter(row => 
        (row.product?.product_name || "").toLowerCase().includes(q) ||
        (row.product?.internal_code || "").toLowerCase().includes(q) ||
        (row.goods_receipt_item?.goods_receipt?.gr_number || "").toLowerCase().includes(q) ||
        (row.zone || "").toLowerCase().includes(q) ||
        (row.rack || "").toLowerCase().includes(q)
      );
    }

    return list;
  };

  const getFilteredPending = () => {
    let list = pendingItems;

    if (selectedWarehouse) {
      list = list.filter(item => item.warehouse_id === parseInt(selectedWarehouse));
    }

    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      list = list.filter(item => 
        item.product_name.toLowerCase().includes(q) ||
        item.internal_code.toLowerCase().includes(q) ||
        item.gr_number.toLowerCase().includes(q)
      );
    }

    return list;
  };

  const filteredHistory = getFilteredHistory();
  const filteredPending = getFilteredPending();

  // Premium design styling helpers
  const tabBtnStyle = (active) => ({
    padding: "10px 20px",
    borderRadius: "8px",
    border: "none",
    background: active ? "#2C4FDB" : "transparent",
    color: active ? "#fff" : "var(--text-muted)",
    fontSize: "13px",
    fontWeight: 700,
    cursor: "pointer",
    transition: "all 0.2s ease",
    flexShrink: 0
  });

  const ITEMS_PER_PAGE = 10;

  const aggregatedHistoryList = getAggregatedHistory();
  const totalHistoryPages = Math.ceil(aggregatedHistoryList.length / ITEMS_PER_PAGE);
  const paginatedHistory = aggregatedHistoryList.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const totalPendingPages = Math.ceil(filteredPending.length / ITEMS_PER_PAGE);
  const paginatedPending = filteredPending.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const renderPagination = (totalPages, label) => {
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
    <DashboardLayout title="Putaway Placements">
      {/* Alert Banners */}
      {error && (
        <div style={{ padding: "12px 16px", background: "var(--status-danger-bg)", border: "1.5px solid var(--status-danger-border)", color: "var(--status-danger-text)", borderRadius: "8px", marginBottom: "20px", fontSize: "13px", fontWeight: 600, display: "flex", alignItems: "center", gap: "6px" }}>
          <X size={14} /> {error}
        </div>
      )}
      {success && (
        <div style={{ padding: "12px 16px", background: "var(--status-success-bg)", border: "1.5px solid var(--status-success-border)", color: "var(--status-success-text)", borderRadius: "8px", marginBottom: "20px", fontSize: "13px", fontWeight: 600, display: "flex", alignItems: "center", gap: "6px" }}>
          <Check size={14} /> {success}
        </div>
      )}

      {/* Tabs and Filters Panel */}
      <div style={{ background: "var(--card-bg)", borderRadius: "12px", border: "1px solid var(--border-color)", padding: "16px", marginBottom: "20px", display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: "16px", color: "var(--text-main)" }}>
        <div className="scrollable-tabs" style={{ display: "flex", background: "var(--table-header-bg)", padding: "4px", borderRadius: "10px", gap: "4px", overflowX: "auto", whiteSpace: "nowrap", WebkitOverflowScrolling: "touch", maxWidth: "100%" }}>
          <button style={tabBtnStyle(activeTab === "pending")} onClick={() => { setActiveTab("pending"); setSearchTerm(""); }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}><Clock size={14} /> Pending Placements ({pendingItems.length})</span>
          </button>
          <button style={tabBtnStyle(activeTab === "history")} onClick={() => { setActiveTab("history"); setSearchTerm(""); }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}><History size={14} /> Placement Logs ({putaways.length})</span>
          </button>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
          {/* Date range filters only for history log tab */}
          {activeTab === "history" && (
            <div className="date-range-picker">
              <input 
                type="date" 
                value={startDate} 
                onChange={(e) => setStartDate(e.target.value)}
                style={{ padding: "8px 12px", borderRadius: "8px", border: "1.5px solid var(--border-color)", fontSize: "12px", background: "var(--input-bg)", color: "var(--text-main)" }} 
              />
              <span style={{ fontSize: "12px", color: "var(--text-muted)", fontWeight: "bold" }}>to</span>
              <input 
                type="date" 
                value={endDate} 
                onChange={(e) => setEndDate(e.target.value)}
                style={{ padding: "8px 12px", borderRadius: "8px", border: "1.5px solid var(--border-color)", fontSize: "12px", background: "var(--input-bg)", color: "var(--text-main)" }} 
              />
              {(startDate || endDate) && (
                <button 
                  onClick={() => { setStartDate(""); setEndDate(""); }}
                  style={{ padding: "8px 12px", borderRadius: "8px", border: "none", background: "#FEE2E2", color: "#991B1B", fontSize: "12px", fontWeight: "bold", cursor: "pointer" }}
                >
                  Clear Date
                </button>
              )}
            </div>
          )}

          <select 
            value={selectedWarehouse}
            onChange={(e) => setSelectedWarehouse(e.target.value)}
            style={{ padding: "8px 12px", borderRadius: "8px", border: "1.5px solid var(--border-color)", fontSize: "13px", background: "var(--input-bg)", color: "var(--text-main)" }}
          >
            <option value="">All Warehouses</option>
            {warehouses.map(w => (
              <option key={w.warehouse_id} value={w.warehouse_id}>{w.warehouse_name}</option>
            ))}
          </select>

          <input 
            placeholder="Search products or references..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ padding: "8px 16px", borderRadius: "8px", border: "1.5px solid var(--border-color)", fontSize: "13px", width: "240px", background: "var(--input-bg)", color: "var(--text-main)" }}
          />
        </div>
      </div>

      {/* Main Table Content */}
      <div style={{ background: "var(--card-bg)", borderRadius: "12px", border: "1px solid var(--border-color)", overflow: "hidden", color: "var(--text-main)" }}>
        {activeTab === "pending" ? (
          <div>
            <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border-color)", background: "var(--table-header-bg)" }}>
              <span style={{ fontWeight: 800, fontSize: "14px", color: "var(--text-main)" }}>Pending Putaway Staging List</span>
              <div style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "4px" }}>Items listed below have successfully passed QC Inspection and are awaiting assignment to a specific shelf location.</div>
            </div>
            <div className="table-wrap">
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                <thead>
                  <tr style={{ background: "var(--table-header-bg)" }}>
                    {["GR Number", "Receipt Date", "Product Code", "Product Name", "QC Accepted", "Placed Qty", "Remaining Qty", "Action"].map((h, idx) => (
                      <th key={idx} style={{ 
                        textAlign: h === "Action" ? "center" : (h.includes("Qty") || h.includes("Accepted") ? "center" : "left"),
                        padding: "12px 20px", 
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
                  {paginatedPending.length === 0 ? (
                    <tr>
                      <td colSpan="8" style={{ padding: "24px", textAlign: "center", color: "var(--text-muted)" }}>
                        Tidak ada barang di staging area yang menunggu putaway placement.
                      </td>
                    </tr>
                  ) : (
                    paginatedPending.map((item) => (
                      <tr key={item.gr_item_id} style={{ borderBottom: "1px solid var(--border-color)" }}>
                        <td style={{ padding: "12px 20px", fontWeight: 700, color: "var(--text-main)" }}>{item.gr_number}</td>
                        <td style={{ padding: "12px 20px", color: "var(--text-muted)" }}>{new Date(item.gr_date).toLocaleDateString("id-ID")}</td>
                        <td style={{ padding: "12px 20px" }}><span style={{ background: "var(--table-header-bg)", border: "1px solid var(--border-color)", padding: "2px 6px", borderRadius: "4px", fontSize: "11px", fontFamily: "monospace", color: "var(--text-muted)" }}>{item.internal_code}</span></td>
                        <td style={{ padding: "12px 20px", fontWeight: 600, color: "var(--text-main)" }}>{item.product_name}</td>
                        <td style={{ padding: "12px 20px", textAlign: "center", fontWeight: 700, color: "var(--text-main)" }}>{item.qty_accepted} {item.unit}</td>
                        <td style={{ padding: "12px 20px", textAlign: "center", color: "#10B981", fontWeight: 700 }}>{item.qty_placed_already} {item.unit}</td>
                        <td style={{ padding: "12px 20px", textAlign: "center", color: "#EF4444", fontWeight: 700 }}>{item.qty_remaining} {item.unit}</td>
                        <td style={{ padding: "12px 20px", textAlign: "center" }}>
                          <button 
                            onClick={() => handleOpenPlaceModal(item)}
                            style={{ padding: "6px 12px", borderRadius: "6px", border: "none", background: "#2C4FDB", color: "#fff", fontSize: "12px", fontWeight: 700, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "4px" }}
                          >
                            <Inbox size={12} /> Place Shelf
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            {renderPagination(totalPendingPages, "Pending Putaway")}
          </div>
        ) : (
          <div>
            <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border-color)", background: "var(--table-header-bg)" }}>
              <span style={{ fontWeight: 800, fontSize: "14px", color: "var(--text-main)" }}>Putaway Placement History Logs</span>
              <div style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "4px" }}>Historical log of physical inventory placements grouped by specific shelf locations.</div>
            </div>
            <div className="table-wrap">
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                <thead>
                  <tr style={{ background: "var(--table-header-bg)" }}>
                    {["Rack Location", "Warehouse", "Total Items", "Action"].map((h, idx) => (
                      <th key={idx} style={{ 
                        textAlign: h === "Action" || h === "Total Items" ? "center" : "left",
                        padding: "12px 20px", 
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
                      <td colSpan="4" style={{ padding: "24px", textAlign: "center", color: "var(--text-muted)" }}>
                        Tidak ada riwayat penempatan Putaway.
                      </td>
                    </tr>
                  ) : (
                    paginatedHistory.map((group) => {
                      const isExpanded = !!expandedRacks[group.key];
                      return (
                        <>
                          <tr key={group.key} style={{ borderBottom: "1px solid var(--border-color)", background: isExpanded ? "var(--table-header-bg)" : "transparent" }}>
                            <td style={{ padding: "12px 20px" }}>
                              <span style={{ background: "var(--table-header-bg)", padding: "4px 10px", borderRadius: "6px", border: "1px solid var(--border-color)", fontFamily: "monospace", fontSize: "12px", color: "var(--text-main)", fontWeight: 700 }}>
                                Zone {group.zone} / Rack {group.rack} / Bin {group.bin}
                              </span>
                            </td>
                            <td style={{ padding: "12px 20px", color: "var(--text-main)", fontWeight: 600 }}>{group.warehouse_name}</td>
                            <td style={{ padding: "12px 20px", textAlign: "center", fontWeight: 700, color: "var(--text-main)" }}>{group.items.length} Product(s)</td>
                            <td style={{ padding: "12px 20px", textAlign: "center" }}>
                              <div style={{ display: "flex", justifyContent: "center", gap: "8px" }}>
                                <button 
                                  onClick={() => toggleExpandRack(group.key)}
                                  style={{ 
                                    padding: "5px 12px", 
                                    borderRadius: "6px", 
                                    border: "1.5px solid var(--border-color)", 
                                    background: "var(--card-bg)", 
                                    color: "var(--text-main)", 
                                    fontSize: "11px", 
                                    fontWeight: 700, 
                                    cursor: "pointer",
                                    transition: "all 0.2s" 
                                  }}
                                >
                                  {isExpanded ? "▲ Hide Items" : "▼ View Items (" + group.items.length + ")"}
                                </button>
                                <button 
                                  onClick={() => exportPutawayLabelPdf(group)}
                                  style={{ 
                                    padding: "5px 12px", 
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
                                  <Printer size={12} /> Cetak Label
                                </button>
                              </div>
                            </td>
                          </tr>
                          {isExpanded && (
                            <tr key={`${group.key}-expanded`}>
                              <td colSpan="4" style={{ padding: "12px 24px", background: "var(--table-header-bg)", borderBottom: "1px solid var(--border-color)" }}>
                                <div style={{ padding: "16px", background: "var(--card-bg)", borderRadius: "8px", border: "1px solid var(--border-color)", boxShadow: "inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)", overflowX: "auto" }}>
                                  <strong style={{ fontSize: "11px", color: "var(--text-muted)", display: "block", marginBottom: "8px", textTransform: "uppercase" }}>
                                    <Archive size={12} style={{ marginRight: "6px" }} /> Detail Items inside Shelf (Zone {group.zone} / Rack {group.rack} / Bin {group.bin})
                                  </strong>
                                  <table style={{ width: "100%", minWidth: "600px", borderCollapse: "collapse", fontSize: "12px" }}>
                                    <thead>
                                      <tr style={{ borderBottom: "1.5px solid var(--border-color)" }}>
                                        <th style={{ padding: "6px 12px", textAlign: "left", color: "var(--text-muted)" }}>Product Name</th>
                                        <th style={{ padding: "6px 12px", textAlign: "left", color: "var(--text-muted)" }}>Putaway Code</th>
                                        <th style={{ padding: "6px 12px", textAlign: "left", color: "var(--text-muted)" }}>Warehouse</th>
                                        <th style={{ padding: "6px 12px", textAlign: "center", color: "var(--text-muted)" }}>Stock Saat Ini</th>
                                        <th style={{ padding: "6px 12px", textAlign: "left", color: "var(--text-muted)" }}>History</th>
                                        <th style={{ padding: "6px 12px", textAlign: "center", color: "var(--text-muted)" }}>Action</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {(() => {
                                        const productGroups = {};
                                        group.items.forEach(item => {
                                          const pid = item.product_id;
                                          if (!productGroups[pid]) {
                                            productGroups[pid] = [];
                                          }
                                          productGroups[pid].push(item);
                                        });

                                        return Object.values(productGroups).map((itemsList) => {
                                          const row = itemsList[0];
                                          const stockRecord = row.product?.stocks?.find(s => s.warehouse_id === row.warehouse_id);
                                          const currentStock = stockRecord ? stockRecord.qty_available : 0;
                                          const putawayCode = "PA-" + row.placed_date.split("T")[0].replace(/-/g, "") + "-" + String(row.putaway_id).padStart(4, "0");
                                          
                                          const historyText = itemsList.map(r => {
                                            const dateStr = new Date(r.placed_date).toLocaleDateString("id-ID", {
                                              day: "2-digit",
                                              month: "short",
                                              year: "numeric"
                                            });
                                            return `${dateStr} (${r.operator?.name || "-"})`;
                                          }).join(", ");

                                          return (
                                            <tr key={row.product_id} style={{ borderBottom: "1px solid var(--border-color)" }}>
                                              <td style={{ padding: "8px 12px", fontWeight: 700, color: "var(--text-main)" }}>{row.product?.product_name || "Product"}</td>
                                              <td style={{ padding: "8px 12px", color: "var(--text-muted)", fontFamily: "monospace" }}>{putawayCode}</td>
                                              <td style={{ padding: "8px 12px", color: "var(--text-main)" }}>{row.warehouse?.warehouse_name || "-"}</td>
                                              <td style={{ padding: "8px 12px", textAlign: "center", fontWeight: 700, color: "#2C4FDB" }}>{currentStock} {row.product?.unit || "pcs"}</td>
                                              <td style={{ padding: "8px 12px", color: "var(--text-muted)", fontSize: "11px" }}>{historyText}</td>
                                              <td style={{ padding: "8px 12px", textAlign: "center" }}>
                                                <button 
                                                  onClick={() => handleOpenEditModal(row)}
                                                  style={{ 
                                                    padding: "4px 10px", 
                                                    borderRadius: "4px", 
                                                    border: "none", 
                                                    background: "#EAB308", 
                                                    color: "#fff", 
                                                    fontSize: "11px", 
                                                    fontWeight: 700, 
                                                    cursor: "pointer",
                                                    display: "inline-flex",
                                                    alignItems: "center",
                                                    gap: "4px"
                                                  }}
                                                >
                                                  <Edit2 size={10} /> Edit
                                                </button>
                                              </td>
                                            </tr>
                                          );
                                        });
                                      })()}
                                    </tbody>
                                  </table>
                                </div>
                              </td>
                            </tr>
                          )}
                        </>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
            {renderPagination(totalHistoryPages, "Placement Logs")}
          </div>
        )
}
      </div>

      {/* Putaway Placement Form Modal */}
      {selectedItem && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(15, 23, 42, 0.6)", backdropFilter: "blur(4px)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1000 }}>
          <form onSubmit={handleSubmitPutaway} style={{ background: "var(--modal-bg)", borderRadius: "12px", width: "420px", border: "1px solid var(--border-color)", overflow: "hidden", color: "var(--text-main)" }}>
            <div style={{ padding: "18px 24px", borderBottom: "1px solid var(--border-color)", display: "flex", justifyContent: "space-between", alignItems: "center", background: "var(--table-header-bg)" }}>
              <span style={{ fontWeight: 800, fontSize: "15px", color: "var(--text-main)" }}>Shelf Location Assignment</span>
              <button type="button" onClick={handleClosePlaceModal} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><X size={16} /></button>
            </div>
            
            <div style={{ padding: "24px", fontSize: "13px", display: "flex", flexDirection: "column", gap: "14px" }}>
              <div style={{ background: "var(--table-header-bg)", padding: "12px", borderRadius: "8px", border: "1px solid var(--border-color)", display: "flex", flexDirection: "column", gap: "4px" }}>
                <span style={{ fontSize: "11px", color: "var(--text-muted)", fontWeight: 600 }}>PRODUCT</span>
                <span style={{ fontWeight: 800, fontSize: "14px" }}>{selectedItem.product_name}</span>
                <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>GR Source: {selectedItem.gr_number} · Accepted QC Qty: {selectedItem.qty_accepted}</span>
              </div>

              {currentUser && currentUser.warehouse_id && selectedItem && parseInt(selectedItem.warehouse_id) !== parseInt(currentUser.warehouse_id) && (
                <div style={{ padding: "12px 16px", borderRadius: "8px", background: "rgba(239, 68, 68, 0.1)", border: "1.5px solid #EF4444", color: "#EF4444", fontSize: "13px", fontWeight: "600", display: "flex", alignItems: "center", gap: "8px" }}>
                  <X size={14} />
                  <span>Anda tidak memiliki otoritas akses untuk memproses transaksi di warehouse ini.</span>
                </div>
              )}

              <div>
                <label style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-muted)", display: "block", marginBottom: "6px" }}>Warehouse Target</label>
                <input 
                  type="text" 
                  value={selectedItem.warehouse_name} 
                  disabled 
                  style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1.5px solid var(--border-color)", fontSize: "13px", boxSizing: "border-box", background: "var(--table-header-bg)", color: "var(--text-muted)" }} 
                />
              </div>

              <div className="grid-form-row">
                <div>
                  <label style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-muted)", display: "block", marginBottom: "6px" }}>Placement Date</label>
                  <input 
                    type="date" 
                    value={placedDate} 
                    onChange={(e) => setPlacedDate(e.target.value)}
                    style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1.5px solid var(--border-color)", fontSize: "13px", boxSizing: "border-box", background: "var(--input-bg)", color: "var(--text-main)" }} 
                    required
                  />
                </div>
                <div>
                  <label style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-muted)", display: "block", marginBottom: "6px" }}>Quantity to Place</label>
                  <input 
                    type="number" 
                    value={qtyPlaced} 
                    onChange={(e) => setQtyPlaced(e.target.value)}
                    max={selectedItem.qty_remaining}
                    min="1"
                    className="place-qty-input"
                    style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1.5px solid var(--border-color)", fontSize: "13px", boxSizing: "border-box", background: "var(--input-bg)", color: "var(--text-main)" }} 
                    required
                  />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "10px" }}>
                <div>
                  <label style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-muted)", display: "block", marginBottom: "6px" }}>Zone</label>
                  <input 
                    placeholder="E.g., A" 
                    value={zone} 
                    onChange={(e) => setZone(e.target.value.toUpperCase())}
                    className="place-zone-input"
                    style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1.5px solid var(--border-color)", fontSize: "13px", boxSizing: "border-box", background: "var(--input-bg)", color: "var(--text-main)", textAlign: "center" }}
                    maxLength="5"
                    required
                  />
                </div>
                <div>
                  <label style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-muted)", display: "block", marginBottom: "6px" }}>Rack</label>
                  <input 
                    placeholder="E.g., 01" 
                    value={rack} 
                    onChange={(e) => setRack(e.target.value)}
                    className="place-rack-input"
                    style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1.5px solid var(--border-color)", fontSize: "13px", boxSizing: "border-box", background: "var(--input-bg)", color: "var(--text-main)", textAlign: "center" }}
                    maxLength="5"
                    required
                  />
                </div>
                <div>
                  <label style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-muted)", display: "block", marginBottom: "6px" }}>Bin</label>
                  <input 
                    placeholder="E.g., 01" 
                    value={bin} 
                    onChange={(e) => setBin(e.target.value)}
                    className="place-bin-input"
                    style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1.5px solid var(--border-color)", fontSize: "13px", boxSizing: "border-box", background: "var(--input-bg)", color: "var(--text-main)", textAlign: "center" }}
                    maxLength="5"
                    required
                  />
                </div>
              </div>
            </div>

            <div style={{ padding: "14px 24px", background: "var(--table-header-bg)", borderTop: "1px solid var(--border-color)", display: "flex", justifyContent: "flex-end", gap: "10px" }}>
              <button type="button" onClick={handleClosePlaceModal} style={{ padding: "6px 16px", borderRadius: "8px", border: "1.5px solid var(--border-color)", background: "var(--card-bg)", cursor: "pointer", fontSize: "12px", fontWeight: 600, color: "var(--text-main)" }}>Batal</button>
              <button type="submit" disabled={loading || (currentUser && currentUser.warehouse_id && selectedItem && parseInt(selectedItem.warehouse_id) !== parseInt(currentUser.warehouse_id))} style={{ padding: "6px 16px", borderRadius: "8px", border: "none", background: "#2C4FDB", color: "#fff", cursor: "pointer", fontSize: "12px", fontWeight: 600, opacity: (loading || (currentUser && currentUser.warehouse_id && selectedItem && parseInt(selectedItem.warehouse_id) !== parseInt(currentUser.warehouse_id))) ? 0.7 : 1 }}>
                {loading ? "Saving..." : "Simpan Penempatan"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Edit Putaway Placement Modal */}
      {editingPutaway && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(15, 23, 42, 0.6)", backdropFilter: "blur(4px)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1000 }}>
          <form onSubmit={handleSubmitEditPutaway} style={{ background: "var(--modal-bg)", borderRadius: "12px", width: "420px", border: "1px solid var(--border-color)", overflow: "hidden", color: "var(--text-main)" }}>
            <div style={{ padding: "18px 24px", borderBottom: "1px solid var(--border-color)", display: "flex", justifyContent: "space-between", alignItems: "center", background: "var(--table-header-bg)" }}>
              <span style={{ fontWeight: 800, fontSize: "15px", color: "var(--text-main)" }}>Koreksi Penempatan Rak</span>
              <button type="button" onClick={() => setEditingPutaway(null)} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><X size={16} /></button>
            </div>
            
            <div style={{ padding: "24px", fontSize: "13px", display: "flex", flexDirection: "column", gap: "14px" }}>
              <div style={{ background: "var(--table-header-bg)", padding: "12px", borderRadius: "8px", border: "1px solid var(--border-color)", display: "flex", flexDirection: "column", gap: "4px" }}>
                <span style={{ fontSize: "11px", color: "var(--text-muted)", fontWeight: 600 }}>PRODUCT</span>
                <span style={{ fontWeight: 800, fontSize: "14px" }}>{editingPutaway.product?.product_name || "Product"}</span>
                <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>Lokasi Asal: Zone {editingPutaway.zone} / Rack {editingPutaway.rack} / Bin {editingPutaway.bin}</span>
              </div>

              {currentUser && currentUser.warehouse_id && editingPutaway && parseInt(editingPutaway.warehouse_id) !== parseInt(currentUser.warehouse_id) && (
                <div style={{ padding: "12px 16px", borderRadius: "8px", background: "rgba(239, 68, 68, 0.1)", border: "1.5px solid #EF4444", color: "#EF4444", fontSize: "13px", fontWeight: "600", display: "flex", alignItems: "center", gap: "8px" }}>
                  <X size={14} />
                  <span>Anda tidak memiliki otoritas akses untuk memproses transaksi di warehouse ini.</span>
                </div>
              )}

              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "10px" }}>
                <div>
                  <label style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-muted)", display: "block", marginBottom: "6px" }}>Zone</label>
                  <input 
                    placeholder="E.g., A" 
                    value={editZone} 
                    onChange={(e) => setEditZone(e.target.value.toUpperCase())}
                    className="edit-zone-input"
                    style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1.5px solid var(--border-color)", fontSize: "13px", boxSizing: "border-box", background: "var(--input-bg)", color: "var(--text-main)", textAlign: "center" }}
                    maxLength="5"
                    required
                  />
                </div>
                <div>
                  <label style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-muted)", display: "block", marginBottom: "6px" }}>Rack</label>
                  <input 
                    placeholder="E.g., 01" 
                    value={editRack} 
                    onChange={(e) => setEditRack(e.target.value)}
                    className="edit-rack-input"
                    style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1.5px solid var(--border-color)", fontSize: "13px", boxSizing: "border-box", background: "var(--input-bg)", color: "var(--text-main)", textAlign: "center" }}
                    maxLength="5"
                    required
                  />
                </div>
                <div>
                  <label style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-muted)", display: "block", marginBottom: "6px" }}>Bin</label>
                  <input 
                    placeholder="E.g., 01" 
                    value={editBin} 
                    onChange={(e) => setEditBin(e.target.value)}
                    className="edit-bin-input"
                    style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1.5px solid var(--border-color)", fontSize: "13px", boxSizing: "border-box", background: "var(--input-bg)", color: "var(--text-main)", textAlign: "center" }}
                    maxLength="5"
                    required
                  />
                </div>
              </div>
            </div>

            <div style={{ padding: "14px 24px", background: "var(--table-header-bg)", borderTop: "1px solid var(--border-color)", display: "flex", justifyContent: "flex-end", gap: "10px" }}>
              <button type="button" onClick={() => setEditingPutaway(null)} style={{ padding: "6px 16px", borderRadius: "8px", border: "1.5px solid var(--border-color)", background: "var(--card-bg)", cursor: "pointer", fontSize: "12px", fontWeight: 600, color: "var(--text-main)" }}>Batal</button>
              <button type="submit" disabled={loading || (currentUser && currentUser.warehouse_id && editingPutaway && parseInt(editingPutaway.warehouse_id) !== parseInt(currentUser.warehouse_id))} style={{ padding: "6px 16px", borderRadius: "8px", border: "none", background: "#2C4FDB", color: "#fff", cursor: "pointer", fontSize: "12px", fontWeight: 600, opacity: (loading || (currentUser && currentUser.warehouse_id && editingPutaway && parseInt(editingPutaway.warehouse_id) !== parseInt(currentUser.warehouse_id))) ? 0.7 : 1 }}>
                {loading ? "Saving..." : "Simpan Perubahan"}
              </button>
            </div>
          </form>
        </div>
      )}
    </DashboardLayout>
  );
}

export default PutawayPage;
