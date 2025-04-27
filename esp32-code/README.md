# Hướng dẫn đọc code ESP32 cho hệ thống IoT nước

## Giới thiệu

File `code.ino` chứa mã nguồn cho hệ thống IoT quản lý nước sử dụng ESP32. Hệ thống này có khả năng:
- Đo nhiệt độ nước thông qua cảm biến DS18B20
- Đo nồng độ TDS (Total Dissolved Solids) để đánh giá chất lượng nước
- Đo mực nước trong bể chứa bằng cảm biến siêu âm HC-SR04
- Đo lưu lượng nước qua cảm biến lưu lượng
- Điều khiển máy bơm nước thông qua relay
- Phát hiện rò rỉ nước qua sự thay đổi mực nước và lưu lượng bất thường
- Lưu trữ cấu hình và trạng thái vào EEPROM để duy trì sau khi mất điện
- Giao tiếp qua MQTT với backend để điều khiển từ xa và gửi dữ liệu
- Hiển thị thông tin trên màn hình LCD I2C

## Cấu trúc code

### 1. Khai báo thư viện và biến toàn cục

Phần đầu file chứa các khai báo thư viện cần thiết và các biến toàn cục:

**Thư viện sử dụng:**
- `WiFi.h`: Kết nối WiFi
- `PubSubClient.h`: Giao tiếp MQTT
- `OneWire.h` và `DallasTemperature.h`: Đọc cảm biến nhiệt độ DS18B20
- `Wire.h` và `LiquidCrystal_I2C.h`: Điều khiển màn hình LCD I2C
- `EEPROM.h`: Lưu trữ dữ liệu vào bộ nhớ không bay hơi
- `ArduinoJson.h`: Xử lý dữ liệu JSON

**Các biến cấu hình chính:**
- `TANK_HEIGHT`: Chiều cao bể nước (cm)
- `MAX_TEMP`: Ngưỡng nhiệt độ tối đa (°C)
- `MAX_TDS`: Ngưỡng TDS tối đa (ppm)
- `LEAK_THRESHOLD`: Ngưỡng phát hiện rò rỉ qua mực nước (cm/phút)
- `FLOW_THRESHOLD`: Ngưỡng phát hiện rò rỉ qua lưu lượng (L/phút)
- `PUMP_TIMEOUT`: Thời gian tối đa cho phép máy bơm hoạt động (ms)
- `ALERTS_ENABLED`: Bật/tắt cảnh báo

**Các biến trạng thái hệ thống:**
- `controlMode`: Chế độ điều khiển (0: Tắt thủ công, 1: Bật thủ công, 2: Tự động)
- `pumpState`: Trạng thái máy bơm (true: bật, false: tắt)
- `desiredLevelPercent`: Mức nước mong muốn (%)
- `leakDetected`: Trạng thái phát hiện rò rỉ
- `leakType`: Loại rò rỉ (0: Không, 1: Mực nước, 2: Lưu lượng)

**Các chân kết nối:**
- `pumpPin`: Chân điều khiển relay máy bơm (12)
- `ONE_WIRE_PIN`: Chân kết nối cảm biến DS18B20 (5)
- `TDS_PIN`: Chân kết nối cảm biến TDS (34)
- `FLOW_SENSOR_PIN`: Chân kết nối cảm biến lưu lượng (4)
- `TRIG_PIN` và `ECHO_PIN`: Chân kết nối cảm biến siêu âm (17, 16)

### 2. Cấu trúc dữ liệu

Hai cấu trúc dữ liệu chính được sử dụng để lưu trữ trong EEPROM:

```cpp
// Cấu trúc dữ liệu cho cấu hình hệ thống
struct SystemConfig {
  uint32_t magicNumber;    // Số ma thuật để xác định dữ liệu hợp lệ
  float tankHeight;        // Chiều cao bể nước (cm)
  float maxTemp;           // Nhiệt độ tối đa (°C)
  float maxTds;            // TDS tối đa (ppm)
  float leakThreshold;     // Ngưỡng phát hiện rò rỉ mực nước (cm/phút)
  float flowThreshold;     // Ngưỡng phát hiện rò rỉ lưu lượng (L/phút)
  uint16_t pumpTimeout;    // Thời gian tối đa cho phép máy bơm hoạt động (ms)
  bool alertsEnabled;      // Bật/tắt cảnh báo
  byte checksum;           // Checksum để kiểm tra tính toàn vẹn dữ liệu
};

// Cấu trúc dữ liệu cho trạng thái hệ thống
struct SystemState {
  uint32_t magicNumber;    // Số ma thuật để xác định dữ liệu hợp lệ
  int controlMode;         // Chế độ điều khiển (0: Tắt thủ công, 1: Bật thủ công, 2: Tự động)
  bool pumpState;          // Trạng thái máy bơm (true: bật, false: tắt)
  int desiredLevel;        // Mức nước mong muốn (%)
  byte checksum;           // Checksum để kiểm tra tính toàn vẹn dữ liệu
};
```

### 3. Danh sách đầy đủ các hàm chính

#### Hàm khởi tạo và vòng lặp chính

