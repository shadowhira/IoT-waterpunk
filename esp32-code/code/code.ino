#include <WiFi.h>
#include <PubSubClient.h>
#include <OneWire.h>
#include <DallasTemperature.h>
#include <Wire.h>
#include <LiquidCrystal_I2C.h>
#include <EEPROM.h>
#include <ArduinoJson.h>

// Thêm vào sau struct SystemConfig
struct SystemState {
  uint32_t magicNumber;
  int controlMode;
  bool pumpState;
  int desiredLevel;
  byte checksum;
};

// Các biến trạng thái hệ thống
bool leakDetected = false;
unsigned long pumpStartTime = 0;
uint16_t PUMP_TIMEOUT = 300000; // 5 phút tính bằng milliseconds
bool ALERTS_ENABLED = true;

// Cấu trúc dữ liệu cho cấu hình hệ thống
struct SystemConfig {
  uint32_t magicNumber;
  float tankHeight;
  float maxTemp;
  float maxTds;
  float leakThreshold;
  float flowThreshold;
  uint16_t pumpTimeout;
  bool alertsEnabled;
  byte checksum;
};

// LCD I2C
LiquidCrystal_I2C lcd(0x27, 16, 2);

// Định nghĩa địa chỉ EEPROM
#define EEPROM_SIZE 512
#define EEPROM_CONFIG_ADDR 0
#define EEPROM_STATE_ADDR 200
#define EEPROM_MAGIC_NUMBER 0xAB // Số ma thuật để kiểm tra tính hợp lệ của dữ liệu

// WiFi thông tin
// const char* ssid = "Phong701";
// const char* password = "phong701";
// const char* ssid = "Nguyen Van Tri";
// const char* password = "26111952";
// const char* ssid = "Tang 4";
// const char* password = "66666666";
const char* ssid = "Dat’s phone";
const char* password = "12345678";
// const char* ssid = "Tenda_189718";
// const char* password = "88888888";

// MQTT thông tin
// const char* mqttServer = "192.168.100.252"; // Home
const char* mqttServer = "172.20.10.2"; // Dat
// const char* mqttServer = "192.168.0.105"; // Dat
// const char* mqttServer = "192.168.0.112"; // Bach

const int mqttPort = 2403;
const char* mqttDataTopic = "/sensor/data";
const char* controlTopic = "/sensor/control";
const char* levelTopic = "/sensor/level";
const char* configTopic = "/sensor/config";
const char* configStatusTopic = "/sensor/config/status";
const char* leakAlertTopic = "/sensor/leak/alert";

WiFiClient espClient;
PubSubClient client(espClient);

// Relay điều khiển máy bơm
int pumpPin = 12;

// DS18B20 cảm biến nhiệt độ
#define ONE_WIRE_PIN 5
OneWire oneWire(ONE_WIRE_PIN);
DallasTemperature sensors(&oneWire);

// TDS cảm biến
#define TDS_PIN 34
float tdsValue = 0.0;
const float VREF = 3.3;
const float TDS_FACTOR = 0.5;

// Cảm biến lưu lượng nước
#define FLOW_SENSOR_PIN 4
volatile int pulseCount = 0;
float flowRate = 0.0;

// Cảm biến siêu âm HCSR04
#define TRIG_PIN 17
#define ECHO_PIN 16
float distance = 0.0;

// Cấu hình hệ thống - có thể thay đổi từ xa
float TANK_HEIGHT = 15.0; // Chiều cao bể nước (cm)
float MAX_TEMP = 35.0;    // Ngưỡng nhiệt độ tối đa
float MAX_TDS = 500.0;    // Ngưỡng TDS tối đa

// Cấu hình phát hiện rò rỉ
float LEAK_THRESHOLD = 0.5;      // Ngưỡng giảm mực nước bất thường (cm/phút)
float FLOW_THRESHOLD = 0.2;      // Ngưỡng lưu lượng bất thường khi không bơm (L/phút)

// Biến điều khiển
int controlMode = 2; // 0: Tắt thủ công, 1: Bật thủ công, 2: Tự động
unsigned long manualControlStartTime = 0;
const unsigned long manualControlDuration = 60000; // Thời gian ưu tiên chế độ thủ công
int desiredLevelPercent = 100; // Mức nước mong muốn từ backend

// Trạng thái máy bơm
bool pumpState = false; // 1 là bật, 0 là tắt

// Biến cập nhật thời gian
unsigned long lastLogTime = 0;
unsigned long lastLCDTime = 0;
unsigned long lastToggleLCD = 0;
unsigned long lastLeakCheckTime = 0;
bool showTemp = true;
float temperatureC = 0;

