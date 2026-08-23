const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const OUTPUT_DIR = path.join(__dirname, '..', 'poster_assets');

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

async function captureCleanScreens() {
  console.log('Launching browser with Edge...');
  const browser = await puppeteer.launch({
    executablePath: EDGE_PATH,
    headless: 'new',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--window-size=1200,1000'
    ]
  });

  try {
    const page = await browser.newPage();

    // ─────────────────────────────────────────────────────────────
    // Setup Cookie Consent & Pre-state
    // ─────────────────────────────────────────────────────────────
    await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded' });
    await page.evaluate(() => {
      localStorage.setItem('smartaccess_cookie_consent', 'true');
      localStorage.setItem('smartaccess_cookie_consent_v2', JSON.stringify({
        version: "2.0",
        timestamp: new Date().toISOString(),
        choices: { necessary: true, functional: true, analytics: true, marketing: false },
        action: "granted"
      }));
      sessionStorage.setItem('smartaccess_qr_verified_CE-401', String(Date.now()));
      sessionStorage.setItem('smartaccess_qr_verified_default', String(Date.now()));
    });

    // ─────────────────────────────────────────────────────────────
    // 1. Student Registration Screen (Mobile View - Dark Theme)
    // ─────────────────────────────────────────────────────────────
    console.log('Capturing: 01_student_registration_full.png');
    await page.setViewport({
      width: 412,
      height: 900,
      deviceScaleFactor: 3,
      isMobile: true,
      hasTouch: true
    });

    await page.goto('http://localhost:3000/?room=CE-401', { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 1000));

    // Fill the registration form
    await page.select('#student_title', 'นาย');
    await page.type('#student_first_name', 'ชานนท์', { delay: 20 });
    await page.type('#student_last_name', 'สุขสวัสดิ์', { delay: 20 });
    await page.type('#student_id', '076158050650-8', { delay: 20 });
    await page.select('#student_year', '3');
    await page.select('#student_faculty', 'ครุศาสตร์อุตสาหกรรม');
    await new Promise(r => setTimeout(r, 300));
    await page.select('#student_branch', 'วิศวกรรมคอมพิวเตอร์');
    await new Promise(r => setTimeout(r, 500));

    // Clean any overlays
    await page.evaluate(() => {
      document.querySelectorAll('[class*="nextjs-toast"], [id*="__next-build-watcher"], .cookie-banner').forEach(el => el.remove());
    });

    await page.screenshot({
      path: path.join(OUTPUT_DIR, '01_student_registration_full.png'),
      fullPage: false
    });

    // ─────────────────────────────────────────────────────────────
    // 2. Focused Crop of the Registration Form Card
    // ─────────────────────────────────────────────────────────────
    console.log('Capturing: 02_registration_card_focus.png');
    const formCard = await page.$('form');
    if (formCard) {
      await formCard.screenshot({
        path: path.join(OUTPUT_DIR, '02_registration_card_focus.png')
      });
    }

    // ─────────────────────────────────────────────────────────────
    // 3. Auto-Fill Feature Suggestion Card
    // ─────────────────────────────────────────────────────────────
    console.log('Capturing: 03_autofill_card_focus.png');
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
    await page.type('#student_id', '076158050650-8', { delay: 30 });
    await new Promise(r => setTimeout(r, 600));
    await page.evaluate(() => {
      document.querySelectorAll('[class*="nextjs-toast"], [id*="__next-build-watcher"], .cookie-banner').forEach(el => el.remove());
    });

    await page.screenshot({
      path: path.join(OUTPUT_DIR, '03_autofill_card_focus.png'),
      fullPage: false
    });

    // ─────────────────────────────────────────────────────────────
    // 4. ESP32 TFT 3.2" Screen (QR Code display)
    // ─────────────────────────────────────────────────────────────
    console.log('Capturing: 04_esp32_lcd_tft.png');
    // Log in admin first
    await page.setViewport({ width: 1000, height: 800, deviceScaleFactor: 3 });
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
      document.querySelectorAll('[class*="nextjs-toast"], [id*="__next-build-watcher"]').forEach(el => el.remove());
    });

    const tftLcd = await page.$('.premium-lcd, [style*="width: 320px"]');
    if (tftLcd) {
      await tftLcd.screenshot({
        path: path.join(OUTPUT_DIR, '04_esp32_lcd_tft.png')
      });
    }

    // ─────────────────────────────────────────────────────────────
    // 5. ESP32 Access Granted / Door Unlocked Screen
    // ─────────────────────────────────────────────────────────────
    console.log('Capturing: 05_esp32_unlocked_screen.png');
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const b = btns.find(x => x.textContent && x.textContent.includes('อนุมัติ'));
      if (b) b.click();
    });
    await new Promise(r => setTimeout(r, 800));

    const grantedLcd = await page.$('.premium-lcd, [style*="width: 320px"]');
    if (grantedLcd) {
      await grantedLcd.screenshot({
        path: path.join(OUTPUT_DIR, '05_esp32_unlocked_screen.png')
      });
    }

    console.log('All clean captures completed!');
  } catch (err) {
    console.error('Error during captureCleanScreens:', err);
  } finally {
    await browser.close();
  }
}

captureCleanScreens();
