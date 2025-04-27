const mqtt = require('mqtt');
const readline = require('readline');

// Cấu hình MQTT
const MQTT_SERVER = 'mqtt://localhost';
const MQTT_PORT = 2403;
const MQTT_TOPICS = {
  sensorData: '/sensor/data',
  control: '/sensor/control',
  level: '/sensor/level',
  config: '/sensor/config',
  configStatus: '/sensor/config/status',
  leakAlert: '/sensor/leak/alert'
};

// Cấu hình hệ thống mặc định
let systemConfig = {
  tank_height: 15.0,
  max_temp: 35.0,
  max_tds: 500.0,
  leak_threshold: 0.5,
  flow_threshold: 0.2,
  pump_timeout: 300
};

// Trạng thái hệ thống
let systemState = {
  temperature: 25.0,
  tds: 300.0,
  flowRate: 0.0,
  distance: 5.0,
  pumpState: 0,
  controlMode: 2, // 0: Tắt thủ công, 1: Bật thủ công, 2: Tự động
  desiredLevelPercent: 70,
  leakDetected: 0,
  leakType: 0,
  previousDistance: 5.0,
  previousFlowRate: 0.0,
  pumpStartTime: 0
};

// Cấu hình simulator
let simulatorConfig = {
  sendTestData: true, // Mặc định là gửi dữ liệu test
  dataInterval: 10000, // Khoảng thời gian gửi dữ liệu (ms)
  dataIntervalId: null // ID của interval, để có thể dừng nó sau này
};

// Kết nối MQTT
const client = mqtt.connect(`${MQTT_SERVER}:${MQTT_PORT}`, {
  clientId: 'ESP32Simulator'
});

// Tạo interface đọc từ dòng lệnh
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Xử lý kết nối MQTT
client.on('connect', () => {
  console.log('Đã kết nối đến MQTT broker');

  // Đăng ký các topic
  client.subscribe([
    MQTT_TOPICS.control,
    MQTT_TOPICS.level,
    MQTT_TOPICS.config
  ], (err) => {
    if (err) {
      console.error('Lỗi khi đăng ký topic:', err);
    } else {
      console.log('Đã đăng ký các topic MQTT');

      // Gửi cấu hình hiện tại
      sendCurrentConfig();

      // Bắt đầu gửi dữ liệu cảm biến
      startSendingData();

      // Hiển thị menu
      showMenu();
    }
  });
});

// Xử lý tin nhắn MQTT
client.on('message', (topic, message) => {
  const messageStr = message.toString();
  // Chỉ hiển thị log ngắn gọn hơn
  console.log(`Nhận tin nhắn từ topic ${topic}`);

  try {
    if (topic === MQTT_TOPICS.control) {
      handleControlCommand(messageStr);
    } else if (topic === MQTT_TOPICS.level) {
      systemState.desiredLevelPercent = parseInt(messageStr);
      console.log(`Đã cập nhật mức nước mong muốn: ${systemState.desiredLevelPercent}%`);
    } else if (topic === MQTT_TOPICS.config) {
      handleConfigUpdate(messageStr);
    }
  } catch (error) {
    console.error('Lỗi xử lý tin nhắn:', error);
  }
});

// Xử lý lệnh điều khiển
function handleControlCommand(command) {
  switch (command) {
    case 'on':
      systemState.pumpState = 1;
      systemState.controlMode = 1;
      systemState.pumpStartTime = Date.now();
      console.log('Đã BẬT máy bơm (chế độ thủ công)');
      break;
    case 'off':
      systemState.pumpState = 0;
      systemState.controlMode = 0;
      systemState.pumpStartTime = 0;
      console.log('Đã TẮT máy bơm (chế độ thủ công)');
      break;
    case 'auto':
      systemState.controlMode = 2;
      console.log('Đã chuyển sang chế độ TỰ ĐỘNG');
      break;
    case 'reset_leak':
      systemState.leakDetected = 0;
      systemState.leakType = 0;
      console.log('Đã đặt lại cảnh báo rò rỉ');

      // Gửi xác nhận đặt lại cảnh báo
      const resetMsg = {
        type: 'leak_reset',
        status: 'ok'
      };
      client.publish(MQTT_TOPICS.leakAlert, JSON.stringify(resetMsg));
      break;
    default:
      console.log(`Lệnh không được hỗ trợ: ${command}`);
  }
}

