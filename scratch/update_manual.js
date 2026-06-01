const fs = require('fs');
const path = require('path');

const manualPath = path.join(__dirname, '..', 'complete_system_manual_th.md');
let content = fs.readFileSync(manualPath, 'utf8');

// 1. Update timestamp
content = content.replace(
  /อัปเดตล่าสุด: \d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2} \(\+07:00\)/,
  'อัปเดตล่าสุด: 2026-06-01 10:31:00 (+07:00)'
);

// 2. Locate target summary table block at Chapter 5
const targetHeader = "### 71.53.6 สรุปไฟล์ที่เปลี่ยน (อ้างอิงเร็ว)";
const targetIdx = content.lastIndexOf(targetHeader);

if (targetIdx !== -1) {
  // Find where the next section (## 71.54) begins
  const nextSectionHeader = "## 71.54 ชุดทดสอบความปลอดภัยและการทำงานแบบอัตโนมัติ";
  const nextSectionIdx = content.indexOf(nextSectionHeader, targetIdx);
  
  if (nextSectionIdx !== -1) {
    const originalBlock = content.substring(targetIdx, nextSectionIdx);
    
    const replacement = `### 71.53.8 ระบบ Slim Polling Mode สำหรับลดหน่วยความจำและรักษาระดับเสถียรภาพบอร์ด IoT

**วันที่ดำเนินการ:** 1 มิถุนายน 2569 (10:23 น. ICT)

ตรวจพบและดำเนินการเพิ่มขีดความสามารถการสื่อสารในโหมดประหยัดทรัพยากร เพื่อรักษาระดับเสถียรภาพการประมวลผล JSON บนหน่วยความจำ SRAM ของบอร์ด ESP32:
1. **ปัญหา Heap Fragmentation และ Stack Overflow บน ESP32:**
   - **สาเหตุ:** การสื่อสารที่ Polling ถี่ๆ ทุก 2 วินาที คืนข้อมูล Payload ขนาดใหญ่กว่า 700 ไบต์ที่มี Nested Objects (display.color_theme, URLs, server_time, status) ทำให้เกิด Heap Fragmentation บนบอร์ด และส่งผลให้บอร์ดเกิด Stack Overflow หรือ Reboot ตัวเองโดยไม่มีสาเหตุเมื่อทำงานไประยะหนึ่ง
2. **การพัฒนาตรรกะการคัดย่อในฝั่ง API Backend (Slim Polling):**
   - **แนวทางแก้ไข:** ปรับปรุง \`/api/esp32/display\` ให้รองรับ Param \`slim=true\` โดยระบบจะสับเปลี่ยนไปเรนเดอร์ Lightweight JSON Payload หดขนาดข้อมูลลงถึง 70% คงเหลือเฉพาะฟิลด์แกนหลักในการควบคุมกลอนและโทเคนแสดงผลหน้าจอ (\`active_token\`, \`door_trigger\`, \`pending_count\`, \`last_approved.name\`, \`last_approved.student_id\`, \`server_time_text\`, \`update_available\`, \`firmware_version\`, \`offline_pin\`) และปิดกั้น Object ความสวยงามทั้งหมด ทำให้ขนาด Payload ลดลงต่ำกว่า 200 ไบต์
3. **การประยุกต์ใช้และคำนวณ Buffer ใหม่ในฝั่งเฟิร์มแวร์ ESP32:**
   - **แนวทางแก้ไข:** อัปเดต \`esp32.ino\` ให้ยิง Polling โดยพ่วงพารามิเตอร์ \`&slim=true\` และทำการลดขนาดของ StaticJsonDocument จาก \`768\` ไบต์ลงเหลือ \`384\` ไบต์ เพื่อช่วยประหยัด Dynamic Buffer บน SRAM 

### 71.53.9 ระบบสำรองการซิงโครไนซ์เวลาผ่าน HTTP (NTP Sync Failure Fallback Engine)

**วันที่ดำเนินการ:** 1 มิถุนายน 2569 (10:25 น. ICT)

ตรวจพบและดำเนินการเพิ่มกลไกสถาปัตยกรรมกู้ชีพระบบเครือข่ายระดับฮาร์ดแวร์เพื่อรับมือกับภัยคุกคามและการบล็อกสัญญาณเครือข่าย UDP พอร์ต 123 (พอร์ตมาตรฐานของ NTP):
1. **ผลกระทบจากการบล็อก UDP พอร์ต 123:**
   - **กลไกปัญหา:** เครือข่ายองค์กรหรือมหาวิทยาลัยขนาดใหญ่มักปิดพอร์ต UDP 123 เพื่อป้องกัน DDoS หรือแบนเครือข่ายภายนอก ส่งผลให้บอร์ด ESP32 ไม่สามารถซิงค์เวลากับ NTP Server ได้ ค่าเวลา \`time(nullptr)\` จะค้างเป็นปี 1970 ส่งผลให้การยิง API ด้วย \`x-timestamp\` และลายเซ็น HMAC ล้มเหลวและถูกบล็อก 401 Unauthorized อย่างถาวร
2. **การพัฒนา API สำหรับบริการเวลา (Edge Time API):**
   - **แนวทางแก้ไข:** พัฒนา Edge API \`/api/esp32/time\` ให้ทำหน้าที่คืนค่าเวลา UNIX Timestamp ล่าสุดของเซิร์ฟเวอร์ในเสี้ยววินาทีแบบสาธารณะ ไม่ผ่านเกณฑ์ตรวจ HMAC แต่มี Rate Limiter ในตัวเพื่อลดโอกาสการโจมตี
3. **การทำงานสำรองในฝั่งเฟิร์มแวร์ ESP32 (HTTP Time Sync Fallback):**
   - **แนวทางแก้ไข:** อัปเดต \`esp32.ino\` ให้ตั้งเวลาทำ NTP Sync รอคอย 5 วินาที หากล้มเหลว (ค่าเวลายังต่ำกว่าปี 2000 หรือ \`< 1000000000UL\`) บอร์ดจะสลับไปยิง HTTP GET เพื่อขอค่าเวลาจาก \`/api/esp32/time\` และนำตัวเลขที่ได้มาตั้งนาฬิกาภายในบอร์ด RTC ทันทีผ่านฟังก์ชันระบบ \`settimeofday()\` ทำให้บอร์ดทำงานได้แม้พอร์ต UDP 123 จะโดนบล็อกอย่างถาวร

### 71.53.10 ระบบบังคับติดตามการเปลี่ยนทิศทางดาวน์โหลดเฟิร์มแวร์ (OTA HTTP Redirection Support)

**วันที่ดำเนินการ:** 1 มิถุนายน 2569 (10:28 น. ICT)

พัฒนาความเสถียรและความน่าเชื่อถือให้กับการดาวน์โหลดเฟิร์มแวร์แบบไร้สาย (HTTPS Over-The-Air) บนบอร์ดจริงเพื่อรองรับระบบสับเปลี่ยนและเปลี่ยนโดเมนไฟล์ของ Supabase Storage (Signed URLs):
1. **ข้อจำกัดในการย้ายโดเมนข้ามแหล่งข้อมูล (Cross-Domain Redirect):**
   - **กลไกปัญหา:** โค้ดของ Next.js API \`/api/esp32/firmware-ota\` ส่งสถานะ \`302 Found\` เพื่อชี้ทางและเปลี่ยนโดเมนไปยัง Supabase Storage ลิงก์ตรง ซึ่งเป็นการข้ามโดเมน หากบอร์ด ESP32 ไม่ได้ตั้งค่าเปิดการติดตามการเปลี่ยนทิศทาง จะทำให้ตัวอัปเดตยกเลิกกระบวนการทันที ส่งผลให้เกิดบั๊ก \`HTTP_UPDATE_FAILED\`
2. **การปรับแต่งในฝั่งฮาร์ดแวร์ ESP32 และ Generator:**
   - **แนวทางแก้ไข:** เพิ่มการระบุค่าพารามิเตอร์ให้กับไลบรารี \`httpUpdate\` ใน \`esp32.ino\` และเทมเพลตโค้ด \`ArduinoCode.ts\` เพื่อบังคับให้ติดตามทิศทางการโยกย้ายไฟล์เฟิร์มแวร์ทุกกรณี:
     \`\`\`cpp
     httpUpdate.setFollowRedirects(HTTPC_FORCE_FOLLOW_REDIRECTS);
     \`\`\`
     การกำหนดค่า \`HTTPC_FORCE_FOLLOW_REDIRECTS\` ช่วยให้ ESP32 บอร์ดจริงสามารถกระโดดเชื่อมต่อและดึงไฟล์ \`.bin\` ปลายทางจาก Supabase Storage ได้อย่างอัตโนมัติและไร้รอยต่อ

### 71.53.6 สรุปไฟล์ที่เปลี่ยน (อ้างอิงเร็ว)

| ไฟล์ | การเปลี่ยนแปลง |
|------|----------------|
| \`my-app/scripts/compile_manual.js\` | ปลดล็อก Bug การส่งออกรายงานขาวล้วนของส่วนยื่น PDF/PNG, ฝัง CSS เข้าไปในไฟล์เวกเตอร์ SVG ที่เซฟจากแผนผัง Mermaid, สับเปลี่ยนระบบการเซฟรูป PNG โดยการจับภาพเรนเดอร์ด้วย html2canvas ตรงพิกัด, และสร้างปุ่มคัดลอกโค้ด Mermaid ในแต่ละไดอะแกรม |
| \`esp32/esp32.ino\` | ตัด ElegantOTA, \`WOKWI_SIM\`, แก้ \`\'\\0\'\`, edge-trigger door, อัปเดต Poll URL พ่วง \`&slim=true\` และลดขนาด StaticJsonDocument เป็น 384 ไบต์, เพิ่มระบบกู้ชีพ NTP Sync Timeout ผ่าน HTTP Fallback, และเพิ่มคำสั่งบังคับติดตาม Redirect (302) สำหรับเฟิร์มแวร์ OTA |
| \`my-app/app/admin/dashboard/ArduinoCode.ts\` | sync เฟิร์มแวร์ (Slim Polling + NTP HTTP Fallback + OTA Redirect 302) + ปลด escape \`\\\\\${...}\` |
| \`my-app/app/api/esp32/display/route.ts\` | \`await\` consume คำสั่งเปิดประตู และเพิ่มสับเปลี่ยน Slim Polling Mode เมื่อส่ง query parameter \`slim=true\` |
| \`my-app/app/api/esp32/time/route.ts\` | **ไฟล์ใหม่** — บริการซิงค์เวลาผ่าน Edge API สำหรับบอร์ด IoT ที่โดนบล็อกพอร์ต UDP 123 |
| \`my-app/app/page.tsx\` | bypass session → \`localStorage\` |
| \`my-app/lib/db.ts\` | คอลัมน์ \`severity\` + \`user_agent\` + backfill + index |
| \`my-app/lib/access-log.ts\` | **ไฟล์ใหม่** — helper บันทึก log รวมศูนย์ |
| \`my-app/lib/discord.ts\` | event \`security_alert\`, \`system_summary\`, device ใน embed |
| \`my-app/app/api/system/summary/route.ts\` | **ไฟล์ใหม่** — รายงานสรุปรายวัน/สัปดาห์ |
| \`my-app/vercel.json\` | **ไฟล์ใหม่** — Vercel Cron |
| routes: \`approve\`, \`door\`, \`reject\`, \`bypass\`, \`auth/login\` | ใช้ \`logEvent\` เก็บ IP/อุปกรณ์/severity |

<p align="right"><a href="#toc">กลับไปที่หัวข้อสำหรับนำไปจัดทำเล่มโครงงาน</a></p>

`;
    
    content = content.replace(originalBlock, replacement);
    fs.writeFileSync(manualPath, content, 'utf8');
    console.log("SUCCESSFULLY UPDATED MANUAL VIA SCRATCH SCRIPT!");
  } else {
    console.error("Next section header not found!");
  }
} else {
  console.error("Summary table header not found!");
}
