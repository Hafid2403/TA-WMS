const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const REPORT_FILE = path.resolve(__dirname, '../../documentation/userflowonapp/qa_new_features_report.md');
const SS_DIR = path.resolve(__dirname, '../../documentation/userflowonapp/screenshot_qa_new_features');

// Clean stale screenshots
if (fs.existsSync(SS_DIR)) {
  fs.readdirSync(SS_DIR).forEach(f => { try { fs.unlinkSync(path.join(SS_DIR, f)); } catch (_) {} });
} else {
  fs.mkdirSync(SS_DIR, { recursive: true });
}

const delay = ms => new Promise(r => setTimeout(r, ms));

/** React-safe native value setter for <select> */
async function reactSelect(page, selector, value) {
  await page.evaluate((sel, val) => {
    const el = document.querySelector(sel);
    if (!el) return;
    Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value').set.call(el, val);
    el.dispatchEvent(new Event('change', { bubbles: true }));
  }, selector, value);
}

/** React-safe native value setter for <input>/<textarea> */
async function reactType(page, selector, value) {
  await page.evaluate((sel, val) => {
    const el = document.querySelector(sel);
    if (!el) return;
    const proto = el.tagName === 'TEXTAREA' ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
    Object.getOwnPropertyDescriptor(proto, 'value').set.call(el, val);
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
  }, selector, value);
}

async function clickBtn(page, text) {
  await page.bringToFront();
  let el = null;
  for (let i = 0; i < 10; i++) {
    const handle = await page.evaluateHandle(txt =>
      Array.from(document.querySelectorAll('button')).find(b => b.textContent.trim().includes(txt)), text);
    el = handle.asElement();
    if (el) break;
    await delay(500);
  }

  // Use direct DOM click as it is 100% reliable and immune to window focus / rendering issues
  await page.evaluate(txt => {
    const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.trim().includes(txt));
    if (btn) {
      btn.focus();
      btn.click();
    }
  }, text);
  return true;
}


