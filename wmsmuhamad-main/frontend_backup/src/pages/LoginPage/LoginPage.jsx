import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../../styles/Auth.css";
import authService from "../../services/authService";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

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

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Email</label>
            <div className="input-wrapper">
              <span className="input-icon">👤</span>
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
              <span className="input-icon">🔑</span>
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
                style={{ cursor: "pointer", userSelect: "none" }}
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? "🙈" : "👁️"}
              </span>
            </div>
          </div>

          <div className="form-options">
            <label className="remember-me">
              <input type="checkbox" disabled={loading} />
              Remember me
            </label>
            <a href="#" className="forgot-link">
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

          <p className="auth-switch">
            Belum punya akun? <Link to="/register">Register</Link>
          </p>
        </form>
      </section>
    </main>
  );
}