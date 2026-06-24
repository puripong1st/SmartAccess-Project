#!/bin/bash
# start_ngrok.sh — สคริปต์เชื่อมต่อ Ngrok Tunnel ไปยังโดเมนฟรีคงที่
# วิธีใช้งาน: chmod +x start_ngrok.sh && ./start_ngrok.sh

echo "============================================="
echo " Starting Ngrok HTTPS Tunnel"
echo " Target URL: https://homotaxic-rayford-supersecure.ngrok-free.dev"
echo "============================================="

# เรียกเปิดท่ออุโมงค์ Ngrok ดึงข้อมูลจากพอร์ต 3000 ออกภายนอก
ngrok http 3000 --url https://homotaxic-rayford-supersecure.ngrok-free.dev
