#ifndef SMARTACCESS_OFFLINE_PORTAL_H
#define SMARTACCESS_OFFLINE_PORTAL_H

// Offline web portal embedded in firmware flash.
// Dynamic placeholders are replaced before the page is sent.
static const char OFFLINE_PORTAL_HTML[] PROGMEM = R"SMARTACCESS_HTML(
<!doctype html>
<html lang="th">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>SmartAccess Offline</title>
  <style>
  *{box-sizing:border-box}body{margin:0;padding:18px;background:#07111f;color:#e5e7eb;font:14px system-ui,sans-serif}main{max-width:520px;margin:auto}header,.card{background:#111827;border:1px solid #334155;border-radius:16px;padding:18px;margin:12px 0}header{text-align:center}.status{color:#fbbf24;font-weight:800}h1{font-size:24px}h2{font-size:17px;margin:0 0 12px}.desc,footer{color:#94a3b8}label{display:block;margin:10px 0 5px}input,button{width:100%;min-height:44px;border-radius:10px;font:inherit}input{padding:9px;border:1px solid #475569;background:#0f172a;color:white}button{margin-top:10px;border:0;background:#10b981;font-weight:800}.danger button{background:#ef4444;color:white}.network button{background:#3b82f6;color:white}.warning{color:#fca5a5;font-size:12px}.ok{color:#34d399}footer{text-align:center;font-size:12px}
  </style>
</head>
<body>
  <main>
    <header>
      <div class="status">● OFFLINE MODE</div>
      <h1>SmartAccess Door Control</h1>
      <p class="desc">เชื่อมต่อกับ ESP32 โดยตรง ไม่จำเป็นต้องใช้อินเทอร์เน็ต</p>
      <p class="ok">{{STATUS_MESSAGE}}</p>
    </header>
    {{AUTH_SECTION}}
    <section class="card"><h2>QR สำหรับเปิดประตูออฟไลน์</h2><form method="post" action="/unlock"><label for="grant">Offline Door Grant</label><input id="grant" name="grant" autocomplete="off" required><button type="submit">ตรวจสอบ QR Grant</button></form></section>
    {{WIFI_SECTION}}
    <footer>AP: {{AP_SSID}} · http://{{AP_IP}}/</footer>
  </main>
</body>
</html>
)SMARTACCESS_HTML";

#endif
