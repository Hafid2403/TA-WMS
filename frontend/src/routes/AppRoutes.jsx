import { BrowserRouter, Routes, Route} from "react-router-dom";
import DashboardPage from "../pages/Dashboard/DashboardPage";
import GoodsReceiptPage from "../pages/GoodReceipt/goodReceipt";
import QCInspectionPage from "../pages/QCinspection/qcinspection";
function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/goods-receipt" element={<GoodsReceiptPage />} />
        <Route path="/qc-inspection" element={<QCInspectionPage />}/>
      </Routes>
    </BrowserRouter>
  );
}

export default AppRoutes