#!/bin/bash

# Lấy địa chỉ IP của máy tính
IP_ADDRESS=$(ifconfig | grep "inet " | grep -v 127.0.0.1 | awk '{print $2}')

echo "====================================="
echo "    Khởi động hệ thống cho Mobile    "
echo "====================================="
echo "Địa chỉ IP của máy tính: $IP_ADDRESS"
echo "====================================="

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

# Kiểm tra và cập nhật file .env của backend
if [ -f "../backend/.env" ]; then
    sed -i '' "s/MQTT_BROKER_URL=.*/MQTT_BROKER_URL=$IP_ADDRESS/" ../backend/.env
    echo "Cập nhật file .env của backend thành công"
else
    echo "Tạo file .env mới cho backend"
    if [ -f "../backend/.env.example" ]; then
        cp ../backend/.env.example ../backend/.env
        sed -i '' "s/MQTT_BROKER_URL=.*/MQTT_BROKER_URL=$IP_ADDRESS/" ../backend/.env
    else
        echo "MQTT_BROKER_URL=$IP_ADDRESS
MQTT_BROKER_PORT=2403
PORT=4000" > ../backend/.env
    fi
fi

# Kiểm tra và cập nhật file .env của frontend
if [ -f "../frontend/.env" ]; then
    sed -i '' "s|REACT_APP_API_URL=.*|REACT_APP_API_URL=http://$IP_ADDRESS:4000/api|" ../frontend/.env
    sed -i '' "s|REACT_APP_WEBSOCKET_URL=.*|REACT_APP_WEBSOCKET_URL=ws://$IP_ADDRESS:4000|" ../frontend/.env
    echo "Cập nhật file .env của frontend thành công"
else
    echo "Tạo file .env mới cho frontend"
    echo "REACT_APP_API_URL=http://$IP_ADDRESS:4000/api
REACT_APP_WEBSOCKET_URL=ws://$IP_ADDRESS:4000" > ../frontend/.env
fi

# Lưu thư mục hiện tại
CURRENT_DIR=$(pwd)

# Khởi động backend
echo "Khởi động backend..."
cd ../backend
node server.js &
BACKEND_PID=$!
echo "Backend đang chạy với PID: $BACKEND_PID"

# Đợi backend khởi động
sleep 2

# Khởi động frontend
echo "Khởi động frontend..."
cd ../frontend
npm start &
FRONTEND_PID=$!
echo "Frontend đang chạy với PID: $FRONTEND_PID"

# Quay lại thư mục command
cd "$CURRENT_DIR"

# Hiển thị thông tin truy cập
echo ""
echo "====================================="
echo "    Hệ thống đang chạy    "
echo "====================================="
echo "Frontend: http://$IP_ADDRESS:3000"
echo "Backend: http://$IP_ADDRESS:4000"
echo "====================================="
echo "Để truy cập từ điện thoại, hãy mở trình duyệt và nhập:"
echo "http://$IP_ADDRESS:3000"
echo "====================================="
echo "Nhấn Ctrl+C để dừng tất cả các tiến trình"
echo "====================================="

# Xử lý khi thoát
function cleanup {
    echo "Đang dừng các dịch vụ..."

    kill $FRONTEND_PID
    echo "Đã dừng frontend"

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
