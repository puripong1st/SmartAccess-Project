const fs = require('fs');
const path = require('path');

const manualPath = path.join(__dirname, '..', 'complete_system_manual_th.md');
let content = fs.readFileSync(manualPath, 'utf8');

console.log("Original manual length:", content.length);

// 1. Update the 'อัปเดตล่าสุด' date and time metadata at the top of the file
const currentBkkTime = '2026-06-01 12:51:08 (+07:00)';
content = content.replace(
  /อัปเดตล่าสุด: \d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2} \(\+07:00\)/,
  `อัปเดตล่าสุด: ${currentBkkTime}`
);

// 2. Fix the corrupted Chapter 71.45 section
// The corrupted block starts around line 8694 (### ช่องทางและรูปแบบ...) and goes up to </p> before the text "** เปลี่ยนชื่อจาก"
const corruptStartStr = "### ช่องทางและรูปแบบ";
const corruptEndStr = "</p>** เปลี่ยนชื่อจาก";

const startIdx = content.indexOf(corruptStartStr);
const endIdx = content.indexOf(corruptEndStr);

if (startIdx !== -1 && endIdx !== -1 && startIdx < endIdx) {
  console.log("Found corrupted block at index:", startIdx, "to", endIdx);
  const targetReplace = content.substring(startIdx, endIdx + corruptEndStr.length);
  
  // We want to replace it with:
  // "### ช่องทางและรูปแบบการตั้งค่าหน้า UI\n- **"
  const cleanReplacement = "### ช่องทางและรูปแบบการตั้งค่าหน้า UI\n\n- **";
  content = content.replace(targetReplace, cleanReplacement);
  console.log("Successfully cleaned up the corrupted section in Chapter 71.45!");
} else {
  console.error("Could not find the corrupted block in Chapter 71.45!");
}

// 3. Append sections 73.39.7 and 73.39.8 to the end of Section 73.39
// Let's locate the ending sections of the file.
// We want to find: "#### 73.39.6 การประยุกต์ใช้ระบบจัดระเบียบตารางแบบตอบสนองบนมือถือสำหรับการจัดการผู้ดูแลระบบ (Responsive Mobile Card Layout Adaptation ใน `admins/page.tsx`)"
// And find its content, then append 73.39.7 and 73.39.8.
// Finally, replace the file modifications summary table.

const searchTargetHeader = "#### 73.39.6 การประยุกต์ใช้ระบบจัดระเบียบตารางแบบตอบสนองบนมือถือสำหรับการจัดการผู้ดูแลระบบ (Responsive Mobile Card Layout Adaptation ใน `admins/page.tsx`)";
const tableHeader = "### สรุปรายการไฟล์แก้ไขในสเต็ปนี้";

const headerIdx = content.lastIndexOf(searchTargetHeader);
const tableIdx = content.lastIndexOf(tableHeader);