// Biến phát hiện rò rỉ
float previousDistance = 0.0;
float previousFlowRate = 0.0;
int leakType = 0;  // 0: Không rò rỉ, 1: Rò rỉ mực nước, 2: Rò rỉ lưu lượng
unsigned long leakDetectedTime = 0;

// Thời gian tự động đặt lại cảnh báo (mặc định: 5 phút)
#define AUTO_RESET_LEAK_TIME 300000 // 5 phút tính bằng mili giây

// Ngắt lưu lượng nước
void IRAM_ATTR pulseCounter() {
  pulseCount++;
}

// Đọc khoảng cách từ cảm biến siêu âm
float measureDistance() {
  digitalWrite(TRIG_PIN, LOW);
  delayMicroseconds(2);
  digitalWrite(TRIG_PIN, HIGH);
  delayMicroseconds(10);
  digitalWrite(TRIG_PIN, LOW);

  long duration = pulseIn(ECHO_PIN, HIGH);
  float rawDistance = (duration * 0.034) / 2;

  // Thêm kiểm tra giá trị hợp lệ
  if (rawDistance < 0 || rawDistance > TANK_HEIGHT * 2) {
    return -1;  // Giá trị không hợp lệ
  }

  return rawDistance;
}

// Thêm các biến cho bộ lọc
const unsigned long LEAK_CHECK_INTERVAL = 5000; // 5 giây
const int DISTANCE_SAMPLES = 5; // Số mẫu để tính trung bình
float distanceBuffer[DISTANCE_SAMPLES]; // Buffer lưu các giá trị khoảng cách
int bufferIndex = 0;

// Hàm lọc nhiễu cho khoảng cách
float filterDistance(float rawDistance) {
  if (rawDistance < 0 || rawDistance > TANK_HEIGHT) {
    return -1; // Giá trị không hợp lệ
  }
  
  // Cập nhật buffer
  distanceBuffer[bufferIndex] = rawDistance;
  bufferIndex = (bufferIndex + 1) % DISTANCE_SAMPLES;
  
  // Tính trung bình
  float sum = 0;
  for (int i = 0; i < DISTANCE_SAMPLES; i++) {
    sum += distanceBuffer[i];
  }
  return sum / DISTANCE_SAMPLES;
}

// Phát hiện rò rỉ
void checkForLeaks() {
  if (!ALERTS_ENABLED) {
    return;
  }

  unsigned long currentTime = millis();
  
  // 1. Kiểm tra rò rỉ qua mực nước (Loại 1)
  if (!pumpState && currentTime - lastLeakCheckTime >= LEAK_CHECK_INTERVAL) {
    float filteredDist = filterDistance(distance);
    if (filteredDist > 0) { // Kiểm tra giá trị hợp lệ
      
      float timeElapsed = (currentTime - lastLeakCheckTime) / 60000.0; // Chuyển sang phút
      float distanceChange = filteredDist - previousDistance;
      float rateOfChange = distanceChange / timeElapsed;

      Serial.println("\n=== Kiểm tra rò rỉ mực nước ===");
      Serial.printf("Khoảng cách: %.2f cm -> %.2f cm (%.2f cm/phút)\n", 
                   previousDistance, filteredDist, rateOfChange);

      // Chỉ cảnh báo khi mực nước GIẢM (khoảng cách TĂNG) và vượt ngưỡng
      if (rateOfChange > LEAK_THRESHOLD && !leakDetected) {
        leakDetected = true;
        leakType = 1;
        leakDetectedTime = currentTime;

        String alertMsg = "{\"type\":\"leak\",\"source\":\"water_level\",\"value\":" + String(rateOfChange) + "}";
        client.publish(leakAlertTopic, alertMsg.c_str());
        
        Serial.println("CẢNH BÁO: Phát hiện rò rỉ mực nước!");
        Serial.printf("Tốc độ giảm: %.2f cm/phút (Ngưỡng: %.2f)\n", rateOfChange, LEAK_THRESHOLD);
      }

      previousDistance = filteredDist;
      lastLeakCheckTime = currentTime;
    }
  }

  // 2. Kiểm tra rò rỉ qua lưu lượng (Loại 2)
  if (!pumpState && flowRate > 0) {
    static unsigned long flowCheckStart = 0;
    static bool flowDetected = false;

    if (flowRate > FLOW_THRESHOLD) {
      if (!flowDetected) {
        flowDetected = true;
        flowCheckStart = currentTime;
      }
      // Chỉ cảnh báo nếu lưu lượng bất thường kéo dài > 5 giây
      else if (currentTime - flowCheckStart > 5000 && !leakDetected) {
        leakDetected = true;
        leakType = 2;
        leakDetectedTime = currentTime;

        String alertMsg = "{\"type\":\"leak\",\"source\":\"flow_rate\",\"value\":" + String(flowRate) + "}";
        client.publish(leakAlertTopic, alertMsg.c_str());

        Serial.println("CẢNH BÁO: Phát hiện rò rỉ qua lưu lượng!");
        Serial.printf("Lưu lượng: %.2f L/phút (Ngưỡng: %.2f)\n", flowRate, FLOW_THRESHOLD);
      }
    } else {
      flowDetected = false;
    }
  }

  // 3. Kiểm tra timeout máy bơm (Loại 3)
  if (pumpState && pumpStartTime > 0) {
    if (currentTime - pumpStartTime > PUMP_TIMEOUT && !leakDetected) {
      leakDetected = true;
      leakType = 3;
      leakDetectedTime = currentTime;

      String alertMsg = "{\"type\":\"leak\",\"source\":\"pump_timeout\",\"value\":" + String(PUMP_TIMEOUT/1000) + "}";
      client.publish(leakAlertTopic, alertMsg.c_str());

      // Tắt máy bơm
      digitalWrite(pumpPin, LOW);
      pumpState = false;
      
      Serial.println("CẢNH BÁO: Máy bơm hoạt động quá thời gian!");
    }
  }
}

