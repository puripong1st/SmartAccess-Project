const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const OUTPUT_DIR = path.join(__dirname, '..', 'poster_assets');

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

async function captureAll() {
  console.log('Launching browser with Edge executable...');
  const browser = await puppeteer.launch({
    executablePath: EDGE_PATH,
    headless: 'new',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--window-size=1280,1024'
    ]
  });

  try {
    const page = await browser.newPage();
    
    // Set mobile viewport for student registration screen (High-DPI Retina 3x scale)
    await page.setViewport({
      width: 412,
      height: 892,
      deviceScaleFactor: 3,
      isMobile: true,
      hasTouch: true
    });

    // 1. First visit to set cookie consent & verify token in storage
    await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded' });
    await page.evaluate(() => {
      localStorage.setItem('smartaccess_cookie_consent', 'true');
      localStorage.setItem('smartaccess_cookie_consent_v2', JSON.stringify({
        action: 'granted',
        timestamp: new Date().toISOString(),
        choices: { necessary: true, functional: true, analytics: true }
      }));
      // Set returning history for auto-fill demonstration
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
      sessionStorage.setItem('smartaccess_qr_verified_CE-401', String(Date.now()));
      sessionStorage.setItem('smartaccess_qr_verified_default', String(Date.now()));
    });

    // 2. Navigate to Registration form
    await page.goto('http://localhost:3000/?room=CE-401', { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 1500));

    // Hide any remaining cookie banner if present
    await page.evaluate(() => {
      const banner = document.querySelector('.cookie-banner, [style*="position: fixed"][style*="bottom: 0"]');
      if (banner && banner.parentElement) {
        banner.remove();
      }
    });

    // Screen 1: Empty Form
    console.log('Capturing: 01_registration_empty.png');
    await page.screenshot({
      path: path.join(OUTPUT_DIR, '01_registration_empty.png'),
      fullPage: false
    });

    // Fill form with student details
    console.log('Filling form...');
    await page.select('#student_title', 'นาย');
    await page.type('#student_first_name', 'ชานนท์', { delay: 40 });
    await page.type('#student_last_name', 'สุขสวัสดิ์', { delay: 40 });
    await page.type('#student_id', '076158050650-8', { delay: 40 });
    await page.select('#student_year', '3');
    await page.select('#student_faculty', 'ครุศาสตร์อุตสาหกรรม');
    await new Promise(r => setTimeout(r, 400));
    await page.select('#student_branch', 'วิศวกรรมคอมพิวเตอร์');
    await new Promise(r => setTimeout(r, 800));

    // Screen 2: Clean Filled Form (Full Mobile Screen)
    console.log('Capturing: 02_registration_filled_mobile.png');
    await page.screenshot({
      path: path.join(OUTPUT_DIR, '02_registration_filled_mobile.png'),
      fullPage: false
    });

    // Screen 3: Close-up on the form fields (Name, ID, Faculty, Branch)
    console.log('Capturing: 03_form_fields_detail.png');
    const formElement = await page.$('form');
    if (formElement) {
      await formElement.screenshot({
        path: path.join(OUTPUT_DIR, '03_form_fields_detail.png')
      });
    }

    // Screen 4: Auto-Fill badge popup preview
    console.log('Capturing Auto-fill suggestion...');
    await page.evaluate(() => {
      // Clear inputs except ID to trigger auto-fill suggestion box
      const fName = document.getElementById('student_first_name');
      const lName = document.getElementById('student_last_name');
      if (fName) { fName.value = ''; fName.dispatchEvent(new Event('input', { bubbles: true })); }
      if (lName) { lName.value = ''; lName.dispatchEvent(new Event('input', { bubbles: true })); }
    });
    await new Promise(r => setTimeout(r, 600));
    await page.screenshot({
      path: path.join(OUTPUT_DIR, '04_autofill_prompt.png'),
      fullPage: false
    });

    // Screen 5: Capture ESP32 LCD Screen Preview
    console.log('Capturing ESP32 LCD preview...');
    await page.goto('http://localhost:3000/esp32-preview?room=CE-401', { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 1500));
    
    // Capture the ESP32 LCD device container
    const esp32Screen = await page.$('.lcd-screen, .esp32-container, main > div');
    if (esp32Screen) {
      await esp32Screen.screenshot({
        path: path.join(OUTPUT_DIR, '05_esp32_lcd_screen.png')
      });
    } else {
      await page.screenshot({
        path: path.join(OUTPUT_DIR, '05_esp32_lcd_screen.png'),
        fullPage: false
      });
    }

    // Screen 6: Light Mode Registration
    console.log('Capturing Light Mode Registration Form...');
    await page.goto('http://localhost:3000/?room=CE-401', { waitUntil: 'networkidle0' });
    await page.evaluate(() => {
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light');
      localStorage.setItem('smartaccess_theme', 'light');
    });
    await page.select('#student_title', 'นาย');
    await page.type('#student_first_name', 'ชานนท์', { delay: 30 });
    await page.type('#student_last_name', 'สุขสวัสดิ์', { delay: 30 });
    await page.type('#student_id', '076158050650-8', { delay: 30 });
    await page.select('#student_year', '3');
    await page.select('#student_faculty', 'ครุศาสตร์อุตสาหกรรม');
    await new Promise(r => setTimeout(r, 400));
    await page.select('#student_branch', 'วิศวกรรมคอมพิวเตอร์');
    await new Promise(r => setTimeout(r, 800));

    await page.screenshot({
      path: path.join(OUTPUT_DIR, '06_registration_light_mode.png'),
      fullPage: false
    });

    console.log('All real project screenshots captured successfully!');
  } catch (err) {
    console.error('Error during captureAll:', err);
  } finally {
    await browser.close();
  }
}

captureAll();
