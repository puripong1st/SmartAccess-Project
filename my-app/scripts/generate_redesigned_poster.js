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

async function buildRedesignedPoster() {
  console.log('Generating high-res dynamic QR code...');
  const qrDataUri = await QRCode.toDataURL('http://192.168.1.41:3000/?room=CE-401&scan=AUTH_TOKEN_77492', {
    width: 320,
    margin: 1,
    color: { dark: '#000000', light: '#FFFFFF' }
  });

  const imgMobileForm = toBase64('screen_mobile_form_perfect.png');

  console.log('Building Redesigned A4 Poster HTML...');
  const html = `<!DOCTYPE html>
<html lang="th">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>SmartAccess — แนะนำวิธีการใช้งานระบบควบคุมประตูอัจฉริยะ (A4)</title>
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
      background: #070913;
      font-family: 'Prompt', 'Kanit', sans-serif;
      color: #FFFFFF;
      overflow: hidden;
      -webkit-font-smoothing: antialiased;
    }

    .poster-canvas {
      width: 210mm;
      height: 297mm;
      position: relative;
      background: radial-gradient(130% 90% at 50% -10%, #1A1333 0%, #0D1022 40%, #070913 95%);
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      padding: 7.5mm 10.5mm 7mm 10.5mm;
      overflow: hidden;
    }

    /* Ambient Lighting */
    .glow-top-purple {
      position: absolute;
      top: -30mm;
      left: -20mm;
      width: 140mm;
      height: 140mm;
      background: radial-gradient(circle, rgba(124, 58, 237, 0.35) 0%, rgba(124, 58, 237, 0) 70%);
      pointer-events: none;
    }
    .glow-top-pink {
      position: absolute;
      top: -20mm;
      right: -20mm;
      width: 130mm;
      height: 130mm;
      background: radial-gradient(circle, rgba(219, 39, 119, 0.28) 0%, rgba(219, 39, 119, 0) 70%);
      pointer-events: none;
    }
    .glow-bot-emerald {
      position: absolute;
      bottom: -30mm;
      right: -20mm;
      width: 130mm;
      height: 130mm;
      background: radial-gradient(circle, rgba(16, 185, 129, 0.2) 0%, rgba(16, 185, 129, 0) 70%);
      pointer-events: none;
    }
    .grid-lines {
      position: absolute;
      inset: 0;
      background-image: linear-gradient(rgba(255, 255, 255, 0.02) 1px, transparent 1px),
                        linear-gradient(90deg, rgba(255, 255, 255, 0.02) 1px, transparent 1px);
      background-size: 8mm 8mm;
      pointer-events: none;
    }

    /* ─── HEADER ─── */
    .header {
      position: relative;
      z-index: 10;
      border-bottom: 1.2px solid rgba(255, 255, 255, 0.1);
      padding-bottom: 2.8mm;
    }
    .header-top {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 2mm;
    }
    .univ-brand {
      display: flex;
      align-items: center;
      gap: 2.2mm;
    }
    .univ-tag {
      background: linear-gradient(135deg, #7C3AED, #DB2777);
      color: #FFFFFF;
      font-size: 2.8mm;
      font-weight: 800;
      padding: 0.6mm 2.6mm;
      border-radius: 4mm;
      letter-spacing: 0.3px;
      box-shadow: 0 2px 8px rgba(124, 58, 237, 0.4);
    }
    .univ-text {
      font-size: 3.1mm;
      font-weight: 700;
      color: #E2E8F0;
    }
    .badge-iot {
      background: rgba(16, 185, 129, 0.15);
      border: 1px solid rgba(16, 185, 129, 0.4);
      color: #34D399;
      font-size: 2.6mm;
      font-weight: 700;
      padding: 0.6mm 2.6mm;
      border-radius: 4mm;
      display: flex;
      align-items: center;
      gap: 1.6mm;
    }
    .badge-dot {
      width: 1.8mm;
      height: 1.8mm;
      background: #10B981;
      border-radius: 50%;
      box-shadow: 0 0 5px #10B981;
    }

    .header-main {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 3.5mm;
    }
    .brand-left {
      display: flex;
      align-items: center;
      gap: 3.2mm;
    }
    .brand-logo-cube {
      width: 12mm;
      height: 12mm;
      background: linear-gradient(135deg, #7C3AED 0%, #DB2777 100%);
      border-radius: 3.2mm;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 16px rgba(124, 58, 237, 0.45);
      border: 1.2px solid rgba(255, 255, 255, 0.25);
      flex-shrink: 0;
    }
    .brand-logo-cube svg {
      width: 7.2mm;
      height: 7.2mm;
      fill: none;
      stroke: #FFFFFF;
      stroke-width: 2.2;
    }
    .brand-text-col {
      display: flex;
      flex-direction: column;
    }
    .brand-title {
      font-family: 'Kanit', sans-serif;
      font-size: 7.2mm;
      font-weight: 900;
      line-height: 1.05;
      letter-spacing: -0.2px;
      background: linear-gradient(90deg, #FFFFFF 0%, #F5F3FF 50%, #FDF2F8 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    .brand-sub {
      font-size: 3.3mm;
      font-weight: 600;
      color: #94A3B8;
      margin-top: 0.4mm;
    }
    .brand-sub strong {
      color: #F1F5F9;
      font-weight: 700;
    }
    .highlight-pill-box {
      background: linear-gradient(135deg, rgba(124, 58, 237, 0.22) 0%, rgba(219, 39, 119, 0.18) 100%);
      border: 1.2px solid rgba(192, 132, 252, 0.35);
      padding: 1.8mm 3.6mm;
      border-radius: 2.6mm;
      text-align: right;
    }
    .highlight-pill-box .top-txt {
      font-size: 3.4mm;
      font-weight: 800;
      color: #F472B6;
    }
    .highlight-pill-box .btm-txt {
      font-size: 2.5mm;
      color: #CBD5E1;
      margin-top: 0.3mm;
    }

    /* ─── BANNER GUIDE ─── */
    .hero-guide-banner {
      position: relative;
      z-index: 10;
      margin-top: 2.2mm;
      background: linear-gradient(90deg, rgba(15, 23, 42, 0.85) 0%, rgba(30, 27, 75, 0.85) 100%);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 2.6mm;
      padding: 1.8mm 3.6mm;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .hero-guide-left {
      display: flex;
      align-items: center;
      gap: 2mm;
      font-size: 3.4mm;
      font-weight: 800;
      color: #F8FAFC;
    }
    .hero-guide-left .badge-guide {
      background: #7C3AED;
      color: #FFFFFF;
      font-size: 2.4mm;
      font-weight: 800;
      padding: 0.5mm 2mm;
      border-radius: 1.6mm;
    }
    .hero-guide-right {
      font-size: 2.6mm;
      color: #94A3B8;
    }

    /* ─── 4-STEP GRID (PERFECT EQUAL HEIGHT CARDS) ─── */
    .steps-container {
      position: relative;
      z-index: 10;
      display: grid;
      grid-template-columns: 1fr 1fr;
      grid-template-rows: 1fr 1fr;
      gap: 3.2mm;
      margin-top: 2.4mm;
      flex: 1;
      max-height: 184mm;
    }

    .step-card {
      background: rgba(15, 23, 42, 0.72);
      backdrop-filter: blur(10px);
      border: 1.2px solid rgba(255, 255, 255, 0.1);
      border-radius: 3.6mm;
      padding: 2.8mm 3.2mm 2.8mm 3.2mm;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      box-shadow: 0 4px 18px rgba(0, 0, 0, 0.4);
      position: relative;
    }
    .step-card.purple-glow {
      border-color: rgba(139, 92, 246, 0.45);
      background: linear-gradient(180deg, rgba(28, 22, 54, 0.75) 0%, rgba(13, 17, 34, 0.75) 100%);
    }
    .step-card.green-glow {
      border-color: rgba(16, 185, 129, 0.5);
      background: linear-gradient(180deg, rgba(6, 42, 29, 0.75) 0%, rgba(10, 24, 20, 0.75) 100%);
    }

    .step-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 1.2mm;
    }
    .step-num-group {
      display: flex;
      align-items: center;
      gap: 1.8mm;
    }
    .step-num-circle {
      width: 6.4mm;
      height: 6.4mm;
      border-radius: 50%;
      background: linear-gradient(135deg, #7C3AED, #DB2777);
      color: #FFFFFF;
      font-size: 3.5mm;
      font-weight: 900;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 2px 10px rgba(124, 58, 237, 0.5);
    }
    .step-num-circle.green {
      background: linear-gradient(135deg, #059669, #10B981);
      box-shadow: 0 2px 10px rgba(16, 185, 129, 0.5);
    }
    .step-title-text {
      font-family: 'Kanit', sans-serif;
      font-size: 3.9mm;
      font-weight: 800;
      color: #F8FAFC;
    }
    .step-badge-tag {
      font-size: 2.3mm;
      font-weight: 700;
      padding: 0.5mm 2mm;
      border-radius: 1.8mm;
      background: rgba(255, 255, 255, 0.08);
      color: #CBD5E1;
    }
    .step-badge-tag.pink {
      background: rgba(219, 39, 119, 0.2);
      color: #F472B6;
      border: 1px solid rgba(219, 39, 119, 0.4);
    }
    .step-badge-tag.green {
      background: rgba(16, 185, 129, 0.2);
      color: #34D399;
      border: 1px solid rgba(16, 185, 129, 0.4);
    }

    .step-desc-text {
      font-size: 2.65mm;
      line-height: 1.35;
      color: #CBD5E1;
      margin-bottom: 1.8mm;
    }
    .step-desc-text strong {
      color: #FFFFFF;
      font-weight: 700;
    }

    /* ─── STEP 1 VISUAL ─── */
    .step1-body {
      display: flex;
      gap: 3mm;
      align-items: center;
      background: #05070E;
      border-radius: 2.6mm;
      padding: 2.2mm;
      border: 1px solid rgba(255, 255, 255, 0.08);
      flex: 1;
    }
    .esp32-lcd-box {
      width: 44mm;
      height: 38mm;
      background: #06070D;
      border: 1.5px solid #1E293B;
      border-radius: 2mm;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      box-shadow: 0 4px 14px rgba(0, 0, 0, 0.8);
      flex-shrink: 0;
    }
    .lcd-bar-top {
      background: #0E111C;
      padding: 1.1mm 1.8mm;
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1px solid rgba(255, 255, 255, 0.08);
    }
    .lcd-brand { color: #E2E8F0; font-size: 2.1mm; font-weight: 800; }
    .lcd-status { font-size: 1.8mm; padding: 0.3mm 1.4mm; background: rgba(16, 185, 129, 0.2); color: #10B981; border-radius: 1mm; font-weight: 700; }
    .lcd-body {
      flex: 1;
      display: flex;
      align-items: center;
      padding: 1.4mm 1.8mm;
      gap: 2mm;
    }
    .lcd-qr {
      width: 22mm;
      height: 22mm;
      background: #FFFFFF;
      padding: 0.8mm;
      border-radius: 1.5mm;
      border: 2px solid #10B981;
      box-shadow: 0 0 10px rgba(16, 185, 129, 0.35);
      flex-shrink: 0;
    }
    .lcd-qr img { width: 100%; height: 100%; display: block; }
    .lcd-text-col { flex: 1; text-align: left; }
    .lcd-room-lbl { color: #94A3B8; font-size: 1.8mm; font-weight: 700; text-transform: uppercase; }
    .lcd-room-num { color: #38BDF8; font-size: 4.6mm; font-weight: 900; line-height: 1.1; margin-top: 0.2mm; }
    .lcd-room-sub { color: #CBD5E1; font-size: 2mm; margin-top: 0.3mm; }
    .lcd-bar-btm {
      background: #0A0B10;
      padding: 0.9mm 1.8mm;
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-top: 1px solid rgba(255, 255, 255, 0.06);
    }
    .lcd-bar-btm span { color: #64748B; font-size: 1.8mm; }
    .lcd-bar-btm .ip { color: #10B981; font-family: 'JetBrains Mono', monospace; font-weight: 700; }

    .step1-bullets {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 1.4mm;
    }
    .bullet-row {
      display: flex;
      align-items: flex-start;
      gap: 1.2mm;
      font-size: 2.45mm;
      color: #CBD5E1;
      line-height: 1.32;
    }
    .bullet-star { color: #38BDF8; font-size: 2.5mm; line-height: 1; margin-top: 0.2mm; }
    .bullet-row strong { color: #F8FAFC; }

    /* ─── STEP 2 VISUAL (LARGE REAL MOBILE PHONE CAPTURE) ─── */
    .step2-body {
      display: flex;
      gap: 2.8mm;
      align-items: stretch;
      background: #05070E;
      border-radius: 2.6mm;
      padding: 2mm;
      border: 1px solid rgba(255, 255, 255, 0.08);
      flex: 1;
    }
    .phone-mockup-frame {
      width: 44mm;
      flex-shrink: 0;
      background: #000000;
      border-radius: 3.5mm;
      border: 1.6px solid #334155;
      padding: 1.2mm 0.9mm 0.9mm 0.9mm;
      box-shadow: 0 6px 20px rgba(0, 0, 0, 0.8), 0 0 14px rgba(124, 58, 237, 0.35);
      display: flex;
      flex-direction: column;
    }
    .phone-dynamic-island {
      width: 12mm;
      height: 1.6mm;
      background: #1E293B;
      border-radius: 1mm;
      margin: 0 auto 1.2mm auto;
    }
    .phone-inner-screen {
      width: 100%;
      border-radius: 2.4mm;
      overflow: hidden;
      border: 1px solid rgba(255, 255, 255, 0.08);
      background: #090A14;
      flex: 1;
    }
    .phone-inner-screen img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
    }

    .step2-sidebar {
      flex: 1;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      gap: 1.4mm;
    }
    .fields-tag-card {
      background: rgba(0, 0, 0, 0.5);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 2mm;
      padding: 1.6mm 2.2mm;
    }
    .tag-row {
      display: flex;
      align-items: center;
      gap: 1.4mm;
      font-size: 2.35mm;
      margin-bottom: 0.8mm;
    }
    .tag-row:last-child { margin-bottom: 0; }
    .tag-lbl {
      background: rgba(124, 58, 237, 0.3);
      color: #DDD6FE;
      font-weight: 800;
      padding: 0.3mm 1.6mm;
      border-radius: 0.8mm;
      font-size: 2.1mm;
      flex-shrink: 0;
    }
    .tag-val { color: #F8FAFC; font-weight: 700; }

    .autofill-callout {
      background: linear-gradient(135deg, rgba(124, 58, 237, 0.28) 0%, rgba(219, 39, 119, 0.2) 100%);
      border: 1.2px dashed #A855F7;
      border-radius: 2mm;
      padding: 1.6mm 2mm;
      display: flex;
      align-items: center;
      gap: 1.6mm;
    }
    .autofill-callout .ico { font-size: 3.5mm; line-height: 1; }
    .autofill-callout .tit { font-size: 2.5mm; font-weight: 800; color: #F3E8FF; }
    .autofill-callout .sub { font-size: 2.1mm; color: #CBD5E1; line-height: 1.25; margin-top: 0.2mm; }

    /* ─── STEP 3 VISUAL (REAL-TIME QUEUE SUBMIT) ─── */
    .step3-body {
      background: #05070E;
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 2.6mm;
      padding: 2.2mm;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      flex: 1;
    }
    .step3-btn-gradient {
      background: linear-gradient(135deg, #7C3AED 0%, #DB2777 100%);
      border-radius: 2.2mm;
      padding: 2.2mm 3mm;
      text-align: center;
      color: #FFFFFF;
      font-weight: 800;
      font-size: 3mm;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 2mm;
      box-shadow: 0 4px 14px rgba(124, 58, 237, 0.45);
    }
    .step3-queue-box {
      background: rgba(255, 255, 255, 0.04);
      border: 1px solid rgba(255, 255, 255, 0.06);
      border-radius: 2mm;
      padding: 1.6mm 2.2mm;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .step3-queue-left {
      display: flex;
      align-items: center;
      gap: 1.4mm;
      font-size: 2.45mm;
      color: #38BDF8;
      font-weight: 800;
    }
    .live-pulse-dot {
      width: 1.8mm;
      height: 1.8mm;
      background: #38BDF8;
      border-radius: 50%;
      box-shadow: 0 0 6px #38BDF8;
    }
    .step3-bullets {
      display: flex;
      flex-direction: column;
      gap: 1.1mm;
      margin-top: 1.2mm;
    }

    /* ─── STEP 4 VISUAL (DOOR UNLOCKED GREEN LCD) ─── */
    .step4-body {
      display: flex;
      gap: 3mm;
      align-items: center;
      background: #031008;
      border-radius: 2.6mm;
      padding: 2.2mm;
      border: 1px solid rgba(16, 185, 129, 0.35);
      flex: 1;
    }
    .unlocked-lcd-box {
      width: 44mm;
      height: 38mm;
      background: #021207;
      border: 1.5px solid #059669;
      border-radius: 2mm;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      position: relative;
      box-shadow: 0 4px 16px rgba(16, 185, 129, 0.4);
      flex-shrink: 0;
    }
    .unlocked-circle-ico {
      width: 8.5mm;
      height: 8.5mm;
      border-radius: 50%;
      background: #064E3B;
      border: 1.6px solid #10B981;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #10B981;
      font-size: 4.2mm;
      font-weight: 900;
      box-shadow: 0 0 10px rgba(16, 185, 129, 0.6);
      margin-bottom: 1mm;
    }
    .unlocked-main-txt {
      color: #10B981;
      font-size: 2.8mm;
      font-weight: 900;
      letter-spacing: 0.4px;
      text-shadow: 0 0 8px rgba(16, 185, 129, 0.7);
    }
    .unlocked-sub-txt {
      color: #FCD34D;
      font-size: 2.1mm;
      font-weight: 800;
      margin-top: 0.3mm;
    }
    .unlocked-user-pill {
      margin-top: 0.8mm;
      background: rgba(255, 255, 255, 0.08);
      border: 1px solid rgba(255, 255, 255, 0.12);
      padding: 0.4mm 2.2mm;
      border-radius: 3mm;
      color: #FFFFFF;
      font-size: 1.9mm;
      font-weight: 700;
    }
    .unlocked-bar-bot {
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      height: 1mm;
      background: #10B981;
      box-shadow: 0 0 6px #10B981;
    }

    .step4-bullets {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 1.4mm;
    }
    .bullet-row.green-type {
      color: #A7F3D0;
    }
    .bullet-row.green-type strong {
      color: #34D399;
    }

    /* ─── POWER FEATURES HIGHLIGHT ─── */
    .features-strip {
      position: relative;
      z-index: 10;
      margin-top: 2.4mm;
      background: linear-gradient(135deg, rgba(22, 27, 50, 0.95) 0%, rgba(13, 17, 34, 0.95) 100%);
      border: 1.2px solid rgba(255, 255, 255, 0.12);
      border-radius: 3.4mm;
      padding: 2.2mm 3mm;
      box-shadow: 0 6px 20px rgba(0, 0, 0, 0.5);
    }
    .features-top-bar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 1.6mm;
      border-bottom: 1px solid rgba(255, 255, 255, 0.08);
      padding-bottom: 1mm;
    }
    .features-title-txt {
      font-family: 'Kanit', sans-serif;
      font-size: 3.3mm;
      font-weight: 800;
      color: #F8FAFC;
      display: flex;
      align-items: center;
      gap: 1.6mm;
    }
    .features-sub-txt {
      font-size: 2.45mm;
      color: #94A3B8;
    }

    .features-3col {
      display: grid;
      grid-template-columns: 1.25fr 1fr 1fr;
      gap: 2.6mm;
    }
    .feat-item-card {
      background: rgba(0, 0, 0, 0.4);
      border: 1px solid rgba(255, 255, 255, 0.06);
      border-radius: 2.2mm;
      padding: 1.6mm 2.2mm;
      display: flex;
      flex-direction: column;
    }
    .feat-item-card.gold-glow {
      border-color: rgba(245, 158, 11, 0.4);
      background: linear-gradient(180deg, rgba(245, 158, 11, 0.15) 0%, rgba(15, 23, 42, 0.5) 100%);
    }
    .feat-item-head {
      display: flex;
      align-items: center;
      gap: 1.4mm;
      font-size: 2.7mm;
      font-weight: 800;
      margin-bottom: 0.6mm;
    }
    .feat-item-head.gold { color: #FBBF24; }
    .feat-item-head.purple { color: #C084FC; }
    .feat-item-head.green { color: #34D399; }
    .feat-item-body {
      font-size: 2.3mm;
      line-height: 1.34;
      color: #CBD5E1;
    }
    .feat-item-body strong {
      color: #FFFFFF;
      font-weight: 700;
    }

    /* ─── FOOTER ─── */
    .footer-bar {
      position: relative;
      z-index: 10;
      border-top: 1.2px solid rgba(255, 255, 255, 0.1);
      padding-top: 2mm;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .footer-left-col {
      display: flex;
      flex-direction: column;
    }
    .footer-left-main {
      font-size: 2.9mm;
      font-weight: 800;
      color: #F8FAFC;
    }
    .footer-left-sub {
      font-size: 2.4mm;
      color: #94A3B8;
      margin-top: 0.2mm;
    }
    .footer-warning-pill {
      background: rgba(255, 255, 255, 0.04);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 2mm;
      padding: 1.2mm 2.8mm;
      text-align: center;
    }
    .footer-warning-head {
      font-size: 2.35mm;
      font-weight: 700;
      color: #FB7185;
    }
    .footer-warning-body {
      font-size: 2.1mm;
      color: #CBD5E1;
      margin-top: 0.2mm;
    }
    .footer-right-col {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
    }
    .footer-badge-sys {
      background: linear-gradient(90deg, #7C3AED, #DB2777);
      color: #FFFFFF;
      font-size: 2.35mm;
      font-weight: 800;
      padding: 0.6mm 2.4mm;
      border-radius: 3mm;
    }
    .footer-ver-txt {
      font-size: 1.95mm;
      color: #64748B;
      font-family: 'JetBrains Mono', monospace;
      margin-top: 0.2mm;
    }
  </style>
</head>
<body>

  <div class="poster-canvas">
    <div class="glow-top-purple"></div>
    <div class="glow-top-pink"></div>
    <div class="glow-bot-emerald"></div>
    <div class="grid-lines"></div>

    <!-- ────────────────── HEADER ────────────────── -->
    <header class="header">
      <div class="header-top">
        <div class="univ-brand">
          <span class="univ-tag">มทร.พระนคร</span>
          <span class="univ-text">คณะครุศาสตร์อุตสาหกรรม มหาวิทยาลัยเทคโนโลยีราชมงคลพระนคร</span>
        </div>
        <div class="badge-iot">
          <span class="badge-dot"></span>
          <span>IoT Multi-Room Door Access System</span>
        </div>
      </div>

      <div class="header-main">
        <div class="brand-left">
          <div class="brand-logo-cube">
            <svg viewBox="0 0 24 24">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              <circle cx="12" cy="16" r="1.5"/>
            </svg>
          </div>
          <div class="brand-text-col">
            <h1 class="brand-title">SmartAccess DOOR ACCESS</h1>
            <p class="brand-sub">แนะนำวิธีการใช้งาน <strong>ระบบควบคุมการเข้าออกห้องปฏิบัติการอัจฉริยะ</strong></p>
          </div>
        </div>

        <div class="highlight-pill-box">
          <div class="top-txt">⚡ เข้าห้องเรียนง่ายใน 4 ขั้นตอน</div>
          <div class="btm-txt">ไม่ต้องพกบัตร • ปลดล็อกผ่านมือถือ • ปลอดภัย 100%</div>
        </div>
      </div>
    </header>

    <!-- ────────────────── INTRO BANNER ────────────────── -->
    <div class="hero-guide-banner">
      <div class="hero-guide-left">
        <span class="badge-guide">GUIDE</span>
        <span>ขั้นตอนการขออนุญาตเข้าใช้ห้องปฏิบัติการเรียนการสอน (ห้อง CE-401 / CE-402)</span>
      </div>
      <div class="hero-guide-right">
        บันทึก Log ถูกต้องตาม พ.ร.บ. คอมพิวเตอร์ฯ 2560 & มาตรฐาน PDPA
      </div>
    </div>

    <!-- ────────────────── MAIN 4-STEP WORKFLOW ────────────────── -->
    <main class="steps-container">

      <!-- STEP 1: SCAN DYNAMIC QR CODE -->
      <section class="step-card purple-glow">
        <div>
          <div class="step-header">
            <div class="step-num-group">
              <div class="step-num-circle">1</div>
              <h2 class="step-title-text">สแกน Dynamic QR หน้าห้อง</h2>
            </div>
            <span class="step-badge-tag pink">สแกนผ่านมือถือ</span>
          </div>
          <p class="step-desc-text">
            ใช้<strong>กล้องถ่ายรูปของโทรศัพท์มือถือ</strong> สแกนภาพ QR Code ที่กำลังเคลื่อนไหวอยู่บนหน้าจอ LCD 3.2" หน้าห้องปฏิบัติการ แล้วแตะเปิดลิงก์
          </p>
        </div>

        <div class="step1-body">
          <div class="esp32-lcd-box">
            <div class="lcd-bar-top">
              <span class="lcd-brand">SmartAccess DOOR</span>
              <span class="lcd-status">ACTIVE</span>
            </div>
            <div class="lcd-body">
              <div class="lcd-qr">
                <img src="${qrDataUri}" alt="Dynamic QR">
              </div>
              <div class="lcd-text-col">
                <div class="lcd-room-lbl">ห้องปฏิบัติการ</div>
                <div class="lcd-room-num">CE-401</div>
                <div class="lcd-room-sub">ห้องปฏิบัติการคอมฯ</div>
              </div>
            </div>
            <div class="lcd-bar-btm">
              <span>มทร.พระนคร (ครุศาสตร์)</span>
              <span class="ip">192.168.2.49</span>
            </div>
          </div>

          <div class="step1-bullets">
            <div class="bullet-row">
              <span class="bullet-star">✦</span>
              <span><strong>Dynamic Token:</strong> รหัสเปลี่ยนทุก 60 วินาที ป้องกันการแคปรูปส่งต่อ</span>
            </div>
            <div class="bullet-row">
              <span class="bullet-star">✦</span>
              <span><strong>Room Isolated:</strong> ระบุห้องเรียนเป้าหมายแม่นยำ ไม่สับสนข้ามห้อง</span>
            </div>
            <div class="bullet-row">
              <span class="bullet-star">✦</span>
              <span><strong>แตะเปิดลิงก์:</strong> เข้าสู่หน้าจอลงทะเบียนหลักทันที</span>
            </div>
          </div>
        </div>
      </section>

      <!-- STEP 2: FILL REGISTRATION DETAILS (REAL PROJECT SCREENSHOT) -->
      <section class="step-card purple-glow">
        <div>
          <div class="step-header">
            <div class="step-num-group">
              <div class="step-num-circle">2</div>
              <h2 class="step-title-text">กรอกข้อมูลผู้ขอเข้าใช้งาน</h2>
            </div>
            <span class="step-badge-tag pink">หน้าจอลงทะเบียนจริง</span>
          </div>
          <p class="step-desc-text">
            กรอก<strong>คำนำหน้า ชื่อ - นามสกุล รหัสนักศึกษา</strong> เลือกชั้นปี คณะ และสาขาวิชาของคุณให้ครบถ้วนเพื่อส่งคำขอยืนยันตัวตน
          </p>
        </div>

        <div class="step2-body">
          <div class="phone-mockup-frame">
            <div class="phone-dynamic-island"></div>
            <div class="phone-inner-screen">
              <img src="${imgMobileForm}" alt="SmartAccess Live Registration Screen">
            </div>
          </div>

          <div class="step2-sidebar">
            <div class="fields-tag-card">
              <div class="tag-row">
                <span class="tag-lbl">ชื่อ-สกุล</span>
                <span class="tag-val">นายชานนท์ สุขสวัสดิ์</span>
              </div>
              <div class="tag-row">
                <span class="tag-lbl">รหัส นศ.</span>
                <span class="tag-val">076158050650-8</span>
              </div>
              <div class="tag-row">
                <span class="tag-lbl">ชั้นปี</span>
                <span class="tag-val">นักศึกษาชั้นปีที่ 3</span>
              </div>
              <div class="tag-row">
                <span class="tag-lbl">คณะ</span>
                <span class="tag-val">ครุศาสตร์อุตสาหกรรม</span>
              </div>
              <div class="tag-row">
                <span class="tag-lbl">สาขาวิชา</span>
                <span class="tag-val">คอมพิวเตอร์และเทคโนโลยีฯ</span>
              </div>
            </div>

            <div class="autofill-callout">
              <div class="ico">🎓</div>
              <div>
                <div class="tit">Intelligent Auto-fill</div>
                <div class="sub">พิมพ์รหัสนักศึกษา ระบบจะดึงประวัติเดิมให้ทันที สะดวกและรวดเร็ว!</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- STEP 3: SUBMIT REQUEST -->
      <section class="step-card purple-glow">
        <div>
          <div class="step-header">
            <div class="step-num-group">
              <div class="step-num-circle">3</div>
              <h2 class="step-title-text">กดยืนยันส่งข้อมูลคำขอ</h2>
            </div>
            <span class="step-badge-tag pink">Real-Time Queue</span>
          </div>
          <p class="step-desc-text">
            กดปุ่ม <strong>"ส่งข้อมูลขอเปิดประตูผ่านระบบ"</strong> คำขอจะถูกส่งตรงไปยัง Dashboard ของอาจารย์ผู้สอนหรือเจ้าหน้าที่ประจำห้องแบบสด
          </p>
        </div>

        <div class="step3-body">
          <div class="step3-btn-gradient">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="22" y1="2" x2="11" y2="13"/>
              <polygon points="22 2 15 22 11 13 2 9 22 2"/>
            </svg>
            <span>ส่งข้อมูลขอเปิดประตูผ่านระบบ</span>
          </div>

          <div class="step3-queue-box">
            <div class="step3-queue-left">
              <span class="live-pulse-dot"></span>
              <span>สถานะ: กำลังรอการอนุมัติ (Real-Time)</span>
            </div>
            <span style="color:#94A3B8; font-size:2.2mm;">เช็กคิวทุก 3 วินาที</span>
          </div>

          <div class="step3-bullets">
            <div class="bullet-row">
              <span class="bullet-star">✦</span>
              <span><strong>Dashboard Alert:</strong> คำขอจะแจ้งเตือนขึ้นหน้าจอแอดมินทันที</span>
            </div>
            <div class="bullet-row">
              <span class="bullet-star">✦</span>
              <span><strong>ไม่ต้องรีเฟรช:</strong> หน้าจอจะอัปเดตสถานะอัตโนมัติเมื่ออนุมัติ</span>
            </div>
          </div>
        </div>
      </section>

      <!-- STEP 4: ACCESS GRANTED & DOOR UNLOCKED -->
      <section class="step-card green-glow">
        <div>
          <div class="step-header">
            <div class="step-num-group">
              <div class="step-num-circle green">4</div>
              <h2 class="step-title-text" style="color:#34D399;">อนุมัติสำเร็จ ประตูเปิดแล้ว!</h2>
            </div>
            <span class="step-badge-tag green">Access Granted</span>
          </div>
          <p class="step-desc-text">
            เมื่อได้รับการอนุมัติ หน้าจอมือถือและจอ LCD หน้าห้องจะเปลี่ยนเป็น<strong>สีเขียว</strong> และกลอนประตูแม่เหล็กไฟฟ้าจะ<strong>ปลดล็อกอัตโนมัติ</strong> เข้าห้องได้ทันที!
          </p>
        </div>

        <div class="step4-body">
          <div class="unlocked-lcd-box">
            <div class="unlocked-circle-ico">✓</div>
            <div class="unlocked-main-txt">ACCESS GRANTED</div>
            <div class="unlocked-sub-txt">🔓 DOOR UNLOCKED (ปลดล็อก)</div>
            <div class="unlocked-user-pill">นายชานนท์ สุขสวัสดิ์</div>
            <div class="unlocked-bar-bot"></div>
          </div>

          <div class="step4-bullets">
            <div class="bullet-row green-type">
              <span class="bullet-star" style="color:#10B981;">✓</span>
              <span><strong>Auto Unlock:</strong> สั่งปลดล็อกกลอนแม่เหล็ก 5 วินาที</span>
            </div>
            <div class="bullet-row green-type">
              <span class="bullet-star" style="color:#10B981;">✓</span>
              <span><strong>Audit Logged:</strong> บันทึกประวัติเวลาเข้าห้องเรียนโปร่งใส</span>
            </div>
            <div class="bullet-row green-type">
              <span class="bullet-star" style="color:#10B981;">✓</span>
              <span><strong>Real-Time Discord:</strong> ส่งแจ้งเตือนเจ้าหน้าที่ทันที</span>
            </div>
          </div>
        </div>
      </section>

    </main>

    <!-- ────────────────── POWER FEATURES HIGHLIGHT ────────────────── -->
    <section class="features-strip">
      <div class="features-top-bar">
        <div class="features-title-txt">
          <span>⚡ สิทธิพิเศษและฟังก์ชันอำนวยความสะดวก</span>
        </div>
        <div class="features-sub-txt">ออกแบบมาเพื่อความคล่องตัว รวดเร็ว และความปลอดภัยสูงสุดของนักศึกษา</div>
      </div>

      <div class="features-3col">
        <!-- Feature 1: Bypass 5 mins -->
        <div class="feat-item-card gold-glow">
          <div class="feat-item-head gold">
            <span>⚡ สิทธิ์ Bypass อัตโนมัติ 5 นาที</span>
          </div>
          <p class="feat-item-body">
            หากได้รับอนุมัติแล้ว และต้องเดินออกนอกห้องชั่วคราว (เข้าห้องน้ำ/รับโทรศัพท์) <strong>สแกน QR หน้าห้องเดิมซ้ำภายใน 5 นาที</strong> ประตูจะปลดล็อกให้ทันที <strong>ไม่ต้องกรอกข้อมูลใหม่และไม่ต้องรออนุมัติซ้ำ!</strong>
          </p>
        </div>

        <!-- Feature 2: Auto-Fill -->
        <div class="feat-item-card">
          <div class="feat-item-head purple">
            <span>🧠 Intelligent Auto-fill</span>
          </div>
          <p class="feat-item-body">
            ระบบจดจำข้อมูลการใช้งานเดิมอย่างปลอดภัย เพียงกรอกรหัสนักศึกษา ข้อมูลคณะและสาขาจะถูกเติมให้ทันที ลดเวลาลงทะเบียนเหลือไม่ถึง <strong>5 วินาที</strong>
          </p>
        </div>

        <!-- Feature 3: Security & Privacy -->
        <div class="feat-item-card">
          <div class="feat-item-head green">
            <span>🛡️ มาตรฐานความปลอดภัย PDPA</span>
          </div>
          <p class="feat-item-body">
            จัดเก็บประวัติการเข้า-ออกห้องเรียนในระบบคลาวด์ Supabase เข้ารหัสปลอดภัย และเก็บบันทึก Log จราจร 90 วัน สอดคล้องตาม <strong>พ.ร.บ. คอมพิวเตอร์ฯ 2560</strong>
          </p>
        </div>
      </div>
    </section>

    <!-- ────────────────── FOOTER ────────────────── -->
    <footer class="footer-bar">
      <div class="footer-left-col">
        <div class="footer-left-main">คณะครุศาสตร์อุตสาหกรรม มหาวิทยาลัยเทคโนโลยีราชมงคลพระนคร</div>
        <div class="footer-left-sub">สาขาวิชาวิศวกรรมคอมพิวเตอร์และเทคโนโลยีสารสนเทศ • อาคารปฏิบัติการเรียนการสอน</div>
      </div>

      <div class="footer-warning-pill">
        <div class="footer-warning-head">⚠️ ข้อควรปฏิบัติเพื่อความปลอดภัย</div>
        <div class="footer-warning-body">โปรดสแกน QR Code หน้าห้องที่ต้องการเข้าจริงเท่านั้น และห้ามส่งต่อลิงก์ลงทะเบียนให้ผู้อื่น</div>
      </div>

      <div class="footer-right-col">
        <span class="footer-badge-sys">SmartAccess IoT System</span>
        <span class="footer-ver-txt">v2.4.0 • Enterprise Edition</span>
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

    console.log('=== Redesigned Poster Generated Successfully! ===');
  } catch (err) {
    console.error('Error generating ultimate poster:', err);
  } finally {
    await browser.close();
  }
}

buildRedesignedPoster();
