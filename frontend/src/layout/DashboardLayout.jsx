import { Children } from "react";
import Sidebar from "../component/common/Sidebar";




function DashboardLayout({title, children}) {
   return (
    <div className="dashboard-layout">
      <Sidebar />
      <div className="dashboard-main">  
        <div className="dashboard-content">
          {children}
        </div>
      </div>
    </div>
  );
}

export default DashboardLayout;