# 🧪 E2E QA Simulation & Skepticism Audit Report

Generated on: **14/6/2026, 01.08.12**  
Status: **PASSED** 🟢

This report lists the results of programmatically simulating a highly skeptical QA engineer testing boundary conditions, error handling, dynamic dropdown values, and forms constraints.

## 📋 QA Assertion Results

| Test Module | Assertion Check | Status | Verification Details |
| :--- | :--- | :---: | :--- |
| **Auth** | Login Successful | 🟢 PASS | Redirected to dashboard dashboard successfully. |
| **Goods Receipt** | Vendor Scoped Catalog | 🟢 PASS | Product catalog shows correct vendor products. |
| **Goods Receipt** | Auto-Reset Safeguard | 🟢 PASS | Form items correctly flushed when vendor was switched. |
| **Goods Receipt** | Duplicate Alert Triggers | 🟢 PASS | Duplicate selection blocked. Alert message captured: "Produk ini sudah dipilih di baris lain! Silakan pilih produk lain atau ubah kuantitas di baris yang sudah ada." |
| **Goods Receipt** | Integer min constraint | 🟢 PASS | Quantity input min attribute is set to 1. |
| **Goods Receipt** | Integer step constraint | 🟢 PASS | Quantity input step attribute is set to 1 (strictly integer). |
| **Goods Receipt** | Receipt Submission Successful | 🟢 PASS | Goods receipt submitted and logged successfully. |
| **QC Inspection** | Sum Mismatch Blocked | 🟢 PASS | Mismatch between Accepted+Rejected and total received blocked successfully. |
| **QC Inspection** | QC Inspection Recorded | 🟢 PASS | Quality control inspection records updated successfully. |

## 📸 QA Screen Captures

Detailed screenshots illustrating duplicate rows alerts, vendor scoping flushes, and QC sum mismatch blocks are saved at: `documentation/userflowonapp/screenshot_qa/`.
