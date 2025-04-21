const SOCKET_SERVER_URL = "ws://localhost:4000";
let socket = null;
let topicListeners = {}; // Quản lý listener theo topic
let reconnectInterval = null; // Biến để kiểm soát việc kết nối lại
const RECONNECT_DELAY = 5000; // 5 giây

// Kết nối WebSocket
const connectWebSocket = () => {
  if (!socket || socket.readyState === WebSocket.CLOSED) {
    console.log("Đang kết nối lại WebSocket...");
    socket = new WebSocket(SOCKET_SERVER_URL);

    socket.onopen = () => {
      console.log("Kết nối WebSocket thành công");
      if (reconnectInterval) {
        clearInterval(reconnectInterval); // Dừng cơ chế reconnect khi đã kết nối thành công
        reconnectInterval = null;
      }
      socket.send(JSON.stringify({ message: "Xin chào từ FE!" }));
    };

    socket.onmessage = (event) => {
      console.log("Nhận dữ liệu từ server:", event.data);
      const data = JSON.parse(event.data);
      const topic = data.topic; // Phân tách topic và payload

      if (topic && topicListeners[topic]) {
        // Gọi các listener đã đăng ký với topic
        topicListeners[topic].forEach((listener) => listener(JSON.parse(event.data)));
      }
    };

    socket.onerror = (error) => {
      console.error("Lỗi WebSocket:", error);
    };

    socket.onclose = () => {
      console.warn("Kết nối WebSocket đã đóng, sẽ thử kết nối lại...");
      socket = null; // Đặt socket về null để chuẩn bị kết nối lại
      startReconnect(); // Bắt đầu cơ chế reconnect
    };
  }
};

// Cơ chế kết nối lại
const startReconnect = () => {
  if (!reconnectInterval) {
    reconnectInterval = setInterval(() => {
      if (!isWebSocketConnected()) {
        console.log("Đang thử kết nối lại WebSocket...");
        connectWebSocket();
      }
    }, RECONNECT_DELAY);
  }
};

// Đăng ký listener cho một topic
const addTopicListener = (topic, listener) => {
  if (!topicListeners[topic]) {
    topicListeners[topic] = [];
  }
  topicListeners[topic].push(listener);
};

// Xóa listener khỏi một topic
const removeTopicListener = (topic, listener) => {
  if (topicListeners[topic]) {
    topicListeners[topic] = topicListeners[topic].filter((l) => l !== listener);
    if (topicListeners[topic].length === 0) {
      delete topicListeners[topic];
    }
  }
};

// Ngắt kết nối WebSocket
const disconnectWebSocket = () => {
  if (socket) {
    console.log("Đang ngắt kết nối WebSocket...");
    socket.close();
    socket = null;
  }
  if (reconnectInterval) {
    clearInterval(reconnectInterval); // Dừng cơ chế reconnect
    reconnectInterval = null;
  }
};

// Gửi dữ liệu với topic
const sendMessage = (topic, payload) => {
  if (socket && socket.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify({ topic, payload }));
  } else {
    console.error("WebSocket chưa sẵn sàng để gửi dữ liệu");
  }
};

// Kiểm tra WebSocket đã kết nối chưa
const isWebSocketConnected = () => {
  return socket && socket.readyState === WebSocket.OPEN;
};

export {
  connectWebSocket,
  disconnectWebSocket,
  addTopicListener,
  removeTopicListener,
  sendMessage,
  isWebSocketConnected,
};
