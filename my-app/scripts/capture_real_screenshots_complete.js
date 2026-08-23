const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const OUTPUT_DIR = path.join(__dirname, '..', 'poster_assets');

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

async function captureEverything() {
  console.log('Launching browser with Edge...');
  const browser = await puppeteer.launch({
    executablePath: EDGE_PATH,
    headless: 'new',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--window-size=1400,1050'
    ]
  });

  try {
    const page = await browser.newPage();

    // ─────────────────────────────────────────────────────────────
    // STEP 1: Log in as admin to unlock esp32-preview and admin UI
    // ─────────────────────────────────────────────────────────────
    console.log('1. Logging in as Admin...');
    await page.setViewport({ width: 1200, height: 800, deviceScaleFactor: 2 });
    await page.goto('http://localhost:3000/admin/login', { waitUntil: 'networkidle0' });
    
    // Fill admin login
    const usernameInput = await page.$('input[type="text"], input[name="username"], #username');
    const passwordInput = await page.$('input[type="password"], input[name="password"], #password');
    if (usernameInput && passwordInput) {
      await usernameInput.type('admin');
      await passwordInput.type('admin123');
      const submitBtn = await page.$('button[type="submit"]');
      if (submitBtn) await submitBtn.click();
      await new Promise(r => setTimeout(r, 2000));
    }

    // ─────────────────────────────────────────────────────────────
    // STEP 2: Capture ESP32 LCD 3.2" Screen (QR Code display)
    // ─────────────────────────────────────────────────────────────
    console.log('2. Capturing ESP32 LCD screen...');
    await page.goto('http://localhost:3000/esp32-preview?room=CE-401', { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 2000));

    // Remove Next.js compiling indicators and cookie banner if any
    await page.evaluate(() => {
      document.querySelectorAll('[class*="nextjs-toast"], [id*="__next-build-watcher"], .cookie-banner').forEach(el => el.remove());
    });

    const lcdElement = await page.$('.premium-lcd, [style*="width: 320px"]');
    if (lcdElement) {
      await lcdElement.screenshot({
        path: path.join(OUTPUT_DIR, '01_esp32_qr_lcd.png')
      });
      console.log('Saved 01_esp32_qr_lcd.png');
    }

    // ─────────────────────────────────────────────────────────────
    // STEP 3: Student Registration Form (Mobile View - Dark Theme)
    // ─────────────────────────────────────────────────────────────
    console.log('3. Capturing Student Registration Form (Dark Theme)...');
    await page.setViewport({
      width: 412,
      height: 900,
      deviceScaleFactor: 3,
      isMobile: true,
      hasTouch: true
    });

    await page.goto('http://localhost:3000/?room=CE-401', { waitUntil: 'domcontentloaded' });
    
    // Set localStorage / sessionStorage state for clean student view
    await page.evaluate(() => {
      localStorage.setItem('smartaccess_theme', 'dark');
      localStorage.setItem('smartaccess_cookie_consent', 'true');
      localStorage.setItem('smartaccess_cookie_consent_v2', JSON.stringify({
        action: 'granted',
        timestamp: new Date().toISOString(),
        choices: { necessary: true, functional: true, analytics: true }
      }));
      sessionStorage.setItem('smartaccess_qr_verified_CE-401', String(Date.now()));
      sessionStorage.setItem('smartaccess_qr_verified_default', String(Date.now()));
    });

    await page.goto('http://localhost:3000/?room=CE-401', { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 1500));

    // Remove any dev/cookie overlay
    await page.evaluate(() => {
      document.querySelectorAll('[class*="nextjs-toast"], [id*="__next-build-watcher"], .cookie-banner, [style*="position: fixed"][style*="bottom: 0"]').forEach(el => el.remove());
    });

    // Fill the registration form
    await page.select('#student_title', 'นาย');
    await page.type('#student_first_name', 'ชานนท์', { delay: 30 });
    await page.type('#student_last_name', 'สุขสวัสดิ์', { delay: 30 });
    await page.type('#student_id', '076158050650-8', { delay: 30 });
    await page.select('#student_year', '3');
    await page.select('#student_faculty', 'ครุศาสตร์อุตสาหกรรม');
    await new Promise(r => setTimeout(r, 400));
    await page.select('#student_branch', 'วิศวกรรมคอมพิวเตอร์');
    await new Promise(r => setTimeout(r, 800));

    // Remove dev overlay again
    await page.evaluate(() => {
      document.querySelectorAll('[class*="nextjs-toast"], [id*="__next-build-watcher"]').forEach(el => el.remove());
    });

    // Full Mobile View (Dark)
    await page.screenshot({
      path: path.join(OUTPUT_DIR, '02_student_register_dark_mobile.png'),
      fullPage: false
    });
    console.log('Saved 02_student_register_dark_mobile.png');

    // Focused Crop of the Form Card
    const formCard = await page.$('.smartaccess-card, form, main > div');
    if (formCard) {
      await formCard.screenshot({
        path: path.join(OUTPUT_DIR, '03_registration_card_crop.png')
      });
      console.log('Saved 03_registration_card_crop.png');
    }

    // ─────────────────────────────────────────────────────────────
    // STEP 4: Student Registration Form (Mobile View - Light Theme)
    // ─────────────────────────────────────────────────────────────
    console.log('4. Capturing Student Registration Form (Light Theme)...');
    await page.evaluate(() => {
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light');
      localStorage.setItem('smartaccess_theme', 'light');
    });
    await new Promise(r => setTimeout(r, 500));
    await page.screenshot({
      path: path.join(OUTPUT_DIR, '04_student_register_light_mobile.png'),
      fullPage: false
    });
    console.log('Saved 04_student_register_light_mobile.png');

    // ─────────────────────────────────────────────────────────────
    // STEP 5: Auto-fill Prompt Feature Capture
    // ─────────────────────────────────────────────────────────────
    console.log('5. Capturing Auto-Fill Suggestion Banner...');
    await page.evaluate(() => {
      // Re-enable dark theme
      document.documentElement.classList.remove('light');
      document.documentElement.classList.add('dark');
      localStorage.setItem('smartaccess_theme', 'dark');

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
    await new Promise(r => setTimeout(r, 1000));

    // Type ID to trigger prompt
    await page.type('#student_id', '076158050650-8', { delay: 40 });
    await new Promise(r => setTimeout(r, 800));

    // Remove dev overlays
    await page.evaluate(() => {
      document.querySelectorAll('[class*="nextjs-toast"], [id*="__next-build-watcher"], .cookie-banner').forEach(el => el.remove());
    });

    await page.screenshot({
      path: path.join(OUTPUT_DIR, '05_autofill_prompt_card.png'),
      fullPage: false
    });
    console.log('Saved 05_autofill_prompt_card.png');

    // ─────────────────────────────────────────────────────────────
    // STEP 6: ESP32 Access Granted / Door Unlocked Screen
    // ─────────────────────────────────────────────────────────────
    console.log('6. Capturing ESP32 Door Unlocked Screen...');
    await page.setViewport({ width: 1000, height: 800, deviceScaleFactor: 2 });
    await page.goto('http://localhost:3000/esp32-preview?room=CE-401', { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 1000));

    // Click "จำลอง: อนุมัติ (ปลดล็อก)" button if available
    const approveButton = await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const b = btns.find(x => x.textContent && x.textContent.includes('อนุมัติ'));
      if (b) {
        b.click();
        return true;
      }
      return false;
    });

    if (approveButton) {
      await new Promise(r => setTimeout(r, 800));
      const grantedLcd = await page.$('.premium-lcd, [style*="width: 320px"]');
      if (grantedLcd) {
        await grantedLcd.screenshot({
          path: path.join(OUTPUT_DIR, '06_esp32_access_granted.png')
        });
        console.log('Saved 06_esp32_access_granted.png');
      }
    }

    console.log('=== All Captures Completed Successfully! ===');
  } catch (err) {
    console.error('Error during captureEverything:', err);
  } finally {
    await browser.close();
  }
}

captureEverything();
