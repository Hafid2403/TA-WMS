import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../../styles/Auth.css";
import authService from "../../services/authService";
import api from "../../services/api";
import { AlertTriangle, User, Key, Eye, EyeOff, Check, X } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Forgot password modal state
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotSuccess, setForgotSuccess] = useState("");
  const [forgotError, setForgotError] = useState("");

  useEffect(() => {
    document.title = "Masuk | Warehouse Management System";
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMessage("Silakan masukkan email dan password.");
      return;
    }

    setErrorMessage("");
    setLoading(true);

    try {
      const response = await authService.login(email, password);
      if (response && response.status === "success") {
        const user = authService.getCurrentUser();
        // Redirect to appropriate landing pages based on role
        if (user.role === "QC") {
          navigate("/qc-inspection");
        } else if (user.role === "PIC") {
          navigate("/goods-receipt");
        } else {
          navigate("/dashboard");
        }
      }
    } catch (error) {
      if (error.response && error.response.data && error.response.data.message) {
        setErrorMessage(error.response.data.message);
      } else {
        setErrorMessage("Gagal masuk. Silakan periksa koneksi internet Anda.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleForgotSubmit = async (e) => {
    e.preventDefault();
    setForgotError("");
    setForgotSuccess("");
    if (!forgotEmail) {
      setForgotError("Masukkan alamat email terdaftar Anda.");
      return;
    }
    setForgotLoading(true);
    try {
      const res = await api.post("/auth/forgot-password", { email: forgotEmail });
      if (res.data && res.data.status === "success") {
        setForgotSuccess(res.data.message);
        setForgotEmail("");
      }
    } catch (err) {
      setForgotError(err.response?.data?.message || "Gagal mengirimkan permintaan reset password.");
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <main className="auth-page">
      <section className="auth-card">
        <div className="auth-brand">
          <div className="brand-logo">WMS</div>
          <div>
            <h1>Warehouse Management System</h1>
            <p>Login akun pengguna</p>
          </div>
        </div>

        <div className="auth-header">
          <h2>Welcome Back</h2>
          <p>Masuk ke sistem WMS untuk melanjutkan.</p>
        </div>

        {errorMessage && (
          <div style={{
            background: "var(--status-danger-bg)",
            border: "1.5px solid var(--status-danger-border)",
            color: "var(--status-danger-text)",
            padding: "10px 14px",
            borderRadius: "8px",
            fontSize: "13px",
            fontWeight: 600,
            marginBottom: "16px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px"
          }}>
            <AlertTriangle size={16} /> {errorMessage}
          </div>
        )}

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Email</label>
            <div className="input-wrapper">
              <span className="input-icon"><User size={16} /></span>
              <input
                type="email"
                placeholder="Masukkan email Anda"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label>Password</label>
            <div className="input-wrapper">
              <span className="input-icon"><Key size={16} /></span>
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Masukkan password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                required
              />
              <span
                className="input-action"
                style={{ cursor: "pointer", userSelect: "none", display: "flex", alignItems: "center" }}
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </span>
            </div>
          </div>

          <div className="form-options">
            <label className="remember-me">
              <input type="checkbox" disabled={loading} />
              Remember me
            </label>
            <a 
              href="#" 
              onClick={(e) => { 
                e.preventDefault(); 
                setForgotError("");
                setForgotSuccess("");
                setForgotEmail("");
                setShowForgotModal(true); 
              }} 
              className="forgot-link"
            >
              Forgot password?
            </a>
          </div>

          <button
            type="submit"
            className="primary-button"
            disabled={loading}
            style={{ opacity: loading ? 0.7 : 1, cursor: loading ? "not-allowed" : "pointer" }}
          >
            {loading ? "Menghubungkan..." : "Sign In"}
          </button>
        </form>
      </section>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100vw",
          height: "100vh",
          background: "rgba(15, 23, 42, 0.6)",
          backdropFilter: "blur(8px)",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          zIndex: 9999,
          padding: "20px",
          boxSizing: "border-box"
        }}>
          <div style={{
            background: "#FFF",
            width: "100%",
            maxWidth: "450px",
            borderRadius: "16px",
            boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
            border: "1px solid #E2E8F0",
            overflow: "hidden",
            color: "#1E293B"
          }}>
            <div style={{ padding: "24px 30px", borderBottom: "1px solid #F1F5F9", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 700, color: "#1E293B" }}>Lupa Password</h3>
              <button 
                onClick={() => setShowForgotModal(false)}
                style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#64748B" }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleForgotSubmit} style={{ padding: "30px", display: "flex", flexDirection: "column", gap: "20px" }}>
              <p style={{ margin: 0, fontSize: "13px", color: "#64748B", lineHeight: "1.5" }}>
                Masukkan alamat email yang terdaftar pada akun WMS Anda. Kami akan meneruskan permintaan reset password ini kepada Master Administrator.
              </p>

              {forgotError && (
                <div style={{ padding: "10px 14px", background: "var(--status-danger-bg)", color: "var(--status-danger-text)", border: "1.5px solid var(--status-danger-border)", borderRadius: "8px", fontSize: "12px", fontWeight: 600, display: "flex", alignItems: "center", gap: "6px" }}>
                  <AlertTriangle size={14} /> {forgotError}
                </div>
              )}

              {forgotSuccess && (
                <div style={{ padding: "10px 14px", background: "var(--status-success-bg)", color: "var(--status-success-text)", border: "1.5px solid var(--status-success-border)", borderRadius: "8px", fontSize: "12px", fontWeight: 600, display: "flex", alignItems: "center", gap: "6px" }}>
                  <Check size={14} /> {forgotSuccess}
                </div>
              )}

              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <label style={{ fontSize: "12px", fontWeight: 700, color: "#64748B", textTransform: "uppercase" }}>Alamat Email</label>
                <input
                  type="email"
                  placeholder="name@company.com"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  style={{ width: "100%", padding: "10px 14px", borderRadius: "8px", border: "1.5px solid #CBD5E1", fontSize: "13px", boxSizing: "border-box", color: "#1E293B" }}
                  disabled={forgotLoading}
                  required
                />
              </div>

              <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end", marginTop: "10px" }}>
                <button 
                  type="button" 
                  onClick={() => setShowForgotModal(false)}
                  style={{ padding: "10px 16px", borderRadius: "8px", border: "1.5px solid #CBD5E1", background: "#FFF", fontSize: "13px", fontWeight: 600, color: "#64748B", cursor: "pointer" }}
                  disabled={forgotLoading}
                >
                  Batal
                </button>
                <button 
                  type="submit" 
                  style={{ padding: "10px 20px", borderRadius: "8px", border: "none", background: "#2C4FDB", fontSize: "13px", fontWeight: 600, color: "#FFF", cursor: "pointer", opacity: forgotLoading ? 0.7 : 1 }}
                  disabled={forgotLoading}
                >
                  {forgotLoading ? "Mengirim..." : "Kirim Permintaan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}