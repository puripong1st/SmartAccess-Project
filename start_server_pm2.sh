#!/bin/bash
# start_server_pm2.sh — สคริปต์รันบิวด์และเปิดระบบผ่าน PM2 (แนะนำสำหรับการใช้งานจริง)
# วิธีใช้งาน: chmod +x start_server_pm2.sh && ./start_server_pm2.sh

echo "============================================="
echo " 1. Removing Old Next.js Build (.next)"
echo "============================================="
rm -rf ~/smartaccess/my-app/.next

echo "============================================="
echo " 2. Navigating to project folder"
echo "============================================="
cd ~/smartaccess/my-app

echo "============================================="
echo " 3. Compiling & Building Next.js application"
echo "============================================="
npm run build

echo "============================================="
echo " 4. Launching/Restarting Server via PM2"
echo "============================================="
# ลบงานเดิมใน PM2 ออกก่อน (ถ้ามี) แล้วเริ่มต้นรันระบบแบบอัตโนมัติ
pm2 delete smartaccess || true
pm2 start npm --name "smartaccess" -- run start

echo "============================================="
echo " SUCCESS: Server is managed by PM2!"
echo " Monitor status: pm2 status"
echo " View real-time logs: pm2 logs smartaccess"
echo "============================================="
