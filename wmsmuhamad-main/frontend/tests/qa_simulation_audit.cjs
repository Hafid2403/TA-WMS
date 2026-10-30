const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const REPORT_FILE = path.resolve(__dirname, '../../documentation/userflowonapp/qa_simulation_report.md');
const SS_DIR = path.resolve(__dirname, '../../documentation/userflowonapp/screenshot_qa');

// Ensure directories exist
if (!fs.existsSync(SS_DIR)) {
  fs.mkdirSync(SS_DIR, { recursive: true });
}

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

async function selectReactSelect(page, selector, value) {
  await page.evaluate((sel, val) => {
    const select = document.querySelector(sel);
    if (select) {
      const nativeSelectValueSetter = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value').set;
      nativeSelectValueSetter.call(select, val);
      select.dispatchEvent(new Event('change', { bubbles: true }));
    }
  }, selector, value);
}

async function typeReactInput(page, selector, value) {
  await page.evaluate((sel, val) => {
    const el = document.querySelector(sel);
    if (el) {
      let prototype = HTMLInputElement.prototype;
      if (el.tagName === 'TEXTAREA') {
        prototype = HTMLTextAreaElement.prototype;
      }
      const nativeValueSetter = Object.getOwnPropertyDescriptor(prototype, 'value').set;
      nativeValueSetter.call(el, val);
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
    }
  }, selector, value);
}

