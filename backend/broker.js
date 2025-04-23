const mqtt = require('mqtt');
const WebSocket = require('ws');
require('dotenv').config();

// Thông tin MQTT broker từ biến môi trường
const brokerUrl = `mqtt://${process.env.MQTT_BROKER_URL || 'localhost'}:${process.env.MQTT_BROKER_PORT || '2403'}`;
const sensorDataTopic = process.env.MQTT_TOPIC_SENSOR_DATA || '/sensor/data'; // Topic nhận dữ liệu từ cảm biến
const controlTopic = process.env.MQTT_TOPIC_CONTROL || '/sensor/control'; // Topic điều khiển máy bơm
const configTopic = process.env.MQTT_TOPIC_CONFIG || '/sensor/config'; // Topic cấu hình hệ thống
const configStatusTopic = process.env.MQTT_TOPIC_CONFIG_STATUS || '/sensor/config/status'; // Topic trạng thái cấu hình
const leakAlertTopic = process.env.MQTT_TOPIC_LEAK_ALERT || '/sensor/leak/alert'; // Topic cảnh báo rò rỉ
const levelTopic = process.env.MQTT_TOPIC_LEVEL || '/sensor/level'; // Topic mức nước mong muốn

// Kết nối tới broker
const client = mqtt.connect(brokerUrl);

// Thiết lập WebSocket server
const wss = new WebSocket.Server({ port: parseInt(process.env.WEBSOCKET_PORT || '4000') });

// Lưu trữ các kết nối WebSocket
let connections = [];

// Lưu trữ cấu hình hiện tại từ biến môi trường
let currentConfig = {
  tank_height: parseFloat(process.env.DEFAULT_TANK_HEIGHT || '15.0'),
  max_temp: parseFloat(process.env.DEFAULT_MAX_TEMP || '35.0'),
  max_tds: parseFloat(process.env.DEFAULT_MAX_TDS || '500.0'),
  leak_threshold: parseFloat(process.env.DEFAULT_LEAK_THRESHOLD || '0.5'),
  flow_threshold: parseFloat(process.env.DEFAULT_FLOW_THRESHOLD || '0.2'),
  pump_timeout: parseInt(process.env.DEFAULT_PUMP_TIMEOUT || '300')
};

// Lưu trữ trạng thái rò rỉ
let leakStatus = {
  detected: false,
  type: 0,
  timestamp: null,
  details: null
};

// Hàm tạo dữ liệu ngẫu nhiên
const generateRandomData = () => {
    return {
        temperature: Math.round(Math.random() * 100), // Nhiệt độ ngẫu nhiên từ 0 đến 100
        tds: Math.round(Math.random() * 2000),        // Độ đục ngẫu nhiên từ 0 đến 2000
        flowRate: Math.round(Math.random() * 3000),   // Lưu lượng nước ngẫu nhiên từ 0 đến 3000
        distance: Math.round(Math.random() * 15),     // Khoảng cách ngẫu nhiên từ 0 đến 15
        pumpState: Math.round(Math.random()),         // Trạng thái máy bơm 0 hoặc 1
        currentLevelPercent: Math.round(Math.random() * 100), // Phần trăm mực nước
        leakDetected: 0,                              // Có phát hiện rò rỉ không
        leakType: 0                                   // Loại rò rỉ
    };
};

// Xử lý kết nối WebSocket
wss.on('connection', (ws) => {
    console.log('Client kết nối WebSocket');
    connections.push(ws);

    // Gửi cấu hình hiện tại cho client mới
    ws.send(JSON.stringify({
        topic: 'config',
        payload: currentConfig
    }));

    // Gửi trạng thái rò rỉ hiện tại cho client mới
    ws.send(JSON.stringify({
        topic: 'leak',
        payload: leakStatus
    }));

    ws.on('message', (message) => {
        try {
            const data = JSON.parse(message);
            console.log('Nhận dữ liệu từ client:', data);

            // Xử lý yêu cầu từ client
            if (data.topic === 'control') {
                // Gửi lệnh điều khiển máy bơm
                client.publish(controlTopic, data.payload);
            } else if (data.topic === 'config') {
                // Cập nhật cấu hình
                currentConfig = { ...currentConfig, ...data.payload };
                client.publish(configTopic, JSON.stringify(currentConfig));
            } else if (data.topic === 'level') {
                // Cập nhật mức nước mong muốn
                client.publish(levelTopic, data.payload);
            } else if (data.topic === 'reset_leak') {
                // Đặt lại cảnh báo rò rỉ
                client.publish(controlTopic, 'reset_leak');
                leakStatus = {
                    detected: false,
                    type: 0,
                    timestamp: null,
                    details: null
                };
                // Thông báo cho tất cả clients
                broadcastToAll({
                    topic: 'leak',
                    payload: leakStatus
                });
            }
        } catch (error) {
            console.error('Lỗi xử lý tin nhắn WebSocket:', error);
        }
    });

    ws.on('close', () => {
        console.log('Client ngắt kết nối WebSocket');
        connections = connections.filter(conn => conn !== ws);
    });
});

