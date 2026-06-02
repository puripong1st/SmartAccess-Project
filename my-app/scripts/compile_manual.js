/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log("Checking dependencies...");
try {
  require.resolve('marked');
} catch (e) {
  console.log("Installing 'marked' library...");
  execSync('npm install marked --no-save', { stdio: 'inherit', cwd: path.join(__dirname, '..') });
}

const { marked } = require('marked');

// Configure marked options
marked.setOptions({
  gfm: true,
  breaks: true,
  headerIds: true,
  mangle: false
});

const mdPath = path.join(__dirname, '..', '..', 'complete_system_manual_th.md');
const htmlOutputPathRoot = path.join(__dirname, '..', '..', 'complete_system_manual_th.html');
const htmlOutputPathPublic = path.join(__dirname, '..', 'public', 'complete_system_manual_th.html');

console.log(`Reading manual markdown from: ${mdPath}`);
if (!fs.existsSync(mdPath)) {
  console.warn(`[WARNING] complete_system_manual_th.md not found at ${mdPath}.`);
  console.warn("This is expected on Vercel deployment if only 'my-app' is uploaded in the root context.");
  console.warn("Skipping compilation and utilizing the committed public HTML manual instead.");
  process.exit(0); // Exit successfully to prevent Vercel build failures
}
let markdown = fs.readFileSync(mdPath, 'utf8');

// Replace alerts like > [!NOTE] with beautiful HTML alerts
markdown = markdown.replace(/>\s*\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]\s*\n>\s*([^\n]+)/gi, (match, type, content) => {
  const lowerType = type.toLowerCase();
  return `<div class="alert-box alert-${lowerType}"><strong>${type}:</strong> ${content}</div>`;
});

console.log("Compiling Markdown to HTML...");
let rawHtmlContent = marked(markdown);

// BULLETPROOF MERMAID BLOCK TRANSFORMATION
// This catches the standard <pre><code class="language-mermaid"> block, preserves newlines,
// decodes XML/HTML escapes, and transforms it into a clean <div class="mermaid"> block for Mermaid.js
const mermaidRegex = /<pre><code class="language-mermaid">([\s\S]*?)<\/code><\/pre>/g;
rawHtmlContent = rawHtmlContent.replace(mermaidRegex, (match, code) => {
  const decodedCode = code
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'");
  return `<div class="mermaid">${decodedCode}</div>`;
});

console.log("Injecting premium responsive CSS (fully supporting Mobile & iPad), print styles, and interactive navigation...");