// Biến để tránh vòng lặp cấu hình
let lastConfigUpdateTime = 0;
const CONFIG_UPDATE_THROTTLE = 5000; // 5 giây

// Xử lý cập nhật cấu hình
function handleConfigUpdate(configStr) {
  try {
    const config = JSON.parse(configStr);

    // Kiểm tra xem có thay đổi thực sự nào không
    let hasChanges = false;

    if (config.tank_height !== undefined && config.tank_height !== systemConfig.tank_height) {
      systemConfig.tank_height = config.tank_height;
      hasChanges = true;
    }
    if (config.max_temp !== undefined && config.max_temp !== systemConfig.max_temp) {
      systemConfig.max_temp = config.max_temp;
      hasChanges = true;
    }
    if (config.max_tds !== undefined && config.max_tds !== systemConfig.max_tds) {
      systemConfig.max_tds = config.max_tds;
      hasChanges = true;
    }
    if (config.leak_threshold !== undefined && config.leak_threshold !== systemConfig.leak_threshold) {
      systemConfig.leak_threshold = config.leak_threshold;
      hasChanges = true;
    }
    if (config.flow_threshold !== undefined && config.flow_threshold !== systemConfig.flow_threshold) {
      systemConfig.flow_threshold = config.flow_threshold;
      hasChanges = true;
    }
    if (config.pump_timeout !== undefined && config.pump_timeout !== systemConfig.pump_timeout) {
      systemConfig.pump_timeout = config.pump_timeout;
      hasChanges = true;
    }

    // Chỉ hiển thị và gửi lại nếu có thay đổi thực sự
    if (hasChanges) {
      console.log('Đã cập nhật cấu hình:', systemConfig);

      // Chỉ gửi lại cấu hình nếu đã quá thời gian chờ
      const now = Date.now();
      if (now - lastConfigUpdateTime > CONFIG_UPDATE_THROTTLE) {
        lastConfigUpdateTime = now;
        sendCurrentConfig();
      }
    }
  } catch (error) {
    console.error('Lỗi khi xử lý cập nhật cấu hình:', error);
  }
}

// Gửi cấu hình hiện tại
function sendCurrentConfig() {
  client.publish(MQTT_TOPICS.configStatus, JSON.stringify(systemConfig));
  console.log('Đã gửi cấu hình hiện tại');
}

// Gửi dữ liệu cảm biến
function sendSensorData() {
  // Tính toán mực nước hiện tại
  const currentLevelPercent = ((systemConfig.tank_height - systemState.distance) / systemConfig.tank_height) * 100.0;

  // Tạo dữ liệu cảm biến
  const sensorData = {
    temperature: systemState.temperature,
    tds: systemState.tds,
    flowRate: systemState.flowRate,
    distance: systemState.distance,
    pumpState: systemState.pumpState,
    currentLevelPercent: currentLevelPercent,
    leakDetected: systemState.leakDetected,
    leakType: systemState.leakType
  };

  // Gửi dữ liệu
  client.publish(MQTT_TOPICS.sensorData, JSON.stringify(sensorData));

  // Hiển thị thông báo ngắn gọn hơn
  console.log('\n[' + new Date().toLocaleTimeString() + '] Gửi dữ liệu cảm biến:');
  console.log(`  Nhiệt độ: ${sensorData.temperature}°C | TDS: ${sensorData.tds} ppm | Lưu lượng: ${sensorData.flowRate} L/phút`);
  console.log(`  Khoảng cách: ${sensorData.distance.toFixed(1)} cm | Chiều cao bể: ${systemConfig.tank_height} cm`);
  console.log(`  Mực nước: ${sensorData.currentLevelPercent.toFixed(1)}% | Máy bơm: ${sensorData.pumpState ? 'BẬT' : 'TẮT'} | Rò rỉ: ${sensorData.leakDetected ? 'CÓ' : 'KHÔNG'}`);
  if (sensorData.leakDetected) {
    console.log(`  Loại rò rỉ: ${getLeakTypeName(sensorData.leakType)}`);
  }

  // Kiểm tra rò rỉ
  checkForLeaks();

  // Xử lý logic điều khiển tự động
  if (systemState.controlMode === 2) {
    handleAutomaticControl(currentLevelPercent);
  }

  // Kiểm tra thời gian bơm quá lâu
  checkPumpTimeout();
}

