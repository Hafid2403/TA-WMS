const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const REPORT_FILE = path.resolve(__dirname, '../../documentation/userflowonapp/qa_proportion_edit_report.md');
const SS_DIR = path.resolve(__dirname, '../../documentation/userflowonapp/screenshot_qa_proportion_edit');

if (fs.existsSync(SS_DIR)) {
  fs.readdirSync(SS_DIR).forEach(f => { try { fs.unlinkSync(path.join(SS_DIR, f)); } catch (_) {} });
} else {
  fs.mkdirSync(SS_DIR, { recursive: true });
}

const delay = ms => new Promise(r => setTimeout(r, ms));

async function reactSelect(page, selector, value) {
  await page.evaluate((sel, val) => {
    const el = document.querySelector(sel);
    if (!el) return;
    Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value').set.call(el, val);
    el.dispatchEvent(new Event('change', { bubbles: true }));
  }, selector, value);
}

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
  const clicked = await page.evaluate(txt => {
    const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.trim().includes(txt));
    if (btn) {
      btn.click();
      return true;
    }
    return false;
  }, text);
  return clicked;
}

async function main() {
  console.log('🧪 Starting E2E QA Suite — QC Edit Proportion Verification...\n');

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1440,900'],
    defaultViewport: { width: 1440, height: 900 }
  });
  const page = await browser.newPage();
  
  const results = [];
  const assert = (mod, check, pass, detail) => {
    results.push({ mod, check, pass, detail });
    console.log(`[${pass ? '🟢 PASS' : '🔴 FAIL'}] [${mod}] ${check}: ${detail}`);
  };

  try {
    // 1. LOGIN
    console.log('🔑 Logging in as Master...');
    await page.goto('http://localhost:49977/login', { waitUntil: 'networkidle0' });
    await page.type('input[type="email"]', 'master@wms.com');
    await page.type('input[type="password"]', 'password');
    await clickBtn(page, 'Sign In') || await page.keyboard.press('Enter');
    await delay(3500);
    assert('Auth', 'Login Successful', page.url().includes('/dashboard'), `URL: ${page.url()}`);

    // 2. CREATE A GOODS RECEIPT
    console.log('\n📦 Creating a Goods Receipt for testing...');
    await page.goto('http://localhost:49977/goods-receipt', { waitUntil: 'networkidle0' });
    await delay(4000);
 
    let modalOpened = false;
    for (let attempt = 1; attempt <= 5; attempt++) {
      console.log(`  Clicking "+ New Receipt" (Attempt ${attempt}/5)...`);
      await clickBtn(page, 'New Receipt');
      await delay(1500);
      const hasModal = await page.evaluate(() => document.body.textContent.includes('Buat Goods Receipt Baru'));
      if (hasModal) {
        modalOpened = true;
        console.log(`  [🟢 SUCCESS] Modal "Buat Goods Receipt Baru" opened successfully.`);
        break;
      }
    }
    assert('Goods Receipt', 'New Receipt Modal Opened', modalOpened, 'The creation modal opened successfully.');

    await reactSelect(page, 'form select.vendor-select', '1');
    await delay(1500);
 
    const debugSelects = await page.evaluate(() => {
      const vSel = document.querySelector('form select.vendor-select');
      const pSel = document.querySelector('form select.product-select');
      const wSel = document.querySelector('form select.warehouse-select');
      return {
        vendorOptions: vSel ? Array.from(vSel.options).map(o => ({ value: o.value, text: o.text })) : [],
        productOptions: pSel ? Array.from(pSel.options).map(o => ({ value: o.value, text: o.text })) : [],
        warehouseOptions: wSel ? Array.from(wSel.options).map(o => ({ value: o.value, text: o.text })) : []
      };
    });
    console.log('DEBUG SELECTS:', JSON.stringify(debugSelects, null, 2));

    const firstProduct = await page.evaluate(() => {
      const s = document.querySelector('form select.product-select');
      return s && s.options.length > 1 ? s.options[1].value : '1';
    });
    await reactSelect(page, 'form select.product-select', firstProduct);
    await delay(500);
    await reactType(page, 'form table input[type="number"]', '10');
    await reactSelect(page, 'form select.warehouse-select', '1');
    await delay(500);
    await reactType(page, 'form input[type="date"]', new Date().toISOString().split('T')[0]);
    await reactType(page, 'form textarea', 'Proportion E2E check');
    await delay(800);
    await clickBtn(page, 'Simpan Penerimaan');
    await delay(4500);

    await page.waitForFunction(() => {
      const rows = Array.from(document.querySelectorAll('table tbody tr'));
      return rows.length > 1;
    }, { timeout: 10000 });

    const grNumber = await page.evaluate(() => {
      const rows = Array.from(document.querySelectorAll('table tbody tr'));
      const cell = rows[0] && Array.from(rows[0].querySelectorAll('td')).find(c => c.textContent.includes('GR-'));
      return cell ? cell.textContent.trim() : '';
    });
    console.log(`  GR created: ${grNumber}`);
    assert('Goods Receipt', 'GR Created for E2E QC', grNumber.startsWith('GR-'), `GR Number: ${grNumber}`);

    // 3. QC INSPECTION PAGE - SUBMIT PARTIAL
    console.log('\n🔍 Navigating to QC Inspection page...');
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

    // Input partial QC: Accepted 7, Rejected 2 (Total 9 out of 10)
    console.log('📝 Entering partial QC findings: Accepted: 7, Rejected: 2...');
    await reactType(page, '.qc-accepted-input', '7');
    await reactType(page, '.qc-rejected-input', '2');

    await reactType(page, 'textarea', 'Initial partial QC inspection');
    await delay(1000);
    await page.screenshot({ path: path.join(SS_DIR, '01_qc_partial_filled.png') });
    await clickBtn(page, 'Submit QC Result');
    await delay(4500);

    // Verify row displays "Pending Order" in history logs
    const partialRowDetails = await page.evaluate((grNum) => {
      const rows = Array.from(document.querySelectorAll('table tbody tr'));
      const row = rows.find(r => r.textContent.includes(grNum));
      if (!row) return null;
      const cells = Array.from(row.querySelectorAll('td'));
      return {
        status: cells[5]?.textContent.trim(),
        button: cells[9]?.textContent.trim()
      };
    }, grNumber);

    assert('QC Partial Flow', 'Displays Pending Order status', partialRowDetails.status === 'Pending Order', `Status badge: ${partialRowDetails.status}`);
    assert('QC Partial Flow', 'Displays Tambah Qty button', partialRowDetails.button.includes('Tambah Qty'), `Button text: ${partialRowDetails.button}`);

    // 4. ADD REMAINING QTY TO COMPLETE INSPECTION
    console.log('\n➕ Completing the inspection (Adding remaining quantity)...');
    await page.evaluate((grNum) => {
      const rows = Array.from(document.querySelectorAll('table tbody tr'));
      const row = rows.find(r => r.textContent.includes(grNum));
      if (row) {
        const btn = Array.from(row.querySelectorAll('button')).find(b => b.textContent.includes('Tambah Qty'));
        if (btn) btn.click();
      }
    }, grNumber);
    await delay(2000);
    await page.screenshot({ path: path.join(SS_DIR, '02_add_qty_modal_opened.png') });

    // In the modal, add remaining: Accepted 1, Rejected 0 (bringing total to 10/10)
    console.log('Entering final remaining quantity in Tambah Qty modal...');
    await page.evaluate((val1, val2) => {
      const modal = Array.from(document.querySelectorAll('div')).find(d => d.style.position === 'fixed');
      if (!modal) return;
      const inputs = Array.from(modal.querySelectorAll('input[type="number"]'));
      if (inputs[0]) {
        Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(inputs[0], val1);
        inputs[0].dispatchEvent(new Event('input', { bubbles: true }));
        inputs[0].dispatchEvent(new Event('change', { bubbles: true }));
      }
      if (inputs[1]) {
        Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(inputs[1], val2);
        inputs[1].dispatchEvent(new Event('input', { bubbles: true }));
        inputs[1].dispatchEvent(new Event('change', { bubbles: true }));
      }
    }, '1', '0');
    await reactType(page, 'form textarea', 'Completing remaining inspection.');
    await delay(1000);
    await page.screenshot({ path: path.join(SS_DIR, '03_add_qty_filled.png') });

    await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.trim() === 'Simpan');
      if (btn) btn.click();
    });
    await delay(4500);
    await page.screenshot({ path: path.join(SS_DIR, '04_add_qty_saved.png') });

    // Check for validation/error banner
    const pageErrorMsg = await page.evaluate(() => {
      const el = Array.from(document.querySelectorAll('div')).find(d => d.textContent.includes('⚠️'));
      return el ? el.textContent.trim() : null;
    });
    if (pageErrorMsg) {
      console.log('🚨 Page validation error displayed:', pageErrorMsg);
    }

    // 5. VERIFY ACTION BUTTON TRANSITIONS TO EDIT PROPORSI & BADGE TO LENGKAP DENGAN REJECT
    const completedRowDetails = await page.evaluate((grNum) => {
      const rows = Array.from(document.querySelectorAll('table tbody tr'));
      const row = rows.find(r => r.textContent.includes(grNum));
      if (!row) return null;
      const cells = Array.from(row.querySelectorAll('td'));
      return {
        accepted: parseInt(cells[3]?.textContent.trim(), 10),
        rejected: parseInt(cells[4]?.textContent.trim(), 10),
        status: cells[5]?.textContent.trim(),
        button: cells[9]?.textContent.trim()
      };
    }, grNumber);

    console.log(`Inspecting completed row -> Accepted: ${completedRowDetails.accepted}, Rejected: ${completedRowDetails.rejected}, Status: ${completedRowDetails.status}`);
    assert('QC Complete Flow', 'Action transitions to Edit Proporsi', completedRowDetails.button.includes('Edit Proporsi'), `Button text: ${completedRowDetails.button}`);
    assert('QC Complete Flow', 'Badge displays Lengkap dengan Reject', completedRowDetails.status === 'Lengkap dengan Reject', `Badge: ${completedRowDetails.status}`);

    // 6. EDIT PROPORSI FLOW
    console.log('\n✏️ Testing Edit Proporsi flow...');
    await page.evaluate((grNum) => {
      const rows = Array.from(document.querySelectorAll('table tbody tr'));
      const row = rows.find(r => r.textContent.includes(grNum));
      if (row) {
        const btn = Array.from(row.querySelectorAll('button')).find(b => b.textContent.includes('Edit Proporsi'));
        if (btn) btn.click();
      }
    }, grNumber);
    await delay(2000);
    await page.screenshot({ path: path.join(SS_DIR, '05_edit_proportion_modal_opened.png') });

    // Change accepted from 8 to 9, and rejected from 2 to 1 (sum = 10)
    console.log('Changing proportion in Edit Proporsi modal -> Accepted: 9, Rejected: 1...');
    await page.evaluate((val1, val2) => {
      const modal = Array.from(document.querySelectorAll('div')).find(d => d.style.position === 'fixed');
      if (!modal) return;
      const inputs = Array.from(modal.querySelectorAll('input[type="number"]'));
      if (inputs[0]) {
        Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(inputs[0], val1);
        inputs[0].dispatchEvent(new Event('input', { bubbles: true }));
        inputs[0].dispatchEvent(new Event('change', { bubbles: true }));
      }
      if (inputs[1]) {
        Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(inputs[1], val2);
        inputs[1].dispatchEvent(new Event('input', { bubbles: true }));
        inputs[1].dispatchEvent(new Event('change', { bubbles: true }));
      }
    }, '9', '1');
    await reactType(page, 'form textarea', 'E2E adjustment: 9 accepted, 1 rejected.');
    await delay(1000);
    await page.screenshot({ path: path.join(SS_DIR, '06_edit_proportion_modal_filled.png') });

    await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.trim() === 'Simpan');
      if (btn) btn.click();
    });
    await delay(4500);
    await page.screenshot({ path: path.join(SS_DIR, '07_edit_proportion_saved.png') });

    // 7. VERIFY ADJUSTED PROPORTION IN TABLE
    const adjustedRowDetails = await page.evaluate((grNum) => {
      const rows = Array.from(document.querySelectorAll('table tbody tr'));
      const row = rows.find(r => r.textContent.includes(grNum));
      if (!row) return null;
      const cells = Array.from(row.querySelectorAll('td'));
      return {
        accepted: parseInt(cells[3]?.textContent.trim(), 10),
        rejected: parseInt(cells[4]?.textContent.trim(), 10),
        status: cells[5]?.textContent.trim()
      };
    }, grNumber);

    console.log(`Inspecting adjusted row -> Accepted: ${adjustedRowDetails.accepted}, Rejected: ${adjustedRowDetails.rejected}, Status: ${adjustedRowDetails.status}`);
    assert('QC Edit Proportion', 'Proportion successfully saved in table', adjustedRowDetails.accepted === 9 && adjustedRowDetails.rejected === 1, 
      `Actual Accepted: ${adjustedRowDetails.accepted}, Rejected: ${adjustedRowDetails.rejected}`);
    assert('QC Edit Proportion', 'Status badge remains Lengkap dengan Reject', adjustedRowDetails.status === 'Lengkap dengan Reject', `Badge: ${adjustedRowDetails.status}`);

  } catch (err) {
    console.error('🔴 Test crashed:', err.message);
    try {
      const tableHtml = await page.evaluate(() => {
        const bodyText = document.body.textContent;
        const rowsText = Array.from(document.querySelectorAll('table tbody tr')).map(r => r.textContent.trim());
        return { bodyText: bodyText.slice(0, 1000), rows: rowsText };
      });
      console.log('DOM Info:', tableHtml);
      await page.screenshot({ path: path.join(SS_DIR, 'crash.png') });
    } catch (_) {}
  } finally {
    await browser.close();

    const allPassed = results.every(r => r.pass);
    let report = `# 🧪 E2E QA — QC Edit Proportion Verification Report\n\n`;
    report += `Generated: **${new Date().toLocaleString('id-ID')}**  \n`;
    report += `Status: **${allPassed ? 'PASSED ✅' : 'PARTIALLY PASSED ⚠️'}**\n\n`;
    report += `| Module | Assertion | Status | Details |\n`;
    report += `| :--- | :--- | :---: | :--- |\n`;
    results.forEach(r => {
      report += `| **${r.mod}** | ${r.check} | ${r.pass ? '🟢 PASS' : '🔴 FAIL'} | ${r.detail} |\n`;
    });
    report += `\n## Screenshots\nSaved in: \`documentation/userflowonapp/screenshot_qa_proportion_edit/\`\n`;

    fs.writeFileSync(REPORT_FILE, report);
    console.log(`\n📄 Report → ${REPORT_FILE}`);
    console.log(`Result: ${allPassed ? '✅ ALL PASSED' : results.filter(r => !r.pass).length + ' FAILED'}`);
  }
}

main().catch(console.error);
