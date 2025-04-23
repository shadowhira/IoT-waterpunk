import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './Components/Authen/Login/Login'; // Đường dẫn đến file Login.js
import Register from './Components/Authen/Register/Register'; // Đường dẫn đến file Register.js
import Dashboard from './Components/Dashboard';
import {
  connectWebSocket,
  isWebSocketConnected
} from './Socket/WebSocketService';

const user = {
  name: 'Nguyễn Sơn Tùng',
  username: 'anhtraimono',
  birthDate: '01/01/1990',
  address: 'Thái Bình, Việt Nam',
};

function App() {
  // Khởi tạo WebSocket một lần duy nhất ở App.js
  useEffect(() => {
    console.log('App.js: Khởi tạo WebSocket');
    if(!isWebSocketConnected()) {
      connectWebSocket();
    }

    // Dọn dẹp khi component unmount
    return () => {
      // Không ngắt kết nối WebSocket khi App unmount
      // để tránh mất kết nối khi chuyển trang
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
