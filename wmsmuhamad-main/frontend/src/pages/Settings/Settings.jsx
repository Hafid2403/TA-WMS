import { useState, useEffect } from "react";
import DashboardLayout from "../../layout/DashboardLayout";
import api from "../../services/api";
import { AlertTriangle, CheckCircle, Eye, EyeOff } from "lucide-react";

function SettingsPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [formData, setFormData] = useState({
    current_password: "",
    new_password: "",
    new_password_confirmation: ""
  });

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    document.title = "Pengaturan Akun | Warehouse Management System";
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!formData.current_password || !formData.new_password || !formData.new_password_confirmation) {
      setError("Semua field wajib diisi.");
      return;
    }

    if (formData.new_password !== formData.new_password_confirmation) {
      setError("Konfirmasi password baru tidak cocok.");
      return;
    }

    if (formData.new_password.length < 6) {
      setError("Password baru minimal 6 karakter.");
      return;
    }

    setLoading(true);
    try {
      const response = await api.post("/auth/change-password", {
        current_password: formData.current_password,
        new_password: formData.new_password,
        new_password_confirmation: formData.new_password_confirmation
      });

      if (response.data && response.data.status === "success") {
        setSuccess("Password Anda berhasil diubah!");
        setFormData({
          current_password: "",
          new_password: "",
          new_password_confirmation: ""
        });
        setShowCurrent(false);
        setShowNew(false);
        setShowConfirm(false);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Gagal mengubah password. Silakan coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout title="Pengaturan Akun">
      <div style={{ maxWidth: "600px", margin: "0 auto", padding: "24px 0" }}>
        <div style={{ background: "var(--card-bg)", borderRadius: "12px", border: "1px solid var(--border-color)", padding: "30px", color: "var(--text-main)" }}>
          <div style={{ marginBottom: "24px" }}>
            <h2 style={{ fontSize: "18px", fontWeight: 700, margin: "0 0 6px 0", color: "var(--text-main)" }}>Ubah Password</h2>
            <p style={{ fontSize: "13px", color: "var(--text-muted)", margin: 0 }}>Ubah password login akun WMS Anda saat ini demi menjaga keamanan sistem.</p>
          </div>

          {error && (
            <div style={{ padding: "12px 16px", background: "var(--status-danger-bg)", border: "1.5px solid var(--status-danger-border)", color: "var(--status-danger-text)", borderRadius: "8px", marginBottom: "20px", fontSize: "13px", fontWeight: 600, display: "flex", alignItems: "center", gap: "8px" }}>
              <AlertTriangle size={16} /> {error}
            </div>
          )}

          {success && (
            <div style={{ padding: "12px 16px", background: "var(--status-success-bg)", border: "1.5px solid var(--status-success-border)", color: "var(--status-success-text)", borderRadius: "8px", marginBottom: "20px", fontSize: "13px", fontWeight: 600, display: "flex", alignItems: "center", gap: "8px" }}>
              <CheckCircle size={16} /> {success}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <label style={{ fontSize: "12px", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" }}>Password Saat Ini</label>
              <div style={{ position: "relative", width: "100%" }}>
                <input
                  type={showCurrent ? "text" : "password"}
                  name="current_password"
                  value={formData.current_password}
                  onChange={handleChange}
                  placeholder="Masukkan password saat ini"
                  style={{ width: "100%", padding: "10px 40px 10px 14px", borderRadius: "8px", border: "1.5px solid var(--border-color)", fontSize: "13px", boxSizing: "border-box", background: "var(--input-bg)", color: "var(--text-main)" }}
                  required
                />
                <span 
                  onClick={() => setShowCurrent(!showCurrent)}
                  style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", cursor: "pointer", display: "flex", alignItems: "center", userSelect: "none" }}
                >
                  {showCurrent ? <EyeOff size={16} /> : <Eye size={16} />}
                </span>
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <label style={{ fontSize: "12px", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" }}>Password Baru</label>
              <div style={{ position: "relative", width: "100%" }}>
                <input
                  type={showNew ? "text" : "password"}
                  name="new_password"
                  value={formData.new_password}
                  onChange={handleChange}
                  placeholder="Minimal 6 karakter"
                  style={{ width: "100%", padding: "10px 40px 10px 14px", borderRadius: "8px", border: "1.5px solid var(--border-color)", fontSize: "13px", boxSizing: "border-box", background: "var(--input-bg)", color: "var(--text-main)" }}
                  required
                />
                <span 
                  onClick={() => setShowNew(!showNew)}
                  style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", cursor: "pointer", display: "flex", alignItems: "center", userSelect: "none" }}
                >
                  {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
                </span>
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <label style={{ fontSize: "12px", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" }}>Konfirmasi Password Baru</label>
              <div style={{ position: "relative", width: "100%" }}>
                <input
                  type={showConfirm ? "text" : "password"}
                  name="new_password_confirmation"
                  value={formData.new_password_confirmation}
                  onChange={handleChange}
                  placeholder="Masukkan kembali password baru"
                  style={{ width: "100%", padding: "10px 40px 10px 14px", borderRadius: "8px", border: "1.5px solid var(--border-color)", fontSize: "13px", boxSizing: "border-box", background: "var(--input-bg)", color: "var(--text-main)" }}
                  required
                />
                <span 
                  onClick={() => setShowConfirm(!showConfirm)}
                  style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", cursor: "pointer", display: "flex", alignItems: "center", userSelect: "none" }}
                >
                  {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                </span>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{ padding: "10px 20px", borderRadius: "8px", border: "none", background: "#2C4FDB", color: "#fff", fontSize: "13px", fontWeight: 700, cursor: "pointer", opacity: loading ? 0.7 : 1, transition: "background 0.2s" }}
            >
              {loading ? "Menyimpan..." : "Simpan Perubahan"}
            </button>
          </form>
        </div>
      </div>
    </DashboardLayout>
  );
}

export default SettingsPage;
