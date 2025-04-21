import React, { useState } from 'react';
import { Box, TextField, Button, Typography, Alert } from '@mui/material';
import { useNavigate } from 'react-router-dom';

function Login() {
    const [username, setUsername] = useState(''); // Trạng thái cho tên người dùng
    const [password, setPassword] = useState(''); // Trạng thái cho mật khẩu
    const [error, setError] = useState(''); // Trạng thái cho thông báo lỗi
    const [success, setSuccess] = useState(''); // Trạng thái cho thông báo thành công
    const navigate = useNavigate();
    // Hàm xử lý đăng nhập
    const handleLogin = (e) => {
        e.preventDefault(); // Ngăn chặn hành vi mặc định của form

        // // Xác thực tên người dùng và mật khẩu
        // if (!username || !password) {
        //   setError('Tên người dùng và mật khẩu là bắt buộc!');
        //   setSuccess('');
        //   return;
        // }

        // // Giả lập kiểm tra đăng nhập thành công (bạn có thể thay bằng logic API)
        // if (username === 'admin' && password === 'password') {
        //   setSuccess('Đăng nhập thành công!');
        //   setError('');
        //   // Thêm logic để chuyển hướng đến trang khác hoặc lưu trạng thái người dùng
        // } else {
        //   setError('Tên người dùng hoặc mật khẩu không đúng!');
        //   setSuccess('');
        // }
        if(username === 'admin' && password === '123123') {
            navigate("/admindashboard")
        }
        else {
            navigate("/dashboard")

        }
    };

    const handleForgotPassword = () => {
        // Giả lập hành động quên mật khẩu (thêm logic khôi phục mật khẩu thực tế)
        console.log('Quên mật khẩu');
    };

    const handleRegister = () => {
        // Giả lập hành động đăng ký (thêm logic điều hướng tới trang đăng ký thực tế)
        console.log('Đi tới trang đăng ký');
        navigate("/register")
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
                Đăng Nhập
            </Typography>

            {error && <Alert severity="error">{error}</Alert>} {/* Hiển thị thông báo lỗi */}
            {success && <Alert severity="success">{success}</Alert>} {/* Hiển thị thông báo thành công */}

            <form onSubmit={handleLogin} style={{ width: '300px' }}>
                <TextField
                    label="Tên người dùng"
                    variant="outlined"
                    fullWidth
                    margin="normal"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)} // Cập nhật tên người dùng
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
                <Button variant="contained" color="primary" onClick={handleLogin} fullWidth sx={{ marginTop: 2 }}>
                    Đăng Nhập
                </Button>
            </form>

            {/* Nút Quên Mật Khẩu */}
            <Button
                variant="text"
                color="primary"
                onClick={handleForgotPassword} // Hàm quên mật khẩu
                sx={{ marginTop: 2 }}
            >
                Quên mật khẩu?
            </Button>

            {/* Nút Đăng Ký */}
            <Typography variant="body2" sx={{ marginTop: 2 }}>
                Bạn chưa có tài khoản?{' '}
                <Button variant="text" color="primary" onClick={handleRegister}>
                    Đăng ký ngay
                </Button>
            </Typography>
        </Box>
    );
}

export default Login;
