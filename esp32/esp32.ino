/*
  ==============================================================
  SmartAccess Door Access Controller - Firmware for ESP32
  ห้องปฏิบัติการเรียนการสอน: Classroom A-401
  โหมด: Physical ESP32 Board
  ระบบรองรับการรันผ่านคลาวด์ Vercel (HTTPS WiFiClientSecure)
  ==============================================================
*/
// #define WOKWI_SIM  // Uncomment ONLY when running in Wokwi Simulator — NEVER
// in production!
#define DEBUG_MODE false // ⚠️ Set true for development ONLY

#if DEBUG_MODE
#define DBG(x) Serial.println(x)
#define DBGF(fmt, ...) Serial.printf(fmt, __VA_ARGS__)
#else
#define DBG(x)
#define DBGF(fmt, ...)
#endif

#include "ricmoo_qrcode.h"
#include <Adafruit_GFX.h>
#include <Adafruit_ILI9341.h>
// ฟอนต์ FreeSansBold (อยู่ใน Adafruit_GFX, เก็บใน flash ไม่กิน RAM) สำหรับหัวข้อใหญ่
#include <Fonts/FreeSansBold12pt7b.h>
#include <ArduinoJson.h> // ติดตั้งผ่าน Library Manager (เวอร์ชัน 6.x)
#include <FS.h>
#include <HTTPClient.h>
#ifndef WOKWI_SIM
#include <HTTPUpdate.h> // สำหรับระบบดึงข้อมูลอัปเดต HTTPS OTA (เฉพาะบอร์ดจริง)
#include <PubSubClient.h>
#endif
// หมายเหตุ: WiFiServer ถูกประกาศมาแล้วใน WiFi.h จึงไม่ต้อง include เพิ่ม
#include <SPI.h>
#include <SPIFFS.h>
#include <WiFi.h>
#include <WiFiClientSecure.h> // สำหรับรัน HTTPS บนระบบคลาวด์ Vercel
#include <mbedtls/md.h>
#include <sys/time.h> // สำหรับ settimeofday
#include <time.h>     // สำหรับ NTP time sync (ใช้ใน HMAC timestamp)

#include "config.h"

// เวอร์ชันซอฟต์แวร์ปัจจุบันของบอร์ด
const char *CURRENT_VERSION = "1.0.0";
const char *FIRMWARE_URL =
    "https://smartaccess-project.vercel.app/api/esp32/firmware-ota";

WiFiServer localServer(80); // เว็บเซิร์ฟเวอร์ LAN สำหรับคิวเปิดประตู/โหมดออฟไลน์
bool localServerStarted = false;

// ─── Compile-time production safety guard ───────────────────────────────────
// Prevents accidentally shipping a Wokwi simulation build to a real device.
#ifdef PRODUCTION
#ifdef WOKWI_SIM
#error "WOKWI_SIM must not be defined in production builds!"
#endif
#endif
// ────────────────────────────────────────────────────────────────────────────

// --- การต่อขาอุปกรณ์ (Hardware Pins) ---
#define TFT_CS 15
#define TFT_RST 4
#define TFT_DC 2
#define RELAY_PIN 12       // รีเลย์ประตู (GPIO 12)
#define LED_WIFI 14        // WiFi Status LED (GPIO 14)
#define LED_REJECT 26      // Reject LED (GPIO 26)
#define BUZZER_PIN 27      // Buzzer (GPIO 27)
#define EXIT_BUTTON_PIN 13 // Exit Button (GPIO 13)
#define DOOR_SENSOR_PIN 32 // Magnetic Door Sensor (GPIO 32)

Adafruit_ILI9341 tft = Adafruit_ILI9341(TFT_CS, TFT_DC, TFT_RST);

// Custom zero-allocation wrapper class to redirect Adafruit_GFX drawing operations
// directly to hardware TFT, avoiding the 153.6 KB RAM heap allocation of GFXcanvas16
// which causes ESP32 out-of-memory crashes (StoreProhibited/LoadProhibited loop)
// when SPIFFS and HTTPS (WiFiClientSecure TLS buffers) are active.
class TFT_DirectCanvas : public Adafruit_GFX {
private:
  Adafruit_ILI9341 &tft;
public:
  TFT_DirectCanvas(Adafruit_ILI9341 &_tft) : Adafruit_GFX(320, 240), tft(_tft) {}
  
  void drawPixel(int16_t x, int16_t y, uint16_t color) override {
    tft.drawPixel(x, y, color);
  }
  
  void fillScreen(uint16_t color) override { tft.fillScreen(color); }
  void drawFastVLine(int16_t x, int16_t y, int16_t h, uint16_t color) override { tft.drawFastVLine(x, y, h, color); }
  void drawFastHLine(int16_t x, int16_t y, int16_t w, uint16_t color) override { tft.drawFastHLine(x, y, w, color); }
  void fillRect(int16_t x, int16_t y, int16_t w, int16_t h, uint16_t color) override { tft.fillRect(x, y, w, h, color); }
  
  void drawRGBBitmap(int16_t x, int16_t y, const uint16_t *bitmap, int16_t w, int16_t h) {
    tft.drawRGBBitmap(x, y, bitmap, w, h);
  }

  uint16_t* getBuffer() { return nullptr; }
};

TFT_DirectCanvas canvas(tft);

// ─── Adaptive Polling ────────────────────────────────────────────────────────
// เร่งความเร็ว polling เมื่อตรวจพบกิจกรรม ชะลอลงเมื่อ idle ประหยัด API call
const unsigned long POLL_FAST = 200;   // ms — มีคำสั่งรอ / เพิ่งปลดล็อก
const unsigned long POLL_NORMAL = 750; // ms — ทำงานปกติ
const unsigned long POLL_SLOW = 3000;  // ms — idle ต่อเนื่อง 5 รอบ
unsigned long currentPollDelay = POLL_NORMAL;
int idleCycles = 0;   // นับรอบที่ไม่มีกิจกรรม
String lastEtag = ""; // ETag จาก server สำหรับ 304 check

// ─── TFT Dirty-region tracking ───────────────────────────────────────────────
// เก็บค่าเดิม — วาดเฉพาะส่วนที่เปลี่ยน ไม่ fillScreen ทั้งหน้าทุกรอบ
int last_queue_count = -1;
String last_approved_name = "";
String last_active_token = "";
String last_server_time = "";
String last_status_text = "";
String ip_address_str = "0.0.0.0";

// ─── Real-time clock state ───────────────────────────────────────────────────
// ติดตามว่าตอนนี้แสดงหน้าจอไหนอยู่ เพื่อ tick นาฬิกาเฉพาะตอนอยู่หน้าหลักเท่านั้น
enum ScreenState {
  SCREEN_BOOT,
  SCREEN_MAIN,
  SCREEN_SCANNING,
  SCREEN_UNLOCKED,
  SCREEN_REJECTED
};
ScreenState currentScreen = SCREEN_BOOT;
unsigned long lastClockTick = 0; // เวลา tick นาฬิกาล่าสุด (ms)
String last_clock_str = "";      // ค่าเวลาเดิมบนจอ — วาดใหม่เฉพาะเมื่อเปลี่ยน
bool is_offline_mode = false;    // สถานะออฟไลน์ (ใช้ในแถบสถานะหน้าหลักด้วย)

// Edge-trigger กันเปิดประตูซ้ำ: เปิดเฉพาะตอนคำสั่งเปลี่ยนจาก idle→open เท่านั้น
// ป้องกันบอร์ดวนหน้า ACCESS GRANTED ไม่จบ หากเซิร์ฟเวอร์ส่ง "open" ค้างมาหลายรอบ
String last_door_trigger = "idle";
unsigned long doorOpenStartTime =
    0; // Timestamp when door sensor detected open state
// กันเปิดประตูซ้ำข้ามช่องทาง (MQTT + DB poll + LAN push ส่งคำสั่งเดียวกันมาหลายทาง)
unsigned long lastUnlockAt = 0;
const unsigned long UNLOCK_COOLDOWN_MS = 8000;

// ฟังก์ชันสำหรับสร้างและวาดภาพ QR Code แท้ๆ ที่สแกนได้ด้วยโทรศัพท์มือถือ 100%!
void drawQRCode(const String &qrText, int startX, int startY, int boxSize) {
  QRCode qrcode;

  // ใช้ QR Code Version 7 (45x45 modules) รองรับ URL ยาวสูงสุด 154 ตัวอักษร
  int qrVersion = 7;
  if (qrText.length() > 154) {
    qrVersion = 9; // ถ้าข้อความยาวมากเป็นพิเศษ ให้สลับเป็น Version 9 (53x53 modules)
  }

  uint8_t qrcodeData[qrcode_getBufferSize(qrVersion)];
  qrcode_initText(&qrcode, qrcodeData, qrVersion, ECC_LOW, qrText.c_str());

  // ขยายพิกเซลบล็อก (Scale) ให้ใหญ่พอที่จะใช้โทรศัพท์สแกนได้คมชัด
  int scale = 2;
  int qrRealSize = qrcode.size * scale;

  // คำนวณขอบขาว (Quiet Zone) ให้อยู่กึ่งกลางกล่องเฟรมพอดี
  int paddingX = (boxSize - qrRealSize) / 2;
  int paddingY = (boxSize - qrRealSize) / 2;

  // วาดพื้นหลังสีขาวบริสุทธิ์
  canvas.fillRect(startX, startY, boxSize, boxSize, ILI9341_WHITE);

  // วาดโมดูลจุดสีดำของรหัส QR
  for (uint8_t y = 0; y < qrcode.size; y++) {
    for (uint8_t x = 0; x < qrcode.size; x++) {
      if (qrcode_getModule(&qrcode, x, y)) {
        canvas.fillRect(startX + paddingX + (x * scale),
                        startY + paddingY + (y * scale), scale, scale,
                        ILI9341_BLACK);
      }
    }
  }
}

