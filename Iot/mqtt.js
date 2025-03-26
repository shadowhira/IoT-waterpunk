const mqtt = require('mqtt');
// Thông tin MQTT broker
const brokerUrl = 'mqtt://localhost:2403';
const topic = '/sensor/data'; // Topic để gửi dữ liệu
const topic1 = '/sensor/control';
// Kết nối tới broker
const client = mqtt.connect(brokerUrl);
// Hàm tạo dữ liệu ngẫu nhiên
const generateRandomData = () => {
    return {
        temperature:Math.round(Math.random() * 100), // Nhiệt độ ngẫu nhiên từ 0 đến 100
        tds:Math.round(Math.random() * 2000),        // Độ đục ngẫu nhiên từ 0 đến 2000
        flowRate:Math.round(Math.random() * 3000),   // Lưu lượng nước ngẫu nhiên từ 0 đến 3000
        relay: 1  // Relay trạng thái 0 hoặc 1
    };
};
// Gửi dữ liệu cứ mỗi 10 giây
client.on('connect', () => {
    client.subscribe('/sensor/control', (err) => {
        if (err) {
            console.error('Lỗi khi subscribe vào topic sensor/shutdown:', err);
        } else {
            console.log('Đã subscribe vào topic sensor/shutdown');
        }
    });

    setInterval(() => {
        const data = generateRandomData(); // Tạo dữ liệu ngẫu nhiên
        const message = JSON.stringify(data); // Chuẩn bị dữ liệu JSON
        // Gửi tin nhắn
        client.publish(topic, message, (err) => {
            if (err) {
                console.error('Lỗi khi gửi tin nhắn:', err);
            } else {
                console.log(`Đã gửi tin nhắn tới topic "${topic}": ${message}`);
            }
        });
    }, 10000); // 10 giây
});
client.on('message', (topic, message) => {
    console.log(`Dữ liệu đã nhận được từ backend topic "${topic}": ${message.toString()}`);

    // Parse message để xử lý thêm (nếu cần)
    const data = JSON.parse(message);
    // console.log('Dữ liệu đã parse:', data);
    // Thực hiện thêm logic nếu cần
    // Ví dụ: Lưu vào cơ sở dữ liệu hoặc xử lý ngưỡng
});

// Xử lý lỗi kết nối
client.on('error', (err) => {
    console.error('Lỗi MQTT:', err);
});