// Kiểm tra rò rỉ
function checkForLeaks() {
  // Lưu trữ giá trị trước đó
  const prevDistance = systemState.previousDistance;
  const prevFlowRate = systemState.previousFlowRate;

  // Cập nhật giá trị mới
  systemState.previousDistance = systemState.distance;
  systemState.previousFlowRate = systemState.flowRate;

  // Kiểm tra sự thay đổi lưu lượng bất thường (chỉ để sử dụng biến prevFlowRate)
  if (systemState.pumpState === 0 && prevFlowRate > 0 && Math.abs(systemState.flowRate - prevFlowRate) > systemConfig.flow_threshold) {
    console.log(`Lưu lượng thay đổi bất thường: ${prevFlowRate} -> ${systemState.flowRate} L/phút`);
  }

  // Kiểm tra rò rỉ mực nước
  if (systemState.pumpState === 0 && prevDistance > 0) {
    const distanceChange = systemState.distance - prevDistance;

    // Nếu mực nước giảm bất thường (khoảng cách tăng) khi không bơm
    if (distanceChange > systemConfig.leak_threshold && !systemState.leakDetected) {
      systemState.leakDetected = 1;
      systemState.leakType = 1;

      // Gửi cảnh báo
      const alertMsg = {
        type: 'leak',
        source: 'water_level',
        value: distanceChange
      };
      client.publish(MQTT_TOPICS.leakAlert, JSON.stringify(alertMsg));
      console.log('CẢNH BÁO: Phát hiện rò rỉ mực nước!');
    }
  }

  // Kiểm tra rò rỉ lưu lượng
  if (systemState.pumpState === 0 && systemState.flowRate > systemConfig.flow_threshold && !systemState.leakDetected) {
    systemState.leakDetected = 1;
    systemState.leakType = 2;

    // Gửi cảnh báo
    const alertMsg = {
      type: 'leak',
      source: 'flow_rate',
      value: systemState.flowRate
    };
    client.publish(MQTT_TOPICS.leakAlert, JSON.stringify(alertMsg));
    console.log('CẢNH BÁO: Phát hiện rò rỉ lưu lượng!');
  }
}

// Kiểm tra thời gian bơm quá lâu
function checkPumpTimeout() {
  if (systemState.pumpState === 1 && systemState.pumpStartTime > 0) {
    const pumpDuration = (Date.now() - systemState.pumpStartTime) / 1000; // Thời gian bơm tính bằng giây

    if (pumpDuration > systemConfig.pump_timeout && !systemState.leakDetected) {
      systemState.leakDetected = 1;
      systemState.leakType = 3;

      // Gửi cảnh báo
      const alertMsg = {
        type: 'leak',
        source: 'pump_timeout',
        value: systemConfig.pump_timeout
      };
      client.publish(MQTT_TOPICS.leakAlert, JSON.stringify(alertMsg));
      console.log('CẢNH BÁO: Máy bơm hoạt động quá lâu!');

      // Tắt máy bơm
      systemState.pumpState = 0;
      systemState.pumpStartTime = 0;
    }
  }
}

