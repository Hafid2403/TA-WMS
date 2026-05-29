import { BrowserRouter, Routes, Route} from "react-router-dom";
import DashboardPage from "../pages/Dashboard/DashboardPage";
import GoodsReceiptPage from "../pages/GoodReceipt/goodReceipt";
import QCInspectionPage from "../pages/QCinspection/qcinspection";
import MaterialRequestPage from "../pages/MaterialRequest/MaterialRequest";
import StockOpnamePage from "../pages/StockOpaname/StockOpname";
import StockOverviewPage from "../pages/StockOverview/StockOverview";
import MasterDataPage from "../pages/MasterData/MasterData";
function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/goods-receipt" element={<GoodsReceiptPage />} />
        <Route path="/qc-inspection" element={<QCInspectionPage />}/>
        <Route path="/material-request" element={<MaterialRequestPage />}/>
        <Route path="/stock-opname" element={<StockOpnamePage />}/>
        <Route path="/stock-overview" element={<StockOverviewPage />}/>
        <Route path="/master-data" element={<MasterDataPage />}/>
        
      </Routes>
    </BrowserRouter>
  );
}

export default AppRoutes