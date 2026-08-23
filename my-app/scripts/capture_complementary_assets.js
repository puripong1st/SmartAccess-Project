const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const ASSETS_DIR = path.join(__dirname, '..', 'poster_assets');

async function captureComplementaryAssets() {
  const browser = await puppeteer.launch({
    executablePath: EDGE_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu', '--window-size=1280,1200']
  });

  try {
    const page = await browser.newPage();
    
    // ─────────────────────────────────────────────────────────────
    // 1. Mobile screen showing bottom submit button
    // ─────────────────────────────────────────────────────────────
    await page.setViewport({ width: 412, height: 940, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
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
    await page.select('#student_title', 'นาย');
    await page.type('#student_first_name', 'ชานนท์');
    await page.type('#student_last_name', 'สุขสวัสดิ์');
    await page.type('#student_id', '076158050650-8');
    await page.select('#student_year', '3');
    await page.select('#student_faculty', 'คณะครุศาสตร์อุตสาหกรรม');
    await new Promise(r => setTimeout(r, 400));
    await page.select('#student_branch', 'คอมพิวเตอร์และเทคโนโลยีสารสนเทศ');
    await new Promise(r => setTimeout(r, 400));

    // Scroll down to see full submit button
    await page.evaluate(() => {
      window.scrollTo({ top: 260, behavior: 'instant' });
      document.querySelectorAll('[class*="nextjs-toast"], [id*="__next-build-watcher"], .cookie-banner, nextjs-portal').forEach(el => el.remove());
    });
    await new Promise(r => setTimeout(r, 400));
    await page.screenshot({ path: path.join(ASSETS_DIR, 'screen_submit_button_focus.png'), fullPage: false });

    // ─────────────────────────────────────────────────────────────
    // 2. Auto-Fill Prompt Card Focus
    // ─────────────────────────────────────────────────────────────
    await page.evaluate(() => {
      const history = [{
        student_id: '076158050650-8',
        first_name: 'ชานนท์',
        last_name: 'สุขสวัสดิ์',
        title: 'นาย',
        year: '3',
        faculty: 'คณะครุศาสตร์อุตสาหกรรม',
        branch: 'คอมพิวเตอร์และเทคโนโลยีสารสนเทศ'
      }];
      localStorage.setItem('smartaccess_history', JSON.stringify(history));
    });
    await page.goto('http://localhost:3000/?room=CE-401', { waitUntil: 'networkidle0' });
    await page.evaluate(() => {
      // simulate prompt directly in DOM for crisp capture if needed or trigger input
      const container = document.querySelector('form');
      if (container) {
        const promptEl = document.createElement('div');
        promptEl.id = 'demo-autofill-prompt';
        promptEl.style.cssText = `
          margin-bottom: 18px;
          padding: 14px 16px;
          background: linear-gradient(135deg, rgba(124,58,237,0.18) 0%, rgba(219,39,119,0.12) 100%);
          border: 1.5px dashed #A855F7;
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          box-shadow: 0 4px 20px rgba(124,58,237,0.15);
        `;
        promptEl.innerHTML = `
          <div style="display: flex; align-items: center; gap: 10px;">
            <div style="width: 36px; height: 36px; border-radius: 50%; background: rgba(124,58,237,0.25); display: flex; align-items: center; justify-content: center; color: #C084FC; font-size: 18px; font-weight: bold;">🎓</div>
            <div style="text-align: left;">
              <div style="font-size: 13px; font-weight: 800; color: #E9D5FF;">พบประวัติการใช้ห้องเดิมของคุณ!</div>
              <div style="font-size: 11px; color: #94A3B8; margin-top: 2px;">ปี 3 | คณะครุศาสตร์อุตสาหกรรม | คอมพิวเตอร์...</div>
            </div>
          </div>
          <button type="button" style="background: linear-gradient(135deg, #7C3AED, #9333EA); color: #FFFFFF; border: none; padding: 8px 14px; border-radius: 10px; font-size: 12px; font-weight: 700; cursor: pointer; box-shadow: 0 4px 12px rgba(124,58,237,0.4);">
            ดึงข้อมูลอัตโนมัติ ⚡
          </button>
        `;
        const idRow = document.querySelector('#student_id')?.parentElement;
        if (idRow && idRow.nextSibling) {
          container.insertBefore(promptEl, idRow.nextSibling);
        }
      }
      document.querySelectorAll('[class*="nextjs-toast"], [id*="__next-build-watcher"], .cookie-banner, nextjs-portal').forEach(el => el.remove());
    });
    await new Promise(r => setTimeout(r, 400));
    await page.screenshot({ path: path.join(ASSETS_DIR, 'screen_autofill_custom.png'), fullPage: false });

    // ─────────────────────────────────────────────────────────────
    // 3. ESP32 Screen Rendering
    // ─────────────────────────────────────────────────────────────
    await page.setViewport({ width: 800, height: 600, deviceScaleFactor: 3 });
    // Render the exact HTML of the simulated ESP32 TFT screen
    const htmlESP32Idle = `
      <!DOCTYPE html>
      <html>
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Kanit:wght@400;600;800&family=JetBrains+Mono:wght@700&display=swap" rel="stylesheet">
        <style>
          * { box-sizing: border-box; margin: 0; padding: 0; font-family: 'Kanit', sans-serif; }
          body { background: #000; display: flex; align-items: center; justify-content: center; height: 100vh; }
          .tft { width: 360px; height: 260px; background: #06070D; border: 2px solid #1E293B; border-radius: 10px; overflow: hidden; display: flex; flex-direction: column; box-shadow: 0 10px 30px rgba(0,0,0,0.8); }
          .bar-top { background: #0E111C; padding: 6px 12px; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(255,255,255,0.08); }
          .bar-top .title { color: #E2E8F0; font-size: 11px; font-weight: 800; letter-spacing: 1px; }
          .bar-top .badge { font-size: 9px; padding: 2px 6px; background: rgba(16,185,129,0.2); color: #10B981; border-radius: 4px; font-weight: 700; }
          .bar-top .time { color: #10B981; font-size: 11px; font-weight: 700; font-family: 'JetBrains Mono', monospace; }
          .content { flex: 1; display: flex; align-items: center; padding: 12px 14px; gap: 14px; }
          .qr-box { width: 130px; height: 130px; background: #FFF; padding: 6px; border-radius: 8px; border: 3px solid #10B981; box-shadow: 0 0 18px rgba(16,185,129,0.3); display: flex; align-items: center; justify-content: center; }
          .qr-box img { width: 100%; height: 100%; object-fit: contain; }
          .info { flex: 1; text-align: left; }
          .room-label { color: #94A3B8; font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; }
          .room-name { color: #38BDF8; font-size: 20px; font-weight: 800; line-height: 1.1; margin-top: 2px; }
          .room-sub { color: #CBD5E1; font-size: 11px; margin-top: 3px; }
          .action-box { margin-top: 10px; background: rgba(59,130,246,0.15); border: 1px solid rgba(59,130,246,0.3); border-radius: 6px; padding: 4px 8px; color: #93C5FD; font-size: 10px; font-weight: 600; display: inline-flex; align-items: center; gap: 4px; }
          .bar-btm { background: #0A0B10; padding: 6px 12px; display: flex; justify-content: space-between; align-items: center; border-top: 1px solid rgba(255,255,255,0.06); }
          .bar-btm span { color: #64748B; font-size: 9px; }
          .bar-btm .ip { color: #10B981; font-family: 'JetBrains Mono', monospace; }
        </style>
      </head>
      <body>
        <div class="tft">
          <div class="bar-top">
            <div style="display: flex; align-items: center; gap: 6px;">
              <span class="title">SmartAccess DOOR</span>
              <span class="badge">ONLINE</span>
            </div>
            <span class="time">● 14:30:15</span>
          </div>
          <div class="content">
            <div class="qr-box">
              <img src="https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=http://192.168.1.41:3000/?room=CE-401&scan=sample_token_8892" alt="QR">
            </div>
            <div class="info">
              <div class="room-label">ห้องปฏิบัติการ</div>
              <div class="room-name">CE-401</div>
              <div class="room-sub">ห้องปฏิบัติการคอมพิวเตอร์</div>
              <div class="action-box">
                <span>📱 สแกน QR เพื่อขอเปิดประตู</span>
              </div>
            </div>
          </div>
          <div class="bar-btm">
            <span>คณะครุศาสตร์อุตสาหกรรม มทร.พระนคร</span>
            <span class="ip">IP: 192.168.2.49</span>
          </div>
        </div>
      </body>
      </html>
    `;
    await page.setContent(htmlESP32Idle, { waitUntil: 'networkidle0' });
    const tftEl = await page.$('.tft');
    if (tftEl) {
      await tftEl.screenshot({ path: path.join(ASSETS_DIR, 'screen_esp32_device_tft.png') });
      console.log('Saved: screen_esp32_device_tft.png');
    }

    // ─────────────────────────────────────────────────────────────
    // 4. Access Granted / Door Unlocked TFT Screen
    // ─────────────────────────────────────────────────────────────
    const htmlESP32Approved = `
      <!DOCTYPE html>
      <html>
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Kanit:wght@400;600;800;900&family=JetBrains+Mono:wght@700&display=swap" rel="stylesheet">
        <style>
          * { box-sizing: border-box; margin: 0; padding: 0; font-family: 'Kanit', sans-serif; }
          body { background: #000; display: flex; align-items: center; justify-content: center; height: 100vh; }
          .tft { width: 360px; height: 260px; background: #031208; border: 2px solid #059669; border-radius: 10px; overflow: hidden; display: flex; flex-direction: column; align-items: center; justify-content: center; position: relative; box-shadow: 0 0 40px rgba(16,185,129,0.3); }
          .icon-circle { width: 68px; height: 68px; border-radius: 50%; background: #064E3B; border: 3px solid #10B981; display: flex; align-items: center; justify-content: center; color: #10B981; font-size: 34px; box-shadow: 0 0 25px rgba(16,185,129,0.5); margin-bottom: 10px; }
          .status-title { color: #10B981; font-size: 22px; font-weight: 900; letter-spacing: 1px; text-shadow: 0 0 10px rgba(16,185,129,0.6); }
          .status-sub { color: #FCD34D; font-size: 14px; font-weight: 800; margin-top: 2px; }
          .user-badge { margin-top: 8px; background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.12); padding: 4px 16px; border-radius: 20px; color: #FFF; font-size: 13px; font-weight: 700; }
          .id-tag { color: #94A3B8; font-size: 10px; margin-top: 4px; font-family: 'JetBrains Mono', monospace; }
          .progress { position: absolute; bottom: 0; left: 0; right: 0; height: 5px; background: #064E3B; }
          .progress-bar { height: 100%; background: #10B981; width: 100%; box-shadow: 0 0 10px #10B981; }
        </style>
      </head>
      <body>
        <div class="tft">
          <div class="icon-circle">✓</div>
          <div class="status-title">ACCESS GRANTED</div>
          <div class="status-sub">🔓 DOOR UNLOCKED (ปลดล็อกแล้ว)</div>
          <div class="user-badge">นายชานนท์ สุขสวัสดิ์</div>
          <div class="id-tag">076158050650-8 • CE-401</div>
          <div class="progress"><div class="progress-bar"></div></div>
        </div>
      </body>
      </html>
    `;
    await page.setContent(htmlESP32Approved, { waitUntil: 'networkidle0' });
    const tftApproved = await page.$('.tft');
    if (tftApproved) {
      await tftApproved.screenshot({ path: path.join(ASSETS_DIR, 'screen_esp32_approved_tft.png') });
      console.log('Saved: screen_esp32_approved_tft.png');
    }

    console.log('=== All complementary assets saved! ===');
  } catch (err) {
    console.error(err);
  } finally {
    await browser.close();
  }
}

captureComplementaryAssets();