// Xử lý logic điều khiển tự động
function handleAutomaticControl(currentLevelPercent) {
  if (systemState.temperature > systemConfig.max_temp ||
      systemState.tds > systemConfig.max_tds ||
      currentLevelPercent > 75) {
    if (systemState.pumpState === 1) {
      systemState.pumpState = 0;
      systemState.pumpStartTime = 0;
      console.log('Tự động TẮT máy bơm (nhiệt độ cao/TDS cao/bể đầy)');
    }
  } else if (currentLevelPercent < systemState.desiredLevelPercent) {
    if (systemState.pumpState === 0) {
      systemState.pumpState = 1;
      systemState.pumpStartTime = Date.now();
      console.log('Tự động BẬT máy bơm (mực nước thấp)');
    }
  } else {
    if (systemState.pumpState === 1) {
      systemState.pumpState = 0;
      systemState.pumpStartTime = 0;
      console.log('Tự động TẮT máy bơm (đạt mức nước mong muốn)');
    }
  }
}

// Bắt đầu gửi dữ liệu cảm biến
function startSendingData() {
  if (simulatorConfig.sendTestData) {
    console.log(`Bắt đầu gửi dữ liệu cảm biến mỗi ${simulatorConfig.dataInterval/1000} giây...`);
    // Lưu ID của interval để có thể dừng nó sau này
    simulatorConfig.dataIntervalId = setInterval(sendSensorData, simulatorConfig.dataInterval);
  } else {
    console.log('Chế độ gửi dữ liệu test đã bị tắt. Chỉ nhận dữ liệu từ phần cứng thực.');
  }
}

// Hiển thị menu
function showMenu() {
  console.log('\n===== ESP32 SIMULATOR MENU =====');
  console.log('1. Thay đổi nhiệt độ');
  console.log('2. Thay đổi TDS');
  console.log('3. Thay đổi lưu lượng');
  console.log('4. Thay đổi mực nước (khoảng cách)');
  console.log('5. Mô phỏng rò rỉ mực nước');
  console.log('6. Mô phỏng rò rỉ lưu lượng');
  console.log('7. Mô phỏng bơm quá lâu');
  console.log('8. Hiển thị trạng thái hiện tại');
  console.log('9. Hiển thị cấu hình hiện tại');
  console.log('------ Điều khiển máy bơm ------');
  console.log('10. BẬT máy bơm (chế độ thủ công)');
  console.log('11. TẮT máy bơm (chế độ thủ công)');
  console.log('12. Chế độ TỰ ĐỘNG');
  console.log('13. Đặt lại cảnh báo rò rỉ');
  console.log('------ Cấu hình Simulator ------');
  console.log(`14. ${simulatorConfig.sendTestData ? 'TẮT' : 'BẬT'} gửi dữ liệu test (hiện tại: ${simulatorConfig.sendTestData ? 'BẬT' : 'TẮT'})`);
  console.log('15. Thay đổi khoảng thời gian gửi dữ liệu');
  console.log('0. Thoát');
  console.log('===============================');

  rl.question('Chọn một tùy chọn: ', (answer) => {
    handleMenuOption(answer);
  });
}