// ─── UI helpers (ฟอนต์กึ่งกลาง, ไอคอน Wi-Fi, วงแหวนนับถอยหลัง, แถบความสด QR) ───
unsigned long qrShownAt = 0; // เวลาที่ QR ปัจจุบันถูกวาด (คำนวณแถบความสด ~60 วิ)

// พิมพ์ข้อความกึ่งกลางจอแนวนอนด้วยฟอนต์ที่กำหนด (y = baseline) แล้วคืนฟอนต์เดิม
void printCentered(const String &s, int y, const GFXfont *font, uint16_t color) {
  canvas.setFont(font);
  canvas.setTextSize(1);
  canvas.setTextColor(color);
  int16_t x1, y1;
  uint16_t w, h;
  canvas.getTextBounds(s, 0, y, &x1, &y1, &w, &h);
  canvas.setCursor((320 - (int)w) / 2, y);
  canvas.print(s);
  canvas.setFont(NULL); // กลับฟอนต์ bitmap เริ่มต้น
}

// ไอคอนความแรงสัญญาณ Wi-Fi 4 ขีด ตามค่า RSSI
void drawWifiIcon(int x, int y, int rssi, bool connected) {
  int bars = 0;
  if (connected) {
    if (rssi >= -55)
      bars = 4;
    else if (rssi >= -65)
      bars = 3;
    else if (rssi >= -75)
      bars = 2;
    else
      bars = 1;
  }
  for (int i = 0; i < 4; i++) {
    int bh = 3 + i * 2;
    int bx = x + i * 4;
    int by = y + (9 - bh);
    uint16_t c = (i < bars) ? tft.color565(16, 185, 129)
                            : tft.color565(55, 65, 75);
    canvas.fillRect(bx, by, 3, bh, c);
  }
}

// วงแหวนนับถอยหลังรอบไอคอนกลางจอ — จุดอยู่กับที่ เปลี่ยนแค่สี จึงไม่กระพริบ
void drawCountdownRing(int pct) {
  const int cx = 160, cy = 65, r = 42, segs = 48;
  int lit = (pct * segs) / 100;
  for (int s = 0; s < segs; s++) {
    float ang = (-90.0f + s * (360.0f / segs)) * 0.01745329f;
    int px = cx + (int)(cos(ang) * r);
    int py = cy + (int)(sin(ang) * r);
    uint16_t c =
        (s < lit) ? tft.color565(16, 185, 129) : tft.color565(8, 40, 30);
    tft.fillCircle(px, py, 2, c);
  }
}

// แถบแสดงความสดของ QR ใต้กรอบ (นับถอยหลังตามรอบหมุน token ~60 วิ)
void drawQrFreshness() {
  unsigned long age = millis() - qrShownAt;
  int pct = 100 - (int)((age * 100UL) / 60000UL);
  if (pct < 0)
    pct = 0;
  if (pct > 100)
    pct = 100;
  int w = (116 * pct) / 100;
  canvas.fillRect(12, 158, 116, 2, tft.color565(20, 24, 32)); // ราง
  uint16_t c =
      pct > 30 ? tft.color565(16, 185, 129) : tft.color565(245, 158, 11);
  canvas.fillRect(12, 158, w, 2, c); // แถบที่เหลือ
}

// คืนค่าเวลาจริงรูปแบบ HH:MM:SS จากนาฬิกา NTP (UTC+7 Bangkok)
// หาก NTP ยังไม่ sync จะ fallback ไปใช้ค่า uptime (millis) แทน
String getTimeString() {
  time_t now = time(nullptr);
  char buf[10];
  if (now > 1000000000UL) {
    struct tm timeinfo;
    localtime_r(&now, &timeinfo);
    snprintf(buf, sizeof(buf), "%02d:%02d:%02d", timeinfo.tm_hour,
             timeinfo.tm_min, timeinfo.tm_sec);
  } else {
    unsigned long sec = millis() / 1000;
    snprintf(buf, sizeof(buf), "%02d:%02d:%02d", (int)((sec / 3600) % 24),
             (int)((sec / 60) % 60), (int)(sec % 60));
  }
  return String(buf);
}

// วาดเฉพาะบริเวณนาฬิกามุมขวาบน — เขียนทับด้วยสีพื้นหลังของแถบหัว (#0E111C)
// จึงไม่ต้อง fillScreen ทั้งจอ ทำให้นาฬิกาเดินแบบเรียลไทม์โดยจอไม่กระพริบ
void drawClockRegion(const String &timeStr) {
  tft.setTextSize(1);
  tft.setTextColor(tft.color565(226, 232, 240), tft.color565(14, 17, 28));
  tft.setCursor(268, 9);
  tft.print(timeStr);
  last_clock_str = timeStr;
}

// ─── Dirty-region state + helpers สำหรับหน้าหลัก (วาดเฉพาะส่วนที่เปลี่ยน กันจอแฟลชทั้งจอ) ───
int rendered_queue = -999;
String rendered_id = "\x01"; // sentinel ค่าเริ่มต้นที่ไม่มีทางตรงกับค่าจริง
String rendered_qr = "\x01";

// วาดเนื้อหา QR ภายในกรอบ (drawQRCode ล้างพื้นขาวให้เองอยู่แล้ว)
void drawQRContent(const String &qrText) {
  qrShownAt = millis(); // รีเซ็ตตัวจับเวลาความสดของ QR
  if (qrText.length() > 0) {
    drawQRCode(qrText, 13, 39, 114);
  } else {
    canvas.fillRect(13, 39, 114, 114, ILI9341_WHITE);
    canvas.setTextColor(ILI9341_BLACK);
    canvas.setTextSize(1);
    canvas.setCursor(40, 89);
    canvas.print("Loading QR...");
  }
}

// วาดตัวเลขคิว — ล้างเฉพาะพื้นที่ตัวเลขด้วยสีพื้นการ์ดก่อนเขียนใหม่
void drawQueueValue(int queueCount) {
  canvas.fillRect(258, 82, 50, 26, tft.color565(24, 16, 1));
  canvas.setTextSize(3);
  canvas.setTextColor(tft.color565(245, 158, 11));
  canvas.setCursor(275, 85);
  canvas.print(queueCount);
}

// วาดการ์ดผู้ได้รับอนุมัติล่าสุด — ล้างพื้นที่การ์ดด้วยสีพื้นหลังหลักก่อนวาดใหม่
void drawApprovedCard(const String &lastApprovedName) {
  canvas.fillRect(144, 128, 168, 49, tft.color565(6, 7, 13));
  canvas.setTextSize(1);
  if (lastApprovedName.length() > 0) {
    canvas.fillRoundRect(145, 130, 165, 45, 6, tft.color565(1, 18, 12));
    canvas.drawRoundRect(145, 130, 165, 45, 6, tft.color565(16, 185, 129));
    canvas.setTextColor(tft.color565(16, 185, 129));
    canvas.setCursor(153, 134);
    canvas.print("Latest Approved");
    canvas.setTextColor(ILI9341_WHITE);
    canvas.setCursor(153, 153);
    canvas.print("ID: " + lastApprovedName);
  } else {
    canvas.drawRoundRect(145, 130, 165, 45, 6, tft.color565(60, 70, 60));
    canvas.setTextColor(tft.color565(107, 122, 112));
    canvas.setCursor(170, 148);
    canvas.print("No entry history");
  }
}

