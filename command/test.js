const WebSocket = require('ws');
const { v4: uuidv4 } = require('uuid'); // Thêm thư viện UUID để tạo _id duy nhất
const wss = new WebSocket.Server({ port: 5000 });

wss.on('connection', (ws) => {
  console.log('A new client has connected');

  // Gửi thông điệp chào mừng đến client khi kết nối thành công
  ws.send(JSON.stringify({ topic: "welcome", message: 'Hello Client! You are now connected to the server.' }));

  // Biến lưu trạng thái trước đó
  let previousState = {
    temperature: 30, // Giả định giá trị ban đầu bình thường
    tds: 0, // Giả định giá trị ban đầu bình thường
    relay: 1 // Giả định máy bơm đang bật
  };

  // Hàm tạo dữ liệu giả lập
  let currentTime = Date.now(); // Lấy thời gian hiện tại (bắt đầu từ thời điểm kết nối)

  const generateData = () => {
    const temperature = Math.floor(Math.random() * 11 + 30); // Nhiệt độ từ 30 đến 40
    const tds = Math.floor(Math.random() * 1000); // TDS từ 0 đến 1000
    const flowRate = Math.floor(Math.random() * 100 + 1); // Lưu lượng từ 1 đến 100

    // Tính toán trạng thái relay
    const relay = (temperature >= 35 || tds >= 500) ? 0 : 1;

    // Thời gian gửi dữ liệu (tính từ thời điểm kết nối)
    const createdAt = new Date(currentTime).toISOString(); // Chuyển thời gian thành dạng ISO String

    // Tạo object dữ liệu
    const data = {
      _id: uuidv4(), // Tạo ID duy nhất
      temperature,
      tds,
      flowRate,
      relay,
      createdAt,
      __v: 0 // Phiên bản cố định
    };

    // Gói dữ liệu với topic
    const dataMessage = {
      topic: "sensorData",
      payload: data
    };

    console.log('Sending data to client:', dataMessage);

    // Gửi dữ liệu cho client
    ws.send(JSON.stringify(dataMessage));

    // So sánh trạng thái hiện tại với trạng thái trước đó
    if (previousState.relay !== relay) {
      let alertMessage = '';
      if (relay === 1) {
        // Trạng thái chuyển từ vượt ngưỡng sang bình thường
        alertMessage = 'Nước sạch, bật lại máy bơm';
      } else {
        // Trạng thái chuyển từ bình thường sang vượt ngưỡng
        alertMessage = 'Nước bẩn, tắt máy bơm';
      }

      // Tạo đối tượng thông báo Alert
      const alert = {
        id: uuidv4(),
        alertType: alertMessage,
        message: `Temperature: ${temperature}°C, TDS: ${tds} ppm. ${alertMessage}`,
        createdAt
      };

      // Gói thông báo với topic
      const alertMessageData = {
        topic: "alert",
        payload: alert
      };

      console.log('Sending alert to client:', alertMessageData);

      // Gửi thông báo alert cho client
      ws.send(JSON.stringify(alertMessageData));
    }

    // Lưu trạng thái hiện tại làm trạng thái trước đó cho lần gửi tiếp theo
    previousState = { temperature, tds, relay };

    // Cập nhật thời gian hiện tại cho lần gửi tiếp theo
    currentTime += 5000; // Tăng thời gian lên 5 giây
  };

  // Gửi dữ liệu mỗi 5 giây
  const dataInterval = setInterval(generateData, 5000);

  // Lắng nghe các tin nhắn từ client
  ws.on('message', (message) => {
    console.log('Received from client: ' + message);
  });

  // Xử lý khi client ngắt kết nối
  ws.on('close', () => {
    console.log('Client has disconnected');
    clearInterval(dataInterval); // Dừng việc gửi dữ liệu khi client ngắt kết nối
  });
});

console.log('WebSocket server is running on ws://localhost:4000');
