// Sử dụng URL cố định để đảm bảo kết nối đến backend
const SOCKET_SERVER_URL = "ws://localhost:4000";

console.log("WebSocket URL:", SOCKET_SERVER_URL);
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
      // socket.send(JSON.stringify({ message: "Xin chào từ FE!" }));
    };

    socket.onmessage = (event) => {
      console.log("Nhận dữ liệu từ server:", event.data);
      try {
        const data = JSON.parse(event.data);
        console.log("Dữ liệu đã parse:", data);

        // Xử lý cả tin nhắn chào mừng
        if (data.message && data.message === "Welcome to WebSocket server!") {
          console.log("Kết nối WebSocket thành công, nhận tin nhắn chào mừng");
          return;
        }

        // Xử lý dữ liệu cảm biến
        if (data.topic === "sensor_data" || data.topic === "/sensor/data") {
          console.log("Nhận dữ liệu cảm biến:", data);

          // Gọi các listener đã đăng ký với cả hai topic
          if (topicListeners["sensor_data"]) {
            topicListeners["sensor_data"].forEach((listener) => listener(data));
          }

          if (topicListeners["/sensor/data"]) {
            topicListeners["/sensor/data"].forEach((listener) => listener(data));
          }
          return;
        }

        // Xử lý các topic khác
        const topic = data.topic;
        if (topic && topicListeners[topic]) {
          console.log("Gọi listener cho topic:", topic);
          // Gọi các listener đã đăng ký với topic
          topicListeners[topic].forEach((listener) => listener(data));
        } else {
          console.log("Không có listener nào đăng ký cho topic:", topic);
        }
      } catch (error) {
        console.error("Lỗi khi xử lý dữ liệu WebSocket:", error);
      }
    };

    socket.onerror = (error) => {
      console.error("Lỗi WebSocket:", error);
      console.log("Chi tiết kết nối WebSocket:", {
        url: SOCKET_SERVER_URL,
        readyState: socket ? socket.readyState : 'socket is null',
        error: error
      });
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