// 1. หน้าจอหลักโหมดสแตนด์บาย (Idle Mode) — ดีไซน์พรีเมียมถอดแบบมาจาก Next.js
void drawMainScreen(int queueCount, const String &lastApprovedName,
                    const String &timeStr, const String &qrText) {
  // ─── Dirty-region: ถ้าอยู่หน้าหลักอยู่แล้ว วาดใหม่เฉพาะส่วนที่ค่าเปลี่ยน กันจอแฟลชทั้งจอ ───
  if (currentScreen == SCREEN_MAIN) {
    if (qrText != rendered_qr) {
      drawQRContent(qrText);
      drawQrFreshness();
      rendered_qr = qrText;
    }
    if (queueCount != rendered_queue) {
      drawQueueValue(queueCount);
      rendered_queue = queueCount;
    }
    if (lastApprovedName != rendered_id) {
      drawApprovedCard(lastApprovedName);
      rendered_id = lastApprovedName;
    }
    drawClockRegion(timeStr);
    return;
  }

  // เข้าหน้าหลักครั้งแรก/มาจากหน้าอื่น — วาดโครงทั้งหมดครั้งเดียว
  // พื้นหลังสีน้ำเงินดำหรูหรา #06070D
  canvas.fillScreen(tft.color565(6, 7, 13));

  // --- ส่วนหัว (Top Status Bar) #0E111C ---
  canvas.fillRect(0, 0, 320, 26, tft.color565(14, 17, 28));
  canvas.drawFastHLine(0, 26, 320, tft.color565(40, 40, 50)); // เส้นใต้เมนู

  // วาดข้อความระบบภาษาไทยและอังกฤษ
  canvas.setTextSize(1);
  canvas.setTextColor(tft.color565(226, 232, 240));
  canvas.setCursor(10, 9);
  canvas.print("SmartAccess Door Control");

  // จุดสถานะ + ป้าย ONLINE/OFFLINE
  uint16_t statusColor =
      is_offline_mode ? tft.color565(245, 158, 11) : tft.color565(16, 185, 129);
  canvas.fillCircle(180, 12, 3, statusColor);
  canvas.setTextColor(statusColor);
  canvas.setCursor(188, 9);
  canvas.print(is_offline_mode ? "OFFLINE" : "ONLINE");

  // ไอคอนความแรงสัญญาณ Wi-Fi
  drawWifiIcon(245, 9, WiFi.RSSI(), WiFi.status() == WL_CONNECTED);

  // นาฬิกาดิจิทัลเรียลไทม์ฝั่งขวา
  canvas.setTextColor(tft.color565(226, 232, 240));
  canvas.setCursor(268, 9);
  canvas.print(timeStr);

  // --- กล่องแสดงผล QR Code สแกนผ่านทางด้านซ้าย ---
  // วาดเฟรมกรอบโค้งสองชั้นสีกระจกเขียวเรืองแสงแบบ Glassmorphism
  canvas.drawRoundRect(10, 36, 120, 120, 6, tft.color565(16, 185, 129));
  canvas.drawRoundRect(11, 37, 118, 118, 5, tft.color565(16, 185, 129));

  // แสดงผลภาพคีย์ QR Code ที่สแกนได้จริง + แถบความสด
  drawQRContent(qrText);
  drawQrFreshness();

  // คำแนะนำภาษาไทยสีเหลืองทองเรืองแสง
  canvas.setTextSize(1);
  canvas.setTextColor(tft.color565(255, 215, 0));
  canvas.setCursor(25, 162);
  canvas.print("SCAN TO ENTER");

  // --- การ์ดฝั่งขวา: รายละเอียดห้องและคิวผู้ขออนุมัติ ---
  canvas.setTextSize(1);
  canvas.setTextColor(tft.color565(240, 244, 240));
  canvas.setCursor(145, 36);
  canvas.print("Room: " + String(room_code));
  
  canvas.setTextColor(tft.color565(59, 130, 246));
  canvas.setCursor(145, 50);
  canvas.print("Door Control System");

  // การ์ดแสดงคิวสีเหลืองเหล้าองุ่น PENDING REQUESTS
  canvas.fillRoundRect(145, 72, 165, 50, 6, tft.color565(24, 16, 1));
  canvas.drawRoundRect(145, 72, 165, 50, 6,
                       tft.color565(245, 158, 11)); // ขอบสีส้มเหลือง

  canvas.setTextColor(tft.color565(245, 158, 11));
  canvas.setCursor(153, 78);
  canvas.print("Pending Requests");
  
  canvas.setTextColor(tft.color565(156, 163, 175));
  canvas.setCursor(153, 98);
  canvas.print("Queue Count");

  // ตัวเลขคิวใหญ่พิเศษขนาด 3 เท่า
  canvas.setTextSize(3);
  canvas.setTextColor(tft.color565(245, 158, 11));
  canvas.setCursor(275, 85);
  canvas.print(queueCount);

  // การ์ดผู้ได้รับการอนุมัติล่าสุด LATEST APPROVED
  canvas.setTextSize(1);
  if (lastApprovedName.length() > 0) {
    canvas.fillRoundRect(145, 130, 165, 45, 6,
                         tft.color565(1, 18, 12)); // แถบพื้นหลังเขียวเข้ม
    canvas.drawRoundRect(145, 130, 165, 45, 6,
                         tft.color565(16, 185, 129)); // ขอบเขียวสว่าง

    canvas.setTextColor(tft.color565(16, 185, 129));
    canvas.setCursor(153, 134);
    canvas.print("Latest Approved");

    canvas.setTextColor(ILI9341_WHITE);
    canvas.setCursor(153, 153);
    canvas.print("ID: " + lastApprovedName);
  } else {
    // กรอบประวัติว่างกรณีไม่มีข้อมูล
    canvas.drawRoundRect(145, 130, 165, 45, 6, tft.color565(60, 70, 60));
    canvas.setTextColor(tft.color565(107, 122, 112));
    canvas.setCursor(170, 148);
    canvas.print("No entry history");
  }

  // --- แถบข้อมูลด้านล่างสุด (Bottom Status Bar) #0A0B10 ---
  canvas.fillRect(0, 220, 320, 20, tft.color565(10, 11, 16));
  canvas.drawFastHLine(0, 220, 320, tft.color565(30, 30, 40));

  canvas.setTextColor(tft.color565(107, 122, 112));
  canvas.setCursor(8, 226);
  canvas.print("SmartAccess System");

  // แสดงค่าหมายเลขไอพีแอดเดรสของอุปกรณ์
  canvas.setTextColor(tft.color565(16, 185, 129));
  canvas.setCursor(240, 226);
  canvas.print(ip_address_str);

  // ดันแคนวาสออกหน้าจอ ILI9341
  if (canvas.getBuffer() != nullptr) {
    tft.drawRGBBitmap(0, 0, canvas.getBuffer(), 320, 240);
  }

  // บันทึกค่าที่วาดไปแล้ว เพื่อให้รอบถัดไปวาดเฉพาะส่วนที่เปลี่ยน
  rendered_queue = queueCount;
  rendered_id = lastApprovedName;
  rendered_qr = qrText;

  // จดจำสถานะ: เข้าสู่หน้าหลัก — เปิดให้นาฬิกา tick แบบเรียลไทม์
  currentScreen = SCREEN_MAIN;
  last_clock_str = timeStr;
}

// 2. หน้าจอกำลังตรวจสอบข้อมูล (Scanning/Processing Mode)
void drawScanningScreen() {
  currentScreen = SCREEN_SCANNING;
  canvas.fillScreen(tft.color565(3, 8, 15)); // สีน้ำเงินมหาสมุทรเข้ม #03080F

  // วงแหวนเรืองแสงสีฟ้าจำลองตัวอ่านกำลังประมวลผล
  canvas.drawCircle(160, 70, 30, tft.color565(59, 130, 246));
  canvas.drawCircle(160, 70, 31, tft.color565(59, 130, 246));
  canvas.fillCircle(160, 70, 8, tft.color565(59, 130, 246));

  printCentered("Processing", 122, &FreeSansBold12pt7b, tft.color565(59, 130, 246));

  canvas.setTextSize(1);
  canvas.setTextColor(ILI9341_WHITE);
  canvas.setCursor(75, 150);
  canvas.print("Verifying credentials...");

  canvas.setTextColor(tft.color565(107, 122, 112));
  canvas.setCursor(85, 180);
  canvas.print("Cloud Security System");

  // ดันแคนวาสออกหน้าจอ ILI9341
  if (canvas.getBuffer() != nullptr) {
    tft.drawRGBBitmap(0, 0, canvas.getBuffer(), 320, 240);
  }
}

// 3. หน้าจอปลดล็อกผ่านสำเร็จ (Access Granted Mode) — สีเขียวสะท้อนแสงหรูหราดีไซน์พรีเมียม
void drawUnlockedScreen(const String &approvedName, const String &studentId) {
  currentScreen = SCREEN_UNLOCKED;
  canvas.fillScreen(tft.color565(3, 12, 5)); // สีเขียวเข้มสไตล์ฟอเรสต์ #030C05

  // วงกลมไฟสีเขียวสลักตราถูก
  canvas.fillCircle(160, 65, 32, tft.color565(6, 78, 59)); // กรอบใน
  canvas.drawCircle(160, 65, 32,
                    tft.color565(16, 185, 129)); // เส้นขอบสีเขียวเรืองแสง
  canvas.drawCircle(160, 65, 33, tft.color565(16, 185, 129));

  // เครื่องหมายถูก (checkmark) วาดด้วยเส้นซ้อนหลายชั้นให้หนาและคมชัดกลางวงกลม
  for (int t = 0; t < 4; t++) {
    canvas.drawLine(148, 65 + t, 157, 75 + t, ILI9341_WHITE);
    canvas.drawLine(157, 75 + t, 174, 53 + t, ILI9341_WHITE);
  }

  // วงแหวนนับถอยหลัง (เริ่มที่เต็มวง) — จะถูกอนิเมตตอนนับเวลาประตูเปิด
  drawCountdownRing(100);

  printCentered("ACCESS GRANTED", 132, &FreeSansBold12pt7b, tft.color565(16, 185, 129));

  canvas.setTextSize(1);
  canvas.setTextColor(tft.color565(255, 215, 0));
  canvas.setCursor(75, 142);
  canvas.print("Door Unlocked - Please Enter");

  // ตลับแคปซูลสำหรับครอบชื่อผู้เข้าใช้ห้องปฏิบัติการ
  canvas.fillRoundRect(30, 168, 260, 26, 13, tft.color565(30, 30, 40));
  canvas.drawRoundRect(30, 168, 260, 26, 13, tft.color565(50, 50, 60));

  canvas.setTextColor(ILI9341_WHITE);
  canvas.setCursor(110, 177);
  canvas.print("Verified Member");

  // รหัสประจำตัวของนักศึกษา
  canvas.setTextSize(1);
  canvas.setTextColor(tft.color565(156, 163, 175));
  int idX = 160 - (studentId.length() * 3);
  if (idX < 35)
    idX = 35;
  canvas.setCursor(idX, 202);
  canvas.print(studentId);

  // ดันแคนวาสออกหน้าจอ ILI9341
  if (canvas.getBuffer() != nullptr) {
    tft.drawRGBBitmap(0, 0, canvas.getBuffer(), 320, 240);
  }
}

// 4. หน้าจอสำหรับกรณีระบบไม่อนุมัติ (Access Denied Mode) — แดงเรืองแสง
void drawRejectedScreen() {
  currentScreen = SCREEN_REJECTED;
  canvas.fillScreen(tft.color565(15, 3, 3)); // สีแดงเข้มมืด #0F0303

  // วงแหวนแดงสลัก X (ใช้รูปไอคอน warning 16x16)
  canvas.fillCircle(160, 65, 32, tft.color565(127, 29, 29));
  canvas.drawCircle(160, 65, 32, tft.color565(239, 68, 68));
  canvas.drawCircle(160, 65, 33, tft.color565(239, 68, 68));

  // เครื่องหมายกากบาท (X) วาดด้วยเส้นซ้อนหลายชั้นให้หนาและคมชัดกลางวงกลม
  for (int t = 0; t < 4; t++) {
    canvas.drawLine(149, 54 + t, 171, 76 + t, ILI9341_WHITE);
    canvas.drawLine(171, 54 + t, 149, 76 + t, ILI9341_WHITE);
  }

  printCentered("ACCESS DENIED", 132, &FreeSansBold12pt7b, tft.color565(239, 68, 68));

  canvas.setTextSize(1);
  canvas.setTextColor(tft.color565(255, 199, 199));
  canvas.setCursor(95, 142);
  canvas.print("Invalid Credentials");

  canvas.setTextColor(tft.color565(156, 163, 175));
  canvas.setCursor(95, 175);
  canvas.print("Please contact admin");

  // ดันแคนวาสออกหน้าจอ ILI9341
  if (canvas.getBuffer() != nullptr) {
    tft.drawRGBBitmap(0, 0, canvas.getBuffer(), 320, 240);
  }
}

