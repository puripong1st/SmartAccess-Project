---
name: SmartAccess Design System
description: iOS Control Center-inspired premium design system with University Purple and Faculty of Education Pink
colors:
  primary: "#7C3AED"
  primary-dark: "#5B21B6"
  primary-light: "#A78BFA"
  primary-pale: "#F5F3FF"
  accent: "#DB2777"
  accent-light: "#F472B6"
  accent-pale: "#FDF2F8"
  bg-primary: "#FAF9FF"
  bg-secondary: "#FFFFFF"
  bg-sidebar: "#FFFFFF"
  bg-accent: "#EEF2F6"
  text-primary: "#1E1B4B"
  text-secondary: "#6B7280"
  text-muted: "#9CA3AF"
  border: "rgba(124, 58, 237, 0.08)"
  border-medium: "rgba(124, 58, 237, 0.16)"
typography:
  display:
    fontFamily: "var(--font-noto-thai), var(--font-inter), 'Noto Sans Thai', 'Inter', sans-serif"
    fontSize: "clamp(1.75rem, 4vw, 2.5rem)"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "-0.02em"
  headline:
    fontFamily: "var(--font-noto-thai), var(--font-inter), 'Noto Sans Thai', 'Inter', sans-serif"
    fontSize: "1.5rem"
    fontWeight: 700
    lineHeight: 1.3
  title:
    fontFamily: "var(--font-noto-thai), var(--font-inter), 'Noto Sans Thai', 'Inter', sans-serif"
    fontSize: "1.125rem"
    fontWeight: 600
    lineHeight: 1.4
  body:
    fontFamily: "var(--font-noto-thai), var(--font-inter), 'Noto Sans Thai', 'Inter', sans-serif"
    fontSize: "0.875rem"
    fontWeight: 500
    lineHeight: 1.6
  label:
    fontFamily: "var(--font-noto-thai), var(--font-inter), 'Noto Sans Thai', 'Inter', sans-serif"
    fontSize: "0.6875rem"
    fontWeight: 600
    letterSpacing: "0.05em"
rounded:
  card: "20px"
  element: "12px"
  badge: "99px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "32px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "#FFFFFF"
    rounded: "{rounded.element}"
    padding: "12px 24px"
    typography: "{typography.body}"
  button-secondary:
    backgroundColor: "{colors.bg-secondary}"
    textColor: "{colors.primary}"
    rounded: "{rounded.element}"
    padding: "12px 24px"
    typography: "{typography.body}"
  input-field:
    backgroundColor: "{colors.bg-primary}"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.element}"
    padding: "12px 16px"
---

# Design System: SmartAccess

## 1. Overview

**Creative North Star: "The iOS Control Center"**

ระบบดีไซน์ของ SmartAccess ได้รับแรงบันดาลใจหลักมาจากความประณีต สะอาดตา และการควบคุมที่ง่ายดายของหน้าจอ iOS Control Center โดยผสานความมั่นคงทางยุทธศาสตร์ความปลอดภัยเข้ากับ UI ยุคใหม่ที่ตอบสนองอย่างรวดเร็วและเป็นมิตรกับผู้ใช้งาน ตัวอินเทอร์เฟซมีความลื่นไหลเป็นธรรมชาติ โดยลดทอนองค์ประกอบเชิงตกแต่งที่ไม่จำเป็นออกทั้งหมด และมุ่งเน้นไปที่การควบคุมที่ฉับไวรวมศูนย์และการจัดเรียงข้อมูลที่มีสัดส่วนสวยงาม (Structured Information)

การออกแบบนี้เน้นตอบสนองการปฏิสัมพันธ์แบบสัมผัสและเมาส์ด้วยความรู้สึกแบบ **Tactile & Confident** ทำให้ผู้ดูแลระบบรู้สึกมั่นใจและมีอำนาจในการจัดการสิทธิ์ ส่วนนักศึกษาก็สามารถเข้าถึงห้องเรียนได้อย่างสะดวกและลื่นไหลที่สุด

