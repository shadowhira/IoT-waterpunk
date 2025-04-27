# IoT Water System - Hệ thống giám sát nước thông minh

Dự án này là một hệ thống IoT giám sát và điều khiển nước thông minh, bao gồm phát hiện rò rỉ và cấu hình từ xa. Hệ thống bao gồm ba phần chính: phần cứng (Arduino/ESP32), backend (Node.js) và frontend (React).

## Tính năng chính

- **Giám sát thông số nước**: Nhiệt độ, TDS, lưu lượng, mực nước
- **Điều khiển máy bơm**: Thủ công và tự động
- **Phát hiện rò rỉ thông minh**:
  - Phát hiện rò rỉ dựa trên mực nước giảm bất thường
  - Phát hiện rò rỉ dựa trên lưu lượng bất thường
  - Phát hiện bơm hoạt động quá lâu
- **Cấu hình từ xa**: Điều chỉnh các tham số hệ thống qua giao diện web
- **Cảnh báo thời gian thực**: Thông báo ngay khi phát hiện vấn đề
- **Giao diện người dùng thân thiện**: Dashboard trực quan, dễ sử dụng

## Cấu trúc dự án

```
IoT-waterpunk/
├── arduino-code/         # Mã nguồn cho ESP32/Arduino
│   └── code.ino          # Mã chính cho thiết bị
├── backend/              # Backend Node.js
│   └── broker.js         # MQTT broker và WebSocket server
├── frontend/             # Frontend React
│   ├── public/           # Tài nguyên tĩnh
│   └── src/              # Mã nguồn React
│       ├── Components/   # Các component React
│       ├── Assets/       # Tài nguyên (hình ảnh, CSS, constants)
│       └── Socket/       # Dịch vụ WebSocket
└── README.md             # Tài liệu hướng dẫn
```

## Yêu cầu hệ thống

### Phần cứng
- ESP32 hoặc Arduino tương thích
- Cảm biến nhiệt độ DS18B20
- Cảm biến TDS
- Cảm biến lưu lượng nước
- Cảm biến siêu âm HC-SR04
- Relay điều khiển máy bơm
- Màn hình LCD I2C (tùy chọn)

### Phần mềm
- Arduino IDE
- Node.js (v14 trở lên)
- npm hoặc yarn
- Mosquitto MQTT Broker
- React (v17 trở lên)

## Hướng dẫn cài đặt

### 1. Cài đặt phần cứng

Kết nối các cảm biến và thiết bị theo sơ đồ sau:
- DS18B20 → Pin 5
- TDS → Pin 34
- Cảm biến lưu lượng → Pin 4
- HC-SR04 (TRIG) → Pin 17
- HC-SR04 (ECHO) → Pin 16
- Relay → Pin 12
- LCD I2C → SDA, SCL

### 2. Cài đặt phần mềm cho ESP32/Arduino

1. Mở Arduino IDE
2. Cài đặt các thư viện cần thiết:
   - WiFi
   - PubSubClient
   - OneWire
   - DallasTemperature
   - LiquidCrystal_I2C
   - EEPROM
   - ArduinoJson
3. Mở file `arduino-code/code.ino`
4. Cập nhật thông tin WiFi và MQTT:
   ```cpp
   const char* ssid = "YOUR_WIFI_SSID";
   const char* password = "YOUR_WIFI_PASSWORD";
   const char* mqttServer = "YOUR_MQTT_SERVER_IP";
   const int mqttPort = 2403;
   ```
5. Tải mã lên ESP32/Arduino

### 3. Cài đặt Backend

