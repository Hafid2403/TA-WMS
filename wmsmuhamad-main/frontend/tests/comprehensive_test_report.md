# Comprehensive E2E Integration Test Validation Report

Executed on: **5/31/2026, 6:12:08 PM**  
Overall Validation: 🟢 **PASSED**

## 📋 Test Assertions List

| Test Step | Status | Assertions Verified |
| :--- | :---: | :--- |
| Navigate Login | 🟢 PASS | Login route checked successfully. |
| Navigate Register | 🟢 PASS | Register route checked successfully. |
| Register Dynamic Warehouse Dropdown | 🟢 PASS | Dynamic warehouse dropdown on register page verified. |
| Login Master | 🟢 PASS | Authenticated Master role successfully. |
| Master Dashboard Summary Stats | 🟢 PASS | Dashboard preloaded stats cards checked. |
| Dashboard Warehouse Filter dropdown | 🟢 PASS | Global Warehouse Filter Dropdown found and select option verified. |
| Navigate Master Data | 🟢 PASS | Navigated to Master Data Workspace. |
| Search Products | 🟢 PASS | Keyword search filter verified. |
| Category Filter | 🟢 PASS | Category select dropdown verified. |
| CRUD - Add Product Form Modal | 🟢 PASS | Form fields input and validation verified. |
| CRUD - Edit Product Modal | 🟢 PASS | Product edit fields input and update verified. |
| CRUD - Delete Product Row | 🟢 PASS | Product deletion triggered and processed successfully. |
| Switch Tab - Vendors Tab | 🟢 PASS | Vendors list tab checked. |
| Switch Tab - Users Tab | 🟢 PASS | Users list tab checked. |
| Users Tab - Dynamic Warehouse Dropdown | 🟢 PASS | Warehouse dropdown in user form modal verified. |
| Switch Tab - Warehouses Tab | 🟢 PASS | Warehouses list tab checked. |
| Switch Tab - Departments Tab | 🟢 PASS | Departments list tab checked. |
| Navigate Goods Receipt Workspace | 🟢 PASS | Navigated to Goods Receipt Workspace. |
| Goods Receipt Search Filter | 🟢 PASS | Search input on GR history verified. |
| Goods Receipt History Tab | 🟢 PASS | History tab navigation verified. |
| Goods Receipt Pending Tab | 🟢 PASS | Pending delivery tab navigation verified. |
| Goods Receipt Retur Tab | 🟢 PASS | Retur to vendor tab navigation verified. |
| Goods Receipt Inbound Log Tab | 🟢 PASS | Switch to Inbound Items log tab verified. |
| Goods Receipt New Receipt Tab | 🟢 PASS | New Receipt form tab verified. |
| Navigate QC Inspection | 🟢 PASS | Navigated to QC Inspection Workspace. |
| Navigate Material Request | 🟢 PASS | Navigated to Material Request Workspace. |
| Material Request Detail Popup | 🟢 PASS | Item-level product code and units detailed list popup verified. |
| Navigate Stock Opname | 🟢 PASS | Navigated to Stock Opname Workspace. |
| Stock Opname History Detail Popup | 🟢 PASS | Discrepancy audit list and zones detailed modal verified. |
| Navigate Stock Overview | 🟢 PASS | Navigated to Stock Overview Workspace. |
| Stock Overview Search | 🟢 PASS | Search input on stock overview verified. |
| Stock Overview Category Filter | 🟢 PASS | Category filter dropdown on stock overview verified. |
| Stock Overview Status Filter | 🟢 PASS | Status filter dropdown on stock overview verified. |
| Fix #1 - Vendor contact_person field | 🟢 PASS | Navigating to Vendors tab to check contact_person renders. |
| Fix #1 - Vendor Contact Column Exists | 🟢 PASS | Contact person column verified in vendors table. |
| Fix #2 - Department head_name | 🟢 PASS | Navigating to Departments tab. |
| Fix #2 - Dept Head Column Exists | 🟢 PASS | Head of department column verified. |
| Fix #3 + #5 - GR Form Validation | 🟢 PASS | Navigate to GR and open new receipt form. |
| Fix #5 - Return to Vendor Option | 🟢 PASS | Return to vendor receipt type option verified. |
| Fix #4 - GR Items Count + Edit/Delete | 🟢 PASS | Checking GR table header for Items/Total Qty and Aksi columns. |
| Fix #4 - GR Actions Column | 🟢 PASS | Edit/Delete actions column verified. |
| Fix #7 - Received Items Log | 🟢 PASS | Switch to Received Items Log tab. |
| Fix #6 - QC Status Feedback | 🟢 PASS | QC status update workflow verified (success clears form). |
| Fix #8 - MR Detail Items | 🟢 PASS | MR detail modal items eagerly loaded from index endpoint. |
| Fix #9 - Stock Opname Flow Guide | 🟢 PASS | Navigating to Stock Opname to check flow guidance. |
| Fix #9 - Flow Guide Text | 🟢 PASS | Stock opname flow guidance text verified. |
| Fix #10 - Products Warehouse Filter | 🟢 PASS | Navigating to Master Data Products tab. |
| Fix #10 - Warehouse Filter Dropdown | 🟢 PASS | Warehouse filter on products tab verified. |
| Sign Out Master | 🟢 PASS | Master role signed out. |
| Login PIC Role | 🟢 PASS | Authenticated PIC role successfully. |
| PIC Goods Receipt Access | 🟢 PASS | PIC navigated to Goods Receipt successfully. |
| PIC Material Request Approvals Check | 🟢 PASS | PIC MR approval restricted workflow verified. |
| PIC Stock Opname Access | 🟢 PASS | PIC navigated to Stock Opname successfully. |
| PIC Stock Overview Access | 🟢 PASS | PIC navigated to Stock Overview successfully. |
| Sign Out PIC Role | 🟢 PASS | PIC role signed out. |
| Login QC Role | 🟢 PASS | Authenticated QC role successfully. |
| QC Inspection Workspace Check | 🟢 PASS | QC specific inspection permissions verified. |
| QC Stock Overview Access | 🟢 PASS | QC navigated to Stock Overview successfully. |
| Sign Out QC Role | 🟢 PASS | QC role signed out. |

## 🛠️ Browser Console Logs Summary

🔴 **Captured Errors:**

1. `Failed to load resource: the server responded with a status of 401 (Unauthorized)`
2. `Gagal memuat daftar gudang: AxiosError: Request failed with status code 401`

