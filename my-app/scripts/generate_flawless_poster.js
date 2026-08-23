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

async function buildPoster() {
  console.log('Generating high-res dynamic QR code...');
  const qrDataUri = await QRCode.toDataURL('http://192.168.1.41:3000/?room=CE-401&scan=AUTH_TOKEN_77492', {
    width: 360,
    margin: 1,
    color: { dark: '#000000', light: '#FFFFFF' }
  });

  const imgMobileForm = toBase64('screen_mobile_form_perfect.png');

  console.log('Building Clean & Correct A4 Poster HTML...');
  const html = `<!DOCTYPE html>
<html lang="th">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>SmartAccess DOOR — คู่มือแนะนำวิธีการใช้งานระบบ (A4)</title>
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

    .poster-canvas {
      width: 210mm;
      height: 297mm;
      position: relative;
      background: radial-gradient(140% 100% at 50% -10%, #1D143D 0%, #0C0F22 42%, #05060C 95%);
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      padding: 6mm 9mm 5.5mm 9mm;
      overflow: hidden;
    }

    /* Ambient Glows */
    .glow-1 {
      position: absolute;
      top: -30mm;
      left: -20mm;
      width: 140mm;
      height: 140mm;
      background: radial-gradient(circle, rgba(124, 58, 237, 0.35) 0%, rgba(124, 58, 237, 0) 70%);
      pointer-events: none;
    }
    .glow-2 {
      position: absolute;
      top: 80mm;
      right: -30mm;
      width: 140mm;
      height: 140mm;
      background: radial-gradient(circle, rgba(219, 39, 119, 0.22) 0%, rgba(219, 39, 119, 0) 70%);
      pointer-events: none;
    }
    .glow-3 {
      position: absolute;
      bottom: -30mm;
      right: -20mm;
      width: 140mm;
      height: 140mm;
      background: radial-gradient(circle, rgba(16, 185, 129, 0.2) 0%, rgba(16, 185, 129, 0) 70%);
      pointer-events: none;
    }
    .grid-pattern {
      position: absolute;
      inset: 0;
      background-image: linear-gradient(rgba(255, 255, 255, 0.02) 1px, transparent 1px),
                        linear-gradient(90deg, rgba(255, 255, 255, 0.02) 1px, transparent 1px);
      background-size: 8mm 8mm;
      pointer-events: none;
    }

    /* ─── 1. HEADER ─── */
    .header-box {
      position: relative;
      z-index: 10;
      border-bottom: 1.2px solid rgba(255, 255, 255, 0.1);
      padding-bottom: 1.8mm;
    }
    .univ-bar-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.4mm;
    }
    .univ-tag-title {
      display: flex;
      align-items: center;
      gap: 2mm;
    }
    .univ-tag {
      background: linear-gradient(135deg, #7C3AED, #DB2777);
      color: #FFFFFF;
      font-size: 2.6mm;
      font-weight: 800;
      padding: 0.5mm 2.4mm;
      border-radius: 3mm;
      letter-spacing: 0.3px;
    }
    .univ-text {
      font-size: 3mm;
      font-weight: 700;
      color: #E2E8F0;
    }
    .badge-iot {
      background: rgba(16, 185, 129, 0.15);
      border: 1px solid rgba(16, 185, 129, 0.4);
      color: #34D399;
      font-size: 2.45mm;
      font-weight: 700;
      padding: 0.5mm 2.4mm;
      border-radius: 3mm;
      display: flex;
      align-items: center;
      gap: 1.4mm;
    }
    .green-dot {
      width: 1.6mm;
      height: 1.6mm;
      background: #10B981;
      border-radius: 50%;
      box-shadow: 0 0 5px #10B981;
    }

    .header-main-flex {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 3.2mm;
    }
    .brand-group {
      display: flex;
      align-items: center;
      gap: 3mm;
    }
    .logo-cube {
      width: 11.5mm;
      height: 11.5mm;
      background: linear-gradient(135deg, #7C3AED 0%, #DB2777 100%);
      border-radius: 2.8mm;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 14px rgba(124, 58, 237, 0.45);
      border: 1.1px solid rgba(255, 255, 255, 0.25);
      flex-shrink: 0;
    }
    .logo-cube svg {
      width: 6.8mm;
      height: 6.8mm;
      fill: none;
      stroke: #FFFFFF;
      stroke-width: 2.2;
    }
    .title-col {
      display: flex;
      flex-direction: column;
    }
    .main-title-txt {
      font-family: 'Kanit', sans-serif;
      font-size: 7.4mm;
      font-weight: 900;
      line-height: 1.05;
      letter-spacing: -0.2px;
      background: linear-gradient(90deg, #FFFFFF 0%, #F5F3FF 50%, #FDF2F8 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    .sub-title-txt {
      font-size: 3.2mm;
      font-weight: 600;
      color: #94A3B8;
      margin-top: 0.2mm;
    }
    .sub-title-txt strong {
      color: #F1F5F9;
      font-weight: 700;
    }
    .badge-4steps {
      background: linear-gradient(135deg, rgba(124, 58, 237, 0.22) 0%, rgba(219, 39, 119, 0.18) 100%);
      border: 1.1px solid rgba(192, 132, 252, 0.35);
      padding: 1.6mm 3.4mm;
      border-radius: 2.4mm;
      text-align: right;
    }
    .badge-4steps .b-top {
      font-size: 3.3mm;
      font-weight: 800;
      color: #F472B6;
    }
    .badge-4steps .b-bot {
      font-size: 2.45mm;
      color: #CBD5E1;
      margin-top: 0.2mm;
    }

    /* ─── 2. GUIDE BANNER (Removed Room Code) ─── */
    .guide-banner-bar {
      position: relative;
      z-index: 10;
      background: linear-gradient(90deg, rgba(15, 23, 42, 0.9) 0%, rgba(30, 27, 75, 0.9) 100%);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 2.5mm;
      padding: 1.8mm 3.4mm;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .guide-banner-left {
      display: flex;
      align-items: center;
      gap: 2mm;
      font-size: 3.3mm;
      font-weight: 800;
      color: #F8FAFC;
    }
    .guide-chip {
      background: #7C3AED;
      color: #FFFFFF;
      font-size: 2.3mm;
      font-weight: 800;
      padding: 0.4mm 2mm;
      border-radius: 1.4mm;
    }
    .guide-banner-right {
      font-size: 2.5mm;
      color: #94A3B8;
    }

    /* ─── 3. WORKFLOW CARDS ─── */
    .workflow-wrap {
      position: relative;
      z-index: 10;
      display: flex;
      flex-direction: column;
      gap: 2.8mm;
    }

    .card-shell {
      background: rgba(15, 23, 42, 0.75);
      backdrop-filter: blur(10px);
      border: 1.1px solid rgba(255, 255, 255, 0.1);
      border-radius: 3.2mm;
      padding: 2.6mm 3.2mm;
      box-shadow: 0 4px 15px rgba(0, 0, 0, 0.35);
      position: relative;
    }
    .card-shell.purple-theme {
      border-color: rgba(139, 92, 246, 0.42);
      background: linear-gradient(180deg, rgba(28, 22, 54, 0.78) 0%, rgba(13, 17, 34, 0.78) 100%);
    }
    .card-shell.green-theme {
      border-color: rgba(16, 185, 129, 0.48);
      background: linear-gradient(180deg, rgba(6, 42, 29, 0.78) 0%, rgba(10, 24, 20, 0.78) 100%);
    }

    .card-header-flex {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 1.6mm;
    }
    .step-badge-group {
      display: flex;
      align-items: center;
      gap: 1.8mm;
    }
    .step-ball {
      width: 5.8mm;
      height: 5.8mm;
      border-radius: 50%;
      background: linear-gradient(135deg, #7C3AED, #DB2777);
      color: #FFFFFF;
      font-size: 3.3mm;
      font-weight: 900;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 2px 8px rgba(124, 58, 237, 0.45);
    }
    .step-ball.green-b {
      background: linear-gradient(135deg, #059669, #10B981);
      box-shadow: 0 2px 8px rgba(16, 185, 129, 0.45);
    }
    .step-title-text {
      font-family: 'Kanit', sans-serif;
      font-size: 3.7mm;
      font-weight: 800;
      color: #F8FAFC;
    }
    .step-tag-pill {
      font-size: 2.2mm;
      font-weight: 700;
      padding: 0.5mm 1.8mm;
      border-radius: 1.6mm;
      background: rgba(255, 255, 255, 0.08);
      color: #CBD5E1;
    }
    .step-tag-pill.pink {
      background: rgba(219, 39, 119, 0.2);
      color: #F472B6;
      border: 1px solid rgba(219, 39, 119, 0.4);
    }
    .step-tag-pill.green {
      background: rgba(16, 185, 129, 0.2);
      color: #34D399;
      border: 1px solid rgba(16, 185, 129, 0.4);
    }

    /* ─── STEP 1 CONTENT ─── */
    .step1-content-grid {
      display: grid;
      grid-template-columns: 48mm 1fr;
      gap: 3.6mm;
      align-items: center;
    }
    .esp32-tft-screen {
      background: #06070D;
      border: 1.4px solid #1E293B;
      border-radius: 2mm;
      overflow: hidden;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.8);
    }
    .tft-top-bar {
      background: #0E111C;
      padding: 1mm 1.6mm;
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1px solid rgba(255, 255, 255, 0.08);
    }
    .tft-top-bar .brand { color: #E2E8F0; font-size: 2mm; font-weight: 800; }
    .tft-top-bar .status { font-size: 1.8mm; padding: 0.2mm 1.2mm; background: rgba(16, 185, 129, 0.2); color: #10B981; border-radius: 0.8mm; font-weight: 700; }
    .tft-body-row {
      display: flex;
      align-items: center;
      padding: 1.2mm 1.6mm;
      gap: 2mm;
    }
    .tft-qr-holder {
      width: 20mm;
      height: 20mm;
      background: #FFFFFF;
      padding: 0.7mm;
      border-radius: 1.4mm;
      border: 1.8px solid #10B981;
      box-shadow: 0 0 9px rgba(16, 185, 129, 0.35);
      flex-shrink: 0;
    }
    .tft-qr-holder img { width: 100%; height: 100%; display: block; }
    .tft-room-box { flex: 1; }
    .tft-room-box .lbl { color: #94A3B8; font-size: 1.8mm; font-weight: 700; text-transform: uppercase; }
    .tft-room-box .code { color: #38BDF8; font-size: 4.5mm; font-weight: 900; line-height: 1.1; margin-top: 0.2mm; }
    .tft-room-box .sub { color: #CBD5E1; font-size: 2mm; margin-top: 0.2mm; }
    .tft-bot-bar {
      background: #0A0B10;
      padding: 0.8mm 1.6mm;
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-top: 1px solid rgba(255, 255, 255, 0.06);
    }
    .tft-bot-bar span { color: #64748B; font-size: 1.8mm; }
    .tft-bot-bar .ip { color: #10B981; font-family: 'JetBrains Mono', monospace; font-weight: 700; }

    .step1-text-box {
      display: flex;
      flex-direction: column;
      gap: 1.4mm;
    }
    .step1-desc-p {
      font-size: 2.75mm;
      color: #E2E8F0;
      line-height: 1.36;
    }
    .step1-desc-p strong { color: #FFFFFF; font-weight: 700; }
    .bullet-container {
      display: flex;
      flex-direction: column;
      gap: 1.2mm;
      background: rgba(0, 0, 0, 0.35);
      padding: 1.6mm 2.2mm;
      border-radius: 2mm;
      border: 1px solid rgba(255, 255, 255, 0.06);
    }
    .b-item {
      display: flex;
      align-items: flex-start;
      gap: 1.2mm;
      font-size: 2.45mm;
      color: #CBD5E1;
      line-height: 1.3;
    }
    .b-item .ico { color: #38BDF8; font-size: 2.5mm; line-height: 1; margin-top: 0.1mm; }
    .b-item strong { color: #F8FAFC; }

    /* ─── STEP 2 CONTENT (HERO FORM) ─── */
    .step2-showcase-grid {
      display: grid;
      grid-template-columns: 38mm 1.15fr 0.95fr;
      gap: 3.4mm;
      align-items: center;
      background: #05070E;
      border-radius: 2.6mm;
      padding: 2.4mm 2.8mm;
      border: 1px solid rgba(255, 255, 255, 0.08);
    }
    .phone-mockup-wrap {
      background: #000000;
      border-radius: 3.4mm;
      border: 1.6px solid #334155;
      padding: 1mm 0.8mm 0.8mm 0.8mm;
      box-shadow: 0 6px 18px rgba(0, 0, 0, 0.8), 0 0 14px rgba(124, 58, 237, 0.35);
      display: flex;
      flex-direction: column;
      height: 52mm;
    }
    .phone-island-notch {
      width: 11mm;
      height: 1.5mm;
      background: #1E293B;
      border-radius: 1mm;
      margin: 0 auto 1.1mm auto;
    }
    .phone-inner-screen-box {
      width: 100%;
      border-radius: 2.2mm;
      overflow: hidden;
      border: 1px solid rgba(255, 255, 255, 0.08);
      background: #090A14;
      flex: 1;
    }
    .phone-inner-screen-box img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
    }

    .form-summary-list {
      display: flex;
      flex-direction: column;
      gap: 1.2mm;
    }
    .form-field-card {
      display: flex;
      align-items: center;
      justify-content: space-between;
      background: rgba(255, 255, 255, 0.04);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 1.6mm;
      padding: 1.2mm 2mm;
    }
    .field-key {
      color: #C084FC;
      font-size: 2.25mm;
      font-weight: 700;
    }
    .field-val {
      color: #FFFFFF;
      font-size: 2.55mm;
      font-weight: 800;
      font-family: 'Prompt', sans-serif;
    }

    .autofill-banner-card {
      background: linear-gradient(135deg, rgba(124, 58, 237, 0.28) 0%, rgba(219, 39, 119, 0.2) 100%);
      border: 1.2px dashed #A855F7;
      border-radius: 2.2mm;
      padding: 2mm 2.2mm;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      height: 100%;
    }
    .af-top-head {
      display: flex;
      align-items: center;
      gap: 1.4mm;
      font-size: 2.75mm;
      font-weight: 800;
      color: #F3E8FF;
    }
    .af-text-body {
      font-size: 2.3mm;
      color: #CBD5E1;
      line-height: 1.32;
      margin-top: 1mm;
    }
    .af-text-body strong { color: #FFFFFF; }
    .af-time-badge {
      margin-top: 1.3mm;
      background: rgba(124, 58, 237, 0.45);
      border: 1px solid rgba(192, 132, 252, 0.5);
      border-radius: 1.5mm;
      padding: 0.6mm 1.8mm;
      font-size: 2.15mm;
      color: #DDD6FE;
      font-weight: 800;
      text-align: center;
    }

    /* ─── STEPS 3 & 4 (BALANCED & PROPERLY ENCLOSED) ─── */
    .steps-3-4-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 2.8mm;
      align-items: stretch;
    }

    /* Step 3 */
    .step3-flex-col {
      display: flex;
      flex-direction: column;
      gap: 1.8mm;
    }
    .btn-submit-gradient {
      background: linear-gradient(135deg, #7C3AED 0%, #DB2777 100%);
      border-radius: 2.2mm;
      padding: 1.8mm 2.6mm;
      text-align: center;
      color: #FFFFFF;
      font-weight: 800;
      font-size: 2.85mm;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 1.6mm;
      box-shadow: 0 4px 12px rgba(124, 58, 237, 0.45);
    }
    .live-status-box {
      background: rgba(255, 255, 255, 0.04);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 1.8mm;
      padding: 1.2mm 2mm;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .live-left-tag {
      display: flex;
      align-items: center;
      gap: 1.4mm;
      font-size: 2.4mm;
      color: #38BDF8;
      font-weight: 800;
    }
    .pulse-dot-blue {
      width: 1.8mm;
      height: 1.8mm;
      background: #38BDF8;
      border-radius: 50%;
      box-shadow: 0 0 6px #38BDF8;
    }
    .step3-bullets-list {
      display: flex;
      flex-direction: column;
      gap: 1mm;
      background: rgba(0, 0, 0, 0.25);
      border: 1px solid rgba(255, 255, 255, 0.05);
      border-radius: 1.8mm;
      padding: 1.4mm 2mm;
    }

    /* Step 4 */
    .step4-flex-grid {
      display: grid;
      grid-template-columns: 36mm 1fr;
      gap: 2.8mm;
      align-items: center;
    }
    .unlock-lcd-widget {
      background: #021207;
      border: 1.5px solid #059669;
      border-radius: 2mm;
      padding: 1.8mm 1.4mm;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      position: relative;
      box-shadow: 0 4px 14px rgba(16, 185, 129, 0.4);
      overflow: hidden;
    }
    .unlock-icon-circle {
      width: 8mm;
      height: 8mm;
      border-radius: 50%;
      background: #064E3B;
      border: 1.4px solid #10B981;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #10B981;
      font-size: 4mm;
      font-weight: 900;
      margin-bottom: 0.8mm;
    }
    .unlock-txt-top { color: #10B981; font-size: 2.55mm; font-weight: 900; letter-spacing: 0.3px; }
    .unlock-txt-mid { color: #FCD34D; font-size: 1.95mm; font-weight: 800; margin-top: 0.2mm; }
    .unlock-name-pill {
      margin-top: 0.8mm;
      background: rgba(255, 255, 255, 0.08);
      border: 1px solid rgba(255, 255, 255, 0.12);
      padding: 0.4mm 1.8mm;
      border-radius: 2mm;
      color: #FFFFFF;
      font-size: 1.85mm;
      font-weight: 700;
    }
    .step4-bullets-list {
      display: flex;
      flex-direction: column;
      gap: 1.1mm;
    }
    .b-item.green-type { color: #A7F3D0; }
    .b-item.green-type strong { color: #34D399; }

    /* ─── 4. POWER FEATURES HIGHLIGHT ─── */
    .features-section-box {
      position: relative;
      z-index: 10;
      background: linear-gradient(135deg, rgba(22, 27, 50, 0.95) 0%, rgba(13, 17, 34, 0.95) 100%);
      border: 1.1px solid rgba(255, 255, 255, 0.12);
      border-radius: 3mm;
      padding: 2.2mm 3mm;
      box-shadow: 0 4px 15px rgba(0, 0, 0, 0.4);
    }
    .feat-bar-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 1.4mm;
      border-bottom: 1px solid rgba(255, 255, 255, 0.08);
      padding-bottom: 0.8mm;
    }
    .feat-bar-title {
      font-family: 'Kanit', sans-serif;
      font-size: 3.2mm;
      font-weight: 800;
      color: #F8FAFC;
      display: flex;
      align-items: center;
      gap: 1.5mm;
    }
    .feat-bar-sub {
      font-size: 2.4mm;
      color: #94A3B8;
    }

    .feat-3col-grid {
      display: grid;
      grid-template-columns: 1.25fr 1fr 1fr;
      gap: 2.6mm;
    }
    .feat-card-col {
      background: rgba(0, 0, 0, 0.4);
      border: 1px solid rgba(255, 255, 255, 0.06);
      border-radius: 2mm;
      padding: 1.5mm 2mm;
      display: flex;
      flex-direction: column;
    }
    .feat-card-col.amber-bg {
      border-color: rgba(245, 158, 11, 0.4);
      background: linear-gradient(180deg, rgba(245, 158, 11, 0.15) 0%, rgba(15, 23, 42, 0.5) 100%);
    }
    .feat-head-tag {
      display: flex;
      align-items: center;
      gap: 1.2mm;
      font-size: 2.65mm;
      font-weight: 800;
      margin-bottom: 0.6mm;
    }
    .feat-head-tag.amber { color: #FBBF24; }
    .feat-head-tag.purple { color: #C084FC; }
    .feat-head-tag.green { color: #34D399; }
    .feat-body-desc {
      font-size: 2.25mm;
      line-height: 1.32;
      color: #CBD5E1;
    }
    .feat-body-desc strong { color: #FFFFFF; font-weight: 700; }

    /* ─── 5. FOOTER & LINE SUPPORT BAR (Fixed Text Colon) ─── */
    .footer-section-box {
      position: relative;
      z-index: 10;
      border-top: 1.1px solid rgba(255, 255, 255, 0.1);
      padding-top: 1.8mm;
      display: flex;
      flex-direction: column;
      gap: 1.6mm;
    }
    .footer-top-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .dept-info-col {
      display: flex;
      flex-direction: column;
    }
    .dept-main-name {
      font-size: 2.9mm;
      font-weight: 800;
      color: #F8FAFC;
    }
    .dept-sub-desc {
      font-size: 2.35mm;
      color: #94A3B8;
      margin-top: 0.1mm;
    }
    .sys-badge-group {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
    }
    .sys-pill-tag {
      background: linear-gradient(90deg, #7C3AED, #DB2777);
      color: #FFFFFF;
      font-size: 2.3mm;
      font-weight: 800;
      padding: 0.4mm 2.2mm;
      border-radius: 3mm;
    }
    .sys-ver-tag {
      font-size: 1.85mm;
      color: #64748B;
      font-family: 'JetBrains Mono', monospace;
      margin-top: 0.1mm;
    }

    /* LINE Bug/Issue Contact Banner */
    .line-support-strip {
      background: linear-gradient(90deg, rgba(6, 199, 85, 0.18) 0%, rgba(15, 23, 42, 0.85) 50%, rgba(6, 199, 85, 0.18) 100%);
      border: 1.2px solid rgba(6, 199, 85, 0.45);
      border-radius: 2.2mm;
      padding: 1.4mm 3mm;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .line-contact-left {
      display: flex;
      align-items: center;
      gap: 2mm;
    }
    .line-icon-box {
      width: 5.8mm;
      height: 5.8mm;
      background: #06C755;
      border-radius: 1.6mm;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 0 8px rgba(6, 199, 85, 0.6);
      flex-shrink: 0;
    }
    .line-icon-box svg {
      width: 3.8mm;
      height: 3.8mm;
      fill: #FFFFFF;
    }
    .line-support-text {
      font-size: 2.6mm;
      color: #F1F5F9;
      font-weight: 600;
    }
    .line-support-text strong {
      color: #34D399;
      font-weight: 800;
    }
    .line-id-badge {
      background: #06C755;
      color: #FFFFFF;
      font-family: 'JetBrains Mono', 'Kanit', monospace;
      font-size: 2.65mm;
      font-weight: 800;
      padding: 0.6mm 2.6mm;
      border-radius: 1.6mm;
      letter-spacing: 0.35px;
      box-shadow: 0 2px 8px rgba(6, 199, 85, 0.5);
    }
  </style>
</head>
<body>

  <div class="poster-canvas">
    <div class="glow-1"></div>
    <div class="glow-2"></div>
    <div class="glow-3"></div>
    <div class="grid-pattern"></div>

    <!-- ────────────────── 1. HEADER ────────────────── -->
    <header class="header-box">
      <div class="univ-bar-row">
        <div class="univ-tag-title">
          <span class="univ-tag">มทร.พระนคร</span>
          <span class="univ-text">คณะครุศาสตร์อุตสาหกรรม มหาวิทยาลัยเทคโนโลยีราชมงคลพระนคร</span>
        </div>
        <div class="badge-iot">
          <span class="green-dot"></span>
          <span>IoT Multi-Room Door Access System</span>
        </div>
      </div>

      <div class="header-main-flex">
        <div class="brand-group">
          <div class="logo-cube">
            <svg viewBox="0 0 24 24">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              <circle cx="12" cy="16" r="1.5"/>
            </svg>
          </div>
          <div class="title-col">
            <h1 class="main-title-txt">SmartAccess DOOR</h1>
            <p class="sub-title-txt">คู่มือและแนะนำวิธีการใช้งาน <strong>ระบบควบคุมการเข้าออกห้องปฏิบัติการอัจฉริยะ</strong></p>
          </div>
        </div>

        <div class="badge-4steps">
          <div class="b-top">⚡ เข้าห้องเรียนง่ายใน 4 ขั้นตอน</div>
          <div class="b-bot">ไม่ต้องพกบัตร • ปลดล็อกผ่านมือถือ • ปลอดภัย 100%</div>
        </div>
      </div>
    </header>

    <!-- ────────────────── 2. INTRO GUIDE BANNER ────────────────── -->
    <div class="guide-banner-bar">
      <div class="guide-banner-left">
        <span class="guide-chip">GUIDE</span>
        <span>ขั้นตอนการขออนุญาตเข้าใช้ห้องปฏิบัติการเรียนการสอน</span>
      </div>
      <div class="guide-banner-right">
        บันทึก Log ถูกต้องตาม พ.ร.บ. คอมพิวเตอร์ฯ 2560 & มาตรฐาน PDPA
      </div>
    </div>

    <!-- ────────────────── 3. WORKFLOW STEPS ────────────────── -->
    <main class="workflow-wrap">

      <!-- STEP 1: SCAN DYNAMIC QR CODE -->
      <section class="card-shell purple-theme">
        <div class="card-header-flex">
          <div class="step-badge-group">
            <div class="step-ball">1</div>
            <h2 class="step-title-text">สแกน Dynamic QR หน้าห้องเรียน</h2>
          </div>
          <span class="step-tag-pill pink">สแกนผ่านกล้องมือถือ</span>
        </div>

        <div class="step1-content-grid">
          <!-- ESP32 LCD Mockup -->
          <div class="esp32-tft-screen">
            <div class="tft-top-bar">
              <span class="brand">SmartAccess DOOR</span>
              <span class="status">ACTIVE</span>
            </div>
            <div class="tft-body-row">
              <div class="tft-qr-holder">
                <img src="${qrDataUri}" alt="Dynamic QR Code">
              </div>
              <div class="tft-room-box">
                <div class="lbl">ห้องปฏิบัติการ</div>
                <div class="code">CE-401</div>
                <div class="sub">ห้องปฏิบัติการคอมฯ</div>
              </div>
            </div>
            <div class="tft-bot-bar">
              <span>มทร.พระนคร (ครุศาสตร์)</span>
              <span class="ip">192.168.2.49</span>
            </div>
          </div>

          <!-- Description & Bullets -->
          <div class="step1-text-box">
            <p class="step1-desc-p">
              ใช้<strong>กล้องถ่ายรูปของสมาร์ตโฟน</strong> สแกนภาพ QR Code ที่กำลังเคลื่อนไหวอยู่บนหน้าจอ LCD 3.2" หน้าห้องปฏิบัติการ แล้วแตะเปิดลิงก์เพื่อเข้าสู่ระบบ
            </p>
            <div class="bullet-container">
              <div class="b-item">
                <span class="ico">✦</span>
                <span><strong>Dynamic Token Security:</strong> รหัสเปลี่ยนทุก 60 วินาที ป้องกันการแคปรูปส่งต่อให้ผู้อื่น</span>
              </div>
              <div class="b-item">
                <span class="ico">✦</span>
                <span><strong>Room Isolated:</strong> ลิงก์ตรงเข้าสู่ห้องเรียนเป้าหมายอย่างแม่นยำ ไม่สับสนข้ามห้อง</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- STEP 2: FILL REGISTRATION (HERO SHOWCASE) -->
      <section class="card-shell purple-theme">
        <div class="card-header-flex">
          <div class="step-badge-group">
            <div class="step-ball">2</div>
            <h2 class="step-title-text">กรอกข้อมูลผู้ขอเข้าใช้งาน (ภาพหน้าจอระบบจริง)</h2>
          </div>
          <span class="step-tag-pill pink">SmartAccess Live Form</span>
        </div>

        <div class="step2-showcase-grid">
          <!-- Real Mobile Phone Screenshot -->
          <div class="phone-mockup-wrap">
            <div class="phone-island-notch"></div>
            <div class="phone-inner-screen-box">
              <img src="${imgMobileForm}" alt="SmartAccess Mobile Registration">
            </div>
          </div>

          <!-- Real Data Fields Summary -->
          <div class="form-summary-list">
            <div class="form-field-card">
              <span class="field-key">คำนำหน้า และ ชื่อ-สกุล:</span>
              <span class="field-val">นายชานนท์ สุขสวัสดิ์</span>
            </div>
            <div class="form-field-card">
              <span class="field-key">รหัสประจำตัวนักศึกษา:</span>
              <span class="field-val">076158050650-8</span>
            </div>
            <div class="form-field-card">
              <span class="field-key">ระดับชั้นปี:</span>
              <span class="field-val">นักศึกษาชั้นปีที่ 3</span>
            </div>
            <div class="form-field-card">
              <span class="field-key">คณะ:</span>
              <span class="field-val">คณะครุศาสตร์อุตสาหกรรม</span>
            </div>
            <div class="form-field-card">
              <span class="field-key">สาขาวิชา:</span>
              <span class="field-val">คอมพิวเตอร์และเทคโนโลยีฯ</span>
            </div>
          </div>

          <!-- Intelligent Auto-Fill Card -->
          <div class="autofill-banner-card">
            <div>
              <div class="af-top-head">
                <span>🎓 ระบบ Intelligent Auto-fill</span>
              </div>
              <p class="af-text-body">
                เพียงพิมพ์<strong>รหัสนักศึกษา</strong> ระบบจะค้นหาและดึงประวัติคณะ สาขา และชื่อเดิมมาเติมให้อัตโนมัติทันที
              </p>
            </div>
            <div class="af-time-badge">⚡ ลดเวลาลงทะเบียนเหลือไม่ถึง 5 วินาที</div>
          </div>
        </div>
      </section>

      <!-- STEPS 3 & 4 (BALANCED 2 COLUMNS) -->
      <div class="steps-3-4-grid">

        <!-- STEP 3: SUBMIT & QUEUE -->
        <section class="card-shell purple-theme">
          <div class="card-header-flex">
            <div class="step-badge-group">
              <div class="step-ball">3</div>
              <h2 class="step-title-text">กดยืนยันส่งข้อมูลคำขอ</h2>
            </div>
            <span class="step-tag-pill pink">Real-Time Queue</span>
          </div>

          <div class="step3-flex-col">
            <div class="btn-submit-gradient">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="22" y1="2" x2="11" y2="13"/>
                <polygon points="22 2 15 22 11 13 2 9 22 2"/>
              </svg>
              <span>ส่งข้อมูลขอเปิดประตูผ่านระบบ</span>
            </div>

            <div class="live-status-box">
              <div class="live-left-tag">
                <span class="pulse-dot-blue"></span>
                <span>สถานะ: กำลังรอการอนุมัติ (Live)</span>
              </div>
              <span style="color:#94A3B8; font-size:2.1mm;">เช็กคิวอัตโนมัติทุก 3 วินาที</span>
            </div>

            <div class="step3-bullets-list">
              <div class="b-item">
                <span class="ico">✦</span>
                <span><strong>Dashboard Alert:</strong> คำขอแจ้งเตือนขึ้นหน้าจออาจารย์ทันที</span>
              </div>
              <div class="b-item">
                <span class="ico">✦</span>
                <span><strong>ไม่ต้องรีเฟรชหน้าเว็บ:</strong> ระบบเชื่อมต่อ Real-time Stream</span>
              </div>
            </div>
          </div>
        </section>

        <!-- STEP 4: ACCESS GRANTED -->
        <section class="card-shell green-theme">
          <div class="card-header-flex">
            <div class="step-badge-group">
              <div class="step-ball green-b">4</div>
              <h2 class="step-title-text" style="color:#34D399;">อนุมัติสำเร็จ ประตูเปิดแล้ว!</h2>
            </div>
            <span class="step-tag-pill green">Access Granted</span>
          </div>

          <div class="step4-flex-grid">
            <!-- Unlocked LCD Box -->
            <div class="unlock-lcd-widget">
              <div class="unlock-icon-circle">✓</div>
              <div class="unlock-txt-top">ACCESS GRANTED</div>
              <div class="unlock-txt-mid">🔓 DOOR UNLOCKED</div>
              <div class="unlock-name-pill">นายชานนท์ สุขสวัสดิ์</div>
            </div>

            <!-- Benefits -->
            <div class="step4-bullets-list">
              <div class="b-item green-type">
                <span style="color:#10B981;">✓</span>
                <span><strong>Auto Unlock:</strong> ปลดล็อกกลอนแม่เหล็ก 5 วินาที</span>
              </div>
              <div class="b-item green-type">
                <span style="color:#10B981;">✓</span>
                <span><strong>Audit Logged:</strong> บันทึกประวัติเวลาเข้าเรียนโปร่งใส</span>
              </div>
              <div class="b-item green-type">
                <span style="color:#10B981;">✓</span>
                <span><strong>Discord Bot:</strong> แจ้งเตือนห้องแชตเจ้าหน้าที่ทันที</span>
              </div>
            </div>
          </div>
        </section>

      </div>

    </main>

    <!-- ────────────────── 4. POWER FEATURES ────────────────── -->
    <section class="features-section-box">
      <div class="feat-bar-header">
        <div class="feat-bar-title">
          <span>⚡ สิทธิพิเศษและฟังก์ชันอำนวยความสะดวก</span>
        </div>
        <div class="feat-bar-sub">ออกแบบเพื่อความสะดวก รวดเร็ว และความปลอดภัยสูงสุดของนักศึกษา</div>
      </div>

      <div class="feat-3col-grid">
        <!-- Feature 1: Bypass 5 mins -->
        <div class="feat-card-col amber-bg">
          <div class="feat-head-tag amber">
            <span>⚡ สิทธิ์ Bypass อัตโนมัติ 5 นาที</span>
          </div>
          <p class="feat-body-desc">
            หากได้รับอนุมัติแล้วออกนอกห้องชั่วคราว <strong>สแกน QR หน้าห้องเดิมซ้ำภายใน 5 นาที</strong> ประตูจะปลดล็อกทันที <strong>ไม่ต้องกรอกข้อมูลใหม่และไม่ต้องรออนุมัติซ้ำ!</strong>
          </p>
        </div>

        <!-- Feature 2: Auto-Fill -->
        <div class="feat-card-col">
          <div class="feat-head-tag purple">
            <span>🧠 Intelligent Auto-fill</span>
          </div>
          <p class="feat-body-desc">
            ระบบจดจำประวัติเดิม เพียงกรอกรหัสนักศึกษา ข้อมูลคณะและสาขาจะถูกเติมให้ทันที ลดเวลาลงทะเบียนเหลือไม่ถึง <strong>5 วินาที</strong>
          </p>
        </div>

        <!-- Feature 3: Security & Privacy -->
        <div class="feat-card-col">
          <div class="feat-head-tag green">
            <span>🛡️ มาตรฐานความปลอดภัย PDPA</span>
          </div>
          <p class="feat-body-desc">
            จัดเก็บบันทึกประวัติการเข้า-ออกห้องเรียนใน Cloud เข้ารหัสปลอดภัย และเก็บ Log จราจร 90 วัน สอดคล้องตาม <strong>พ.ร.บ. คอมพิวเตอร์ฯ 2560</strong>
          </p>
        </div>
      </div>
    </section>

    <!-- ────────────────── 5. FOOTER & LINE SUPPORT BAR ────────────────── -->
    <footer class="footer-section-box">
      <div class="footer-top-row">
        <div class="dept-info-col">
          <div class="dept-main-name">คณะครุศาสตร์อุตสาหกรรม มหาวิทยาลัยเทคโนโลยีราชมงคลพระนคร</div>
          <div class="dept-sub-desc">สาขาวิชาวิศวกรรมคอมพิวเตอร์และเทคโนโลยีสารสนเทศ • อาคารปฏิบัติการเรียนการสอน</div>
        </div>

        <div class="sys-badge-group">
          <span class="sys-pill-tag">SmartAccess IoT System</span>
          <span class="sys-ver-tag">v2.4.0 • Enterprise Edition</span>
        </div>
      </div>

      <!-- LINE Bug/Issue Contact Banner -->
      <div class="line-support-strip">
        <div class="line-contact-left">
          <div class="line-icon-box">
            <svg viewBox="0 0 24 24">
              <path d="M24 10.304c0-5.369-5.383-9.738-12-9.738-6.616 0-12 4.369-12 9.738 0 4.814 4.269 8.846 10.019 9.578.391.084.922.258 1.057.592.121.303.079.777.039 1.085l-.171 1.027c-.053.303-.242 1.186 1.039.647 1.281-.54 6.911-4.069 9.428-6.967 1.739-1.907 2.589-3.838 2.589-5.962zm-15.75 2.502h-2.186c-.276 0-.5-.224-.5-.5v-4.5c0-.276.224-.5.5-.5s.5.224.5.5v4h1.686c.276 0 .5.224.5.5s-.224.5-.5.5zm3.625 0c-.276 0-.5-.224-.5-.5v-4.5c0-.276.224-.5.5-.5s.5.224.5.5v4.5c0 .276-.224.5-.5.5zm5.542 0c-.276 0-.5-.224-.5-.5v-2.833l-2.458 3.125c-.092.117-.234.188-.385.196-.015.001-.03.001-.045.001-.137 0-.27-.056-.366-.153-.122-.122-.188-.288-.188-.461v-4.475c0-.276.224-.5.5-.5s.5.224.5.5v2.809l2.438-3.1c.142-.181.36-.285.59-.279.231.006.444.123.571.312.06.091.093.197.093.308v4.557c0 .276-.224.5-.5.5zm4.833-3.625c0 .276-.224.5-.5.5h-2.083v1.125h2.083c.276 0 .5.224.5.5s-.224.5-.5.5h-2.583c-.276 0-.5-.224-.5-.5v-4.5c0-.276.224-.5.5-.5h2.583c.276 0 .5.224.5.5s-.224.5-.5.5h-2.083v1.375h2.083c.276 0 .5.224.5.5z"/>
            </svg>
          </div>
          <span class="line-support-text">หากพบเจอบัคหรือมีปัญหาในการใช้งาน กรุณาติดต่อไลน์</span>
        </div>
        <div class="line-id-badge">LINE ID : Puripong_prp</div>
      </div>
    </footer>

  </div>

</body>
</html>`;

  const htmlPath = path.join(ROOT_DIR, 'smartaccess_poster_a4.html');
  fs.writeFileSync(htmlPath, html, 'utf8');
  console.log(`Saved Clean HTML poster: ${htmlPath}`);

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

    console.log('=== Flawless Clean Poster Generated Successfully! ===');
  } catch (err) {
    console.error('Error generating clean poster:', err);
  } finally {
    await browser.close();
  }
}

buildPoster();