// MQTT callback
void callback(char* topic, byte* payload, unsigned int length) {
  String message;
  for (int i = 0; i < length; i++) {
    message += (char)payload[i];
  }
  
  if (String(topic) == controlTopic) {
    if (message == "on") {
      controlMode = 1;  // Chế độ bật thủ công
      manualControlStartTime = millis();
      digitalWrite(pumpPin, HIGH);
      pumpState = true;
      pumpStartTime = millis();  // Ghi nhận thời điểm bắt đầu bơm
    } 
    else if (message == "off") {
      controlMode = 0;  // Chế độ tắt thủ công
      manualControlStartTime = millis();
      digitalWrite(pumpPin, LOW);
      pumpState = false;
      pumpStartTime = 0;  // Reset thời gian bơm
    }
    else if (message == "auto") {
      controlMode = 2;  // Chế độ tự động
    }
    else if (message == "reset_leak") {
      // Đặt lại cảnh báo rò rỉ
      leakDetected = false;
      leakType = 0;
      
      // Gửi thông báo đặt lại cảnh báo
      String alertMsg = "{\"type\":\"leak_reset\",\"status\":\"manual\"}";
      client.publish(leakAlertTopic, alertMsg.c_str());
    }
    
    // Lưu trạng thái mới vào EEPROM
    saveStateToEEPROM();
  }
  else if (String(topic) == levelTopic) {
    // Cập nhật mức nước mong muốn
    desiredLevelPercent = message.toInt();
    if (desiredLevelPercent < 0) desiredLevelPercent = 0;
    if (desiredLevelPercent > 100) desiredLevelPercent = 100;
    
    // Lưu trạng thái mới
    saveStateToEEPROM();
  }
  else if (String(topic) == configTopic) {
    Serial.println("Nhận cấu hình mới từ server:");
    Serial.println(message);
    
    StaticJsonDocument<256> doc;
    DeserializationError error = deserializeJson(doc, message);
    
    if (error) {
      Serial.print("Lỗi parse JSON: ");
      Serial.println(error.c_str());
      return;
    }

    bool configChanged = false;
    String changedParams = "Các thông số đã thay đổi:\n";

    // Cập nhật từng thông số nếu có trong message
    if (doc.containsKey("tank_height")) {
      float newValue = doc["tank_height"];
      if (TANK_HEIGHT != newValue) {
        TANK_HEIGHT = newValue;
        configChanged = true;
        changedParams += "- Chiều cao bể: " + String(newValue) + " cm\n";
      }
    }

    if (doc.containsKey("max_temp")) {
      float newValue = doc["max_temp"];
      if (MAX_TEMP != newValue) {
        MAX_TEMP = newValue;
        configChanged = true;
        changedParams += "- Nhiệt độ tối đa: " + String(newValue) + "°C\n";
      }
    }

    if (doc.containsKey("max_tds")) {
      float newValue = doc["max_tds"];
      if (MAX_TDS != newValue) {
        MAX_TDS = newValue;
        configChanged = true;
        changedParams += "- TDS tối đa: " + String(newValue) + " ppm\n";
      }
    }

    if (doc.containsKey("leak_threshold")) {
      float newValue = doc["leak_threshold"];
      if (LEAK_THRESHOLD != newValue) {
        LEAK_THRESHOLD = newValue;
        configChanged = true;
        changedParams += "- Ngưỡng rò rỉ: " + String(newValue) + " cm/phút\n";
      }
    }

    if (doc.containsKey("flow_threshold")) {
      float newValue = doc["flow_threshold"];
      if (FLOW_THRESHOLD != newValue) {
        FLOW_THRESHOLD = newValue;
        configChanged = true;
        changedParams += "- Ngưỡng lưu lượng: " + String(newValue) + " L/phút\n";
      }
    }

    if (doc.containsKey("pump_timeout")) {
      uint16_t newValue = doc["pump_timeout"];
      if (PUMP_TIMEOUT != newValue) {
        PUMP_TIMEOUT = newValue;
        configChanged = true;
        changedParams += "- Thời gian timeout máy bơm: " + String(newValue) + " ms\n";
      }
    }

    if (doc.containsKey("alerts_enabled")) {
      bool newValue = doc["alerts_enabled"];
      if (ALERTS_ENABLED != newValue) {
        ALERTS_ENABLED = newValue;
        configChanged = true;
        changedParams += "- Trạng thái cảnh báo: " + String(newValue ? "Bật" : "Tắt") + "\n";
      }
      if(ALERTS_ENABLED == false){
        leakDetected = false;
        leakType = 0;
      }
    }

    // Nếu có thay đổi, lưu vào EEPROM và gửi xác nhận
    if (configChanged) {
      Serial.println(changedParams);
      saveConfigToEEPROM();
      
      // Gửi xác nhận cập nhật
      String confirmMsg = "{\"status\":\"updated\",\"message\":\"Đã cập nhật cấu hình\"}";
      client.publish(configStatusTopic, confirmMsg.c_str());
      
      // Gửi lại cấu hình hiện tại
      sendCurrentConfig();
    }
  }
}

