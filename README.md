# 🚪 SmartAccess Access Control System

### *Innovative system for managing access rights and controlling classroom access via wireless network*
> **ระบบควบคุมการเข้าออกห้องปฏิบัติการเรียนการสอนอัจฉริยะแบบ Full-Stack IoT & Dashboard ประสิทธิภาพสูง**  
> พัฒนาขึ้นโดยสอดคล้องตามมาตรฐาน **พ.ร.บ. คอมพิวเตอร์ มาตรา 26 (จัดเก็บ Log ≥ 90 วัน)** และหลักการ **PDPA** ของประเทศไทยอย่างเป็นทางการ

---

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-16-000000?style=for-the-badge&logo=nextdotjs&logoColor=white" alt="Next.js 16" />
  <img src="https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React 19" />
  <img src="https://img.shields.io/badge/TypeScript-Ready-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white" alt="Supabase PostgreSQL" />
  <img src="https://img.shields.io/badge/ESP32-Hardware-E7352C?style=for-the-badge&logo=espressif&logoColor=white" alt="ESP32 IoT" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-v4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white" alt="Tailwind v4" />
</p>

---

## 🏛️ สถาปัตยกรรมและฟีเจอร์เด่นระบบ (Core Architecture & Features)

### 🎨 1. Minimalist Glassmorphism UI (ระบบสีประจำคณะ)
* ออกแบบหน้าลงทะเบียนด้วยคู่สี **Harmony Palette Design System**: **สีม่วง RMUTP (#7C3AED)** และ **สีชมพูคณะครุศาสตร์อุตสาหกรรม (#DB2777)**
* คอนเทนเนอร์สีกระจกโปร่งแสงหรูหรา (Glassmorphism Effects), ไอคอนเรืองแสง และปุ่มกดมีอนิเมชันตอบสนองลื่นไหลแบบสมบูรณ์ 100% บนทุกขนาดหน้าจอ (Mobile responsive locks)

### 📊 2. แดชบอร์ดตรวจสอบสถานะเรียลไทม์ (Enterprise Status Grid)
* **Supabase PostgreSQL Table Status**: แสดงสถานะการเชื่อมต่อ และการทำงานของฐานข้อมูล Supabase
* **ESP32 Controller Status**: ตรวจสอบบอร์ดฮาร์ดแวร์หน้าห้องเรียนแบบเรียลไทม์ ทราบเลขไอพี โหมดการทำงาน (จำลอง/จริง) และสถานะกลอนล็อกแม่เหล็กไฟฟ้ารีเลย์ (🔒 Lock / 🔓 Open)
* **3-Channel Notification Dispatcher**: ยืนยันความพร้อมของบอทส่งข้อความแจ้งเตือนสถานะความปลอดภัยใน 3 แพลตฟอร์มพร้อมกัน (Discord, Telegram, LINE)

### ⚖️ 3. ระบบจัดการประวัติสอดคล้องกับ พ.ร.บ. คอมพิวเตอร์ & PDPA
* จัดเก็บบันทึกประวัติจราจรทางคอมพิวเตอร์เข้าออกประตูห้องเรียนอย่างเคร่งครัดตาม **พ.ร.บ. คอมพิวเตอร์ ม.26 (ไม่น้อยกว่า 90 วัน)** โดยแยกประวัติแบบมีลำดับความสำคัญชัดเจน (**info, warning, critical**)
* **ระบบความปลอดภัยสองชั้น (Double Failsafe Settings)**: ลบ Log หมดอายุ (>90 วัน) ได้ฟรีในคลิกเดียว ส่วนประวัติที่ยังไม่หมดอายุ (<90 วัน) ระบบจะบังคับให้แอดมินระดับสูงสุดกรอกรหัสยืนยันตัวตน (`bcryptjs`) ป้องกันแฮกเกอร์ทำลายร่องรอย
* **Consent Manager UI (PDPA)**: หน้าต่างขอความยินยอม Cookies แบบคัดสรรประเภทการเก็บข้อมูล มีหน้า Privacy Policy และข้อสัญญาการใช้งาน (Terms of Services) ครบถ้วนตามกฎหมาย PDPA ของไทย

### 🚀 4. ระบบอัปเดตเฟิร์มแวร์ไร้สายแบบประหยัดพลังงานคลาวด์ (Cloud HTTPS OTA Center)
* **Vercel Ephemeral Failsafe**: ออกแบบระบบจัดเก็บไฟล์ `.bin` บนคลาวด์ **Supabase Storage (โควตาฟรี 1GB)** เพื่อเลี่ยงข้อจำกัดไฟล์สูญหายของระบบตู้คอนเทนเนอร์ Vercel Free Plan
* **HTTP 302 Direct CDN Redirection**: ตัว API Next.js ทำหน้าที่ตรวจจับสิทธิ์ความปลอดภัยแล้วส่ง Redirect ให้บอร์ด ESP32 วิ่งไปโหลดไฟล์ตรงผ่าน Supabase Storage CDN ช่วยประหยัดซีพียูของเซิร์ฟเวอร์ Next.js เหลือ 0%
* **Edge-Trigger Door Prevention**: ระบบตรวจจับจังหวะเปิดประตู (Edge-Triggered Command Status) ช่วยแก้ปัญหาคำสั่งเปิดประตูค้างและ ESP32 ทำการเปิดประตูวนซ้ำ

### 📄 5. รายงาน PDF ระดับอุตสาหกรรม (Landscape Server-Side PDF)
* ประมวลผลเอกสาร PDF บนเซิร์ฟเวอร์ด้วย `pdfkit` ออกแบบตารางในแนวแนวนอน (Landscape) เพื่อความชัดเจน อ่านง่าย เป็นทางการ
* มีปุ่มเปิดห้องแบบเร่งด่วน (Emergency Unlock) และปิดกั้นประตูล็อกอัตโนมัติ 5 วินาที พร้อมอนิเมชันเกจลดเวลาบนหน้าจอ TFT สลักคมชัดสวยงาม

### 📱 6. ระบบคงสถานะล็อกอินแบบ PWA (PWA Persistent Login & Sliding Session)
* **Persistent Admin Session**: ผู้ดูแลระบบที่ติดตั้งและใช้งานเว็บในฐานะ Progressive Web App (PWA) บนโทรศัพท์มือถือ (iOS/Android) จะยังคงสถานะล็อกอินได้อย่างต่อเนื่องนานสูงสุดถึง 30 วัน แม้ว่าจะปิดหรือปัดแอปทิ้งไป
* **Sliding Session / Auto-Refresh**: ทริกเกอร์ Sliding Session ผ่าน API `POST /api/auth/refresh` ทุกครั้งที่โหลดหน้าแผงควบคุมหลัก เพื่อปรับปรุงคุกกี้และออกโทเคน JWT ใหม่โดยอัตโนมัติ ช่วยลดปัญหาความยุ่งยากในการป้อนข้อมูลชื่อผู้ใช้และรหัสผ่านซ้ำๆ
* **Fast Dashboard Redirect**: บูรณาการระบบตรวจเช็คประวัติล็อกอินในหน้า `/admin/login` หากคุกกี้สิทธิ์ยังใช้งานได้อยู่จริง ระบบจะทำการเปลี่ยนเส้นทางพาแอดมินเด้งเข้าสู่หน้าต่างแดชบอร์ดควบคุมระบบในทันที พร้อมแสดงภาพตัวโหลดที่สวยงามป้องกันการกะพริบของหน้าจอหลัก
* **Auto-Logout Disabler**: ปิดระบบ Idle Auto-Logout 15 นาที เพื่อให้แอปทำงานเสมือนเนทีฟแอปพลิเคชันที่มีระบบ Auth ตลอดเวลา

> [!WARNING]
> **⚠️ ข้อพิจารณาความปลอดภัยเชิงวิศวกรรม (Security & Engineering Trade-offs Warning):**  
> การคงสถานะคุกกี้ล็อกอินอายุ 30 วันและการยกเลิกการเตะออกจากระบบเมื่อไม่มีความเคลื่อนไหว (Idle Auto-Logout) เป็นการแลกเปลี่ยนความสะดวกสบายด้านการใช้งานเว็บกับระดับความมั่นคงปลอดภัย (Convenience vs Security) ดังนั้น:
> 1. ผู้ดูแลระบบและผู้ดำเนินการ **ต้องลงชื่อเข้าใช้เฉพาะบนอุปกรณ์ส่วนตัวเท่านั้น** และอุปกรณ์ดังกล่าวต้องติดตั้งระบบล็อกหน้าจอด้วยรหัสผ่านหรือชีวมาตร (FaceID/Fingerprint)
> 2. หลีกเลี่ยงการล็อกอินและเลือกบันทึกรหัสผ่านหรือคุกกี้บนเครื่องคอมพิวเตอร์สาธารณะเด็ดขาด
> 3. เพื่อเป็นมาตรการ Failsafe: เมื่อแอดมินระดับสูงสุด (Owner) ปิดใช้งานบัญชีแอดมินคนใดคนหนึ่งผ่านตารางฐานข้อมูล (`is_active = false`) หรือสั่งลบสิทธิ์ ตัวระบบจะทำการตัดขัดจังหวะ (401 Interceptor) ดีดบัญชีนั้นออกจากแอปทันทีในการเรียกใช้ API รอบถัดไป เพื่อป้องกันแฮกเกอร์ใช้โทเคนที่ค้างอยู่

---

## 💻 เทคโนโลยีที่เลือกใช้ (Technology Stack)

```
┌────────────────────────────────────────────────────────┐
│             💻 NEXT.JS 16+ & REACT 19 WEB APP          │
│                    (Vercel Serverless)                 │
├────────────────────────────────────────────────────────┤
│ Styling: Vanilla CSS + Tailwind CSS v4 Harmony Palette │
│ Databases: Supabase PostgreSQL & Connection Pool (6543)│
│ Notifications: 3-Way Dispatcher (Discord, Telegram, LINE)│
│ Auth: JWT Sessions + bcryptjs secure hashing           │
│ Reporting: Server-side landscape pdfkit generator     │
└───────────────────────────┬────────────────────────────┘
                            │ (HTTPS Cloud Polling — ESP32 ดึงคำสั่งเองทุก ~2 วิ)
┌───────────────────────────▼────────────────────────────┐
│                    📡 ESP32 Microcontroller            │
├────────────────────────────────────────────────────────┤
│ Output Pinouts: GPIO 12 Relay · GPIO 27 Active Buzzer  │
│ Indicators: GPIO 14 WiFi LED · GPIO 26 Reject LED      │
│ Display Panel: ILI9341 SPI TFT LCD (3.2 inch)          │
│ Comms: Outbound Cloud Polling เท่านั้น (ไม่เปิด port ขาเข้า)│
└────────────────────────────────────────────────────────┘
```

---

## 📂 โครงสร้างโฟลเดอร์หลัก (Project Structure)

```
Project/
├── my-app/
│   ├── app/
│   │   ├── globals.css           # โครงสร้างดีไซน์และโทนสีของทั้งระบบ (Harmony Palette)
│   │   ├── page.tsx              # หน้าจอลงทะเบียนขอเข้าใช้งานของนักศึกษา + Countdown Timer
│   │   ├── admin/
│   │   │   ├── login/page.tsx    # หน้าลงชื่อเข้าใช้งานของแอดมิน
│   │   │   └── dashboard/page.tsx# หน้าบอร์ดควบคุมความปลอดภัยและ OTA Firmware Upload Center
│   │   └── api/
│   │       ├── system/
│   │       │   ├── status/route.ts   # ดึงสถานะ live ตู้ Supabase, ESP32, Discord
│   │       │   ├── settings/route.ts # ดึงและบันทึกค่าระบบความปลอดภัย / Webhooks แยกห้อง
│   │       │   ├── logs/cleanup/route# ระบบทำความสะอาดลบประวัติความปลอดภัยตามกฎหมาย
│   │       │   ├── summary/route.ts  # สรุปเหตุการณ์รายวัน/สัปดาห์ ส่งผ่าน Vercel Cron
│   │       │   └── test-webhook/route# ลิงก์ทดสอบ Webhook แยกช่องทาง (Owner Only)
│   │       ├── esp32/
│   │       │   ├── display/route.ts  # จ่ายข้อมูลหน้าจอ TFT + สั่งการ OTA อัปเกรด
│   │       │   └── firmware-ota/route# จัดการส่งบอร์ดอัปเดตแบบ 302 Supabase Redirect
│   │       └── export/pdf/route.ts   # เขียนประวัติ PDF ส่งออกแนวนอน
│   ├── lib/
│   │   ├── db.ts                 # ตัวเชื่อมต่อ Supabase PostgreSQL และสร้างตารางอัตโนมัติ
│   │   ├── auth.ts               # ระบบถอนสิทธิ์/ตรวจสอบ JWT และแอดมินเซสชัน
│   │   ├── esp32.ts              # เขียนคำสั่งปลดล็อกเข้าคิว DB (Cloud-Only) — ESP32 มาดึงเอง
│   │   ├── access-log.ts         # ตัวบันทึกประวัติจราจรครบทุกมิติ (IP, User-Agent, Severity)
│   │   ├── notify.ts             # ตัวกระจายการแจ้งเตือนรวมศูนย์ขนาน (Discord, Telegram, LINE)
│   │   └── discord.ts            # ตัวจัดการโครงสร้าง Embed Message แยกช่องทาง
│   └── vercel.json               # คอนฟิก Vercel Serverless & Crons
├── esp32/
│   ├── esp32.ino                 # เฟิร์มแวร์ ESP32 (ใช้ตัวเดียวทุกห้อง — กำหนดห้องผ่าน config.h)
│   └── config.h.template         # template ตั้งค่า Wi-Fi / server_url / api_key / room_code
└── complete_system_manual_th.md  # คู่มือระบบควบคุมประตูและซอร์สโค้ดฉบับละเอียด (Thesis Manual)
```

---

## 🚀 ขั้นตอนการติดตั้งและรันเซิร์ฟเวอร์ (Getting Started)

### 1. ติดตั้งไลบรารี
```bash
cd my-app
npm install
```

### 2. ตั้งค่าไฟล์สภาพแวดล้อม `.env.local`
สร้างไฟล์ `.env.local` ไว้ที่โฟลเดอร์ `my-app/` และกำหนดค่าดังนี้:
```env
# ── PostgreSQL Connection (Supabase / Local PG) ──
POSTGRES_URL="postgres://postgres.<your-project-ref>:<your-db-password>@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres?sslmode=require&supa=base-pooler.x"
POSTGRES_HOST="db.<your-project-ref>.supabase.co"
POSTGRES_USER="postgres"
POSTGRES_PASSWORD="<your-db-password>"
POSTGRES_DATABASE="postgres"
POSTGRES_POOL_MAX=5
SUPABASE_CA_CERT="-----BEGIN CERTIFICATE-----\n...\n-----END CERTIFICATE-----"

# ── Supabase Client (For Edge API Routing / RLS Testing) ──
NEXT_PUBLIC_SUPABASE_URL="https://<your-project-ref>.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="<your-supabase-anon-jwt>"
SUPABASE_SERVICE_ROLE_KEY="<your-supabase-service-role-jwt>"

# ── Secrets (บังคับ — แอปจะ throw ทันทีถ้าไม่ตั้งค่า) ──
JWT_SECRET="สุ่มข้อความยาวๆความปลอดภัยของคุณ"
QR_SIGNING_KEY="สุ่มข้อความยาวๆอีกชุดสำหรับ QR"

# ── Database Initialization Control ──
SKIP_DB_INIT=true
ALLOW_DEV_SEED=true

# ── Initial Administrator (ใช้เฉพาะตอน seed ครั้งแรก) ──
INITIAL_ADMIN_USERNAME="admin"
INITIAL_ADMIN_PASSWORD="<choose-a-strong-password>"
INITIAL_ADMIN_FULL_NAME="System Administrator"

# ── ESP32 Controller Configuration ──
ESP32_IP="192.168.1.100"
ESP32_PORT="80"
ESP32_MOCK_MODE=false
ESP32_WOKWI=false
ESP32_API_KEY="สุ่มข้อความยาวๆสำหรับ ESP32"
ALLOWED_IP_RANGES="*"

# ── Ops & Webhooks ──
NEXT_PUBLIC_APP_URL="https://your-domain.duckdns.org"
DISCORD_WEBHOOK_URL="https://discord.com/api/webhooks/xxxxxx"
CRON_SECRET="สุ่มข้อความยาวๆ ป้องกัน endpoint สรุปรายวัน/สัปดาห์"
VERCEL_TOKEN=""
VERCEL_PROJECT_ID=""

# ── Vercel KV (Redis) cache (ทางเลือก — ถ้าเว้นว่าง fallback เป็น in-memory) ──
KV_REST_API_URL=""
KV_REST_API_TOKEN=""

# ── Firebase Cloud Messaging (PWA Push Notifications) ──
NEXT_PUBLIC_FIREBASE_API_KEY="AIzaSy..."
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="<your-app>.firebaseapp.com"
NEXT_PUBLIC_FIREBASE_PROJECT_ID="<your-app>"
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="<your-app>.firebasestorage.app"
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="เลขผู้ส่งสาร"
NEXT_PUBLIC_FIREBASE_APP_ID="เลขไอดีแอป 1:xxxx:web:xxxx"
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID="G-XXXXXX"
NEXT_PUBLIC_FIREBASE_VAPID_KEY="คีย์ Web Push Certificates Key Pair"

# ── Firebase Admin (Server-side Push Dispatch) ──
FIREBASE_CLIENT_EMAIL="firebase-adminsdk-xxxxx@<your-app>.iam.gserviceaccount.com"
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# ── MQTT Broker Configuration (Systems Real-Time Unlock) ──
MQTT_BROKER_HOST="xxxxxx.s1.eu.hivemq.cloud"
MQTT_PORT=8084
MQTT_PATH="/mqtt"
MQTT_USERNAME="esp32_client"
MQTT_PASSWORD="your_secure_password"
```

> ดูตัวแปรครบทุกตัวพร้อมคำอธิบายได้ใน [`my-app/.env.example`](my-app/.env.example) — **ห้ามใส่ค่าจริงในไฟล์ตัวอย่าง ใส่เฉพาะใน `.env.local` (ถูก gitignore ไว้)**

### 3. รันระบบเซิร์ฟเวอร์สำหรับการพัฒนา
```bash
npm run dev
```
* หน้าจอลงทะเบียนของนักศึกษา: [http://localhost:3000](http://localhost:3000)
* แดชบอร์ดแอดมิน: [http://localhost:3000/admin/login](http://localhost:3000/admin/login)
  - **บัญชีเริ่มต้น**: Username: `admin` | Password: `admin123` *(ระบบจะบังคับให้เปลี่ยนเพื่อความปลอดภัยสูงสุดในการรันโปรดักชัน)*

### 4. รันชุดทดสอบอัตโนมัติ (Unit Tests)
ทดสอบตรรกะความปลอดภัยหลัก (สิทธิ์ควบคุมห้อง, JWT, validation, กันการปลอม IP) ด้วย **Vitest**:
```bash
npm test          # รันครั้งเดียว
npm run test:watch # โหมดเฝ้าดูไฟล์
```

---

## 📡 การต่ออุปกรณ์ฮาร์ดแวร์บอร์ด ESP32 (ILI9341 SPI)
ซอร์สโค้ดของบอร์ด ESP32 อยู่ภายใต้ [**`esp32/esp32.ino`**](file:///c:/Users/aunkh/OneDrive/Desktop/Project/esp32/esp32.ino)

### รายละเอียดพอร์ตการต่อขา:
* **TFT LCD 3.2" (ILI9341)**: CS ➔ 15, RST ➔ 4, DC ➔ 2, MOSI ➔ 23, MISO ➔ 19, SCK ➔ 18
* **Relay Output (คุมกลอนแม่เหล็ก 280kg)**: GPIO 12
* **Active Buzzer (เสียงดนตรีบูตและปลดล็อก)**: GPIO 27
* **WiFi Status LED**: GPIO 14 (กะพริบเมื่อค้นหาสัญญาณ / ติดค้างเมื่อเชื่อมสำเร็จ)
* **Reject Status LED**: GPIO 26 (สว่างวาบสีแดงสลับสิทธิ์ถูกปฏิเสธ)

---

## ⚖️ มาตรฐานความสอดคล้องทางกฎหมาย (Legal Compliance & Ethics)
ระบบนี้ทำงานโดยเคารพสิทธิ์และรักษาความเป็นส่วนตัวของผู้ใช้งานอย่างเป็นรูปธรรม:
* **พ.ร.บ. คอมพิวเตอร์ พ.ศ. 2550 มาตรา 26**: จัดเก็บบันทึกประวัติข้อมูลการจราจรเข้าอาคารอย่างสมบูรณ์แบบไม่น้อยกว่า 90 วัน มีระบบป้องภัยทำลายหลักฐานด้วยรหัสผ่านแอดมินสูงสุด
* **PDPA (พ.ร.บ. คุ้มครองข้อมูลส่วนบุคคล พ.ศ. 2562)**: คุมนโยบายการจัดเก็บสิทธิ์ความเห็นชอบผู้ใช้งานแบบคัดแยกหมวดหมู่ (Granular Consent Management) และมีฟังก์ชันเพิกถอนสิทธิ์/ขอลบข้อมูลตามมาตรา 22-26 อย่างถูกต้องตามกฎหมายของไทย

---
*นวัตกรรมระบบควบคุมการเข้าออกห้องปฏิบัติการอัจฉริยะ คณะครุศาสตร์อุตสาหกรรม มหาวิทยาลัยเทคโนโลยีราชมงคลพระนคร*
*(SmartAccess Faculty of Technical Education, RMUTP)*

---
<sub>อัปเดตล่าสุด: 2026-05-31 (รองรับ PWA standalone สมบูรณ์แบบ, ระบบคงสถานะล็อกอิน PWA Persistent Login & Sliding Session 30 วัน, ปลดระบบ Idle Auto-Logout, แจ้งเตือนพุช FCM REST API, และแบรนด์เรืองแสง Glowing Neon ในแอป)</sub>
