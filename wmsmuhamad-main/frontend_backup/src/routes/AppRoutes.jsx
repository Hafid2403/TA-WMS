import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import DashboardPage from "../pages/Dashboard/DashboardPage";
import GoodsReceiptPage from "../pages/GoodReceipt/goodReceipt";
import QCInspectionPage from "../pages/QCinspection/qcinspection";
import MaterialRequestPage from "../pages/MaterialRequest/MaterialRequest";
import StockOpnamePage from "../pages/StockOpaname/StockOpname";
import StockOverviewPage from "../pages/StockOverview/StockOverview";
import MasterDataPage from "../pages/MasterData/MasterData";
import LoginPage from "../pages/LoginPage/LoginPage";
import RegisterPage from "../pages/RegisterPage/RegisterPage";
import authService from "../services/authService";

const ProtectedRoute = ({ children, allowedRoles }) => {
  if (!authService.isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }
  const user = authService.getCurrentUser();
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Redirect to their allowed homepage based on role
    if (user.role === "QC") return <Navigate to="/qc-inspection" replace />;
    if (user.role === "PIC") return <Navigate to="/goods-receipt" replace />;
    return <Navigate to="/dashboard" replace />;
  }
  return children;
};

const PublicRoute = ({ children }) => {
  if (authService.isAuthenticated()) {
    const user = authService.getCurrentUser();
    if (user.role === "QC") return <Navigate to="/qc-inspection" replace />;
    if (user.role === "PIC") return <Navigate to="/goods-receipt" replace />;
    return <Navigate to="/dashboard" replace />;
  }
  return children;
};

function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
        <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />

        {/* Protected Routes */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute allowedRoles={["Master"]}>
              <DashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/goods-receipt"
          element={
            <ProtectedRoute allowedRoles={["Master", "PIC"]}>
              <GoodsReceiptPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/qc-inspection"
          element={
            <ProtectedRoute allowedRoles={["Master", "QC"]}>
              <QCInspectionPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/material-request"
          element={
            <ProtectedRoute allowedRoles={["Master", "PIC"]}>
              <MaterialRequestPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/stock-opname"
          element={
            <ProtectedRoute allowedRoles={["Master", "PIC"]}>
              <StockOpnamePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/stock-overview"
          element={
            <ProtectedRoute>
              <StockOverviewPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/master-data"
          element={
            <ProtectedRoute allowedRoles={["Master"]}>
              <MasterDataPage />
            </ProtectedRoute>
          }
        />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default AppRoutes;