// Gửi cấu hình hiện tại
void sendCurrentConfig() {
  String configMsg = "{";
  configMsg += "\"tank_height\":" + String(TANK_HEIGHT) + ",";
  configMsg += "\"max_temp\":" + String(MAX_TEMP) + ",";
  configMsg += "\"max_tds\":" + String(MAX_TDS) + ",";
  configMsg += "\"leak_threshold\":" + String(LEAK_THRESHOLD) + ",";
  configMsg += "\"flow_threshold\":" + String(FLOW_THRESHOLD) + ",";
  configMsg += "\"pump_timeout\":" + String(PUMP_TIMEOUT) + ",";
  configMsg += "\"alerts_enabled\":" + String(ALERTS_ENABLED ? "true" : "false");
  configMsg += "}";

  client.publish(configStatusTopic, configMsg.c_str());
}

// Kết nối MQTT với timeout
void connectToMQTT() {
  // Nếu không có kết nối WiFi, không cố gắng kết nối MQTT
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("Không có kết nối WiFi, bỏ qua kết nối MQTT");
    return;
  }

  // Thử kết nối MQTT với timeout
  Serial.println("Thử kết nối MQTT...");
  int attempts = 0;
  const int maxAttempts = 3; // Số lần thử tối đa

  while (!client.connected() && attempts < maxAttempts) {
    Serial.print("Lần thử ");
    Serial.print(attempts + 1);
    Serial.print("/");
    Serial.println(maxAttempts);

    if (client.connect("ESP32Client")) {
      Serial.println("Kết nối MQTT thành công!");
      client.subscribe(controlTopic);
      client.subscribe(levelTopic);
      client.subscribe(configTopic);

      // Gửi cấu hình hiện tại khi kết nối
      sendCurrentConfig();
      return; // Thoát khỏi hàm nếu kết nối thành công
    } else {
      Serial.println("Kết nối MQTT thất bại, thử lại sau 2 giây...");
      delay(2000);
      attempts++;
    }
  }

  if (!client.connected()) {
    Serial.println("Không thể kết nối MQTT sau nhiều lần thử. Tiếp tục chạy offline.");
  }
}