// ─── Persistent TLS Connection (HTTP Keep-alive) ─────────────────────────────
// ประกาศนอก loop() เพื่อให้ reuse TLS session ข้ามรอบ poll → ลด TLS handshake
#ifndef WOKWI_SIM
WiFiClientSecure persistentTlsClient;
bool tlsClientInitialized = false;
WiFiClientSecure mqttTlsClient;
PubSubClient mqttClient(mqttTlsClient);
unsigned long lastMqttRetry = 0;
#endif

// ─── Offline Mode Configurations & Helper Functions (Prompt 18) ─────────────
// หมายเหตุ: is_offline_mode ถูกย้ายไปประกาศก่อน drawMainScreen (ใช้ในแถบสถานะ)
int api_fail_count = 0;
unsigned long last_student_sync = 0;
unsigned long last_log_sync = 0;
const unsigned long SYNC_STUDENTS_INTERVAL = 300000; // 5 minutes
const unsigned long SYNC_LOGS_INTERVAL = 60000;      // 1 minute

String cached_qr_key = "";
const char *cache_students_file = "/student_cache.json";
const char *cache_logs_file = "/offline_logs.json";
const char *cache_key_file = "/qr_key.bin";
String cached_offline_pin = "123456"; // Default PIN

// Forward declarations
bool validateOfflineQR(const String &grant);
void triggerDoorOpenOffline(const String &grant);
void saveOfflineLog(const String &student_id);
void syncStudentCache();
void syncOfflineLogs();
bool secureCompare(const char *a, const char *b);

#ifndef WOKWI_SIM
void onOTAStart() {
  Serial.println("[Local OTA] เริ่มต้นกระบวนการแฟลชเฟิร์มแวร์ผ่าน LAN");
  tft.fillScreen(ILI9341_BLACK);
  tft.setTextColor(ILI9341_YELLOW);
  tft.setTextSize(2);
  tft.setCursor(10, 40);
  tft.println("LOCAL OTA ACTIVE");
  tft.setTextSize(1);
  tft.setCursor(10, 80);
  tft.setTextColor(ILI9341_WHITE);
  tft.println("Flashing firmware via Local Network...");
}

void onOTAEnd(bool success) {
  tft.fillScreen(ILI9341_BLACK);
  if (success) {
    tft.setTextColor(ILI9341_GREEN);
    tft.setTextSize(2);
    tft.setCursor(10, 40);
    tft.println("OTA SUCCESSFUL");
    tft.setTextSize(1);
    tft.setCursor(10, 80);
    tft.setTextColor(ILI9341_WHITE);
    tft.println("Rebooting device now...");
    delay(2000);
  } else {
    tft.setTextColor(ILI9341_RED);
    tft.setTextSize(2);
    tft.setCursor(10, 40);
    tft.println("OTA FAILED");
    tft.setTextSize(1);
    tft.setCursor(10, 80);
    tft.setTextColor(ILI9341_WHITE);
    tft.println("Please check network and retry.");
    delay(5000);
  }
}

// ─── OTA Progress Bar บน TFT ─────────────────────────────────────────────────
void onOTAProgress(int current, int total) {
  if (total <= 0)
    return;
  int pct = (current * 100) / total;
  int barW = (pct * 280) / 100;
  // Progress bar background
  tft.drawRect(20, 130, 280, 16, ILI9341_WHITE);
  tft.fillRect(21, 131, barW, 14, tft.color565(124, 58, 237));
  // เคลียร์ + วาดตัวเลข %
  tft.fillRect(20, 155, 160, 16, ILI9341_BLACK);
  tft.setTextColor(ILI9341_WHITE);
  tft.setTextSize(1);
  tft.setCursor(20, 155);
  tft.print(pct);
  tft.print("% (");
  tft.print(current / 1024);
  tft.print(" / ");
  tft.print(total / 1024);
  tft.println(" KB)");
}

#endif // !WOKWI_SIM

void performHTTPSOTA() {
#ifndef WOKWI_SIM
  WiFiClientSecure secureClient;
  secureClient.setInsecure();

  tft.fillScreen(ILI9341_BLACK);
  tft.setTextColor(ILI9341_YELLOW);
  tft.setTextSize(2);
  tft.setCursor(10, 30);
  tft.println("SMARTACCESS OTA");
  tft.drawFastHLine(10, 60, 300, tft.color565(124, 58, 237));
  tft.setCursor(10, 80);
  tft.setTextColor(ILI9341_WHITE);
  tft.setTextSize(1);
  tft.println("Connecting to update server...");
  tft.setCursor(10, 100);
  tft.println("Please wait, do not power off.");

  httpUpdate.rebootOnUpdate(true);
  httpUpdate.setFollowRedirects(HTTPC_FORCE_FOLLOW_REDIRECTS);
  // แนบ callback แสดง progress bar
  httpUpdate.onProgress(onOTAProgress);

  tft.fillRect(10, 80, 300, 20, ILI9341_BLACK);
  tft.setCursor(10, 80);
  tft.setTextColor(ILI9341_WHITE);
  tft.setTextSize(1);
  tft.println("Downloading firmware...");

  t_httpUpdate_return ret =
      httpUpdate.update(secureClient, FIRMWARE_URL, "", [](HTTPClient *http) {
        http->addHeader("x-esp32-version", CURRENT_VERSION);
        http->addHeader("Authorization",
                        "Bearer SUPER_SECURE_ESP32_ACCESS_TOKEN");
      });
  if (ret == HTTP_UPDATE_FAILED) {
    tft.fillScreen(ILI9341_BLACK);
    tft.setTextColor(ILI9341_RED);
    tft.setTextSize(2);
    tft.setCursor(10, 40);
    tft.println("OTA FAILED");
    tft.setTextSize(1);
    tft.setCursor(10, 80);
    tft.setTextColor(ILI9341_WHITE);
    tft.print("Error: ");
    tft.println(httpUpdate.getLastErrorString());
    delay(5000);
  }
#else
  // Wokwi: OTA ไม่รองรับใน Simulator — แสดงข้อความแจ้งเตือน
  tft.fillScreen(ILI9341_BLACK);
  tft.setTextColor(ILI9341_YELLOW);
  tft.setTextSize(2);
  tft.setCursor(10, 30);
  tft.println("SMARTACCESS OTA");
  tft.setCursor(10, 80);
  tft.setTextColor(ILI9341_WHITE);
  tft.println("OTA not available");
  tft.println("in Wokwi Simulator");
  delay(3000);
#endif
}

void startLocalServer() {
  if (!localServerStarted) {
    localServer.begin();
    localServerStarted = true;
    DBG("Local web server started on port 80.");
  }
}

String base64Decode(const String &input) {
  String decodedInput = input;
  decodedInput.replace("-", "+");
  decodedInput.replace("_", "/");
  while (decodedInput.length() % 4) {
    decodedInput += "=";
  }
  int len = decodedInput.length();
  uint8_t *out = (uint8_t *)malloc(len + 1);
  if (!out) {
    DBG("base64Decode: malloc failed!");
    return "";
  }
  int decoded_len = 0;
  const char *lookup =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
  int bits = 0;
  int val = 0;
  for (int i = 0; i < len; i++) {
    char c = decodedInput[i];
    if (c == '=')
      break;
    const char *p = strchr(lookup, c);
    if (!p)
      continue;
    int idx = p - lookup;
    val = (val << 6) | idx;
    bits += 6;
    if (bits >= 8) {
      bits -= 8;
      out[decoded_len++] = (val >> bits) & 0xFF;
    }
  }
  out[decoded_len] = '\0';
  String res = String((char *)out);
  free(out);
  return res;
}

// Hex-encoded HMAC-SHA256 — ตรงกับ Node.js crypto.createHmac('sha256',
// key).digest('hex') ใช้สำหรับ x-hmac-signature header ที่ server ตรวจสอบ
String generateHMACHex(const String &payload, const String &key) {
  uint8_t hmacResult[32];
  mbedtls_md_context_t ctx;
  mbedtls_md_init(&ctx);
  mbedtls_md_setup(&ctx, mbedtls_md_info_from_type(MBEDTLS_MD_SHA256), 1);
  mbedtls_md_hmac_starts(&ctx, (const unsigned char *)key.c_str(),
                         key.length());
  mbedtls_md_hmac_update(&ctx, (const unsigned char *)payload.c_str(),
                         payload.length());
  mbedtls_md_hmac_finish(&ctx, hmacResult);
  mbedtls_md_free(&ctx);
  char hexBuf[65];
  for (int i = 0; i < 32; i++) {
    sprintf(hexBuf + i * 2, "%02x", hmacResult[i]);
  }
  hexBuf[64] = '\0';
  return String(hexBuf);
}

