#include <WiFi.h>
#include <PubSubClient.h>
#include <OneWire.h>
#include <DallasTemperature.h>
#include <Wire.h>
#include <LiquidCrystal_I2C.h>

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
const float TANK_HEIGHT = 15; // Chiều cao bể nước (cm)

// Ngưỡng cảm biến
const float MAX_TEMP = 35.0;
const float MAX_TDS = 500.0;

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
bool showTemp = true;
float temperatureC = 0;

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
    } else if (message == "off") {
      digitalWrite(pumpPin, LOW);
      pumpState = false;
      controlMode = 0; // Chế độ tắt thủ công
      manualControlStartTime = millis();
    } else if (message == "auto") {
      controlMode = 2; // Chế độ tự động
    }
  } else if (String(topic) == levelTopic) {
    desiredLevelPercent = message.toInt();
  }
}

// Kết nối MQTT
void connectToMQTT() {
  while (!client.connected()) {
    if (client.connect("ESP32Client")) {
      client.subscribe(controlTopic);
      client.subscribe(levelTopic);
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
    Serial.print("Khoảng cách: ");
  Serial.print(distance);
  Serial.println(" cm");
  delay(1000);
  float currentLevelPercent = ((TANK_HEIGHT - distance) / TANK_HEIGHT) * 100.0;

  // Nếu chế độ thủ công, ưu tiên thực thi
  if (controlMode == 0 || controlMode == 1) {
    if (millis() - manualControlStartTime > manualControlDuration) {
      controlMode = 2; // Quay lại chế độ tự động sau thời gian ưu tiên
    }
    return;
  }

  // Chế độ tự động
  if (controlMode == 2) {
    if (temperatureC > MAX_TEMP || tdsValue > MAX_TDS || currentLevelPercent > 75) {
      if (pumpState) {
        digitalWrite(pumpPin, LOW);
        pumpState = false;
      }
    } else if (currentLevelPercent < desiredLevelPercent) {
      if (!pumpState) {
        digitalWrite(pumpPin, HIGH);
        pumpState = true;
      }
    } else {
      if (pumpState) {
        digitalWrite(pumpPin, LOW);
        pumpState = false;
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
  payload += "\"currentLevelPercent\":" + String(((TANK_HEIGHT - distance) / TANK_HEIGHT) * 100.0);
  payload += "}";
  client.publish(mqttDataTopic, payload.c_str());
}

// Cập nhật LCD
void updateLCD() {
  lcd.clear();
  float currentLevelPercent = ((TANK_HEIGHT - distance) / TANK_HEIGHT) * 100.0;
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
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
  }
  client.setServer(mqttServer, mqttPort);
  client.setCallback(callback);

  sensors.begin();
  pinMode(pumpPin, OUTPUT);
  digitalWrite(pumpPin, LOW);

  pinMode(FLOW_SENSOR_PIN, INPUT_PULLUP);
  attachInterrupt(digitalPinToInterrupt(FLOW_SENSOR_PIN), pulseCounter, RISING);

  pinMode(TRIG_PIN, OUTPUT);
  pinMode(ECHO_PIN, INPUT);

  lcd.init();                   
  lcd.backlight();
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