// Kiểm tra cảm biến và điều khiển máy bơm
void handleSensorLogic() {
  // Đọc dữ liệu cảm biến nhiệt độ
  sensors.requestTemperatures();
  float tempReading = sensors.getTempCByIndex(0);
  // Kiểm tra giá trị hợp lệ trước khi gán
  if (tempReading != DEVICE_DISCONNECTED_C && tempReading > -100) {
    temperatureC = tempReading;
  } else {
    Serial.println("Lỗi đọc cảm biến nhiệt độ");
  }

  // Đọc dữ liệu cảm biến TDS
  int sensorValue = analogRead(TDS_PIN);
  float voltage = sensorValue * (VREF / 4095.0);
  tdsValue = (133.42 * voltage * voltage * voltage
              - 255.86 * voltage * voltage
              + 857.39 * voltage) * TDS_FACTOR;

  // Đọc dữ liệu cảm biến lưu lượng
  flowRate = pulseCount / 7.5 / 30;
  pulseCount = 0;

  // Đọc dữ liệu cảm biến khoảng cách
  float distanceReading = measureDistance();
  if (distanceReading >= 0 && distanceReading <= TANK_HEIGHT * 2) { // Kiểm tra giá trị hợp lệ
    distance = distanceReading;
  } else {
    Serial.println("Lỗi đọc cảm biến khoảng cách");
  }

  // Tính toán phần trăm mực nước
  float currentLevelPercent = ((TANK_HEIGHT - distance) / TANK_HEIGHT) * 100.0;
  if (currentLevelPercent < 0) currentLevelPercent = 0;
  if (currentLevelPercent > 100) currentLevelPercent = 100;

  // In ra Serial để debug
  // Serial.println("Thông số cảm biến:");
  // Serial.print("Nhiệt độ: "); Serial.print(temperatureC); Serial.println(" *C");
  // Serial.print("TDS: "); Serial.print(tdsValue); Serial.println(" ppm");
  // Serial.print("Lưu lượng: "); Serial.print(flowRate); Serial.println(" L/phút");
  // Serial.print("Khoảng cách: "); Serial.print(distance); Serial.println(" cm");
  // Serial.print("Mực nước: "); Serial.print(currentLevelPercent); Serial.println(" %");
  // Serial.print("Máy bơm: "); Serial.println(pumpState ? "BẬT" : "TẮT");
  


  // Kiểm tra rò rỉ
  checkForLeaks();

  // Nếu phát hiện rò rỉ nghiêm trọng, tắt máy bơm
  if (leakDetected && (leakType == 1 || leakType == 2)) {
    if (pumpState) {
      digitalWrite(pumpPin, LOW);
      pumpState = false;
    }
    return; // Không thực hiện các logic khác
  }

  // Nếu chế độ thủ công, ưu tiên thực thi
  if (controlMode == 0 || controlMode == 1) {
    if (millis() - manualControlStartTime > manualControlDuration) {
      controlMode = 2; // Quay lại chế độ tự động sau thời gian ưu tiên
    }

    // Ghi nhận thời điểm bắt đầu bơm nếu máy bơm đang bật
    if (pumpState && pumpStartTime == 0) {
      pumpStartTime = millis();
    }
    return;
  }

  // Chế độ tự động
  if (controlMode == 2) {
    bool pumpStateChanged = false;

    if (temperatureC > MAX_TEMP || tdsValue > MAX_TDS || currentLevelPercent > 75) {
      if (pumpState) {
        digitalWrite(pumpPin, LOW);
        pumpState = false;
        pumpStartTime = 0; // Đặt lại thời gian bơm
        pumpStateChanged = true;
      }
    } else if (currentLevelPercent < desiredLevelPercent) {
      if (!pumpState) {
        digitalWrite(pumpPin, HIGH);
        pumpState = true;
        pumpStartTime = millis(); // Ghi nhận thời điểm bắt đầu bơm
        pumpStateChanged = true;
      }
    } else {
      if (pumpState) {
        digitalWrite(pumpPin, LOW);
        pumpState = false;
        pumpStartTime = 0; // Đặt lại thời gian bơm
        pumpStateChanged = true;
      }
    }

    // Lưu trạng thái vào EEPROM nếu có thay đổi
    if (pumpStateChanged) {
      saveStateToEEPROM();
    }
  }
}

// Gửi dữ liệu MQTT
void sendDataToMQTT() {
  String payload = "{";
  payload += "\"temperature\":" + String(temperatureC) + ",";
  payload += "\"tds\":" + String(tdsValue) + ",";
  payload += "\"flowRate\":" + String(flowRate) + ",";
  payload += "\"distance\":" + String(distance) + ",";
  payload += "\"pumpState\":" + String(pumpState ? "1" : "0") + ",";
  payload += "\"currentLevelPercent\":" + String(((TANK_HEIGHT - distance) / TANK_HEIGHT) * 100.0) + ",";
  payload += "\"leakDetected\":" + String(leakDetected ? "1" : "0") + ",";
  payload += "\"leakType\":" + String(leakType);
  payload += "}";
  client.publish(mqttDataTopic, payload.c_str());
}

