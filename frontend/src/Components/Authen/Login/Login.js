import React, { useState } from 'react';
import { Box, TextField, Button, Typography, Alert, Divider, Stack } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import PersonIcon from '@mui/icons-material/Person';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';

function Login() {
    const [username, setUsername] = useState(''); // Trạng thái cho tên người dùng
    const [password, setPassword] = useState(''); // Trạng thái cho mật khẩu
    const [error] = useState(''); // Trạng thái cho thông báo lỗi
    const [success] = useState(''); // Trạng thái cho thông báo thành công
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

    // Hàm xử lý chuyển hướng trực tiếp đến trang user
    const handleSkipToUser = () => {
        console.log('Bỏ qua đăng nhập - vào trang User');
        navigate("/dashboard");
    };

    // Hàm xử lý chuyển hướng trực tiếp đến trang admin
    const handleSkipToAdmin = () => {
        console.log('Bỏ qua đăng nhập - vào trang Admin');
        navigate("/admindashboard");
    };

    return (
        <Box
            sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '100vh',
                padding: '20px',
                backgroundColor: '#f5f5f5',
                backgroundImage: 'linear-gradient(to bottom right, #f5f5f5, #e0e0e0)',
            }}
        >
            <Typography variant="h4" sx={{ marginBottom: 2, fontWeight: 'bold', color: '#333' }}>
                Đăng Nhập
            </Typography>
            <Typography variant="body2" sx={{ marginBottom: 3, color: '#666', textAlign: 'center' }}>
                Đăng nhập để truy cập vào hệ thống quản lý nước
            </Typography>

            {error && <Alert severity="error">{error}</Alert>} {/* Hiển thị thông báo lỗi */}
            {success && <Alert severity="success">{success}</Alert>} {/* Hiển thị thông báo thành công */}

            <Box
                component="form"
                onSubmit={handleLogin}
                sx={{
                    width: '300px',
                    backgroundColor: 'white',
                    padding: 3,
                    borderRadius: 2,
                    boxShadow: '0 4px 8px rgba(0,0,0,0.1)'
                }}
            >
                <TextField
                    label="Tên người dùng"
                    variant="outlined"
                    fullWidth
                    margin="normal"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)} // Cập nhật tên người dùng
                    placeholder="Nhập tên người dùng"
                />
                <TextField
                    label="Mật khẩu"
                    type="password"
                    variant="outlined"
                    fullWidth
                    margin="normal"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)} // Cập nhật mật khẩu
                    placeholder="Nhập mật khẩu"
                />
                <Typography variant="caption" sx={{ display: 'block', mb: 2, mt: 1, color: 'text.secondary' }}>
                    * Nhập admin/123123 để đăng nhập với quyền admin
                </Typography>
                <Button
                    variant="contained"
                    color="primary"
                    onClick={handleLogin}
                    fullWidth
                    sx={{
                        marginTop: 1,
                        py: 1.2,
                        fontWeight: 'bold',
                        borderRadius: 1.5
                    }}
                >
                    Đăng Nhập
                </Button>
            </Box>

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

            {/* Phần bỏ qua đăng nhập */}
            <Box sx={{ width: '300px', mt: 4 }}>
                <Divider sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                        Hoặc bỏ qua đăng nhập
                    </Typography>
                </Divider>

                <Stack direction="row" spacing={2} justifyContent="center">
                    <Button
                        variant="contained"
                        color="success"
                        startIcon={<PersonIcon />}
                        onClick={handleSkipToUser}
                        sx={{
                            flex: 1,
                            borderRadius: 2,
                            py: 1.5,
                            boxShadow: '0 4px 8px rgba(0,128,0,0.2)',
                            '&:hover': {
                                boxShadow: '0 6px 12px rgba(0,128,0,0.3)',
                                transform: 'translateY(-2px)'
                            },
                            transition: 'all 0.2s'
                        }}
                    >
                        Vào User
                    </Button>

                    <Button
                        variant="contained"
                        color="warning"
                        startIcon={<AdminPanelSettingsIcon />}
                        onClick={handleSkipToAdmin}
                        sx={{
                            flex: 1,
                            borderRadius: 2,
                            py: 1.5,
                            boxShadow: '0 4px 8px rgba(255,152,0,0.2)',
                            '&:hover': {
                                boxShadow: '0 6px 12px rgba(255,152,0,0.3)',
                                transform: 'translateY(-2px)'
                            },
                            transition: 'all 0.2s'
                        }}
                    >
                        Vào Admin
                    </Button>
                </Stack>
                <Typography variant="caption" sx={{ display: 'block', mt: 2, textAlign: 'center', color: 'text.secondary' }}>
                    Chỉ dùng cho mục đích phát triển và kiểm thử
                </Typography>
            </Box>
        </Box>
    );
}

export default Login;
