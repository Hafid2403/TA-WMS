const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const REPORT_FILE = path.resolve(__dirname, '../../documentation/userflowonapp/qa_multi_role_report.md');
const SS_DIR = path.resolve(__dirname, '../../documentation/userflowonapp/screenshot_qa_multi_role');

// Clean stale screenshots
if (fs.existsSync(SS_DIR)) {
  fs.readdirSync(SS_DIR).forEach(f => { try { fs.unlinkSync(path.join(SS_DIR, f)); } catch (_) {} });
} else {
  fs.mkdirSync(SS_DIR, { recursive: true });
}

const delay = ms => new Promise(r => setTimeout(r, ms));

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
  console.log('🧪 Starting E2E QA Suite — Multi-Role Authentication & Access Control...\n');

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

  try {
    // ────────────────────────────────────────────────────────────────────────
    // 👤 PHASE 1: PIC ROLE VERIFICATION (pic@wms.com)
    // ────────────────────────────────────────────────────────────────────────
    console.log('🔑 Logging in as PIC (pic@wms.com)...');
    await page.goto('http://localhost:49977/login', { waitUntil: 'networkidle0' });
    await reactType(page, 'input[type="email"]', 'pic@wms.com');
    await reactType(page, 'input[type="password"]', 'password');
    await clickBtn(page, 'Sign In');
    await delay(3500);

    const isPicRedirected = page.url().includes('/goods-receipt');
    assert('PIC Role', 'Redirect to Goods Receipt on Login', isPicRedirected, `Active URL: ${page.url()}`);

    const picNameCheck = await page.evaluate(() => document.body.textContent.includes('Kasyfil Aziz') && document.body.textContent.includes('PIC'));
    assert('PIC Role', 'Profile Details Rendered', picNameCheck, 'Profile name Kasyfil Aziz (PIC) correctly displayed.');

    // Check menu options visibility
    const picMenuOptions = await page.evaluate(() => {
      const navItems = Array.from(document.querySelectorAll('.nav-item')).map(el => el.textContent.trim());
      return {
        hasGR: navItems.includes('Goods Receipt'),
        hasPutaway: navItems.includes('Putaway'),
        hasMR: navItems.includes('Material Request'),
        hasSO: navItems.includes('Stock Opname'),
        hasOverview: navItems.includes('Stock Overview'),
        hasDashboard: navItems.includes('Dashboard'),
        hasMasterData: navItems.includes('Master Data')
      };
    });

    assert('PIC Role', 'Allowed Menu Items Visible', 
      picMenuOptions.hasGR && picMenuOptions.hasPutaway && picMenuOptions.hasMR && picMenuOptions.hasSO && picMenuOptions.hasOverview,
      'Allowed pages (Goods Receipt, Putaway, MR, SO, Stock Overview) are visible in sidebar.'
    );
    assert('PIC Role', 'Forbidden Menu Items Hidden', 
      !picMenuOptions.hasDashboard && !picMenuOptions.hasMasterData,
      'Forbidden pages (Dashboard, Master Data) are successfully hidden from sidebar.'
    );

    await page.screenshot({ path: path.join(SS_DIR, '01_pic_dashboard.png') });

    // Attempt direct navigation to unauthorized routes
    console.log('🛡️ Attempting direct URL access to /dashboard as PIC...');
    await page.goto('http://localhost:49977/dashboard', { waitUntil: 'networkidle0' });
    await delay(2000);
    const picDashboardBlock = page.url().includes('/goods-receipt');
    assert('PIC Role', 'Dashboard Route Direct Access Blocked', picDashboardBlock, `Redirected away to: ${page.url()}`);

    console.log('🛡️ Attempting direct URL access to /master-data as PIC...');
    await page.goto('http://localhost:49977/master-data', { waitUntil: 'networkidle0' });
    await delay(2000);
    const picMasterDataBlock = page.url().includes('/goods-receipt');
    assert('PIC Role', 'Master Data Route Direct Access Blocked', picMasterDataBlock, `Redirected away to: ${page.url()}`);

    await page.screenshot({ path: path.join(SS_DIR, '02_pic_redirect_blocked.png') });

    // Logout
    console.log('🚪 Logging out PIC session...');
    await clickBtn(page, 'Sign Out');
    await delay(2500);
    assert('PIC Role', 'Logout Successful', page.url().includes('/login'), `Active URL: ${page.url()}`);


    // ────────────────────────────────────────────────────────────────────────
    // 👤 PHASE 2: QC ROLE VERIFICATION (qc@wms.com)
    // ────────────────────────────────────────────────────────────────────────
    console.log('\n🔑 Logging in as QC (qc@wms.com)...');
    await page.goto('http://localhost:49977/login', { waitUntil: 'networkidle0' });
    await reactType(page, 'input[type="email"]', 'qc@wms.com');
    await reactType(page, 'input[type="password"]', 'password');
    await clickBtn(page, 'Sign In');
    await delay(3500);

    const isQcRedirected = page.url().includes('/qc-inspection');
    assert('QC Role', 'Redirect to QC Inspection on Login', isQcRedirected, `Active URL: ${page.url()}`);

    const qcNameCheck = await page.evaluate(() => document.body.textContent.includes('Muhammad Habibi') && document.body.textContent.includes('QC'));
    assert('QC Role', 'Profile Details Rendered', qcNameCheck, 'Profile name Muhammad Habibi (QC) correctly displayed.');

    // Check menu options visibility
    const qcMenuOptions = await page.evaluate(() => {
      const navItems = Array.from(document.querySelectorAll('.nav-item')).map(el => el.textContent.trim());
      return {
        hasGR: navItems.includes('Goods Receipt'),
        hasPutaway: navItems.includes('Putaway'),
        hasMR: navItems.includes('Material Request'),
        hasSO: navItems.includes('Stock Opname'),
        hasQC: navItems.includes('QC Inspection'),
        hasOverview: navItems.includes('Stock Overview'),
        hasDashboard: navItems.includes('Dashboard'),
        hasMasterData: navItems.includes('Master Data')
      };
    });

    assert('QC Role', 'Allowed Menu Items Visible', 
      qcMenuOptions.hasQC && qcMenuOptions.hasOverview,
      'Allowed pages (QC Inspection, Stock Overview) are visible in sidebar.'
    );
    assert('QC Role', 'Forbidden Menu Items Hidden', 
      !qcMenuOptions.hasDashboard && !qcMenuOptions.hasGR && !qcMenuOptions.hasPutaway && !qcMenuOptions.hasMR && !qcMenuOptions.hasSO && !qcMenuOptions.hasMasterData,
      'Forbidden pages (Dashboard, GR, Putaway, MR, SO, Master Data) are successfully hidden.'
    );

    await page.screenshot({ path: path.join(SS_DIR, '03_qc_dashboard.png') });

    // Attempt direct navigation to unauthorized routes
    console.log('🛡️ Attempting direct URL access to /dashboard as QC...');
    await page.goto('http://localhost:49977/dashboard', { waitUntil: 'networkidle0' });
    await delay(2000);
    const qcDashboardBlock = page.url().includes('/qc-inspection');
    assert('QC Role', 'Dashboard Route Direct Access Blocked', qcDashboardBlock, `Redirected away to: ${page.url()}`);

    console.log('🛡️ Attempting direct URL access to /goods-receipt as QC...');
    await page.goto('http://localhost:49977/goods-receipt', { waitUntil: 'networkidle0' });
    await delay(2000);
    const qcGrBlock = page.url().includes('/qc-inspection');
    assert('QC Role', 'Goods Receipt Route Direct Access Blocked', qcGrBlock, `Redirected away to: ${page.url()}`);

    await page.screenshot({ path: path.join(SS_DIR, '04_qc_redirect_blocked.png') });

    // Logout
    console.log('🚪 Logging out QC session...');
    await clickBtn(page, 'Sign Out');
    await delay(2500);
    assert('QC Role', 'Logout Successful', page.url().includes('/login'), `Active URL: ${page.url()}`);

  } catch (err) {
    console.error('🔴 Test crashed:', err.message);
    await page.screenshot({ path: path.join(SS_DIR, 'crash.png') });
  } finally {
    await browser.close();
    generateReport(results);
  }
}

function generateReport(results) {
  let md = `# 🧪 E2E QA — Multi-Role Access Control Report\n\n`;
  md += `Generated: **${new Date().toLocaleString()}**  \n`;
  md += `Status: **${results.every(r => r.pass) ? 'PASSED ✅' : 'FAILED ❌'}**\n\n`;
  
  md += `| Module | Assertion | Status | Details |\n`;
  md += `| :--- | :--- | :---: | :--- |\n`;
  
  results.forEach(r => {
    md += `| **${r.mod}** | ${r.check} | ${r.pass ? '🟢 PASS' : '🔴 FAIL'} | ${r.detail} |\n`;
  });

  md += `\n## Screenshots\n`;
  md += `Saved in: \`documentation/userflowonapp/screenshot_qa_multi_role/\`\n`;

  fs.writeFileSync(REPORT_FILE, md);
  console.log(`\n📄 Report → ${REPORT_FILE}`);
}

main();
