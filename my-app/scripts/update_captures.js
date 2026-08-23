const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const ASSETS_DIR = path.join(__dirname, '..', 'poster_assets');

async function updateCaptures() {
  console.log('Capturing fully populated registration screen...');
  const browser = await puppeteer.launch({
    executablePath: EDGE_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu', '--window-size=1280,1200']
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({
      width: 412,
      height: 940,
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
    await new Promise(r => setTimeout(r, 1000));

    // Fill all inputs with exact faculties
    await page.select('#student_title', 'นาย');
    await page.type('#student_first_name', 'ชานนท์', { delay: 10 });
    await page.type('#student_last_name', 'สุขสวัสดิ์', { delay: 10 });
    await page.type('#student_id', '076158050650-8', { delay: 10 });
    await page.select('#student_year', '3');
    await page.select('#student_faculty', 'คณะครุศาสตร์อุตสาหกรรม');
    
    // Wait for branch options to populate
    await page.waitForFunction(() => {
      const select = document.querySelector('#student_branch');
      return select && select.options.length > 1;
    }, { timeout: 3000 });

    await page.select('#student_branch', 'คอมพิวเตอร์และเทคโนโลยีสารสนเทศ');
    await new Promise(r => setTimeout(r, 600));

    // Remove dev overlays and cookie banners
    await page.evaluate(() => {
      document.querySelectorAll('[class*="nextjs-toast"], [id*="__next-build-watcher"], .cookie-banner, nextjs-portal').forEach(el => el.remove());
    });

    // Capture Full Mobile Screen
    await page.screenshot({
      path: path.join(ASSETS_DIR, 'screen_mobile_form_perfect.png'),
      fullPage: false
    });
    console.log('Saved: screen_mobile_form_perfect.png');

    // Capture Form Card directly
    const card = await page.$('.smartaccess-card, form, main > div');
    if (card) {
      await card.screenshot({
        path: path.join(ASSETS_DIR, 'screen_card_perfect.png')
      });
      console.log('Saved: screen_card_perfect.png');
    }

  } catch (e) {
    console.error(e);
  } finally {
    await browser.close();
  }
}

updateCaptures();
