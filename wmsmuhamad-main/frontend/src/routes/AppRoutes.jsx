import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import DashboardPage from "../pages/Dashboard/DashboardPage";
import GoodsReceiptPage from "../pages/GoodReceipt/goodReceipt";
import QCInspectionPage from "../pages/QCinspection/qcinspection";
import MaterialRequestPage from "../pages/MaterialRequest/MaterialRequest";
import StockOpnamePage from "../pages/StockOpaname/StockOpname";
import StockOverviewPage from "../pages/StockOverview/StockOverview";
import MasterDataPage from "../pages/MasterData/MasterData";
import LoginPage from "../pages/LoginPage/LoginPage";
import PutawayPage from "../pages/Putaway/putaway";
import SettingsPage from "../pages/Settings/Settings";
import SuperadminPage from "../pages/Superadmin/SuperadminPage";
import SuperadminWarehouses from "../pages/Superadmin/SuperadminWarehouses";
import SuperadminGoodsReceipts from "../pages/Superadmin/SuperadminGoodsReceipts";
import SuperadminUsers from "../pages/Superadmin/SuperadminUsers";
import SuperadminProducts from "../pages/Superadmin/SuperadminProducts";
import SuperadminCategories from "../pages/Superadmin/SuperadminCategories";
import SuperadminVendors from "../pages/Superadmin/SuperadminVendors";
import SuperadminDepartments from "../pages/Superadmin/SuperadminDepartments";
import SuperadminAuditLogs from "../pages/Superadmin/SuperadminAuditLogs";
import authService from "../services/authService";

const ProtectedRoute = ({ children, allowedRoles }) => {
  if (!authService.isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }
  const user = authService.getCurrentUser();
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Redirect to their allowed homepage based on role
    if (user.role === "Super Admin") return <Navigate to="/superadmin" replace />;
    if (user.role === "QC") return <Navigate to="/qc-inspection" replace />;
    if (user.role === "PIC") return <Navigate to="/goods-receipt" replace />;
    return <Navigate to="/dashboard" replace />;
  }
  return children;
};

const PublicRoute = ({ children }) => {
  if (authService.isAuthenticated()) {
    const user = authService.getCurrentUser();
    if (user.role === "Super Admin") return <Navigate to="/superadmin" replace />;
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
        <Route path="/register" element={<Navigate to="/login" replace />} />

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
          path="/putaway"
          element={
            <ProtectedRoute allowedRoles={["Master", "PIC"]}>
              <PutawayPage />
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
        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <SettingsPage />
            </ProtectedRoute>
          }
        />

        {/* Superadmin Dedicated Routes */}
        <Route
          path="/superadmin"
          element={
            <ProtectedRoute allowedRoles={["Super Admin"]}>
              <SuperadminPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/superadmin/warehouses"
          element={
            <ProtectedRoute allowedRoles={["Super Admin"]}>
              <SuperadminWarehouses />
            </ProtectedRoute>
          }
        />
        <Route
          path="/superadmin/goods-receipts"
          element={
            <ProtectedRoute allowedRoles={["Super Admin"]}>
              <SuperadminGoodsReceipts />
            </ProtectedRoute>
          }
        />
        <Route
          path="/superadmin/users"
          element={
            <ProtectedRoute allowedRoles={["Super Admin"]}>
              <SuperadminUsers />
            </ProtectedRoute>
          }
        />
        <Route
          path="/superadmin/products"
          element={
            <ProtectedRoute allowedRoles={["Super Admin"]}>
              <SuperadminProducts />
            </ProtectedRoute>
          }
        />
        <Route
          path="/superadmin/categories"
          element={
            <ProtectedRoute allowedRoles={["Super Admin"]}>
              <SuperadminCategories />
            </ProtectedRoute>
          }
        />
        <Route
          path="/superadmin/vendors"
          element={
            <ProtectedRoute allowedRoles={["Super Admin"]}>
              <SuperadminVendors />
            </ProtectedRoute>
          }
        />
        <Route
          path="/superadmin/departments"
          element={
            <ProtectedRoute allowedRoles={["Super Admin"]}>
              <SuperadminDepartments />
            </ProtectedRoute>
          }
        />
        <Route
          path="/superadmin/audit-logs"
          element={
            <ProtectedRoute allowedRoles={["Super Admin"]}>
              <SuperadminAuditLogs />
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