- `setup()`: Khởi tạo các thành phần hệ thống, kết nối WiFi, MQTT, đọc cấu hình từ EEPROM
- `loop()`: Vòng lặp chính, đọc cảm biến, xử lý logic điều khiển, gửi dữ liệu

#### Hàm đọc cảm biến và xử lý dữ liệu

- `measureDistance()`: Đọc khoảng cách từ cảm biến siêu âm HC-SR04
- `filterDistance(float rawDistance)`: Lọc nhiễu cho giá trị khoảng cách bằng cách tính trung bình nhiều mẫu
- `readTdsValue()`: Đọc và tính toán giá trị TDS từ cảm biến
- `pulseCounter()`: Hàm ngắt (interrupt) để đếm xung từ cảm biến lưu lượng

#### Hàm điều khiển và xử lý logic

- `controlPump()`: Điều khiển máy bơm dựa trên chế độ và điều kiện
- `checkForLeaks()`: Phát hiện rò rỉ nước qua sự thay đổi mực nước và lưu lượng bất thường
- `resetLeak()`: Đặt lại trạng thái cảnh báo rò rỉ
- `updateLCD(float currentLevelPercent)`: Cập nhật thông tin hiển thị trên LCD
- `toggleLCDDisplay()`: Chuyển đổi giữa các màn hình hiển thị trên LCD
- `displayLeakAlert()`: Hiển thị cảnh báo rò rỉ trên LCD

#### Hàm quản lý EEPROM

- `calculateChecksum(byte* data, int length)`: Tính toán checksum cho dữ liệu cấu hình
- `calculateStateChecksum(SystemState* state)`: Tính toán checksum cho dữ liệu trạng thái
- `saveConfigToEEPROM()`: Lưu cấu hình vào EEPROM
- `loadConfigFromEEPROM()`: Đọc cấu hình từ EEPROM
- `saveStateToEEPROM()`: Lưu trạng thái vào EEPROM
- `loadStateFromEEPROM()`: Đọc trạng thái từ EEPROM
- `clearEEPROM()`: Xóa toàn bộ dữ liệu trong EEPROM
- `printCurrentState()`: In trạng thái hiện tại ra Serial Monitor

#### Hàm kết nối và giao tiếp MQTT

- `reconnect()`: Kết nối lại MQTT nếu mất kết nối
- `callback(char* topic, byte* payload, unsigned int length)`: Xử lý các lệnh MQTT nhận được
- `sendSensorData(float currentLevelPercent)`: Gửi dữ liệu cảm biến qua MQTT
- `sendCurrentConfig()`: Gửi cấu hình hiện tại qua MQTT
- `sendLeakAlert()`: Gửi cảnh báo rò rỉ qua MQTT

## Cách hoạt động của EEPROM

ESP32 sử dụng EEPROM để lưu trữ cấu hình và trạng thái hệ thống, giúp duy trì thông tin ngay cả khi mất điện.

### Lưu cấu hình vào EEPROM

```cpp
void saveConfigToEEPROM() {
  SystemConfig config;
  config.magicNumber = EEPROM_MAGIC_NUMBER;
  config.tankHeight = TANK_HEIGHT;
  config.maxTemp = MAX_TEMP;
  config.maxTds = MAX_TDS;
  config.leakThreshold = LEAK_THRESHOLD;
  config.flowThreshold = FLOW_THRESHOLD;
  config.alertsEnabled = ALERTS_ENABLED;

  // Tính toán checksum
  config.checksum = calculateChecksum((byte*)&config, sizeof(config) - 1);

  // Lưu vào EEPROM
  EEPROM.put(EEPROM_CONFIG_ADDR, config);
  bool success = EEPROM.commit();
}
```

### Đọc cấu hình từ EEPROM

```cpp
bool loadConfigFromEEPROM() {
  SystemConfig config;
  EEPROM.get(EEPROM_CONFIG_ADDR, config);

  // Kiểm tra magic number và checksum
  if (config.magicNumber != EEPROM_MAGIC_NUMBER) {
    return false;
  }

  byte calculatedChecksum = calculateChecksum((byte*)&config, sizeof(config) - 1);
  if (calculatedChecksum != config.checksum) {
    return false;
  }

  // Cập nhật cấu hình
  TANK_HEIGHT = config.tankHeight;
  MAX_TEMP = config.maxTemp;
  MAX_TDS = config.maxTds;
  LEAK_THRESHOLD = config.leakThreshold;
  FLOW_THRESHOLD = config.flowThreshold;
  PUMP_TIMEOUT = config.pumpTimeout;
  ALERTS_ENABLED = config.alertsEnabled;

  return true;
}
```

### Lưu trạng thái vào EEPROM

```cpp
void saveStateToEEPROM() {
  SystemState state;
  state.magicNumber = EEPROM_MAGIC_NUMBER;
  state.controlMode = controlMode;
  state.pumpState = pumpState;
  state.desiredLevel = desiredLevelPercent;

  // Tính checksum trước khi lưu
  state.checksum = calculateStateChecksum(&state);

  // Lưu vào EEPROM
  EEPROM.put(EEPROM_STATE_ADDR, state);
  bool success = EEPROM.commit();
}
```

