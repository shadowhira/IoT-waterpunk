# Hướng dẫn cấu hình ESP32 cho hệ thống IoT Water

Tài liệu này cung cấp hướng dẫn chi tiết về cách cấu hình ESP32 để kết nối với hệ thống IoT Water.

## Mục lục

1. [Yêu cầu phần cứng](#yêu-cầu-phần-cứng)
2. [Kết nối phần cứng](#kết-nối-phần-cứng)
3. [Cài đặt môi trường phát triển](#cài-đặt-môi-trường-phát-triển)
4. [Cấu hình firmware](#cấu-hình-firmware)
5. [Nạp firmware](#nạp-firmware)
6. [Kiểm tra kết nối](#kiểm-tra-kết-nối)
7. [Xử lý sự cố](#xử-lý-sự-cố)

## Yêu cầu phần cứng

- ESP32 (khuyến nghị: ESP32 DevKit V1)
- Cảm biến siêu âm HC-SR04 (đo mực nước)
- Cảm biến nhiệt độ DS18B20
- Cảm biến TDS (đo độ đục)
- Cảm biến lưu lượng YF-S201
- Module relay 1 kênh (điều khiển máy bơm)
- Cảm biến rò rỉ nước
- Dây jumper
- Breadboard hoặc PCB
- Nguồn 5V (có thể sử dụng cổng USB)

## Kết nối phần cứng

### Cảm biến siêu âm HC-SR04

| HC-SR04 | ESP32 |
|---------|-------|
| VCC     | 5V    |
| Trig    | GPIO 5|
| Echo    | GPIO 18|
| GND     | GND   |

### Cảm biến nhiệt độ DS18B20

| DS18B20 | ESP32 |
|---------|-------|
| VCC     | 3.3V  |
| Data    | GPIO 4|
| GND     | GND   |

*Lưu ý: Cần thêm điện trở 4.7kΩ giữa VCC và Data*

### Cảm biến TDS

| TDS     | ESP32 |
|---------|-------|
| VCC     | 5V    |
| Data    | GPIO 34|
| GND     | GND   |

### Cảm biến lưu lượng YF-S201

| YF-S201 | ESP32 |
|---------|-------|
| VCC     | 5V    |
| Data    | GPIO 19|
| GND     | GND   |

### Module relay

| Relay   | ESP32 |
|---------|-------|
| VCC     | 5V    |
| IN      | GPIO 23|
| GND     | GND   |

### Cảm biến rò rỉ nước

| Cảm biến rò rỉ | ESP32 |
|----------------|-------|
| VCC            | 3.3V  |
| Data           | GPIO 35|
| GND            | GND   |

## Cài đặt môi trường phát triển

### Cài đặt Arduino IDE

1. Tải xuống và cài đặt Arduino IDE từ [trang chủ Arduino](https://www.arduino.cc/en/software)
2. Mở Arduino IDE
3. Vào **File > Preferences**
4. Thêm URL sau vào ô "Additional Boards Manager URLs":
   ```
   https://dl.espressif.com/dl/package_esp32_index.json
   ```
5. Nhấn OK
6. Vào **Tools > Board > Boards Manager**
7. Tìm kiếm "esp32" và cài đặt "ESP32 by Espressif Systems"
8. Chọn board ESP32 Dev Module từ **Tools > Board > ESP32 Arduino**

### Cài đặt thư viện

Vào **Tools > Manage Libraries** và cài đặt các thư viện sau:
- PubSubClient (cho MQTT)
- ArduinoJson
- OneWire
- DallasTemperature
- NewPing

## Cấu hình firmware

Tạo một file mới trong Arduino IDE và sao chép mã sau:

```cpp
#include <WiFi.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>
#include <OneWire.h>
#include <DallasTemperature.h>
#include <NewPing.h>

// Cấu hình WiFi
const char* ssid = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";

// Cấu hình MQTT
const char* mqtt_server = "YOUR_MQTT_SERVER_IP";
const int mqtt_port = 1883;
const char* mqtt_topic_sensor = "iot/sensor/data";
const char* mqtt_topic_control = "iot/control";
const char* mqtt_topic_config = "iot/config";
const char* mqtt_topic_leak = "iot/leak";

// Cấu hình chân GPIO
#define TRIGGER_PIN 5
#define ECHO_PIN 18
#define TEMP_PIN 4
#define TDS_PIN 34
#define FLOW_PIN 19
#define PUMP_PIN 23
#define LEAK_PIN 35

// Cấu hình cảm biến siêu âm
#define MAX_DISTANCE 200 // Khoảng cách tối đa (cm)
NewPing sonar(TRIGGER_PIN, ECHO_PIN, MAX_DISTANCE);

// Cấu hình cảm biến nhiệt độ
OneWire oneWire(TEMP_PIN);
DallasTemperature sensors(&oneWire);

// Biến toàn cục
float temperature = 0;
float tds = 0;
float flowRate = 0;
float distance = 0;
int pumpState = 0;
float tankHeight = 15.0; // Chiều cao bể nước (cm)
float currentLevelPercent = 0;
bool leakDetected = false;
int leakType = 0;

// Biến cho cảm biến lưu lượng
volatile int flowPulseCount = 0;
unsigned long lastFlowTime = 0;
float flowCalibrationFactor = 7.5; // Hệ số hiệu chuẩn (có thể thay đổi)

// Biến cho MQTT
WiFiClient espClient;
PubSubClient client(espClient);
unsigned long lastMsg = 0;
char msg[256];

// Hàm callback khi nhận được tin nhắn MQTT
void callback(char* topic, byte* payload, unsigned int length) {
  // Chuyển payload thành chuỗi
  payload[length] = '\0';
  String message = String((char*)payload);
  
  // Xử lý tin nhắn theo topic
  if (String(topic) == mqtt_topic_control) {
    if (message == "on") {
      pumpState = 1;
      digitalWrite(PUMP_PIN, HIGH);
    } else if (message == "off") {
      pumpState = 0;
      digitalWrite(PUMP_PIN, LOW);
    } else if (message == "auto") {
      // Chế độ tự động dựa trên mực nước
      if (currentLevelPercent < 20) {
        pumpState = 1;
        digitalWrite(PUMP_PIN, HIGH);
      } else if (currentLevelPercent > 80) {
        pumpState = 0;
        digitalWrite(PUMP_PIN, LOW);
      }
    } else if (message == "reset_leak") {
      // Đặt lại cảnh báo rò rỉ
      leakDetected = false;
      leakType = 0;
    }
  } else if (String(topic) == mqtt_topic_config) {
    // Xử lý cấu hình
    DynamicJsonDocument doc(1024);
    deserializeJson(doc, message);
    
    if (doc.containsKey("tank_height")) {
      tankHeight = doc["tank_height"];
    }
  }
}

// Hàm kết nối WiFi
void setupWiFi() {
  delay(10);
  Serial.println();
  Serial.print("Đang kết nối với WiFi: ");
  Serial.println(ssid);

  WiFi.begin(ssid, password);

  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }

  Serial.println("");
  Serial.println("Đã kết nối WiFi");
  Serial.println("Địa chỉ IP: ");
  Serial.println(WiFi.localIP());
}

// Hàm kết nối lại MQTT
void reconnect() {
  while (!client.connected()) {
    Serial.print("Đang kết nối MQTT...");
    String clientId = "ESP32Client-";
    clientId += String(random(0xffff), HEX);
    
    if (client.connect(clientId.c_str())) {
      Serial.println("đã kết nối");
      
      // Đăng ký các topic
      client.subscribe(mqtt_topic_control);
      client.subscribe(mqtt_topic_config);
    } else {
      Serial.print("lỗi, rc=");
      Serial.print(client.state());
      Serial.println(" thử lại sau 5 giây");
      delay(5000);
    }
  }
}

// Hàm đọc cảm biến nhiệt độ
void readTemperature() {
  sensors.requestTemperatures();
  temperature = sensors.getTempCByIndex(0);
  if (temperature == DEVICE_DISCONNECTED_C) {
    Serial.println("Lỗi đọc cảm biến nhiệt độ");
    temperature = 0;
  }
}

// Hàm đọc cảm biến TDS
void readTDS() {
  int analogValue = analogRead(TDS_PIN);
  float voltage = analogValue * 3.3 / 4095.0;
  
  // Công thức chuyển đổi điện áp sang TDS (ppm)
  // Công thức này có thể cần hiệu chỉnh dựa trên cảm biến cụ thể
  tds = (133.42 * voltage * voltage * voltage - 255.86 * voltage * voltage + 857.39 * voltage) * 0.5;
  
  if (tds < 0) tds = 0;
}

// Hàm đọc cảm biến siêu âm
void readDistance() {
  distance = sonar.ping_cm();
  if (distance == 0) {
    distance = MAX_DISTANCE;
  }
  
  // Tính phần trăm mực nước
  currentLevelPercent = ((tankHeight - distance) / tankHeight) * 100;
  if (currentLevelPercent < 0) currentLevelPercent = 0;
  if (currentLevelPercent > 100) currentLevelPercent = 100;
}

// Hàm đọc cảm biến lưu lượng
void readFlowRate() {
  // Tính lưu lượng dựa trên số xung
  if (millis() - lastFlowTime > 1000) {
    // Vô hiệu hóa ngắt
    detachInterrupt(digitalPinToInterrupt(FLOW_PIN));
    
    // Tính lưu lượng (L/phút)
    flowRate = ((1000.0 / (millis() - lastFlowTime)) * flowPulseCount) / flowCalibrationFactor;
    
    lastFlowTime = millis();
    flowPulseCount = 0;
    
    // Kích hoạt lại ngắt
    attachInterrupt(digitalPinToInterrupt(FLOW_PIN), flowPulseCounter, FALLING);
  }
}

// Hàm đếm xung cho cảm biến lưu lượng
void IRAM_ATTR flowPulseCounter() {
  flowPulseCount++;
}

// Hàm đọc cảm biến rò rỉ
void readLeakSensor() {
  int leakValue = analogRead(LEAK_PIN);
  
  // Ngưỡng phát hiện rò rỉ (có thể cần hiệu chỉnh)
  if (leakValue > 1000) {
    leakDetected = true;
    
    // Xác định loại rò rỉ dựa trên giá trị cảm biến
    if (leakValue > 3000) {
      leakType = 2; // Rò rỉ nghiêm trọng
    } else {
      leakType = 1; // Rò rỉ nhẹ
    }
    
    // Gửi cảnh báo rò rỉ
    DynamicJsonDocument doc(256);
    doc["detected"] = true;
    doc["type"] = leakType;
    doc["timestamp"] = millis();
    
    char leakMsg[256];
    serializeJson(doc, leakMsg);
    client.publish(mqtt_topic_leak, leakMsg);
  }
}

// Hàm gửi dữ liệu cảm biến qua MQTT
void sendSensorData() {
  DynamicJsonDocument doc(256);
  doc["temperature"] = temperature;
  doc["tds"] = tds;
  doc["flowRate"] = flowRate;
  doc["distance"] = distance;
  doc["pumpState"] = pumpState;
  doc["currentLevelPercent"] = currentLevelPercent;
  doc["leakDetected"] = leakDetected;
  doc["leakType"] = leakType;
  
  serializeJson(doc, msg);
  client.publish(mqtt_topic_sensor, msg);
}

void setup() {
  // Khởi tạo Serial
  Serial.begin(115200);
  
  // Khởi tạo chân GPIO
  pinMode(PUMP_PIN, OUTPUT);
  pinMode(LEAK_PIN, INPUT);
  pinMode(FLOW_PIN, INPUT_PULLUP);
  
  // Khởi tạo cảm biến nhiệt độ
  sensors.begin();
  
  // Khởi tạo ngắt cho cảm biến lưu lượng
  attachInterrupt(digitalPinToInterrupt(FLOW_PIN), flowPulseCounter, FALLING);
  
  // Kết nối WiFi
  setupWiFi();
  
  // Cấu hình MQTT
  client.setServer(mqtt_server, mqtt_port);
  client.setCallback(callback);
  
  // Khởi tạo thời gian
  lastFlowTime = millis();
}

void loop() {
  // Kiểm tra kết nối MQTT
  if (!client.connected()) {
    reconnect();
  }
  client.loop();

  // Đọc dữ liệu từ các cảm biến
  readTemperature();
  readTDS();
  readDistance();
  readFlowRate();
  readLeakSensor();
  
  // Gửi dữ liệu mỗi 2 giây
  unsigned long now = millis();
  if (now - lastMsg > 2000) {
    lastMsg = now;
    sendSensorData();
    
    // In dữ liệu ra Serial để debug
    Serial.print("Nhiệt độ: ");
    Serial.print(temperature);
    Serial.print("°C | TDS: ");
    Serial.print(tds);
    Serial.print(" ppm | Lưu lượng: ");
    Serial.print(flowRate);
    Serial.print(" L/phút | Khoảng cách: ");
    Serial.print(distance);
    Serial.print(" cm | Mực nước: ");
    Serial.print(currentLevelPercent);
    Serial.print("% | Máy bơm: ");
    Serial.print(pumpState ? "BẬT" : "TẮT");
    Serial.print(" | Rò rỉ: ");
    Serial.println(leakDetected ? "CÓ" : "KHÔNG");
  }
}
```

### Thay đổi cấu hình

Bạn cần thay đổi các thông số sau trong mã:

1. Cấu hình WiFi:
   ```cpp
   const char* ssid = "YOUR_WIFI_SSID";
   const char* password = "YOUR_WIFI_PASSWORD";
   ```

2. Cấu hình MQTT:
   ```cpp
   const char* mqtt_server = "YOUR_MQTT_SERVER_IP";
   ```
   *Lưu ý: Thay `YOUR_MQTT_SERVER_IP` bằng địa chỉ IP của máy tính đang chạy Mosquitto MQTT Broker*

3. Cấu hình chiều cao bể nước:
   ```cpp
   float tankHeight = 15.0; // Chiều cao bể nước (cm)
   ```

4. Hệ số hiệu chuẩn cảm biến lưu lượng:
   ```cpp
   float flowCalibrationFactor = 7.5; // Hệ số hiệu chuẩn (có thể thay đổi)
   ```

## Nạp firmware

1. Kết nối ESP32 với máy tính qua cáp USB
2. Chọn cổng COM đúng từ **Tools > Port**
3. Nhấn nút **Upload** để nạp firmware

## Kiểm tra kết nối

1. Mở Serial Monitor (**Tools > Serial Monitor**) và đặt tốc độ baud là 115200
2. Kiểm tra xem ESP32 có kết nối với WiFi và MQTT Broker không
3. Kiểm tra xem dữ liệu cảm biến có được hiển thị không
4. Khởi động hệ thống bằng script `start-hardware.sh`
5. Truy cập giao diện người dùng tại `http://localhost:3000` và kiểm tra xem dữ liệu có được hiển thị không

## Xử lý sự cố

### ESP32 không kết nối được với WiFi

- Kiểm tra lại SSID và mật khẩu WiFi
- Đảm bảo ESP32 nằm trong vùng phủ sóng của WiFi
- Thử khởi động lại ESP32

### ESP32 không kết nối được với MQTT Broker

- Kiểm tra địa chỉ IP của MQTT Broker
- Đảm bảo Mosquitto đã được khởi động
- Kiểm tra xem cổng 1883 đã được mở chưa
- Đảm bảo ESP32 và máy tính nằm trong cùng một mạng

### Cảm biến không hoạt động

- Kiểm tra kết nối phần cứng
- Kiểm tra xem cảm biến có bị hỏng không
- Kiểm tra mã nguồn để đảm bảo chân GPIO đã được cấu hình đúng

### Dữ liệu không được hiển thị trên giao diện người dùng

- Kiểm tra xem ESP32 có gửi dữ liệu không (qua Serial Monitor)
- Kiểm tra xem Backend có nhận được dữ liệu không
- Kiểm tra xem WebSocket có hoạt động không