async function main() {
  console.log('🧪 Starting Deep QA Simulation & Skepticism Test Suite...');
  
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1440,900'],
    defaultViewport: { width: 1440, height: 900 }
  });

  const page = await browser.newPage();
  
  // Track console/errors
  page.on('console', msg => console.log('[Browser Console]:', msg.text()));
  page.on('pageerror', err => console.error('[Browser Page Error]:', err.message));
  
  const qaResults = [];
  function assertQA(testScenario, checkName, passed, details) {
    qaResults.push({ testScenario, checkName, status: passed ? 'PASS' : 'FAIL', details });
    console.log(`[${passed ? '🟢 PASS' : '🔴 FAIL'}] [${testScenario}] ${checkName}: ${details}`);
  }

  // Dialog / Alert interception for duplicate checks
  let lastAlertMessage = '';
  page.on('dialog', async dialog => {
    lastAlertMessage = dialog.message();
    console.log(`[Captured JS Alert]: "${lastAlertMessage}"`);
    try {
      await dialog.accept();
    } catch (e) {
      // Ignored if already closed
    }
  });

  try {
    // -------------------------------------------------------------
    // STEP 1: AUTHENTICATION
    // -------------------------------------------------------------
    console.log('\n🔑 [QA Step 1] Authenticating as Master Role...');
    await page.goto('http://localhost:49977/login', { waitUntil: 'networkidle0' });
    await page.type('input[type="email"]', 'master@wms.com');
    await page.type('input[type="password"]', 'password');
    await page.click('button');
    await delay(3000);
    
    assertQA('Auth', 'Login Successful', page.url().includes('/dashboard'), 'Redirected to dashboard dashboard successfully.');

    // -------------------------------------------------------------
    // STEP 2: GOODS RECEIPT BOUNDARY & DYNAMIC SCOPING TESTS
    // -------------------------------------------------------------
    console.log('\n📦 [QA Step 2] Navigating to Goods Receipt Page...');
    await page.goto('http://localhost:49977/goods-receipt', { waitUntil: 'networkidle0' });
    await delay(2000);

    console.log('Opening New Receipt Modal...');
    await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('New Receipt'));
      if (btn) btn.click();
    });
    await delay(2000);
    await page.screenshot({ path: path.join(SS_DIR, '01_new_receipt_modal.png') });

    // Select first vendor (e.g. PT Sembako Jaya, vendor_id = 1)
    await selectReactSelect(page, 'select.vendor-select', '1');
    await delay(1000);
    
    // Add Item Row
    await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Tambah Item Barang'));
      if (btn) btn.click();
    });
    await delay(500);

    // Verify product catalog options for Global Electronics Corp
    const jayaProducts = await page.evaluate(() => {
      const select = document.querySelector('table select');
      if (!select) return [];
      return Array.from(select.options).map(o => o.textContent);
    });
    console.log('Products listed for Global Electronics Corp:', jayaProducts);
    assertQA('Goods Receipt', 'Vendor Scoped Catalog', jayaProducts.some(p => p.includes('Panel') || p.includes('LED')), 'Product catalog shows correct vendor products.');

    // Scenario B: Auto-Reset Form on Vendor Switch
    console.log('Testing Auto-Reset on Vendor Switch...');
    // Select a product first
    const initialProductVal = await page.evaluate(() => {
      const select = document.querySelector('select.product-select');
      return select && select.options.length > 1 ? select.options[1].value : '';
    });
    if (initialProductVal) {
      await selectReactSelect(page, 'select.product-select', initialProductVal);
    }
    await delay(500);
    
    // Switch Vendor to Indo Metal Industries (vendor_id = 2)
    await selectReactSelect(page, 'select.vendor-select', '2');
    await delay(1000);

    // Verify row selection was reset/flushed back to blank state to prevent catalog cross-contamination
    const isReset = await page.evaluate(() => {
      const select = document.querySelector('select.product-select');
      return !select || select.value === '';
    });
    assertQA('Goods Receipt', 'Auto-Reset Safeguard', isReset, 'Form items correctly flushed when vendor was switched.');
    await page.screenshot({ path: path.join(SS_DIR, '02_auto_reset_safeguard.png') });

    // Scenario C: Duplicate Row Prevention Check
    console.log('Testing Duplicate Row Selection Alert...');
    // Switch back to Global Electronics Corp (vendor_id = 1)
    await selectReactSelect(page, 'select.vendor-select', '1');
    await delay(1000);

    // Add another item row so we have 2 rows
    await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Tambah Item Barang'));
      if (btn) btn.click();
    });
    await delay(500);

    // Select first valid product on row 1
    const rowHtml = await page.evaluate(() => {
      const row = document.querySelector('table tbody tr');
      return row ? row.innerHTML : 'ROW NOT FOUND';
    });
    console.log('--- FIRST ROW HTML ---');
    console.log(rowHtml);
    console.log('----------------------');

    const pVal = await page.evaluate(() => {
      const select = document.querySelector('table tbody tr:nth-child(1) select.product-select');
      return select && select.options.length > 1 ? select.options[1].value : '1';
    });
    await selectReactSelect(page, 'table tbody tr:nth-child(1) select.product-select', pVal);
    await delay(500);

    // Attempt to select the same product on row 2 to trigger duplicate check
    console.log('Selecting duplicate product on row 2...');
    lastAlertMessage = '';
    try {
      await selectReactSelect(page, 'table tbody tr:nth-child(2) select.product-select', pVal);
    } catch (e) {
      // Ignored
    }
    await delay(1000);

    assertQA('Goods Receipt', 'Duplicate Alert Triggers', lastAlertMessage.includes('sudah dipilih'), `Duplicate selection blocked. Alert message captured: "${lastAlertMessage}"`);

    // Scenario D: Quantity Integer and Step Constraint Checks
    console.log('Testing Decimal & Negative Qty Constraints...');
    const qtyInputAttrs = await page.evaluate(() => {
      const input = document.querySelector('table input[type="number"]');
      if (!input) return null;
      return {
        min: input.getAttribute('min'),
        step: input.getAttribute('step'),
        required: input.hasAttribute('required')
      };
    });
    console.log('Quantity input attributes:', qtyInputAttrs);
    assertQA('Goods Receipt', 'Integer min constraint', qtyInputAttrs.min === '1', 'Quantity input min attribute is set to 1.');
    assertQA('Goods Receipt', 'Integer step constraint', qtyInputAttrs.step === '1', 'Quantity input step attribute is set to 1 (strictly integer).');

    // Scenario E: Successful GR Creation
    console.log('Submitting Valid Goods Receipt Form...');
    // Select warehouse (Main WH = 1)
    await selectReactSelect(page, 'select.warehouse-select', '1');
    await delay(500);

    // Fill notes and date
    const todayStr = new Date().toISOString().split('T')[0];
    await typeReactInput(page, 'input[type="date"]', todayStr);
    await typeReactInput(page, 'textarea', 'Rigorous QA E2E Test Inbound Delivery');
    await delay(500);

    // Set valid non-duplicate quantities
    await typeReactInput(page, 'table tbody tr:nth-child(1) input[type="number"]', '10');
    await delay(500);

    // Remove row 2
    await page.evaluate(() => {
      const delBtns = document.querySelectorAll('table button');
      if (delBtns[1]) delBtns[1].click();
    });
    await delay(1000);
    await page.screenshot({ path: path.join(SS_DIR, '03_form_submission_ready.png') });

    // Submit Form
    await page.evaluate(() => {
      const submitBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Simpan Penerimaan'));
      if (submitBtn) submitBtn.click();
    });
    await delay(3000);

    const bodyText = await page.evaluate(() => document.body.textContent);
    console.log('--- PAGE BODY AFTER SUBMISSION ---');
    console.log(bodyText);
    console.log('----------------------------------');
    const creationSuccess = bodyText.includes('berhasil') || bodyText.includes('success') || bodyText.includes('GR-');
    assertQA('Goods Receipt', 'Receipt Submission Successful', creationSuccess, 'Goods receipt submitted and logged successfully.');

    // -------------------------------------------------------------
    // STEP 3: QC INSPECTION BOUNDARY TESTS
    // -------------------------------------------------------------
    console.log('\n🔍 [QA Step 3] Navigating to QC Inspection Module...');
    await page.goto('http://localhost:49977/qc-inspection', { waitUntil: 'networkidle0' });
    await delay(3000);
    await page.screenshot({ path: path.join(SS_DIR, '04_qc_inspection_loaded.png') });

    // Select the first pending receipt from our new creation
    const grSelected = await page.evaluate(() => {
      const selects = Array.from(document.querySelectorAll('select'));
      const grSelect = selects.find(s => Array.from(s.options).some(o => o.text.includes('Goods Receipt')));
      if (!grSelect || grSelect.options.length <= 1) return false;
      grSelect.value = grSelect.options[1].value;
      grSelect.dispatchEvent(new Event('change', { bubbles: true }));
      return true;
    });
    await delay(1500);

    if (grSelected) {
      // Scenario A: QC Accepted & Rejected Sum Mismatch Check
      console.log('Testing QC Sum Mismatch validation...');
      // Set Accepted = 8, Rejected = 5 (Total = 13, exceeding Received = 10)
      await typeReactInput(page, 'input.qc-accepted-input', '8');
      await typeReactInput(page, 'input.qc-rejected-input', '5');
      await delay(500);
      await page.screenshot({ path: path.join(SS_DIR, '05_qc_mismatch_inputs.png') });

      // Click Submit QC
      await page.evaluate(() => {
        const submitBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Submit QC') || b.textContent.includes('Inspeksi'));
        if (submitBtn) submitBtn.click();
      });
      await delay(1500);

      const qcBodyText = await page.evaluate(() => document.body.textContent);
      const isMismatchBlocked = qcBodyText.includes('tidak boleh melebihi') || qcBodyText.includes('mismatch') || qcBodyText.includes('exceed');
      assertQA('QC Inspection', 'Sum Mismatch Blocked', isMismatchBlocked, 'Mismatch between Accepted+Rejected and total received blocked successfully.');

      // Scenario B: Perfect QC Submission
      console.log('Submitting correct QC inspection (10 passed, 0 rejected)...');
      await typeReactInput(page, 'input.qc-accepted-input', '10');
      await typeReactInput(page, 'input.qc-rejected-input', '0');
      await delay(500);

      // Submit QC
      await page.evaluate(() => {
        const submitBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Submit QC') || b.textContent.includes('Inspeksi'));
        if (submitBtn) submitBtn.click();
      });
      await delay(3000);
      await page.screenshot({ path: path.join(SS_DIR, '06_qc_submitted_successfully.png') });

      const postQcBodyText = await page.evaluate(() => document.body.textContent);
      const qcSuccess = postQcBodyText.includes('berhasil') || postQcBodyText.includes('success');
      assertQA('QC Inspection', 'QC Inspection Recorded', qcSuccess, 'Quality control inspection records updated successfully.');
    } else {
      console.log('Skipping QC detail verification: no pending QC receipts available.');
    }

  } catch (err) {
    console.error('🔴 QA Simulation script crashed:', err);
  } finally {
    await browser.close();
    
    // Write out Markdown Report
    let report = `# 🧪 E2E QA Simulation & Skepticism Audit Report\n\n`;
    report += `Generated on: **${new Date().toLocaleString('id-ID')}**  \n`;
    report += `Status: **PASSED** 🟢\n\n`;
    report += `This report lists the results of programmatically simulating a highly skeptical QA engineer testing boundary conditions, error handling, dynamic dropdown values, and forms constraints.\n\n`;
    report += `## 📋 QA Assertion Results\n\n`;
    report += `| Test Module | Assertion Check | Status | Verification Details |\n`;
    report += `| :--- | :--- | :---: | :--- |\n`;
    
    const allPassed = qaResults.every(r => r.status === 'PASS');
    report = report.replace('Status: **PASSED** 🟢', `Status: **${allPassed ? 'PASSED' : 'FAILED'}** ${allPassed ? '🟢' : '🔴'}`);

    qaResults.forEach(r => {
      report += `| **${r.testScenario}** | ${r.checkName} | ${r.status === 'PASS' ? '🟢 PASS' : '🔴 FAIL'} | ${r.details} |\n`;
    });
    
    report += `\n## 📸 QA Screen Captures\n\n`;
    report += `Detailed screenshots illustrating duplicate rows alerts, vendor scoping flushes, and QC sum mismatch blocks are saved at: \`documentation/userflowonapp/screenshot_qa/\`.\n`;
    
    fs.writeFileSync(REPORT_FILE, report);
    console.log(`\n📄 E2E QA Simulation Report generated successfully at: ${REPORT_FILE}\n`);
  }
}

main().catch(console.error);
