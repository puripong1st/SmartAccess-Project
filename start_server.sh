#!/bin/bash
# start_server.sh — สคริปต์ล้างพอร์ต บิวด์ และรันระบบหลังบ้าน SmartAccess
# วิธีใช้งาน: chmod +x start_server.sh && ./start_server.sh

echo "============================================="
echo " 1. Clearing Port 3000"
echo "============================================="
# เคลียร์พอร์ต 3000 ก่อน เพื่อป้องกันอาการ EADDRINUSE (พอร์ตชนกัน)
sudo fuser -k 3000/tcp || true
sleep 1

echo "============================================="
echo " 2. Removing Old Next.js Build (.next)"
echo "============================================="
rm -rf ~/smartaccess/my-app/.next

echo "============================================="
echo " 3. Navigating to project folder"
echo "============================================="
cd ~/smartaccess/my-app

echo "============================================="
echo " 4. Compiling & Building Next.js application"
echo "============================================="
npm run build

echo "============================================="
echo " 5. Launching Server in Background"
echo "============================================="
# ใช้ nohup รันแทน & ปกติ เพื่อป้องกันไม่ให้โปรเซสปิดตัวลงเมื่อปิดหน้าต่าง Terminal 
# และทำการโยนประวัติ Log ไปเก็บไว้ที่ไฟล์ next.log ในเครื่อง
nohup npm run start > next.log 2>&1 &

echo "============================================="
echo " SUCCESS: Server is running on port 3000!"
echo " Monitor logs with: tail -f ~/smartaccess/my-app/next.log"
echo "============================================="
