import { BrowserRouter, Routes, Route} from "react-router-dom";
import DashboardPage from "../pages/Dashboard/DashboardPage";

function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<DashboardPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default AppRoutes