**Key Characteristics:**
- **Tactile Responses:** ปุ่มและองค์ประกอบโต้ตอบมีการเคลื่อนไหวตอบสนองเชิงฟิสิกส์เบา ๆ ดึงดูดการกด
- **Card-Centric Structure:** นำเสนอข้อมูลที่ซับซ้อนด้วยเลย์เอาต์การ์ดที่มีมิติ ลอยเด่นสวยงาม
- **Balanced Proportions:** ใช้น้ำหนักฟอนต์และช่องว่างขนาดใหญ่ (Generous Spacing) เพื่อสร้างการนำสายตาที่โปร่งสบาย
- **Vibrant Status Indicators:** ใช้ไฟแสดงสถานะเรืองแสงแบบสีนีออนคมชัดสูงเพื่อความแม่นยำทางความปลอดภัย

---

## 2. Colors

สีหลักของระบบดีไซน์ออกแบบมาเพื่อสร้างความกลมกลืนเชิงสุนทรียศาสตร์ของสถาบัน ผสานสีม่วงมหาวิทยาลัยเข้ากับสีชมพูคณะศึกษาศาสตร์อย่างพรีเมียม

### Primary
- **University Purple** (#7C3AED): สีแกนหลักใช้ในการนำสายตา ปุ่มหลัก และสถานะเริ่มต้นที่แข็งแกร่ง น่าเชื่อถือ
- **Purple Dark** (#5B21B6): ใช้เป็นสีปุ่มขณะถูกกดหรือข้อความหัวข้อในโทนสีอ่อน
- **Purple Light** (#A78BFA): สีม่วงสว่างใช้เป็นไฮไลท์ ขอบรอง และปุ่มนำสายตาระดับรอง

### Secondary
- **Education Pink** (#DB2777): สีรองใช้สำหรับจุดเด่น เหตุการณ์สำคัญ แบรนด์ และไอคอนที่ต้องการความมีชีวิตชีวา
- **Pink Light** (#F472B6): ใช้ในงานเน้นข้อความรองและการไล่เฉดสีร่วมกับสีม่วง

### Neutral
- **Ultra-light Lilac BG** (#FAF9FF): พื้นหลังหน้าจอหลักที่มีโทนสีม่วงอ่อน ๆ ละมุนตา ไม่ซีดจางเป็นสีเทาเชย ๆ
- **Card Secondary BG** (#FFFFFF): สีขาวบริสุทธิ์ใช้สำหรับการ์ดและพื้นที่แสดงข้อมูลยกระดับ
- **Deep Navy Text** (#1E1B4B): สีตัวอักษรหลักโทนน้ำเงิน-ม่วงเข้ม มีคอนทราสต์สมบูรณ์แบบและหรูหรากว่าสีดำสนิท
- **Slate Gray Text** (#6B7280): สีตัวอักษรรองและคำอธิบาย ช่วยแยกแยะข้อมูลให้สะอาดตา
- **Border Violet** (rgba(124, 58, 237, 0.08)): เส้นกรอบละเอียดอ่อนที่มีโทนสีม่วงจาง เพื่อสร้างขอบเขตที่ไม่ทึบและลายตา

**The 10% Branding Rule.** สีชมพูแบรนด์ (Education Pink) จะถูกใช้ประดับตกแต่งหรือเน้นย้ำในส่วนสำคัญที่มีสัดส่วนไม่เกิน 10% ของหน้าจอ เพื่อคงความเรียบหรู มินิมอล และไม่แย่งสายตากับข้อมูลหลัก

---

## 3. Typography

ใช้การจับคู่ฟอนต์สากลสไตล์โมเดิร์นที่โหลดอย่างมีประสิทธิภาพ เพื่อการแสดงผลทั้งภาษาไทยและอังกฤษที่ประณีต คมชัด อ่านง่ายในทุกขนาดหน้าจอ

**Display Font:** `var(--font-noto-thai)`, `var(--font-inter)`, 'Noto Sans Thai', 'Inter', sans-serif  
**Body Font:** `var(--font-noto-thai)`, `var(--font-inter)`, 'Noto Sans Thai', 'Inter', sans-serif

### Hierarchy
- **Display** (Bold, 1.75rem - 2.5rem, 1.2): ใช้สำหรับหัวข้อหลักหรือตัวเลขสถิติขนาดใหญ่พิเศษ (เช่น หน้าต้อนรับแดชบอร์ด)
- **Headline** (Bold, 1.5rem, 1.3): ใช้สำหรับหัวข้อหน้า หัวข้อเซกชันสำคัญ
- **Title** (Semi-Bold, 1.125rem, 1.4): ใช้เป็นหัวข้อของการ์ดข้อมูล และหัวข้อตารางย่อย
- **Body** (Medium, 0.875rem, 1.6): ตัวอักษรปกติสำหรับข้อมูล รายละเอียด และข้อความอธิบายจำกัดความยาวสูงสุด ~65-75ch
- **Label** (Semi-Bold, 0.6875rem, 0.05em, Uppercase): ป้ายขนาดเล็ก รหัสห้อง และสถานะบน Badge

**The Text-Wrap Balance Rule.** หัวข้อข่าวสารและหัวข้อการ์ดทั้งหมดต้องใช้ `text-wrap: balance` เพื่อป้องกันความยาวบรรทัดเหลื่อมล้ำและเพิ่มความพรีเมียมในการจัดวางตัวอักษร

---

## 4. Elevation

SmartAccess ใช้ระบบความลึกแบบ **เงาลอยมีมิติชัดเจนสไตล์ iOS** เป็นแกนหลักในการยกระดับองค์ประกอบข้อมูล โดยใช้เงาสะท้อนโทนสีม่วงจาง ๆ ทำให้หน้าต่างแดชบอร์ดและองค์ประกอบต่าง ๆ ลอยตัวขึ้นจากพื้นหลัง Lilac BG อย่างมีชั้นเชิงและนุ่มนวล

### Shadow Vocabulary
- **Shadow SM** (`0 2px 8px -1px rgba(124, 58, 237, 0.04)`): ใช้สำหรับการควบคุมย่อยและสถานะจม
- **Shadow MD** (`0 10px 25px -5px rgba(124, 58, 237, 0.06), 0 8px 16px -6px rgba(124, 58, 237, 0.04)`): เงาการ์ดมาตรฐานลอยตัวปานกลาง
- **Shadow LG** (`0 20px 40px -10px rgba(124, 58, 237, 0.1), 0 10px 20px -8px rgba(124, 58, 237, 0.05)`): เงานำสายตาขนาดใหญ่พิเศษเมื่อเลื่อนเมาส์หรือเปิดกล่องหน้าต่าง Modal

**The Responsive Depth Rule.** ในโหมดมืด (Dark Theme) ค่าเงามินิมอลสีม่วงจะถูกปรับเปลี่ยนเป็นเงาสีดำสนิทที่มีความเข้มขึ้น (`rgba(0, 0, 0, 0.6)`) เพื่อรักษามิติความลึกในพื้นที่ที่แสงน้อย

---

## 5. Components

ทุกคอมโพเนนต์ได้รับการออกแบบให้มีความสัมพันธ์กันภายใต้กรอบแนวคิดความโค้งมนระดับพรีเมียมและการตอบสนองแบบลื่นไหล

### Buttons
- **Shape:** มนสปอร์ต (12px radius)
- **Primary:** ปุ่มกดไล่ระดับเฉดสีม่วงถึงชมพูพรีเมียม ตัวอักษรสีขาวเงางาม แผ่กระจายแสงสะท้อนเบา ๆ (`box-shadow: 0 4px 15px -3px rgba(124, 58, 237, 0.3)`)
- **Interactions:** เมื่อเลื่อนเมาส์ผ่าน (Hover) จะขยับลอยขึ้นเบา ๆ (`transform: translateY(-2px) scale(1.02)`) และหดตัวลงอย่างนุ่มนวลเมื่อกดสั่งการ (`transform: translateY(0) scale(0.97)`)

### Cards / Containers
- **Corner Style:** มุมมนพรีเมียม (20px radius)
- **Design Signature:** ขอบด้านบนประดับด้วยเส้น Gradient ม่วงชมพูบางเฉียบ (4px) เพื่อบ่งบอกเอกลักษณ์ระบบ
- **Interaction:** เคลื่อนไหวลื่นไหลด้วย Transition 0.3s แบบลูกบาศก์เบซิเยร์ (`cubic-bezier(0.34, 1.56, 0.64, 1)`) ขยับลอยตัวเมื่อผู้ใช้มีปฏิสัมพันธ์

### Inputs / Fields
- **Style:** ขอบเขตชัดเจน (12px radius) พื้นหลังสี Lilac BG อ่อน ๆ สบายตา คมชัดระดับตัวอักษร 16px ป้องกันการซูมหน้าจออัตโนมัติบนมือถือ iOS
- **Focus State:** กรอบเปล่งแสงสีม่วง (`border-color: #7C3AED`) ซ้อนทับด้วย Glow สีม่วงสปอร์ต (`box-shadow: 0 0 0 4px rgba(124, 58, 237, 0.12)`)

### Navigation
- **Style:** แถบข้างสีขาวบริสุทธิ์ความกว้างคงที่ (260px) เมื่ออยู่บนมือถือจะยุบเก็บเป็นลิ้นชักด้านซ้าย (Drawer) ซึ่งสัมผัสเปิดปิดได้ลื่นไหลไร้รอยต่อ

---

## 6. Do's and Don'ts

### Do:
- **Do** ใช้ตัวจับคู่ฟอนต์ `Noto Sans Thai` และ `Inter` ร่วมกับ Line-height 1.6 สำหรับตัวหนังสือเนื้อหาหลักเพื่อความคมชัดสูงสุด
- **Do** รักษาขอบสัมผัส (Touch Target) ทุกปุ่มกดบนสมาร์ทโฟนให้มีความสูงอย่างน้อย 44px เพื่อความสะดวกในการทัชของผู้ดูแลระบบ
- **Do** ใช้ปุ่มแชร์และสิทธิ์ PWA บนหน้า Admin Dashboard เท่านั้น เพื่อไม่ให้รบกวนนักศึกษาฝั่งบริการ
- **Do** ใช้ไฟสถานะกะพริบเรืองแสง (`pulse-green` / `pulse-red`) เพื่อแสดงสถานะเรียลไทม์ของฮาร์ดแวร์แทนสัญลักษณ์ทึบเชย ๆ

### Don't:
- **Don't** ใช้ขอบสีเหลี่ยมสีเทาทึบหรือตารางเชยๆ สไตล์เว็บราชการยุคเก่าเป็นเด็ดขาด ให้ใช้ขอบมนความโค้งมน 16px-20px และเบลอพื้นหลังแทน
- **Don't** จัดองค์ประกอบและตารางเบียดเสียดแน่นจนลายตา ให้มีระยะห่าง Padding ขั้นต่ำ 16px เสมอในทุกการ์ดบนสมาร์ทโฟน
- **Don't** ออกแบบปุ่มหรือขอบโค้งการ์ดที่โค้งงอมากเกินไป (ห้ามใช้ค่า `border-radius` เกิน 20px สำหรับการ์ดทั่วไป เพราะจะทำให้อินเทอร์เฟซดูล้นและไร้โครงสร้างที่น่าเชื่อถือ)
- **Don't** ใช้สีฉูดฉาดแบบของเล่นเด็กในหน้าต่างแจ้งเตือน ให้รักษาโทนคู่สียุทธศาสตร์ ม่วงชมพู และโทนประสานพาสเทลเสมือนจริงขององค์กร
