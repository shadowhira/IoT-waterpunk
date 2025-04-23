#!/bin/bash

# Tạo thư mục log và data nếu chưa tồn tại
mkdir -p log data

# Khởi động Mosquitto với file cấu hình
mosquitto -c mosquitto.conf

# Thêm quyền
chmod +x start_mosquitto.sh