import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../../styles/Auth.css";
import authService from "../../services/authService";

export default function RegisterPage() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [roleId, setRoleId] = useState("2"); // Default to PIC (2)
  const [warehouseId, setWarehouseId] = useState("1"); // Default to Main (1)
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!firstName || !lastName || !email || !password || !confirmPassword) {
      setErrorMessage("Silakan lengkapi semua bidang.");
      return;
    }

    if (password.length < 6) {
      setErrorMessage("Password minimal harus 6 karakter.");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage("Konfirmasi password tidak cocok.");
      return;
    }

    setErrorMessage("");
    setSuccessMessage("");
    setLoading(true);

    const fullName = `${firstName} ${lastName}`.trim();

    try {
      const response = await authService.register(
        fullName,
        email,
        password,
        roleId,
        warehouseId
      );
      if (response && response.status === "success") {
        setSuccessMessage("Akun berhasil dibuat! Mengalihkan ke halaman masuk...");
        setTimeout(() => {
          navigate("/login");
        }, 2000);
      }
    } catch (error) {
      if (error.response && error.response.data && error.response.data.message) {
        setErrorMessage(error.response.data.message);
      } else {
        setErrorMessage("Gagal mendaftar. Silakan coba lagi.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="auth-page">
      <section className="auth-card auth-card-large">
        <div className="auth-brand">
          <div className="brand-logo">WMS</div>
          <div>
            <h1>Warehouse Management System</h1>
            <p>Registrasi akun pengguna</p>
          </div>
        </div>

        <div className="auth-header">
          <h2>Create Account</h2>
          <p>Lengkapi data pengguna untuk membuat akun WMS.</p>
        </div>

        {errorMessage && (
          <div style={{
            background: "#fee2e2",
            border: "1px solid #fca5a5",
            color: "#b91c1c",
            padding: "10px 14px",
            borderRadius: "8px",
            fontSize: "13px",
            fontWeight: 600,
            marginBottom: "16px",
            textAlign: "center"
          }}>
            ⚠️ {errorMessage}
          </div>
        )}

        {successMessage && (
          <div style={{
            background: "#d1fae5",
            border: "1px solid #6ee7b7",
            color: "#065f46",
            padding: "10px 14px",
            borderRadius: "8px",
            fontSize: "13px",
            fontWeight: 600,
            marginBottom: "16px",
            textAlign: "center"
          }}>
            ✅ {successMessage}
          </div>
        )}

        <form className="auth-form" onSubmit={handleRegister}>
          <div className="section-title">
            <span>1</span>
            <h3>Personal Information</h3>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>First Name</label>
              <div className="input-wrapper">
                <span className="input-icon">👤</span>
                <input
                  type="text"
                  placeholder="Nama depan"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  disabled={loading}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label>Last Name</label>
              <div className="input-wrapper">
                <span className="input-icon">👤</span>
                <input
                  type="text"
                  placeholder="Nama belakang"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  disabled={loading}
                  required
                />
              </div>
            </div>
          </div>

          <div className="form-group">
            <label>Email</label>
            <div className="input-wrapper">
              <span className="input-icon">✉️</span>
              <input
                type="email"
                placeholder="nama@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                required
              />
            </div>
          </div>

          <div className="section-title">
            <span>2</span>
            <h3>Role & Access</h3>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "16px" }}>
            <label style={{ fontSize: "13px", fontWeight: "600", color: "#4b5563" }}>Select User Role</label>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "10px" }}>
              <div
                onClick={() => !loading && setRoleId("1")}
                style={{
                  padding: "12px",
                  borderRadius: "8px",
                  border: `2px solid ${roleId === "1" ? "#2c4fdb" : "#e2e8f0"}`,
                  background: roleId === "1" ? "rgba(44, 79, 219, 0.05)" : "#fff",
                  cursor: loading ? "not-allowed" : "pointer",
                  textAlign: "center",
                  transition: "all 0.2s"
                }}
              >
                <div style={{ fontSize: "20px" }}>🛠️</div>
                <div style={{ fontWeight: "700", fontSize: "13px", color: roleId === "1" ? "#2c4fdb" : "#1f2937" }}>Master</div>
                <div style={{ fontSize: "11px", color: "#6b7280" }}>Full access</div>
              </div>

              <div
                onClick={() => !loading && setRoleId("2")}
                style={{
                  padding: "12px",
                  borderRadius: "8px",
                  border: `2px solid ${roleId === "2" ? "#2c4fdb" : "#e2e8f0"}`,
                  background: roleId === "2" ? "rgba(44, 79, 219, 0.05)" : "#fff",
                  cursor: loading ? "not-allowed" : "pointer",
                  textAlign: "center",
                  transition: "all 0.2s"
                }}
              >
                <div style={{ fontSize: "20px" }}>👔</div>
                <div style={{ fontWeight: "700", fontSize: "13px", color: roleId === "2" ? "#2c4fdb" : "#1f2937" }}>PIC</div>
                <div style={{ fontSize: "11px", color: "#6b7280" }}>Operations</div>
              </div>

              <div
                onClick={() => !loading && setRoleId("3")}
                style={{
                  padding: "12px",
                  borderRadius: "8px",
                  border: `2px solid ${roleId === "3" ? "#2c4fdb" : "#e2e8f0"}`,
                  background: roleId === "3" ? "rgba(44, 79, 219, 0.05)" : "#fff",
                  cursor: loading ? "not-allowed" : "pointer",
                  textAlign: "center",
                  transition: "all 0.2s"
                }}
              >
                <div style={{ fontSize: "20px" }}>🔍</div>
                <div style={{ fontWeight: "700", fontSize: "13px", color: roleId === "3" ? "#2c4fdb" : "#1f2937" }}>QC</div>
                <div style={{ fontSize: "11px", color: "#6b7280" }}>Quality control</div>
              </div>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Warehouse</label>
              <div className="input-wrapper">
                <span className="input-icon">🏭</span>
                <select
                  value={warehouseId}
                  onChange={(e) => setWarehouseId(e.target.value)}
                  disabled={loading}
                  required
                >
                  <option value="1">Main Warehouse Jakarta</option>
                  <option value="2">Warehouse B Surabaya</option>
                  <option value="3">Cold Storage Bandung</option>
                </select>
              </div>
            </div>
          </div>

          <div className="section-title">
            <span>3</span>
            <h3>Account Security</h3>
          </div>

          <div className="form-group">
            <label>Password</label>
            <div className="input-wrapper">
              <span className="input-icon">🔑</span>
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Minimal 6 karakter"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                required
              />
              <span
                className="input-action"
                style={{ cursor: "pointer", userSelect: "none" }}
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? "🙈" : "👁️"}
              </span>
            </div>
          </div>

          <div className="form-group">
            <label>Confirm Password</label>
            <div className="input-wrapper">
              <span className="input-icon">🔑</span>
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Ulangi password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={loading}
                required
              />
            </div>
          </div>

          <button
            type="submit"
            className="primary-button"
            disabled={loading}
            style={{ opacity: loading ? 0.7 : 1, cursor: loading ? "not-allowed" : "pointer" }}
          >
            {loading ? "Mendaftarkan..." : "Create Account"}
          </button>

          <p className="auth-switch">
            Sudah punya akun? <Link to="/login">Login di sini</Link>
          </p>
        </form>
      </section>
    </main>
  );
}