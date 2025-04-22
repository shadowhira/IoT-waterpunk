# ESP32 IoT Water System Simulator

Chương trình này mô phỏng hoạt động của ESP32 trong hệ thống giám sát nước thông minh, cho phép kiểm thử các tính năng mà không cần phần cứng thực.

## Tính năng

- Mô phỏng gửi dữ liệu cảm biến (nhiệt độ, TDS, lưu lượng, mực nước)
- Mô phỏng nhận lệnh điều khiển (bật/tắt máy bơm, chế độ tự động)
- Mô phỏng cấu hình từ xa (thay đổi các tham số hệ thống)
- Mô phỏng phát hiện rò rỉ (mực nước, lưu lượng, bơm quá lâu)
- Giao diện dòng lệnh tương tác để thay đổi các thông số

## Cài đặt

1. Đảm bảo đã cài đặt Node.js (v14 trở lên)
2. Cài đặt các gói phụ thuộc:

```bash
cd simulator
npm install
```

## Sử dụng

1. Đảm bảo Mosquitto MQTT broker đang chạy trên cổng 2403:

```bash
mosquitto -c /path/to/mosquitto.conf
```

2. Khởi động backend:

```bash
cd backend
node server.js
```

3. Khởi động chương trình giả lập:

```bash
cd simulator
npm start
```

4. Sử dụng menu tương tác để thay đổi các thông số và mô phỏng các tình huống

## Menu tương tác

Chương trình cung cấp menu tương tác với các tùy chọn sau:

1. **Thay đổi nhiệt độ**: Thay đổi giá trị nhiệt độ nước
2. **Thay đổi TDS**: Thay đổi giá trị TDS (độ đục)
3. **Thay đổi lưu lượng**: Thay đổi giá trị lưu lượng nước
4. **Thay đổi mực nước**: Thay đổi khoảng cách từ cảm biến đến mặt nước
5. **Mô phỏng rò rỉ mực nước**: Tạo tình huống mực nước giảm bất thường
6. **Mô phỏng rò rỉ lưu lượng**: Tạo tình huống lưu lượng bất thường khi máy bơm tắt
7. **Mô phỏng bơm quá lâu**: Tạo tình huống máy bơm hoạt động quá thời gian cho phép
8. **Hiển thị trạng thái hiện tại**: Xem trạng thái hiện tại của hệ thống
9. **Hiển thị cấu hình hiện tại**: Xem cấu hình hiện tại của hệ thống
0. **Thoát**: Đóng chương trình

## Các chủ đề MQTT

Chương trình sử dụng các chủ đề MQTT sau:

- `/sensor/data`: Gửi dữ liệu cảm biến
- `/sensor/control`: Nhận lệnh điều khiển máy bơm
- `/sensor/level`: Nhận mức nước mong muốn
- `/sensor/config`: Nhận cấu hình từ xa
- `/sensor/config/status`: Gửi cấu hình hiện tại
- `/sensor/leak/alert`: Gửi cảnh báo rò rỉ

## Kịch bản kiểm thử

### 1. Kiểm thử cấu hình từ xa

1. Truy cập trang "Cấu hình hệ thống" trên frontend
2. Thay đổi các tham số (ví dụ: giảm "Thời gian bơm tối đa" xuống 10 giây)
3. Nhấn "Lưu cấu hình"
4. Kiểm tra console của chương trình giả lập để xác nhận cấu hình mới đã được áp dụng

### 2. Kiểm thử phát hiện rò rỉ mực nước

1. Đảm bảo máy bơm đang tắt (chọn tùy chọn "off" từ backend hoặc frontend)
2. Trong chương trình giả lập, chọn tùy chọn 5 để mô phỏng rò rỉ mực nước
3. Kiểm tra cảnh báo xuất hiện trên frontend

### 3. Kiểm thử phát hiện rò rỉ lưu lượng

1. Đảm bảo máy bơm đang tắt
2. Trong chương trình giả lập, chọn tùy chọn 6 để mô phỏng rò rỉ lưu lượng
3. Kiểm tra cảnh báo xuất hiện trên frontend

### 4. Kiểm thử phát hiện bơm quá lâu

1. Bật máy bơm (chọn tùy chọn "on" từ backend hoặc frontend)
2. Trong chương trình giả lập, chọn tùy chọn 7 để mô phỏng bơm quá lâu
3. Kiểm tra cảnh báo xuất hiện trên frontend và máy bơm tự động tắt

### 5. Kiểm thử đặt lại cảnh báo

1. Tạo một cảnh báo rò rỉ bằng một trong các phương pháp trên
2. Trên frontend, nhấn nút "Đặt lại cảnh báo"
3. Kiểm tra cảnh báo biến mất và trạng thái hệ thống trở về bình thường
