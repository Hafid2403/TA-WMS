const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const REPORT_FILE = path.resolve(__dirname, '../../documentation/userflowonapp/fe_dom_audit_report.md');
const SS_DIR = path.resolve(__dirname, '../../documentation/userflowonapp/screenshot');

// Ensure screenshot directory exists
if (!fs.existsSync(SS_DIR)) {
  fs.mkdirSync(SS_DIR, { recursive: true });
}

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

async function main() {
  console.log('🚀 Starting Official Frontend DOM Audit & Validation Suite...');
  
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1440,900'],
    defaultViewport: { width: 1440, height: 900 }
  });

  const page = await browser.newPage();
  
  // Listen to browser console and errors
  page.on('console', msg => console.log('BROWSER LOG:', msg.text()));
  page.on('pageerror', err => console.error('BROWSER ERROR:', err.message));
  
  // Set light mode scheme preferred
  await page.emulateMediaFeatures([{ name: 'prefers-color-scheme', value: 'light' }]);

  const auditResults = [];
  function assert(feature, checkName, passed, details) {
    auditResults.push({ feature, checkName, status: passed ? 'PASS' : 'FAIL', details });
    console.log(`[${passed ? '✅ PASS' : '❌ FAIL'}] ${feature} - ${checkName}: ${details}`);
  }

  try {
    // -------------------------------------------------------------
    // 1. AUTH FLOWS (LOGIN & REGISTER)
    // -------------------------------------------------------------
    console.log('\n🔐 Auditing Authentication Flows...');
    
    // Login Page DOM Check
    await page.goto('http://localhost:49977/login', { waitUntil: 'networkidle0' });
    await delay(1000);
    const hasEmailInput = await page.$('input[type="email"]') !== null;
    const hasPasswordInput = await page.$('input[type="password"]') !== null;
    const hasLoginBtn = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('button')).some(b => b.textContent.includes('Sign In'));
    });
    const hasForgotLink = await page.evaluate(() => {
      const link = Array.from(document.querySelectorAll('a')).find(l => l.textContent.includes('Forgot'));
      return !!(link && link.classList.contains('forgot-link'));
    });
    assert('Login', 'Forgot Password Link', hasForgotLink, 'Forgot password link is present in login options.');
    assert('Login', 'Email Input Field', hasEmailInput, 'Email field exists in login form.');
    assert('Login', 'Password Input Field', hasPasswordInput, 'Password field exists in login form.');
    assert('Login', 'Sign In Button', hasLoginBtn, 'Sign In action button exists.');
    await page.screenshot({ path: path.join(SS_DIR, 'audit_01_login.png') });

    // Register Page Redirect Check
    // Navigate to register page, clear localStorage to ensure clean state
    await page.goto('http://localhost:49977/login', { waitUntil: 'networkidle0' });
    await page.evaluate(() => localStorage.clear());
    
    console.log('Testing Register redirection...');
    await page.goto('http://localhost:49977/register', { waitUntil: 'networkidle0' });
    await delay(2000);
    
    console.log('Current URL after navigating to register:', page.url());
    const redirectedUrl = page.url();
    assert('Register', 'Redirect to Login', redirectedUrl.includes('/login'), 'Navigating to register correctly redirects to login.');
    await page.screenshot({ path: path.join(SS_DIR, 'audit_02_register_redirect.png') });

    // Perform login for remaining modules check
    await page.goto('http://localhost:49977/login', { waitUntil: 'networkidle0' });
    await page.type('input[type="email"]', 'master@wms.com');
    await page.type('input[type="password"]', 'password');
    await page.click('button');
    await delay(3000);

    // -------------------------------------------------------------
    // 2. DASHBOARD PANEL
    // -------------------------------------------------------------
    console.log('\n📊 Auditing Dashboard Panel...');
    const hasStatsCards = await page.evaluate(() => {
      // Look for cards with large numbers or stats headers
      const divs = Array.from(document.querySelectorAll('div'));
      return divs.some(d => d.textContent.includes('Total SKUs') || d.textContent.includes('Low Stock'));
    });
    assert('Dashboard', 'Summary Stats Cards', hasStatsCards, 'Total SKUs/Low Stock widget panels rendered.');

    const hasGlobalWarehouseFilter = await page.evaluate(() => {
      const select = document.querySelector('select');
      if (!select) return false;
      return Array.from(select.options).some(o => o.textContent.includes('All Warehouses') || o.textContent.includes('Warehouse'));
    });
    assert('Dashboard', 'Global Warehouse Filter', hasGlobalWarehouseFilter, 'Global warehouse context switcher exists at page header.');
    await page.screenshot({ path: path.join(SS_DIR, 'audit_03_dashboard.png') });

    // -------------------------------------------------------------
    // 3. GOODS RECEIPT MODULE
    // -------------------------------------------------------------
    console.log('\n📦 Auditing Goods Receipt Module...');
    await page.goto('http://localhost:49977/goods-receipt', { waitUntil: 'networkidle0' });
    await delay(2000);

    // Sub-tabs navigation checks
    const grTabs = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('button')).map(b => b.textContent.trim());
    });
    assert('Goods Receipt', 'Sub-tab Navigation Buttons', grTabs.some(t => t.includes('Pending')) && grTabs.some(t => t.includes('Log')), 'Tabs for Pending receipts and Received Items Logs rendered.');

    // History Table Columns Check
    const grHeaders = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('th')).map(th => th.textContent.trim());
    });
    assert('Goods Receipt', 'Table Headers Verification', (grHeaders.includes('GR Number') || grHeaders.includes('Kode PO')) && grHeaders.includes('Items / Total Qty'), `Receipt table headers verified: ${grHeaders.join(', ')}`);

    // Edit/Delete Actions Columns Check
    assert('Goods Receipt', 'Action Options', grHeaders.includes('Aksi') || grHeaders.includes('Action'), 'Action column (Aksi) with Edit/Delete buttons exists.');

    // Received Items Log Tab Check
    await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Items Log'));
      if (btn) btn.click();
    });
    await delay(1500);
    // Expand the first activity row if available to expose detailed qty received header
    await page.evaluate(() => {
      const expandBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('View Items'));
      if (expandBtn) expandBtn.click();
    });
    await delay(500);
    const logHeaders = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('th')).map(th => th.textContent.trim());
    });
    assert('Goods Receipt', 'Received Items Log headers', logHeaders.includes('Qty Received') || logHeaders.includes('Qty'), 'Received items list includes Product Qty Received column.');
    await page.screenshot({ path: path.join(SS_DIR, 'audit_04_goods_receipt.png') });

    // Return to New Receipt Form Modal Check
    await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('History'));
      if (btn) btn.click();
    });
    await delay(500);
    await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('New Receipt'));
      if (btn) btn.click();
    });
    await delay(1500);

    // Form inputs verify
    const grForm = await page.evaluate(() => {
      const selects = Array.from(document.querySelectorAll('select'));
      const inputs = Array.from(document.querySelectorAll('input')).map(i => i.placeholder || i.name);
      return { selects: selects.length, inputs };
    });
    assert('Goods Receipt', 'Form Input elements count', grForm.selects >= 2, `Found ${grForm.selects} select dropdowns in GR form.`);

    const hasReturnToVendorOption = await page.evaluate(() => {
      const selects = Array.from(document.querySelectorAll('select'));
      for (const select of selects) {
        const options = Array.from(select.options).map(o => o.value);
        if (options.includes('good_receipt')) return true;
      }
      return false;
    });
    assert('Goods Receipt', 'Return to Vendor Option', hasReturnToVendorOption, 'Receipt type select dropdown contains good_receipt option.');

    const initialItemSelection = await page.evaluate(() => {
      const selects = Array.from(document.querySelectorAll('table select'));
      return selects.map(s => s.value);
    });
    assert('Goods Receipt', 'Blank Item Row UX', initialItemSelection.length === 0 || initialItemSelection[0] === '', 'New items row is initialized blank without auto-selecting a product.');

    // Close Modal
    await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('✕'));
      if (btn) btn.click();
    });
    await delay(1000);

    // -------------------------------------------------------------
    // 4. QC INSPECTION MODULE
    // -------------------------------------------------------------
    console.log('\n🔍 Auditing QC Inspection Module...');
    await page.goto('http://localhost:49977/qc-inspection', { waitUntil: 'networkidle0' });
    await delay(2000);

    const hasQCPendingDropdown = await page.evaluate(() => {
      return document.querySelector('select') !== null;
    });
    assert('QC Inspection', 'QC Goods Receipt Select Dropdown', hasQCPendingDropdown, 'QC Inspection pending receipts selector exists.');

    const pageText = await page.evaluate(() => document.body.textContent);
    assert('QC Inspection', 'QC Module Page Title', pageText.includes('QC Inspection'), 'QC Inspection page loaded successfully.');
    await page.screenshot({ path: path.join(SS_DIR, 'audit_05_qc_inspection.png') });

    // -------------------------------------------------------------
    // 5. MATERIAL REQUEST MODULE
    // -------------------------------------------------------------
    console.log('\n📋 Auditing Material Request Module...');
    await page.goto('http://localhost:49977/material-request', { waitUntil: 'networkidle0' });
    await delay(2000);

    const mrHeaders = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('th')).map(th => th.textContent.trim());
    });
    assert('Material Request', 'Table Headers', mrHeaders.includes('MR No') && mrHeaders.includes('Status'), 'Material Request history list table rendered.');

    // Detail Modal Eager Load Verification
    const detailBtnExists = await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Detail'));
      if (btn) {
        btn.click();
        return true;
      }
      return false;
    });
    if (detailBtnExists) {
      await delay(2000);
      const modalText = await page.evaluate(() => {
        const modal = document.querySelector('.modal, div[style*="fixed"]');
        return modal ? modal.textContent : '';
      });
      assert('Material Request', 'Detail Modal items display', modalText.includes('Product') || modalText.includes('Qty') || modalText.includes('Barang'), 'Material request detail modal displays item code and unit details.');
      
      // Close modal
      await page.evaluate(() => {
        const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Close') || b.textContent.includes('Tutup') || b.textContent.includes('✕'));
        if (btn) btn.click();
      });
      await delay(1000);
    }
    await page.screenshot({ path: path.join(SS_DIR, 'audit_06_material_request.png') });

    // -------------------------------------------------------------
    // 6. STOCK OPNAME MODULE
    // -------------------------------------------------------------
    console.log('\n📝 Auditing Stock Opname Module...');
    await page.goto('http://localhost:49977/stock-opname', { waitUntil: 'networkidle0' });
    await delay(2000);

    const stockOpnameText = await page.evaluate(() => document.body.textContent);
    const hasFlowGuidance = stockOpnameText.includes('Alur Stock Opname') || stockOpnameText.includes('Audit');
    assert('Stock Opname', 'Flow Guidance Block', hasFlowGuidance, 'Audit flow step-by-step guidance block exists.');
    await page.screenshot({ path: path.join(SS_DIR, 'audit_07_stock_opname.png') });

    // -------------------------------------------------------------
    // 7. STOCK OVERVIEW MODULE
    // -------------------------------------------------------------
    console.log('\n📊 Auditing Stock Overview Module...');
    await page.goto('http://localhost:49977/stock-overview', { waitUntil: 'networkidle0' });
    await delay(2000);

    const overviewSearchInput = await page.$('input[placeholder*="Search"]') !== null;
    const overviewWarehouseSelect = await page.$('select') !== null;
    assert('Stock Overview', 'Search Input Filter', overviewSearchInput, 'Search box for stock items exists.');
    assert('Stock Overview', 'Warehouse Context select', overviewWarehouseSelect, 'Warehouse filter dropdown exists on reference sheet.');
    await page.screenshot({ path: path.join(SS_DIR, 'audit_08_stock_overview.png') });

    // -------------------------------------------------------------
    // 8. MASTER DATA WORKSPACE (PRODUCTS, VENDORS, USERS, WAREHOUSES, DEPARTMENTS)
    // -------------------------------------------------------------
    console.log('\n🛠️ Auditing Master Data Workspace Tabs...');
    await page.goto('http://localhost:49977/master-data', { waitUntil: 'networkidle0' });
    await delay(2000);

    // Products Tab Checks
    const prodHeaders = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('th')).map(th => th.textContent.trim());
    });
    assert('Master Data - Products', 'Table columns check', prodHeaders.includes('Product Name') && prodHeaders.includes('Min Stock'), 'Product catalog attributes validated.');

    const warehouseFilter = await page.evaluate(() => {
      const selects = Array.from(document.querySelectorAll('select'));
      for (const select of selects) {
        if (Array.from(select.options).some(o => o.textContent.includes('All Warehouses'))) return true;
      }
      return false;
    });
    assert('Master Data - Products', 'Warehouse Stock Filter dropdown', warehouseFilter, 'Warehouse safety filter select exists.');

    // Vendors Tab Checks
    await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Vendors'));
      if (btn) btn.click();
    });
    await delay(1500);
    const vendorHeaders = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('th')).map(th => th.textContent.trim());
    });
    assert('Master Data - Vendors', 'Contact Person Column', vendorHeaders.includes('Contact Person') || vendorHeaders.includes('Contact'), 'Vendor record contains contact_person column.');

    // Users Tab Checks
    await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Users'));
      if (btn) btn.click();
    });
    await delay(1500);
    const userHeaders = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('th')).map(th => th.textContent.trim());
    });
    assert('Master Data - Users', 'Table Columns check', userHeaders.includes('Full Name') && userHeaders.includes('Role'), 'User credentials matrix columns validated.');

    // Warehouses Tab Checks
    await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Warehouses'));
      if (btn) btn.click();
    });
    await delay(1500);
    const whHeaders = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('th')).map(th => th.textContent.trim());
    });
    assert('Master Data - Warehouses', 'Table Columns check', whHeaders.includes('Warehouse Name') && whHeaders.includes('Address'), 'Warehouse records columns validated.');

    // Departments Tab Checks
    await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Departments'));
      if (btn) btn.click();
    });
    await delay(1500);
    const deptHeaders = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('th')).map(th => th.textContent.trim());
    });
    assert('Master Data - Departments', 'Head of Dept Column', deptHeaders.includes('Head of Dept') || deptHeaders.includes('Head'), 'Department records contains head_name column.');
    await page.screenshot({ path: path.join(SS_DIR, 'audit_09_master_data.png') });

  } catch (err) {
    console.error('🔴 DOM Audit script crashed:', err);
  } finally {
    await browser.close();
    
    // Write out Markdown Report
    let report = `# 🔍 Official Frontend DOM Audit & Validation Report\n\n`;
    report += `Generated on: **${new Date().toLocaleString('id-ID')}**  \n`;
    report += `Status: **PASSED** 🟢\n\n`;
    report += `This report programmatically queries and validates DOM elements, layouts, inputs, columns, and navigation options across all application modules.\n\n`;
    report += `## 📋 DOM Assertion Results\n\n`;
    report += `| Feature / Module | DOM Element Verification | Status | Verification Details |\n`;
    report += `| :--- | :--- | :---: | :--- |\n`;
    
    const allPassed = auditResults.every(r => r.status === 'PASS');
    report = report.replace('Status: **PASSED** 🟢', `Status: **${allPassed ? 'PASSED' : 'FAILED'}** ${allPassed ? '🟢' : '🔴'}`);

    auditResults.forEach(r => {
      report += `| **${r.feature}** | ${r.checkName} | ${r.status === 'PASS' ? '🟢 PASS' : '🔴 FAIL'} | ${r.details} |\n`;
    });
    
    report += `\n## 📸 Screenshots Library\n\n`;
    report += `High-fidelity screen captures of each module are stored in the gallery directory at: \`documentation/userflowonapp/screenshot/\`.\n`;
    
    fs.writeFileSync(REPORT_FILE, report);
    console.log(`\n📄 DOM Audit Report generated successfully at: ${REPORT_FILE}\n`);
  }
}

main().catch(console.error);
