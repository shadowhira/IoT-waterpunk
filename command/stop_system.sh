#!/bin/bash

# Hiển thị banner
echo "====================================="
echo "    IoT Water System - Dừng Hệ thống "
echo "====================================="

# Tìm và dừng tiến trình Mosquitto
echo "Đang tìm và dừng Mosquitto..."
MOSQUITTO_PIDS=$(pgrep mosquitto)
if [ -n "$MOSQUITTO_PIDS" ]; then
    echo "Đã tìm thấy Mosquitto với PID: $MOSQUITTO_PIDS"
    kill $MOSQUITTO_PIDS
    echo "✅ Đã dừng Mosquitto"
else
    echo "⚠️ Không tìm thấy tiến trình Mosquitto đang chạy"
fi

# Tìm và dừng tiến trình Node.js (Backend và Simulator)
echo "Đang tìm và dừng các tiến trình Node.js..."
NODE_PIDS=$(pgrep -f "node.*server.js\|node.*simulator.js")
if [ -n "$NODE_PIDS" ]; then
    echo "Đã tìm thấy các tiến trình Node.js với PID: $NODE_PIDS"
    kill $NODE_PIDS
    echo "✅ Đã dừng các tiến trình Node.js"
else
    echo "⚠️ Không tìm thấy tiến trình Node.js đang chạy"
fi

echo "====================================="
echo "    Tất cả tiến trình đã dừng        "
echo "====================================="