// Base64url-encoded HMAC-SHA256 (ใช้สำหรับ offline grant validation)
String generateHMAC(const String &payload, const String &key) {
  uint8_t hmacResult[32];
  mbedtls_md_context_t ctx;
  mbedtls_md_type_t md_type = MBEDTLS_MD_SHA256;
  mbedtls_md_init(&ctx);
  mbedtls_md_setup(&ctx, mbedtls_md_info_from_type(md_type), 1);
  mbedtls_md_hmac_starts(&ctx, (const unsigned char *)key.c_str(),
                         key.length());
  mbedtls_md_hmac_update(&ctx, (const unsigned char *)payload.c_str(),
                         payload.length());
  mbedtls_md_hmac_finish(&ctx, hmacResult);
  mbedtls_md_free(&ctx);

  String encoded = "";
  const char *lookup =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";
  int bits = 0;
  int val = 0;
  for (int i = 0; i < 32; i++) {
    val = (val << 8) | hmacResult[i];
    bits += 8;
    while (bits >= 6) {
      bits -= 6;
      encoded += lookup[(val >> bits) & 0x3F];
    }
  }
  if (bits > 0) {
    encoded += lookup[(val << (6 - bits)) & 0x3F];
  }
  return encoded;
}

void addZeroTrustHeaders(HTTPClient &http, const String &endpoint) {
  time_t nowTs = time(nullptr);
  String timestampStr = String((long)nowTs);

  String device_id = "esp32_" + String(room_code);

  // Nonce generation: using esp_random to prevent replay attacks (Zero-Trust
  // V2.0)
  uint32_t r1 = esp_random();
  uint32_t r2 = esp_random();
  char nonceBuf[17];
  sprintf(nonceBuf, "%08x%08x", r1, r2);
  String nonce = String(nonceBuf);

  String body_hash = "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7"
                     "852b855"; // SHA-256 of empty string

  // 1. KDF: Derive device secret key
  String device_secret = generateHMACHex(device_id, String(api_key));

  // 2. Construct Payload: "deviceId:timestampStr:nonce:endpointPath:bodyHash"
  String hmacPayload = device_id + ":" + timestampStr + ":" + nonce + ":" +
                       endpoint + ":" + body_hash;

  // 3. Compute signature
  String signature = generateHMACHex(hmacPayload, device_secret);

  http.addHeader("Content-Type", "application/json");
  http.addHeader("x-api-key", api_key);
  http.addHeader("x-esp32-version", CURRENT_VERSION);
  http.addHeader("x-device-id", device_id);
  http.addHeader("x-timestamp", timestampStr);
  http.addHeader("x-nonce", nonce);
  http.addHeader("x-hmac-signature", signature);
}

bool validateOfflineQR(const String &grant) {
  if (cached_qr_key == "") {
    DBG("No cached QR signing key. Cannot validate offline.");
    return false;
  }
  int dotIdx = grant.indexOf(".");
  if (dotIdx == -1)
    return false;

  String encodedPayload = grant.substring(0, dotIdx);
  String signature = grant.substring(dotIdx + 1);

  String expectedSignature = generateHMAC(encodedPayload, cached_qr_key);
  if (!secureCompare(signature.c_str(), expectedSignature.c_str())) {
    DBG("Offline signature verification failed!");
    return false;
  }

  String decoded = base64Decode(encodedPayload);
  StaticJsonDocument<384> doc;
  DeserializationError err = deserializeJson(doc, decoded);
  if (err) {
    DBG("Failed to parse decoded payload JSON!");
    return false;
  }

  const char *room = doc["room"];
  const char *student_id = doc["student_id"];

  if (String(room) != String(room_code)) {
    DBG("Room mismatch in offline grant!");
    return false;
  }

  if (!SPIFFS.exists(cache_students_file)) {
    DBG("No student cache JSON file exists!");
    return false;
  }

  File f = SPIFFS.open(cache_students_file, "r");
  if (!f)
    return false;

  DynamicJsonDocument cacheDoc(
      4096); // Allocated on Heap to prevent Stack Overflow
  DeserializationError cacheErr = deserializeJson(cacheDoc, f);
  f.close();
  if (cacheErr) {
    DBG("Failed to parse student cache JSON file!");
    return false;
  }

  JsonArray arr = cacheDoc.as<JsonArray>();
  bool found = false;
  for (JsonVariant v : arr) {
    if (v.as<String>() == String(student_id)) {
      found = true;
      break;
    }
  }
  if (!found) {
    DBG("Student ID not found in local offline cache!");
    return false;
  }
  DBG("Offline QR validation successful!");
  return true;
}

void saveOfflineLog(const String &student_id) {
  DynamicJsonDocument logDoc(
      3072); // Allocated on Heap to prevent Stack Overflow
  if (SPIFFS.exists(cache_logs_file)) {
    File f = SPIFFS.open(cache_logs_file, "r");
    if (f) {
      deserializeJson(logDoc, f);
      f.close();
    }
  }
  JsonArray logs;
  if (logDoc.containsKey("logs")) {
    logs = logDoc["logs"].as<JsonArray>();
  } else {
    logs = logDoc.to<JsonArray>();
  }
  if (logs.size() >= 50) {
    logs.remove(0);
  }
  JsonObject newLog = logs.createNestedObject();
  newLog["student_id"] = student_id;
  newLog["action"] = "door_opened_offline";
  newLog["timestamp"] = millis() / 1000;
  File f = SPIFFS.open(cache_logs_file, "w");
  if (f) {
    serializeJson(logDoc, f);
    f.close();
    DBG("Saved offline access log to SPIFFS.");
  }
}

void triggerDoorOpenOffline(const String &grant) {
  int dotIdx = grant.indexOf(".");
  String encodedPayload = grant.substring(0, dotIdx);
  String decoded = base64Decode(encodedPayload);
  StaticJsonDocument<256> doc;
  deserializeJson(doc, decoded);
  String student_id = doc["student_id"].as<String>();

  if (millis() - lastUnlockAt < UNLOCK_COOLDOWN_MS)
    return; // กันสั่งซ้ำข้ามช่องทาง
  lastUnlockAt = millis();

  saveOfflineLog(student_id);

  Serial.println("[INFO] Door unlocked");
  DBG("🔓 OFFLINE ACCESS GRANTED! Opening door...");
  last_door_trigger = "open";

  drawScanningScreen();
  tone(BUZZER_PIN, 1500, 100);
  delay(1200);

  drawUnlockedScreen("OFFLINE MEMBER", student_id);
  digitalWrite(RELAY_PIN, HIGH);

  tone(BUZZER_PIN, 1000, 150);
  delay(180);
  tone(BUZZER_PIN, 1500, 150);
  delay(180);
  tone(BUZZER_PIN, 2000, 300);

  for (int i = 0; i <= 38; i++) {
    drawCountdownRing(100 - (i * 100 / 38));
    delay(100);
  }
  digitalWrite(RELAY_PIN, LOW);
  Serial.println("[INFO] Door locked");
  DBG("🔒 Door auto locked (Offline).");
  tone(BUZZER_PIN, 800, 250);

  last_queue_count = -1;
  last_approved_name = "FORCE_REDRAW";
  last_active_token = "FORCE_REDRAW";
}

void triggerDoorOpenInstant(String name, String studentId) {
  // กันสั่งซ้ำ: ถ้าเพิ่งเปิดประตูไปไม่นาน ให้ข้าม (คำสั่งเดิมส่งมาหลายช่องทาง)
  if (millis() - lastUnlockAt < UNLOCK_COOLDOWN_MS)
    return;
  lastUnlockAt = millis();
  Serial.println("[INFO] Door unlocked via MQTT/Real-time");
  last_door_trigger = "open";
  drawScanningScreen();
  tone(BUZZER_PIN, 1500, 100);
  delay(300);

  drawUnlockedScreen(name, studentId);
  digitalWrite(RELAY_PIN, HIGH);

  tone(BUZZER_PIN, 1000, 150);
  delay(180);
  tone(BUZZER_PIN, 1500, 150);
  delay(180);
  tone(BUZZER_PIN, 2000, 300);

  for (int i = 0; i <= 38; i++) {
    drawCountdownRing(100 - (i * 100 / 38));
    delay(100);
  }

  digitalWrite(RELAY_PIN, LOW);
  Serial.println("[INFO] Door locked");
  tone(BUZZER_PIN, 800, 250);

  last_queue_count = -1;
  last_approved_name = "FORCE_REDRAW";
  last_active_token = "FORCE_REDRAW";
}

#ifndef WOKWI_SIM
void mqttCallback(char *topic, byte *payload, unsigned int length) {
  Serial.print("[MQTT] Message arrived on topic: ");
  Serial.println(topic);

  String msg = "";
  for (unsigned int i = 0; i < length; i++) {
    msg += (char)payload[i];
  }
  Serial.print("[MQTT] Payload: ");
  Serial.println(msg);

  StaticJsonDocument<256> doc;
  DeserializationError err = deserializeJson(doc, msg);

  String action = "";
  String name = "VERIFIED MEMBER";
  String studentId = "ONLINE STUDENT";

  if (!err) {
    action = doc["action"].as<String>();
    if (doc.containsKey("name")) {
      name = doc["name"].as<String>();
    }
    if (doc.containsKey("student_id")) {
      studentId = doc["student_id"].as<String>();
    }
  } else {
    action = msg;
  }

  if (action == "unlock") {
    triggerDoorOpenInstant(name, studentId);
  }
}
#endif