### Đọc trạng thái từ EEPROM

```cpp
bool loadStateFromEEPROM() {
  SystemState state;
  EEPROM.get(EEPROM_STATE_ADDR, state);

  // Kiểm tra magic number
  if (state.magicNumber != EEPROM_MAGIC_NUMBER) {
    return false;
  }

  // Lưu checksum đọc được
  byte storedChecksum = state.checksum;

  // Tính toán lại checksum
  byte calculatedChecksum = calculateStateChecksum(&state);

  if (calculatedChecksum != storedChecksum) {
    return false;
  }

  // Cập nhật trạng thái
  controlMode = state.controlMode;
  pumpState = state.pumpState;
  desiredLevelPercent = state.desiredLevel;

  return true;
}
```

### Đọc cấu hình từ EEPROM

```cpp
bool loadConfigFromEEPROM() {
  SystemConfig config;
  EEPROM.get(EEPROM_CONFIG_ADDR, config);

  // Kiểm tra magic number và checksum
  if (config.magicNumber != EEPROM_MAGIC_NUMBER) {
    return false;
  }

  byte calculatedChecksum = calculateChecksum((byte*)&config, sizeof(config) - 1);
  if (calculatedChecksum != config.checksum) {
    return false;
  }

  // Cập nhật cấu hình
  TANK_HEIGHT = config.tankHeight;
  MAX_TEMP = config.maxTemp;
  MAX_TDS = config.maxTds;
  LEAK_THRESHOLD = config.leakThreshold;
  FLOW_THRESHOLD = config.flowThreshold;
  PUMP_TIMEOUT = config.pumpTimeout;
  ALERTS_ENABLED = config.alertsEnabled;

  return true;
}
```

## Kiểm tra dữ liệu EEPROM

Có nhiều cách để kiểm tra dữ liệu EEPROM mà không cần sửa đổi code chính:

### 1. Sử dụng Serial Monitor

Khi ESP32 khởi động, nó sẽ in ra thông tin về việc đọc cấu hình từ EEPROM. Bạn có thể xem thông tin này trong Serial Monitor của Arduino IDE.

### 2. Tạo sketch riêng để đọc EEPROM

Bạn có thể tạo một sketch Arduino riêng biệt để đọc và hiển thị nội dung EEPROM mà không làm thay đổi code chính. Ví dụ:

```cpp
#include <EEPROM.h>

#define EEPROM_SIZE 512
#define EEPROM_CONFIG_ADDR 0
#define EEPROM_STATE_ADDR 200

void setup() {
  Serial.begin(115200);
  if (!EEPROM.begin(EEPROM_SIZE)) {
    Serial.println("Lỗi khởi tạo EEPROM!");
    return;
  }

  // Đọc và hiển thị dữ liệu EEPROM
  Serial.println("Nội dung EEPROM:");
  for (int i = 0; i < EEPROM_SIZE; i++) {
    if (i % 16 == 0) Serial.printf("\n%04X: ", i);
    Serial.printf("%02X ", EEPROM.read(i));
  }
}

void loop() {
  delay(1000);
}
```

### 3. Sử dụng công cụ ESP32 Flash Download Tool

ESP32 Flash Download Tool cho phép bạn đọc và ghi flash memory của ESP32, bao gồm cả EEPROM.

### 4. Sử dụng esptool.py

```bash
esptool.py --port COM3 read_flash 0x9000 0x1000 eeprom_data.bin
```

## Cấu trúc EEPROM

EEPROM được tổ chức như sau:
- Địa chỉ 0: Cấu hình hệ thống (SystemConfig)
- Địa chỉ 200: Trạng thái hệ thống (SystemState)

Mỗi cấu trúc đều có:
- Magic number (0xAB): Để xác định dữ liệu hợp lệ
- Checksum: Để kiểm tra tính toàn vẹn dữ liệu

## Lưu ý quan trọng

1. **Magic Number**: Giá trị 0xAB được sử dụng để xác định xem dữ liệu trong EEPROM có hợp lệ hay không.
2. **Checksum**: Được tính bằng phép XOR tất cả các byte trong cấu trúc (trừ byte checksum).
3. **EEPROM.commit()**: Cần gọi hàm này sau khi ghi dữ liệu để lưu vào flash memory.
4. **Kích thước EEPROM**: Được thiết lập là 512 bytes, đủ cho cả cấu hình và trạng thái.

## Cách cập nhật cấu hình từ xa

Hệ thống hỗ trợ cập nhật cấu hình từ xa thông qua MQTT:
1. Gửi JSON với các thông số cần thay đổi đến topic `/sensor/config`
2. ESP32 sẽ cập nhật cấu hình và lưu vào EEPROM
3. ESP32 gửi xác nhận đến topic `/sensor/config/status`

Ví dụ JSON cấu hình:
```json
{
  "tank_height": 15.0,
  "max_temp": 35.0,
  "max_tds": 500.0,
  "leak_threshold": 0.5,
  "flow_threshold": 0.2,
  "pump_timeout": 300000,
  "alerts_enabled": true
}
```
