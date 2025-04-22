#include <WiFi.h>
#include <PubSubClient.h>
#include <OneWire.h>
#include <DallasTemperature.h>
#include <Wire.h>
#include <LiquidCrystal_I2C.h>
#include <EEPROM.h>
#include <ArduinoJson.h>

// LCD I2C
LiquidCrystal_I2C lcd(0x27, 16, 2);

// WiFi thông tin
// const char* ssid = "Phong701";
// const char* password = "phong701";
// const char* ssid = "Nguyen Van Tri";
// const char* password = "26111952";
const char* ssid = "Tenda_189718";
const char* password = "88888888";

// MQTT thông tin
// const char* mqttServer = "192.168.100.137"; // Home
const char* mqttServer = "192.168.0.108"; // Binh
// const char* mqttServer = "192.168.0.113"; // Bach
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
int PUMP_TIMEOUT = 300;          // Thời gian bơm tối đa (giây)

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
unsigned long pumpStartTime = 0;
bool leakDetected = false;
bool pumpTimeout = false;
int leakType = 0;  // 0: Không rò rỉ, 1: Rò rỉ mực nước, 2: Rò rỉ lưu lượng, 3: Bơm quá lâu

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
  return (duration * 0.034) / 2; // Tính khoảng cách theo cm
}

// Phát hiện rò rỉ
void checkForLeaks() {
  // Kiểm tra rò rỉ dựa trên mực nước giảm bất thường khi không bơm
  if (!pumpState && previousDistance > 0) {
    float distanceChange = distance - previousDistance;
    float minutesPassed = (millis() - lastLeakCheckTime) / 60000.0;

    if (minutesPassed > 0) {
      float rateOfChange = distanceChange / minutesPassed;

      // Nếu mực nước giảm nhanh hơn ngưỡng khi không bơm
      if (rateOfChange > LEAK_THRESHOLD && !leakDetected) {
        leakDetected = true;
        leakType = 1; // Rò rỉ mực nước

        // Gửi cảnh báo
        String alertMsg = "{\"type\":\"leak\",\"source\":\"water_level\",\"value\":" + String(rateOfChange) + "}";
        client.publish(leakAlertTopic, alertMsg.c_str());
      }
    }
  }

  // Kiểm tra rò rỉ dựa trên lưu lượng bất thường khi không bơm
  if (!pumpState && flowRate > FLOW_THRESHOLD && !leakDetected) {
    leakDetected = true;
    leakType = 2; // Rò rỉ lưu lượng

    // Gửi cảnh báo
    String alertMsg = "{\"type\":\"leak\",\"source\":\"flow_rate\",\"value\":" + String(flowRate) + "}";
    client.publish(leakAlertTopic, alertMsg.c_str());
  }

  // Kiểm tra thời gian bơm quá lâu
  if (pumpState && !pumpTimeout) {
    if (pumpStartTime > 0 && (millis() - pumpStartTime) / 1000 > PUMP_TIMEOUT) {
      pumpTimeout = true;
      leakType = 3; // Bơm quá lâu

      // Gửi cảnh báo
      String alertMsg = "{\"type\":\"leak\",\"source\":\"pump_timeout\",\"value\":" + String(PUMP_TIMEOUT) + "}";
      client.publish(leakAlertTopic, alertMsg.c_str());

      // Tắt máy bơm trong trường hợp khẩn cấp
      digitalWrite(pumpPin, LOW);
      pumpState = false;
    }
  }

  // Cập nhật giá trị trước đó
  previousDistance = distance;
  previousFlowRate = flowRate;
  lastLeakCheckTime = millis();
}