void handleLocalValidation() {
  WiFiClient client = localServer.available();
  if (!client)
    return;
  DBG("New client connected to local offline validation server.");
  unsigned long timeout = millis() + 2000;
  String req = "";
  while (client.connected() && millis() < timeout) {
    if (client.available()) {
      char c = client.read();
      req += c;
      if (req.endsWith("\r\n\r\n"))
        break;
    }
  }
  // Read remaining body bytes (e.g. POST form data)
  delay(15);
  while (client.available()) {
    req += (char)client.read();
  }
  if (req.indexOf("POST /door/open") != -1) {
    // ─── [Real-Time HTTP Push opening from Next.js (Online Mode)] ───
    client.println("HTTP/1.1 200 OK");
    client.println("Content-Type: application/json; charset=utf-8");
    client.println("Connection: close");
    client.println();
    client.println("{\"success\":true}");
    client.stop();

    // Extract studentId from request body if present
    String studentId = "";
    int bodyIdx = req.indexOf("\r\n\r\n");
    if (bodyIdx != -1) {
      String body = req.substring(bodyIdx + 4);
      int sIdIdx = body.indexOf("\"studentId\"");
      if (sIdIdx != -1) {
        int colonIdx = body.indexOf(":", sIdIdx);
        if (colonIdx != -1) {
          int quoteStart = body.indexOf("\"", colonIdx);
          if (quoteStart != -1) {
            int quoteEnd = body.indexOf("\"", quoteStart + 1);
            if (quoteEnd != -1) {
              studentId = body.substring(quoteStart + 1, quoteEnd);
            }
          }
        }
      }
    }

    // กันสั่งซ้ำข้ามช่องทาง (คำสั่งเดียวกันอาจมาทั้ง MQTT / DB poll / LAN push)
    if (millis() - lastUnlockAt < UNLOCK_COOLDOWN_MS)
      return;
    lastUnlockAt = millis();

    Serial.println("[INFO] Real-time Door unlocked via HTTP Push");
    DBG("🔓 REAL-TIME ACCESS GRANTED! Opening door...");
    last_door_trigger = "open";

    drawScanningScreen();
    tone(BUZZER_PIN, 1500, 100);
    delay(1200);

    drawUnlockedScreen("VERIFIED MEMBER",
                       studentId != "" ? studentId : "ONLINE STUDENT");
    digitalWrite(RELAY_PIN, HIGH);

    tone(BUZZER_PIN, 1000, 150);
    delay(180);
    tone(BUZZER_PIN, 1500, 150);
    delay(180);
    tone(BUZZER_PIN, 2000, 300);

    for (int i = 0; i <= 38; i++) {
      drawCountdownRing(100 - (i * 100 / 38));
      delay(100);
    }
    digitalWrite(RELAY_PIN, LOW);
    Serial.println("[INFO] Door locked");
    DBG("🔒 Door auto locked (Real-time).");
    tone(BUZZER_PIN, 800, 250);

    last_queue_count = -1;
    last_approved_name = "FORCE_REDRAW";
    last_active_token = "FORCE_REDRAW";
    return;
  }

  if (req.indexOf("POST /unlock") != -1 || req.indexOf("GET /unlock") != -1) {
    int grantIdx = req.indexOf("grant=");
    if (grantIdx != -1) {
      int endIdx = req.indexOf(" ", grantIdx);
      if (endIdx == -1)
        endIdx = req.indexOf("\r", grantIdx);
      String grant = req.substring(grantIdx + 6, endIdx);
      grant.replace("%2E", ".");
      grant.replace("%2D", "-");
      grant.replace("%5F", "_");

      bool valid = validateOfflineQR(grant);
      if (valid) {
        client.println("HTTP/1.1 200 OK");
        client.println("Content-Type: text/plain; charset=utf-8");
        client.println("Connection: close");
        client.println();
        client.println("ACCESS GRANTED");
        triggerDoorOpenOffline(grant);
      } else {
        client.println("HTTP/1.1 403 Forbidden");
        client.println("Content-Type: text/plain; charset=utf-8");
        client.println("Connection: close");
        client.println();
        client.println("ACCESS DENIED");
      }
    }
  } else if (req.indexOf("POST /unlock-pin") != -1) {
    int pinIdx = req.indexOf("pin=");
    if (pinIdx != -1) {
      int endIdx = req.indexOf(" ", pinIdx);
      if (endIdx == -1)
        endIdx = req.indexOf("\r", pinIdx);
      if (endIdx == -1)
        endIdx = req.indexOf("&", pinIdx);
      if (endIdx == -1)
        endIdx = req.length();
      String enteredPin = req.substring(pinIdx + 4, endIdx);
      enteredPin.trim();
      if (secureCompare(enteredPin.c_str(), cached_offline_pin.c_str())) {
        client.println("HTTP/1.1 200 OK");
        client.println("Content-Type: text/html; charset=utf-8");
        client.println("Connection: close");
        client.println();
        client.println("<h1>ACCESS GRANTED</h1><p>Door is open.</p>");
        triggerDoorOpenOffline("PIN_OVERRIDE.dummy");
      } else {
        client.println("HTTP/1.1 403 Forbidden");
        client.println("Content-Type: text/html; charset=utf-8");
        client.println("Connection: close");
        client.println();
        client.println("<h1>ACCESS DENIED</h1><p>Invalid PIN.</p>");
      }
    } else {
      client.println("HTTP/1.1 400 Bad Request");
      client.println("Content-Type: text/html; charset=utf-8");
      client.println("Connection: close");
      client.println();
      client.println("<h1>Bad Request</h1><p>Missing PIN parameter.</p>");
    }
  } else {
    client.println("HTTP/1.1 200 OK");
    client.println("Content-Type: text/html; charset=utf-8");
    client.println("Connection: close");
    client.println();
    client.println(
        "<!DOCTYPE html><html><head><meta charset='utf-8'><title>SmartAccess "
        "Offline Mode</title></head>");
    client.println("<body style='font-family:sans-serif; text-align:center; "
                   "padding:50px;'>");
    client.println("<h1 style='color:#F59E0B;'>⚠️ OFFLINE MODE ACTIVE</h1>");
    client.println("<p>ระบบอยู่ในโหมดออฟไลน์ (อินเทอร์เน็ตขัดข้อง)</p>");
    client.println("<p>กรุณาสแกนคีย์ QR โค้ดปลดล็อกของท่าน หรือกรอก Offline PIN</p>");
    client.println("<form method='POST' action='/unlock-pin'>");
    client.println("<input type='password' name='pin' placeholder='Enter PIN' "
                   "style='padding:10px;font-size:16px;'><br><br>");
    client.println("<button type='submit' style='padding:10px "
                   "20px;font-size:16px;background:#10B981;color:white;border:"
                   "none;'>Unlock Door</button>");
    client.println("</form>");
    client.println("</body></html>");
  }
  delay(1);
  client.stop();
}

void syncStudentCache() {
  if (WiFi.status() != WL_CONNECTED)
    return;
  HTTPClient http;
  String syncUrl = String(server_url) + "&sync=1";
  static WiFiClientSecure secureClient;
  WiFiClientSecure *client = &secureClient;
  client->setInsecure();
  http.begin(*client, syncUrl);
  addZeroTrustHeaders(http, "/api/esp32/display");
  int httpCode = http.GET();
  if (httpCode == 200) {
    String payload = http.getString();
    DynamicJsonDocument doc(4096); // Heap allocated to support larger responses
    DeserializationError error = deserializeJson(doc, payload);
    if (!error) {
      if (doc.containsKey("qr_key")) {
        const char *key = doc["qr_key"];
        cached_qr_key = String(key);
        File f = SPIFFS.open(cache_key_file, "w");
        if (f) {
          f.print(cached_qr_key);
          f.close();
          DBG("Synced and saved QR signing key.");
        }
      }
      if (doc.containsKey("students")) {
        File f = SPIFFS.open(cache_students_file, "w");
        if (f) {
          serializeJson(doc["students"], f);
          f.close();
          DBG("Synced and saved approved student list to SPIFFS.");
        }
      }
    }
  }
  http.end();
}

void syncOfflineLogs() {
  if (WiFi.status() != WL_CONNECTED)
    return;
  if (!SPIFFS.exists(cache_logs_file))
    return;
  File f = SPIFFS.open(cache_logs_file, "r");
  if (!f)
    return;
  String content = f.readString();
  f.close();
  HTTPClient http;
  String logUrl = String(server_url);
  logUrl.replace("display", "logs/sync");
  static WiFiClientSecure secureClient;
  WiFiClientSecure *client = &secureClient;
  client->setInsecure();
  http.begin(*client, logUrl);
  http.addHeader("Content-Type", "application/json");
  http.addHeader("x-api-key", api_key);
  int httpCode = http.POST(content);
  if (httpCode == 200 || httpCode == 201) {
    SPIFFS.remove(cache_logs_file);
    DBG("Successfully synchronized and cleared offline access logs.");
  }
  http.end();
}

void syncTimeViaHTTP() {
  if (WiFi.status() != WL_CONNECTED)
    return;

  String timeUrl = String(server_url);
  int displayIdx = timeUrl.indexOf("/display");
  if (displayIdx != -1) {
    timeUrl = timeUrl.substring(0, displayIdx) + "/time";
  } else {
    timeUrl =
        "https://smartaccess-project.vercel.app/api/esp32/time"; // Fallback
  }

  DBG("Attempting HTTP Time Sync Fallback via: " + timeUrl);
  HTTPClient http;

  if (timeUrl.startsWith("https://")) {
#ifdef WOKWI_SIM
    static WiFiClientSecure simClient;
    simClient.setInsecure();
    http.begin(simClient, timeUrl);
#else
    static WiFiClientSecure secureClient;
    secureClient.setInsecure();
    http.begin(secureClient, timeUrl);
#endif
  } else {
    http.begin(timeUrl);
  }

  http.setTimeout(4000);
  int httpCode = http.GET();
  if (httpCode == 200) {
    String payload = http.getString();
    StaticJsonDocument<256> doc; // Increased safely on stack
    DeserializationError error = deserializeJson(doc, payload);
    if (!error && doc.containsKey("timestamp")) {
      long serverTime = doc["timestamp"];
      struct timeval tv;
      tv.tv_sec = serverTime;
      tv.tv_usec = 0;
      settimeofday(&tv, NULL);
      Serial.println("[INFO] HTTP Time Synced fallback: " +
                     String((long)time(nullptr)));
    }
  } else {
    Serial.printf("[ERROR] HTTP Time Sync fallback failed, HTTP Code: %d\n",
                  httpCode);
  }
  http.end();
}

