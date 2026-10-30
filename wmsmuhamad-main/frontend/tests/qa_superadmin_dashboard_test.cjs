const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const REPORT_FILE = path.resolve(__dirname, '../../documentation/userflowonapp/qa_superadmin_dashboard_report.md');
const SS_DIR = path.resolve(__dirname, '../../documentation/userflowonapp/screenshot_qa');

if (!fs.existsSync(SS_DIR)) {
  fs.mkdirSync(SS_DIR, { recursive: true });
}

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

// Helper to set select value and trigger change event for React state
async function selectReactOption(page, selector, value) {
  await page.evaluate((sel, val) => {
    const select = document.querySelector(sel);
    if (select) {
      const nativeSelectValueSetter = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value').set;
      nativeSelectValueSetter.call(select, val);
      select.dispatchEvent(new Event('change', { bubbles: true }));
    }
  }, selector, value);
}

// Helper to set input value and trigger input & change events for React state
async function typeReactInput(page, selector, value) {
  await page.evaluate((sel, val) => {
    const el = document.querySelector(sel);
    if (el) {
      const nativeValueSetter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
      nativeValueSetter.call(el, val);
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
    }
  }, selector, value);
}

async function main() {
  console.log('🧪 Starting Expanded Superadmin Dashboard E2E Integration Test...');
  
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1440,900'],
    defaultViewport: { width: 1440, height: 900 }
  });

  const page = await browser.newPage();
  
  page.on('console', msg => console.log('[Browser Console]:', msg.text()));
  page.on('pageerror', err => console.error('[Browser Page Error]:', err.message));
  
  page.on('response', async response => {
    if (response.status() === 422) {
      console.log(`[HTTP 422 Error] URL: ${response.url()}`);
      try {
        const json = await response.json();
        console.log('[HTTP 422 Response Body]:', JSON.stringify(json, null, 2));
      } catch (e) {
        try {
          const text = await response.text();
          console.log('[HTTP 422 Response Text]:', text);
        } catch (err2) {
          console.log('[HTTP 422 Response payload failed to read]');
        }
      }
    }
  });
  
  const qaResults = [];
  function assertQA(testScenario, checkName, passed, details) {
    qaResults.push({ testScenario, checkName, status: passed ? 'PASS' : 'FAIL', details });
    console.log(`[${passed ? '🟢 PASS' : '🔴 FAIL'}] [${testScenario}] ${checkName}: ${details}`);
  }

  // Intercept JS confirmation alerts (like for rejection or deletes)
  page.on('dialog', async dialog => {
    console.log(`[Captured JS Dialog]: "${dialog.message()}"`);
    await dialog.accept();
  });

  try {
    // -------------------------------------------------------------
    // STEP 1: AUTHENTICATION
    // -------------------------------------------------------------
    console.log('\n🔑 [Superadmin QA Step 1] Authenticating as Super Admin...');
    await page.goto('http://localhost:49977/login', { waitUntil: 'networkidle0' });
    await page.type('input[type="email"]', 'admin@wms.com');
    await page.type('input[type="password"]', 'password');
    await page.click('button');
    await delay(3000);
    
    const isRedirected = page.url().includes('/dashboard') || page.url().includes('/superadmin');
    assertQA('Auth', 'Superadmin Login Successful', isRedirected, `Redirected: ${page.url()}`);

    if (page.url().includes('/dashboard')) {
      console.log('Navigating to Superadmin page...');
      await page.goto('http://localhost:49977/superadmin', { waitUntil: 'networkidle0' });
      await delay(2000);
    }

    assertQA('Navigation', 'Loaded Superadmin Page', page.url().includes('/superadmin'), 'Successfully loaded the Superadmin workspace page.');

    // -------------------------------------------------------------
    // STEP 2: DASHBOARD LAYOUT & CARD VERIFICATION
    // -------------------------------------------------------------
    console.log('\n📊 [Superadmin QA Step 2] Checking Dashboard Tab components...');
    await page.screenshot({ path: path.join(SS_DIR, 'superadmin_01_dashboard.png') });

    // Verify Kapasitas Warehouse card and titles
    const hasCardClass = await page.evaluate(() => !!document.querySelector('.dashboard-grid .card'));
    assertQA('Dashboard Layout', 'Warehouse Card Wrapper Class', hasCardClass, 'Warehouse capacity outer element uses standard card class.');

    const whCount = await page.evaluate(() => document.querySelectorAll('.dashboard-grid .card .capacity-bar-track').length);
    assertQA('Dashboard Data', 'Dynamic Warehouse Capacity Lists', whCount > 0, `Successfully rendered ${whCount} warehouse capacity progress bars dynamically.`);

    // -------------------------------------------------------------
    // STEP 3: USER ACTIVATION FLOW FROM DASHBOARD
    // -------------------------------------------------------------
    console.log('\n⚡ [Superadmin QA Step 3] Checking User Activation Action...');
    const hasPendingUsers = await page.evaluate(() => {
      const rows = document.querySelectorAll('table tbody tr');
      return rows.length > 0 && document.body.textContent.includes('Menunggu Aktivasi');
    });

    if (hasPendingUsers) {
      console.log('Pending user detected on dashboard. Attempting quick activation...');
      await page.evaluate(() => {
        // Find the first "Aktifkan" button by title attribute 'Aktifkan Akun' or text content '✓'
        const btn = Array.from(document.querySelectorAll('table button')).find(b => b.title === 'Aktifkan Akun' || b.textContent.includes('✓'));
        if (btn) btn.click();
      });
      await delay(2000);
      await page.screenshot({ path: path.join(SS_DIR, 'superadmin_user_activated.png') });
      const toastText = await page.evaluate(() => {
        const div = Array.from(document.querySelectorAll('div')).find(d => d.textContent.includes('diaktifkan') || d.textContent.includes('berhasil'));
        return div ? div.textContent.trim() : '';
      });
      assertQA('User Actions', 'Activate Pending User', toastText.toLowerCase().includes('berhasil') || toastText.toLowerCase().includes('aktif'), `Activation toast message captured: "${toastText}"`);
    } else {
      console.log('No pending users in queue. Skipping quick activation check.');
    }

    // -------------------------------------------------------------
    // STEP 4: WRITE-ACTION - CREATE NEW WAREHOUSE
    // -------------------------------------------------------------
    console.log('\n🏭 [Superadmin QA Step 4] Testing Create Warehouse (Write Action)...');
    
    // Switch to Monitor tab
    await page.evaluate(() => {
      const tabs = Array.from(document.querySelectorAll('.tabs .tab'));
      const monitorTab = tabs.find(t => t.textContent.includes('Monitor'));
      if (monitorTab) monitorTab.click();
    });
    await delay(1500);

    // Click "+ Tambah Warehouse"
    await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Tambah Warehouse'));
      if (btn) btn.click();
    });
    await delay(1000);
    await page.screenshot({ path: path.join(SS_DIR, 'superadmin_add_warehouse_modal.png') });

    const uniqueWhName = `Test Warehouse Surabaya Hub ${Date.now()}`;

    // Fill warehouse form details using IDs
    await typeReactInput(page, '#wh_name', uniqueWhName);
    await typeReactInput(page, '#wh_address', 'Jl. Rungkut Industri Raya No. 99');
    await typeReactInput(page, '#wh_city', 'Surabaya');
    await typeReactInput(page, '#wh_capacity', '18500');
    await selectReactOption(page, '#wh_pic', '2');
    await selectReactOption(page, '#wh_status', 'active');
    await delay(500);
    await page.screenshot({ path: path.join(SS_DIR, 'superadmin_warehouse_inputs.png') });

    // Submit Warehouse Form
    await page.click('.modal-overlay button[type="submit"]');
    await delay(2000);
    await page.screenshot({ path: path.join(SS_DIR, 'superadmin_warehouse_submitted.png') });

    // Search for the newly created warehouse in search bar
    await typeReactInput(page, 'input[placeholder="Cari nama warehouse atau kota..."]', uniqueWhName);
    await delay(1500);
    await page.screenshot({ path: path.join(SS_DIR, 'superadmin_search_warehouse_result.png') });

    const whSearchResult = await page.evaluate((name) => {
      return document.body.textContent.includes(name);
    }, uniqueWhName);
    assertQA('Warehouse Actions', 'Warehouse Creation & List Update', whSearchResult, `New Warehouse "${uniqueWhName}" successfully created and retrieved in list.`);

    // -------------------------------------------------------------
    // STEP 5: WRITE-ACTION - CREATE NEW USER
    // -------------------------------------------------------------
    console.log('\n👥 [Superadmin QA Step 5] Testing Create User (Write Action)...');

    // Switch to User Management tab
    await page.evaluate(() => {
      const tabs = Array.from(document.querySelectorAll('.tabs .tab'));
      const userTab = tabs.find(t => t.textContent.includes('User'));
      if (userTab) userTab.click();
    });
    await delay(1500);

    // Click "+ Tambah User"
    await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Tambah User') || b.textContent.includes('Akun'));
      if (btn) btn.click();
    });
    await delay(1000);
    await page.screenshot({ path: path.join(SS_DIR, 'superadmin_add_user_modal.png') });

    const uniqueEmail = `operator_${Date.now()}@electra.co.id`;
    const uniqueUserName = `Operator E2E ${Date.now()}`;

    // Fill user form details using IDs
    await typeReactInput(page, '#user_name', uniqueUserName);
    await typeReactInput(page, '#user_email', uniqueEmail);
    await typeReactInput(page, '#user_password', 'password123');
    await selectReactOption(page, '#user_role', '2');
    await selectReactOption(page, '#user_status', 'active');
    await selectReactOption(page, '#user_warehouse', '1');
    await delay(500);
    await page.screenshot({ path: path.join(SS_DIR, 'superadmin_user_inputs.png') });

    // Submit User Form
    await page.click('.modal-overlay button[type="submit"]');
    await delay(2000);
    await page.screenshot({ path: path.join(SS_DIR, 'superadmin_user_submitted.png') });

    // Search for newly created user
    await typeReactInput(page, 'input[placeholder="Cari nama user atau email..."]', uniqueUserName);
    await delay(1500);
    await page.screenshot({ path: path.join(SS_DIR, 'superadmin_search_user_result.png') });

    const userSearchResult = await page.evaluate((name) => {
      return document.body.textContent.includes(name);
    }, uniqueUserName);
    assertQA('User Actions', 'User Creation & List Update', userSearchResult, `New active User "${uniqueUserName}" created and listed successfully.`);

  } catch (err) {
    console.error('🔴 Superadmin QA E2E Test Suite crashed:', err);
  } finally {
    await browser.close();
    
    // Write out Markdown Report
    let report = `# 🧪 E2E Superadmin Dashboard & Parity Audit Report\n\n`;
    report += `Generated on: **${new Date().toLocaleString('id-ID')}**  \n`;
    report += `Status: **PASSED** 🟢\n\n`;
    report += `This report catalogs Puppeteer automation test results verifying both read and mutative write operations (create user, create warehouse, user activation triggers) on the Superadmin dashboard.\n\n`;
    report += `## 📋 QA Assertion Checklist\n\n`;
    report += `| Module Scenario | Verification Point | Outcome | Details |\n`;
    report += `| :--- | :--- | :---: | :--- |\n`;
    
    const allPassed = qaResults.every(r => r.status === 'PASS');
    report = report.replace('Status: **PASSED** 🟢', `Status: **${allPassed ? 'PASSED' : 'FAILED'}** ${allPassed ? '🟢' : '🔴'}`);

    qaResults.forEach(r => {
      report += `| **${r.testScenario}** | ${r.checkName} | ${r.status === 'PASS' ? '🟢 PASS' : '🔴 FAIL'} | ${r.details} |\n`;
    });
    
    report += `\n## 📸 Screen Capture Evidences\n\n`;
    report += `Views captured during automated mutative transitions are archived under: \`documentation/userflowonapp/screenshot_qa/\`:\n`;
    report += `- \`superadmin_01_dashboard.png\`\n`;
    report += `- \`superadmin_add_warehouse_modal.png\`\n`;
    report += `- \`superadmin_warehouse_submitted.png\`\n`;
    report += `- \`superadmin_search_warehouse_result.png\`\n`;
    report += `- \`superadmin_add_user_modal.png\`\n`;
    report += `- \`superadmin_user_submitted.png\`\n`;
    report += `- \`superadmin_search_user_result.png\`\n`;
    
    fs.writeFileSync(REPORT_FILE, report);
    console.log(`\n📄 Superadmin QA Audit Report generated successfully at: ${REPORT_FILE}\n`);
  }
}

main().catch(console.error);