// MQTT callback
void callback(char* topic, byte* payload, unsigned int length) {
  String message = "";
  for (int i = 0; i < length; i++) {
    message += (char)payload[i];
  }

  if (String(topic) == controlTopic) {
    if (message == "on") {
      digitalWrite(pumpPin, HIGH);
      pumpState = true;
      controlMode = 1; // Chế độ bật thủ công
      manualControlStartTime = millis();
      pumpStartTime = millis(); // Ghi nhận thời điểm bắt đầu bơm
    } else if (message == "off") {
      digitalWrite(pumpPin, LOW);
      pumpState = false;
      controlMode = 0; // Chế độ tắt thủ công
      manualControlStartTime = millis();
      pumpStartTime = 0; // Đặt lại thời gian bơm
    } else if (message == "auto") {
      controlMode = 2; // Chế độ tự động
    } else if (message == "reset_leak") {
      // Đặt lại cảnh báo rò rỉ
      leakDetected = false;
      pumpTimeout = false;
      leakType = 0;
      String alertMsg = "{\"type\":\"leak_reset\",\"status\":\"ok\"}";
      client.publish(leakAlertTopic, alertMsg.c_str());
    }
  } else if (String(topic) == levelTopic) {
    desiredLevelPercent = message.toInt();
  } else if (String(topic) == configTopic) {
    // Xử lý cấu hình từ xa
    StaticJsonDocument<256> doc;
    DeserializationError error = deserializeJson(doc, message);

    if (!error) {
      // Cập nhật các tham số cấu hình
      if (doc.containsKey("tank_height")) {
        TANK_HEIGHT = doc["tank_height"];
      }
      if (doc.containsKey("max_temp")) {
        MAX_TEMP = doc["max_temp"];
      }
      if (doc.containsKey("max_tds")) {
        MAX_TDS = doc["max_tds"];
      }
      if (doc.containsKey("leak_threshold")) {
        LEAK_THRESHOLD = doc["leak_threshold"];
      }
      if (doc.containsKey("flow_threshold")) {
        FLOW_THRESHOLD = doc["flow_threshold"];
      }
      if (doc.containsKey("pump_timeout")) {
        PUMP_TIMEOUT = doc["pump_timeout"];
      }

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
  configMsg += "\"pump_timeout\":" + String(PUMP_TIMEOUT);
  configMsg += "}";

  client.publish(configStatusTopic, configMsg.c_str());
}

// Kết nối MQTT
void connectToMQTT() {
  while (!client.connected()) {
    if (client.connect("ESP32Client")) {
      client.subscribe(controlTopic);
      client.subscribe(levelTopic);
      client.subscribe(configTopic);

      // Gửi cấu hình hiện tại khi kết nối
      sendCurrentConfig();
    } else {
      delay(2000);
    }
  }
}

// Kiểm tra cảm biến và điều khiển máy bơm
void handleSensorLogic() {
  sensors.requestTemperatures();
  temperatureC = sensors.getTempCByIndex(0);
  int sensorValue = analogRead(TDS_PIN);
  float voltage = sensorValue * (VREF / 4095.0);
  tdsValue = (133.42 * voltage * voltage * voltage
              - 255.86 * voltage * voltage
              + 857.39 * voltage) * TDS_FACTOR;
  flowRate = pulseCount / 7.5 / 30;
  pulseCount = 0;
  distance = measureDistance();
  float currentLevelPercent = ((TANK_HEIGHT - distance) / TANK_HEIGHT) * 100.0;

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
    if (temperatureC > MAX_TEMP || tdsValue > MAX_TDS || currentLevelPercent > 75) {
      if (pumpState) {
        digitalWrite(pumpPin, LOW);
        pumpState = false;
        pumpStartTime = 0; // Đặt lại thời gian bơm
      }
    } else if (currentLevelPercent < desiredLevelPercent) {
      if (!pumpState) {
        digitalWrite(pumpPin, HIGH);
        pumpState = true;
        pumpStartTime = millis(); // Ghi nhận thời điểm bắt đầu bơm
      }
    } else {
      if (pumpState) {
        digitalWrite(pumpPin, LOW);
        pumpState = false;
        pumpStartTime = 0; // Đặt lại thời gian bơm
      }
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

void setup() {
  Serial.begin(115200);

  // Khởi tạo EEPROM
  EEPROM.begin(512);

  // Khởi tạo các giá trị ban đầu cho phát hiện rò rỉ
  previousDistance = 0;
  previousFlowRate = 0;
  lastLeakCheckTime = millis();
  leakDetected = false;
  pumpTimeout = false;
  leakType = 0;

  // Kết nối WiFi
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
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
  lcd.print("Leak Detection");
  delay(2000);
}

void loop() {
      if (WiFi.status() != WL_CONNECTED) {
        Serial.println("Mất kết nối WiFi! Đang thử kết nối lại...");
        WiFi.begin(ssid, password);
        while (WiFi.status() != WL_CONNECTED) {
            delay(500);
            Serial.print(".");
        }
        Serial.println("\nKết nối lại thành công!");
        Serial.print("Địa chỉ IP mới: ");
        Serial.println(WiFi.localIP());
    }

  if (!client.connected()) {
    connectToMQTT();
  }
  client.loop();
  handleSensorLogic();

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
}
