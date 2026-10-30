import React, { useEffect, useState } from "react";
import DashboardLayout from "../../layout/DashboardLayout";
import api from "../../services/api";
import {
  Search,
  RefreshCw,
  Clock,
  ShieldAlert,
  User,
  Activity,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import "../../styles/superadmin.css";

function SuperadminAuditLogs() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [logs, setLogs] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  useEffect(() => {
    document.title = "System Audit Trail | WMS Super Admin";
    loadData();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await api.get("/superadmin/audit-logs");
      if (res.data && res.data.status === "success") {
        setLogs(res.data.data);
      }
    } catch (err) {
      console.error("Error loading audit logs:", err);
      setError("Gagal memuat log audit sistem.");
    } finally {
      setLoading(false);
    }
  };

  const filteredLogs = logs.filter((log) => {
    const operator = log.user?.name || "System";
    const activityType = log.activity_type || log.action || "";
    const description = log.description || "";
    const matchesSearch =
      activityType.toLowerCase().includes(searchQuery.toLowerCase()) ||
      description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      operator.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const totalPages = Math.ceil(filteredLogs.length / ITEMS_PER_PAGE);
  const paginatedLogs = filteredLogs.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const getLogTypeBadge = (type) => {
    const t = type ? type.toLowerCase() : "";
    if (t.includes("create") || t.includes("add") || t.includes("register")) {
      return "badge badge-success";
    }
    if (t.includes("delete") || t.includes("reject") || t.includes("remove")) {
      return "badge badge-danger";
    }
    if (t.includes("update") || t.includes("edit") || t.includes("change")) {
      return "badge badge-warning";
    }
    return "badge badge-info";
  };

  return (
    <DashboardLayout title="System Audit Trail">
      <div className="superadmin-container">
        {error && <div className="banner-alert danger">{error}</div>}

        {/* Filter Toolbar */}
        <div className="search-bar">
          <div className="search-input-wrap">
            <Search size={16} className="search-icon" />
            <input
              type="text"
              placeholder="Cari aktivitas, deskripsi log, atau nama operator..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <button className="btn btn-outline" onClick={loadData} title="Refresh Logs" style={{ height: "38px", display: "inline-flex", alignItems: "center", gap: "6px" }}>
            <RefreshCw size={14} /> Segarkan Log
          </button>
        </div>

        {/* Audit Logs Bento Panel */}
        <div className="panel" style={{ padding: "0", overflow: "hidden" }}>
          <div className="panel-header" style={{ padding: "16px 20px", borderBottom: "1px solid var(--border-color)", background: "var(--card-bg)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <Activity size={18} style={{ color: "var(--primary-color)" }} />
              <div className="panel-title" style={{ fontSize: "14px", fontWeight: "bold" }}>Aktivitas Sistem Terkini (Maks. 100 Log)</div>
            </div>
          </div>
          <div className="table-wrap">
            {loading ? (
              <div style={{ textAlign: "center", padding: "40px", color: "var(--text-muted)" }}>
                Memuat catatan aktivitas...
              </div>
            ) : filteredLogs.length === 0 ? (
              <div style={{ textAlign: "center", padding: "40px", color: "var(--text-muted)" }}>
                Tidak ada log aktivitas yang ditemukan.
              </div>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>Waktu (Timestamp)</th>
                    <th>Tipe Aktivitas</th>
                    <th>Deskripsi Perubahan</th>
                    <th>Operator</th>
                    <th>Role</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedLogs.map((log) => (
                    <tr key={log.id}>
                      <td style={{ whiteSpace: "nowrap" }}>
                        <span style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px" }}>
                          <Clock size={12} style={{ color: "var(--text-muted)" }} />
                          {new Date(log.created_at).toLocaleString("id-ID")}
                        </span>
                      </td>
                      <td>
                        <span className={getLogTypeBadge(log.activity_type || log.action)}>
                          {log.activity_type || log.action}
                        </span>
                      </td>
                      <td>
                        <div style={{ maxWidth: "400px", wordWrap: "break-word", fontSize: "13px" }}>
                          {log.description}
                        </div>
                      </td>
                      <td>
                        <span style={{ display: "flex", alignItems: "center", gap: "6px", fontWeight: 500 }}>
                          <User size={12} style={{ color: "var(--text-muted)" }} />
                          {log.user ? log.user.name : "System"}
                        </span>
                      </td>
                      <td>
                        {log.user?.role ? (
                          <span className={`badge badge-${log.user.role.role_name === 'Super Admin' ? 'purple' : log.user.role.role_name === 'Master' ? 'info' : 'teal'}`}>
                            {log.user.role.role_name}
                          </span>
                        ) : (
                          <span className="badge badge-secondary">Cronjob / Auto</span>
                        )}
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
      </div>
    </DashboardLayout>
  );
}

export default SuperadminAuditLogs;
