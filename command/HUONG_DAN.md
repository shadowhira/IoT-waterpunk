# Hướng dẫn cài đặt và chạy Mosquitto MQTT Broker

## 1. Cài đặt Mosquitto

### Trên macOS:
```bash
brew install mosquitto
```

### Trên Ubuntu/Debian:
```bash
sudo apt-get update
sudo apt-get install mosquitto mosquitto-clients
```

### Trên Windows:
- Tải xuống bộ cài đặt từ trang chủ: https://mosquitto.org/download/
- Cài đặt theo hướng dẫn

## 2. Cấu trúc thư mục

Đảm bảo rằng bạn có cấu trúc thư mục như sau trong thư mục `command`:
```
command/
├── data/         # Thư mục lưu trữ dữ liệu persistence
├── log/          # Thư mục lưu trữ log
└── mosquitto.conf # File cấu hình
```

## 3. Chạy Mosquitto với file cấu hình tùy chỉnh

### Sử dụng script tự động:
```bash
cd command
./start_mosquitto.sh
```

### Hoặc chạy thủ công từ thư mục gốc của dự án:
```bash
mosquitto -c command/mosquitto.conf
```

### Hoặc chạy thủ công từ thư mục command:
```bash
cd command
mosquitto -c mosquitto.conf
```

## 4. Kiểm tra kết nối

### Đăng ký nhận tin nhắn (Subscribe):
Mở một terminal mới và chạy:
```bash
mosquitto_sub -h localhost -p 2403 -t "test/topic"
```

### Gửi tin nhắn (Publish):
Mở một terminal khác và chạy:
```bash
mosquitto_pub -h localhost -p 2403 -t "test/topic" -m "Hello MQTT"
```

Nếu mọi thứ hoạt động đúng, terminal đầu tiên sẽ hiển thị tin nhắn "Hello MQTT".

## 5. Dừng Mosquitto

Để dừng Mosquitto, nhấn `Ctrl+C` trong terminal đang chạy Mosquitto.

## 6. Tích hợp với ứng dụng

Để sử dụng Mosquitto trong ứng dụng Node.js, đảm bảo đã cài đặt thư viện MQTT:

```bash
npm install mqtt
```

Sau đó, bạn có thể kết nối đến broker bằng cách sử dụng:

```javascript
const mqtt = require('mqtt');
const client = mqtt.connect('mqtt://localhost:2403');

client.on('connect', function() {
  console.log('Đã kết nối thành công đến MQTT broker');

  // Subscribe
  client.subscribe('test/topic');

  // Publish
  client.publish('test/topic', 'Hello từ ứng dụng Node.js');
});

client.on('message', function(topic, message) {
  console.log(`Nhận tin nhắn từ topic ${topic}: ${message.toString()}`);
});
```

## 7. Khởi động và dừng toàn bộ hệ thống

### Khởi động hệ thống:
```bash
cd command
./start_system.sh
```

Script này sẽ:
- Khởi động Mosquitto MQTT Broker
- Hiển thị menu cho phép bạn chọn khởi động Backend, Simulator hoặc cả hai

### Dừng hệ thống:
```bash
cd command
./stop_system.sh
```

Script này sẽ tìm và dừng tất cả các tiến trình liên quan đến hệ thống.

## 8. Xử lý sự cố

### Kiểm tra Mosquitto có đang chạy không:
```bash
ps aux | grep mosquitto
```

### Kiểm tra log:
```bash
cat command/log/mosquitto.log
```

### Kiểm tra cổng:
```bash
netstat -an | grep 2403
```

### Nếu không thể kết nối:
- Kiểm tra xem cổng 2403 có đang được sử dụng bởi ứng dụng khác không
- Đảm bảo tường lửa không chặn kết nối
- Kiểm tra lại cấu hình trong file mosquitto.conf