// Xử lý tùy chọn menu
function handleMenuOption(option) {
  switch (option) {
    case '1':
      rl.question('Nhập nhiệt độ mới (°C): ', (temp) => {
        systemState.temperature = parseFloat(temp);
        console.log(`Đã cập nhật nhiệt độ: ${systemState.temperature}°C`);
        showMenu();
      });
      break;
    case '2':
      rl.question('Nhập TDS mới (ppm): ', (tds) => {
        systemState.tds = parseFloat(tds);
        console.log(`Đã cập nhật TDS: ${systemState.tds} ppm`);
        showMenu();
      });
      break;
    case '3':
      rl.question('Nhập lưu lượng mới (L/phút): ', (flow) => {
        systemState.flowRate = parseFloat(flow);
        console.log(`Đã cập nhật lưu lượng: ${systemState.flowRate} L/phút`);
        showMenu();
      });
      break;
    case '4':
      rl.question('Nhập khoảng cách mới (cm): ', (distance) => {
        systemState.distance = parseFloat(distance);
        const level = ((systemConfig.tank_height - systemState.distance) / systemConfig.tank_height) * 100.0;
        console.log(`Đã cập nhật khoảng cách: ${systemState.distance} cm (mực nước: ${level.toFixed(1)}%)`);
        showMenu();
      });
      break;
    case '5':
      simulateWaterLevelLeak();
      showMenu();
      break;
    case '6':
      simulateFlowRateLeak();
      showMenu();
      break;
    case '7':
      simulatePumpTimeout();
      showMenu();
      break;
    case '8':
      console.log('Trạng thái hiện tại:', systemState);
      showMenu();
      break;
    case '9':
      console.log('Cấu hình hệ thống hiện tại:', systemConfig);
      showSimulatorConfig(); // Hiển thị cấu hình simulator
      showMenu();
      break;
    case '10': // BẬT máy bơm
      turnPumpOn();
      showMenu();
      break;
    case '11': // TẮT máy bơm
      turnPumpOff();
      showMenu();
      break;
    case '12': // Chế độ TỰ ĐỘNG
      setAutomaticMode();
      showMenu();
      break;
    case '13': // Đặt lại cảnh báo rò rỉ
      resetLeakAlert();
      showMenu();
      break;
    case '14': // Bật/tắt gửi dữ liệu test
      toggleSendTestData();
      showMenu();
      break;
    case '15': // Thay đổi khoảng thời gian gửi dữ liệu
      rl.question('Nhập khoảng thời gian gửi dữ liệu mới (giây): ', (interval) => {
        changeDataInterval(parseFloat(interval));
        showMenu();
      });
      break;
    case '0':
      console.log('Đang thoát...');
      client.end();
      rl.close();
      process.exit(0);
    default:
      console.log('Tùy chọn không hợp lệ!');
      showMenu();
  }
}

// Mô phỏng rò rỉ mực nước (Loại 1)
function simulateWaterLevelLeak() {
  // Kiểm tra điều kiện tiên quyết
  if (systemState.pumpState === 1) {
    console.log('\nKhông thể mô phỏng rò rỉ mực nước khi máy bơm đang BẬT!');
    console.log('Vui lòng TẮT máy bơm trước (chọn tùy chọn 11)');
    return;
  }

  if (systemState.leakDetected) {
    console.log('\nĐã có cảnh báo rò rỉ! Hãy reset cảnh báo trước khi mô phỏng.');
    return;
  }

  // Lưu trữ giá trị ban đầu
  const oldDistance = systemState.distance;
  
  // Tính toán sự thay đổi khoảng cách để vượt ngưỡng
  const timeElapsed = 1; // Giả lập 1 phút trôi qua
  const distanceChange = systemConfig.leak_threshold * 2 * timeElapsed; // Tăng gấp đôi ngưỡng
  
  // Cập nhật khoảng cách mới (tăng khoảng cách = giảm mực nước)
  systemState.distance += distanceChange;

  // Đảm bảo không vượt quá chiều cao bể
  if (systemState.distance > systemConfig.tank_height) {
    systemState.distance = systemConfig.tank_height;
  }

  // Cập nhật trạng thái rò rỉ
  systemState.leakDetected = 1;
  systemState.leakType = 1;

  // Tính toán tỷ lệ thay đổi (cm/phút)
  const rateOfChange = distanceChange / timeElapsed;

  // Gửi cảnh báo
  const alertMsg = {
    type: 'leak',
    source: 'water_level',
    value: rateOfChange.toFixed(2)
  };
  client.publish(MQTT_TOPICS.leakAlert, JSON.stringify(alertMsg));

  // Hiển thị thông tin chi tiết
  console.log('\nMô phỏng rò rỉ mực nước:');
  console.log(`- Khoảng cách ban đầu: ${oldDistance.toFixed(2)} cm`);
  console.log(`- Khoảng cách sau khi rò rỉ: ${systemState.distance.toFixed(2)} cm`);
  console.log(`- Tốc độ thay đổi: ${rateOfChange.toFixed(2)} cm/phút`);
  console.log(`- Ngưỡng phát hiện: ${systemConfig.leak_threshold} cm/phút`);
  console.log('\nCẢNH BÁO: Phát hiện rò rỉ mực nước!');
  console.log('- Loại rò rỉ: ' + getLeakTypeName(systemState.leakType));
  
  // Gửi lại dữ liệu cảm biến ngay lập tức để cập nhật giao diện
  sendSensorData();
}

