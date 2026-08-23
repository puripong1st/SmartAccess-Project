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

async function buildMasterpiecePoster() {
  console.log('Generating QR code data URI...');
  const qrDataUri = await QRCode.toDataURL('http://192.168.1.41:3000/?room=CE-401&scan=AUTH_TOKEN_77492', {
    width: 280,
    margin: 1,
    color: { dark: '#000000', light: '#FFFFFF' }
  });

  const imgMobileForm = toBase64('screen_mobile_form_perfect.png');

  console.log('Building Masterpiece Flow A4 Poster HTML...');
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
      background: #06070E;
      font-family: 'Prompt', 'Kanit', sans-serif;
      color: #FFFFFF;
      overflow: hidden;
      -webkit-font-smoothing: antialiased;
    }

    .poster-container {
      width: 210mm;
      height: 297mm;
      position: relative;
      background: radial-gradient(140% 100% at 50% -10%, #1A1236 0%, #0C0F22 45%, #05060C 95%);
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      padding: 6.5mm 9.5mm 6mm 9.5mm;
      overflow: hidden;
    }

    /* Ambient Glows */
    .glow-1 {
      position: absolute;
      top: -30mm;
      left: -20mm;
      width: 130mm;
      height: 130mm;
      background: radial-gradient(circle, rgba(124, 58, 237, 0.32) 0%, rgba(124, 58, 237, 0) 70%);
      pointer-events: none;
    }
    .glow-2 {
      position: absolute;
      top: 40mm;
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
      background: radial-gradient(circle, rgba(16, 185, 129, 0.18) 0%, rgba(16, 185, 129, 0) 70%);
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
    .header-section {
      position: relative;
      z-index: 10;
      border-bottom: 1.2px solid rgba(255, 255, 255, 0.1);
      padding-bottom: 2.2mm;
    }
    .univ-top-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.4mm;
    }
    .univ-brand-wrap {
      display: flex;
      align-items: center;
      gap: 2mm;
    }
    .univ-pill {
      background: linear-gradient(135deg, #7C3AED, #DB2777);
      color: #FFFFFF;
      font-size: 2.6mm;
      font-weight: 800;
      padding: 0.5mm 2.4mm;
      border-radius: 3mm;
      letter-spacing: 0.3px;
    }
    .univ-name {
      font-size: 2.9mm;
      font-weight: 700;
      color: #E2E8F0;
    }
    .badge-iot-pill {
      background: rgba(16, 185, 129, 0.15);
      border: 1px solid rgba(16, 185, 129, 0.4);
      color: #34D399;
      font-size: 2.4mm;
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

    .header-main-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 3mm;
    }
    .header-left-title {
      display: flex;
      align-items: center;
      gap: 2.8mm;
    }
    .header-logo-icon {
      width: 11mm;
      height: 11mm;
      background: linear-gradient(135deg, #7C3AED 0%, #DB2777 100%);
      border-radius: 2.8mm;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 14px rgba(124, 58, 237, 0.45);
      border: 1px solid rgba(255, 255, 255, 0.25);
      flex-shrink: 0;
    }
    .header-logo-icon svg {
      width: 6.5mm;
      height: 6.5mm;
      fill: none;
      stroke: #FFFFFF;
      stroke-width: 2.2;
    }
    .title-texts {
      display: flex;
      flex-direction: column;
    }
    .h-main-title {
      font-family: 'Kanit', sans-serif;
      font-size: 6.8mm;
      font-weight: 900;
      line-height: 1.05;
      background: linear-gradient(90deg, #FFFFFF 0%, #F5F3FF 50%, #FDF2F8 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    .h-sub-title {
      font-size: 3.1mm;
      font-weight: 600;
      color: #94A3B8;
      margin-top: 0.3mm;
    }
    .h-sub-title strong {
      color: #F1F5F9;
      font-weight: 700;
    }
    .quick-badge-card {
      background: linear-gradient(135deg, rgba(124, 58, 237, 0.22) 0%, rgba(219, 39, 119, 0.18) 100%);
      border: 1px solid rgba(192, 132, 252, 0.35);
      padding: 1.6mm 3.2mm;
      border-radius: 2.4mm;
      text-align: right;
    }
    .quick-badge-card .q-top {
      font-size: 3.2mm;
      font-weight: 800;
      color: #F472B6;
    }
    .quick-badge-card .q-bot {
      font-size: 2.35mm;
      color: #CBD5E1;
      margin-top: 0.2mm;
    }

    /* ─── 2. GUIDE BANNER ─── */
    .flow-guide-bar {
      position: relative;
      z-index: 10;
      margin-top: 1.8mm;
      background: linear-gradient(90deg, rgba(15, 23, 42, 0.85) 0%, rgba(30, 27, 75, 0.85) 100%);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 2.4mm;
      padding: 1.6mm 3.2mm;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .flow-guide-left {
      display: flex;
      align-items: center;
      gap: 1.8mm;
      font-size: 3.2mm;
      font-weight: 800;
      color: #F8FAFC;
    }
    .guide-tag {
      background: #7C3AED;
      color: #FFFFFF;
      font-size: 2.3mm;
      font-weight: 800;
      padding: 0.4mm 1.8mm;
      border-radius: 1.4mm;
    }
    .flow-guide-right {
      font-size: 2.45mm;
      color: #94A3B8;
    }

    /* ─── 3. WORKFLOW CARDS (PERFECT FLOW) ─── */
    .workflow-section {
      position: relative;
      z-index: 10;
      display: flex;
      flex-direction: column;
      gap: 2.4mm;
      margin-top: 2mm;
    }

    .flow-card {
      background: rgba(15, 23, 42, 0.72);
      backdrop-filter: blur(10px);
      border: 1.2px solid rgba(255, 255, 255, 0.1);
      border-radius: 3.2mm;
      padding: 2.4mm 2.8mm;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.35);
      position: relative;
    }
    .flow-card.purple-card {
      border-color: rgba(139, 92, 246, 0.4);
      background: linear-gradient(180deg, rgba(28, 22, 54, 0.75) 0%, rgba(13, 17, 34, 0.75) 100%);
    }
    .flow-card.green-card {
      border-color: rgba(16, 185, 129, 0.45);
      background: linear-gradient(180deg, rgba(6, 42, 29, 0.75) 0%, rgba(10, 24, 20, 0.75) 100%);
    }

    .card-title-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 1.6mm;
    }
    .step-num-badge {
      display: flex;
      align-items: center;
      gap: 1.6mm;
    }
    .step-circle {
      width: 5.6mm;
      height: 5.6mm;
      border-radius: 50%;
      background: linear-gradient(135deg, #7C3AED, #DB2777);
      color: #FFFFFF;
      font-size: 3.2mm;
      font-weight: 900;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 2px 8px rgba(124, 58, 237, 0.45);
    }
    .step-circle.green-c {
      background: linear-gradient(135deg, #059669, #10B981);
      box-shadow: 0 2px 8px rgba(16, 185, 129, 0.45);
    }
    .step-heading {
      font-family: 'Kanit', sans-serif;
      font-size: 3.6mm;
      font-weight: 800;
      color: #F8FAFC;
    }
    .step-pill-tag {
      font-size: 2.2mm;
      font-weight: 700;
      padding: 0.4mm 1.8mm;
      border-radius: 1.6mm;
      background: rgba(255, 255, 255, 0.08);
      color: #CBD5E1;
    }
    .step-pill-tag.pink {
      background: rgba(219, 39, 119, 0.2);
      color: #F472B6;
      border: 1px solid rgba(219, 39, 119, 0.4);
    }
    .step-pill-tag.green {
      background: rgba(16, 185, 129, 0.2);
      color: #34D399;
      border: 1px solid rgba(16, 185, 129, 0.4);
    }

    /* ─── STEP 1 LAYOUT (HORIZONTAL FLOW) ─── */
    .step1-grid {
      display: grid;
      grid-template-columns: 46mm 1fr;
      gap: 3.5mm;
      align-items: center;
    }
    .tft-mini-screen {
      background: #06070D;
      border: 1.5px solid #1E293B;
      border-radius: 2mm;
      overflow: hidden;
      box-shadow: 0 4px 14px rgba(0, 0, 0, 0.8);
    }
    .tft-head-bar {
      background: #0E111C;
      padding: 0.9mm 1.6mm;
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1px solid rgba(255, 255, 255, 0.08);
    }
    .tft-head-bar .brand { color: #E2E8F0; font-size: 2mm; font-weight: 800; }
    .tft-head-bar .stat { font-size: 1.7mm; padding: 0.2mm 1.2mm; background: rgba(16, 185, 129, 0.2); color: #10B981; border-radius: 0.8mm; font-weight: 700; }
    .tft-mid-content {
      display: flex;
      align-items: center;
      padding: 1.2mm 1.6mm;
      gap: 1.8mm;
    }
    .tft-qr-box {
      width: 19mm;
      height: 19mm;
      background: #FFFFFF;
      padding: 0.7mm;
      border-radius: 1.4mm;
      border: 1.8px solid #10B981;
      box-shadow: 0 0 8px rgba(16, 185, 129, 0.35);
      flex-shrink: 0;
    }
    .tft-qr-box img { width: 100%; height: 100%; display: block; }
    .tft-room-details { flex: 1; }
    .tft-room-details .r-lbl { color: #94A3B8; font-size: 1.7mm; font-weight: 700; text-transform: uppercase; }
    .tft-room-details .r-code { color: #38BDF8; font-size: 4.2mm; font-weight: 900; line-height: 1.1; margin-top: 0.2mm; }
    .tft-room-details .r-sub { color: #CBD5E1; font-size: 1.9mm; margin-top: 0.2mm; }
    .tft-foot-bar {
      background: #0A0B10;
      padding: 0.8mm 1.6mm;
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-top: 1px solid rgba(255, 255, 255, 0.06);
    }
    .tft-foot-bar span { color: #64748B; font-size: 1.7mm; }
    .tft-foot-bar .ip { color: #10B981; font-family: 'JetBrains Mono', monospace; font-weight: 700; }

    .step1-info-col {
      display: flex;
      flex-direction: column;
      gap: 1.4mm;
    }
    .step1-desc-main {
      font-size: 2.7mm;
      color: #E2E8F0;
      line-height: 1.35;
    }
    .step1-desc-main strong { color: #FFFFFF; font-weight: 700; }
    .points-list {
      display: flex;
      flex-direction: column;
      gap: 1.1mm;
      background: rgba(0, 0, 0, 0.35);
      padding: 1.6mm 2.2mm;
      border-radius: 2mm;
      border: 1px solid rgba(255, 255, 255, 0.06);
    }
    .p-item {
      display: flex;
      align-items: flex-start;
      gap: 1.2mm;
      font-size: 2.4mm;
      color: #CBD5E1;
      line-height: 1.3;
    }
    .p-item .star { color: #38BDF8; font-size: 2.4mm; line-height: 1; }
    .p-item strong { color: #F8FAFC; }

    /* ─── STEP 2 LAYOUT (HERO REGISTRATION FORM SHOWCASE) ─── */
    .step2-showcase {
      display: grid;
      grid-template-columns: 36mm 1.15fr 0.95fr;
      gap: 3.2mm;
      align-items: center;
      background: #05070E;
      border-radius: 2.6mm;
      padding: 2.2mm 2.6mm;
      border: 1px solid rgba(255, 255, 255, 0.08);
    }
    .phone-device-wrap {
      background: #000000;
      border-radius: 3.2mm;
      border: 1.6px solid #334155;
      padding: 1mm 0.8mm 0.8mm 0.8mm;
      box-shadow: 0 6px 18px rgba(0, 0, 0, 0.8), 0 0 14px rgba(124, 58, 237, 0.35);
      display: flex;
      flex-direction: column;
      height: 48mm;
    }
    .phone-top-notch {
      width: 10mm;
      height: 1.5mm;
      background: #1E293B;
      border-radius: 1mm;
      margin: 0 auto 1mm auto;
    }
    .phone-screen-frame {
      width: 100%;
      border-radius: 2.2mm;
      overflow: hidden;
      border: 1px solid rgba(255, 255, 255, 0.08);
      background: #090A14;
      flex: 1;
    }
    .phone-screen-frame img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
    }

    .form-fields-overview {
      display: flex;
      flex-direction: column;
      gap: 1.1mm;
    }
    .field-card-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      background: rgba(255, 255, 255, 0.04);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 1.6mm;
      padding: 1.1mm 2mm;
    }
    .f-lbl {
      color: #C084FC;
      font-size: 2.2mm;
      font-weight: 700;
    }
    .f-val {
      color: #FFFFFF;
      font-size: 2.45mm;
      font-weight: 800;
      font-family: 'Prompt', sans-serif;
    }

    .autofill-feature-card {
      background: linear-gradient(135deg, rgba(124, 58, 237, 0.28) 0%, rgba(219, 39, 119, 0.2) 100%);
      border: 1.2px dashed #A855F7;
      border-radius: 2.2mm;
      padding: 2mm 2.2mm;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      height: 100%;
    }
    .af-top {
      display: flex;
      align-items: center;
      gap: 1.6mm;
      font-size: 2.7mm;
      font-weight: 800;
      color: #F3E8FF;
    }
    .af-body {
      font-size: 2.25mm;
      color: #CBD5E1;
      line-height: 1.32;
      margin-top: 1mm;
    }
    .af-body strong { color: #FFFFFF; }
    .af-badge-pill {
      margin-top: 1.4mm;
      background: rgba(124, 58, 237, 0.4);
      border: 1px solid rgba(192, 132, 252, 0.5);
      border-radius: 1.4mm;
      padding: 0.6mm 1.8mm;
      font-size: 2.1mm;
      color: #DDD6FE;
      font-weight: 700;
      text-align: center;
    }

    /* ─── STEPS 3 & 4 (2 BALANCED COLUMNS) ─── */
    .steps-3-4-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 2.6mm;
    }

    /* Step 3 Inner */
    .step3-inner {
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      gap: 1.6mm;
      height: 100%;
    }
    .step3-btn {
      background: linear-gradient(135deg, #7C3AED 0%, #DB2777 100%);
      border-radius: 2.2mm;
      padding: 2mm 2.8mm;
      text-align: center;
      color: #FFFFFF;
      font-weight: 800;
      font-size: 2.9mm;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 1.8mm;
      box-shadow: 0 4px 12px rgba(124, 58, 237, 0.45);
    }
    .step3-status-box {
      background: rgba(255, 255, 255, 0.04);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 1.8mm;
      padding: 1.4mm 2mm;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .step3-status-left {
      display: flex;
      align-items: center;
      gap: 1.4mm;
      font-size: 2.4mm;
      color: #38BDF8;
      font-weight: 800;
    }
    .pulse-dot {
      width: 1.8mm;
      height: 1.8mm;
      background: #38BDF8;
      border-radius: 50%;
      box-shadow: 0 0 6px #38BDF8;
    }
    .step3-points-col {
      display: flex;
      flex-direction: column;
      gap: 1mm;
    }

    /* Step 4 Inner */
    .step4-inner {
      display: grid;
      grid-template-columns: 34mm 1fr;
      gap: 2.6mm;
      align-items: center;
    }
    .unlocked-lcd-card {
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
    .unlocked-ico {
      width: 7.5mm;
      height: 7.5mm;
      border-radius: 50%;
      background: #064E3B;
      border: 1.4px solid #10B981;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #10B981;
      font-size: 3.8mm;
      font-weight: 900;
      margin-bottom: 0.8mm;
    }
    .unlocked-txt-1 { color: #10B981; font-size: 2.5mm; font-weight: 900; letter-spacing: 0.3px; }
    .unlocked-txt-2 { color: #FCD34D; font-size: 1.9mm; font-weight: 800; margin-top: 0.2mm; }
    .unlocked-name-tag {
      margin-top: 0.8mm;
      background: rgba(255, 255, 255, 0.08);
      border: 1px solid rgba(255, 255, 255, 0.12);
      padding: 0.3mm 1.8mm;
      border-radius: 2mm;
      color: #FFFFFF;
      font-size: 1.8mm;
      font-weight: 700;
    }
    .step4-points-col {
      display: flex;
      flex-direction: column;
      gap: 1.2mm;
    }
    .p-item.green-p { color: #A7F3D0; }
    .p-item.green-p strong { color: #34D399; }

    /* ─── 4. POWER FEATURES (3 EQUAL COLUMNS) ─── */
    .features-highlight-strip {
      position: relative;
      z-index: 10;
      margin-top: 2mm;
      background: linear-gradient(135deg, rgba(22, 27, 50, 0.95) 0%, rgba(13, 17, 34, 0.95) 100%);
      border: 1.2px solid rgba(255, 255, 255, 0.12);
      border-radius: 3mm;
      padding: 2mm 2.8mm;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.4);
    }
    .feat-top-bar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 1.4mm;
      border-bottom: 1px solid rgba(255, 255, 255, 0.08);
      padding-bottom: 0.8mm;
    }
    .feat-top-title {
      font-family: 'Kanit', sans-serif;
      font-size: 3.1mm;
      font-weight: 800;
      color: #F8FAFC;
      display: flex;
      align-items: center;
      gap: 1.4mm;
    }
    .feat-top-sub {
      font-size: 2.35mm;
      color: #94A3B8;
    }

    .feat-grid-3 {
      display: grid;
      grid-template-columns: 1.25fr 1fr 1fr;
      gap: 2.4mm;
    }
    .feat-col-box {
      background: rgba(0, 0, 0, 0.4);
      border: 1px solid rgba(255, 255, 255, 0.06);
      border-radius: 2mm;
      padding: 1.4mm 2mm;
      display: flex;
      flex-direction: column;
    }
    .feat-col-box.amber-highlight {
      border-color: rgba(245, 158, 11, 0.4);
      background: linear-gradient(180deg, rgba(245, 158, 11, 0.15) 0%, rgba(15, 23, 42, 0.5) 100%);
    }
    .feat-head-row {
      display: flex;
      align-items: center;
      gap: 1.2mm;
      font-size: 2.6mm;
      font-weight: 800;
      margin-bottom: 0.6mm;
    }
    .feat-head-row.amber { color: #FBBF24; }
    .feat-head-row.purple { color: #C084FC; }
    .feat-head-row.green { color: #34D399; }
    .feat-body-txt {
      font-size: 2.2mm;
      line-height: 1.32;
      color: #CBD5E1;
    }
    .feat-body-txt strong { color: #FFFFFF; font-weight: 700; }

    /* ─── 5. FOOTER ─── */
    .footer-bar-wrap {
      position: relative;
      z-index: 10;
      border-top: 1.2px solid rgba(255, 255, 255, 0.1);
      padding-top: 1.8mm;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .f-dept-col {
      display: flex;
      flex-direction: column;
    }
    .f-dept-name {
      font-size: 2.8mm;
      font-weight: 800;
      color: #F8FAFC;
    }
    .f-dept-sub {
      font-size: 2.3mm;
      color: #94A3B8;
      margin-top: 0.2mm;
    }
    .f-warning-badge {
      background: rgba(255, 255, 255, 0.04);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 1.8mm;
      padding: 1mm 2.6mm;
      text-align: center;
    }
    .f-w-head {
      font-size: 2.25mm;
      font-weight: 700;
      color: #FB7185;
    }
    .f-w-body {
      font-size: 2.05mm;
      color: #CBD5E1;
      margin-top: 0.2mm;
    }
    .f-sys-badge {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
    }
    .f-pill-brand {
      background: linear-gradient(90deg, #7C3AED, #DB2777);
      color: #FFFFFF;
      font-size: 2.25mm;
      font-weight: 800;
      padding: 0.5mm 2.2mm;
      border-radius: 3mm;
    }
    .f-ver-code {
      font-size: 1.85mm;
      color: #64748B;
      font-family: 'JetBrains Mono', monospace;
      margin-top: 0.2mm;
    }
  </style>
</head>
<body>

  <div class="poster-container">
    <div class="glow-1"></div>
    <div class="glow-2"></div>
    <div class="glow-3"></div>
    <div class="grid-pattern"></div>

    <!-- ────────────────── 1. HEADER ────────────────── -->
    <header class="header-section">
      <div class="univ-top-row">
        <div class="univ-brand-wrap">
          <span class="univ-pill">มทร.พระนคร</span>
          <span class="univ-name">คณะครุศาสตร์อุตสาหกรรม มหาวิทยาลัยเทคโนโลยีราชมงคลพระนคร</span>
        </div>
        <div class="badge-iot-pill">
          <span class="green-dot"></span>
          <span>IoT Multi-Room Door Access System</span>
        </div>
      </div>

      <div class="header-main-row">
        <div class="header-left-title">
          <div class="header-logo-icon">
            <svg viewBox="0 0 24 24">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              <circle cx="12" cy="16" r="1.5"/>
            </svg>
          </div>
          <div class="title-texts">
            <h1 class="h-main-title">SmartAccess DOOR</h1>
            <p class="h-sub-title">คู่มือและแนะนำวิธีการใช้งาน <strong>ระบบควบคุมการเข้าออกห้องปฏิบัติการอัจฉริยะ</strong></p>
          </div>
        </div>

        <div class="quick-badge-card">
          <div class="q-top">⚡ เข้าห้องเรียนง่ายใน 4 ขั้นตอน</div>
          <div class="q-bot">ไม่ต้องพกบัตร • ปลดล็อกผ่านมือถือ • ปลอดภัย 100%</div>
        </div>
      </div>
    </header>

    <!-- ────────────────── 2. INTRO GUIDE BANNER ────────────────── -->
    <div class="flow-guide-bar">
      <div class="flow-guide-left">
        <span class="guide-tag">GUIDE</span>
        <span>ขั้นตอนการขออนุญาตเข้าใช้ห้องปฏิบัติการเรียนการสอน (ห้อง CE-401 / CE-402)</span>
      </div>
      <div class="flow-guide-right">
        บันทึก Log ถูกต้องตาม พ.ร.บ. คอมพิวเตอร์ฯ 2560 & มาตรฐาน PDPA
      </div>
    </div>

    <!-- ────────────────── 3. WORKFLOW STEPS ────────────────── -->
    <main class="workflow-section">

      <!-- STEP 1: SCAN DYNAMIC QR CODE -->
      <section class="flow-card purple-card">
        <div class="card-title-row">
          <div class="step-num-badge">
            <div class="step-circle">1</div>
            <h2 class="step-heading">สแกน Dynamic QR หน้าห้องเรียน</h2>
          </div>
          <span class="step-pill-tag pink">สแกนผ่านกล้องมือถือ</span>
        </div>

        <div class="step1-grid">
          <!-- ESP32 LCD Mockup -->
          <div class="tft-mini-screen">
            <div class="tft-head-bar">
              <span class="brand">SmartAccess DOOR</span>
              <span class="stat">ACTIVE</span>
            </div>
            <div class="tft-mid-content">
              <div class="tft-qr-box">
                <img src="${qrDataUri}" alt="Dynamic QR Code">
              </div>
              <div class="tft-room-details">
                <div class="r-lbl">ห้องปฏิบัติการ</div>
                <div class="r-code">CE-401</div>
                <div class="r-sub">ห้องปฏิบัติการคอมฯ</div>
              </div>
            </div>
            <div class="tft-foot-bar">
              <span>มทร.พระนคร (ครุศาสตร์)</span>
              <span class="ip">192.168.2.49</span>
            </div>
          </div>

          <!-- Description & Bullets -->
          <div class="step1-info-col">
            <p class="step1-desc-main">
              ใช้<strong>กล้องถ่ายรูปของสมาร์ตโฟน</strong> สแกนภาพ QR Code ที่กำลังเคลื่อนไหวอยู่บนหน้าจอ LCD 3.2" หน้าห้องปฏิบัติการ แล้วแตะเปิดลิงก์เพื่อเข้าสู่ระบบ
            </p>
            <div class="points-list">
              <div class="p-item">
                <span class="star">✦</span>
                <span><strong>Dynamic Token Security:</strong> รหัสเปลี่ยนทุก 60 วินาที ป้องกันการแคปรูปส่งต่อให้ผู้อื่น</span>
              </div>
              <div class="p-item">
                <span class="star">✦</span>
                <span><strong>Room Isolated:</strong> ลิงก์ตรงเข้าสู่ห้องเรียนเป้าหมายอย่างแม่นยำ ไม่สับสนข้ามห้อง</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- STEP 2: FILL REGISTRATION (HERO SHOWCASE) -->
      <section class="flow-card purple-card">
        <div class="card-title-row">
          <div class="step-num-badge">
            <div class="step-circle">2</div>
            <h2 class="step-heading">กรอกข้อมูลผู้ขอเข้าใช้งาน (ภาพหน้าจอระบบจริง)</h2>
          </div>
          <span class="step-pill-tag pink">SmartAccess Live Form</span>
        </div>

        <div class="step2-showcase">
          <!-- Real Mobile Phone Screenshot -->
          <div class="phone-device-wrap">
            <div class="phone-top-notch"></div>
            <div class="phone-screen-frame">
              <img src="${imgMobileForm}" alt="SmartAccess Mobile Registration">
            </div>
          </div>

          <!-- Real Data Fields Summary -->
          <div class="form-fields-overview">
            <div class="field-card-item">
              <span class="f-lbl">คำนำหน้า และ ชื่อ-นามสกุล:</span>
              <span class="f-val">นายชานนท์ สุขสวัสดิ์</span>
            </div>
            <div class="field-card-item">
              <span class="f-lbl">รหัสประจำตัวนักศึกษา:</span>
              <span class="f-val">076158050650-8</span>
            </div>
            <div class="field-card-item">
              <span class="f-lbl">ระดับชั้นปี:</span>
              <span class="f-val">นักศึกษาชั้นปีที่ 3</span>
            </div>
            <div class="field-card-item">
              <span class="f-lbl">คณะ:</span>
              <span class="f-val">คณะครุศาสตร์อุตสาหกรรม</span>
            </div>
            <div class="field-card-item">
              <span class="f-lbl">สาขาวิชา:</span>
              <span class="f-val">คอมพิวเตอร์และเทคโนโลยีฯ</span>
            </div>
          </div>

          <!-- Intelligent Auto-Fill Card -->
          <div class="autofill-feature-card">
            <div>
              <div class="af-top">
                <span>🎓 ระบบ Intelligent Auto-fill</span>
              </div>
              <p class="af-body">
                เพียงพิมพ์<strong>รหัสนักศึกษา</strong> ระบบจะค้นหาและดึงประวัติคณะ สาขา และชื่อเดิมมาเติมให้อัตโนมัติทันที
              </p>
            </div>
            <div class="af-badge-pill">⚡ ลดเวลาลงทะเบียนเหลือไม่ถึง 5 วินาที</div>
          </div>
        </div>
      </section>

      <!-- STEPS 3 & 4 (BALANCED 2 COLUMNS) -->
      <div class="steps-3-4-row">

        <!-- STEP 3: SUBMIT & QUEUE -->
        <section class="flow-card purple-card">
          <div class="card-title-row">
            <div class="step-num-badge">
              <div class="step-circle">3</div>
              <h2 class="step-heading">กดยืนยันส่งข้อมูลคำขอ</h2>
            </div>
            <span class="step-pill-tag pink">Real-Time Queue</span>
          </div>

          <div class="step3-inner">
            <div class="step3-btn">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="22" y1="2" x2="11" y2="13"/>
                <polygon points="22 2 15 22 11 13 2 9 22 2"/>
              </svg>
              <span>ส่งข้อมูลขอเปิดประตูผ่านระบบ</span>
            </div>

            <div class="step3-status-box">
              <div class="step3-status-left">
                <span class="pulse-dot"></span>
                <span>สถานะ: กำลังรอการอนุมัติ (Live)</span>
              </div>
              <span style="color:#94A3B8; font-size:2.1mm;">เช็กคิวอัตโนมัติทุก 3 วินาที</span>
            </div>

            <div class="step3-points-col">
              <div class="p-item">
                <span class="star">✦</span>
                <span><strong>Dashboard Alert:</strong> คำขอแจ้งเตือนขึ้นหน้าจออาจารย์ทันที</span>
              </div>
              <div class="p-item">
                <span class="star">✦</span>
                <span><strong>ไม่ต้องรีเฟรชหน้าเว็บ:</strong> ระบบเชื่อมต่อ Real-time Stream</span>
              </div>
            </div>
          </div>
        </section>

        <!-- STEP 4: ACCESS GRANTED -->
        <section class="flow-card green-card">
          <div class="card-title-row">
            <div class="step-num-badge">
              <div class="step-circle green-c">4</div>
              <h2 class="step-heading" style="color:#34D399;">อนุมัติสำเร็จ ประตูเปิดแล้ว!</h2>
            </div>
            <span class="step-pill-tag green">Access Granted</span>
          </div>

          <div class="step4-inner">
            <!-- Unlocked LCD Box -->
            <div class="unlocked-lcd-card">
              <div class="unlocked-ico">✓</div>
              <div class="unlocked-txt-1">ACCESS GRANTED</div>
              <div class="unlocked-txt-2">🔓 DOOR UNLOCKED</div>
              <div class="unlocked-name-tag">นายชานนท์ สุขสวัสดิ์</div>
            </div>

            <!-- Benefits -->
            <div class="step4-points-col">
              <div class="p-item green-p">
                <span style="color:#10B981;">✓</span>
                <span><strong>Auto Unlock:</strong> ปลดล็อกกลอนแม่เหล็ก 5 วินาที</span>
              </div>
              <div class="p-item green-p">
                <span style="color:#10B981;">✓</span>
                <span><strong>Audit Logged:</strong> บันทึกประวัติเวลาเข้าเรียนโปร่งใส</span>
              </div>
              <div class="p-item green-p">
                <span style="color:#10B981;">✓</span>
                <span><strong>Discord Bot:</strong> แจ้งเตือนห้องแชตเจ้าหน้าที่ทันที</span>
              </div>
            </div>
          </div>
        </section>

      </div>

    </main>

    <!-- ────────────────── 4. POWER FEATURES ────────────────── -->
    <section class="features-highlight-strip">
      <div class="feat-top-bar">
        <div class="feat-top-title">
          <span>⚡ สิทธิพิเศษและฟังก์ชันอำนวยความสะดวก</span>
        </div>
        <div class="feat-top-sub">ออกแบบเพื่อความสะดวก รวดเร็ว และความปลอดภัยสูงสุดของนักศึกษา</div>
      </div>

      <div class="feat-grid-3">
        <!-- Feature 1: Bypass 5 mins -->
        <div class="feat-col-box amber-highlight">
          <div class="feat-head-row amber">
            <span>⚡ สิทธิ์ Bypass อัตโนมัติ 5 นาที</span>
          </div>
          <p class="feat-body-txt">
            หากได้รับอนุมัติแล้วออกนอกห้องชั่วคราว <strong>สแกน QR หน้าห้องเดิมซ้ำภายใน 5 นาที</strong> ประตูจะปลดล็อกทันที <strong>ไม่ต้องกรอกข้อมูลใหม่และไม่ต้องรออนุมัติซ้ำ!</strong>
          </p>
        </div>

        <!-- Feature 2: Auto-Fill -->
        <div class="feat-col-box">
          <div class="feat-head-row purple">
            <span>🧠 Intelligent Auto-fill</span>
          </div>
          <p class="feat-body-txt">
            ระบบจดจำประวัติเดิม เพียงกรอกรหัสนักศึกษา ข้อมูลคณะและสาขาจะถูกเติมให้ทันที ลดเวลาลงทะเบียนเหลือไม่ถึง <strong>5 วินาที</strong>
          </p>
        </div>

        <!-- Feature 3: Security & Privacy -->
        <div class="feat-col-box">
          <div class="feat-head-row green">
            <span>🛡️ มาตรฐานความปลอดภัย PDPA</span>
          </div>
          <p class="feat-body-txt">
            จัดเก็บบันทึกประวัติการเข้า-ออกห้องเรียนใน Cloud เข้ารหัสปลอดภัย และเก็บ Log จราจร 90 วัน สอดคล้องตาม <strong>พ.ร.บ. คอมพิวเตอร์ฯ 2560</strong>
          </p>
        </div>
      </div>
    </section>

    <!-- ────────────────── 5. FOOTER ────────────────── -->
    <footer class="footer-bar-wrap">
      <div class="f-dept-col">
        <div class="f-dept-name">คณะครุศาสตร์อุตสาหกรรม มหาวิทยาลัยเทคโนโลยีราชมงคลพระนคร</div>
        <div class="f-dept-sub">สาขาวิชาวิศวกรรมคอมพิวเตอร์และเทคโนโลยีสารสนเทศ • อาคารปฏิบัติการเรียนการสอน</div>
      </div>

      <div class="f-warning-badge">
        <div class="f-w-head">⚠️ ข้อควรปฏิบัติเพื่อความปลอดภัย</div>
        <div class="f-w-body">โปรดสแกน QR Code หน้าห้องที่ต้องการเข้าจริงเท่านั้น และห้ามส่งต่อลิงก์ลงทะเบียนให้ผู้อื่น</div>
      </div>

      <div class="f-sys-badge">
        <span class="f-pill-brand">SmartAccess IoT System</span>
        <span class="f-ver-code">v2.4.0 • Enterprise Edition</span>
      </div>
    </footer>

  </div>

</body>
</html>`;

  const htmlPath = path.join(ROOT_DIR, 'smartaccess_poster_a4.html');
  fs.writeFileSync(htmlPath, html, 'utf8');
  console.log(`Saved Masterpiece HTML poster: ${htmlPath}`);

  const publicHtmlPath = path.join(__dirname, '..', 'public', 'smartaccess_poster_a4.html');
  fs.writeFileSync(publicHtmlPath, html, 'utf8');

  console.log('Rendering Masterpiece High-Res PNG and Vector PDF with Edge...');
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

    console.log('=== Masterpiece Poster Generated Successfully! ===');
  } catch (err) {
    console.error('Error generating masterpiece poster:', err);
  } finally {
    await browser.close();
  }
}

buildMasterpiecePoster();