// Cập nhật LCD
void updateLCD() {
  lcd.clear();
  float currentLevelPercent = ((TANK_HEIGHT - distance) / TANK_HEIGHT) * 100.0;

  // Hiển thị cảnh báo rò rỉ nếu có
  if (leakDetected) {
    lcd.setCursor(0, 0);
    lcd.print("LEAK DETECTED!");
    lcd.setCursor(0, 1);

    switch (leakType) {
      case 1:
        lcd.print("Water Level Drop");
        break;
      case 2:
        lcd.print("Flow Rate Leak");
        break;
      case 3:
        lcd.print("Pump Timeout");
        break;
      default:
        lcd.print("Unknown Type");
    }
    return;
  }

  // Hiển thị thông tin bình thường
  if (showTemp) {
    lcd.setCursor(0, 0);
    lcd.print("Temp:" + String(temperatureC) + "(*C)");
    lcd.setCursor(0, 1);
    lcd.print("TDS:" + String(tdsValue) + " ppm");
  } else {
    lcd.setCursor(0, 0);
    lcd.print("Flow:" + String(flowRate) + "(L/min)");
    lcd.setCursor(0, 1);
    lcd.print("L:" + String(currentLevelPercent) + "%" + " P:" + String(pumpState == 1 ? "ON" : "OFF"));
  }
}

// Tính toán checksum đơn giản
byte calculateChecksum(byte* data, int length) {
  byte checksum = 0;
  for (int i = 0; i < length; i++) {
    checksum ^= data[i]; // XOR tất cả các byte
  }
  return checksum;
}

// Lưu cấu hình vào EEPROM
void saveConfigToEEPROM() {
  Serial.println("\n=== Đang lưu cấu hình vào EEPROM ===");
  
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

  // In thông tin cấu hình đã lưu
  Serial.println("Cấu hình hiện tại:");
  Serial.println("- Chiều cao bể: " + String(TANK_HEIGHT) + " cm");
  Serial.println("- Nhiệt độ tối đa: " + String(MAX_TEMP) + " °C");
  Serial.println("- TDS tối đa: " + String(MAX_TDS) + " ppm");
  Serial.println("- Ngưỡng rò rỉ: " + String(LEAK_THRESHOLD));
  Serial.println("- Ngưỡng dòng chảy: " + String(FLOW_THRESHOLD));
  Serial.println("- Trạng thái cảnh báo: " + String(ALERTS_ENABLED ? "Bật" : "Tắt"));
  Serial.println("Kết quả lưu: " + String(success ? "Thành công" : "Thất bại"));
}