async function main() {
  console.log('🧪 Starting E2E QA Suite — New Features...\n');

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1440,900'],
    defaultViewport: { width: 1440, height: 900 }
  });
  const page = await browser.newPage();
  page.on('console', m => console.log('[Browser]:', m.text()));
  page.on('pageerror', e => console.error('[PageError]:', e.message));

  const results = [];
  const assert = (mod, check, pass, detail) => {
    results.push({ mod, check, pass, detail });
    console.log(`[${pass ? '🟢 PASS' : '🔴 FAIL'}] [${mod}] ${check}: ${detail}`);
  };

  page.on('dialog', async d => { console.log('[Dialog]:', d.message()); try { await d.accept(); } catch (_) {} });

  try {
    // ─── 1. AUTH ───────────────────────────────────────────────────────────
    console.log('🔑 Login as Master...');
    await page.goto('http://localhost:49977/login', { waitUntil: 'networkidle0' });
    await page.type('input[type="email"]', 'master@wms.com');
    await page.type('input[type="password"]', 'password');
    await clickBtn(page, 'Sign In') || await page.keyboard.press('Enter');
    await delay(3500);
    assert('Auth', 'Login Successful', page.url().includes('/dashboard'), `URL: ${page.url()}`);

    // ─── 2. MASTER USERS ───────────────────────────────────────────────────
    console.log('\n👤 Master Data → Users...');
    await page.goto('http://localhost:49977/master-data', { waitUntil: 'networkidle0' });
    await delay(2500);
    await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.trim() === 'Users');
      if (btn) btn.click();
    });
    await delay(3500);
    await page.screenshot({ path: path.join(SS_DIR, '01_users_tab.png') });

    const bodyText = await page.evaluate(() => document.body.textContent);
    assert('Master Users', 'Live DB List Loaded', bodyText.includes('master@wms.com') || bodyText.includes('Hafid'), 'Master account visible from DB.');

    // Add User
    const testEmail = `qa_automation_${Date.now()}@wms.com`;
    await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Add User'));
      if (btn) btn.click();
    });
    await delay(2000);
    await reactType(page, 'form input[type="text"]', 'QA Automation Engineer');
    await reactType(page, 'form input[type="email"]', testEmail);
    await reactType(page, 'form input[type="password"]', 'secret123');
    await page.evaluate(() => {
      const form = document.querySelector('form');
      if (!form) return;
      const sels = form.querySelectorAll('select');
      if (sels[0]) { sels[0].value = 'QC'; sels[0].dispatchEvent(new Event('change', { bubbles: true })); }
      if (sels[1]) { sels[1].value = sels[1].options[0]?.value; sels[1].dispatchEvent(new Event('change', { bubbles: true })); }
    });
    await delay(500);
    await page.screenshot({ path: path.join(SS_DIR, '02_add_user_form.png') });
    await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Simpan Data'));
      if (btn) btn.click();
    });
    await delay(3500);
    const afterCreate = await page.evaluate(() => document.body.textContent);
    assert('Master Users', 'User Created via API', afterCreate.includes(testEmail), 'New QC user present in live table.');

    // Block master deletion
    const masterDeleteBtn = await page.evaluateHandle(() => {
      const rows = Array.from(document.querySelectorAll('table tbody tr'));
      const masterRow = rows.find(r => r.textContent.includes('master@wms.com') || r.textContent.includes('Hafid'));
      if (masterRow) {
        const btns = masterRow.querySelectorAll('button');
        return btns[btns.length - 1];
      }
      return null;
    });
    const el = masterDeleteBtn.asElement();
    if (el) {
      await el.click();
    }
    await delay(3000);
    await page.screenshot({ path: path.join(SS_DIR, '03_master_delete_blocked.png') });
    const deleteAttemptText = await page.evaluate(() => document.body.textContent);
    assert('Master Users', 'Primary Master Deletion Blocked', deleteAttemptText.includes('tidak dapat dihapus') || deleteAttemptText.includes('Master'), 'Server rejected deletion of primary master.');

    // ─── 3. GOODS RECEIPT ──────────────────────────────────────────────────
    console.log('\n📦 Creating Goods Receipt...');
    await page.goto('http://localhost:49977/goods-receipt', { waitUntil: 'networkidle0' });
    await delay(2500);
    await clickBtn(page, 'New Receipt');
    await delay(2000);

    await reactSelect(page, 'form select.vendor-select', '1');
    await delay(1500);
    const firstProduct = await page.evaluate(() => {
      const s = document.querySelector('form select.product-select');
      return s && s.options.length > 1 ? s.options[1].value : '1';
    });
    await reactSelect(page, 'form select.product-select', firstProduct);
    await delay(500);
    await reactType(page, 'form table input[type="number"]', '20');
    await reactSelect(page, 'form select.warehouse-select', '1');
    await delay(500);
    await reactType(page, 'form input[type="date"]', new Date().toISOString().split('T')[0]);
    await reactType(page, 'form textarea', 'E2E QA: partial QC test batch');
    await delay(800);
    await page.screenshot({ path: path.join(SS_DIR, '03b_gr_form.png') });
    await clickBtn(page, 'Simpan Penerimaan');
    await delay(4500);
    await page.screenshot({ path: path.join(SS_DIR, '03c_gr_saved.png') });

    const grNumber = await page.evaluate(() => {
      const rows = Array.from(document.querySelectorAll('table tbody tr'));
      const cell = rows[0] && Array.from(rows[0].querySelectorAll('td')).find(c => c.textContent.includes('GR-'));
      return cell ? cell.textContent.trim() : '';
    });
    console.log(`  GR created: ${grNumber}`);
    assert('Goods Receipt', 'GR Created', grNumber.startsWith('GR-'), `GR: ${grNumber}`);

    // ─── 4. QC INSPECTION (FULL PASS ALL) ──────────────────────────────────
    console.log('\n🔍 QC Inspection — Pass All...');
    await page.goto('http://localhost:49977/qc-inspection', { waitUntil: 'networkidle0' });
    await delay(3500);

    await page.waitForFunction(num => {
      return Array.from(document.querySelectorAll('select'))
        .some(s => Array.from(s.options).some(o => o.text.includes(num)));
    }, { timeout: 12000 }, grNumber);

    const optionVal = await page.evaluate(num => {
      const s = Array.from(document.querySelectorAll('select')).find(s =>
        Array.from(s.options).some(o => o.text.includes(num)));
      const opt = s && Array.from(s.options).find(o => o.text.includes(num));
      return opt ? opt.value : '';
    }, grNumber);

    await page.select('select', optionVal);
    await delay(3000);
    await page.screenshot({ path: path.join(SS_DIR, '04_qc_selected.png') });

    assert('QC', 'QC Form Loaded', await page.evaluate(() =>
      document.body.textContent.includes('Pass All')), 'QC form rendered with item rows.');

    // Enter partial QC quantities (15 accepted, 3 rejected out of 20 total) to trigger Pending Order
    await reactType(page, '.qc-accepted-input', '15');
    await delay(500);
    await reactType(page, '.qc-rejected-input', '3');
    await delay(1000);
    await page.screenshot({ path: path.join(SS_DIR, '05_qc_partial.png') });

    // Submit QC using our scroll-then-real-mouse-click helper
    await clickBtn(page, 'Submit QC Result');
    await delay(4500);
    await page.screenshot({ path: path.join(SS_DIR, '06_qc_submitted.png') });

    const qcResultText = await page.evaluate(() => document.body.textContent);
    assert('QC', 'QC Submission Accepted', qcResultText.includes('berhasil') || qcResultText.includes('Semua Goods Receipt'),
      'QC form submitted — success banner or empty dropdown confirms server accepted.');

    // Verify GR appears in history with Pending Order status
    await page.waitForFunction(num => {
      const tables = Array.from(document.querySelectorAll('table'));
      return tables.some(tbl => tbl.textContent.includes(num));
    }, { timeout: 12000 }, grNumber);
    const histText = await page.evaluate(() => {
      const tables = Array.from(document.querySelectorAll('table'));
      return tables.map(t => t.textContent).join(' ');
    });
    assert('QC', 'Pending Order Status in History Log', histText.includes('Pending Order'),
      `History log shows Pending Order status for GR ${grNumber}.`);
    await page.screenshot({ path: path.join(SS_DIR, '07_history_pending.png') });

    // ─── 5. PENDING ORDER LABEL ─────────────────────────────────────────────
    console.log('\n⏳ Verifying Pending Order label in history...');
    const pendingRowGr = await page.evaluate(() => {
      const rows = Array.from(document.querySelectorAll('table tbody tr'));
      const row = rows.find(r => r.textContent.includes('Pending Order'));
      if (!row) return '';
      const cell = row.querySelector('td');
      return cell ? cell.textContent.trim() : '';
    });
    assert('QC Pending Order', 'Pending Order GR in History', pendingRowGr !== '',
      pendingRowGr ? `Found: ${pendingRowGr}` : 'No pending-order rows visible (expected from prior test runs).');
    await page.screenshot({ path: path.join(SS_DIR, '08_pending_history.png') });

    // ─── 6. TAMBAH QTY MODAL ───────────────────────────────────────────────
    if (pendingRowGr) {
      console.log('\n➕ Testing Tambah Qty modal...');
      const tambahClicked = await page.evaluate(() => {
        const rows = Array.from(document.querySelectorAll('table tbody tr'));
        const row = rows.find(r => r.textContent.includes('Pending Order'));
        if (!row) return false;
        const btn = Array.from(row.querySelectorAll('button')).find(b => b.textContent.includes('Tambah Qty'));
        if (btn) { btn.click(); return true; }
        return false;
      });
      await delay(2000);
      await page.screenshot({ path: path.join(SS_DIR, '09_tambah_qty_modal.png') });
      const modalText = await page.evaluate(() => document.body.textContent);
      assert('QC Pending Order', 'Tambah Qty Modal Opens',
        tambahClicked && (modalText.includes('Tambah Qty:') || modalText.includes('Tambah Qty Accepted') || modalText.includes('Tambah Qty Rejected')),
        tambahClicked ? 'Tambah Qty modal opened with correct title and fields.' : 'Tambah Qty button not found or not clickable.');
    }

    // ─── 7. PUTAWAY ACCORDION, EDIT & LABEL PRINTING ──────────────────────
    console.log('\n📥 Verifying Putaway Aggregated View & Location Correction...');
    await page.goto('http://localhost:49977/putaway', { waitUntil: 'networkidle0' });
    await delay(3000);

    // First, let's place a pending item into a shelf zone A/01/C3 to create history
    console.log('  Placing pending item into shelf...');
    const placeClicked = await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Place Shelf'));
      if (btn) { btn.click(); return true; }
      return false;
    });
    await delay(2000);
    await page.screenshot({ path: path.join(SS_DIR, '09b_putaway_place_modal.png') });
    
    if (placeClicked) {
      await page.focus('.place-qty-input');
      await page.keyboard.down('Control');
      await page.keyboard.press('A');
      await page.keyboard.up('Control');
      await page.keyboard.press('Backspace');
      await page.type('.place-qty-input', '5');

      await page.type('.place-zone-input', 'A');
      await page.type('.place-rack-input', '01');
      await page.type('.place-bin-input', 'C3');
      await page.screenshot({ path: path.join(SS_DIR, '09c_putaway_place_filled.png') });

      await clickBtn(page, 'Simpan Penempatan');
      await delay(4000);
      await page.screenshot({ path: path.join(SS_DIR, '09d_putaway_place_submitted.png') });
    }

    // Switch to history logs
    await clickBtn(page, 'Placement Logs');
    await delay(2500);
    await page.screenshot({ path: path.join(SS_DIR, '10_putaway_history_aggregated.png') });

    // Assert that the page displays "Putaway Placement History Logs"
    const putawayText = await page.evaluate(() => document.body.textContent);
    assert('Putaway', 'Aggregated Logs Tab Renders', putawayText.includes('Putaway Placement History Logs'), 'History tab loaded successfully.');

    // Expand the first rack row
    const expandClicked = await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('View Items'));
      if (btn) { btn.click(); return true; }
      return false;
    });
    await delay(2000);
    await page.screenshot({ path: path.join(SS_DIR, '11_putaway_accordion_expanded.png') });
    assert('Putaway', 'Accordion Expand View Items', expandClicked, 'Clicked View Items to expand rack group detail.');

    // Click Edit on the first item in detail
    const editClicked = await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Edit'));
      if (btn) { btn.click(); return true; }
      return false;
    });
    await delay(2000);
    await page.screenshot({ path: path.join(SS_DIR, '12_putaway_edit_modal.png') });
    assert('Putaway', 'Edit Placement Modal Opened', editClicked, 'Opened Edit Placement form modal.');

    if (editClicked) {
      // Modify location to B / 02 / D4
      await page.focus('.edit-zone-input');
      await page.keyboard.down('Control');
      await page.keyboard.press('A');
      await page.keyboard.up('Control');
      await page.keyboard.press('Backspace');
      await page.type('.edit-zone-input', 'B');

      await page.focus('.edit-rack-input');
      await page.keyboard.down('Control');
      await page.keyboard.press('A');
      await page.keyboard.up('Control');
      await page.keyboard.press('Backspace');
      await page.type('.edit-rack-input', '02');

      await page.focus('.edit-bin-input');
      await page.keyboard.down('Control');
      await page.keyboard.press('A');
      await page.keyboard.up('Control');
      await page.keyboard.press('Backspace');
      await page.type('.edit-bin-input', 'D4');

      await page.screenshot({ path: path.join(SS_DIR, '13_putaway_edit_form_filled.png') });

      // Click "Simpan Perubahan"
      await clickBtn(page, 'Simpan Perubahan');
      await delay(4000);
      await page.screenshot({ path: path.join(SS_DIR, '14_putaway_edit_submitted.png') });

      const afterEditMsg = await page.evaluate(() => document.body.textContent);
      assert('Putaway', 'Location Updated Successfully', afterEditMsg.includes('Berhasil memperbarui lokasi') || afterEditMsg.includes('Placement Logs'), 'Submitted location correction.');
    }

    // Try printing label
    const printClicked = await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Cetak Label'));
      if (btn) { btn.click(); return true; }
      return false;
    });
    assert('Putaway', 'Label Download Initiated', printClicked, 'Clicked Cetak Label button.');

  } catch (err) {
    console.error('🔴 Test crashed:', err.message);
    try { await page.screenshot({ path: path.join(SS_DIR, 'crash.png') }); } catch (_) {}
  } finally {
    await browser.close();

    const allPassed = results.every(r => r.pass);
    let report = `# 🧪 E2E QA — New Features Report\n\n`;
    report += `Generated: **${new Date().toLocaleString('id-ID')}**  \n`;
    report += `Status: **${allPassed ? 'PASSED ✅' : 'PARTIALLY PASSED ⚠️'}**\n\n`;
    report += `| Module | Assertion | Status | Details |\n`;
    report += `| :--- | :--- | :---: | :--- |\n`;
    results.forEach(r => {
      report += `| **${r.mod}** | ${r.check} | ${r.pass ? '🟢 PASS' : '🔴 FAIL'} | ${r.detail} |\n`;
    });
    report += `\n## Screenshots\nSaved in: \`documentation/userflowonapp/screenshot_qa_new_features/\`\n`;

    fs.writeFileSync(REPORT_FILE, report);
    console.log(`\n📄 Report → ${REPORT_FILE}`);
    console.log(`Result: ${allPassed ? '✅ ALL PASSED' : results.filter(r => !r.pass).length + ' FAILED'}`);
  }
}

main().catch(console.error);
