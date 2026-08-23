const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const ASSETS_DIR = path.join(__dirname, '..', 'poster_assets');
const OUTPUT_DIR = path.join(__dirname, '..');

// Helper to convert local image file to base64 data URI
function toBase64(filename) {
  const filePath = path.join(ASSETS_DIR, filename);
  if (!fs.existsSync(filePath)) {
    console.warn(`File not found: ${filePath}`);
    return '';
  }
  const ext = path.extname(filename).replace('.', '');
  const data = fs.readFileSync(filePath).toString('base64');
  return `data:image/${ext};base64,${data}`;
}

async function buildPoster() {
  console.log('Reading real project captured assets...');
  const imgMobileForm = toBase64('screen_mobile_form_perfect.png');
  const imgCardForm = toBase64('screen_card_perfect.png');
  const imgEsp32QR = toBase64('screen_esp32_device_tft.png');
  const imgEsp32Approved = toBase64('screen_esp32_approved_tft.png');

  console.log('Generating A4 Poster HTML...');
  const posterHtml = `<!DOCTYPE html>
<html lang="th">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>SmartAccess — โปสเตอร์แนะนำวิธีการใช้งานระบบควบคุมประตูอัจฉริยะ (A4)</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Kanit:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,400&family=Plus+Jakarta+Sans:wght@500;700;800&family=Prompt:wght@400;500;600;700;800&family=JetBrains+Mono:wght@600;700&display=swap" rel="stylesheet">
  <style>
    /* ─── RESET & A4 PAGE GEOMETRY ─── */
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
      background: #080A12;
      font-family: 'Prompt', 'Kanit', sans-serif;
      color: #FFFFFF;
      overflow: hidden;
      -webkit-font-smoothing: antialiased;
    }

    /* ─── POSTER CONTAINER (210mm x 297mm) ─── */
    .poster-container {
      width: 210mm;
      height: 297mm;
      position: relative;
      background: radial-gradient(120% 80% at 50% 0%, #1A1238 0%, #0C0E1E 45%, #07080F 100%);
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      padding: 10mm 12mm 9mm 12mm;
      overflow: hidden;
    }

    /* ─── BACKGROUND GLOW DECORATIONS ─── */
    .bg-glow-top-left {
      position: absolute;
      top: -60mm;
      left: -50mm;
      width: 130mm;
      height: 130mm;
      background: radial-gradient(circle, rgba(124, 58, 237, 0.35) 0%, rgba(124, 58, 237, 0) 70%);
      pointer-events: none;
    }
    .bg-glow-top-right {
      position: absolute;
      top: -40mm;
      right: -50mm;
      width: 120mm;
      height: 120mm;
      background: radial-gradient(circle, rgba(219, 39, 119, 0.25) 0%, rgba(219, 39, 119, 0) 70%);
      pointer-events: none;
    }
    .bg-glow-bottom-right {
      position: absolute;
      bottom: -60mm;
      right: -40mm;
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
      opacity: 0.6;
    }

    /* ─── HEADER SECTION ─── */
    .poster-header {
      position: relative;
      z-index: 10;
      border-bottom: 1.5px solid rgba(255, 255, 255, 0.08);
      padding-bottom: 3.5mm;
    }
    .top-meta-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 2.5mm;
    }
    .univ-tag {
      display: flex;
      align-items: center;
      gap: 2.5mm;
      font-size: 3.2mm;
      font-weight: 700;
      color: #E2E8F0;
      letter-spacing: 0.2px;
    }
    .univ-badge {
      background: linear-gradient(135deg, rgba(124, 58, 237, 0.35), rgba(219, 39, 119, 0.25));
      border: 1px solid rgba(192, 132, 252, 0.4);
      padding: 0.8mm 2.8mm;
      border-radius: 4mm;
      color: #F3E8FF;
      font-size: 2.8mm;
      font-weight: 800;
    }
    .tech-pill {
      background: rgba(16, 185, 129, 0.15);
      border: 1px solid rgba(16, 185, 129, 0.4);
      color: #34D399;
      font-size: 2.7mm;
      font-weight: 700;
      padding: 0.8mm 2.8mm;
      border-radius: 4mm;
      display: flex;
      align-items: center;
      gap: 1.5mm;
    }
    .tech-pill-dot {
      width: 1.8mm;
      height: 1.8mm;
      background: #10B981;
      border-radius: 50%;
      box-shadow: 0 0 4px #10B981;
    }

    .main-title-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 4mm;
    }
    .brand-logo-title {
      display: flex;
      align-items: center;
      gap: 3.5mm;
    }
    .app-icon {
      width: 12mm;
      height: 12mm;
      background: linear-gradient(135deg, #7C3AED 0%, #DB2777 100%);
      border-radius: 3.2mm;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 14px rgba(124, 58, 237, 0.45);
      border: 1px solid rgba(255, 255, 255, 0.2);
      flex-shrink: 0;
    }
    .app-icon svg {
      width: 7.5mm;
      height: 7.5mm;
      fill: none;
      stroke: #FFFFFF;
      stroke-width: 2.2;
    }
    .title-texts {
      display: flex;
      flex-direction: column;
    }
    .brand-title {
      font-family: 'Kanit', sans-serif;
      font-size: 7.2mm;
      font-weight: 900;
      letter-spacing: -0.2px;
      line-height: 1.05;
      background: linear-gradient(90deg, #FFFFFF 0%, #F3E8FF 60%, #FBCFE8 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    .sub-brand-title {
      font-size: 3.5mm;
      font-weight: 600;
      color: #94A3B8;
      margin-top: 0.6mm;
    }
    .sub-brand-title strong {
      color: #CBD5E1;
      font-weight: 700;
    }
    .banner-highlight {
      background: linear-gradient(135deg, rgba(124, 58, 237, 0.2) 0%, rgba(219, 39, 119, 0.15) 100%);
      border: 1px solid rgba(168, 85, 247, 0.35);
      padding: 2mm 3.8mm;
      border-radius: 2.8mm;
      text-align: right;
    }
    .banner-highlight .head {
      font-size: 3.4mm;
      font-weight: 800;
      color: #F472B6;
    }
    .banner-highlight .desc {
      font-size: 2.7mm;
      color: #CBD5E1;
      margin-top: 0.4mm;
    }

    /* ─── HERO INTRO BANNER ─── */
    .hero-banner {
      position: relative;
      z-index: 10;
      margin-top: 2.5mm;
      background: linear-gradient(90deg, rgba(15, 23, 42, 0.8) 0%, rgba(30, 27, 75, 0.8) 100%);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 3mm;
      padding: 2.2mm 4mm;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .hero-banner-title {
      font-size: 3.8mm;
      font-weight: 800;
      color: #F8FAFC;
      display: flex;
      align-items: center;
      gap: 2mm;
    }
    .hero-banner-title span.tag {
      background: #7C3AED;
      color: #FFF;
      font-size: 2.6mm;
      font-weight: 800;
      padding: 0.6mm 2.2mm;
      border-radius: 1.8mm;
    }
    .hero-banner-sub {
      font-size: 2.9mm;
      color: #94A3B8;
    }

    /* ─── MAIN 4-STEP WORKFLOW GRID ─── */
    .workflow-section {
      position: relative;
      z-index: 10;
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 3.8mm;
      margin-top: 2.8mm;
    }

    /* Step Card Base */
    .step-card {
      background: rgba(15, 23, 42, 0.65);
      backdrop-filter: blur(10px);
      border: 1.2px solid rgba(255, 255, 255, 0.08);
      border-radius: 3.5mm;
      padding: 3mm 3.2mm 3.2mm 3.2mm;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      position: relative;
      overflow: hidden;
    }
    .step-card.active-step {
      border-color: rgba(124, 58, 237, 0.45);
      background: linear-gradient(180deg, rgba(26, 20, 50, 0.75) 0%, rgba(13, 17, 34, 0.75) 100%);
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.4);
    }
    .step-card.highlight-green {
      border-color: rgba(16, 185, 129, 0.45);
      background: linear-gradient(180deg, rgba(6, 40, 28, 0.75) 0%, rgba(10, 24, 20, 0.75) 100%);
    }

    .step-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 2mm;
    }
    .step-num-badge {
      display: flex;
      align-items: center;
      gap: 1.8mm;
    }
    .num-circle {
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
      box-shadow: 0 2px 8px rgba(124, 58, 237, 0.4);
    }
    .num-circle.green {
      background: linear-gradient(135deg, #059669, #10B981);
      box-shadow: 0 2px 8px rgba(16, 185, 129, 0.4);
    }
    .step-title {
      font-family: 'Kanit', sans-serif;
      font-size: 3.9mm;
      font-weight: 800;
      color: #F8FAFC;
      letter-spacing: 0.1px;
    }
    .step-badge-pill {
      font-size: 2.3mm;
      font-weight: 700;
      padding: 0.6mm 2mm;
      border-radius: 2mm;
      background: rgba(255, 255, 255, 0.08);
      color: #94A3B8;
      border: 1px solid rgba(255, 255, 255, 0.06);
    }
    .step-badge-pill.pink {
      background: rgba(219, 39, 119, 0.18);
      color: #F472B6;
      border-color: rgba(219, 39, 119, 0.35);
    }
    .step-badge-pill.green {
      background: rgba(16, 185, 129, 0.18);
      color: #34D399;
      border-color: rgba(16, 185, 129, 0.35);
    }

    .step-desc {
      font-size: 2.75mm;
      line-height: 1.38;
      color: #CBD5E1;
      margin-bottom: 2.2mm;
    }
    .step-desc strong {
      color: #FFFFFF;
      font-weight: 700;
    }

    /* Step 1 Visual (ESP32 LCD) */
    .step1-visual {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 3mm;
      background: #040508;
      border-radius: 2.5mm;
      padding: 2mm;
      border: 1px solid rgba(255, 255, 255, 0.08);
    }
    .esp32-frame {
      width: 48mm;
      border-radius: 2mm;
      overflow: hidden;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.6);
      border: 1px solid #1E293B;
    }
    .esp32-frame img {
      width: 100%;
      height: auto;
      display: block;
    }
    .step1-bullets {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 1.2mm;
    }
    .bullet-item {
      display: flex;
      align-items: flex-start;
      gap: 1.4mm;
      font-size: 2.55mm;
      color: #94A3B8;
      line-height: 1.3;
    }
    .bullet-icon {
      color: #38BDF8;
      font-size: 3mm;
      line-height: 1;
    }
    .bullet-item strong {
      color: #E2E8F0;
    }

    /* Step 2 Visual (Mobile Phone Mockup with REAL screenshot) */
    .step2-layout {
      display: flex;
      gap: 3.2mm;
      align-items: stretch;
    }
    .phone-mockup-wrap {
      width: 38mm;
      flex-shrink: 0;
      background: #000000;
      border-radius: 3.5mm;
      border: 1.5px solid #334155;
      padding: 1.2mm 1mm;
      box-shadow: 0 6px 18px rgba(0, 0, 0, 0.7), 0 0 12px rgba(124, 58, 237, 0.3);
      position: relative;
    }
    .phone-notch {
      width: 12mm;
      height: 1.6mm;
      background: #1E293B;
      border-radius: 1mm;
      margin: 0 auto 1.2mm auto;
    }
    .phone-screen {
      width: 100%;
      border-radius: 2.2mm;
      overflow: hidden;
      border: 1px solid rgba(255, 255, 255, 0.05);
    }
    .phone-screen img {
      width: 100%;
      height: auto;
      display: block;
    }
    .step2-info-col {
      flex: 1;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }
    .input-guide-box {
      background: rgba(0, 0, 0, 0.4);
      border: 1px solid rgba(255, 255, 255, 0.06);
      border-radius: 2.2mm;
      padding: 1.8mm 2.4mm;
      margin-bottom: 1.5mm;
    }
    .guide-field-row {
      display: flex;
      align-items: center;
      gap: 1.4mm;
      font-size: 2.5mm;
      color: #94A3B8;
      margin-bottom: 0.8mm;
    }
    .guide-field-row:last-child {
      margin-bottom: 0;
    }
    .field-tag {
      background: rgba(124, 58, 237, 0.25);
      color: #DDD6FE;
      font-weight: 700;
      padding: 0.4mm 1.6mm;
      border-radius: 1mm;
      font-size: 2.3mm;
      flex-shrink: 0;
    }
    .field-val {
      color: #F8FAFC;
      font-weight: 600;
    }
    .autofill-feature-card {
      background: linear-gradient(135deg, rgba(124, 58, 237, 0.22) 0%, rgba(219, 39, 119, 0.15) 100%);
      border: 1px dashed #A855F7;
      border-radius: 2mm;
      padding: 1.6mm 2.2mm;
      display: flex;
      align-items: center;
      gap: 2mm;
    }
    .autofill-icon {
      font-size: 3.8mm;
      line-height: 1;
    }
    .autofill-text-title {
      font-size: 2.7mm;
      font-weight: 800;
      color: #F3E8FF;
    }
    .autofill-text-sub {
      font-size: 2.3mm;
      color: #CBD5E1;
      line-height: 1.25;
      margin-top: 0.3mm;
    }

    /* Step 3 Visual (Real-Time Queue & Submit Button) */
    .step3-visual {
      background: #060810;
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 2.5mm;
      padding: 2.2mm 2.8mm;
      display: flex;
      flex-direction: column;
      gap: 1.8mm;
    }
    .submit-btn-preview {
      background: linear-gradient(135deg, #7C3AED 0%, #DB2777 100%);
      border-radius: 2.2mm;
      padding: 2mm 3mm;
      text-align: center;
      color: #FFFFFF;
      font-weight: 800;
      font-size: 3.1mm;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 2mm;
      box-shadow: 0 4px 12px rgba(124, 58, 237, 0.4);
    }
    .queue-status-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      background: rgba(255, 255, 255, 0.04);
      border-radius: 1.8mm;
      padding: 1.4mm 2.2mm;
      font-size: 2.55mm;
      color: #CBD5E1;
    }
    .queue-status-row .ping {
      display: flex;
      align-items: center;
      gap: 1.4mm;
      color: #38BDF8;
      font-weight: 700;
    }

    /* Step 4 Visual (Door Unlock Status Screen) */
    .step4-visual {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 3mm;
      background: #031008;
      border-radius: 2.5mm;
      padding: 2mm;
      border: 1px solid rgba(16, 185, 129, 0.3);
    }
    .unlock-tft-frame {
      width: 46mm;
      border-radius: 2mm;
      overflow: hidden;
      box-shadow: 0 4px 14px rgba(16, 185, 129, 0.35);
      border: 1px solid #059669;
    }
    .unlock-tft-frame img {
      width: 100%;
      height: auto;
      display: block;
    }
    .step4-bullets {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 1.4mm;
    }
    .bullet-item.green {
      color: #A7F3D0;
    }
    .bullet-item.green strong {
      color: #34D399;
    }

    /* ─── POWER FEATURES HIGHLIGHT BAR (3 COLUMNS) ─── */
    .features-highlight-section {
      position: relative;
      z-index: 10;
      margin-top: 2.8mm;
      background: linear-gradient(135deg, rgba(20, 24, 45, 0.9) 0%, rgba(13, 16, 32, 0.9) 100%);
      border: 1.2px solid rgba(255, 255, 255, 0.1);
      border-radius: 3.5mm;
      padding: 2.8mm 3.5mm;
      box-shadow: 0 4px 18px rgba(0, 0, 0, 0.5);
    }
    .features-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 2mm;
      border-bottom: 1px solid rgba(255, 255, 255, 0.06);
      padding-bottom: 1.4mm;
    }
    .features-title {
      font-family: 'Kanit', sans-serif;
      font-size: 3.4mm;
      font-weight: 800;
      color: #F8FAFC;
      display: flex;
      align-items: center;
      gap: 1.8mm;
    }
    .features-sub {
      font-size: 2.6mm;
      color: #94A3B8;
      font-weight: 500;
    }
    .features-grid {
      display: grid;
      grid-template-columns: 1.2fr 1fr 1fr;
      gap: 3mm;
    }
    .feature-box {
      background: rgba(0, 0, 0, 0.35);
      border: 1px solid rgba(255, 255, 255, 0.05);
      border-radius: 2.4mm;
      padding: 2mm 2.4mm;
      display: flex;
      flex-direction: column;
    }
    .feature-box.special-orange {
      border-color: rgba(245, 158, 11, 0.35);
      background: linear-gradient(180deg, rgba(245, 158, 11, 0.12) 0%, rgba(15, 23, 42, 0.4) 100%);
    }
    .feature-head {
      display: flex;
      align-items: center;
      gap: 1.6mm;
      font-size: 2.95mm;
      font-weight: 800;
      color: #FFFFFF;
      margin-bottom: 1mm;
    }
    .feature-head.orange {
      color: #FBBF24;
    }
    .feature-head.purple {
      color: #C084FC;
    }
    .feature-head.green {
      color: #34D399;
    }
    .feature-text {
      font-size: 2.45mm;
      line-height: 1.35;
      color: #CBD5E1;
    }
    .feature-text strong {
      color: #FFF;
      font-weight: 700;
    }

    /* ─── FOOTER & SUPPORT SECTION ─── */
    .poster-footer {
      position: relative;
      z-index: 10;
      border-top: 1.5px solid rgba(255, 255, 255, 0.08);
      padding-top: 2.8mm;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .footer-left {
      display: flex;
      flex-direction: column;
      gap: 0.6mm;
    }
    .footer-univ {
      font-size: 3.1mm;
      font-weight: 800;
      color: #F8FAFC;
    }
    .footer-faculty {
      font-size: 2.6mm;
      color: #94A3B8;
    }
    .footer-center {
      background: rgba(255, 255, 255, 0.04);
      border: 1px solid rgba(255, 255, 255, 0.06);
      border-radius: 2mm;
      padding: 1.4mm 3mm;
      text-align: center;
    }
    .footer-notice-title {
      font-size: 2.5mm;
      font-weight: 700;
      color: #F43F5E;
      display: flex;
      align-items: center;
      gap: 1mm;
      justify-content: center;
    }
    .footer-notice-text {
      font-size: 2.25mm;
      color: #CBD5E1;
      margin-top: 0.3mm;
    }
    .footer-right {
      display: flex;
      align-items: center;
      gap: 2.5mm;
      text-align: right;
    }
    .footer-tag-wrap {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
    }
    .footer-badge-tech {
      background: linear-gradient(90deg, #7C3AED, #DB2777);
      color: #FFFFFF;
      font-size: 2.5mm;
      font-weight: 800;
      padding: 0.8mm 2.5mm;
      border-radius: 3mm;
      letter-spacing: 0.3px;
    }
    .footer-version {
      font-size: 2.2mm;
      color: #64748B;
      font-family: 'JetBrains Mono', monospace;
      margin-top: 0.5mm;
    }
  </style>
</head>
<body>

  <div class="poster-container">
    <!-- Ambient Background Glows -->
    <div class="bg-glow-top-left"></div>
    <div class="bg-glow-top-right"></div>
    <div class="bg-glow-bottom-right"></div>
    <div class="grid-pattern"></div>

    <!-- ────────────────── HEADER ────────────────── -->
    <header class="poster-header">
      <div class="top-meta-bar">
        <div class="univ-tag">
          <span class="univ-badge">มทร.พระนคร</span>
          <span>คณะครุศาสตร์อุตสาหกรรม มหาวิทยาลัยเทคโนโลยีราชมงคลพระนคร</span>
        </div>
        <div class="tech-pill">
          <span class="tech-pill-dot"></span>
          <span>IoT Multi-Room Door Access</span>
        </div>
      </div>

      <div class="main-title-row">
        <div class="brand-logo-title">
          <div class="app-icon">
            <svg viewBox="0 0 24 24">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              <circle cx="12" cy="16" r="1.5"/>
            </svg>
          </div>
          <div class="title-texts">
            <div class="brand-title">SmartAccess DOOR ACCESS</div>
            <div class="sub-brand-title">
              แนะนำวิธีการใช้งาน <strong>ระบบควบคุมการเข้าออกห้องปฏิบัติการอัจฉริยะ</strong>
            </div>
          </div>
        </div>

        <div class="banner-highlight">
          <div class="head">⚡ เข้าห้องเรียนง่ายใน 4 ขั้นตอน</div>
          <div class="desc">ไม่ต้องพกบัตร • ปลดล็อกผ่านมือถือ • ปลอดภัย 100%</div>
        </div>
      </div>
    </header>

    <!-- ────────────────── INTRO BAR ────────────────── -->
    <div class="hero-banner">
      <div class="hero-banner-title">
        <span class="tag">GUIDE</span>
        <span>ขั้นตอนการขออนุญาตเข้าใช้ห้องปฏิบัติการเรียนการสอน (CE-401 / CE-402)</span>
      </div>
      <div class="hero-banner-sub">
        ระบบบันทึก Log ถูกต้องตาม พ.ร.บ. คอมพิวเตอร์ฯ 2560 & มาตรฐาน PDPA
      </div>
    </div>

    <!-- ────────────────── MAIN 4 STEPS WORKFLOW ────────────────── -->
    <main class="workflow-section">

      <!-- STEP 1: SCAN QR CODE -->
      <section class="step-card active-step">
        <div>
          <div class="step-header">
            <div class="step-num-badge">
              <div class="num-circle">1</div>
              <div class="step-title">สแกน Dynamic QR หน้าห้อง</div>
            </div>
            <span class="step-badge-pill pink">สแกนผ่านมือถือ</span>
          </div>

          <p class="step-desc">
            ใช้<strong>กล้องถ่ายรูปมือถือ</strong>สแกนภาพ QR Code บนจอ LCD 3.2" หน้าห้องปฏิบัติการ (QR Code จะเปลี่ยนอัตโนมัติทุก 60 วินาทีเพื่อความปลอดภัย)
          </p>
        </div>

        <div class="step1-visual">
          <div class="esp32-frame">
            <img src="${imgEsp32QR}" alt="ESP32 Dynamic QR Screen">
          </div>
          <div class="step1-bullets">
            <div class="bullet-item">
              <span class="bullet-icon">✦</span>
              <span><strong>Dynamic Token:</strong> ป้องกันการแคปรูปส่งต่อ</span>
            </div>
            <div class="bullet-item">
              <span class="bullet-icon">✦</span>
              <span><strong>Room Code:</strong> ระบุห้องเป้าหมายแม่นยำ (CE-401)</span>
            </div>
            <div class="bullet-item">
              <span class="bullet-icon">✦</span>
              <span><strong>แตะลิงก์:</strong> เพื่อเปิดหน้าลงทะเบียนทันที</span>
            </div>
          </div>
        </div>
      </section>

      <!-- STEP 2: FILL REGISTRATION DETAILS (REAL SCREENSHOT) -->
      <section class="step-card active-step">
        <div>
          <div class="step-header">
            <div class="step-num-badge">
              <div class="num-circle">2</div>
              <div class="step-title">กรอกข้อมูลผู้ขอเข้าใช้งาน</div>
            </div>
            <span class="step-badge-pill pink">แบบฟอร์มยืนยันตัวตน</span>
          </div>

          <p class="step-desc">
            กรอก<strong>คำนำหน้า ชื่อ นามสกุล รหัสนักศึกษา</strong> เลือกชั้นปี คณะ และสาขาวิชาของคุณให้ครบถ้วนเพื่อส่งคำขอเข้าใช้งาน
          </p>
        </div>

        <div class="step2-layout">
          <!-- Real Mobile Capture with Phone Frame -->
          <div class="phone-mockup-wrap">
            <div class="phone-notch"></div>
            <div class="phone-screen">
              <img src="${imgMobileForm}" alt="SmartAccess Mobile Registration Form">
            </div>
          </div>

          <!-- Form Details & Auto-Fill Explanations -->
          <div class="step2-info-col">
            <div class="input-guide-box">
              <div class="guide-field-row">
                <span class="field-tag">ชื่อ-สกุล</span>
                <span class="field-val">นายชานนท์ สุขสวัสดิ์</span>
              </div>
              <div class="guide-field-row">
                <span class="field-tag">รหัส นศ.</span>
                <span class="field-val">076158050650-8</span>
              </div>
              <div class="guide-field-row">
                <span class="field-tag">ชั้นปี</span>
                <span class="field-val">ชั้นปีที่ 3</span>
              </div>
              <div class="guide-field-row">
                <span class="field-tag">คณะ</span>
                <span class="field-val">คณะครุศาสตร์อุตสาหกรรม</span>
              </div>
              <div class="guide-field-row">
                <span class="field-tag">สาขาวิชา</span>
                <span class="field-val">คอมพิวเตอร์และเทคโนโลยีฯ</span>
              </div>
            </div>

            <!-- Intelligent Auto-Fill Feature Badge -->
            <div class="autofill-feature-card">
              <div class="autofill-icon">🎓</div>
              <div>
                <div class="autofill-text-title">ระบบ Intelligent Auto-fill</div>
                <div class="autofill-text-sub">กรอกรหัสนักศึกษา ระบบจะดึงประวัติ คณะ/สาขา เดิมให้อัตโนมัติทันที ไม่ต้องพิมพ์ซ้ำ!</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- STEP 3: SUBMIT REQUEST -->
      <section class="step-card active-step">
        <div>
          <div class="step-header">
            <div class="step-num-badge">
              <div class="num-circle">3</div>
              <div class="step-title">กดยืนยันส่งข้อมูลคำขอ</div>
            </div>
            <span class="step-badge-pill pink">Real-Time Queue</span>
          </div>

          <p class="step-desc">
            กดปุ่ม <strong>"ส่งข้อมูลขอเปิดประตูผ่านระบบ"</strong> คำขอจะถูกส่งตรงไปยัง Dashboard ของอาจารย์ผู้สอนหรือเจ้าหน้าที่ประจำห้องแบบสด
          </p>
        </div>

        <div class="step3-visual">
          <div class="submit-btn-preview">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="22" y1="2" x2="11" y2="13"/>
              <polygon points="22 2 15 22 11 13 2 9 22 2"/>
            </svg>
            <span>ส่งข้อมูลขอเปิดประตูผ่านระบบ</span>
          </div>

          <div class="queue-status-row">
            <div class="ping">
              <span style="display:inline-block; width:6px; height:6px; background:#38BDF8; border-radius:50%;"></span>
              <span>สถานะ: กำลังรอการอนุมัติ (Real-Time)</span>
            </div>
            <span style="color:#94A3B8; font-size:2.4mm;">เช็กคิวทุก 3 วินาที</span>
          </div>
        </div>
      </section>

      <!-- STEP 4: ACCESS GRANTED & DOOR UNLOCKED -->
      <section class="step-card highlight-green">
        <div>
          <div class="step-header">
            <div class="step-num-badge">
              <div class="num-circle green">4</div>
              <div class="step-title" style="color:#34D399;">อนุมัติสำเร็จ ประตูเปิดแล้ว!</div>
            </div>
            <span class="step-badge-pill green">Access Granted</span>
          </div>

          <p class="step-desc">
            เมื่อได้รับการอนุมัติ หน้าจอมือถือและจอ LCD หน้าห้องจะเปลี่ยนเป็น<strong>สีเขียว</strong> กลอนประตูแม่เหล็กไฟฟ้าจะ<strong>ปลดล็อกอัตโนมัติ</strong> เข้าห้องได้ทันที!
          </p>
        </div>

        <div class="step4-visual">
          <div class="unlock-tft-frame">
            <img src="${imgEsp32Approved}" alt="Access Granted TFT Screen">
          </div>
          <div class="step4-bullets">
            <div class="bullet-item green">
              <span class="bullet-icon" style="color:#10B981;">✓</span>
              <span><strong>Door Unlocked:</strong> ประตูปลดล็อก 5 วินาที</span>
            </div>
            <div class="bullet-item green">
              <span class="bullet-icon" style="color:#10B981;">✓</span>
              <span><strong>Audit Logged:</strong> บันทึกเวลาเข้าห้องแม่นยำ</span>
            </div>
            <div class="bullet-item green">
              <span class="bullet-icon" style="color:#10B981;">✓</span>
              <span><strong>Push Notify:</strong> แจ้งเตือนผ่าน Discord ทันที</span>
            </div>
          </div>
        </div>
      </section>

    </main>

    <!-- ────────────────── POWER FEATURES HIGHLIGHT ────────────────── -->
    <section class="features-highlight-section">
      <div class="features-header">
        <div class="features-title">
          <span>⚡ สิทธิพิเศษและฟังก์ชันอำนวยความสะดวก</span>
        </div>
        <div class="features-sub">ออกแบบมาเพื่อความคล่องตัวและความปลอดภัยสูงสุดของนักศึกษา</div>
      </div>

      <div class="features-grid">
        <!-- Feature 1: Bypass 5 mins -->
        <div class="feature-box special-orange">
          <div class="feature-head orange">
            <span>⚡ สิทธิ์ Bypass อัตโนมัติ 5 นาที</span>
          </div>
          <p class="feature-text">
            หากได้รับอนุมัติแล้ว และต้องเดินออกนอกห้องชั่วคราว (เข้าห้องน้ำ/รับโทรศัพท์) <strong>สแกน QR หน้าห้องเดิมซ้ำภายใน 5 นาที</strong> ประตูจะปลดล็อกให้ทันที <strong>ไม่ต้องกรอกข้อมูลใหม่และไม่ต้องรออนุมัติซ้ำ!</strong>
          </p>
        </div>

        <!-- Feature 2: Auto-Fill -->
        <div class="feature-box">
          <div class="feature-head purple">
            <span>🧠 Intelligent Auto-fill</span>
          </div>
          <p class="feature-text">
            ระบบจดจำข้อมูลการใช้งานเดิมอย่างปลอดภัย เพียงกรอกรหัสนักศึกษา ข้อมูลคณะและสาขาจะถูกเติมให้ทันที ลดเวลาลงทะเบียนเหลือไม่ถึง <strong>5 วินาที</strong>
          </p>
        </div>

        <!-- Feature 3: Security & Privacy -->
        <div class="feature-box">
          <div class="feature-head green">
            <span>🛡️ มาตรฐานความปลอดภัย PDPA</span>
          </div>
          <p class="feature-text">
            จัดเก็บประวัติการเข้า-ออกห้องเรียนในระบบคลาวด์ Supabase เข้ารหัสปลอดภัย และเก็บ Log จราจร 90 วัน สอดคล้องตาม <strong>พ.ร.บ. คอมพิวเตอร์ฯ 2560</strong>
          </p>
        </div>
      </div>
    </section>

    <!-- ────────────────── FOOTER ────────────────── -->
    <footer class="poster-footer">
      <div class="footer-left">
        <div class="footer-univ">คณะครุศาสตร์อุตสาหกรรม มหาวิทยาลัยเทคโนโลยีราชมงคลพระนคร</div>
        <div class="footer-faculty">สาขาวิชาวิศวกรรมคอมพิวเตอร์และเทคโนโลยีสารสนเทศ • อาคารปฏิบัติการเรียนการสอน</div>
      </div>

      <div class="footer-center">
        <div class="footer-notice-title">
          <span>⚠️ ข้อควรปฏิบัติ:</span>
        </div>
        <div class="footer-notice-text">
          โปรดสแกน QR Code หน้าห้องที่ต้องการเข้าจริงเท่านั้น และห้ามส่งต่อลิงก์ลงทะเบียนให้ผู้อื่น
        </div>
      </div>

      <div class="footer-right">
        <div class="footer-tag-wrap">
          <span class="footer-badge-tech">SmartAccess IoT System</span>
          <span class="footer-version">v2.4.0 • Enterprise Edition</span>
        </div>
      </div>
    </footer>

  </div>

</body>
</html>`;

  // Write HTML poster file
  const htmlPath = path.join(OUTPUT_DIR, 'smartaccess_poster_a4.html');
  fs.writeFileSync(htmlPath, posterHtml, 'utf8');
  console.log(`Saved HTML poster: ${htmlPath}`);

  // Launch Edge browser to render PDF and High-Resolution PNG
  console.log('Rendering High-Resolution Poster PNG and PDF with Edge...');
  const browser = await puppeteer.launch({
    executablePath: EDGE_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu']
  });

  try {
    const page = await browser.newPage();
    
    // Set 300 DPI A4 Dimensions (2480px x 3508px with 1.0 device scale or 1240x1754 with 2.0)
    await page.setViewport({
      width: 1240,
      height: 1754,
      deviceScaleFactor: 2
    });

    await page.setContent(posterHtml, { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 1500));

    // Export High-Res PNG (2480 x 3508 px)
    const pngPath = path.join(OUTPUT_DIR, 'smartaccess_poster_a4.png');
    await page.screenshot({
      path: pngPath,
      fullPage: false,
      omitBackground: false
    });
    console.log(`Saved High-Res PNG Poster: ${pngPath}`);

    // Export Vector-Crisp Print PDF
    const pdfPath = path.join(OUTPUT_DIR, 'smartaccess_poster_a4.pdf');
    await page.pdf({
      path: pdfPath,
      format: 'A4',
      printBackground: true,
      margin: { top: 0, right: 0, bottom: 0, left: 0 }
    });
    console.log(`Saved Print-Ready PDF Poster: ${pdfPath}`);

    console.log('=== All poster formats generated successfully! ===');
  } catch (err) {
    console.error('Error generating poster render:', err);
  } finally {
    await browser.close();
  }
}

buildPoster();