const htmlTemplate = `<!DOCTYPE html>
<html lang="th">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>คู่มือระบบควบคุมประตู SmartAccess (Thesis Manual)</title>
  <link rel="icon" type="image/png" href="/icons/icon-128x128.png">
  
  <!-- Google Fonts & Icons -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link rel="preload" href="https://fonts.googleapis.com/css2?family=Sarabun:wght@300;400;500;600;700;800&family=Inter:wght@400;500;600;700;800&family=Fira+Code:wght@400;500;600&display=swap" as="style" onload="this.onload=null;this.rel='stylesheet'">
  <noscript><link href="https://fonts.googleapis.com/css2?family=Sarabun:wght@300;400;500;600;700;800&family=Inter:wght@400;500;600;700;800&family=Fira+Code:wght@400;500;600&display=swap" rel="stylesheet"></noscript>
  
  <!-- Prism.js for code syntax highlighting -->
  <link rel="preload" href="https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/themes/prism-tomorrow.min.css" as="style" onload="this.onload=null;this.rel='stylesheet'">
  <noscript><link href="https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/themes/prism-tomorrow.min.css" rel="stylesheet"></noscript>
  
  <!-- Modern HTML2Canvas & jsPDF for high-fidelity single section exports -->
  <script src="https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"></script>
  
  <style>
    :root {
      --primary: #7C3AED;        /* Purple */
      --primary-dark: #6D28D9;
      --primary-light: #A78BFA;
      --primary-pale: rgba(124, 58, 237, 0.05);
      --secondary: #DB2777;      /* Pink */
      --secondary-dark: #C2185B;
      --bg-primary: #F8FAFC;
      --bg-primary-blur: rgba(248, 250, 252, 0.85);
      --bg-card: #FFFFFF;
      --text-main: #1E293B;
      --text-muted: #64748B;
      --border: #E2E8F0;
      --code-bg: #0F172A;
      --shadow: 0 10px 25px -5px rgba(124, 58, 237, 0.05), 0 8px 10px -6px rgba(124, 58, 237, 0.05);
      --font-th: 'Sarabun', sans-serif;
      --font-mono: 'Fira Code', monospace;
      --font-display: 'Inter', sans-serif;
      --max-width: 72ch;
    }

    body.dark-mode {
      --bg-primary: #0F172A;
      --bg-primary-blur: rgba(15, 23, 42, 0.85);
      --bg-card: #1E293B;
      --text-main: #F1F5F9;
      --text-muted: #94A3B8;
      --border: #334155;
      --primary-pale: rgba(139, 92, 246, 0.15);
      --shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.3);
    }

    * {
      box-sizing: border-box;
      scroll-behavior: smooth;
    }

    body {
      margin: 0;
      padding: 0;
      font-family: var(--font-th);
      background-color: var(--bg-primary);
      color: var(--text-main);
      line-height: 1.75;
      font-size: 15.5px;
      transition: background-color 0.3s, color 0.3s;
    }

    /* Layout Wrapper */
    .app-container {
      display: flex;
      max-width: 1600px;
      margin: 0 auto;
      min-height: 100vh;
      position: relative;
    }

    /* Mobile Header Panel */
    .mobile-nav-bar {
      display: none;
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 56px;
      background: var(--bg-card);
      border-bottom: 1px solid var(--border);
      z-index: 1000;
      padding: 0 16px;
      align-items: center;
      justify-content: space-between;
      box-shadow: 0 2px 8px rgba(0,0,0,0.05);
    }

    .mobile-logo {
      font-weight: 800;
      font-size: 16px;
      background: linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      font-family: var(--font-display);
    }

    .btn-hamburger {
      background: var(--primary-pale);
      border: 1px solid var(--border);
      color: var(--primary);
      padding: 6px 12px;
      border-radius: 8px;
      font-weight: 700;
      font-size: 13px;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 6px;
    }

    /* Sidebar Navigation */
    .sidebar {
      width: 320px;
      height: 100vh;
      max-height: 100vh;
      position: sticky;
      top: 0;
      border-right: 1px solid var(--border);
      background-color: var(--bg-card);
      padding: 24px 12px 24px 24px;
      z-index: 99;
      flex-shrink: 0;
      transition: transform 0.3s ease;
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }

    .sidebar-header {
      margin-bottom: 20px;
      padding-bottom: 16px;
      border-bottom: 2px dashed var(--border);
      text-align: center;
      flex-shrink: 0;
    }

    .sidebar-logo {
      font-size: 21px;
      font-weight: 800;
      background: linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      margin-bottom: 4px;
      font-family: var(--font-display);
    }

    .sidebar-subtitle {
      font-size: 10px;
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 1.5px;
      font-weight: 600;
      font-family: var(--font-display);
    }

    .sidebar-search {
      width: 100%;
      padding: 10px 14px;
      border-radius: 10px;
      border: 1px solid var(--border);
      background-color: var(--bg-primary);
      color: var(--text-main);
      font-family: var(--font-th);
      font-size: 13px;
      margin-bottom: 16px;
      outline: none;
      transition: border-color 0.2s, box-shadow 0.2s;
      flex-shrink: 0;
    }

    .sidebar-search:focus {
      border-color: var(--primary);
      box-shadow: 0 0 0 3px rgba(124, 58, 237, 0.12);
    }

    .toc-menu {
      list-style: none;
      padding: 0;
      margin: 0;
      overflow-y: auto;
      flex-grow: 1;
      padding-right: 6px;
    }

    /* Slick Premium Scrollbar for TOC Menu */
    .toc-menu::-webkit-scrollbar {
      width: 5px;
    }
    .toc-menu::-webkit-scrollbar-track {
      background: transparent;
    }
    .toc-menu::-webkit-scrollbar-thumb {
      background: var(--border);
      border-radius: 3px;
    }
    .toc-menu::-webkit-scrollbar-thumb:hover {
      background: var(--primary-light);
    }

    .toc-group-header {
      font-weight: 700;
      font-size: 13px;
      color: var(--primary);
      padding: 10px 12px;
      margin-top: 10px;
      margin-bottom: 4px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      cursor: pointer;
      user-select: none;
      background-color: var(--bg-primary);
      border-radius: 8px;
      transition: all 0.2s;
      border-left: 2px solid transparent;
    }

    .toc-group-header:hover {
      background-color: var(--primary-pale);
      border-left-color: var(--primary);
    }

    .toc-group-list-wrapper {
      display: grid;
      grid-template-rows: 1fr;
      transition: grid-template-rows 0.3s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.2s ease-out;
      opacity: 1;
    }
    .toc-group-list-wrapper.collapsed {
      grid-template-rows: 0fr;
      opacity: 0;
      pointer-events: none;
    }
    .toc-group-list {
      list-style: none;
      padding: 0;
      margin: 0;
      margin-top: 4px;
      padding-left: 4px;
      overflow: hidden;
    }

    .toc-group-arrow {
      font-size: 9px;
      transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
      opacity: 0.7;
    }

    .toc-group-arrow.collapsed {
      transform: rotate(-90deg);
    }

    .toc-menu li {
      margin-bottom: 2px;
    }

    .toc-menu a {
      display: block;
      padding: 8px 12px;
      color: var(--text-main);
      text-decoration: none;
      font-size: 13px;
      border-radius: 8px;
      transition: all 0.2s ease;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .toc-menu a:hover {
      background-color: var(--bg-primary);
      color: var(--primary);
      padding-left: 16px;
    }

    .toc-menu a.active {
      background-color: var(--primary-pale);
      color: var(--primary-dark);
      font-weight: 700;
      border-left: 3px solid var(--primary);
      border-radius: 0 8px 8px 0;
      padding-left: 16px;
    }

    body.dark-mode .toc-menu a.active {
      color: var(--primary-light);
    }

    .toc-menu a.toc-h3 {
      padding-left: 20px;
      font-size: 12px;
      opacity: 0.8;
    }

    .toc-menu a.toc-h3:hover {
      padding-left: 24px;
    }

    .toc-menu a.toc-h3.active {
      padding-left: 24px;
    }

    /* Main Content Area */
    .main-content {
      flex: 1;
      padding: 40px 48px;
      overflow-x: hidden;
      background-color: var(--bg-primary);
      min-width: 0;
      display: flex;
      flex-direction: column;
      align-items: center;
    }

    .content-wrapper-max {
      width: 100%;
      max-width: var(--max-width);
      display: flex;
      flex-direction: column;
    }

    .content-card {
      background-color: var(--bg-card);
      border: 1px solid var(--border);
      border-radius: 16px;
      padding: 48px;
      box-shadow: var(--shadow);
      transition: background-color 0.3s, border-color 0.3s;
      position: relative;
    }

    /* 📌 Segmented Tabs Navigation at Top */
    .manual-tabs-container {
      position: sticky;
      top: 0;
      z-index: 95;
      background: var(--bg-primary-blur);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      padding: 16px 0;
      margin-bottom: 24px;
      border-bottom: 1px solid var(--border);
      width: 100%;
      display: flex;
      justify-content: center;
      transition: background-color 0.3s, border-color 0.3s;
    }

    .manual-tabs-scroller {
      width: 100%;
      max-width: var(--max-width);
      overflow-x: auto;
      scrollbar-width: none;
      -ms-overflow-style: none;
    }

    .manual-tabs-scroller::-webkit-scrollbar {
      display: none;
    }

    .manual-tabs {
      position: relative;
      display: flex;
      background: rgba(124, 58, 237, 0.04);
      border: 1px solid var(--border);
      padding: 4px;
      border-radius: 12px;
      width: max-content;
      margin: 0 auto;
      gap: 2px;
      transition: background-color 0.3s, border-color 0.3s;
    }

    body.dark-mode .manual-tabs {
      background: rgba(139, 92, 246, 0.05);
    }

    .tab-btn {
      position: relative;
      background: transparent;
      border: none;
      padding: 8px 16px;
      font-family: var(--font-th);
      font-size: 13px;
      font-weight: 600;
      color: var(--text-muted);
      cursor: pointer;
      border-radius: 8px;
      z-index: 2;
      transition: color 0.2s ease;
      display: flex;
      align-items: center;
      gap: 6px;
      white-space: nowrap;
    }

    .tab-btn:hover {
      color: var(--primary);
    }

    .tab-btn.active {
      color: var(--primary-dark);
    }

    body.dark-mode .tab-btn.active {
      color: var(--primary-light);
    }

    .tabs-slider-pill {
      position: absolute;
      top: 4px;
      left: 4px;
      height: calc(100% - 8px);
      background: var(--bg-card);
      border-radius: 8px;
      box-shadow: 0 4px 10px rgba(124, 58, 237, 0.06), 0 2px 4px rgba(0, 0, 0, 0.02);
      z-index: 1;
      transition: transform 0.25s cubic-bezier(0.4, 0, 0.2, 1), width 0.25s cubic-bezier(0.4, 0, 0.2, 1);
      pointer-events: none;
      border: 1px solid rgba(124, 58, 237, 0.1);
    }

    body.dark-mode .tabs-slider-pill {
      background: #243049;
      border-color: rgba(167, 139, 250, 0.15);
      box-shadow: 0 4px 10px rgba(0, 0, 0, 0.3);
    }

    /* 📊 Reading Progress Bar */
    .reading-progress-container {
      width: 100%;
      height: 4px;
      background: var(--border);
      border-radius: 2px;
      margin-bottom: 32px;
      overflow: hidden;
      flex-shrink: 0;
      transition: background-color 0.3s;
    }

    .reading-progress-bar {
      height: 100%;
      width: 0%;
      background: linear-gradient(90deg, var(--primary) 0%, var(--secondary) 100%);
      border-radius: 2px;
      transition: width 0.25s cubic-bezier(0.4, 0, 0.2, 1);
    }

    /* 📖 Manual Section Layout & Switch Animations */
    .manual-section {
      display: none;
      opacity: 0;
      transform: translateY(8px);
      transition: opacity 0.2s ease-out, transform 0.2s ease-out;
    }

    .manual-section.active {
      display: block;
      opacity: 1;
      transform: translateY(0);
    }

    /* Typography */
    h1 {
      font-size: 30px;
      font-weight: 800;
      color: var(--primary);
      line-height: 1.35;
      margin-top: 0;
      margin-bottom: 24px;
      border-bottom: 2px solid var(--border);
      padding-bottom: 16px;
      text-wrap: balance;
    }

    h2 {
      font-size: 22px;
      font-weight: 750;
      color: var(--primary-dark);
      margin-top: 36px;
      margin-bottom: 20px;
      border-bottom: 1px solid var(--border);
      padding-bottom: 8px;
      text-wrap: balance;
    }

    body.dark-mode h2 {
      color: var(--primary-light);
    }

    h3 {
      font-size: 17.5px;
      font-weight: 700;
      color: var(--secondary);
      margin-top: 28px;
      margin-bottom: 14px;
      text-wrap: balance;
    }

    p, li {
      color: var(--text-main);
      font-size: 15px;
      line-height: 1.75;
    }

    ul, ol {
      padding-left: 20px;
      margin-bottom: 20px;
    }

    li {
      margin-bottom: 6px;
    }

    /* Links */
    a {
      color: var(--primary);
      text-decoration: none;
      font-weight: 600;
      transition: color 0.15s;
    }

    a:hover {
      color: var(--primary-dark);
      text-decoration: underline;
    }

    /* Tables responsive wrapping */
    .table-container {
      width: 100%;
      overflow-x: auto;
      margin: 24px 0;
      border-radius: 10px;
      border: 1px solid var(--border);
      box-shadow: 0 2px 8px rgba(0,0,0,0.02);
      background-color: var(--bg-card);
    }

    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 14px;
      min-width: 600px;
    }

    th, td {
      padding: 12px 16px;
      border: 1px solid var(--border);
      text-align: left;
    }

    th {
      background-color: rgba(124, 58, 237, 0.03);
      font-weight: 700;
      color: var(--primary-dark);
    }
    
    body.dark-mode th {
      background-color: rgba(167, 139, 250, 0.04);
      color: var(--primary-light);
    }

    tr:nth-child(even) {
      background-color: rgba(124, 58, 237, 0.01);
    }

    /* Code Blocks syntax styling */
    .code-block-wrapper {
      position: relative;
      margin: 20px 0;
    }

    .code-block-wrapper:hover .btn-copy-code {
      opacity: 1;
    }

    .btn-copy-code {
      position: absolute;
      top: 10px;
      right: 10px;
      background: rgba(255, 255, 255, 0.08);
      backdrop-filter: blur(4px);
      -webkit-backdrop-filter: blur(4px);
      border: 1px solid rgba(255, 255, 255, 0.12);
      color: #E2E8F0;
      padding: 4px 8px;
      border-radius: 6px;
      font-size: 11px;
      font-family: var(--font-th);
      font-weight: 600;
      cursor: pointer;
      opacity: 0;
      transition: all 0.2s ease;
      z-index: 5;
    }

    .btn-copy-code:hover {
      background: var(--primary);
      border-color: var(--primary);
      color: white;
      transform: translateY(-1px);
    }

    pre {
      background-color: var(--code-bg) !important;
      color: #F8FAFC !important;
      border-radius: 10px;
      padding: 18px !important;
      overflow-x: auto;
      margin: 0 !important;
      box-shadow: 0 4px 10px rgba(0,0,0,0.15);
    }

    code {
      font-family: var(--font-mono);
      font-size: 13px;
      background-color: rgba(124, 58, 237, 0.06);
      color: var(--primary-dark);
      padding: 2px 6px;
      border-radius: 6px;
      word-break: normal;
      overflow-wrap: break-word;
    }

    table code {
      white-space: nowrap;
      word-break: normal;
    }

    body.dark-mode code {
      color: #F472B6;
      background-color: rgba(219, 39, 119, 0.12);
    }

    pre code {
      background-color: transparent !important;
      color: #E2E8F0 !important;
      padding: 0 !important;
      border-radius: 0;
    }

    /* Mermaid Diagrams Styling */
    .mermaid {
      background: white !important;
      padding: 20px;
      border-radius: 12px;
      border: 1px solid var(--border);
      margin: 24px 0;
      display: flex;
      justify-content: center;
      box-shadow: 0 4px 15px rgba(0,0,0,0.03);
      overflow-x: auto;
      position: relative;
      transition: background-color 0.3s, border-color 0.3s;
    }

    .mermaid-loader-skeleton {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 12px;
      width: 100%;
      min-height: 200px;
      background: rgba(248, 250, 252, 0.4);
      border-radius: 8px;
    }
    body.dark-mode .mermaid-loader-skeleton {
      background: rgba(30, 41, 59, 0.4);
    }
    .mermaid-loader-skeleton .spinner {
      width: 28px;
      height: 28px;
      border: 3px solid rgba(124, 58, 237, 0.12);
      border-top-color: var(--primary);
      border-radius: 50%;
      animation: mermaid-spin 1s linear infinite;
    }
    @keyframes mermaid-spin {
      to { transform: rotate(360deg); }
    }

    .mermaid svg {
      font-family: var(--font-th) !important;
      max-width: 100%;
      height: auto;
    }

    .mermaid svg foreignObject {
      overflow: visible !important;
    }
    .mermaid svg .nodeLabel,
    .mermaid svg .edgeLabel,
    .mermaid svg .label foreignObject > div {
      overflow: visible !important;
    }

    .mermaid div,
    .mermaid span,
    .mermaid div.label,
    .mermaid span.label,
    .mermaid p {
      font-family: var(--font-th) !important;
      line-height: 1.6 !important;
      font-size: 13px !important;
      color: #1E293B !important;
      font-weight: 500 !important;
      white-space: nowrap;
      overflow: visible !important;
    }
    
    .mermaid svg .node .label {
      overflow: visible !important;
    }
    
    body.dark-mode .mermaid div,
    body.dark-mode .mermaid span,
    body.dark-mode .mermaid div.label,
    body.dark-mode .mermaid span.label,
    body.dark-mode .mermaid p {
      color: #F8FAFC !important;
    }
    
    .mermaid .edgeLabel rect {
      fill: #FFFFFF !important;
      opacity: 0.95 !important;
      rx: 4px;
    }
    
    .mermaid .edgeLabel text {
      fill: #1E293B !important;
      font-size: 11px !important;
      font-weight: 600 !important;
    }

    body.dark-mode .mermaid {
      background: #1E293B !important;
      border-color: #334155 !important;
    }

    body.dark-mode .mermaid svg g.node rect,
    body.dark-mode .mermaid svg g.node circle,
    body.dark-mode .mermaid svg g.node polygon,
    body.dark-mode .mermaid svg g.node path {
      fill: #2E1065 !important;
      stroke: #A78BFA !important;
    }

    body.dark-mode .mermaid svg g.node .label,
    body.dark-mode .mermaid svg g.node text,
    body.dark-mode .mermaid svg text,
    body.dark-mode .mermaid svg tspan,
    body.dark-mode .mermaid svg span,
    body.dark-mode .mermaid svg div,
    body.dark-mode .mermaid svg .messageText,
    body.dark-mode .mermaid svg .messageText tspan,
    body.dark-mode .mermaid svg .loopText,
    body.dark-mode .mermaid svg .loopText tspan,
    body.dark-mode .mermaid svg .noteText,
    body.dark-mode .mermaid svg .noteText tspan,
    body.dark-mode .mermaid svg .labelText,
    body.dark-mode .mermaid svg .labelText tspan {
      fill: #F8FAFC !important;
      color: #F8FAFC !important;
    }

    body.dark-mode .mermaid svg .edgePath .path {
      stroke: #94A3B8 !important;
    }

    body.dark-mode .mermaid svg .edgeLabel rect {
      fill: #1E293B !important;
    }

    body.dark-mode .mermaid svg .edgeLabel text {
      fill: #F8FAFC !important;
    }

    body.dark-mode .mermaid svg .actor {
      fill: #2E1065 !important;
      stroke: #A78BFA !important;
    }

    body.dark-mode .mermaid svg text.actor {
      fill: #F8FAFC !important;
      stroke: none !important;
    }

    body.dark-mode .mermaid svg line {
      stroke: #94A3B8 !important;
    }

    body.dark-mode .mermaid svg .messageText {
      fill: #F8FAFC !important;
      stroke: none !important;
    }

    body.dark-mode .mermaid svg .labelBox {
      fill: #2E1065 !important;
      stroke: #A78BFA !important;
    }

    body.dark-mode .mermaid svg .labelText {
      fill: #F8FAFC !important;
    }

    body.dark-mode .mermaid svg .loopLine {
      stroke: #94A3B8 !important;
    }

    body.dark-mode .mermaid svg .loopText {
      fill: #F8FAFC !important;
    }

    body.dark-mode .mermaid svg .note {
      fill: #312E81 !important;
      stroke: #818CF8 !important;
    }

    body.dark-mode .mermaid svg .noteText {
      fill: #F8FAFC !important;
    }

    /* 🛡️ Alert Boxes (Callouts) - Bulletproof complete border */
    .alert-box {
      padding: 16px 20px;
      border: 1px solid var(--border);
      border-radius: 10px;
      margin: 20px 0;
      background-color: var(--primary-pale);
      font-size: 14.5px;
      line-height: 1.6;
    }

    .alert-box strong {
      display: inline-block;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.5px;
      padding: 2px 8px;
      border-radius: 4px;
      color: white;
      margin-bottom: 6px;
      text-transform: uppercase;
      font-family: var(--font-display);
    }

    .alert-note {
      border-color: #93C5FD;
      background-color: rgba(59, 130, 246, 0.04);
    }
    .alert-note strong {
      background-color: #3B82F6;
    }
    .alert-tip {
      border-color: #34D399;
      background-color: rgba(16, 185, 129, 0.04);
    }
    .alert-tip strong {
      background-color: #10B981;
    }
    .alert-warning {
      border-color: #FBBF24;
      background-color: rgba(245, 158, 11, 0.04);
    }
    .alert-warning strong {
      background-color: #D97706;
    }
    .alert-caution {
      border-color: #F87171;
      background-color: rgba(239, 68, 68, 0.04);
    }
    .alert-caution strong {
      background-color: #EF4444;
    }

    /* Section Actions wrapper and button styles */
    .section-actions {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      margin-left: 12px;
      vertical-align: middle;
    }

    .btn-section-export {
      background: rgba(124, 58, 237, 0.06);
      border: 1px solid rgba(124, 58, 237, 0.15);
      color: var(--primary);
      padding: 4px 8px;
      border-radius: 6px;
      font-size: 11px;
      font-weight: 700;
      font-family: var(--font-th);
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 4px;
      transition: all 0.2s;
    }

    .btn-section-export:hover {
      background: var(--primary);
      color: white;
      transform: translateY(-1px);
      box-shadow: 0 4px 8px rgba(124, 58, 237, 0.12);
    }
    
    body.dark-mode .btn-section-export {
      background: rgba(167, 139, 250, 0.1);
      border-color: rgba(167, 139, 250, 0.2);
      color: #A78BFA;
    }
    body.dark-mode .btn-section-export:hover {
      background: #7C3AED;
      color: white;
    }

    /* Header Panel with utilities */
    .header-panel {
      display: flex;
      justify-content: flex-end;
      gap: 10px;
      margin-bottom: 20px;
      width: 100%;
    }

    .btn-tool {
      background: var(--bg-card);
      border: 1px solid var(--border);
      color: var(--text-main);
      padding: 8px 16px;
      border-radius: 10px;
      cursor: pointer;
      font-family: var(--font-th);
      font-size: 13px;
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: 6px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.02);
      transition: all 0.2s;
    }

    .btn-tool:hover {
      border-color: var(--primary);
      color: var(--primary);
      transform: translateY(-1px);
    }

    /* 🧭 Page Nav Panel (Prev/Next buttons) */
    .manual-nav-panel {
      display: flex;
      justify-content: space-between;
      gap: 16px;
      margin-top: 40px;
      padding-top: 24px;
      border-top: 1px solid var(--border);
      width: 100%;
      flex-shrink: 0;
      transition: border-color 0.3s;
    }

    .nav-panel-btn {
      flex: 1;
      background: var(--bg-card);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 14px 18px;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 12px;
      transition: all 0.2s ease;
      min-height: 64px;
      text-decoration: none !important;
    }

    .nav-panel-btn:hover {
      border-color: var(--primary);
      background-color: var(--primary-pale);
      transform: translateY(-1px);
    }

    .nav-panel-btn.disabled {
      opacity: 0.3;
      pointer-events: none;
      cursor: not-allowed;
    }

    .nav-arrow {
      font-size: 18px;
      color: var(--primary);
      font-weight: 700;
      transition: transform 0.2s;
      font-family: var(--font-display);
    }

    .btn-prev:hover .nav-arrow {
      transform: translateX(-3px);
    }
    .btn-next:hover .nav-arrow {
      transform: translateX(3px);
    }

    .nav-btn-info {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      flex-grow: 1;
      min-width: 0;
    }

    .nav-btn-label {
      font-size: 10px;
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 0.5px;
      font-weight: 600;
    }

    .nav-btn-title {
      font-size: 13.5px;
      font-weight: 700;
      color: var(--text-main);
      margin-top: 2px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      width: 100%;
      text-align: left;
    }

    /* Backdrop Sidebar Overlay for mobile */
    .sidebar-overlay {
      display: none;
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(15, 23, 42, 0.4);
      backdrop-filter: blur(3px);
      z-index: 980;
    }

    .sidebar-overlay.active {
      display: block;
    }

    /* Back to Top button */
    .back-to-top {
      position: fixed;
      bottom: 24px;
      right: 24px;
      width: 42px;
      height: 42px;
      border-radius: 50%;
      background: linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%);
      color: white;
      border: none;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 18px;
      box-shadow: 0 4px 12px rgba(124,58,237,0.25);
      opacity: 0;
      visibility: hidden;
      transition: all 0.3s;
      z-index: 99;
    }

    .back-to-top.visible {
      opacity: 1;
      visibility: visible;
    }

    /* 📱📱 HIGH RESPONSIVENESS FOR TABLET (iPad) & MOBILE 📱📱 */
    @media (max-width: 1024px) {
      .mobile-nav-bar {
        display: flex;
      }

      .app-container {
        padding-top: 56px;
      }

      .sidebar {
        position: fixed;
        top: 0;
        left: 0;
        transform: translateX(-100%);
        z-index: 999;
        height: 100vh;
        box-shadow: 10px 0 25px rgba(0,0,0,0.1);
      }

      .sidebar.active {
        transform: translateX(0);
      }

      .main-content {
        padding: 20px 16px;
      }

      .content-card {
        padding: 24px 20px;
        border-radius: 12px;
      }

      h1 {
        font-size: 24px;
      }

      h2 {
        font-size: 19px;
        margin-top: 28px;
      }

      h3 {
        font-size: 16px;
      }

      pre {
        padding: 12px !important;
      }

      code {
        font-size: 12px;
      }
      
      .header-panel {
        margin-top: 4px;
        justify-content: center;
      }

      .manual-nav-panel {
        flex-direction: column;
        gap: 12px;
      }

      .nav-panel-btn {
        width: 100%;
        min-height: 56px;
      }
    }

    /* 🖨️ PRINT OPTIMIZED CSS (Save to PDF) */
    @media print {
      body {
        background-color: white !important;
        color: black !important;
        font-size: 12pt;
      }
      .sidebar, .header-panel, .back-to-top, .sidebar-search, .mobile-nav-bar, .sidebar-overlay, .manual-tabs-container, .manual-nav-panel, .reading-progress-container {
        display: none !important;
      }
      .main-content {
        padding: 0 !important;
        margin: 0 !important;
        width: 100% !important;
        display: block !important;
      }
      .content-wrapper-max {
        max-width: 100% !important;
      }
      .content-card {
        border: none !important;
        box-shadow: none !important;
        padding: 0 !important;
        background: transparent !important;
      }
      .manual-section {
        display: block !important;
        opacity: 1 !important;
        transform: none !important;
        page-break-after: always;
      }
      pre, code {
        background-color: #f1f5f9 !important;
        color: black !important;
        border: 1px solid #cbd5e1 !important;
        page-break-inside: avoid;
      }
      .mermaid {
        border: 1px solid var(--border) !important;
        box-shadow: none !important;
        page-break-inside: avoid;
      }
      h1, h2, h3 {
        page-break-after: avoid;
        color: black !important;
      }
      table {
        page-break-inside: auto;
      }
      tr {
        page-break-inside: avoid;
        page-break-after: auto;
      }
      .mermaid, pre, .table-container, .alert-box {
        content-visibility: visible !important;
      }
    }

    /* ⚡ Performance Optimizations for Large Documents */
    .mermaid, pre, .table-container, .alert-box {
      content-visibility: auto;
      contain-intrinsic-size: auto 150px;
    }
  </style>
</head>
<body>

  <!-- Top bar for Mobile & iPad -->
  <header class="mobile-nav-bar">
    <button class="btn-hamburger" onclick="toggleSidebar()">
      ☰ สารบัญ
    </button>
    <div class="mobile-logo">SmartAccess Manual</div>
  </header>

  <!-- Mobile Sidebar Backdrop Overlay -->
  <div class="sidebar-overlay" id="sidebarOverlay" onclick="toggleSidebar()"></div>

  <div class="app-container">
    <!-- Sidebar Left -->
    <aside class="sidebar" id="appSidebar">
      <div class="sidebar-header">
        <div class="sidebar-logo">SmartAccess</div>
        <div class="sidebar-subtitle">Thesis System Manual</div>
      </div>
      <input type="text" id="searchInput" class="sidebar-search" placeholder="🔍 ค้นหาหัวข้อคู่มือ...">
      <ul class="toc-menu" id="tocMenu">
        <!-- Will be populated dynamically -->
      </ul>
    </aside>

    <!-- Main Content Area -->
    <main class="main-content">
      <div class="content-wrapper-max">
        
        <!-- Utility Header -->
        <div class="header-panel">
          <button class="btn-tool" onclick="toggleReadingMode()">
            📖 <span id="readingModeText">โหมดแยกตอน</span>
          </button>
          <button class="btn-tool" onclick="toggleDarkMode()">
            🌓 <span id="themeText">โหมดมืด</span>
          </button>
          <button class="btn-tool" onclick="window.print()">
            🖨️ พิมพ์ / บันทึก PDF
          </button>
        </div>

        <!-- Sticky Segmented Tabs Control -->
        <div class="manual-tabs-container" id="tabsContainer">
          <div class="manual-tabs-scroller">
            <div class="manual-tabs" id="manualTabs">
              <button class="tab-btn active" onclick="selectTab(1)">
                <span>📘 ภาคหลัก</span>
              </button>
              <button class="tab-btn" onclick="selectTab(2)">
                <span>🔬 ภาคผนวก 1</span>
              </button>
              <button class="tab-btn" onclick="selectTab(3)">
                <span>⚙️ ภาควิศวกร</span>
              </button>
              <button class="tab-btn" onclick="selectTab(4)">
                <span>🎯 เจาะลึกพิเศษ</span>
              </button>
              <button class="tab-btn" onclick="selectTab(5)">
                <span>📚 เล่มโครงงาน</span>
              </button>
              <div class="tabs-slider-pill" id="tabsSliderPill"></div>
            </div>
          </div>
        </div>

        <article class="content-card" id="compiledContentCard">
          <!-- 📊 Reading Progress Bar Inside Card -->
          <div class="reading-progress-container">
            <div class="reading-progress-bar" id="readingProgressBar"></div>
          </div>

          <div id="compiledContent">
            ${rawHtmlContent}
          </div>

          <!-- 🧭 Page Prev/Next Navigation Controls -->
          <div class="manual-nav-panel" id="manualNavPanel">
            <button class="nav-panel-btn btn-prev" id="btnPrevSection" onclick="navigateToPrevSection()">
              <span class="nav-arrow">←</span>
              <div class="nav-btn-info">
                <span class="nav-btn-label">ตอนก่อนหน้า</span>
                <span class="nav-btn-title" id="prevSectionTitle">บทนำ</span>
              </div>
            </button>
            <button class="nav-panel-btn btn-next" id="btnNextSection" onclick="navigateToNextSection()">
              <div class="nav-btn-info" style="text-align: right;">
                <span class="nav-btn-label">ตอนถัดไป</span>
                <span class="nav-btn-title" id="nextSectionTitle">ภาพรวมระบบ</span>
              </div>
              <span class="nav-arrow">→</span>
            </button>
          </div>
        </article>

      </div>
    </main>
  </div>

  <button class="back-to-top" id="btnBackToTop" onclick="scrollToTop()" title="กลับไปด้านบน">
    ▲
  </button>

  <!-- Prism.js for code rendering (Deferred for instant page load) -->
  <script src="https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/prism.min.js" defer></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/components/prism-c.min.js" defer></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/components/prism-cpp.min.js" defer></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/components/prism-javascript.min.js" defer></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/components/prism-typescript.min.js" defer></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/components/prism-json.min.js" defer></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/components/prism-bash.min.js" defer></script>

  <!-- Mermaid.js for Dynamic Diagrams (Standard CDN) -->
  <script src="https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.min.js"></script>
  <script>
    mermaid.initialize({
      startOnLoad: false, // CRITICAL: Stop auto-rendering to prevent mobile CPU freezing!
      theme: 'default',
      securityLevel: 'loose',
      htmlLabels: true, // Render text via HTML foreignObject for perfect Thai font wrap and zero overlap!
      fontFamily: "'Sarabun', sans-serif",
      flowchart: {
        useMaxWidth: true,
        htmlLabels: true,
        nodeSpacing: 80, // Significantly increase horizontal space between nodes
        rankSpacing: 85, // Significantly increase vertical space between ranks
        padding: 18, // Extra breathing space inside node boxes
        curve: 'basis'  // Make lines smooth and curved
      },
      sequence: {
        actorMargin: 90,
        messageMargin: 50,
        boxMargin: 18,
        noteMargin: 16,
        wrap: true,
        width: 175
      }
    });
  </script>

  <script>
    // Reusable function to inject download triggers
    function injectDownloadButtons(div, svg, index) {
      const btnContainer = document.createElement("div");
      btnContainer.style.position = "absolute";
      btnContainer.style.top = "12px";
      btnContainer.style.right = "12px";
      btnContainer.style.display = "flex";
      btnContainer.style.gap = "8px";
      btnContainer.style.zIndex = "10";

      function styleMermaidBtn(btn) {
        btn.style.background = "linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%)";
        btn.style.color = "white";
        btn.style.border = "none";
        btn.style.padding = "6px 12px";
        btn.style.borderRadius = "8px";
        btn.style.fontSize = "11.5px";
        btn.style.fontWeight = "700";
        btn.style.cursor = "pointer";
        btn.style.boxShadow = "0 4px 10px rgba(124,58,237,0.15)";
        btn.style.fontFamily = "'Sarabun', sans-serif";
        btn.style.transition = "all 0.2s";

        btn.onmouseover = () => {
          btn.style.transform = "translateY(-1px)";
          btn.style.boxShadow = "0 6px 14px rgba(124,58,237,0.25)";
        };
        btn.onmouseout = () => {
          btn.style.transform = "translateY(0)";
          btn.style.boxShadow = "0 4px 10px rgba(124,58,237,0.15)";
        };
      }

      const btnPng = document.createElement("button");
      btnPng.innerHTML = "🖼️ เซฟรูป PNG";
      styleMermaidBtn(btnPng);
      btnPng.addEventListener("click", function() {
        saveSvgAsPng(div, "smartaccess_diagram_" + index + ".png");
      });

      const btnSvg = document.createElement("button");
      btnSvg.innerHTML = "📐 เซฟเวกเตอร์ SVG";
      styleMermaidBtn(btnSvg);
      btnSvg.addEventListener("click", function() {
        saveSvgAsSvg(svg, "smartaccess_diagram_" + index + ".svg");
      });

      const btnCopy = document.createElement("button");
      btnCopy.innerHTML = "📋 คัดลอกโค้ด Mermaid";
      styleMermaidBtn(btnCopy);
      btnCopy.style.background = "linear-gradient(135deg, #10B981 0%, #059669 100%)";
      btnCopy.addEventListener("click", function() {
        const rawCode = div.getAttribute("data-mermaid-code");
        if (rawCode) {
          navigator.clipboard.writeText(rawCode).then(() => {
            const originalText = btnCopy.innerHTML;
            btnCopy.innerHTML = "✅ คัดลอกสำเร็จ!";
            setTimeout(() => {
              btnCopy.innerHTML = originalText;
            }, 2000);
          }).catch(err => {
            console.error("Clipboard copy failed", err);
            alert("ไม่สามารถคัดลอกอัตโนมัติได้: " + err.message);
          });
        }
      });

      btnContainer.appendChild(btnCopy);
      btnContainer.appendChild(btnPng);
      btnContainer.appendChild(btnSvg);
      div.appendChild(btnContainer);
    }

    function initMermaidDiagrams() {
      const mermaidDivs = document.querySelectorAll(".mermaid");
      if (mermaidDivs.length === 0) return;

      const fontsReady = (function() {
        if (!document.fonts || !document.fonts.ready) return Promise.resolve();
        const loads = [
          document.fonts.load("400 14px Sarabun"),
          document.fonts.load("500 14px Sarabun"),
          document.fonts.load("600 14px Sarabun"),
          document.fonts.load("700 14px Sarabun")
        ];
        const timeoutPromise = new Promise(resolve => setTimeout(resolve, 800));
        const fontsPromise = Promise.all([document.fonts.ready, Promise.all(loads).catch(function(){})]);
        return Promise.race([fontsPromise, timeoutPromise]);
      })();

      mermaidDivs.forEach((div, index) => {
        const diagramNum = index + 1;
        const rawCode = div.textContent.trim();
        div.setAttribute("data-mermaid-code", rawCode);
        div.setAttribute("data-index", diagramNum);
        div.textContent = "";
        
        const skeleton = document.createElement("div");
        skeleton.className = "mermaid-loader-skeleton";
        skeleton.innerHTML = '<div class="spinner"></div>' +
          '<span style="font-size: 13px; color: var(--text-muted); font-weight: 600; font-family: Sarabun, sans-serif;">' +
          'กำลังโหลดไดอะแกรมที่ ' + diagramNum + '...' +
          '</span>';
        div.appendChild(skeleton);
      });

      const observer = new IntersectionObserver((entries, observerInstance) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const div = entry.target;
            observerInstance.unobserve(div);
            
            const rawCode = div.getAttribute("data-mermaid-code");
            const diagramIndex = div.getAttribute("data-index");
            const skeleton = div.querySelector(".mermaid-loader-skeleton");
            
            div.textContent = rawCode;

            fontsReady.then(() => window.mermaid.run({
              nodes: [div]
            })).then(() => {
              if (skeleton && skeleton.parentNode === div) {
                div.removeChild(skeleton);
              }
              
              const svg = div.querySelector("svg");
              if (!svg) return;
              
              div.style.position = "relative";
              div.style.paddingTop = "54px";
              
              injectDownloadButtons(div, svg, diagramIndex);
            }).catch(err => {
              console.error("Error rendering diagram " + diagramIndex + ":", err);
              if (skeleton) {
                skeleton.innerHTML = '<span style="color: #EF4444; font-size: 13px; font-weight: 600; font-family: Sarabun, sans-serif;">' +
                  '⚠️ ไม่สามารถแสดงผลไดอะแกรมที่ ' + diagramIndex + ' ได้' +
                  '</span>';
              }
            });
          }
        });
      }, {
        rootMargin: "250px 0px",
        threshold: 0.01
      });

      mermaidDivs.forEach(div => {
        observer.observe(div);
      });
    }

    if (document.readyState === "loading") {
      window.addEventListener("DOMContentLoaded", initMermaidDiagrams);
    } else {
      initMermaidDiagrams();
    }

    function saveSvgAsSvg(svgElement, fileName) {
      try {
        const svgClone = svgElement.cloneNode(true);
        const rect = svgElement.getBoundingClientRect();
        const width = rect.width || svgElement.viewBox.baseVal.width || 800;
        const height = rect.height || svgElement.viewBox.baseVal.height || 600;
        
        svgClone.setAttribute("width", width);
        svgClone.setAttribute("height", height);

        let mermaidStyles = "";
        try {
          const sheets = document.styleSheets;
          for (let i = 0; i < sheets.length; i++) {
            try {
              const sheet = sheets[i];
              if (sheet.ownerNode) {
                const nodeText = sheet.ownerNode.textContent || "";
                const nodeId = sheet.ownerNode.id || "";
                if (nodeId.startsWith("mermaid") || nodeText.includes(".mermaid") || nodeId.includes("mermaid")) {
                  mermaidStyles += nodeText + "\n";
                }
              }
            } catch (e) {}
          }
        } catch (e) {}

        if (mermaidStyles) {
          const styleEl = document.createElement("style");
          styleEl.textContent = mermaidStyles;
          svgClone.insertBefore(styleEl, svgClone.firstChild);
        }

        const svgString = new XMLSerializer().serializeToString(svgClone);
        let correctedSvgString = svgString;
        if (!svgString.includes('xmlns="http://www.w3.org/2000/svg"')) {
          correctedSvgString = svgString.replace(/^<svg/, '<svg xmlns="http://www.w3.org/2000/svg"');
        }
        
        const blob = new Blob([correctedSvgString], { type: 'image/svg+xml;charset=utf-8' });
        const URL = window.URL || window.webkitURL || window;
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } catch (e) {
        console.error("Error saving SVG", e);
        alert("ไม่สามารถบันทึกไฟล์ SVG ได้: " + e.message);
      }
    }

    function saveSvgAsPng(mermaidDiv, fileName) {
      try {
        const btnContainer = mermaidDiv.querySelector("div");
        if (btnContainer) {
          btnContainer.style.visibility = "hidden";
        }
        
        html2canvas(mermaidDiv, {
          scale: 3,
          useCORS: true,
          backgroundColor: "#FFFFFF",
          logging: false,
          onclone: function(clonedDoc) {
            clonedDoc.body.classList.remove("dark-mode");
            clonedDoc.querySelectorAll(".mermaid, pre, .table-container, .alert-box").forEach(el => {
              el.style.contentVisibility = "visible";
            });
            const clonedBtnContainer = clonedDoc.querySelector(".mermaid div");
            if (clonedBtnContainer) {
              clonedBtnContainer.style.display = "none";
            }
          }
        }).then(canvas => {
          if (btnContainer) {
            btnContainer.style.visibility = "visible";
          }
          
          const pngURL = canvas.toDataURL('image/png');
          const downloadLink = document.createElement('a');
          downloadLink.href = pngURL;
          downloadLink.download = fileName;
          document.body.appendChild(downloadLink);
          downloadLink.click();
          document.body.removeChild(downloadLink);
        }).catch(err => {
          console.error("html2canvas render failed, falling back to direct SVG draw", err);
          if (btnContainer) {
            btnContainer.style.visibility = "visible";
          }
          
          const svgElement = mermaidDiv.querySelector("svg");
          if (svgElement) {
            fallbackSaveSvgAsPng(svgElement, fileName);
          }
        });
      } catch (e) {
        console.error("Error converting to PNG", e);
        if (btnContainer) {
          btnContainer.style.visibility = "visible";
        }
        const svgElement = mermaidDiv.querySelector("svg");
        if (svgElement) {
          fallbackSaveSvgAsPng(svgElement, fileName);
        }
      }
    }

    function fallbackSaveSvgAsPng(svgElement, fileName) {
      try {
        const svgClone = svgElement.cloneNode(true);
        const rect = svgElement.getBoundingClientRect();
        const width = rect.width || svgElement.viewBox.baseVal.width || 800;
        const height = rect.height || svgElement.viewBox.baseVal.height || 600;
        
        svgClone.setAttribute("width", width);
        svgClone.setAttribute("height", height);

        let mermaidStyles = "";
        try {
          const sheets = document.styleSheets;
          for (let i = 0; i < sheets.length; i++) {
            try {
              const sheet = sheets[i];
              if (sheet.ownerNode) {
                const nodeText = sheet.ownerNode.textContent || "";
                const nodeId = sheet.ownerNode.id || "";
                if (nodeId.startsWith("mermaid") || nodeText.includes(".mermaid") || nodeId.includes("mermaid")) {
                  mermaidStyles += nodeText + "\n";
                }
              }
            } catch (e) {}
          }
        } catch (e) {}

        if (mermaidStyles) {
          const styleEl = document.createElement("style");
          styleEl.textContent = mermaidStyles;
          svgClone.insertBefore(styleEl, svgClone.firstChild);
        }

        const svgString = new XMLSerializer().serializeToString(svgClone);
        let correctedSvgString = svgString;
        if (!svgString.includes('xmlns="http://www.w3.org/2000/svg"')) {
          correctedSvgString = svgString.replace(/^<svg/, '<svg xmlns="http://www.w3.org/2000/svg"');
        }
        
        const blob = new Blob([correctedSvgString], { type: 'image/svg+xml;charset=utf-8' });
        const URL = window.URL || window.webkitURL || window;
        const blobURL = URL.createObjectURL(blob);
        
        const image = new Image();
        image.onload = () => {
          const scale = 2;
          const canvas = document.createElement('canvas');
          canvas.width = width * scale;
          canvas.height = height * scale;
          const context = canvas.getContext('2d');
          
          context.fillStyle = '#FFFFFF';
          context.fillRect(0, 0, canvas.width, canvas.height);
          context.drawImage(image, 0, 0, canvas.width, canvas.height);
          
          const pngURL = canvas.toDataURL('image/png');
          const downloadLink = document.createElement('a');
          downloadLink.href = pngURL;
          downloadLink.download = fileName;
          document.body.appendChild(downloadLink);
          downloadLink.click();
          document.body.removeChild(downloadLink);
          
          URL.revokeObjectURL(blobURL);
        };
        
        image.onerror = (err) => {
          console.error("Failed canvas rendering fallback", err);
          saveSvgAsSvg(svgElement, fileName.replace('.png', '.svg'));
        };
        
        image.src = blobURL;
      } catch (e) {
        console.error("Fallback PNG failed", e);
        saveSvgAsSvg(svgElement, fileName.replace('.png', '.svg'));
      }
    }
  </script>

  <script>
    // Global Section Registry
    let sectionList = []; // { id, title, tab, index, element }
    let activeSectionId = "";
    let isContinuousMode = false;
    let activeTabId = 1;

    // Helper to extract section number
    function getSectionNumber(text) {
      const cleanText = text.replace(/^§/, "").trim();
      const match = cleanText.match(/^(\d+)/);
      return match ? parseInt(match[1], 10) : null;
    }

    // Assign Tab ID based on section number and title
    function getTabForSection(sectionId, h2Text) {
      if (sectionId === "sec-cover") return 1;
      
      const num = getSectionNumber(h2Text);
      if (num !== null) {
        if (num >= 1 && num <= 19) return 1;
        if (num >= 20 && num <= 34) return 2;
        if (num >= 35 && num <= 44) return 3;
        if (num >= 45) return 4;
      }
      
      if (h2Text.includes("เล่มโครงงาน") || h2Text.includes("วิทยานิพนธ์") || h2Text.includes("ตัวเลขหัวข้อ")) {
        return 5;
      }
      
      return 1;
    }

    // Dynamic Content Partitioning & Navigation Setup
    document.addEventListener("DOMContentLoaded", function() {
      const content = document.getElementById("compiledContent");
      const children = Array.from(content.children);
      content.innerHTML = ""; // Clear raw markdown content wrapper

      // Create an intro cover section for anything before the first H2
      const coverSection = document.createElement("section");
      coverSection.className = "manual-section";
      coverSection.id = "sec-cover";
      content.appendChild(coverSection);
      let currentSection = coverSection;

      children.forEach((child) => {
        if (child.tagName === "H2" || child.tagName === "h2") {
          // Determine section ID
          let secId = child.id;
          if (!secId) {
            const num = getSectionNumber(child.textContent);
            secId = num !== null ? "sec-" + num : "sec-gen-" + Math.random().toString(36).substring(2, 6);
            child.id = secId;
          }

          currentSection = document.createElement("section");
          currentSection.className = "manual-section";
          currentSection.id = secId;
          content.appendChild(currentSection);
        }
        currentSection.appendChild(child);
      });

      // Remove coverSection if empty
      if (coverSection.children.length === 0) {
        coverSection.remove();
      }

      // Initialize Section Meta List
      const sections = document.querySelectorAll(".manual-section");
      sections.forEach((sec, idx) => {
        const h2 = sec.querySelector("h2");
        const h2Text = h2 ? h2.textContent.trim() : (sec.id === "sec-cover" ? "บทนำ / รายการหัวข้อ" : "ส่วนย่อย");
        const tabId = getTabForSection(sec.id, h2Text);
        
        sec.setAttribute("data-tab", tabId);
        sectionList.push({
          id: sec.id,
          title: h2Text,
          tab: tabId,
          index: idx,
          element: sec
        });
      });

      // Build Sidebar TOC dynamically
      buildSidebarTOC();

      // Initialize code copy buttons
      initCodeCopyButtons();

      // Load initial state based on URL Hash, or default to the first section
      let initialSecId = window.location.hash.substring(1);
      const initialSec = sectionList.find(s => s.id === initialSecId);
      
      if (initialSec) {
        activeTabId = initialSec.tab;
        activeSectionId = initialSec.id;
      } else {
        activeTabId = 1;
        activeSectionId = sectionList[0] ? sectionList[0].id : "";
      }

      // Set initial UI state
      selectTab(activeTabId, false);
      switchSection(activeSectionId, false);
      updateTabSlider();

      // Handle keyboard navigation
      document.addEventListener("keydown", function(e) {
        if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") return;
        if (e.key === "ArrowLeft") {
          navigateToPrevSection();
        } else if (e.key === "ArrowRight") {
          navigateToNextSection();
        }
      });
    });

    // Resize observer to update sliding pill slider on size changes
    window.addEventListener("resize", updateTabSlider);

    // Dynamic Sliding pill highlight
    function updateTabSlider() {
      const activeTabBtn = document.querySelectorAll(".tab-btn")[activeTabId - 1];
      const slider = document.getElementById("tabsSliderPill");
      if (activeTabBtn && slider) {
        slider.style.transform = "translateX(" + (activeTabBtn.offsetLeft - 4) + "px)";
        slider.style.width = activeTabBtn.offsetWidth + "px";
      }
    }

    // Build sidebar hierarchy groups
    function buildSidebarTOC() {
      const tocMenu = document.getElementById("tocMenu");
      tocMenu.innerHTML = "";

      const groups = [
        { id: "group-1", title: "📘 ภาคหลัก (1-19)", range: [1, 19], tab: 1 },
        { id: "group-2", title: "🔬 ภาคผนวก 1 (20-34)", range: [20, 34], tab: 2 },
        { id: "group-3", title: "⚙️ ภาควิศวกร (35-44)", range: [35, 44], tab: 3 },
        { id: "group-4", title: "🎯 เจาะลึกพิเศษ (45+)", range: [45, 999], tab: 4 },
        { id: "group-5", title: "📚 เล่มโครงงาน & สรุป", range: null, tab: 5 }
      ];

      const groupLists = {};
      
      groups.forEach(g => {
        const groupLi = document.createElement("li");
        groupLi.className = "toc-group-item";
        groupLi.setAttribute("data-tab-group", g.tab);

        const headerDiv = document.createElement("div");
        headerDiv.className = "toc-group-header";
        headerDiv.innerHTML = "<span>" + g.title + "</span><span class=\"toc-group-arrow collapsed\">▼</span>";
        headerDiv.dataset.groupId = g.id;

        const wrapper = document.createElement("div");
        wrapper.className = "toc-group-list-wrapper collapsed";

        const subUl = document.createElement("ul");
        subUl.className = "toc-group-list";
        subUl.id = g.id;
        wrapper.appendChild(subUl);

        headerDiv.addEventListener("click", () => {
          const isCollapsed = wrapper.classList.contains("collapsed");
          if (isCollapsed) {
            expandGroup(g.id);
          } else {
            wrapper.classList.add("collapsed");
            headerDiv.querySelector(".toc-group-arrow").classList.add("collapsed");
          }
        });

        groupLi.appendChild(headerDiv);
        groupLi.appendChild(wrapper);
        tocMenu.appendChild(groupLi);

        groupLists[g.id] = subUl;
      });

      // Populate sidebar list with H2 headers and H3 child headers
      sectionList.forEach((sec) => {
        const parentUl = getSidebarGroupForSection(sec, groupLists);
        if (!parentUl) return;

        // 1. Chapter Main Link (H2)
        const li = document.createElement("li");
        const a = document.createElement("a");
        a.href = "#" + sec.id;
        a.id = "toc-link-" + sec.id;
        a.title = sec.title;
        a.textContent = sec.title;
        
        a.addEventListener("click", (e) => {
          e.preventDefault();
          switchSection(sec.id);
          if (window.innerWidth <= 1024) {
            toggleSidebar();
          }
        });

        li.appendChild(a);
        parentUl.appendChild(li);

        // 2. Child Sections (H3) inside this manual-section div
        const h3Headers = sec.element.querySelectorAll("h3");
        h3Headers.forEach((h3, subIdx) => {
          if (!h3.id) {
            h3.id = sec.id + "-sub-" + subIdx;
          }
          const subLi = document.createElement("li");
          const subA = document.createElement("a");
          subA.href = "#" + h3.id;
          subA.id = "toc-link-" + h3.id;
          subA.className = "toc-h3";
          subA.title = h3.textContent.trim();
          subA.textContent = h3.textContent.trim();

          subA.addEventListener("click", (e) => {
            e.preventDefault();
            // Ensure parent section is active
            if (activeSectionId !== sec.id) {
              switchSection(sec.id, false);
            }
            // Wait slightly for animation render if section was inactive, then scroll to H3
            setTimeout(() => {
              const targetH3 = document.getElementById(h3.id);
              if (targetH3) {
                const offset = targetH3.getBoundingClientRect().top + window.scrollY - 100;
                window.scrollTo({ top: Math.max(0, offset), behavior: "smooth" });
              }
              history.pushState(null, null, "#" + h3.id);
            }, activeSectionId === sec.id ? 0 : 250);

            if (window.innerWidth <= 1024) {
              toggleSidebar();
            }
          });

          subLi.appendChild(subA);
          parentUl.appendChild(subLi);
        });
      });
    }

    function getSidebarGroupForSection(sec, groupLists) {
      if (sec.id === "sec-cover") {
        return groupLists["group-1"]; // Put cover intro in group 1
      }
      
      const num = getSectionNumber(sec.title);
      if (num !== null) {
        if (num >= 1 && num <= 19) return groupLists["group-1"];
        if (num >= 20 && num <= 34) return groupLists["group-2"];
        if (num >= 35 && num <= 44) return groupLists["group-3"];
        if (num >= 45) return groupLists["group-4"];
      }
      return groupLists["group-5"];
    }

    function expandGroup(groupId) {
      document.querySelectorAll(".toc-group-list-wrapper").forEach(wrapper => {
        const header = wrapper.previousElementSibling;
        const ul = wrapper.querySelector(".toc-group-list");
        const isTarget = ul && ul.id === groupId;
        
        if (isTarget) {
          wrapper.classList.remove("collapsed");
          if (header) {
            const arrow = header.querySelector(".toc-group-arrow");
            if (arrow) arrow.classList.remove("collapsed");
          }
        } else {
          wrapper.classList.add("collapsed");
          if (header) {
            const arrow = header.querySelector(".toc-group-arrow");
            if (arrow) arrow.classList.add("collapsed");
          }
        }
      });
    }

    // Select Main tab and filter sidebar groups
    window.selectTab = function(tabId, changeSection = true) {
      activeTabId = tabId;
      
      // Update Tab buttons styles
      const tabBtns = document.querySelectorAll(".tab-btn");
      tabBtns.forEach((btn, idx) => {
        if (idx === tabId - 1) {
          btn.classList.add("active");
        } else {
          btn.classList.remove("active");
        }
      });

      updateTabSlider();

      // In tab-based reading: filter sidebar TOC groups
      // Collapse groups and hide them if they are not in the selected tab
      document.querySelectorAll(".toc-group-item").forEach(item => {
        const grpTab = parseInt(item.getAttribute("data-tab-group"), 10);
        if (grpTab === tabId) {
          item.style.display = "block";
          const wrapper = item.querySelector(".toc-group-list-wrapper");
          if (wrapper) {
            wrapper.classList.remove("collapsed");
            const arrow = item.querySelector(".toc-group-arrow");
            if (arrow) arrow.classList.remove("collapsed");
          }
        } else {
          item.style.display = "none";
        }
      });

      // Switch to the first section of this tab
      if (changeSection) {
        const firstSectionOfTab = sectionList.find(s => s.tab === tabId);
        if (firstSectionOfTab) {
          switchSection(firstSectionOfTab.id);
        }
      }
    };

    // Switch reading chapters smoothly
    window.switchSection = function(sectionId, smoothScroll = true) {
      const sectionMeta = sectionList.find(s => s.id === sectionId);
      if (!sectionMeta) return;

      const oldSectionId = activeSectionId;
      activeSectionId = sectionId;

      // Handle Tab mismatch if link clicked from external area (e.g. search result)
      if (sectionMeta.tab !== activeTabId) {
        selectTab(sectionMeta.tab, false);
      }

      if (!isContinuousMode) {
        // --- 📖 Page-by-Page transition logic ---
        const activeSecEl = document.querySelector(".manual-section.active");
        
        if (activeSecEl && activeSecEl.id !== sectionId) {
          // Fade-out animation for active section
          activeSecEl.style.opacity = "0";
          activeSecEl.style.transform = "translateY(6px)";
          
          setTimeout(() => {
            activeSecEl.classList.remove("active");
            activeSecEl.style.display = "none";

            // Trigger Fade-in for target section
            renderTargetSection(sectionMeta.element, smoothScroll);
          }, 150); // Timeout matched to CSS 0.2s duration
        } else {
          renderTargetSection(sectionMeta.element, smoothScroll);
        }
      } else {
        // --- 📖 Continuous Scroll mode logic ---
        const targetEl = document.getElementById(sectionId);
        if (targetEl && smoothScroll) {
          const offset = targetEl.getBoundingClientRect().top + window.scrollY - 120;
          window.scrollTo({ top: Math.max(0, offset), behavior: "smooth" });
        }
        highlightSidebar(sectionId);
        updateProgressBar(sectionId);
      }

      // Sync active state in browser URL history
      if (history.pushState && window.location.hash !== "#" + sectionId) {
        history.pushState(null, null, "#" + sectionId);
      }
    };

    function renderTargetSection(el, smoothScroll) {
      el.style.display = "block";
      el.offsetHeight; // Force DOM layout engine recalculation
      el.classList.add("active");
      el.style.opacity = "1";
      el.style.transform = "translateY(0)";

      if (smoothScroll) {
        // Scroll to card top smoothly to prevent jumpiness
        const card = document.getElementById("compiledContentCard");
        if (card) {
          const offset = card.getBoundingClientRect().top + window.scrollY - 100;
          window.scrollTo({ top: Math.max(0, offset), behavior: "smooth" });
        }
      }

      highlightSidebar(activeSectionId);
      updateProgressBar(activeSectionId);
      updateNavButtons(activeSectionId);
    }

    function highlightSidebar(secId) {
      document.querySelectorAll("#tocMenu a").forEach(link => {
        if (link.id === "toc-link-" + secId) {
          link.classList.add("active");
          
          // Auto center sidebar scroll if item is out of bounds
          const sidebar = document.getElementById("appSidebar");
          const tocMenu = document.getElementById("tocMenu");
          if (sidebar && !sidebar.matches(':hover')) {
            requestAnimationFrame(() => {
              const linkRect = link.getBoundingClientRect();
              const menuRect = tocMenu.getBoundingClientRect();
              if (linkRect.top < menuRect.top || linkRect.bottom > menuRect.bottom) {
                const linkOffset = link.offsetTop - tocMenu.offsetTop;
                const targetScroll = linkOffset - (tocMenu.clientHeight / 2) + (link.clientHeight / 2);
                tocMenu.scrollTo({ top: Math.max(0, targetScroll), behavior: 'smooth' });
              }
            });
          }
        } else {
          link.classList.remove("active");
        }
      });
    }

    // Update Top Reading Progress bar
    function updateProgressBar(secId) {
      const idx = sectionList.findIndex(s => s.id === secId);
      if (idx === -1) return;
      const progress = ((idx + 1) / sectionList.length) * 100;
      document.getElementById("readingProgressBar").style.width = progress + "%";
    }

    // Render Prev/Next button links
    function updateNavButtons(secId) {
      const idx = sectionList.findIndex(s => s.id === secId);
      const prevBtn = document.getElementById("btnPrevSection");
      const nextBtn = document.getElementById("btnNextSection");
      const prevTitle = document.getElementById("prevSectionTitle");
      const nextTitle = document.getElementById("nextSectionTitle");

      if (idx > 0) {
        prevBtn.classList.remove("disabled");
        const prevSec = sectionList[idx - 1];
        prevBtn.onclick = () => switchSection(prevSec.id);
        prevTitle.textContent = prevSec.title;
      } else {
        prevBtn.classList.add("disabled");
        prevTitle.textContent = "ไม่มีหน้าก่อนหน้า";
      }

      if (idx < sectionList.length - 1) {
        nextBtn.classList.remove("disabled");
        const nextSec = sectionList[idx + 1];
        nextBtn.onclick = () => switchSection(nextSec.id);
        nextTitle.textContent = nextSec.title;
      } else {
        nextBtn.classList.add("disabled");
        nextTitle.textContent = "สิ้นสุดเล่มคู่มือ";
      }
    }

    window.navigateToPrevSection = function() {
      const idx = sectionList.findIndex(s => s.id === activeSectionId);
      if (idx > 0) {
        switchSection(sectionList[idx - 1].id);
      }
    };

    window.navigateToNextSection = function() {
      const idx = sectionList.findIndex(s => s.id === activeSectionId);
      if (idx < sectionList.length - 1) {
        switchSection(sectionList[idx + 1].id);
      }
    };

    // Toggle Reading Modes: Continuous vs Chapter Page
    window.toggleReadingMode = function() {
      isContinuousMode = !isContinuousMode;
      const textSpan = document.getElementById("readingModeText");
      const navPanel = document.getElementById("manualNavPanel");
      const tabContainer = document.getElementById("tabsContainer");

      if (isContinuousMode) {
        textSpan.textContent = "โหมดอ่านต่อเนื่อง";
        navPanel.style.display = "none";
        tabContainer.style.display = "none";

        // Show all sections at once for vertical scroll
        document.querySelectorAll(".manual-section").forEach(sec => {
          sec.style.display = "block";
          sec.style.opacity = "1";
          sec.style.transform = "none";
          sec.classList.add("active");
        });

        // Show all sidebar TOC groups
        document.querySelectorAll(".toc-group-item").forEach(item => {
          item.style.display = "block";
          const wrapper = item.querySelector(".toc-group-list-wrapper");
          if (wrapper) wrapper.classList.add("collapsed");
        });

        // Scroll to active section element
        const activeEl = document.getElementById(activeSectionId);
        if (activeEl) {
          activeEl.scrollIntoView({ behavior: "smooth" });
        }
      } else {
        textSpan.textContent = "โหมดแยกตอน";
        navPanel.style.display = "flex";
        tabContainer.style.display = "flex";

        // Filter TOC groups again based on tab
        selectTab(activeTabId, false);

        // Hide all sections except active section
        document.querySelectorAll(".manual-section").forEach(sec => {
          if (sec.id === activeSectionId) {
            sec.style.display = "block";
            sec.style.opacity = "1";
            sec.classList.add("active");
          } else {
            sec.style.display = "none";
            sec.style.opacity = "0";
            sec.classList.remove("active");
          }
        });

        switchSection(activeSectionId);
      }
    };

    // Advanced search listener updates
    const searchInput = document.getElementById("searchInput");
    searchInput.addEventListener("input", function(e) {
      const query = e.target.value.toLowerCase().trim();
      
      if (query === "") {
        // Reset sidebar groups filter based on current active tab
        selectTab(activeTabId, false);
        document.querySelectorAll(".toc-group-list li").forEach(li => li.style.display = "");
        return;
      }

      // Expand all groups and show matches
      document.querySelectorAll(".toc-group-list-wrapper").forEach(wrapper => {
        const list = wrapper.querySelector(".toc-group-list");
        if (!list) return;
        let hasMatch = false;
        
        list.querySelectorAll("li").forEach(li => {
          const text = li.textContent.toLowerCase();
          if (text.includes(query)) {
            li.style.display = "block";
            hasMatch = true;
          } else {
            li.style.display = "none";
          }
        });

        const groupItem = wrapper.closest(".toc-group-item");
        const header = wrapper.previousElementSibling;
        if (hasMatch) {
          wrapper.classList.remove("collapsed");
          if (header) {
            header.querySelector(".toc-group-arrow").classList.remove("collapsed");
            header.style.display = "flex";
          }
          if (groupItem) groupItem.style.display = "block";
        } else {
          wrapper.classList.add("collapsed");
          if (header) {
            header.querySelector(".toc-group-arrow").classList.add("collapsed");
            header.style.display = "none";
          }
          if (groupItem) groupItem.style.display = "none";
        }
      });
    });

    // Dark Mode Toggle
    window.toggleDarkMode = function() {
      document.body.classList.toggle("dark-mode");
      const isDark = document.body.classList.contains("dark-mode");
      document.getElementById("themeText").textContent = isDark ? "โหมดสว่าง" : "โหมดมืด";
    };

    // Scroll to Top Handler
    const btnBackToTop = document.getElementById("btnBackToTop");
    window.onscroll = function() {
      if (document.body.scrollTop > 300 || document.documentElement.scrollTop > 300) {
        btnBackToTop.classList.add("visible");
      } else {
        btnBackToTop.classList.remove("visible");
      }
    };

    window.scrollToTop = function() {
      if (isContinuousMode) {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        const card = document.getElementById("compiledContentCard");
        if (card) {
          const offset = card.getBoundingClientRect().top + window.scrollY - 100;
          window.scrollTo({ top: Math.max(0, offset), behavior: 'smooth' });
        }
      }
    };

    window.toggleSidebar = function() {
      const sidebar = document.getElementById("appSidebar");
      const overlay = document.getElementById("sidebarOverlay");
      sidebar.classList.toggle("active");
      overlay.classList.toggle("active");
    };

    // Dynamic Copy code triggers for pre-blocks
    function initCodeCopyButtons() {
      document.querySelectorAll("pre").forEach((pre, idx) => {
        if (pre.querySelector(".language-mermaid") || pre.classList.contains("mermaid")) return;

        // Wrap pre block
        const wrapper = document.createElement("div");
        wrapper.className = "code-block-wrapper";
        pre.parentNode.insertBefore(wrapper, pre);
        wrapper.appendChild(pre);

        // Append Copy button
        const copyBtn = document.createElement("button");
        copyBtn.className = "btn-copy-code";
        copyBtn.innerHTML = "📋 คัดลอก";
        
        copyBtn.addEventListener("click", () => {
          const rawCode = pre.textContent.trim();
          navigator.clipboard.writeText(rawCode).then(() => {
            copyBtn.innerHTML = "✅ คัดลอกแล้ว!";
            setTimeout(() => {
              copyBtn.innerHTML = "📋 คัดลอก";
            }, 2000);
          }).catch(err => {
            console.error("Copy code block failed", err);
          });
        });

        wrapper.appendChild(copyBtn);
      });
    }
  </script>

  <!-- Section Actions Export Scripts -->
  <script>
    document.addEventListener("DOMContentLoaded", function() {
      const headers = document.querySelectorAll("#compiledContent h2");

      function getSectionElements(h2Element) {
        const elements = [];
        let next = h2Element.nextElementSibling;
        while (next && next.tagName !== "H2") {
          elements.push(next);
          if (next.tagName === "HR") break;
          next = next.nextElementSibling;
        }
        return elements;
      }

      window.exportSection = function(headerId, format) {
        const header = document.getElementById(headerId);
        if (!header) return;

        const tempContainer = document.createElement("div");
        tempContainer.className = "compiled-export-temp";
        
        const hiddenWrapper = document.createElement("div");
        hiddenWrapper.className = "compiled-export-wrapper";
        hiddenWrapper.style.position = "absolute";
        hiddenWrapper.style.top = "0";
        hiddenWrapper.style.left = "0";
        hiddenWrapper.style.width = "850px";
        hiddenWrapper.style.height = "auto";
        hiddenWrapper.style.opacity = "1";
        hiddenWrapper.style.visibility = "visible";
        hiddenWrapper.style.pointerEvents = "none";
        hiddenWrapper.style.zIndex = "-99999";
        document.body.appendChild(hiddenWrapper);

        const headerClone = header.cloneNode(true);
        const actionsPanel = headerClone.querySelector(".section-actions");
        if (actionsPanel) {
          headerClone.removeChild(actionsPanel);
        }
        tempContainer.appendChild(headerClone);

        const sectionElements = getSectionElements(header);
        sectionElements.forEach(el => {
          if (el.classList.contains("section-actions") || el.innerHTML.includes("กลับสารบัญ")) {
            return;
          }
          
          const clone = el.cloneNode(true);
          const originalMermaidSvg = el.classList.contains("mermaid") ? el.querySelector("svg") : el.querySelector(".mermaid svg");
          const cloneMermaidTarget = clone.classList.contains("mermaid") ? clone : clone.querySelector(".mermaid");
          
          if (originalMermaidSvg && cloneMermaidTarget) {
            cloneMermaidTarget.innerHTML = originalMermaidSvg.outerHTML;
            cloneMermaidTarget.style.paddingTop = "0px";
            cloneMermaidTarget.style.position = "relative";
          }
          
          tempContainer.appendChild(clone);
        });

        tempContainer.style.background = "#FFFFFF";
        tempContainer.style.color = "#1E293B";
        tempContainer.style.padding = "40px";
        tempContainer.style.fontFamily = "'Sarabun', sans-serif";
        tempContainer.style.borderRadius = "12px";
        tempContainer.style.width = "800px";
        tempContainer.style.boxSizing = "border-box";
        
        hiddenWrapper.appendChild(tempContainer);

        let cleanTitle = "";
        for (let i = 0; i < header.childNodes.length; i++) {
          const node = header.childNodes[i];
          if (node.nodeType === Node.TEXT_NODE) {
            cleanTitle += node.textContent;
          }
        }
        cleanTitle = cleanTitle.trim().replace(/[\\/\\\\?%*:|\"\u003c\u003e\\s]/g, "_").substring(0, 80);
        if (!cleanTitle) {
          cleanTitle = "Section_" + headerId;
        }

        const canvasOptions = {
          scale: 2,
          useCORS: true,
          backgroundColor: "#FFFFFF",
          logging: false,
          onclone: function(clonedDoc) {
            clonedDoc.body.classList.remove("dark-mode");
            const clonedWrapper = clonedDoc.querySelector(".compiled-export-wrapper");
            if (clonedWrapper) {
              clonedWrapper.style.opacity = "1";
              clonedWrapper.style.visibility = "visible";
              clonedWrapper.style.position = "absolute";
              clonedWrapper.style.top = "0";
              clonedWrapper.style.left = "0";
              clonedWrapper.style.zIndex = "1";
            }

            const clonedTemp = clonedDoc.querySelector(".compiled-export-temp");
            if (clonedTemp) {
              clonedTemp.style.opacity = "1";
              clonedTemp.style.visibility = "visible";
            }

            clonedDoc.querySelectorAll(".mermaid, pre, .table-container, .alert-box").forEach(el => {
              el.style.contentVisibility = "visible";
              const btnGroup = el.querySelector("div");
              if (btnGroup) {
                btnGroup.style.display = "none";
              }
            });
          }
        };

        if (format === 'pdf') {
          html2canvas(tempContainer, canvasOptions).then(canvas => {
            try {
              let jsPDFClass = null;
              if (window.jspdf && window.jspdf.jsPDF) {
                jsPDFClass = window.jspdf.jsPDF;
              } else if (window.jsPDF) {
                jsPDFClass = window.jsPDF;
              }
              
              if (!jsPDFClass) {
                throw new Error("jsPDF library not loaded");
              }

              const pdf = new jsPDFClass('p', 'mm', 'a4');
              const margin = 15;
              const pageWidth = 210;
              const pageHeight = 297;
              const printableWidth = pageWidth - (2 * margin);
              const printableHeight = pageHeight - (2 * margin);

              const imgWidth = printableWidth;
              const imgHeight = (canvas.height * imgWidth) / canvas.width;
              const imgData = canvas.toDataURL('image/jpeg', 1.0);
              
              let heightLeft = imgHeight;
              let position = margin;

              pdf.addImage(imgData, 'JPEG', margin, position, imgWidth, imgHeight);
              heightLeft -= printableHeight;

              while (heightLeft > 0) {
                position = heightLeft - imgHeight + margin;
                pdf.addPage();
                pdf.addImage(imgData, 'JPEG', margin, position, imgWidth, imgHeight);
                heightLeft -= printableHeight;
              }

              pdf.save(cleanTitle + ".pdf");
            } catch (err) {
              console.error("PDF generation error:", err);
              alert("เกิดข้อผิดพลาดในการสร้าง PDF: " + err.message);
            } finally {
              if (hiddenWrapper && hiddenWrapper.parentNode) {
                hiddenWrapper.parentNode.removeChild(hiddenWrapper);
              }
            }
          }).catch(err => {
            console.error("html2canvas error during PDF capture:", err);
            alert("ไม่สามารถสร้างรูปภาพสำหรับการบันทึก PDF ได้");
            if (hiddenWrapper && hiddenWrapper.parentNode) {
              hiddenWrapper.parentNode.removeChild(hiddenWrapper);
            }
          });
          
        } else if (format === 'png') {
          html2canvas(tempContainer, canvasOptions).then(canvas => {
            try {
              const link = document.createElement("a");
              link.href = canvas.toDataURL("image/png");
              link.download = cleanTitle + ".png";
              link.click();
            } catch (err) {
              console.error("PNG export download error:", err);
            } finally {
              if (hiddenWrapper && hiddenWrapper.parentNode) {
                hiddenWrapper.parentNode.removeChild(hiddenWrapper);
              }
            }
          }).catch(err => {
            console.error("PNG export failed:", err);
            alert("ไม่สามารถบันทึกไฟล์รูปภาพ PNG ได้");
            if (hiddenWrapper && hiddenWrapper.parentNode) {
              hiddenWrapper.parentNode.removeChild(hiddenWrapper);
            }
          });
        }
      };

      // Append Export section actions dynamically
      headers.forEach(h => {
        const actionSpan = document.createElement("span");
        actionSpan.className = "section-actions";
        
        const btnPdf = document.createElement("button");
        btnPdf.className = "btn-section-export";
        btnPdf.innerHTML = "📄 เซฟ PDF ส่วนนี้";
        btnPdf.onclick = () => window.exportSection(h.id, 'pdf');
        
        const btnPng = document.createElement("button");
        btnPng.className = "btn-section-export";
        btnPng.innerHTML = "🖼️ เซฟรูป";
        btnPng.onclick = () => window.exportSection(h.id, 'png');
        
        actionSpan.appendChild(btnPdf);
        actionSpan.appendChild(btnPng);
        h.appendChild(actionSpan);
      });

      // Align กลับสารบัญ links and append export buttons
      const paragraphs = document.querySelectorAll("#compiledContent p");
      paragraphs.forEach(p => {
        if (p.innerHTML.includes("กลับไปที่หัวข้อสำหรับนำไปจัดทำเล่มโครงงาน") || p.innerHTML.includes("กลับสารบัญ")) {
          let prev = p.previousElementSibling;
          let parentHeaderId = null;
          while (prev) {
            if (prev.tagName === "H2") {
              parentHeaderId = prev.id;
              break;
            }
            prev = prev.previousElementSibling;
          }

          if (parentHeaderId) {
            p.style.display = "flex";
            p.style.alignItems = "center";
            p.style.justifyContent = "flex-end";
            p.style.gap = "12px";
            p.style.margin = "20px 0";

            const inlineActions = document.createElement("span");
            inlineActions.style.display = "inline-flex";
            inlineActions.style.gap = "8px";

            const btnPdf = document.createElement("button");
            btnPdf.className = "btn-section-export";
            btnPdf.innerHTML = "📄 เซฟ PDF ส่วนนี้";
            btnPdf.onclick = () => window.exportSection(parentHeaderId, 'pdf');

            const btnPng = document.createElement("button");
            btnPng.className = "btn-section-export";
            btnPng.innerHTML = "🖼️ เซฟรูป";
            btnPng.onclick = () => window.exportSection(parentHeaderId, 'png');

            inlineActions.appendChild(btnPdf);
            inlineActions.appendChild(btnPng);
            p.insertBefore(inlineActions, p.firstChild);
          }
        }
      });
    });
  </script>
</body>
</html>`;

console.log(`Writing fully pre-rendered static HTML to root: ${htmlOutputPathRoot}`);
fs.writeFileSync(htmlOutputPathRoot, htmlTemplate, 'utf8');

console.log(`Writing fully pre-rendered static HTML to public: ${htmlOutputPathPublic}`);
fs.writeFileSync(htmlOutputPathPublic, htmlTemplate, 'utf8');

console.log("Success! Compiled complete_system_manual_th.html in both locations with full Mobile/iPad support, Mermaid renderer, and PNG download triggers is ready!");