if (headerIdx !== -1 && tableIdx !== -1 && headerIdx < tableIdx) {
  console.log("Found Section 73.39.6 at index:", headerIdx, "and summary table at index:", tableIdx);
  
  // Let's extract the block of 73.39.6 up to the table
  const block6 = content.substring(headerIdx, tableIdx);
  
  // We will build the new block that includes 73.39.6, 73.39.7, 73.39.8 and the updated summary table
  const newBlock = `#### 73.39.6 การประยุกต์ใช้ระบบจัดระเบียบตารางแบบตอบสนองบนมือถือสำหรับการจัดการผู้ดูแลระบบ (Responsive Mobile Card Layout Adaptation ใน \`admins/page.tsx\`)
- **ปัญหาเดิม:** ตารางทำเนียบผู้ดูแลระบบและเจ้าหน้าที่ดำเนินงาน (\`admins/page.tsx\`) มีขอบเขตความกว้างค่อนข้างมาก เมื่อแสดงผลบนหน้าจอโทรศัพท์ (ทรศ) ตัวตารางจะถูกบีบอัดสัดส่วนจนคอลัมน์ชื่อเต็มสิทธิ์ระบบและขอบเขตห้องซ้อนทับกันอย่างหนาแน่นและขอบตารางขาดลอยหายไป
- **การแก้ไข:**
  - ทำการจัดแบ่งวิวโดยการคลุมโครงสร้างตารางข้อมูลในคลาส \`.desktop-view\` (ซ่อนตัวอัตโนมัติบนขนาดหน้าจอ <= 1024px)
  - เพิ่มคอมโพเนนต์การ์ดแสดงผลบนมือถือที่สวยงามตอบรับรูปแบบ PWA Touch-First ภายใต้บล็อก \`.mobile-view\` (แสดงผลเมื่อหน้าจอ <= 1024px) ซึ่งจะจัดเรียงข้อมูลผู้ดูแลระบบ ขอบเขตรับผิดชอบ และสิทธิ์ควบคุมอย่างเป็นสัดส่วน มีระเบียบคอลัมน์ลอยตัวแบบ Premium Glassmorphism
  - ขยายขอบเขตการทำงานของปุ่ม Action (ถอนสิทธิ์, แก้ไขข้อมูล) ให้ตอบรับการสัมผัส (Touch Target) ขนาด min-height: 44px มอบความมั่นคงและปราศจากข้อผิดพลาดในการแตะใช้งาน

#### 73.39.7 การกู้คืนแถบนำทางแบบแถบสไลด์ในตัวเลือกห้องเรียนบนมือถือ (Premium Horizontal Scrollbar Indicator ใน \`globals.css\`)
- **ปัญหาเดิม:** คอนเทนเนอร์แถบเลือกฟิลเตอร์ห้องเรียนบนมือถือ (\`.mobile-filter-container\`) มีการซ่อนแถบเลื่อน (Scrollbar) ทั้งหมดผ่านคำสั่ง \`display: none\` เพื่อความสวยงาม แต่การไม่มีแถบนำร่องส่งผลเสียต่อการรับรู้ของผู้ใช้ (UX Anti-Pattern) โดยผู้ใช้ไม่รู้เลยว่ามีรายการห้องเพิ่มเติมทางด้านขวา (เช่น ห้อง CE-402, A-401, A-402) และคิดว่าระบบเกิดความผิดพลาดในการดึงข้อมูลไม่ครบ
- **การแก้ไข:**
  - ยกเลิกการซ่อนแถบเลื่อนถาวร โดยเปลี่ยนมาสร้างสไตล์แถบเลื่อนแบบเรืองแสงสีม่วงโกลว์ขนาดบางเฉียบพิเศษ 4px (\`height: 4px\`) พร้อมระบุรัศมีความโค้งมนพรีเมียมและความโปร่งแสงบางเบา (\`rgba(124, 58, 237, 0.18)\`)
  - ทำให้บนหน้าจอมือถือปรากฏเส้นนำทางสีม่วงจางระดับพรีเมียม บ่งชี้สถานะการเลื่อนอย่างชัดเจน เป็นธรรมชาติ และส่งเสริมความน่าใช้งานทันทีตามหลักความเข้ากันได้สากล

#### 73.39.8 การแก้ไขตัวแยกแยะอุปกรณ์ iOS เพื่อป้องกันข้อผิดพลาดบนคอมพิวเตอร์ macOS เดสก์ท็อป (Robust iOS Device Detection Bug Fix ใน \`PushNotificationManager.tsx\`)
- **ปัญหาเดิม:** คำสั่งสำหรับตรวจจับประเภทระบบปฏิบัติการ iOS เพื่อทริกเกอร์แบนเนอร์ข้อความติดตั้งแอป ("เปิดแจ้งเตือนบน iPhone") มีตรรกะตรวจเช็คความเข้ากันได้ของ iPadOS โดยเทียบ \`navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1\` ส่งผลให้ผู้ใช้ที่เข้าใช้งานระบบด้วยคอมพิวเตอร์แล็ปท็อป macOS เดสก์ท็อป (MacBook) ที่มี Trackpad รองรับนิ้วมือแบบ Multi-Touch โดนตรวจจับเป็นอุปกรณ์ iOS และแสดงแบนเนอร์สีดำแนะนำการติดตั้งบน iPhone ลอยขึ้นมารบกวนอย่างผิดพลาด
- **การแก้ไข:**
  - ปรับปรุงการตรวจสอบเพิ่มเติมโดยเพิ่มการเช็ค \`'ontouchend' in document\` ซึ่งเป็นฟังก์ชันตรวจจับหน้าจอสัมผัส (Touch Screen) แท้จริงที่มีเฉพาะบนอุปกรณ์ iOS/iPadOS เท่านั้น
  - ทำให้คอมพิวเตอร์ macOS เดสก์ท็อป ทั่วไปข้ามตรรกะนี้อย่างถูกต้อง ปราศจากแบนเนอร์แสดงความสับสน และแสดงปุ่มใน Sidebar Layout อย่างสมบูรณ์แบบ

---

### สรุปรายการไฟล์แก้ไขในสเต็ปนี้

| ลำดับ | ชื่อไฟล์ | ประเภท | คำอธิบายการแก้ไข |
|---|---|---|---|
| 1 | \`my-app/app/admin/dashboard/all/page.tsx\` | **[MODIFY]** | อิมพลิเมนต์การแบ่งวิวด้วย \`.desktop-view\` และพัฒนาระบบกริดการ์ดแสดงผลบนมือถือ \`.mobile-view\` สำหรับทั้งทำเนียบและตาราง Audit Logs |
| 2 | \`my-app/app/admin/dashboard/rooms/page.tsx\` | **[MODIFY]** | ทำการรีแฟกเตอร์ Layout สู่รูปแบบ Grid 2 คอลัมน์ และติดตั้งมาตรฐาน ARIA (\`role="switch"\`, \`aria-checked\`, \`aria-pressed\`) ให้กับสวิตช์และปุ่มวัน |
| 3 | \`my-app/app/admin/dashboard/layout.tsx\` | **[MODIFY]** | นำคอมโพเนนต์ PushNotificationManager เข้ามาติดตั้งแบบ Inline ไว้ในเมนูด้านล่างของ Sidebar เพื่อความสะอาดตา |
| 4 | \`my-app/app/components/PushNotificationManager.tsx\` | **[MODIFY]** | เพิ่มการรองรับพร็อพ \`inline\` และแก้ไขตรรกะการตรวจจับระบบปฏิบัติการ iOS ให้ถูกต้องแม่นยำ ปราศจากข้อผิดพลาดบนคอมพิวเตอร์เดสก์ท็อป |
| 5 | \`my-app/app/globals.css\` | **[MODIFY]** | เพิ่มการกำหนดสไตล์ของปุ่ม Actions ในตาราง พร้อมกู้คืนการแสดงผลแถบเลื่อนแบบเรืองแสงสีม่วงบางเฉียบ 4px |
| 6 | \`my-app/app/admin/dashboard/admins/page.tsx\` | **[MODIFY]** | อิมพลิเมนต์การแบ่งวิวด้วย \`.desktop-view\` และพัฒนาระบบกริดการ์ดแสดงผลบนมือถือ \`.mobile-view\` สำหรับตารางแอดมิน |
| 7 | \`complete_system_manual_th.md\` | **[MODIFY]** | บันทึกรายละเอียดแผนการแก้ไขทางสถาปัตยกรรมและรายละเอียด UI/UX สำหรับเล่มวิทยานิพนธ์ §73.39 |

<p align="right"><a href="#toc">กลับไปที่หัวข้อสำหรับนำไปจัดทำเล่มโครงงาน</a></p>

`;

  // We replace the block from searchTargetHeader to the end of the file
  const restOfFile = content.substring(headerIdx);
  
  // Let's replace the whole rest of file (since it ends with the summary table and return to TOC)
  content = content.substring(0, headerIdx) + newBlock;
  console.log("Successfully updated Section 73.39 and the final file modification summary table!");
} else {
  console.error("Could not find the Section 73.39.6 or table header at the end of the file!");
}

fs.writeFileSync(manualPath, content, 'utf8');
console.log("Manual update finished successfully. New length:", content.length);
