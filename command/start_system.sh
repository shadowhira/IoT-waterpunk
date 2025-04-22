#!/bin/bash

# Hiển thị banner
echo "====================================="
echo "    IoT Water System - Khởi động     "
echo "====================================="

# Tạo thư mục log và data nếu chưa tồn tại
mkdir -p log data

# Kiểm tra xem Mosquitto đã được cài đặt chưa
if ! command -v mosquitto &> /dev/null; then
    echo "❌ Mosquitto chưa được cài đặt. Vui lòng cài đặt theo hướng dẫn trong HUONG_DAN.md"
    exit 1
fi

# Kiểm tra xem Mosquitto đã chạy chưa
if pgrep mosquitto > /dev/null; then
    echo "⚠️ Mosquitto đã đang chạy. Có thể cần dừng phiên hiện tại trước khi tiếp tục."
    echo "Bạn có muốn tiếp tục không? (y/n)"
    read -r continue_choice
    if [ "$continue_choice" != "y" ]; then
        echo "Đã hủy khởi động."
        exit 0
    fi
fi

# Khởi động Mosquitto với file cấu hình
echo "🚀 Đang khởi động Mosquitto MQTT Broker..."
mosquitto -c mosquitto.conf &
MOSQUITTO_PID=$!
echo "✅ Mosquitto đang chạy với PID: $MOSQUITTO_PID"

# Đợi Mosquitto khởi động
sleep 2

# Kiểm tra xem Mosquitto đã khởi động thành công chưa
if ! pgrep -P $MOSQUITTO_PID > /dev/null; then
    echo "❌ Không thể khởi động Mosquitto. Kiểm tra lại file cấu hình và quyền truy cập."
    exit 1
fi

# Hiển thị menu
echo ""
echo "====================================="
echo "    Menu Khởi động Hệ thống    "
echo "====================================="
echo "1. Khởi động Backend"
echo "2. Khởi động Simulator"
echo "3. Khởi động cả hai"
echo "4. Thoát"
echo "====================================="
echo "Nhập lựa chọn của bạn (1-4): "
read -r choice

case $choice in
    1)
        # Khởi động Backend
        echo "🚀 Đang khởi động Backend..."
        cd ../backend
        node server.js &
        BACKEND_PID=$!
        cd "$OLDPWD"
        echo "✅ Backend đang chạy với PID: $BACKEND_PID"
        ;;
    2)
        # Khởi động Simulator
        echo "🚀 Đang khởi động Simulator..."
        cd ../simulator
        node simulator.js &
        SIMULATOR_PID=$!
        cd "$OLDPWD"
        echo "✅ Simulator đang chạy với PID: $SIMULATOR_PID"
        ;;
    3)
        # Khởi động cả hai
        echo "🚀 Đang khởi động Backend..."
        cd ../backend
        node server.js &
        BACKEND_PID=$!
        cd "$OLDPWD"
        echo "✅ Backend đang chạy với PID: $BACKEND_PID"

        echo "🚀 Đang khởi động Simulator..."
        cd ../simulator
        node simulator.js &
        SIMULATOR_PID=$!
        cd "$OLDPWD"
        echo "✅ Simulator đang chạy với PID: $SIMULATOR_PID"
        ;;
    4)
        # Dừng Mosquitto và thoát
        echo "Đang dừng Mosquitto..."
        kill $MOSQUITTO_PID
        echo "Đã thoát."
        exit 0
        ;;
    *)
        echo "❌ Lựa chọn không hợp lệ."
        # Dừng Mosquitto và thoát
        echo "Đang dừng Mosquitto..."
        kill $MOSQUITTO_PID
        exit 1
        ;;
esac

echo ""
echo "====================================="
echo "    Hệ thống đang chạy    "
echo "====================================="
echo "Nhấn Ctrl+C để dừng tất cả các tiến trình"
echo "====================================="

# Đợi người dùng nhấn Ctrl+C
trap 'echo "Đang dừng tất cả các tiến trình..."; kill $MOSQUITTO_PID 2>/dev/null; kill $BACKEND_PID 2>/dev/null; kill $SIMULATOR_PID 2>/dev/null; echo "Đã dừng tất cả các tiến trình."; exit 0' INT
wait
