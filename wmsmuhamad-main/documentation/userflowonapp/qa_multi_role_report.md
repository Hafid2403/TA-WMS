# 🧪 E2E QA — Multi-Role Access Control Report

Generated: **6/4/2026, 8:45:29 PM**  
Status: **PASSED ✅**

| Module | Assertion | Status | Details |
| :--- | :--- | :---: | :--- |
| **PIC Role** | Redirect to Goods Receipt on Login | 🟢 PASS | Active URL: http://localhost:49977/goods-receipt |
| **PIC Role** | Profile Details Rendered | 🟢 PASS | Profile name Kasyfil Aziz (PIC) correctly displayed. |
| **PIC Role** | Allowed Menu Items Visible | 🟢 PASS | Allowed pages (Goods Receipt, Putaway, MR, SO, Stock Overview) are visible in sidebar. |
| **PIC Role** | Forbidden Menu Items Hidden | 🟢 PASS | Forbidden pages (Dashboard, Master Data) are successfully hidden from sidebar. |
| **PIC Role** | Dashboard Route Direct Access Blocked | 🟢 PASS | Redirected away to: http://localhost:49977/goods-receipt |
| **PIC Role** | Master Data Route Direct Access Blocked | 🟢 PASS | Redirected away to: http://localhost:49977/goods-receipt |
| **PIC Role** | Logout Successful | 🟢 PASS | Active URL: http://localhost:49977/login |
| **QC Role** | Redirect to QC Inspection on Login | 🟢 PASS | Active URL: http://localhost:49977/qc-inspection |
| **QC Role** | Profile Details Rendered | 🟢 PASS | Profile name Muhammad Habibi (QC) correctly displayed. |
| **QC Role** | Allowed Menu Items Visible | 🟢 PASS | Allowed pages (QC Inspection, Stock Overview) are visible in sidebar. |
| **QC Role** | Forbidden Menu Items Hidden | 🟢 PASS | Forbidden pages (Dashboard, GR, Putaway, MR, SO, Master Data) are successfully hidden. |
| **QC Role** | Dashboard Route Direct Access Blocked | 🟢 PASS | Redirected away to: http://localhost:49977/qc-inspection |
| **QC Role** | Goods Receipt Route Direct Access Blocked | 🟢 PASS | Redirected away to: http://localhost:49977/qc-inspection |
| **QC Role** | Logout Successful | 🟢 PASS | Active URL: http://localhost:49977/login |

## Screenshots
Saved in: `documentation/userflowonapp/screenshot_qa_multi_role/`
