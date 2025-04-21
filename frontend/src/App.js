import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './Components/Authen/Login/Login'; // Đường dẫn đến file Login.js
import Register from './Components/Authen/Register/Register'; // Đường dẫn đến file Register.js
import Dashboard from './Components/Dashboard';
import socket, { sendMessage } from './Socket/WebSocketService'; // Import hàm gửi tin nhắn từ WebSocketService
import AdminDashboard from './Components/AdminDashboard';
import {
  connectWebSocket,
  disconnectWebSocket,
  isWebSocketConnected
} from './Socket/WebSocketService';

const user = {
  name: 'Nguyễn Văn A',
  username: 'nguyenvana',
  birthDate: '01/01/1990',
  address: 'Hà Nội, Việt Nam',
};

function App() {
  useEffect(() => {
    if(!isWebSocketConnected()) {
      connectWebSocket();
    }
    // Kết nối WebSocket
    
    // Dọn dẹp khi component unmount
    return () => {
      // disconnectWebSocket();
    };
  }, []); // Chỉ chạy một lần khi component được mount

  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard/*" element={<Dashboard user={user} role="user" />} />
        <Route path="/admindashboard/*" element={<Dashboard role="admin" />} />
        <Route path="/register" element={<Register />} />
        <Route path="/" element={<Login />} /> {/* Mặc định là trang login */}
      </Routes>
    </Router>
  );
}

export default App;