// Đọc cấu hình từ EEPROM
bool loadConfigFromEEPROM() {
  SystemConfig config;
  EEPROM.get(EEPROM_CONFIG_ADDR, config);

  // Kiểm tra magic number và checksum
  if (config.magicNumber != EEPROM_MAGIC_NUMBER) {
    Serial.println("Magic number không hợp lệ");
    return false;
  }

  byte calculatedChecksum = calculateChecksum((byte*)&config, sizeof(config) - 1);
  if (calculatedChecksum != config.checksum) {
    Serial.println("Checksum không hợp lệ");
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

  Serial.println("Đã đọc cấu hình từ EEPROM thành công");
  Serial.println("Trạng thái cảnh báo: " + String(ALERTS_ENABLED ? "Bật" : "Tắt"));
  
  // Gửi xác nhận cấu hình hiện tại
  sendCurrentConfig();
  return true;
}

// Hàm tính checksum cho SystemState
byte calculateStateChecksum(SystemState* state) {
  byte checksum = 0;
  // Bắt đầu từ magicNumber
  checksum ^= (state->magicNumber & 0xFF);
  checksum ^= ((state->magicNumber >> 8) & 0xFF);
  checksum ^= ((state->magicNumber >> 16) & 0xFF);
  checksum ^= ((state->magicNumber >> 24) & 0xFF);
  
  // Control mode
  checksum ^= state->controlMode;
  
  // Pump state
  checksum ^= state->pumpState ? 1 : 0;
  
  // Desired level
  checksum ^= (state->desiredLevel & 0xFF);
  checksum ^= ((state->desiredLevel >> 8) & 0xFF);
  
  return checksum;
}

// Lưu trạng thái vào EEPROM
void saveStateToEEPROM() {
  Serial.println("\n=== Lưu trạng thái vào EEPROM ===");
  
  SystemState state;
  state.magicNumber = EEPROM_MAGIC_NUMBER;
  state.controlMode = controlMode;
  state.pumpState = pumpState;
  state.desiredLevel = desiredLevelPercent;
  
  // Tính checksum trước khi lưu
  state.checksum = calculateStateChecksum(&state);

  // In thông tin debug
  Serial.print("Magic Number: 0x"); Serial.println(state.magicNumber, HEX);
  Serial.print("Control Mode: "); Serial.println(state.controlMode);
  Serial.print("Pump State: "); Serial.println(state.pumpState);
  Serial.print("Desired Level: "); Serial.println(state.desiredLevel);
  Serial.print("Calculated Checksum: 0x"); Serial.println(state.checksum, HEX);
  
  // Lưu vào EEPROM
  EEPROM.put(EEPROM_STATE_ADDR, state);
  bool success = EEPROM.commit();
  
  if (success) {
    Serial.println("Lưu trạng thái thành công!");
    printCurrentState();
  } else {
    Serial.println("Lỗi khi lưu trạng thái!");
  }
}

// Đọc trạng thái từ EEPROM
bool loadStateFromEEPROM() {
  Serial.println("\n=== Đọc trạng thái từ EEPROM ===");
  
  SystemState state;
  EEPROM.get(EEPROM_STATE_ADDR, state);

  // Kiểm tra magic number
  Serial.print("Magic Number đọc được: 0x"); Serial.println(state.magicNumber, HEX);
  Serial.print("Magic Number mong đợi: 0x"); Serial.println(EEPROM_MAGIC_NUMBER, HEX);

  if (state.magicNumber != EEPROM_MAGIC_NUMBER) {
    Serial.println("Magic number không hợp lệ!");
    return false;
  }

  // Lưu checksum đọc được
  byte storedChecksum = state.checksum;
  
  // Tính toán lại checksum
  byte calculatedChecksum = calculateStateChecksum(&state);

  Serial.print("Checksum đọc được: 0x"); Serial.println(storedChecksum, HEX);
  Serial.print("Checksum tính toán: 0x"); Serial.println(calculatedChecksum, HEX);

  if (calculatedChecksum != storedChecksum) {
    Serial.println("Lỗi checksum!");
    Serial.println("Giá trị đọc được:");
    Serial.print("Control Mode: "); Serial.println(state.controlMode);
    Serial.print("Pump State: "); Serial.println(state.pumpState);
    Serial.print("Desired Level: "); Serial.println(state.desiredLevel);
    return false;
  }

  // Kiểm tra tính hợp lệ của các giá trị
  if (state.controlMode < 0 || state.controlMode > 2) {
    Serial.println("Control mode không hợp lệ!");
    return false;
  }
  
  if (state.desiredLevel < 0 || state.desiredLevel > 100) {
    Serial.println("Desired level không hợp lệ!");
    return false;
  }

  // Cập nhật trạng thái
  controlMode = state.controlMode;
  pumpState = state.pumpState;
  desiredLevelPercent = state.desiredLevel;

  Serial.println("Đọc trạng thái thành công!");
  printCurrentState();
  return true;
}

// Hàm in trạng thái hiện tại
void printCurrentState() {
  Serial.println("\n=== Trạng thái hiện tại ===");
  Serial.print("Control Mode: "); 
  switch(controlMode) {
    case 0: Serial.println("Tắt thủ công"); break;
    case 1: Serial.println("Bật thủ công"); break;
    case 2: Serial.println("Tự động"); break;
  }
  Serial.print("Pump State: "); Serial.println(pumpState ? "ON" : "OFF");
  Serial.print("Desired Level: "); Serial.print(desiredLevelPercent); Serial.println("%");
}

void clearEEPROM() {
  Serial.println("Xóa EEPROM...");
  for (int i = 0; i < EEPROM_SIZE; i++) {
    EEPROM.write(i, 0);
  }
  EEPROM.commit();
  Serial.println("Đã xóa EEPROM");
}

void setup() {
  Serial.begin(115200);
  
  // Khởi tạo EEPROM với kích thước đủ lớn
  if (!EEPROM.begin(EEPROM_SIZE)) {
    Serial.println("Lỗi khởi tạo EEPROM!");
    return;
  }
  
  // Đọc cấu hình
  if (!loadConfigFromEEPROM()) {
    Serial.println("Sử dụng cấu hình mặc định");
    saveConfigToEEPROM();
  }
  
  // Đọc trạng thái
  if (!loadStateFromEEPROM()) {
    Serial.println("Sử dụng trạng thái mặc định");
    // Đặt các giá trị mặc định
    controlMode = 2; // Tự động
    pumpState = false;
    desiredLevelPercent = 100;
    saveStateToEEPROM();
  }
  
  // Khởi tạo các chân GPIO
  pinMode(pumpPin, OUTPUT);
  digitalWrite(pumpPin, LOW); // Mặc định tắt máy bơm

  pinMode(FLOW_SENSOR_PIN, INPUT_PULLUP);
  attachInterrupt(digitalPinToInterrupt(FLOW_SENSOR_PIN), pulseCounter, RISING);

  pinMode(TRIG_PIN, OUTPUT);
  pinMode(ECHO_PIN, INPUT);

  // Khởi tạo cảm biến nhiệt độ
  sensors.begin();

  // Khởi tạo LCD
  lcd.init();
  lcd.backlight();

  // Hiển thị thông báo khởi động
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("IoT Water System");
  lcd.setCursor(0, 1);
  lcd.print("Initializing...");

  // Đọc cấu hình từ EEPROM
  Serial.println("\n=== Đang đọc cấu hình từ EEPROM ===");
  if (!loadConfigFromEEPROM()) {
    Serial.println("Sử dụng cấu hình mặc định và lưu vào EEPROM");
    saveConfigToEEPROM();
  }

  // Đọc trạng thái từ EEPROM
  Serial.println("\n=== Đang đọc trạng thái từ EEPROM ===");
  if (!loadStateFromEEPROM()) {
    Serial.println("Sử dụng trạng thái mặc định và lưu vào EEPROM");
    saveStateToEEPROM();
  }

  // Khởi tạo các giá trị ban đầu cho phát hiện rò rỉ
  previousDistance = 0;
  previousFlowRate = 0;
  lastLeakCheckTime = millis();
  leakDetected = false;
  leakType = 0;

  // Kết nối WiFi với timeout
  WiFi.begin(ssid, password);
  int wifiAttempts = 0;
  const int maxAttempts = 20; // 10 giây timeout

  while (WiFi.status() != WL_CONNECTED && wifiAttempts < maxAttempts) {
    delay(500);
    Serial.print(".");
    wifiAttempts++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\nĐã kết nối WiFi thành công!");
    Serial.print("Địa chỉ IP: ");
    Serial.println(WiFi.localIP());
  } else {
    Serial.println("\nKhông thể kết nối WiFi. Tiếp tục với chế độ offline.");
  }

  // Thiết lập MQTT
  client.setServer(mqttServer, mqttPort);
  client.setCallback(callback);

  // Khởi tạo cảm biến
  sensors.begin();
  pinMode(pumpPin, OUTPUT);
  digitalWrite(pumpPin, LOW);

  pinMode(FLOW_SENSOR_PIN, INPUT_PULLUP);
  attachInterrupt(digitalPinToInterrupt(FLOW_SENSOR_PIN), pulseCounter, RISING);

  pinMode(TRIG_PIN, OUTPUT);
  pinMode(ECHO_PIN, INPUT);

  // Khởi tạo LCD
  lcd.init();
  lcd.backlight();

  // Hiển thị thông báo khởi động
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("IoT Water System");
  lcd.setCursor(0, 1);
  lcd.print("Initializing...");
  delay(2000);

  // Hiển thị thông báo khi đang kết nối WiFi
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("Connecting WiFi");
  lcd.setCursor(0, 1);
  lcd.print("Please wait...");
  delay(1000);
}

void loop() {
  // Kiểm tra kết nối WiFi với timeout
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("Mất kết nối WiFi! Đang thử kết nối lại...");
    WiFi.begin(ssid, password);

    int wifiAttempts = 0;
    const int maxAttempts = 10; // 5 giây timeout

    while (WiFi.status() != WL_CONNECTED && wifiAttempts < maxAttempts) {
      delay(500);
      Serial.print(".");
      wifiAttempts++;
    }

    if (WiFi.status() == WL_CONNECTED) {
      Serial.println("\nKết nối lại thành công!");
      Serial.print("Địa chỉ IP mới: ");
      Serial.println(WiFi.localIP());
    } else {
      Serial.println("\nKhông thể kết nối WiFi. Tiếp tục với chế độ offline.");
    }
  }

  if (!client.connected()) {
    connectToMQTT();
  }
  client.loop();
  handleSensorLogic();

  // Tự động đặt lại cảnh báo rò rỉ sau khoảng thời gian định trước
  if (leakDetected && (millis() - leakDetectedTime > AUTO_RESET_LEAK_TIME)) {
    leakDetected = false;
    leakType = 0;
    Serial.println("Tự động đặt lại cảnh báo rò rỉ sau " + String(AUTO_RESET_LEAK_TIME / 60000) + " phút");

    // Gửi thông báo đặt lại cảnh báo
    String alertMsg = "{\"type\":\"leak_reset\",\"status\":\"auto\",\"time\":" + String(AUTO_RESET_LEAK_TIME / 60000) + "}";
    client.publish(leakAlertTopic, alertMsg.c_str());
  }

  if (millis() - lastLogTime > 2000) {
    lastLogTime = millis();
    sendDataToMQTT();
  }

  if (millis() - lastToggleLCD > 3000) {
    lastToggleLCD = millis();
    showTemp = !showTemp;
  }

  if (millis() - lastLCDTime > 500) {
    lastLCDTime = millis();
    updateLCD();
  }
  //Serial.println(leakType);
}