// Hàm gửi dữ liệu đến tất cả kết nối WebSocket
function broadcastToAll(data) {
    const message = JSON.stringify(data);
    connections.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(message);
        }
    });
}

// Kết nối và đăng ký các topic MQTT
client.on('connect', () => {
    console.log('Kết nối MQTT thành công');

    // Đăng ký các topic
    const topics = [sensorDataTopic, configStatusTopic, leakAlertTopic];
    topics.forEach(topic => {
        client.subscribe(topic, (err) => {
            if (err) {
                console.error(`Lỗi khi subscribe vào topic ${topic}:`, err);
            } else {
                console.log(`Đã subscribe vào topic ${topic}`);
            }
        });
    });

    // Gửi dữ liệu giả lập cứ mỗi 10 giây (chỉ dùng cho mục đích demo)
    setInterval(() => {
        const data = generateRandomData();
        const message = JSON.stringify(data);

        // Gửi tin nhắn
        client.publish(sensorDataTopic, message, (err) => {
            if (err) {
                console.error('Lỗi khi gửi tin nhắn:', err);
            } else {
                console.log(`Đã gửi tin nhắn tới topic "${sensorDataTopic}": ${message}`);
            }
        });
    }, 10000); // 10 giây
});

// Xử lý tin nhắn MQTT
client.on('message', (topic, message) => {
    const currentTime = new Date().toLocaleString();
    console.log(`[${currentTime}] Nhận dữ liệu từ topic "${topic}": ${message.toString()}`);
    
    try {
        const data = JSON.parse(message);

        // Xử lý dữ liệu từ các topic khác nhau
        if (topic === sensorDataTopic) {
            // Dữ liệu từ cảm biến
            broadcastToAll({
                topic: 'sensor_data',
                payload: data
            });

            // Kiểm tra rò rỉ
            if (data.leakDetected === 1 && !leakStatus.detected) {
                leakStatus = {
                    detected: true,
                    type: data.leakType,
                    timestamp: new Date().toISOString(),
                    details: data
                };

                // Thông báo cho tất cả clients
                broadcastToAll({
                    topic: 'leak',
                    payload: leakStatus
                });
            }
        } else if (topic === configStatusTopic) {
            // Cập nhật cấu hình hiện tại
            currentConfig = { ...currentConfig, ...data };

            // Thông báo cho tất cả clients
            broadcastToAll({
                topic: 'config',
                payload: currentConfig
            });
        } else if (topic === leakAlertTopic) {
            // Xử lý cảnh báo rò rỉ
            if (data.type === 'leak') {
                leakStatus = {
                    detected: true,
                    type: data.source === 'water_level' ? 1 :
                          data.source === 'flow_rate' ? 2 :
                          data.source === 'pump_timeout' ? 3 : 0,
                    timestamp: new Date().toISOString(),
                    details: data
                };
            } else if (data.type === 'leak_reset') {
                leakStatus = {
                    detected: false,
                    type: 0,
                    timestamp: null,
                    details: null
                };
            }

            // Thông báo cho tất cả clients
            broadcastToAll({
                topic: 'leak',
                payload: leakStatus
            });
        }
    } catch (error) {
        console.error('Lỗi xử lý tin nhắn MQTT:', error);
    }
});

// Xử lý lỗi kết nối MQTT
client.on('error', (err) => {
    console.error('Lỗi MQTT:', err);
});

console.log('MQTT Broker đang chạy...');
