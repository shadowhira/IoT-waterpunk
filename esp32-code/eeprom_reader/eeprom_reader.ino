#include <EEPROM.h>

// Định nghĩa địa chỉ EEPROM
#define EEPROM_SIZE 512
#define EEPROM_CONFIG_ADDR 0
#define EEPROM_STATE_ADDR 200
#define EEPROM_MAGIC_NUMBER 0xAB

// Cấu trúc dữ liệu cho cấu hình hệ thống (phải giống với code.ino)
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

// Cấu trúc dữ liệu cho trạng thái hệ thống (phải giống với code.ino)
struct SystemState {
  uint32_t magicNumber;
  int controlMode;
  bool pumpState;
  int desiredLevel;
  byte checksum;
};

// Tính toán checksum đơn giản
byte calculateChecksum(byte* data, int length) {
  byte checksum = 0;
  for (int i = 0; i < length; i++) {
    checksum ^= data[i]; // XOR tất cả các byte
  }
  return checksum;
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

// Hàm để hiển thị dữ liệu dưới dạng hex dump
void hexDump(const char* desc, const void* addr, uint32_t len) {
  uint8_t* data = (uint8_t*)addr;
  Serial.print(desc); Serial.print(":");
  for (uint32_t i = 0; i < len; i++) {
    if (i % 16 == 0) {
      Serial.printf("\n%04X: ", i);
    }
    Serial.printf("%02X ", data[i]);
    if ((i + 1) % 16 == 0 || i == len - 1) {
      // In các ký tự ASCII
      uint8_t j;
      if ((i + 1) % 16 != 0) {
        // Căn chỉnh cho dòng cuối
        j = 16 - ((i + 1) % 16);
        for (; j > 0; j--) {
          Serial.print("   ");
        }
      }
      Serial.print(" | ");
      // Bắt đầu từ dòng hiện tại
      j = i - (i % 16);
      // Đến cuối dòng hoặc cuối dữ liệu
      for (; j <= i; j++) {
        if (data[j] >= 32 && data[j] <= 126) {
          Serial.print((char)data[j]);
        } else {
          Serial.print(".");
        }
      }
      Serial.println();
    }
  }
  Serial.println();
}

void setup() {
  Serial.begin(115200);
  while (!Serial) {
    ; // Đợi kết nối Serial
  }
  
  Serial.println("\n=== CHƯƠNG TRÌNH ĐỌC EEPROM ===");
  
  // Khởi tạo EEPROM với kích thước đủ lớn
  if (!EEPROM.begin(EEPROM_SIZE)) {
    Serial.println("Lỗi khởi tạo EEPROM!");
    return;
  }
  
  // Đọc và hiển thị cấu hình
  Serial.println("\n--- Cấu hình hệ thống (địa chỉ: 0) ---");
  SystemConfig config;
  EEPROM.get(EEPROM_CONFIG_ADDR, config);
  
  Serial.print("Magic Number: 0x"); Serial.println(config.magicNumber, HEX);
  Serial.print("Chiều cao bể: "); Serial.print(config.tankHeight); Serial.println(" cm");
  Serial.print("Nhiệt độ tối đa: "); Serial.print(config.maxTemp); Serial.println(" °C");
  Serial.print("TDS tối đa: "); Serial.print(config.maxTds); Serial.println(" ppm");
  Serial.print("Ngưỡng rò rỉ: "); Serial.println(config.leakThreshold);
  Serial.print("Ngưỡng dòng chảy: "); Serial.println(config.flowThreshold);
  Serial.print("Timeout máy bơm: "); Serial.print(config.pumpTimeout); Serial.println(" ms");
  Serial.print("Trạng thái cảnh báo: "); Serial.println(config.alertsEnabled ? "Bật" : "Tắt");
  Serial.print("Checksum: 0x"); Serial.println(config.checksum, HEX);
  
  byte calculatedChecksum = calculateChecksum((byte*)&config, sizeof(config) - 1);
  Serial.print("Checksum tính toán: 0x"); Serial.println(calculatedChecksum, HEX);
  Serial.print("Checksum hợp lệ: "); Serial.println(calculatedChecksum == config.checksum ? "Đúng" : "Sai");
  
  // Đọc và hiển thị trạng thái
  Serial.println("\n--- Trạng thái hệ thống (địa chỉ: 200) ---");
  SystemState state;
  EEPROM.get(EEPROM_STATE_ADDR, state);
  
  Serial.print("Magic Number: 0x"); Serial.println(state.magicNumber, HEX);
  Serial.print("Chế độ điều khiển: "); 
  switch(state.controlMode) {
    case 0: Serial.println("Tắt thủ công"); break;
    case 1: Serial.println("Bật thủ công"); break;
    case 2: Serial.println("Tự động"); break;
    default: Serial.println("Không xác định");
  }
  Serial.print("Trạng thái máy bơm: "); Serial.println(state.pumpState ? "BẬT" : "TẮT");
  Serial.print("Mức nước mong muốn: "); Serial.print(state.desiredLevel); Serial.println("%");
  Serial.print("Checksum: 0x"); Serial.println(state.checksum, HEX);
  
  byte stateChecksum = calculateStateChecksum(&state);
  Serial.print("Checksum tính toán: 0x"); Serial.println(stateChecksum, HEX);
  Serial.print("Checksum hợp lệ: "); Serial.println(stateChecksum == state.checksum ? "Đúng" : "Sai");
  
  // Hiển thị hex dump của EEPROM
  Serial.println("\n=== HEX DUMP CỦA EEPROM ===");
  
  // Hiển thị khu vực cấu hình (0-100 bytes)
  uint8_t configData[100];
  for (int i = 0; i < 100; i++) {
    configData[i] = EEPROM.read(i);
  }
  hexDump("Khu vực cấu hình (0-100)", configData, 100);
  
  // Hiển thị khu vực trạng thái (200-300 bytes)
  uint8_t stateData[100];
  for (int i = 0; i < 100; i++) {
    stateData[i] = EEPROM.read(i + 200);
  }
  hexDump("Khu vực trạng thái (200-300)", stateData, 100);
  
  // Hiển thị toàn bộ EEPROM
  Serial.println("\n--- Toàn bộ EEPROM ---");
  uint8_t* allData = new uint8_t[EEPROM_SIZE];
  if (allData) {
    for (int i = 0; i < EEPROM_SIZE; i++) {
      allData[i] = EEPROM.read(i);
    }
    hexDump("Toàn bộ EEPROM", allData, EEPROM_SIZE);
    delete[] allData;
  } else {
    Serial.println("Không đủ bộ nhớ để hiển thị toàn bộ EEPROM");
  }
  
  Serial.println("\n=== KẾT THÚC CHƯƠNG TRÌNH ĐỌC EEPROM ===");
}

void loop() {
  // Không làm gì trong loop
  delay(1000);
}
