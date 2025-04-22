#!/bin/bash

# Màu sắc cho terminal
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Đường dẫn tới các thành phần
BACKEND_DIR="../backend"
FRONTEND_DIR="../frontend"
MOSQUITTO_CONFIG="./mosquitto.conf"

# Lưu thư mục hiện tại
CURRENT_DIR=$(pwd)

# Kiểm tra xem Mosquitto đã được cài đặt chưa
if ! command -v mosquitto &> /dev/null; then
    echo -e "${RED}Mosquitto chưa được cài đặt. Vui lòng cài đặt Mosquitto trước khi chạy script này.${NC}"
    echo -e "Bạn có thể cài đặt bằng lệnh: brew install mosquitto (macOS) hoặc sudo apt-get install mosquitto (Linux)"
    exit 1
fi

# Kiểm tra xem các thư mục cần thiết có tồn tại không
if [ ! -d "$BACKEND_DIR" ]; then
    echo -e "${RED}Không tìm thấy thư mục backend.${NC}"
    exit 1
fi

if [ ! -d "$FRONTEND_DIR" ]; then
    echo -e "${RED}Không tìm thấy thư mục frontend.${NC}"
    exit 1
fi

if [ ! -f "$MOSQUITTO_CONFIG" ]; then
    echo -e "${YELLOW}Cảnh báo: Không tìm thấy file cấu hình Mosquitto. Sẽ sử dụng cấu hình mặc định.${NC}"
    MOSQUITTO_CONFIG=""
fi

# Hàm để dừng tất cả các tiến trình khi nhấn Ctrl+C
function cleanup() {
    echo -e "\n${YELLOW}Đang dừng tất cả các tiến trình...${NC}"

    # Tìm và kill các tiến trình
    if [ ! -z "$MOSQUITTO_PID" ]; then
        echo -e "Đang dừng Mosquitto (PID: $MOSQUITTO_PID)..."
        kill $MOSQUITTO_PID 2>/dev/null
    fi

    if [ ! -z "$BACKEND_PID" ]; then
        echo -e "Đang dừng Backend (PID: $BACKEND_PID)..."
        kill $BACKEND_PID 2>/dev/null
    fi

    if [ ! -z "$FRONTEND_PID" ]; then
        echo -e "Đang dừng Frontend (PID: $FRONTEND_PID)..."
        kill $FRONTEND_PID 2>/dev/null
    fi

    # Dọn dẹp file tạm nếu có
    if [ -f "mosquitto_temp.conf" ]; then
        rm mosquitto_temp.conf
        echo -e "Đã dọn dẹp file tạm mosquitto_temp.conf"
    fi

    echo -e "${GREEN}Tất cả các tiến trình đã được dừng.${NC}"
    exit 0
}

# Đăng ký hàm cleanup khi nhấn Ctrl+C
trap cleanup SIGINT

# Hiển thị thông báo bắt đầu
echo -e "${GREEN}=== BẮT ĐẦU KHỞI ĐỘNG HỆ THỐNG VỚI PHẦN CỨNG THỰC ===${NC}"
echo -e "${YELLOW}Nhấn Ctrl+C để dừng tất cả các tiến trình.${NC}\n"

# Khởi động Mosquitto MQTT Broker
echo -e "${BLUE}[1/3] Đang khởi động Mosquitto MQTT Broker...${NC}"

# Tạo thư mục log và data nếu chưa tồn tại
mkdir -p log data

# Kiểm tra xem file cấu hình tồn tại
if [ -f "mosquitto.conf" ]; then
    mosquitto -c mosquitto.conf -v &
else
    echo -e "${YELLOW}Không tìm thấy file cấu hình mosquitto.conf, sử dụng cấu hình mặc định với port 2403${NC}"
    echo "listener 2403
allow_anonymous true" > mosquitto_temp.conf
    mosquitto -c mosquitto_temp.conf -v &
fi
MOSQUITTO_PID=$!
sleep 2

if ps -p $MOSQUITTO_PID > /dev/null; then
    echo -e "${GREEN}Mosquitto đã được khởi động thành công (PID: $MOSQUITTO_PID).${NC}\n"
else
    echo -e "${RED}Không thể khởi động Mosquitto. Vui lòng kiểm tra lại.${NC}"
    cleanup
fi

# Khởi động Backend
echo -e "${BLUE}[2/3] Đang khởi động Backend...${NC}"
cd "$BACKEND_DIR"
npm start &
BACKEND_PID=$!
cd "$CURRENT_DIR"
sleep 5

if ps -p $BACKEND_PID > /dev/null; then
    echo -e "${GREEN}Backend đã được khởi động thành công (PID: $BACKEND_PID).${NC}\n"
else
    echo -e "${RED}Không thể khởi động Backend. Vui lòng kiểm tra lại.${NC}"
    cleanup
fi

# Khởi động Frontend
echo -e "${BLUE}[3/3] Đang khởi động Frontend...${NC}"
cd "$FRONTEND_DIR"
npm start &
FRONTEND_PID=$!
cd "$CURRENT_DIR"
sleep 5

if ps -p $FRONTEND_PID > /dev/null; then
    echo -e "${GREEN}Frontend đã được khởi động thành công (PID: $FRONTEND_PID).${NC}\n"
else
    echo -e "${RED}Không thể khởi động Frontend. Vui lòng kiểm tra lại.${NC}"
    cleanup
fi

# Hiển thị thông báo hoàn tất
echo -e "${GREEN}=== HỆ THỐNG ĐÃ ĐƯỢC KHỞI ĐỘNG THÀNH CÔNG ===${NC}"
echo -e "${BLUE}Thông tin truy cập:${NC}"
echo -e "- Frontend: ${YELLOW}http://localhost:3000${NC}"
echo -e "- Backend API: ${YELLOW}http://localhost:4000${NC}"
echo -e "- MQTT Broker: ${YELLOW}localhost:2403${NC}"
echo -e "\n${YELLOW}Hệ thống đang chạy với phần cứng thực. Đảm bảo rằng ESP32 đã được kết nối đúng cách.${NC}"
echo -e "${YELLOW}Nhấn Ctrl+C để dừng tất cả các tiến trình.${NC}"

# Giữ script chạy
wait