// Mô phỏng rò rỉ lưu lượng
function simulateFlowRateLeak() {
  // Tăng lưu lượng khi máy bơm tắt để mô phỏng rò rỉ
  if (systemState.pumpState === 0) {
    const newFlowRate = systemConfig.flow_threshold * 2; // Lưu lượng cao hơn ngưỡng
    systemState.flowRate = newFlowRate;

    // Cập nhật trạng thái rò rỉ
    systemState.leakDetected = 1;
    systemState.leakType = 2;

    // Gửi cảnh báo ngay lập tức
    const alertMsg = {
      type: 'leak',
      source: 'flow_rate',
      value: newFlowRate
    };
    client.publish(MQTT_TOPICS.leakAlert, JSON.stringify(alertMsg));

    console.log(`\nMô phỏng rò rỉ lưu lượng: Lưu lượng = ${systemState.flowRate} L/phút khi máy bơm tắt`);
    console.log('CẢNH BÁO: Phát hiện rò rỉ lưu lượng!');
  } else {
    console.log('\nKhông thể mô phỏng rò rỉ lưu lượng khi máy bơm đang bật!');
    console.log('Tắt máy bơm trước (chọn tùy chọn 11)');
  }
}

// Mô phỏng bơm quá lâu
function simulatePumpTimeout() {
  if (systemState.pumpState === 1) {
    // Đặt thời gian bắt đầu bơm về quá khứ để vượt quá thời gian tối đa
    systemState.pumpStartTime = Date.now() - (systemConfig.pump_timeout * 1000 + 1000);

    // Cập nhật trạng thái rò rỉ
    systemState.leakDetected = 1;
    systemState.leakType = 3;

    // Gửi cảnh báo ngay lập tức
    const alertMsg = {
      type: 'leak',
      source: 'pump_timeout',
      value: systemConfig.pump_timeout
    };
    client.publish(MQTT_TOPICS.leakAlert, JSON.stringify(alertMsg));

    console.log(`\nMô phỏng bơm quá lâu: Thời gian bơm > ${systemConfig.pump_timeout} giây`);
    console.log('CẢNH BÁO: Máy bơm hoạt động quá lâu!');

    // Tắt máy bơm
    systemState.pumpState = 0;
    systemState.pumpStartTime = 0;
    console.log('Máy bơm đã tự động TẮT do hoạt động quá lâu');
  } else {
    console.log('\nKhông thể mô phỏng bơm quá lâu khi máy bơm đang tắt!');
    console.log('Bật máy bơm trước (chọn tùy chọn 10)');
  }
}

// Xử lý lỗi kết nối
client.on('error', (err) => {
  console.error('Lỗi kết nối MQTT:', err);
});

// Lấy tên loại rò rỉ
function getLeakTypeName(leakType) {
  switch (leakType) {
    case 1:
      return 'Rò rỉ mực nước';
    case 2:
      return 'Rò rỉ lưu lượng';
    case 3:
      return 'Bơm quá lâu';
    default:
      return 'Không xác định';
  }
}

// BẬT máy bơm (chế độ thủ công)
function turnPumpOn() {
  systemState.pumpState = 1;
  systemState.controlMode = 1;
  systemState.pumpStartTime = Date.now();
  console.log('\nĐã BẬT máy bơm (chế độ thủ công)');
  console.log('Trạng thái máy bơm: ' + (systemState.pumpState ? 'BẬT' : 'TẮT'));
  console.log('Chế độ điều khiển: ' + getControlModeName(systemState.controlMode));
}

// TẮT máy bơm (chế độ thủ công)
function turnPumpOff() {
  systemState.pumpState = 0;
  systemState.controlMode = 0;
  systemState.pumpStartTime = 0;
  console.log('\nĐã TẮT máy bơm (chế độ thủ công)');
  console.log('Trạng thái máy bơm: ' + (systemState.pumpState ? 'BẬT' : 'TẮT'));
  console.log('Chế độ điều khiển: ' + getControlModeName(systemState.controlMode));
}

