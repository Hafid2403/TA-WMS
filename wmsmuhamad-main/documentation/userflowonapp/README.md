# User Flow Documentation — Warehouse Management System

This document describes the complete user flow for all roles available in the WMS application, accompanied by screenshots captured directly from the live application.

---

## Table of Contents

- [Authentication (Public)](#authentication-public)
  - [Login](#login)
  - [Register](#register)
- [Role: Master](#role-master)
  - [Dashboard](#master--dashboard)
  - [Goods Receipt](#master--goods-receipt)
  - [QC Inspection](#master--qc-inspection)
  - [Material Request](#master--material-request)
  - [Stock Opname](#master--stock-opname)
  - [Stock Overview](#master--stock-overview)
  - [Master Data](#master--master-data)
- [Role: PIC (Person In Charge)](#role-pic-person-in-charge)
  - [Goods Receipt](#pic--goods-receipt)
  - [Material Request](#pic--material-request)
  - [Stock Opname](#pic--stock-opname)
  - [Stock Overview](#pic--stock-overview)
- [Role: QC (Quality Control)](#role-qc-quality-control)
  - [QC Inspection](#qc--qc-inspection)
  - [Stock Overview](#qc--stock-overview)
- [Role Access Matrix](#role-access-matrix)

---

## Authentication (Public)

### Login

All users begin their session on the Login page. Users enter their registered email and password to access the system.

**Steps:**
1. Open the application URL.
2. Enter email address in the "Email" field.
3. Enter password in the "Password" field.
4. Optionally check "Remember me" to persist the session.
5. Click the **Sign In** button.
6. The system redirects the user to their role-specific landing page.

![Login Page](screenshot/01_login_page.png)

---

### Register

New users can create an account by navigating to the Register page from the Login page.

**Steps:**
1. Click the **Register** link on the Login page.
2. Fill in **First Name** and **Last Name**.
3. Enter a valid **Email** address.
4. Select a **User Role** (Master, PIC, or QC) by clicking the corresponding card.
5. Select the **Warehouse** assignment from a **dynamic dropdown** populated from the Master Data warehouse list.
6. Set a **Password** (minimum 6 characters) and confirm it.
7. Click the **Create Account** button.
8. Upon success, the user is redirected to the Login page.

![Register Page](screenshot/02_register_page.png)

---

## Role: Master

The **Master** role has full access to all modules in the system. This is the administrator-level role that oversees warehouse operations end-to-end.

**Landing page after login:** `/dashboard`

**Accessible modules:**
- Dashboard
- Goods Receipt
- QC Inspection
- Material Request
- Stock Opname
- Stock Overview
- Master Data

---

### Master — Dashboard
 
The central command center that provides a real-time overview of the warehouse.
 
**What the user sees:**
- **Global Warehouse Overview Filter:** A dynamic dropdown select at the top of the dashboard to filter the entire session context by "All Warehouses" or a specific warehouse location. When new warehouses are added in Master Data, they automatically appear here.
- **Dynamic Summary Cards:** Total SKUs, Low Stock Items, Pending Requests, and Pending QC Inspections. These cards update automatically to reflect metrics within the selected warehouse's scope.
- **Recent Goods Receipt table:** Latest inbound shipments filtered dynamically by the chosen warehouse context with search and status filter.
- **Pending Material Request table:** Outstanding material requests with department, date, and status, filterable by warehouse.
- **Stock Alert panel:** Products that have fallen below their minimum stock threshold, scoped dynamically per warehouse.
 
**Actions available:**
- Click **View All** to expand the full Goods Receipt or Material Request tables directly on the dashboard.
- Click **Stock Overview** to see the complete inventory overview.
- Select a warehouse in the global filter to switch the monitoring context for all panels simultaneously.
 
![Master Dashboard](screenshot/03_master_dashboard.png)

---

### Master — Goods Receipt
 
Module for recording and tracking the receipt of goods from vendors.
 
**What the user sees:**
- **Tab Navigation Bar** at the top with tabs: **History** (default), **Pending Delivery**, **Retur**, **Received Items Log**, and **New Receipt**.
- Search bar and status filter for existing records.
- **New Goods Receipt form** with auto-generated GR Number, date picker, vendor selector (dynamic from Master Data), receipt type, and notes field. Quantity inputs default to **0** and support **decimal values** (e.g. 10.5 meters) via `step="any"`.
- **Items Received table** with vendor product codes, product names, categories, quantity inputs, and unit labels.
- **Received Items Log tab:** A dedicated historical tracking log showing past inbounds with columns for **Date**, **Product Name**, **Qty Received**, **Vendor Name**, **Vendor Code**, and **GR Reference**.
- **Goods Receipt History table** showing all past records with GR Number, date, vendor, item count, PIC, QC status.
 
**Workflow:**
1. Click the **"New Receipt"** tab to open the entry form.
2. Select a vendor and fill in date/notes.
3. Add items and input quantities (supports decimal for meter/roll units).
4. Click **"Simpan Penerimaan"** to save the receipt.
5. Click the **"Received Items Log"** tab to view granular inbound tracking history by date, vendor, and product.
 
![Master Goods Receipt](screenshot/04_master_goods_receipt.png)

---

### Master — QC Inspection
 
Module for quality control inspection of received goods.
 
**What the user sees:**
- **Tab Navigation Bar** at the top with tabs: **Verifikasi & Validasi QC** (default) and **Riwayat QC** (history).
- **Summary cards:** Pending Inspection, Passed Today, Rejected Today.
- **Active Inspection panel** showing the GR being inspected, with a visual progress stepper (Received → Inspection → Update Stock). All inspection quantities default to **0** and support **decimal values** via `step="any"`.
- **Item-level QC fields:** For each item — accepted quantity, rejected quantity, quick action buttons (Accept All / Reject All), and validation that `qty_accepted + qty_rejected = qty_received`.
- **QC Notes** text area for recording detailed inspection findings per item.
- **Riwayat QC tab:** A dedicated history tab showing all past inspections with columns for **Date**, **Items Accepted (qty)**, **Items Rejected (qty)**, **Items Pending (qty)**, **QC Notes**, **QC Inspector Name**, and **Final Status**.
 
**Workflow:**
1. Click **"Verifikasi & Validasi QC"** tab to open the inspection workspace.
2. Select a pending Goods Receipt from the dropdown.
3. Enter accepted and rejected quantities per item (supports decimals for meter/roll).
4. Add QC Inspection notes.
5. Submit QC results to trigger stock adjustments.
6. Click **"Riwayat QC"** tab to review the full inspection history log.
 
![Master QC Inspection](screenshot/05_master_qc_inspection.png)

---

### Master — Material Request
 
Module for managing internal material requests from departments.
 
**What the user sees:**
- **Tab Navigation Bar** at the top with tabs: **Buat Request Baru** (create new) and **Riwayat Request** (history).
- **Summary cards:** Pending Approval, Approved, Rejected, Completed.
- **New Material Request form** with auto-generated MR Number, department selector (dynamic from Master Data), requester name, date, and notes.
- **Requested Items table** with product name, quantity (supports **decimal values**), unit display (pcs/meter/roll), and remove button.
- **Pending Approval panel** showing requests awaiting review with Approve/Reject/Detail buttons.
  > [!IMPORTANT]
  > Approval actions are restricted to **Master** and **PIC** roles only to enforce security in request workflows.
- **Detailed Items Modal:** Popup displaying columns for **Department Name**, **Product Name**, **Product Code**, **Qty Requested**, **Unit**, and **Qty Fulfilled**.
- **Riwayat Request tab:** A dedicated history tab showing all past records with MR Number, department, total items, status, date, and action buttons.
 
**Workflow:**
1. Click **"Buat Request Baru"** tab to open the request form.
2. Create a request by specifying the department, adding products, and inputting quantities.
3. Click **"Submit Request"** to send for approval.
4. PIC or Master reviews the request and clicks Approve or Reject.
5. Click **"Detail"** to audit exact item product codes, unit details, and fulfillment rates.
6. Click **"Riwayat Request"** tab to view complete request history.
 
````carousel
![Master Material Request](screenshot/06_master_material_request.png)
<!-- slide -->
![MR Detail Items Modal](screenshot/06_master_material_request_detail_modal.png)
````

---

### Master — Stock Opname
 
Module for conducting physical stock counting and reconciliation.
 
**What the user sees:**
- **Tab Navigation Bar** at the top with tabs: **Audit Stock Opname** (entry) and **Riwayat Audit** (history).
- **Active Session banner** with session ID, start date, warehouse, PIC, and counters (Total SKUs).
- **Physical Count Entry table** with search and zone filter, showing each product's internal code, name, category, zone/rack, system quantity, physical quantity input (supports **decimal values**), computed discrepancy (color-coded: green for surplus, red for deficit), and notes field.
- **Approval Notes Dialog:** Master is prompted to input optional reconciliation or approval comments when finalizing a session.
- **Audit Detail Popup (👁 button):** A comprehensive modal detailing the entire session:
  - Header with warehouse name, conductor name, approver name, status badge, and approval notes.
  - Comprehensive item list with columns: **Product Name**, **Product Category**, **Warehouse Position (Zone/Rack)**, **System Qty**, **Physical Qty**, **Discrepancy**, **Unit**, and **Item-level Notes**.
- **Riwayat Audit tab:** History table listing all past sessions with date, warehouse, conductor, approver, status badges, and a **👁 View Detail** action button.
 
**Workflow:**
1. Click **"Audit Stock Opname"** tab to start or continue a counting session.
2. Select a warehouse and enter physical stock counts.
3. Review discrepancies (green = surplus, red = deficit).
4. Submit the report for Master approval.
5. Master clicks **Reconcile & Approve**, inputs optional reconciliation notes, and the database automatically adjusts stock levels.
6. Click **"Riwayat Audit"** tab, then click **👁** on any session to inspect full discrepancy details, zones, and approval notes.
 
![Master Stock Opname](screenshot/07_master_stock_opname.png)

---

### Master — Stock Overview

Read-only inventory overview for all products across the warehouse.

**What the user sees:**
- Search bar with category and status filters.
- **Inventory Stock table** with Internal Code, Product Name, Category, Available quantity, Reserved quantity, Min Stock threshold, Zone/Rack location, and stock Status badge (In Stock / Low Stock / Out of Stock).

````carousel
![Master Stock Overview](screenshot/08_master_stock_overview.png)
<!-- slide -->
![Stock Overview Search Active](screenshot/08_master_stock_overview_search_active.png)
````

---

### Master — Master Data
 
Administrative module for managing all reference data in the system. This is the **central registry** — all dropdown fields across the application (warehouse, department, product, vendor) are dynamically populated from Master Data.
 
**What the user sees:**
- **Tab bar** to switch between: **Products**, **Vendors**, **Users**, **Warehouses**, **Departments**.
- Each tab shows a searchable, filterable table with relevant fields and Edit/Delete action buttons.
- **Delete Safety Confirmation:** All delete actions trigger a confirmation dialog ("Are you sure you want to delete this master data?") to prevent accidental deletions.
- **Dynamic Product Status pills:** The products list dynamically calculates and displays stock availability:
  - **Available:** Stock > min_stock.
  - **Out of Stock:** Stock < min_stock.
  - **Empty:** Stock = 0.
- **Decimal Quantity Support:** Min Stock and all quantity fields support decimal values (e.g. 10.5 meters) via `step="any"`.
- **Dynamic Warehouse Dropdown in User Form:** Assigning a user to a warehouse uses a clean, pre-populated dropdown sourced from the Warehouses tab.
- **+ Add** buttons for creating new records in each tab with full CRUD modal forms.
 
**Available tabs:**
| Tab          | Fields Displayed                                                 | CRUD |
|--------------|------------------------------------------------------------------|:----:|
| Products     | Internal Code, Name, Category, Unit, Min Stock, Available, Stock Status | ✅ |
| Vendors      | Name, Contact Person, Phone, Email, Status                       | ✅ |
| Users        | Full Name, Email, Role, Warehouse (dynamic dropdown), Status     | ✅ |
| Warehouses   | Name, Address, City, PIC, Status                                 | ✅ |
| Departments  | Name, Head, Total Users, Status                                  | ✅ |

> [!IMPORTANT]
> Adding a new warehouse here automatically updates the warehouse dropdown across all forms in the system (Registration, Goods Receipt, Stock Opname, User Management), ensuring sustainable scalability.

#### Interactive Admin & CRUD Workflows:
````carousel
![Master Data Overview](screenshot/09_master_master_data.png)
<!-- slide -->
![Search Active](screenshot/09_master_master_data_search_active.png)
<!-- slide -->
![Category Filter Active](screenshot/09_master_master_data_filter_active.png)
<!-- slide -->
![Add Product Modal](screenshot/09_master_master_data_add_modal_open.png)
<!-- slide -->
![Add Product Modal - Filled](screenshot/09_master_master_data_add_modal_filled.png)
<!-- slide -->
![After Adding Product](screenshot/09_master_master_data_after_add.png)
<!-- slide -->
![Edit Product Modal](screenshot/09_master_master_data_edit_modal_open.png)
<!-- slide -->
![Edit Product Modal - Filled](screenshot/09_master_master_data_edit_modal_filled.png)
<!-- slide -->
![After Editing Product](screenshot/09_master_master_data_after_edit.png)
<!-- slide -->
![After Deleting Product](screenshot/09_master_master_data_after_delete.png)
<!-- slide -->
![Vendors Tab](screenshot/09_master_master_data_vendors_tab.png)
<!-- slide -->
![Users Tab](screenshot/09_master_master_data_users_tab.png)
````

---

## Role: PIC (Person In Charge)

The **PIC** role handles day-to-day warehouse operations including goods receiving, material requests, and stock counting. PIC does **not** have access to the Dashboard, QC Inspection, or Master Data modules.

**Landing page after login:** `/goods-receipt`

**Accessible modules:**
- Goods Receipt
- Material Request
- Stock Opname
- Stock Overview

---

### PIC — Goods Receipt

Same functionality as the Master view. PIC can create new goods receipts, add items, and review history.

![PIC Goods Receipt](screenshot/10_pic_goods_receipt.png)

---

### PIC — Material Request

Same functionality as the Master view. PIC can create new material requests, review pending approvals, and view history.

![PIC Material Request](screenshot/11_pic_material_request.png)

---

### PIC — Stock Opname

Same functionality as the Master view. PIC can perform physical stock counts, record discrepancies, and submit for approval.

![PIC Stock Opname](screenshot/12_pic_stock_opname.png)

---

### PIC — Stock Overview

Read-only inventory view. Same functionality as the Master view.

![PIC Stock Overview](screenshot/13_pic_stock_overview.png)

---

## Role: QC (Quality Control)

The **QC** role is specialized for quality inspection. QC personnel only have access to inspect received goods and view inventory levels. QC does **not** have access to Dashboard, Goods Receipt, Material Request, Stock Opname, or Master Data modules.

**Landing page after login:** `/qc-inspection`

**Accessible modules:**
- QC Inspection
- Stock Overview

---

### QC — QC Inspection

The primary workspace for QC users. They inspect items from goods receipts, fill in accepted/rejected quantities, and submit inspection results.

![QC Inspection](screenshot/14_qc_qc_inspection.png)

---

### QC — Stock Overview

Read-only inventory view. Allows QC to check current stock levels for reference during inspections.

![QC Stock Overview](screenshot/15_qc_stock_overview.png)

---

## Role Access Matrix

| Module            | Master | PIC | QC |
|-------------------|:------:|:---:|:--:|
| Dashboard         |   ✅   |  ❌  | ❌  |
| Goods Receipt     |   ✅   |  ✅  | ❌  |
| QC Inspection     |   ✅   |  ❌  | ✅  |
| Material Request  |   ✅   |  ✅  | ❌  |
| Stock Opname      |   ✅   |  ✅  | ❌  |
| Stock Overview    |   ✅   |  ✅  | ✅  |
| Master Data       |   ✅   |  ❌  | ❌  |

---

### Test Credentials

| Role   | Email            | Password   |
|--------|------------------|------------|
| Master | master@wms.com   | password   |
| PIC    | pic@wms.com      | password   |
| QC     | qc@wms.com       | password   |
