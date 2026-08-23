const puppeteer = require('puppeteer-core');
const QRCode = require('qrcode');
const path = require('path');
const fs = require('fs');

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const ASSETS_DIR = path.join(__dirname, '..', 'poster_assets');
const ROOT_DIR = path.join(__dirname, '..');

function toBase64(filename) {
  const filePath = path.join(ASSETS_DIR, filename);
  if (!fs.existsSync(filePath)) return '';
  const ext = path.extname(filename).replace('.', '');
  const data = fs.readFileSync(filePath).toString('base64');
  return `data:image/${ext};base64,${data}`;
}

async function buildUltimatePoster() {
  console.log('Generating real dynamic QR code data URI...');
  const qrDataUri = await QRCode.toDataURL('http://192.168.1.41:3000/?room=CE-401&scan=AUTH_TOKEN_77492', {
    width: 300,
    margin: 1,
    color: { dark: '#000000', light: '#FFFFFF' }
  });

  const imgMobileForm = toBase64('screen_mobile_form_perfect.png');

  console.log('Building Perfectly Proportioned A4 Poster HTML...');
  const html = `<!DOCTYPE html>
<html lang="th">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>SmartAccess — โปสเตอร์แนะนำวิธีการใช้งานระบบควบคุมประตูอัจฉริยะ (A4)</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Kanit:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,400&family=Plus+Jakarta+Sans:wght@600;700;800&family=Prompt:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@600;700;800&display=swap" rel="stylesheet">
  <style>
    @page {
      size: A4 portrait;
      margin: 0;
    }
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    html, body {
      width: 210mm;
      height: 297mm;
      margin: 0 auto;
      padding: 0;
      background: #06070E;
      font-family: 'Prompt', 'Kanit', sans-serif;
      color: #FFFFFF;
      overflow: hidden;
      -webkit-font-smoothing: antialiased;
    }

    .poster-page {
      width: 210mm;
      height: 297mm;
      position: relative;
      background: radial-gradient(130% 90% at 50% -10%, #1E1338 0%, #0D1024 40%, #06070E 90%);
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      padding: 7mm 10mm 6.5mm 10mm;
      overflow: hidden;
    }

    /* Ambient Lighting */
    .glow-violet {
      position: absolute;
      top: -30mm;
      left: -30mm;
      width: 140mm;
      height: 140mm;
      background: radial-gradient(circle, rgba(124, 58, 237, 0.38) 0%, rgba(124, 58, 237, 0) 70%);
      pointer-events: none;
    }
    .glow-pink {
      position: absolute;
      top: -20mm;
      right: -30mm;
      width: 130mm;
      height: 130mm;
      background: radial-gradient(circle, rgba(219, 39, 119, 0.3) 0%, rgba(219, 39, 119, 0) 70%);
      pointer-events: none;
    }
    .glow-emerald {
      position: absolute;
      bottom: -30mm;
      right: -30mm;
      width: 130mm;
      height: 130mm;
      background: radial-gradient(circle, rgba(16, 185, 129, 0.22) 0%, rgba(16, 185, 129, 0) 70%);
      pointer-events: none;
    }
    .grid-lines {
      position: absolute;
      inset: 0;
      background-image: linear-gradient(rgba(255, 255, 255, 0.025) 1px, transparent 1px),
                        linear-gradient(90deg, rgba(255, 255, 255, 0.025) 1px, transparent 1px);
      background-size: 10mm 10mm;
      pointer-events: none;
    }

    /* ─── HEADER ─── */
    .header {
      position: relative;
      z-index: 10;
      border-bottom: 1.5px solid rgba(255, 255, 255, 0.1);
      padding-bottom: 2.8mm;
    }
    .univ-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.8mm;
    }
    .univ-title-group {
      display: flex;
      align-items: center;
      gap: 2.2mm;
    }
    .univ-tag-badge {
      background: linear-gradient(135deg, #7C3AED, #DB2777);
      color: #FFFFFF;
      font-size: 2.9mm;
      font-weight: 800;
      padding: 0.7mm 2.8mm;
      border-radius: 4mm;
      letter-spacing: 0.3px;
      box-shadow: 0 2px 8px rgba(124, 58, 237, 0.4);
    }
    .univ-name-text {
      font-size: 3.2mm;
      font-weight: 700;
      color: #E2E8F0;
    }
    .system-status-badge {
      background: rgba(16, 185, 129, 0.15);
      border: 1px solid rgba(16, 185, 129, 0.4);
      color: #34D399;
      font-size: 2.7mm;
      font-weight: 700;
      padding: 0.7mm 2.8mm;
      border-radius: 4mm;
      display: flex;
      align-items: center;
      gap: 1.6mm;
    }
    .status-dot {
      width: 1.8mm;
      height: 1.8mm;
      background: #10B981;
      border-radius: 50%;
      box-shadow: 0 0 5px #10B981;
    }

    .main-hero-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 4mm;
    }
    .logo-hero {
      display: flex;
      align-items: center;
      gap: 3.5mm;
    }
    .logo-icon-box {
      width: 12.5mm;
      height: 12.5mm;
      background: linear-gradient(135deg, #7C3AED 0%, #DB2777 100%);
      border-radius: 3.2mm;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 18px rgba(124, 58, 237, 0.5);
      border: 1.2px solid rgba(255, 255, 255, 0.25);
      flex-shrink: 0;
    }
    .logo-icon-box svg {
      width: 7.5mm;
      height: 7.5mm;
      fill: none;
      stroke: #FFFFFF;
      stroke-width: 2.2;
    }
    .title-group {
      display: flex;
      flex-direction: column;
    }
    .main-headline {
      font-family: 'Kanit', sans-serif;
      font-size: 7.5mm;
      font-weight: 900;
      line-height: 1.05;
      letter-spacing: -0.3px;
      background: linear-gradient(90deg, #FFFFFF 0%, #F5F3FF 50%, #FDF2F8 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    .sub-headline {
      font-size: 3.4mm;
      font-weight: 600;
      color: #94A3B8;
      margin-top: 0.5mm;
    }
    .sub-headline strong {
      color: #F1F5F9;
      font-weight: 700;
    }
    .fast-badge-card {
      background: linear-gradient(135deg, rgba(124, 58, 237, 0.25) 0%, rgba(219, 39, 119, 0.2) 100%);
      border: 1.2px solid rgba(192, 132, 252, 0.4);
      padding: 2mm 3.8mm;
      border-radius: 2.8mm;
      text-align: right;
    }
    .fast-badge-card .txt-big {
      font-size: 3.5mm;
      font-weight: 800;
      color: #F472B6;
    }
    .fast-badge-card .txt-small {
      font-size: 2.55mm;
      color: #CBD5E1;
      margin-top: 0.3mm;
    }

    /* ─── BANNER GUIDE ─── */
    .guide-banner {
      position: relative;
      z-index: 10;
      margin-top: 2.2mm;
      background: linear-gradient(90deg, rgba(15, 23, 42, 0.85) 0%, rgba(30, 27, 75, 0.85) 100%);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 2.8mm;
      padding: 2mm 3.8mm;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .guide-banner-left {
      display: flex;
      align-items: center;
      gap: 2.2mm;
      font-size: 3.5mm;
      font-weight: 800;
      color: #F8FAFC;
    }
    .guide-banner-left .tag {
      background: #7C3AED;
      color: #FFFFFF;
      font-size: 2.5mm;
      font-weight: 800;
      padding: 0.6mm 2.2mm;
      border-radius: 1.8mm;
      letter-spacing: 0.5px;
    }
    .guide-banner-right {
      font-size: 2.7mm;
      color: #94A3B8;
      font-weight: 500;
    }

    /* ─── MAIN 4 STEPS GRID ─── */
    .steps-grid {
      position: relative;
      z-index: 10;
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 3.2mm;
      margin-top: 2.4mm;
    }

    .card {
      background: rgba(15, 23, 42, 0.7);
      backdrop-filter: blur(12px);
      border: 1.2px solid rgba(255, 255, 255, 0.1);
      border-radius: 3.5mm;
      padding: 2.8mm 3mm 2.8mm 3mm;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      position: relative;
      box-shadow: 0 4px 18px rgba(0, 0, 0, 0.4);
    }
    .card.purple-glow {
      border-color: rgba(139, 92, 246, 0.45);
      background: linear-gradient(180deg, rgba(28, 22, 54, 0.8) 0%, rgba(13, 17, 34, 0.8) 100%);
    }
    .card.green-glow {
      border-color: rgba(16, 185, 129, 0.5);
      background: linear-gradient(180deg, rgba(6, 42, 29, 0.8) 0%, rgba(10, 24, 20, 0.8) 100%);
    }

    .card-top {
      margin-bottom: 1.6mm;
    }
    .card-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 1.4mm;
    }
    .card-step-num {
      display: flex;
      align-items: center;
      gap: 1.8mm;
    }
    .num-ball {
      width: 6.2mm;
      height: 6.2mm;
      border-radius: 50%;
      background: linear-gradient(135deg, #7C3AED, #DB2777);
      color: #FFFFFF;
      font-size: 3.4mm;
      font-weight: 900;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 2px 10px rgba(124, 58, 237, 0.5);
    }
    .num-ball.green {
      background: linear-gradient(135deg, #059669, #10B981);
      box-shadow: 0 2px 10px rgba(16, 185, 129, 0.5);
    }
    .card-title {
      font-family: 'Kanit', sans-serif;
      font-size: 3.9mm;
      font-weight: 800;
      color: #F8FAFC;
    }
    .pill-tag {
      font-size: 2.3mm;
      font-weight: 700;
      padding: 0.5mm 2mm;
      border-radius: 2mm;
      background: rgba(255, 255, 255, 0.08);
      color: #CBD5E1;
      border: 1px solid rgba(255, 255, 255, 0.08);
    }
    .pill-tag.pink {
      background: rgba(219, 39, 119, 0.2);
      color: #F472B6;
      border-color: rgba(219, 39, 119, 0.4);
    }
    .pill-tag.green {
      background: rgba(16, 185, 129, 0.2);
      color: #34D399;
      border-color: rgba(16, 185, 129, 0.4);
    }

    .card-desc {
      font-size: 2.7mm;
      line-height: 1.36;
      color: #CBD5E1;
    }
    .card-desc strong {
      color: #FFFFFF;
      font-weight: 700;
    }

    /* ─── STEP 1 VISUAL (ESP32 LCD + Bullets) ─── */
    .step1-content {
      display: flex;
      gap: 3mm;
      align-items: center;
      background: #05070E;
      border-radius: 2.6mm;
      padding: 2mm;
      border: 1px solid rgba(255, 255, 255, 0.08);
    }
    .tft-box {
      width: 46mm;
      height: 35mm;
      background: #06070D;
      border: 1.5px solid #1E293B;
      border-radius: 2.2mm;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      box-shadow: 0 4px 14px rgba(0, 0, 0, 0.8);
      flex-shrink: 0;
    }
    .tft-top {
      background: #0E111C;
      padding: 1.1mm 2mm;
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1px solid rgba(255, 255, 255, 0.08);
    }
    .tft-top .t-brand {
      color: #E2E8F0;
      font-size: 2.2mm;
      font-weight: 800;
      letter-spacing: 0.4px;
    }
    .tft-top .t-badge {
      font-size: 1.9mm;
      padding: 0.3mm 1.5mm;
      background: rgba(16, 185, 129, 0.2);
      color: #10B981;
      border-radius: 1mm;
      font-weight: 700;
    }
    .tft-body {
      flex: 1;
      display: flex;
      align-items: center;
      padding: 1.6mm 2mm;
      gap: 2.2mm;
    }
    .tft-qr-wrap {
      width: 21mm;
      height: 21mm;
      background: #FFFFFF;
      padding: 0.9mm;
      border-radius: 1.5mm;
      border: 2px solid #10B981;
      box-shadow: 0 0 10px rgba(16, 185, 129, 0.35);
      flex-shrink: 0;
    }
    .tft-qr-wrap img {
      width: 100%;
      height: 100%;
      display: block;
    }
    .tft-info {
      flex: 1;
      text-align: left;
    }
    .tft-info .lbl {
      color: #94A3B8;
      font-size: 1.9mm;
      font-weight: 700;
      text-transform: uppercase;
    }
    .tft-info .room-code {
      color: #38BDF8;
      font-size: 4.5mm;
      font-weight: 900;
      line-height: 1.1;
      margin-top: 0.2mm;
    }
    .tft-info .room-desc {
      color: #CBD5E1;
      font-size: 2.1mm;
      margin-top: 0.4mm;
    }
    .tft-btm {
      background: #0A0B10;
      padding: 0.9mm 2mm;
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-top: 1px solid rgba(255, 255, 255, 0.06);
    }
    .tft-btm span {
      color: #64748B;
      font-size: 1.9mm;
    }
    .tft-btm .ip {
      color: #10B981;
      font-family: 'JetBrains Mono', monospace;
      font-weight: 700;
    }

    .step1-points {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 1.2mm;
    }
    .pt-row {
      display: flex;
      align-items: flex-start;
      gap: 1.3mm;
      font-size: 2.5mm;
      color: #CBD5E1;
      line-height: 1.3;
    }
    .pt-icon {
      color: #38BDF8;
      font-size: 2.6mm;
      line-height: 1;
      margin-top: 0.2mm;
    }
    .pt-row strong {
      color: #F8FAFC;
    }

    /* ─── STEP 2 VISUAL (PHONE FRAME + REAL PROJECT FORM CAPTURE) ─── */
    .step2-content {
      display: flex;
      gap: 3mm;
      align-items: stretch;
    }
    .phone-wrapper {
      width: 42mm;
      flex-shrink: 0;
      background: #000000;
      border-radius: 3.8mm;
      border: 1.6px solid #334155;
      padding: 1.2mm 1mm 1mm 1mm;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.8), 0 0 16px rgba(124, 58, 237, 0.35);
      position: relative;
    }
    .phone-island {
      width: 13mm;
      height: 1.8mm;
      background: #1E293B;
      border-radius: 1mm;
      margin: 0 auto 1.2mm auto;
    }
    .phone-glass {
      width: 100%;
      border-radius: 2.6mm;
      overflow: hidden;
      border: 1px solid rgba(255, 255, 255, 0.08);
      background: #090A14;
    }
    .phone-glass img {
      width: 100%;
      height: auto;
      display: block;
    }

    .step2-details {
      flex: 1;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }
    .fields-guide-card {
      background: rgba(0, 0, 0, 0.45);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 2.3mm;
      padding: 1.8mm 2.4mm;
    }
    .field-row {
      display: flex;
      align-items: center;
      gap: 1.4mm;
      font-size: 2.5mm;
      margin-bottom: 0.9mm;
    }
    .field-row:last-child {
      margin-bottom: 0;
    }
    .field-chip {
      background: rgba(124, 58, 237, 0.3);
      color: #DDD6FE;
      font-weight: 800;
      padding: 0.35mm 1.6mm;
      border-radius: 1mm;
      font-size: 2.2mm;
      flex-shrink: 0;
    }
    .field-text {
      color: #F8FAFC;
      font-weight: 700;
    }
    .autofill-banner-box {
      background: linear-gradient(135deg, rgba(124, 58, 237, 0.25) 0%, rgba(219, 39, 119, 0.18) 100%);
      border: 1.2px dashed #A855F7;
      border-radius: 2.2mm;
      padding: 1.8mm 2.4mm;
      display: flex;
      align-items: center;
      gap: 2mm;
    }
    .autofill-badge-icon {
      font-size: 3.8mm;
      line-height: 1;
    }
    .autofill-info .h-title {
      font-size: 2.65mm;
      font-weight: 800;
      color: #F3E8FF;
    }
    .autofill-info .h-sub {
      font-size: 2.25mm;
      color: #CBD5E1;
      line-height: 1.28;
      margin-top: 0.3mm;
    }

    /* ─── STEP 3 VISUAL (REAL-TIME QUEUE SUBMIT) ─── */
    .step3-content {
      background: #05070E;
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 2.6mm;
      padding: 2.2mm 2.8mm;
      display: flex;
      flex-direction: column;
      gap: 1.8mm;
    }
    .big-submit-btn {
      background: linear-gradient(135deg, #7C3AED 0%, #DB2777 100%);
      border-radius: 2.2mm;
      padding: 2.2mm 3.2mm;
      text-align: center;
      color: #FFFFFF;
      font-weight: 800;
      font-size: 3.1mm;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 2mm;
      box-shadow: 0 4px 14px rgba(124, 58, 237, 0.5);
    }
    .queue-bar-live {
      display: flex;
      align-items: center;
      justify-content: space-between;
      background: rgba(255, 255, 255, 0.05);
      border-radius: 1.8mm;
      padding: 1.4mm 2.4mm;
      font-size: 2.5mm;
      color: #CBD5E1;
    }
    .queue-bar-live .live-tag {
      display: flex;
      align-items: center;
      gap: 1.4mm;
      color: #38BDF8;
      font-weight: 800;
    }
    .queue-bar-live .live-dot {
      width: 1.8mm;
      height: 1.8mm;
      background: #38BDF8;
      border-radius: 50%;
      box-shadow: 0 0 6px #38BDF8;
    }

    /* ─── STEP 4 VISUAL (DOOR UNLOCKED / ACCESS GRANTED) ─── */
    .step4-content {
      display: flex;
      gap: 3mm;
      align-items: center;
      background: #031008;
      border-radius: 2.6mm;
      padding: 2mm;
      border: 1px solid rgba(16, 185, 129, 0.35);
    }
    .unlock-box {
      width: 46mm;
      height: 35mm;
      background: #021207;
      border: 1.5px solid #059669;
      border-radius: 2.2mm;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      position: relative;
      box-shadow: 0 4px 16px rgba(16, 185, 129, 0.4);
      flex-shrink: 0;
    }
    .unlock-circle {
      width: 8.8mm;
      height: 8.8mm;
      border-radius: 50%;
      background: #064E3B;
      border: 1.6px solid #10B981;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #10B981;
      font-size: 4.4mm;
      font-weight: 900;
      box-shadow: 0 0 12px rgba(16, 185, 129, 0.6);
      margin-bottom: 1mm;
    }
    .unlock-text-main {
      color: #10B981;
      font-size: 2.9mm;
      font-weight: 900;
      letter-spacing: 0.4px;
      text-shadow: 0 0 8px rgba(16, 185, 129, 0.7);
    }
    .unlock-text-sub {
      color: #FCD34D;
      font-size: 2.1mm;
      font-weight: 800;
      margin-top: 0.3mm;
    }
    .unlock-user-tag {
      margin-top: 0.9mm;
      background: rgba(255, 255, 255, 0.08);
      border: 1px solid rgba(255, 255, 255, 0.12);
      padding: 0.4mm 2.2mm;
      border-radius: 3mm;
      color: #FFFFFF;
      font-size: 2mm;
      font-weight: 700;
    }
    .unlock-progress {
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      height: 1mm;
      background: #10B981;
      box-shadow: 0 0 6px #10B981;
    }

    .step4-points {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 1.2mm;
    }
    .pt-row.green-pt {
      color: #A7F3D0;
    }
    .pt-row.green-pt strong {
      color: #34D399;
    }

    /* ─── POWER FEATURES HIGHLIGHT ─── */
    .highlights-wrap {
      position: relative;
      z-index: 10;
      margin-top: 2.4mm;
      background: linear-gradient(135deg, rgba(22, 27, 50, 0.95) 0%, rgba(13, 17, 34, 0.95) 100%);
      border: 1.2px solid rgba(255, 255, 255, 0.12);
      border-radius: 3.5mm;
      padding: 2.4mm 3.2mm;
      box-shadow: 0 6px 20px rgba(0, 0, 0, 0.5);
    }
    .highlights-top {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 1.8mm;
      border-bottom: 1px solid rgba(255, 255, 255, 0.08);
      padding-bottom: 1.2mm;
    }
    .highlights-title {
      font-family: 'Kanit', sans-serif;
      font-size: 3.4mm;
      font-weight: 800;
      color: #F8FAFC;
      display: flex;
      align-items: center;
      gap: 1.8mm;
    }
    .highlights-sub {
      font-size: 2.5mm;
      color: #94A3B8;
    }

    .highlights-cols {
      display: grid;
      grid-template-columns: 1.25fr 1fr 1fr;
      gap: 2.8mm;
    }
    .feat-card {
      background: rgba(0, 0, 0, 0.4);
      border: 1px solid rgba(255, 255, 255, 0.06);
      border-radius: 2.3mm;
      padding: 1.8mm 2.2mm;
      display: flex;
      flex-direction: column;
    }
    .feat-card.amber-glow {
      border-color: rgba(245, 158, 11, 0.4);
      background: linear-gradient(180deg, rgba(245, 158, 11, 0.15) 0%, rgba(15, 23, 42, 0.5) 100%);
    }
    .feat-head {
      display: flex;
      align-items: center;
      gap: 1.4mm;
      font-size: 2.8mm;
      font-weight: 800;
      margin-bottom: 0.8mm;
    }
    .feat-head.amber { color: #FBBF24; }
    .feat-head.purple { color: #C084FC; }
    .feat-head.emerald { color: #34D399; }
    .feat-body {
      font-size: 2.35mm;
      line-height: 1.34;
      color: #CBD5E1;
    }
    .feat-body strong {
      color: #FFFFFF;
      font-weight: 700;
    }

    /* ─── FOOTER ─── */
    .footer {
      position: relative;
      z-index: 10;
      border-top: 1.5px solid rgba(255, 255, 255, 0.1);
      padding-top: 2.2mm;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .f-left-title {
      font-size: 3mm;
      font-weight: 800;
      color: #F8FAFC;
    }
    .f-left-sub {
      font-size: 2.45mm;
      color: #94A3B8;
      margin-top: 0.2mm;
    }
    .f-center-warning {
      background: rgba(255, 255, 255, 0.04);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 2mm;
      padding: 1.2mm 2.8mm;
      text-align: center;
    }
    .f-warn-head {
      font-size: 2.4mm;
      font-weight: 700;
      color: #FB7185;
    }
    .f-warn-body {
      font-size: 2.15mm;
      color: #CBD5E1;
      margin-top: 0.2mm;
    }
    .f-right {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
    }
    .f-badge {
      background: linear-gradient(90deg, #7C3AED, #DB2777);
      color: #FFFFFF;
      font-size: 2.4mm;
      font-weight: 800;
      padding: 0.6mm 2.5mm;
      border-radius: 3mm;
    }
    .f-ver {
      font-size: 2mm;
      color: #64748B;
      font-family: 'JetBrains Mono', monospace;
      margin-top: 0.3mm;
    }
  </style>
</head>
<body>

  <div class="poster-page">
    <div class="glow-violet"></div>
    <div class="glow-pink"></div>
    <div class="glow-emerald"></div>
    <div class="grid-lines"></div>

    <!-- ────────────────── HEADER ────────────────── -->
    <header class="header">
      <div class="univ-bar">
        <div class="univ-title-group">
          <span class="univ-tag-badge">มทร.พระนคร</span>
          <span class="univ-name-text">คณะครุศาสตร์อุตสาหกรรม มหาวิทยาลัยเทคโนโลยีราชมงคลพระนคร</span>
        </div>
        <div class="system-status-badge">
          <span class="status-dot"></span>
          <span>IoT Multi-Room Door Access System</span>
        </div>
      </div>

      <div class="main-hero-bar">
        <div class="logo-hero">
          <div class="logo-icon-box">
            <svg viewBox="0 0 24 24">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              <circle cx="12" cy="16" r="1.5"/>
            </svg>
          </div>
          <div class="title-group">
            <h1 class="main-headline">SmartAccess DOOR ACCESS</h1>
            <p class="sub-headline">แนะนำวิธีการใช้งาน <strong>ระบบควบคุมการเข้าออกห้องปฏิบัติการอัจฉริยะ</strong></p>
          </div>
        </div>

        <div class="fast-badge-card">
          <div class="txt-big">⚡ เข้าห้องเรียนง่ายใน 4 ขั้นตอน</div>
          <div class="txt-small">ไม่ต้องพกบัตร • ปลดล็อกผ่านมือถือ • ปลอดภัย 100%</div>
        </div>
      </div>
    </header>

    <!-- ────────────────── INTRO BANNER ────────────────── -->
    <div class="guide-banner">
      <div class="guide-banner-left">
        <span class="tag">GUIDE</span>
        <span>ขั้นตอนการขออนุญาตเข้าใช้ห้องปฏิบัติการเรียนการสอน (ห้อง CE-401 / CE-402)</span>
      </div>
      <div class="guide-banner-right">
        บันทึก Log ถูกต้องตาม พ.ร.บ. คอมพิวเตอร์ฯ 2560 & มาตรฐาน PDPA
      </div>
    </div>

    <!-- ────────────────── MAIN 4-STEP WORKFLOW ────────────────── -->
    <main class="steps-grid">

      <!-- STEP 1: SCAN DYNAMIC QR CODE -->
      <section class="card purple-glow">
        <div class="card-top">
          <div class="card-header">
            <div class="card-step-num">
              <div class="num-ball">1</div>
              <h2 class="card-title">สแกน Dynamic QR หน้าห้อง</h2>
            </div>
            <span class="pill-tag pink">สแกนผ่านมือถือ</span>
          </div>
          <p class="card-desc">
            ใช้<strong>กล้องถ่ายรูปของโทรศัพท์มือถือ</strong> สแกนภาพ QR Code ที่กำลังเคลื่อนไหวอยู่บนหน้าจอ LCD 3.2" หน้าห้องปฏิบัติการ แล้วแตะเปิดลิงก์
          </p>
        </div>

        <div class="step1-content">
          <div class="tft-box">
            <div class="tft-top">
              <span class="t-brand">SmartAccess DOOR</span>
              <span class="t-badge">ACTIVE</span>
            </div>
            <div class="tft-body">
              <div class="tft-qr-wrap">
                <img src="${qrDataUri}" alt="Dynamic QR">
              </div>
              <div class="tft-info">
                <div class="lbl">ห้องปฏิบัติการ</div>
                <div class="room-code">CE-401</div>
                <div class="room-desc">ห้องปฏิบัติการคอมฯ</div>
              </div>
            </div>
            <div class="tft-btm">
              <span>มทร.พระนคร (ครุศาสตร์)</span>
              <span class="ip">192.168.2.49</span>
            </div>
          </div>

          <div class="step1-points">
            <div class="pt-row">
              <span class="pt-icon">✦</span>
              <span><strong>Dynamic Token:</strong> รหัสเปลี่ยนทุก 60 วินาที ป้องกันการแคปรูปส่งต่อ</span>
            </div>
            <div class="pt-row">
              <span class="pt-icon">✦</span>
              <span><strong>Room Isolated:</strong> ระบุห้องเรียนเป้าหมายแม่นยำ ไม่สับสนข้ามห้อง</span>
            </div>
            <div class="pt-row">
              <span class="pt-icon">✦</span>
              <span><strong>แตะเปิดลิงก์:</strong> เข้าสู่หน้าจอลงทะเบียนหลักทันที</span>
            </div>
          </div>
        </div>
      </section>

      <!-- STEP 2: FILL REGISTRATION DETAILS (REAL PROJECT SCREENSHOT) -->
      <section class="card purple-glow">
        <div class="card-top">
          <div class="card-header">
            <div class="card-step-num">
              <div class="num-ball">2</div>
              <h2 class="card-title">กรอกข้อมูลผู้ขอเข้าใช้งาน</h2>
            </div>
            <span class="pill-tag pink">หน้าจอลงทะเบียนจริง</span>
          </div>
          <p class="card-desc">
            กรอก<strong>คำนำหน้า ชื่อ - นามสกุล รหัสนักศึกษา</strong> เลือกชั้นปี คณะ และสาขาวิชาของคุณให้ครบถ้วนเพื่อส่งคำขอยืนยันตัวตน
          </p>
        </div>

        <div class="step2-content">
          <!-- Real Mobile Phone Screenshot -->
          <div class="phone-wrapper">
            <div class="phone-island"></div>
            <div class="phone-glass">
              <img src="${imgMobileForm}" alt="SmartAccess Live Registration Screen">
            </div>
          </div>

          <!-- Explanatory Fields & Auto-fill -->
          <div class="step2-details">
            <div class="fields-guide-card">
              <div class="field-row">
                <span class="field-chip">ชื่อ-สกุล</span>
                <span class="field-text">นายชานนท์ สุขสวัสดิ์</span>
              </div>
              <div class="field-row">
                <span class="field-chip">รหัส นศ.</span>
                <span class="field-text">076158050650-8</span>
              </div>
              <div class="field-row">
                <span class="field-chip">ชั้นปี</span>
                <span class="field-text">นักศึกษาชั้นปีที่ 3</span>
              </div>
              <div class="field-row">
                <span class="field-chip">คณะ</span>
                <span class="field-text">คณะครุศาสตร์อุตสาหกรรม</span>
              </div>
              <div class="field-row">
                <span class="field-chip">สาขาวิชา</span>
                <span class="field-text">คอมพิวเตอร์และเทคโนโลยีฯ</span>
              </div>
            </div>

            <div class="autofill-banner-box">
              <div class="autofill-badge-icon">🎓</div>
              <div class="autofill-info">
                <div class="h-title">ระบบ Intelligent Auto-fill</div>
                <div class="h-sub">เมื่อพิมพ์รหัสนักศึกษา ระบบจะดึงประวัติเดิมให้ทันที สะดวกและรวดเร็วมาก!</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- STEP 3: SUBMIT REQUEST -->
      <section class="card purple-glow">
        <div class="card-top">
          <div class="card-header">
            <div class="card-step-num">
              <div class="num-ball">3</div>
              <h2 class="card-title">กดยืนยันส่งข้อมูลคำขอ</h2>
            </div>
            <span class="pill-tag pink">Real-Time Queue</span>
          </div>
          <p class="card-desc">
            กดปุ่ม <strong>"ส่งข้อมูลขอเปิดประตูผ่านระบบ"</strong> คำขอจะถูกส่งตรงไปยัง Dashboard ของอาจารย์ผู้สอนหรือเจ้าหน้าที่ประจำห้องแบบสด
          </p>
        </div>

        <div class="step3-content">
          <div class="big-submit-btn">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="22" y1="2" x2="11" y2="13"/>
              <polygon points="22 2 15 22 11 13 2 9 22 2"/>
            </svg>
            <span>ส่งข้อมูลขอเปิดประตูผ่านระบบ</span>
          </div>

          <div class="queue-bar-live">
            <div class="live-tag">
              <span class="live-dot"></span>
              <span>สถานะ: กำลังรอการอนุมัติ (Real-Time Queue)</span>
            </div>
            <span style="color:#94A3B8; font-size:2.4mm;">ตรวจสอบคิวอัตโนมัติทุก 3 วินาที</span>
          </div>
        </div>
      </section>

      <!-- STEP 4: ACCESS GRANTED & DOOR UNLOCKED -->
      <section class="card green-glow">
        <div class="card-top">
          <div class="card-header">
            <div class="card-step-num">
              <div class="num-ball green">4</div>
              <h2 class="card-title" style="color:#34D399;">อนุมัติสำเร็จ ประตูเปิดแล้ว!</h2>
            </div>
            <span class="pill-tag green">Access Granted</span>
          </div>
          <p class="card-desc">
            เมื่อได้รับการอนุมัติ หน้าจอมือถือและจอ LCD หน้าห้องจะเปลี่ยนเป็น<strong>สีเขียว</strong> และกลอนประตูแม่เหล็กไฟฟ้าจะ<strong>ปลดล็อกอัตโนมัติ</strong> เข้าห้องได้ทันที!
          </p>
        </div>

        <div class="step4-content">
          <div class="unlock-box">
            <div class="unlock-circle">✓</div>
            <div class="unlock-text-main">ACCESS GRANTED</div>
            <div class="unlock-text-sub">🔓 DOOR UNLOCKED (ปลดล็อก)</div>
            <div class="unlock-user-tag">นายชานนท์ สุขสวัสดิ์</div>
            <div class="unlock-progress"></div>
          </div>

          <div class="step4-points">
            <div class="pt-row green-pt">
              <span class="pt-icon" style="color:#10B981;">✓</span>
              <span><strong>Auto Unlock:</strong> สั่งปลดล็อกกลอนแม่เหล็ก 5 วินาที</span>
            </div>
            <div class="pt-row green-pt">
              <span class="pt-icon" style="color:#10B981;">✓</span>
              <span><strong>Audit Logged:</strong> บันทึกประวัติเวลาเข้าห้องเรียนโปร่งใส</span>
            </div>
            <div class="pt-row green-pt">
              <span class="pt-icon" style="color:#10B981;">✓</span>
              <span><strong>Real-Time Discord:</strong> ส่งแจ้งเตือนเจ้าหน้าที่ทันที</span>
            </div>
          </div>
        </div>
      </section>

    </main>

    <!-- ────────────────── POWER FEATURES HIGHLIGHT ────────────────── -->
    <section class="highlights-wrap">
      <div class="highlights-top">
        <div class="highlights-title">
          <span>⚡ สิทธิพิเศษและฟังก์ชันอำนวยความสะดวก</span>
        </div>
        <div class="highlights-sub">ออกแบบมาเพื่อความคล่องตัว รวดเร็ว และความปลอดภัยสูงสุดของนักศึกษา</div>
      </div>

      <div class="highlights-cols">
        <!-- Feature 1: Bypass 5 mins -->
        <div class="feat-card amber-glow">
          <div class="feat-head amber">
            <span>⚡ สิทธิ์ Bypass อัตโนมัติ 5 นาที</span>
          </div>
          <p class="feat-body">
            หากได้รับอนุมัติแล้ว และต้องเดินออกนอกห้องชั่วคราว (เข้าห้องน้ำ/รับโทรศัพท์) <strong>สแกน QR หน้าห้องเดิมซ้ำภายใน 5 นาที</strong> ประตูจะปลดล็อกให้ทันที <strong>ไม่ต้องกรอกข้อมูลใหม่และไม่ต้องรออนุมัติซ้ำ!</strong>
          </p>
        </div>

        <!-- Feature 2: Auto-Fill -->
        <div class="feat-card">
          <div class="feat-head purple">
            <span>🧠 Intelligent Auto-fill</span>
          </div>
          <p class="feat-body">
            ระบบจดจำข้อมูลการใช้งานเดิมอย่างปลอดภัย เพียงกรอกรหัสนักศึกษา ข้อมูลคณะและสาขาจะถูกเติมให้ทันที ลดเวลาลงทะเบียนเหลือไม่ถึง <strong>5 วินาที</strong>
          </p>
        </div>

        <!-- Feature 3: Security & Privacy -->
        <div class="feat-card">
          <div class="feat-head emerald">
            <span>🛡️ มาตรฐานความปลอดภัย PDPA</span>
          </div>
          <p class="feat-body">
            จัดเก็บประวัติการเข้า-ออกห้องเรียนในระบบคลาวด์ Supabase เข้ารหัสปลอดภัย และเก็บบันทึก Log จราจร 90 วัน สอดคล้องตาม <strong>พ.ร.บ. คอมพิวเตอร์ฯ 2560</strong>
          </p>
        </div>
      </div>
    </section>

    <!-- ────────────────── FOOTER ────────────────── -->
    <footer class="footer">
      <div class="footer-left">
        <div class="f-left-title">คณะครุศาสตร์อุตสาหกรรม มหาวิทยาลัยเทคโนโลยีราชมงคลพระนคร</div>
        <div class="f-left-sub">สาขาวิชาวิศวกรรมคอมพิวเตอร์และเทคโนโลยีสารสนเทศ • อาคารปฏิบัติการเรียนการสอน</div>
      </div>

      <div class="f-center-warning">
        <div class="f-warn-head">⚠️ ข้อควรปฏิบัติเพื่อความปลอดภัย</div>
        <div class="f-warn-body">โปรดสแกน QR Code หน้าห้องที่ต้องการเข้าจริงเท่านั้น และห้ามส่งต่อลิงก์ลงทะเบียนให้ผู้อื่น</div>
      </div>

      <div class="f-right">
        <span class="f-badge">SmartAccess IoT System</span>
        <span class="f-ver">v2.4.0 • Enterprise Edition</span>
      </div>
    </footer>

  </div>

</body>
</html>`;

  const htmlPath = path.join(ROOT_DIR, 'smartaccess_poster_a4.html');
  fs.writeFileSync(htmlPath, html, 'utf8');
  console.log(`Saved Ultimate HTML poster: ${htmlPath}`);

  const publicHtmlPath = path.join(__dirname, '..', 'public', 'smartaccess_poster_a4.html');
  fs.writeFileSync(publicHtmlPath, html, 'utf8');

  console.log('Rendering High-Res PNG and Vector PDF with Edge...');
  const browser = await puppeteer.launch({
    executablePath: EDGE_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu']
  });

  try {
    const page = await browser.newPage();
    
    await page.setViewport({
      width: 1240,
      height: 1754,
      deviceScaleFactor: 2
    });

    await page.setContent(html, { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 1500));

    const pngPath = path.join(ROOT_DIR, 'smartaccess_poster_a4.png');
    await page.screenshot({
      path: pngPath,
      fullPage: false,
      omitBackground: false
    });
    console.log(`Saved High-Res PNG Poster: ${pngPath}`);

    const pdfPath = path.join(ROOT_DIR, 'smartaccess_poster_a4.pdf');
    await page.pdf({
      path: pdfPath,
      format: 'A4',
      printBackground: true,
      margin: { top: 0, right: 0, bottom: 0, left: 0 }
    });
    console.log(`Saved Print-Ready PDF Poster: ${pdfPath}`);

    console.log('=== Ultimate Poster Generated Successfully! ===');
  } catch (err) {
    console.error('Error generating ultimate poster:', err);
  } finally {
    await browser.close();
  }
}

buildUltimatePoster();