void setup() {
  Serial.begin(115200);
  Serial.println("[BOOT] System starting...");

  // Initialize SPIFFS cache storage
  if (!SPIFFS.begin(true)) {
    Serial.println("[ERROR] SPIFFS mount failed!");
  } else {
    Serial.println("[INFO] SPIFFS mounted successfully.");
    if (SPIFFS.exists(cache_key_file)) {
      File f = SPIFFS.open(cache_key_file, "r");
      if (f) {
        cached_qr_key = f.readString();
        f.close();
        DBG("Loaded cached QR signing key from SPIFFS.");
      }
    }
    if (SPIFFS.exists("/offline_pin.txt")) {
      File f = SPIFFS.open("/offline_pin.txt", "r");
      if (f) {
        cached_offline_pin = f.readString();
        f.close();
        DBG("Loaded cached offline PIN from SPIFFS.");
      }
    }
  }

  // Pin modes
  pinMode(RELAY_PIN, OUTPUT);
  pinMode(LED_WIFI, OUTPUT);
  pinMode(LED_REJECT, OUTPUT);
  pinMode(BUZZER_PIN, OUTPUT);
  pinMode(EXIT_BUTTON_PIN, INPUT_PULLUP);
  pinMode(DOOR_SENSOR_PIN, INPUT_PULLUP);

  digitalWrite(RELAY_PIN, LOW); // Default locked
  digitalWrite(LED_WIFI, LOW);
  digitalWrite(LED_REJECT, LOW);

  tft.begin();
  tft.setRotation(1); // Landscape

  canvas.fillScreen(tft.color565(6, 7, 13));
  canvas.fillRect(0, 0, 320, 45, tft.color565(14, 17, 28));
  canvas.drawFastHLine(0, 45, 320, tft.color565(16, 185, 129));

  // วาดโลโก้ระบบ 24x24 ที่ (10, 10) (removed logo)
  canvas.setTextSize(1);
  canvas.setTextColor(ILI9341_WHITE);
  canvas.setCursor(10, 18);
  canvas.print("SmartAccess Door Control");

  canvas.setTextSize(2);
  canvas.setTextColor(tft.color565(59, 130, 246));
  canvas.setCursor(40, 100);
  canvas.print("Connecting Wi-Fi...");

  canvas.setTextSize(1);
  canvas.setTextColor(tft.color565(156, 163, 175));
  canvas.setCursor(40, 140);
  canvas.print("SSID: ");
  canvas.print(ssid);

  if (canvas.getBuffer() != nullptr) {
    tft.drawRGBBitmap(0, 0, canvas.getBuffer(), 320, 240);
  }

  DBG("Connecting to Wi-Fi...");
  WiFi.begin(ssid, password);

  bool wifi_led_state = false;
  while (WiFi.status() != WL_CONNECTED) {
    wifi_led_state = !wifi_led_state;
    digitalWrite(LED_WIFI, wifi_led_state ? HIGH : LOW);
    delay(400);
    DBG(".");
  }

  digitalWrite(LED_WIFI, HIGH);
  DBG("\nWiFi connected successfully!");

  // UTC+7 (Bangkok ICT) — offset 7*3600 = 25200
  configTime(25200, 0, "pool.ntp.org", "time.cloudflare.com");
  {
    int ntp_wait = 0;
    while (time(nullptr) < 1000000000UL && ntp_wait < 50) {
      delay(100);
      ntp_wait++;
    }
  }

  // NTP Fallback
  if (time(nullptr) < 1000000000UL) {
    Serial.println(
        "[WARNING] NTP Sync Timeout. Attempting HTTP Time Fallback...");
    syncTimeViaHTTP();
  } else {
    Serial.println("[INFO] NTP synced: " + String((long)time(nullptr)));
  }

  ip_address_str = WiFi.localIP().toString();
  Serial.print("[INFO] ESP32 IP Address: ");
  Serial.println(ip_address_str);

  tone(BUZZER_PIN, 1200, 150);
  delay(180);
  tone(BUZZER_PIN, 1600, 250);

  startLocalServer();

#ifndef WOKWI_SIM
  // Configure secure MQTT client
  mqttTlsClient.setInsecure(); // Bypass SSL verification for HiveMQ Cloud
  mqttClient.setServer(mqtt_server, mqtt_port);
  mqttClient.setCallback(mqttCallback);
#endif

  drawMainScreen(0, "", "12:00:00", "");
}

