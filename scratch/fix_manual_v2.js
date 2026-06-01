const fs = require('fs');
const path = require('path');

const manualPath = path.join(__dirname, '..', 'complete_system_manual_th.md');
let content = fs.readFileSync(manualPath, 'utf8');

// 1. Update timestamp
content = content.replace(
  /อัปเดตล่าสุด: \d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2} \(\+07:00\)/,
  'อัปเดตล่าสุด: 2026-06-01 12:58:00 (+07:00)'
);

// 2. Find the end of the file — the last </p> tag that links back to TOC
const tocAnchor = '<p align="right"><a href="#toc">กลับไปที่หัวข้อสำหรับนำไปจัดทำเล่มโครงงาน</a></p>';
const lastTocIdx = content.lastIndexOf(tocAnchor);

if (lastTocIdx !== -1) {
  const afterTocBlock = content.substring(lastTocIdx + tocAnchor.length);
  const beforeTocBlock = content.substring(0, lastTocIdx + tocAnchor.length);

  const newSection = `

---

## 73.40 การแก้ไขข้อบกพร่อง UI เชิงลึกบนมือถือสำหรับหน้ารอยืนยันสิทธิ์และสถานะว่างเปล่า (Mobile-First Bug Fixes: Pending Page Filter Scroll, EmptyState Responsive, iOS Banner Overlay Removal)

**วันที่ดำเนินการ:** 1 มิถุนายน 2569 (12:58 น. ICT)

ตรวจพบและดำเนินการแก้ไขข้อบกพร่อง 3 จุดบนหน้ารอยืนยันสิทธิ์ (\`pending/page.tsx\`) ที่ส่งผลกระทบต่อประสบการณ์ผู้ใช้บนโทรศัพท์มือถือโดยเฉพาะ iPhone:

#### 73.40.1 การแก้ไขแถบเลือกห้องเรียนที่ไม่สามารถเลื่อนได้บนมือถือ (Mobile Room Filter Horizontal Scroll Fix ใน \`pending/page.tsx\` และ \`globals.css\`)
- **ปัญหาเดิม:** แถบเลือกห้องเรียน (Room Filter Tabs) ที่ใช้คลาส \`.mobile-filter-container\` ถูกบรรจุอยู่ภายในคอนเทนเนอร์ระดับพ่อ (Parent Div) ที่กำหนด \`display: "flex"\` ร่วมกับ \`flexWrap: "wrap"\` และ \`justifyContent: "space-between"\` ส่งผลให้บนหน้าจอมือถือ คอนเทนเนอร์ระดับพ่อไม่อนุญาตให้ \`.mobile-filter-container\` ขยายเต็มความกว้างหน้าจอ ปุ่มห้องเรียนทางด้านขวาถูกตัดหายไป (เช่น ห้อง A-401, A-402) และไม่สามารถเลื่อนนิ้วปัดไปทางขวาเพื่อดูห้องเพิ่มเติมได้เลย
- **สาเหตุหลัก:**
  1. คอนเทนเนอร์ระดับพ่อใช้ \`flexWrap: "wrap"\` ทำให้ตัว Filter Container ไม่ได้รับความกว้าง 100% ของหน้าจอ เพราะปุ่มเสียงเตือน (Audio Toggle) ครอบครองพื้นที่ข้างเคียงไปส่วนหนึ่ง
  2. ปุ่มตัวกรองห้องเรียนไม่ได้ตั้ง \`flex-shrink: 0\` จึงถูกบีบขนาดลดลงจนข้อความถูกย่อหรือถูกซ่อน
  3. คอนเทนเนอร์ไม่มี \`min-width: 0\` ซึ่งเป็นคุณสมบัติสำคัญที่จำเป็นต้องมีเพื่อให้ Flex child สามารถหดตัวต่ำกว่าขนาดเนื้อหาภายในได้ (CSS Flex Specification §4.5)
- **การแก้ไข:**
  - เปลี่ยนโครงสร้างคอนเทนเนอร์ระดับพ่อจาก \`flexWrap: "wrap"\` เป็น \`flexDirection: "column"\` เพื่อให้แถบเลือกห้องเรียนและปุ่มเสียงเตือนอยู่คนละแถว (Row Stacking) แทนการแย่งพื้นที่แนวนอน
  - เพิ่ม \`min-width: 0\` ลงในคอนเทนเนอร์ \`.mobile-filter-container\` เพื่อให้ Flex child หดตัวได้ตามขนาดจอจริง
  - เพิ่มกฎ CSS \`.mobile-filter-container > button { flex-shrink: 0 !important; }\` เพื่อป้องกันปุ่มห้องเรียนไม่ให้ถูกบีบอัดขนาดจนอ่านไม่ออก
  - เพิ่ม \`touch-action: pan-x\` เพื่อบอกเบราว์เซอร์มือถือให้จัดลำดับความสำคัญของการเลื่อนนิ้วแนวนอนก่อนเสมอ
  - เพิ่ม \`scrollbar-width: thin\` และ \`scrollbar-color\` สำหรับ Firefox ที่ไม่รองรับ \`::-webkit-scrollbar\`

#### 73.40.2 การปรับปรุง EmptyState ให้เข้ากับ Layout บนมือถือ (Responsive EmptyState Adaptation ใน \`EmptyState.tsx\` และ \`globals.css\`)
- **ปัญหาเดิม:** คอมโพเนนต์สถานะว่างเปล่า (\`EmptyState\`) ที่แสดงเมื่อไม่มีคำขอรอดำเนินการ (\`filteredPending.length === 0\`) ใช้ \`padding: "60px 20px"\` และภาพ SVG Illustration ขนาด 120×120px ซึ่งเป็นขนาดสำหรับเดสก์ท็อป เมื่อแสดงผลบนมือถือจึงสิ้นเปลืองพื้นที่หน้าจอมาก ทำให้ต้องเลื่อนจอหลายครั้งกว่าจะเห็นเนื้อหาด้านล่าง และ UI ดูโปร่งกว้างเกินไปไม่เข้ากับ Layout โมบายที่กระชับ
- **การแก้ไข:**
  - เพิ่มคลาส \`.empty-state-container\` และ \`.empty-state-illustration\` ให้กับคอมโพเนนต์ EmptyState เพื่อรองรับการ Override ด้วย CSS Media Query
  - เพิ่ม \`@media (max-width: 768px)\` ใน \`globals.css\` เพื่อลด padding จาก 60px เหลือ 32px, ลดขนาด SVG Illustration จาก 120×120px เหลือ 80×80px, ลด margin-bottom ของ illustration จาก 20px เหลือ 12px, และลด border-radius จาก 20px เหลือ 16px
  - ผลลัพธ์: EmptyState บนมือถือจะแสดงผลกระชับ มีสัดส่วนเหมาะสม และเข้ากับ Layout แบบมือถืออย่างเป็นธรรมชาติ

#### 73.40.3 การยกเลิกแบนเนอร์ลอย iOS และเปลี่ยนเป็นการแสดงผลแบบฝังตัว (iOS Install Banner: Fixed Overlay → Inline Sidebar ใน \`PushNotificationManager.tsx\`)
- **ปัญหาเดิม:** บน iPhone/iPad ที่ยังไม่ได้เพิ่มเว็บลงหน้าจอโฮม (ยังเปิดผ่าน Safari ไม่อยู่ในโหมด Standalone) ระบบจะแสดงแบนเนอร์สีดำทึบแบบ \`position: fixed\` ลอยอยู่ด้านล่างหน้าจอ (\`bottom: 20px\`) ขนาดใหญ่พร้อม backdrop-filter blur หนา คร่อมเนื้อหาหน้าเว็บด้านล่าง ทำให้ผู้ใช้ไม่สามารถมองเห็นหรือกดปุ่มที่อยู่ใต้แบนเนอร์ได้ และแบนเนอร์ไม่มีปุ่มปิด
- **การแก้ไข:**
  - **ลบแบนเนอร์ลอยทั้งหมด** (\`position: fixed\`) ออกจากการเรนเดอร์บนหน้าจอหลัก
  - เมื่อคอมโพเนนต์ PushNotificationManager ถูกเรียกในโหมด \`inline\` (ฝังตัวในแถบเมนูด้านข้าง Sidebar) บน iOS จะแสดงเป็นกล่องข้อความเล็กๆ สีม่วงอ่อนกลมกลืนกับธีมแถบเมนู พร้อมข้อความแนะนำสั้นๆ ว่า "เพิ่มเว็บลงหน้าจอโฮมก่อน → เปิดแอปจากไอคอน"
  - เมื่ออยู่ในโหมดไม่ใช่ \`inline\` (เช่น ถูกเรียกจากหน้าเว็บโดยตรง) จะคืนค่า \`null\` ไม่แสดงอะไรเลย เพราะตัว inline ใน Sidebar จัดการเรื่องนี้แล้ว
  - ผลลัพธ์: หน้าจอมือถือปราศจากองค์ประกอบลอยรบกวน ข้อแนะนำ iOS ถูกจัดสรรไว้ในตำแหน่งที่สมเหตุสมผลภายในเมนูด้านข้าง

---

### สรุปรายการไฟล์แก้ไขในสเต็ปนี้

| ลำดับ | ชื่อไฟล์ | ประเภท | คำอธิบายการแก้ไข |
|---|---|---|---|
| 1 | \`my-app/app/admin/dashboard/pending/page.tsx\` | **[MODIFY]** | เปลี่ยนโครงสร้างคอนเทนเนอร์แถบเลือกห้องเรียนจาก flexWrap เป็น column layout เพื่อให้ mobile-filter-container สามารถเลื่อนแนวนอนได้ |
| 2 | \`my-app/app/globals.css\` | **[MODIFY]** | เพิ่ม flex-shrink:0 ให้ปุ่มตัวกรอง, เพิ่ม min-width:0 ให้ filter container, เพิ่ม touch-action:pan-x, เพิ่ม Firefox scrollbar support, เพิ่ม EmptyState responsive styles |
| 3 | \`my-app/app/components/EmptyState.tsx\` | **[MODIFY]** | เพิ่ม className สำหรับ .empty-state-container และ .empty-state-illustration เพื่อรองรับ CSS media query override บนมือถือ |
| 4 | \`my-app/app/components/PushNotificationManager.tsx\` | **[MODIFY]** | ลบแบนเนอร์ iOS แบบ fixed overlay ด้านล่างจอ เปลี่ยนเป็น inline compact banner เฉพาะในโหมด sidebar |
| 5 | \`complete_system_manual_th.md\` | **[MODIFY]** | บันทึกรายละเอียดการแก้ไขข้อบกพร่อง UI บนมือถือ §73.40 |

<p align="right"><a href="#toc">กลับไปที่หัวข้อสำหรับนำไปจัดทำเล่มโครงงาน</a></p>
`;
  
  content = beforeTocBlock + newSection;
  fs.writeFileSync(manualPath, content, 'utf8');
  console.log("Manual updated successfully! New length:", content.length);
} else {
  console.error("Could not find the last TOC anchor in the manual!");
}