1. Cài đặt Mosquitto MQTT Broker:
   - **Ubuntu/Debian**: `sudo apt-get install mosquitto mosquitto-clients`
   - **Windows**: Tải từ [mosquitto.org](https://mosquitto.org/download/)
   - **macOS**: `brew install mosquitto`

2. Cài đặt các gói Node.js:
   ```bash
   cd backend
   npm install mqtt ws
   ```

3. Cấu hình Mosquitto (tùy chọn):
   Tạo file `mosquitto.conf`:
   ```
   listener 2403
   allow_anonymous true
   ```

4. Khởi động Mosquitto:
   ```bash
   mosquitto -c mosquitto.conf
   ```

### 4. Cài đặt Frontend

1. Cài đặt các gói phụ thuộc:
   ```bash
   cd frontend
   npm install
   ```

## Hướng dẫn chạy hệ thống

### 1. Khởi động Backend

```bash
cd backend
node broker.js
```

Backend sẽ khởi động và lắng nghe kết nối MQTT và WebSocket.

### 2. Khởi động Frontend

```bash
cd frontend
npm start
```

Frontend sẽ chạy tại địa chỉ [http://localhost:3000](http://localhost:3000).

### 3. Đăng nhập vào hệ thống

- Sử dụng tài khoản mặc định:
  - **Username**: admin
  - **Password**: admin

## Hướng dẫn sử dụng

### 1. Dashboard

Dashboard hiển thị tổng quan về hệ thống, bao gồm:
- Mực nước hiện tại
- Nhiệt độ nước
- Độ đục (TDS)
- Lưu lượng nước
- Trạng thái máy bơm

### 2. Cấu hình hệ thống

Truy cập trang "Cấu hình hệ thống" từ menu để điều chỉnh các tham số:
- **Chiều cao bể nước**: Chiều cao thực tế của bể nước (cm)
- **Nhiệt độ tối đa**: Ngưỡng nhiệt độ an toàn (°C)
- **TDS tối đa**: Ngưỡng độ đục an toàn (ppm)
- **Ngưỡng rò rỉ mực nước**: Tốc độ giảm mực nước bất thường (cm/phút)
- **Ngưỡng rò rỉ lưu lượng**: Lưu lượng bất thường khi không bơm (L/phút)

### 3. Xem cảnh báo

Truy cập trang "Xem cảnh báo" để kiểm tra trạng thái hệ thống:
- **Xanh**: Hệ thống hoạt động bình thường
- **Đỏ**: Phát hiện rò rỉ hoặc vấn đề

Khi có cảnh báo, bạn sẽ thấy:
- Loại rò rỉ
- Thời gian phát hiện
- Hành động đề xuất
- Nút "Đặt lại cảnh báo" để xác nhận đã xử lý vấn đề

## Thử nghiệm hệ thống

### 1. Thử nghiệm phát hiện rò rỉ

#### Mô phỏng rò rỉ mực nước
1. Đảm bảo máy bơm đang tắt
2. Giảm mực nước trong bể (hoặc tăng giá trị khoảng cách từ cảm biến siêu âm)
3. Hệ thống sẽ phát hiện mực nước giảm bất thường và kích hoạt cảnh báo

#### Mô phỏng rò rỉ lưu lượng
1. Đảm bảo máy bơm đang tắt
2. Tạo tín hiệu từ cảm biến lưu lượng (hoặc mô phỏng bằng cách gửi dữ liệu MQTT)
3. Hệ thống sẽ phát hiện lưu lượng bất thường và kích hoạt cảnh báo

#### Mô phỏng bơm hoạt động quá lâu
1. Bật máy bơm thủ công
2. Đợi lâu hơn thời gian cấu hình "Thời gian bơm tối đa"
3. Hệ thống sẽ tự động tắt máy bơm và kích hoạt cảnh báo

### 2. Thử nghiệm cấu hình từ xa

1. Truy cập trang "Cấu hình hệ thống"
2. Thay đổi các tham số (ví dụ: giảm "Thời gian bơm tối đa" xuống 10 giây)
3. Nhấn "Lưu cấu hình"
4. Kiểm tra console của ESP32 để xác nhận cấu hình mới đã được áp dụng
5. Thử nghiệm lại các tính năng với cấu hình mới

### 3. Thử nghiệm gửi dữ liệu giả lập

Bạn có thể gửi dữ liệu giả lập để thử nghiệm hệ thống mà không cần phần cứng thực tế:

```bash
# Gửi dữ liệu cảm biến bình thường
mosquitto_pub -h localhost -p 2403 -t "/sensor/data" -m '{"temperature":25,"tds":300,"flowRate":0,"distance":10,"pumpState":0,"currentLevelPercent":50,"leakDetected":0,"leakType":0}'

# Gửi dữ liệu phát hiện rò rỉ mực nước
mosquitto_pub -h localhost -p 2403 -t "/sensor/leak/alert" -m '{"type":"leak","source":"water_level","value":0.8}'

# Gửi dữ liệu phát hiện rò rỉ lưu lượng
mosquitto_pub -h localhost -p 2403 -t "/sensor/leak/alert" -m '{"type":"leak","source":"flow_rate","value":0.5}'

# Gửi dữ liệu phát hiện bơm hoạt động quá lâu
mosquitto_pub -h localhost -p 2403 -t "/sensor/leak/alert" -m '{"type":"leak","source":"pump_timeout","value":350}'

# Đặt lại cảnh báo
mosquitto_pub -h localhost -p 2403 -t "/sensor/leak/alert" -m '{"type":"leak_reset","status":"ok"}'
```

## Xử lý sự cố

### Không kết nối được với MQTT Broker
- Kiểm tra Mosquitto đang chạy: `ps aux | grep mosquitto`
- Kiểm tra cổng đang mở: `netstat -an | grep 2403`
- Kiểm tra tường lửa: `sudo ufw status`

### ESP32 không kết nối được WiFi
- Kiểm tra SSID và mật khẩu
- Đảm bảo ESP32 trong phạm vi WiFi
- Kiểm tra console để xem lỗi

### Không nhận được dữ liệu từ cảm biến
- Kiểm tra kết nối phần cứng
- Kiểm tra nguồn điện
- Kiểm tra console ESP32 để xem lỗi đọc cảm biến

### Frontend không kết nối được với Backend
- Kiểm tra WebSocket server đang chạy
- Kiểm tra cổng 4000 đang mở
- Kiểm tra console trình duyệt để xem lỗi kết nối

## Đóng góp

Nếu bạn muốn đóng góp cho dự án, vui lòng:
1. Fork repository
2. Tạo branch mới (`git checkout -b feature/amazing-feature`)
3. Commit thay đổi (`git commit -m 'Add some amazing feature'`)
4. Push lên branch (`git push origin feature/amazing-feature`)
5. Mở Pull Request

## Giấy phép

Dự án này được phân phối dưới giấy phép MIT. Xem `LICENSE` để biết thêm thông tin.

## Liên hệ

Nếu bạn có câu hỏi hoặc góp ý, vui lòng liên hệ qua email hoặc mở issue trên GitHub.
