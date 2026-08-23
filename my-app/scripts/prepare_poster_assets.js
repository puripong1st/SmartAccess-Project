const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const ASSETS_DIR = path.join(__dirname, '..', 'poster_assets');

if (!fs.existsSync(ASSETS_DIR)) {
  fs.mkdirSync(ASSETS_DIR, { recursive: true });
}

async function prepareAssets() {
  console.log('Generating crisp poster screenshots from real project...');
  const browser = await puppeteer.launch({
    executablePath: EDGE_PATH,
    headless: 'new',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-gpu',
      '--window-size=1280,1200'
    ]
  });

  try {
    const page = await browser.newPage();

    // ─────────────────────────────────────────────────────────────
    // 1. Mobile Registration Screenshot (Full Phone View)
    // ─────────────────────────────────────────────────────────────
    await page.setViewport({
      width: 412,
      height: 870,
      deviceScaleFactor: 3,
      isMobile: true,
      hasTouch: true
    });

    await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded' });
    await page.evaluate(() => {
      localStorage.setItem('smartaccess_theme', 'dark');
      localStorage.setItem('smartaccess_cookie_consent_v2', JSON.stringify({
        version: "2.0",
        timestamp: new Date().toISOString(),
        choices: { necessary: true, functional: true, analytics: true, marketing: false },
        action: "granted"
      }));
      sessionStorage.setItem('smartaccess_qr_verified_CE-401', String(Date.now()));
    });

    await page.goto('http://localhost:3000/?room=CE-401', { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 1200));

    // Fill form
    await page.select('#student_title', 'นาย');
    await page.type('#student_first_name', 'ชานนท์', { delay: 15 });
    await page.type('#student_last_name', 'สุขสวัสดิ์', { delay: 15 });
    await page.type('#student_id', '076158050650-8', { delay: 15 });
    await page.select('#student_year', '3');
    await page.select('#student_faculty', 'ครุศาสตร์อุตสาหกรรม');
    await new Promise(r => setTimeout(r, 300));
    await page.select('#student_branch', 'วิศวกรรมคอมพิวเตอร์');
    await new Promise(r => setTimeout(r, 500));

    // Remove dev overlays and cookie banners
    await page.evaluate(() => {
      document.querySelectorAll('[class*="nextjs-toast"], [id*="__next-build-watcher"], .cookie-banner, nextjs-portal').forEach(el => el.remove());
    });

    await page.screenshot({
      path: path.join(ASSETS_DIR, 'screen_mobile_form.png'),
      fullPage: false
    });
    console.log('Saved: screen_mobile_form.png');

    // Also capture scrolled version showing the gradient submit button
    await page.evaluate(() => {
      window.scrollTo({ top: 220, behavior: 'instant' });
      document.querySelectorAll('[class*="nextjs-toast"], [id*="__next-build-watcher"], .cookie-banner, nextjs-portal').forEach(el => el.remove());
    });
    await new Promise(r => setTimeout(r, 400));
    await page.screenshot({
      path: path.join(ASSETS_DIR, 'screen_mobile_form_submit.png'),
      fullPage: false
    });
    console.log('Saved: screen_mobile_form_submit.png');

    // ─────────────────────────────────────────────────────────────
    // 2. Focused Registration Form Input Card (High Res Crop)
    // ─────────────────────────────────────────────────────────────
    await page.evaluate(() => {
      window.scrollTo({ top: 0, behavior: 'instant' });
    });
    await new Promise(r => setTimeout(r, 300));
    
    // Zoom slightly into form fields
    const formCard = await page.$('.smartaccess-card, form, main > div > div:nth-child(2)');
    if (formCard) {
      await formCard.screenshot({
        path: path.join(ASSETS_DIR, 'screen_form_inputs_crop.png')
      });
      console.log('Saved: screen_form_inputs_crop.png');
    }

    // ─────────────────────────────────────────────────────────────
    // 3. Auto-Fill Badge Feature Capture
    // ─────────────────────────────────────────────────────────────
    await page.evaluate(() => {
      const history = [{
        student_id: '076158050650-8',
        first_name: 'ชานนท์',
        last_name: 'สุขสวัสดิ์',
        title: 'นาย',
        year: '3',
        faculty: 'ครุศาสตร์อุตสาหกรรม',
        branch: 'วิศวกรรมคอมพิวเตอร์'
      }];
      localStorage.setItem('smartaccess_history', JSON.stringify(history));
    });
    await page.goto('http://localhost:3000/?room=CE-401', { waitUntil: 'networkidle0' });
    await page.type('#student_id', '076158050650-8', { delay: 20 });
    await new Promise(r => setTimeout(r, 500));
    await page.evaluate(() => {
      document.querySelectorAll('[class*="nextjs-toast"], [id*="__next-build-watcher"], .cookie-banner, nextjs-portal').forEach(el => el.remove());
    });
    await page.screenshot({
      path: path.join(ASSETS_DIR, 'screen_autofill_badge.png'),
      fullPage: false
    });
    console.log('Saved: screen_autofill_badge.png');

    // ─────────────────────────────────────────────────────────────
    // 4. ESP32 TFT 3.2" Screen (QR Code & Door Unlock)
    // ─────────────────────────────────────────────────────────────
    await page.setViewport({ width: 1200, height: 900, deviceScaleFactor: 3 });
    await page.goto('http://localhost:3000/admin/login', { waitUntil: 'networkidle0' });
    const userIn = await page.$('#username, input[type="text"]');
    const passIn = await page.$('#password, input[type="password"]');
    if (userIn && passIn) {
      await userIn.type('admin');
      await passIn.type('admin123');
      const submitBtn = await page.$('button[type="submit"]');
      if (submitBtn) await submitBtn.click();
      await new Promise(r => setTimeout(r, 1500));
    }

    await page.goto('http://localhost:3000/esp32-preview?room=CE-401', { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 1500));

    await page.evaluate(() => {
      document.querySelectorAll('[class*="nextjs-toast"], [id*="__next-build-watcher"], nextjs-portal').forEach(el => el.remove());
    });

    const tftLcd = await page.$('.premium-lcd, [style*="width: 320px"]');
    if (tftLcd) {
      await tftLcd.screenshot({
        path: path.join(ASSETS_DIR, 'screen_esp32_qr.png')
      });
      console.log('Saved: screen_esp32_qr.png');
    }

    // Trigger door unlock state on LCD
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const b = btns.find(x => x.textContent && x.textContent.includes('อนุมัติ'));
      if (b) b.click();
    });
    await new Promise(r => setTimeout(r, 800));

    const grantedLcd = await page.$('.premium-lcd, [style*="width: 320px"]');
    if (grantedLcd) {
      await grantedLcd.screenshot({
        path: path.join(ASSETS_DIR, 'screen_esp32_unlocked.png')
      });
      console.log('Saved: screen_esp32_unlocked.png');
    }

    console.log('=== All poster assets prepared successfully! ===');
  } catch (err) {
    console.error('Error preparing poster assets:', err);
  } finally {
    await browser.close();
  }
}

prepareAssets();