void loop() {
  // ─── Real-time clock tick ──────────────────────────────────────────────────
  // อัปเดตนาฬิกาทุก 1 วินาที เฉพาะตอนอยู่หน้าหลัก โดยวาดทับเฉพาะตัวเลขเวลา
  // (ไม่ fillScreen) จึงเดินแบบเรียลไทม์และจอไม่กระพริบ — ทำงานแม้ poll ได้ 304
  if (currentScreen == SCREEN_MAIN && millis() - lastClockTick >= 1000) {
    lastClockTick = millis();
    String t = getTimeString();
    if (t != last_clock_str) {
      drawClockRegion(t);
    }
    drawQrFreshness(); // อัปเดตแถบความสด QR ทุกวินาที (วาดเล็ก ไม่กระพริบ)
  }

  // Check door sensor open-state warning
  // MC-38 outputs HIGH when door is open (magnet away), LOW when closed (magnet
  // close)
  int doorState = digitalRead(DOOR_SENSOR_PIN);

  if (doorState == HIGH) {
    if (doorOpenStartTime == 0) {
      doorOpenStartTime = millis();
    } else if (millis() - doorOpenStartTime >
               10000) { // 10 seconds warning threshold
      static unsigned long lastAlertBeep = 0;
      if (millis() - lastAlertBeep > 500) {
        lastAlertBeep = millis();
        tone(BUZZER_PIN, 2000, 200); // Play 2000Hz alert beep for 200ms
        Serial.println("[WARNING] Door open for too long!");
      }
    }
  } else {
    doorOpenStartTime = 0; // Reset
  }

  // Check physical exit button (Active-LOW or Active-HIGH depending on module
  // spec) Most modules output LOW when pressed. If active-HIGH sensor, change
  // to == HIGH.
  if (digitalRead(EXIT_BUTTON_PIN) == LOW) {
    triggerDoorOpenInstant("EXIT BUTTON", "PHYSICAL BUTTON");

#ifndef WOKWI_SIM
    if (WiFi.status() == WL_CONNECTED && !is_offline_mode) {
      HTTPClient http;
      String exitUrl = String(server_url) + "&action=exit_button";
      static WiFiClientSecure exitSecureClient;
      exitSecureClient.setInsecure();
      http.begin(exitSecureClient, exitUrl);
      addZeroTrustHeaders(http, "/api/esp32/display");
      int httpCode = http.POST("");
      if (httpCode > 0) {
        Serial.print("[INFO] Exit button notification response: ");
        Serial.println(httpCode);
      } else {
        Serial.print("[ERROR] Exit button notification failed: ");
        Serial.println(http.errorToString(httpCode));
      }
      http.end();
    }
#endif

    // Wait until the button is released to prevent repeated triggers
    while (digitalRead(EXIT_BUTTON_PIN) == LOW) {
      delay(50);
    }
  }

  handleLocalValidation();

#ifndef WOKWI_SIM
  if (WiFi.status() == WL_CONNECTED && !is_offline_mode) {
    if (!mqttClient.connected()) {
      unsigned long now = millis();
      if (now - lastMqttRetry > 15000) { // Try to reconnect every 15 seconds
        lastMqttRetry = now;
        Serial.println("[MQTT] Connecting to MQTT Broker...");
        String clientId = "SmartAccessClient_" + String(ESP.getEfuseMac(), HEX);
        if (mqttClient.connect(clientId.c_str(), mqtt_user, mqtt_pass)) {
          Serial.println("[MQTT] Connected to MQTT Broker!");
          mqttClient.subscribe(mqtt_topic_cmd);
        } else {
          Serial.print("[MQTT] Connection failed, rc=");
          Serial.println(mqttClient.state());
        }
      }
    } else {
      mqttClient.loop();
    }
  }
#endif

  if (is_offline_mode) {
    bool hasCache = SPIFFS.exists(cache_students_file);
    if (hasCache) {
      static unsigned long lastBlink = 0;
      static bool ledState = false;
      if (millis() - lastBlink > 1000) {
        lastBlink = millis();
        ledState = !ledState;
        digitalWrite(LED_WIFI, ledState ? HIGH : LOW);
        digitalWrite(LED_REJECT, LOW);
      }

      unsigned long sec = millis() / 1000;
      unsigned long hh = (sec / 3600) % 24;
      unsigned long mm = (sec / 60) % 60;
      unsigned long ss = sec % 60;
      char timeBuf[10];
      snprintf(timeBuf, sizeof(timeBuf), "%02d:%02d:%02d", (int)hh, (int)mm,
               (int)ss);

      static unsigned long lastScreenUpdate = 0;
      if (millis() - lastScreenUpdate > 5000) {
        lastScreenUpdate = millis();
        drawMainScreen(0, "OFFLINE CACHE ACTIVE", String(timeBuf), "");
      }
    } else {
      digitalWrite(LED_WIFI, LOW);
      digitalWrite(LED_REJECT, HIGH);

      // วาดครั้งเดียวตอนเพิ่งเข้าสถานะนี้ (กันจอแฟลชซ้ำทุก 5 วิ)
      if (currentScreen != SCREEN_REJECTED) {
        currentScreen = SCREEN_REJECTED;
        canvas.fillScreen(tft.color565(15, 3, 3));
        canvas.fillCircle(160, 70, 30, tft.color565(127, 29, 29));
        canvas.drawCircle(160, 70, 31, tft.color565(239, 68, 68));
        for (int t = 0; t < 4; t++) {
          canvas.drawLine(149, 59 + t, 171, 81 + t, ILI9341_WHITE);
          canvas.drawLine(171, 59 + t, 149, 81 + t, ILI9341_WHITE);
        }
        printCentered("OFFLINE MODE", 142, &FreeSansBold12pt7b,
                      tft.color565(239, 68, 68));
        canvas.setTextSize(1);
        canvas.setTextColor(ILI9341_WHITE);
        canvas.setCursor(88, 166);
        canvas.print("No cached data available");
        canvas.setTextColor(tft.color565(156, 163, 175));
        canvas.setCursor(98, 186);
        canvas.print("Waiting for network...");
      }
    }
  }

  static unsigned long lastPollTime = 0;
  if (WiFi.status() == WL_CONNECTED && !is_offline_mode) {
    digitalWrite(LED_WIFI, HIGH);

    if (millis() - lastPollTime >= currentPollDelay) {
      lastPollTime = millis();

      String time_str = getTimeString();

      HTTPClient http;
      String pollUrl = String(server_url) + "&slim=true";
      // Serial.print("[INFO] Polling URL: ");
      // Serial.println(pollUrl);
      if (pollUrl.startsWith("https://")) {
#ifdef WOKWI_SIM
        static WiFiClientSecure simClient;
        simClient.setInsecure();
        http.begin(simClient, pollUrl);
#else
        if (!tlsClientInitialized) {
          persistentTlsClient.setInsecure();
          tlsClientInitialized = true;
        }
        http.setReuse(true);
        http.begin(persistentTlsClient, pollUrl);
#endif
      } else {
        http.begin(pollUrl);
      }

      http.setTimeout(5000);
      addZeroTrustHeaders(http, "/api/esp32/display");
      if (lastEtag.length() > 0) {
        http.addHeader("If-None-Match", lastEtag);
      }

      int httpCode = http.GET();
      // Serial.print("[INFO] Polling result code: ");
      // Serial.println(httpCode);

      if (httpCode == 304) {
        idleCycles++;
        if (idleCycles >= 5) {
          currentPollDelay = POLL_SLOW;
        }
        http.end();
        return;
      }

      if (httpCode == 200) {
        String newEtag = http.header("ETag");
        if (newEtag.length() > 0) {
          lastEtag = newEtag;
        }
        api_fail_count = 0;
        if (is_offline_mode) {
          is_offline_mode = false;
          WiFi.mode(WIFI_STA);
          DBG("Restored online mode. AP stopped.");
        }
        if (millis() - last_student_sync > SYNC_STUDENTS_INTERVAL) {
          last_student_sync = millis();
          syncStudentCache();
        }
        if (millis() - last_log_sync > SYNC_LOGS_INTERVAL) {
          last_log_sync = millis();
          syncOfflineLogs();
        }
        String payload = http.getString();
        DynamicJsonDocument doc(
            1024); // Increased to 1024 to prevent buffer overflows from long
                   // URLs or JSON nesting
        DeserializationError error = deserializeJson(doc, payload);

        if (!error) {
          bool update_available = doc["update_available"] | false;
          if (update_available) {
            Serial.println("[INFO] New version found! Starting OTA...");
            http.end();
#ifndef WOKWI_SIM
            performHTTPSOTA();
#endif
            return;
          }

          if (doc.containsKey("offline_pin")) {
            String new_pin = doc["offline_pin"].as<String>();
            if (new_pin != cached_offline_pin) {
              cached_offline_pin = new_pin;
              File f = SPIFFS.open("/offline_pin.txt", "w");
              if (f) {
                f.print(cached_offline_pin);
                f.close();
              }
            }
          }

          const char *door_trigger = doc["door_trigger"];
          int pending_count = doc["pending_count"];
          const char *server_time_text = doc["server_time_text"];
          if (server_time_text && strlen(server_time_text) >= 8) {
            time_str = String(server_time_text).substring(0, 8);
          }

          String approvedName = "";
          String studentId = "";
          if (doc.containsKey("last_approved") &&
              !doc["last_approved"].isNull()) {
            approvedName = doc["last_approved"]["name"].as<String>();
            studentId = doc["last_approved"]["student_id"].as<String>();
          }

          const char *active_token = doc["active_token"];
          const char *register_url = doc["register_url"];
          const char *requested_room = doc["requested_room"];

          String qrText = "";
          if (active_token) {
            String baseUrl = "https://smartaccess-project.vercel.app";
            String currentRoom = String(room_code);

            if (register_url) {
              String regUrl = String(register_url);
              int idx = regUrl.indexOf("/?room=");
              if (idx != -1) {
                baseUrl = regUrl.substring(0, idx);
              }
            } else {
              // Fallback: extract base URL from server_url
              String sUrl = String(server_url);
              int apiIdx = sUrl.indexOf("/api/");
              if (apiIdx != -1) {
                baseUrl = sUrl.substring(0, apiIdx);
              }
            }

            if (requested_room) {
              currentRoom = String(requested_room);
            }

            qrText = baseUrl + "/?scan=" + String(active_token) +
                     "&room=" + currentRoom;
          }

          DBGF("Door command: %s | Queue: %d\n",
               door_trigger ? door_trigger : "NULL", pending_count);

          if (String(door_trigger) == "open") {
            idleCycles = 0;
            currentPollDelay = POLL_FAST;
          } else if (pending_count != last_queue_count ||
                     studentId != last_approved_name ||
                     (active_token &&
                      String(active_token) != last_active_token)) {
            idleCycles = 0;
            currentPollDelay = POLL_NORMAL;
          } else {
            idleCycles++;
            if (idleCycles >= 5)
              currentPollDelay = POLL_SLOW;
          }

          bool isOpenCmd = (door_trigger && String(door_trigger) == "open");

          // เปิดประตูเฉพาะตอน "ขอบขาขึ้น" (idle→open) เท่านั้น — ถ้าเซิร์ฟเวอร์ยังส่ง
          // "open" ค้างมา (ยังไม่ถูก consume) บอร์ดจะไม่เปิดซ้ำและกลับไปหน้า QR ตามปกติ
          if (isOpenCmd && last_door_trigger != "open" &&
              millis() - lastUnlockAt >= UNLOCK_COOLDOWN_MS) {
            lastUnlockAt = millis();
            Serial.println("[INFO] Door unlocked");
            DBG("🔓 UNLOCK SIGNAL RECEIVED! Opening door...");

            drawScanningScreen();
            tone(BUZZER_PIN, 1500, 100);
            delay(300);

            drawUnlockedScreen(approvedName, studentId);
            digitalWrite(RELAY_PIN, HIGH);

            tone(BUZZER_PIN, 1000, 150);
            delay(180);
            tone(BUZZER_PIN, 1500, 150);
            delay(180);
            tone(BUZZER_PIN, 2000, 300);

            for (int i = 0; i <= 38; i++) {
              drawCountdownRing(100 - (i * 100 / 38));
              delay(100);
            }

            digitalWrite(RELAY_PIN, LOW);
            Serial.println("[INFO] Door locked");
            DBG("🔒 Door auto locked.");
            tone(BUZZER_PIN, 800, 250);

            last_queue_count = -1;
            last_approved_name = "FORCE_REDRAW";
            last_active_token = "FORCE_REDRAW";
          } else if (pending_count != last_queue_count ||
                     studentId != last_approved_name ||
                     (active_token &&
                      String(active_token) != last_active_token)) {
            last_queue_count = pending_count;
            last_approved_name = studentId;
            if (active_token)
              last_active_token = String(active_token);

            drawMainScreen(pending_count, studentId, time_str, qrText);
          } else {
            // ไม่มีข้อมูลเปลี่ยน — อัปเดตเฉพาะนาฬิกา (กันจอกระพริบ)
            drawClockRegion(time_str);
          }

          // จดจำสถานะคำสั่งล่าสุดไว้ตรวจขอบขาขึ้นรอบถัดไป
          last_door_trigger = isOpenCmd ? "open" : "idle";
        }
      } else {
        Serial.println("[ERROR] Connection failed");
        Serial.printf("HTTP Error: %d\n", httpCode);
        api_fail_count++;
        if (api_fail_count >= 5) {
          if (!is_offline_mode) {
            is_offline_mode = true;
            DBG("Entering offline fallback mode. Starting AP.");
            String ap_ssid = "SmartAccess_Offline_" + String(room_code);
            WiFi.mode(WIFI_AP_STA);
            WiFi.softAP(ap_ssid.c_str(), "");
          }
        }
      }
      http.end();
    }
  } else if (WiFi.status() != WL_CONNECTED) {
    // Non-blocking WiFi status blinker & reconnection logic to prevent sluggish
    // performance
    static unsigned long lastWifiBlink = 0;
    static bool wifiBlinkState = false;
    if (millis() - lastWifiBlink >= 250) {
      lastWifiBlink = millis();
      wifiBlinkState = !wifiBlinkState;
      digitalWrite(LED_WIFI, wifiBlinkState ? HIGH : LOW);
    }

    static unsigned long lastWifiRetry = 0;
    if (millis() - lastWifiRetry >= 10000) {
      lastWifiRetry = millis();
      Serial.println(
          "[WIFI] Connection lost. Attempting non-blocking reconnect...");
      WiFi.disconnect();
      WiFi.begin(ssid, password);
    }
  }
}

bool secureCompare(const char *a, const char *b) {
  size_t lenA = strlen(a);
  size_t lenB = strlen(b);
  size_t len = (lenA > lenB) ? lenA : lenB;

  volatile uint8_t result = lenA ^ lenB;
  for (size_t i = 0; i < len; i++) {
    uint8_t ca = (i < lenA) ? a[i] : 0;
    uint8_t cb = (i < lenB) ? b[i] : 0;
    result |= ca ^ cb;
  }
  return result == 0;
}
