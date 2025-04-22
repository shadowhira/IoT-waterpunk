#!/bin/bash

# Kiểm tra Mosquitto
if ! command -v mosquitto &> /dev/null; then
    echo "Mosquitto không được cài đặt. Vui lòng cài đặt trước khi tiếp tục."
    exit 1
fi

# Kiểm tra Node.js
if ! command -v node &> /dev/null; then
    echo "Node.js không được cài đặt. Vui lòng cài đặt trước khi tiếp tục."
    exit 1
fi

# Tạo file cấu hình Mosquitto tạm thời
echo "listener 2403
allow_anonymous true" > mosquitto_temp.conf

# Khởi động Mosquitto
echo "Khởi động Mosquitto MQTT broker..."
mosquitto -c mosquitto_temp.conf &
MOSQUITTO_PID=$!
echo "Mosquitto đang chạy với PID: $MOSQUITTO_PID"

# Đợi Mosquitto khởi động
sleep 2

# Khởi động backend
echo "Khởi động backend..."
cd ../backend
node server.js &
BACKEND_PID=$!
echo "Backend đang chạy với PID: $BACKEND_PID"

# Đợi backend khởi động
sleep 2

# Khởi động frontend (nếu cần)
echo "Bạn có muốn khởi động frontend không? (y/n)"
read -r start_frontend
if [ "$start_frontend" = "y" ]; then
    echo "Khởi động frontend..."
    cd ../frontend
    npm start &
    FRONTEND_PID=$!
    echo "Frontend đang chạy với PID: $FRONTEND_PID"
    sleep 2
fi

# Quay lại thư mục simulator
cd ../simulator

# Khởi động chương trình giả lập
echo "Khởi động chương trình giả lập ESP32..."
node simulator.js

# Xử lý khi thoát
function cleanup {
    echo "Đang dừng các dịch vụ..."
    
    if [ -n "$FRONTEND_PID" ]; then
        kill $FRONTEND_PID
        echo "Đã dừng frontend"
    fi
    
    kill $BACKEND_PID
    echo "Đã dừng backend"
    
    kill $MOSQUITTO_PID
    echo "Đã dừng Mosquitto"
    
    rm mosquitto_temp.conf
    echo "Đã dọn dẹp file tạm"
}

# Đăng ký hàm cleanup khi thoát
trap cleanup EXIT

# Đợi người dùng nhấn Ctrl+C
wait
