# Hướng dẫn sử dụng hệ thống IoT Water

Tài liệu này cung cấp hướng dẫn chi tiết về cách cài đặt, cấu hình và sử dụng hệ thống IoT Water.

## Mục lục

1. [Tổng quan hệ thống](#tổng-quan-hệ-thống)
2. [Yêu cầu hệ thống](#yêu-cầu-hệ-thống)
3. [Cài đặt](#cài-đặt)
4. [Chạy hệ thống](#chạy-hệ-thống)
   - [Chạy với phần cứng thực](#chạy-với-phần-cứng-thực)
   - [Chạy với simulator](#chạy-với-simulator)
5. [Cấu hình hệ thống](#cấu-hình-hệ-thống)
6. [Sử dụng giao diện người dùng](#sử-dụng-giao-diện-người-dùng)
7. [Xử lý sự cố](#xử-lý-sự-cố)
8. [Câu hỏi thường gặp](#câu-hỏi-thường-gặp)

## Tổng quan hệ thống

Hệ thống IoT Water là một giải pháp giám sát và quản lý nước thông minh, bao gồm các thành phần chính sau:

- **Phần cứng**: ESP32, cảm biến mực nước, cảm biến nhiệt độ, cảm biến TDS, cảm biến lưu lượng, máy bơm
- **Backend**: Node.js, Express, MongoDB, MQTT
- **Frontend**: React, Material-UI
- **MQTT Broker**: Mosquitto

Hệ thống cho phép người dùng:
- Giám sát mực nước, nhiệt độ, TDS và lưu lượng nước
- Điều khiển máy bơm (bật/tắt/tự động)
- Phát hiện rò rỉ nước
- Xem lịch sử dữ liệu
- Cấu hình các thông số hệ thống

## Yêu cầu hệ thống

### Phần mềm

- Node.js (v14.0.0 trở lên)
- npm (v6.0.0 trở lên)
- MongoDB (v4.0.0 trở lên)
- Mosquitto MQTT Broker (v2.0.0 trở lên)

### Phần cứng (nếu sử dụng phần cứng thực)

- ESP32
- Cảm biến siêu âm (đo mực nước)
- Cảm biến nhiệt độ
- Cảm biến TDS (đo độ đục)
- Cảm biến lưu lượng
- Relay điều khiển máy bơm
- Cảm biến rò rỉ nước

## Cài đặt

### 1. Cài đặt Mosquitto MQTT Broker

**macOS**:
```bash
brew install mosquitto
```

**Linux (Ubuntu/Debian)**:
```bash
sudo apt-get update
sudo apt-get install mosquitto mosquitto-clients
```

**Windows**:
Tải xuống và cài đặt từ trang chủ: https://mosquitto.org/download/

### 2. Cài đặt MongoDB

**macOS**:
```bash
brew tap mongodb/brew
brew install mongodb-community
```

**Linux (Ubuntu/Debian)**:
```bash
sudo apt-get update
sudo apt-get install mongodb
```

**Windows**:
Tải xuống và cài đặt từ trang chủ: https://www.mongodb.com/try/download/community

### 3. Cài đặt các phụ thuộc cho Backend và Frontend

```bash
# Cài đặt phụ thuộc cho Backend
cd backend
npm install

# Cài đặt phụ thuộc cho Frontend
cd ../frontend
npm install
```

## Chạy hệ thống

### Chạy với phần cứng thực

Để chạy hệ thống với phần cứng thực (ESP32), sử dụng script `start-hardware.sh`:

```bash
# Đảm bảo script có quyền thực thi
chmod +x command/start-hardware.sh

# Chạy script
./command/start-hardware.sh
```

Script này sẽ khởi động:
1. Mosquitto MQTT Broker
2. Backend (Node.js)
3. Frontend (React)

Đảm bảo rằng ESP32 đã được nạp firmware đúng và được kết nối với cùng mạng với máy tính của bạn.

### Chạy với simulator

Để chạy hệ thống với simulator (không cần phần cứng thực), sử dụng script `start-system.sh` trong thư mục `simulator`:

```bash
# Đảm bảo script có quyền thực thi
chmod +x simulator/start-system.sh

# Chạy script
./simulator/start-system.sh
```

Script này sẽ khởi động:
1. Mosquitto MQTT Broker
2. Backend (Node.js)
3. Frontend (React)
4. Simulator (mô phỏng ESP32 và các cảm biến)

## Cấu hình hệ thống

### Cấu hình MQTT Broker

File cấu hình Mosquitto nằm tại `mosquitto/mosquitto.conf`. Bạn có thể chỉnh sửa file này để thay đổi cấu hình MQTT Broker.

### Cấu hình Backend

File cấu hình Backend nằm tại `backend/.env`. Bạn có thể chỉnh sửa file này để thay đổi cấu hình Backend.

### Cấu hình Frontend

File cấu hình Frontend nằm tại `frontend/.env`. Bạn có thể chỉnh sửa file này để thay đổi cấu hình Frontend.

### Cấu hình ESP32 (phần cứng thực)

Để cấu hình ESP32, bạn cần chỉnh sửa file `esp32/config.h` và nạp lại firmware cho ESP32.

## Sử dụng giao diện người dùng

Sau khi khởi động hệ thống, bạn có thể truy cập giao diện người dùng tại:

```
http://localhost:3000
```

### Đăng nhập

Có hai loại tài khoản:
- **Admin**: Có quyền truy cập đầy đủ vào hệ thống
- **User**: Chỉ có quyền xem dữ liệu và điều khiển cơ bản

Để đăng nhập nhanh, bạn có thể sử dụng các nút "Đăng nhập nhanh" trên trang đăng nhập.

### Trang chủ

Trang chủ hiển thị tổng quan về hệ thống, bao gồm:
- Mực nước hiện tại
- Nhiệt độ
- TDS (độ đục)
- Lưu lượng
- Trạng thái máy bơm

### Điều khiển máy bơm

Bạn có thể điều khiển máy bơm từ trang "Điều khiển" với các chế độ:
- **Bật**: Bật máy bơm
- **Tắt**: Tắt máy bơm
- **Tự động**: Máy bơm sẽ tự động bật/tắt dựa trên mực nước

### Xem dữ liệu

Trang "Dữ liệu" cho phép bạn xem lịch sử dữ liệu từ các cảm biến. Bạn có thể:
- Lọc dữ liệu theo ngày
- Lọc dữ liệu theo nhiệt độ, TDS
- Lọc dữ liệu theo trạng thái máy bơm
- Phân trang và chọn số bản ghi mỗi trang

### Cảnh báo

Trang "Cảnh báo" hiển thị các cảnh báo từ hệ thống, bao gồm:
- Cảnh báo rò rỉ nước
- Cảnh báo mực nước thấp/cao
- Cảnh báo nhiệt độ cao
- Cảnh báo TDS cao

### Cấu hình

Trang "Cấu hình" cho phép bạn thay đổi các thông số của hệ thống, bao gồm:
- Chiều cao bể nước
- Ngưỡng cảnh báo mực nước thấp/cao
- Ngưỡng cảnh báo nhiệt độ
- Ngưỡng cảnh báo TDS
- Chế độ máy bơm mặc định

## Xử lý sự cố

### Không thể kết nối với MQTT Broker

- Kiểm tra xem Mosquitto đã được khởi động chưa
- Kiểm tra cấu hình Mosquitto tại `mosquitto/mosquitto.conf`
- Kiểm tra xem cổng 1883 đã được mở chưa

### Không thể kết nối với Backend

- Kiểm tra xem Backend đã được khởi động chưa
- Kiểm tra cấu hình Backend tại `backend/.env`
- Kiểm tra xem MongoDB đã được khởi động chưa

### Không thể kết nối với Frontend

- Kiểm tra xem Frontend đã được khởi động chưa
- Kiểm tra cấu hình Frontend tại `frontend/.env`

### ESP32 không gửi dữ liệu

- Kiểm tra xem ESP32 đã được kết nối với mạng chưa
- Kiểm tra xem ESP32 đã được cấu hình đúng chưa
- Kiểm tra xem các cảm biến đã được kết nối đúng chưa

## Câu hỏi thường gặp

### Làm thế nào để thêm người dùng mới?

Hiện tại, hệ thống chưa hỗ trợ thêm người dùng mới qua giao diện. Bạn cần thêm người dùng trực tiếp vào cơ sở dữ liệu MongoDB.

### Làm thế nào để sao lưu dữ liệu?

Bạn có thể sao lưu dữ liệu MongoDB bằng lệnh:

```bash
mongodump --db iot_water --out backup
```

### Làm thế nào để khôi phục dữ liệu?

Bạn có thể khôi phục dữ liệu MongoDB bằng lệnh:

```bash
mongorestore --db iot_water backup/iot_water
```

### Làm thế nào để xóa tất cả dữ liệu?

Bạn có thể xóa tất cả dữ liệu bằng cách xóa cơ sở dữ liệu MongoDB:

```bash
mongo
use iot_water
db.dropDatabase()
```

### Làm thế nào để cập nhật firmware cho ESP32?

Bạn cần sử dụng Arduino IDE hoặc PlatformIO để nạp firmware mới cho ESP32. Firmware nằm trong thư mục `esp32`.
