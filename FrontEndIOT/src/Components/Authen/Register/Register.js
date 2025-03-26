import React, { useState } from 'react';
import { Box, TextField, Button, Typography, Alert } from '@mui/material';
import { useNavigate } from 'react-router-dom'; // Để điều hướng

function Register() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const navigate = useNavigate(); // Để điều hướng sang trang đăng nhập

  // Hàm xử lý khi người dùng đăng ký
  const handleRegister = (e) => {
    e.preventDefault(); // Ngăn chặn hành vi mặc định của form

    // Xác thực các trường nhập liệu
    if (!username || !email || !password || !confirmPassword) {
      setError('Tất cả các trường là bắt buộc.');
      setSuccess('');
      return;
    }
    if (password !== confirmPassword) {
      setError('Mật khẩu xác nhận không khớp.');
      setSuccess('');
      return;
    }

    // Giả lập đăng ký thành công
    setSuccess('Đăng ký thành công! Hãy đăng nhập.');
    setError('');

    // Điều hướng người dùng trở lại trang đăng nhập sau khi đăng ký thành công
    setTimeout(() => {
      navigate('/login');
    }, 1500);
  };

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        padding: '20px',
        backgroundColor: '#f5f5f5',
      }}
    >
      <Typography variant="h4" sx={{ marginBottom: 2 }}>
        Đăng Ký
      </Typography>

      {error && <Alert severity="error">{error}</Alert>} {/* Hiển thị thông báo lỗi */}
      {success && <Alert severity="success">{success}</Alert>} {/* Hiển thị thông báo thành công */}

      <form onSubmit={handleRegister} style={{ width: '300px' }}>
        <TextField
          label="Tên người dùng"
          variant="outlined"
          fullWidth
          margin="normal"
          value={username}
          onChange={(e) => setUsername(e.target.value)} // Cập nhật tên người dùng
        />
        <TextField
          label="Email"
          variant="outlined"
          fullWidth
          margin="normal"
          value={email}
          onChange={(e) => setEmail(e.target.value)} // Cập nhật email
        />
        <TextField
          label="Mật khẩu"
          type="password"
          variant="outlined"
          fullWidth
          margin="normal"
          value={password}
          onChange={(e) => setPassword(e.target.value)} // Cập nhật mật khẩu
        />
        <TextField
          label="Xác nhận mật khẩu"
          type="password"
          variant="outlined"
          fullWidth
          margin="normal"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)} // Cập nhật mật khẩu xác nhận
        />
        <Button variant="contained" color="primary" type="submit" fullWidth sx={{ marginTop: 2 }}>
          Đăng Ký
        </Button>
      </form>

      <Typography variant="body2" sx={{ marginTop: 2 }}>
        Đã có tài khoản?{' '}
        <Button variant="text" color="primary" onClick={() => navigate('/login')}>
          Đăng nhập
        </Button>
      </Typography>
    </Box>
  );
}

export default Register;
