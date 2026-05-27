
import Sidebar from "../component/common/Sidebar";



function DashboardLayout({title, children}) {
   return (
    <div style={{display: "flex", width : "100%" , minHeight: "100vh"}}>
      <Sidebar />
      <div style={{flex:1, display: "flex", flexDirection: "column"}} >
        <div style={{padding: "16px 24px", borderBottom: "1px solid #E2E8F0" ,background: "#fff", fontWeight: 700, fontSize: "16px" }}>
            {title}
        </div>  
        <div style={{flex:1 , padding: "24px" , background: "#F0F4FF"}}>
          {children}
        </div>
      </div>
    </div>
  );
}

export default DashboardLayout;