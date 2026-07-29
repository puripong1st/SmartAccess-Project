#!/bin/bash
# start_ngrok.sh — สคริปต์เชื่อมต่อ Ngrok Tunnel ไปยังโดเมนฟรีคงที่
# วิธีใช้งาน: chmod +x start_ngrok.sh && ./start_ngrok.sh

echo "============================================="
echo " Starting Ngrok HTTPS Tunnel"
echo " Target URL: https://homotaxic-rayford-supersecure.ngrok-free.dev"
echo "============================================="

# เรียกเปิดท่ออุโมงค์ Ngrok ดึงข้อมูลจากพอร์ต 3000 ออกภายนอก พร้อมแปลง Host Header เพื่อไม่ให้ Next.js บล็อก
ngrok http 127.0.0.1:3000 --url=homotaxic-rayford-supersecure.ngrok-free.dev --host-header=rewrite