// Chế độ TỰ ĐỘNG
function setAutomaticMode() {
  systemState.controlMode = 2;
  console.log('\nĐã chuyển sang chế độ TỰ ĐỘNG');
  console.log('Trạng thái máy bơm: ' + (systemState.pumpState ? 'BẬT' : 'TẮT'));
  console.log('Chế độ điều khiển: ' + getControlModeName(systemState.controlMode));
}

// Đặt lại cảnh báo rò rỉ
function resetLeakAlert() {
  if (systemState.leakDetected) {
    systemState.leakDetected = 0;
    systemState.leakType = 0;
    console.log('\nĐã đặt lại cảnh báo rò rỉ');

    // Gửi xác nhận đặt lại cảnh báo
    const resetMsg = {
      type: 'leak_reset',
      status: 'ok'
    };
    client.publish(MQTT_TOPICS.leakAlert, JSON.stringify(resetMsg));
  } else {
    console.log('\nKhông có cảnh báo rò rỉ nào để đặt lại');
  }
}

// Lấy tên chế độ điều khiển
function getControlModeName(mode) {
  switch (mode) {
    case 0:
      return 'TẮT thủ công';
    case 1:
      return 'BẬT thủ công';
    case 2:
      return 'TỰ ĐỘNG';
    default:
      return 'Không xác định';
  }
}

// Bật/tắt gửi dữ liệu test
function toggleSendTestData() {
  simulatorConfig.sendTestData = !simulatorConfig.sendTestData;

  if (simulatorConfig.sendTestData) {
    console.log('\nĐã BẬT chế độ gửi dữ liệu test');
    // Nếu đang không có interval đang chạy, bắt đầu gửi dữ liệu
    if (!simulatorConfig.dataIntervalId) {
      console.log(`Bắt đầu gửi dữ liệu cảm biến mỗi ${simulatorConfig.dataInterval/1000} giây...`);
      simulatorConfig.dataIntervalId = setInterval(sendSensorData, simulatorConfig.dataInterval);
    }
  } else {
    console.log('\nĐã TẮT chế độ gửi dữ liệu test. Chỉ nhận dữ liệu từ phần cứng thực.');
    // Nếu có interval đang chạy, dừng nó lại
    if (simulatorConfig.dataIntervalId) {
      clearInterval(simulatorConfig.dataIntervalId);
      simulatorConfig.dataIntervalId = null;
    }
  }
}

// Thay đổi khoảng thời gian gửi dữ liệu
function changeDataInterval(seconds) {
  if (isNaN(seconds) || seconds <= 0) {
    console.log('\nKhoảng thời gian không hợp lệ. Vui lòng nhập một số dương.');
    return;
  }

  // Chuyển đổi giây sang mili giây
  const interval = seconds * 1000;
  simulatorConfig.dataInterval = interval;

  console.log(`\nĐã thay đổi khoảng thời gian gửi dữ liệu thành ${seconds} giây`);

  // Nếu đang gửi dữ liệu test, cập nhật interval
  if (simulatorConfig.sendTestData && simulatorConfig.dataIntervalId) {
    clearInterval(simulatorConfig.dataIntervalId);
    simulatorConfig.dataIntervalId = setInterval(sendSensorData, interval);
    console.log(`Đã cập nhật khoảng thời gian gửi dữ liệu.`);
  }
}

// Hiển thị cấu hình simulator
function showSimulatorConfig() {
  console.log('\nCấu hình Simulator:');
  console.log(`- Gửi dữ liệu test: ${simulatorConfig.sendTestData ? 'BẬT' : 'TẮT'}`);
  console.log(`- Khoảng thời gian gửi dữ liệu: ${simulatorConfig.dataInterval/1000} giây`);
}

// Xử lý đóng kết nối
process.on('SIGINT', () => {
  console.log('Đang đóng kết nối...');
  // Dừng interval nếu đang chạy
  if (simulatorConfig.dataIntervalId) {
    clearInterval(simulatorConfig.dataIntervalId);
  }
  client.end();
  rl.close();
  process.exit(0);
});
