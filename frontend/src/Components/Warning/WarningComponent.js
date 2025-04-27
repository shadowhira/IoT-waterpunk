import React, { useState, useEffect } from 'react';
import { Box, Typography, Button, Paper, Grid, Divider, Switch, FormControlLabel } from '@mui/material';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import InfoIcon from '@mui/icons-material/Info';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import WaterDropIcon from '@mui/icons-material/WaterDrop';
import OpacityIcon from '@mui/icons-material/Opacity';
import TimerIcon from '@mui/icons-material/Timer';
import WarningIcon from '@mui/icons-material/Warning';
import NotificationsOffIcon from '@mui/icons-material/NotificationsOff';
import { MARGIN_HEADING, THEME_COLOR_BACKGROUND, BORDER_RADIUS_MEDIUM } from '../../Assets/Constants/constants';
import { addTopicListener, removeTopicListener, sendMessage, connectWebSocket, isWebSocketConnected } from '../../Socket/WebSocketService';
import Heading from '../Heading/Heading';

const WarningComponent = () => {
    const [leakStatus, setLeakStatus] = useState({
        detected: false,
        type: 0,
        timestamp: null,
        details: null
    });
    const [loading, setLoading] = useState(true);
    const [config, setConfig] = useState({ alerts_enabled: true });

    useEffect(() => {
        // Đăng ký lắng nghe cấu hình
        const handleConfigUpdate = (data) => {
            if (data.topic === 'config') {
                setConfig(prevConfig => ({
                    ...prevConfig,
                    alerts_enabled: data.payload.alerts_enabled
                }));
                setLoading(false);
            }
        };

        addTopicListener('config', handleConfigUpdate);
        
        // Đăng ký lắng nghe cảnh báo rò rỉ
        const handleLeakUpdate = (data) => {
            if (data.topic === 'alert' || data.topic === 'leak') {
                console.log('Nhận dữ liệu cảnh báo rò rỉ:', data.payload);

                // Kiểm tra nếu là cảnh báo rò rỉ (leak_type > 0)
                if (data.payload.leak_type > 0) {
                    setLeakStatus({
                        detected: true,
                        type: data.payload.leak_type,
                        timestamp: data.payload.timestamp || new Date().toISOString(),
                        details: data.payload
                    });
                    setLoading(false);
                }
            }
        };

        // Đảm bảo WebSocket được kết nối
        if (!isWebSocketConnected()) {
            console.log('Kết nối WebSocket từ WarningComponent...');
            connectWebSocket();

            // Đặt timeout để đảm bảo có đủ thời gian kết nối
            const timeoutId = setTimeout(() => {
                // Nếu sau 5 giây vẫn không có dữ liệu, hiển thị trạng thái mặc định
                if (loading) {
                    console.log('Không nhận được dữ liệu cảnh báo, hiển thị trạng thái mặc định');
                    setLoading(false);
                }
            }, 5000);

            // Xóa timeout khi component unmount
            return () => {
                clearTimeout(timeoutId);
                removeTopicListener('leak', handleLeakUpdate);
            };
        }

        // Đăng ký lắng nghe cả hai topic 'alert' và 'leak'
        addTopicListener('alert', handleLeakUpdate);
        addTopicListener('leak', handleLeakUpdate);

        // Hủy đăng ký khi component unmount
        return () => {
            removeTopicListener('alert', handleLeakUpdate);
            removeTopicListener('leak', handleLeakUpdate);
        };
    }, [loading]);

    // Xử lý đặt lại cảnh báo
    const handleResetLeak = () => {
        // Hiển thị trạng thái đang xử lý
        setLoading(true);

        // Gửi lệnh đặt lại cảnh báo
        sendMessage('reset_leak', 'reset');

        // Đăng ký lắng nghe phản hồi
        const handleResponse = (data) => {
            if (data.topic === 'reset_leak_response' || data.topic === 'leak') {
                // Đặt lại trạng thái cảnh báo
                if (data.topic === 'leak' && !data.payload.detected) {
                    setLeakStatus({
                        detected: false,
                        type: 0,
                        timestamp: null,
                        details: null
                    });
                }

                // Tắt trạng thái đang xử lý
                setLoading(false);

                // Hủy đăng ký lắng nghe
                removeTopicListener('reset_leak_response', handleResponse);
                removeTopicListener('leak', handleResponse);
            }
        };

        // Đăng ký lắng nghe phản hồi
        addTopicListener('reset_leak_response', handleResponse);
        addTopicListener('leak', handleResponse);

        // Đặt timeout để tránh trạng thái loading vĩnh viễn
        setTimeout(() => {
            if (loading) {
                setLoading(false);
                removeTopicListener('reset_leak_response', handleResponse);
                removeTopicListener('leak', handleResponse);
            }
        }, 5000);
    };

    // Nếu đang tải hoặc cảnh báo bị tắt, không hiển thị component
    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                <Typography>Đang tải dữ liệu...</Typography>
            </Box>
        );
    }

    // Không hiển thị component nếu cảnh báo bị tắt
    if (!config.alerts_enabled) {
        return null;
    }

    // Xác định loại cảnh báo và thông tin hiển thị
    const getAlertInfo = () => {
        if (!leakStatus.detected) {
            return {
                id: 3,
                heading: 'Hệ thống hoạt động bình thường',
                description: 'Không phát hiện rò rỉ nước.',
                icon: <CheckCircleOutlineIcon style={{ fontSize: 60, color: 'white' }} />,
                color: 'green',
                details: null
            };
        }

        // Có phát hiện rò rỉ
        let alertInfo = {
            id: 1,
            heading: 'Phát hiện rò rỉ nước!',
            description: 'Cần kiểm tra hệ thống ngay lập tức.',
            icon: <ErrorOutlineIcon style={{ fontSize: 60, color: 'white' }} />,
            color: 'red',
            details: null
        };

        // Chi tiết theo loại rò rỉ
        switch (leakStatus.type) {
            case 1: // Rò rỉ mực nước
                alertInfo.details = {
                    title: 'Rò rỉ mực nước',
                    description: 'Phát hiện mực nước giảm bất thường khi máy bơm không hoạt động.',
                    icon: <WaterDropIcon sx={{ fontSize: 40 }} />,
                    action: 'Kiểm tra bể chứa và đường ống để tìm điểm rò rỉ.'
                };
                break;
            case 2: // Rò rỉ lưu lượng
                alertInfo.details = {
                    title: 'Rò rỉ lưu lượng',
                    description: 'Phát hiện lưu lượng nước bất thường khi máy bơm không hoạt động.',
                    icon: <OpacityIcon sx={{ fontSize: 40 }} />,
                    action: 'Kiểm tra van và đường ống để tìm điểm rò rỉ.'
                };
                break;
            case 3: // Bơm quá lâu
                alertInfo.details = {
                    title: 'Bơm hoạt động quá lâu',
                    description: 'Máy bơm đã hoạt động liên tục quá thời gian cho phép.',
                    icon: <TimerIcon sx={{ fontSize: 40 }} />,
                    action: 'Kiểm tra máy bơm và hệ thống điều khiển.'
                };
                break;
            default:
                alertInfo.details = {
                    title: 'Rò rỉ không xác định',
                    description: 'Phát hiện rò rỉ nhưng không xác định được loại.',
                    icon: <WarningIcon sx={{ fontSize: 40 }} />,
                    action: 'Kiểm tra toàn bộ hệ thống.'
                };
        }

        return alertInfo;
    };

    const alertInfo = getAlertInfo();

    return (
        <Box sx={{ padding: 3, marginTop: MARGIN_HEADING/8 }}>
            <Heading title="Cảnh báo hệ thống" />

            <Grid container spacing={3} justifyContent="center">
                <Grid item xs={12} md={8}>
                    {/* Hiển thị trạng thái cảnh báo */}
                    <Paper
                        elevation={3}
                        sx={{
                            borderRadius: BORDER_RADIUS_MEDIUM,
                            overflow: 'hidden',
                            marginBottom: 3
                        }}
                    >
                        <Box
                            sx={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                backgroundColor: alertInfo.color,
                                color: 'white',
                                padding: '30px',
                                textAlign: 'center',
                            }}
                        >
                            {alertInfo.icon}
                            <Typography variant="h4" sx={{ fontWeight: 'bold', margin: '15px 0' }}>
                                {alertInfo.heading}
                            </Typography>
                            <Typography variant="body1" sx={{ fontSize: '1.1rem' }}>
                                {alertInfo.description}
                            </Typography>

                            {leakStatus.detected && (
                                <Typography variant="body2" sx={{ marginTop: 2 }}>
                                    Thời gian phát hiện: {new Date(leakStatus.timestamp).toLocaleString()}
                                </Typography>
                            )}
                        </Box>
                    </Paper>

                    {/* Chi tiết cảnh báo nếu có */}
                    {alertInfo.details && (
                        <Paper
                            elevation={3}
                            sx={{
                                borderRadius: BORDER_RADIUS_MEDIUM,
                                padding: 3
                            }}
                        >
                            <Typography variant="h5" gutterBottom sx={{ color: THEME_COLOR_BACKGROUND, fontWeight: 'bold' }}>
                                Chi tiết cảnh báo
                            </Typography>
                            <Divider sx={{ marginBottom: 2 }} />

                            <Box sx={{ display: 'flex', alignItems: 'center', marginBottom: 2 }}>
                                <Box sx={{
                                    backgroundColor: alertInfo.color,
                                    borderRadius: '50%',
                                    padding: 1,
                                    marginRight: 2,
                                    color: 'white'
                                }}>
                                    {alertInfo.details.icon}
                                </Box>
                                <Typography variant="h6">{alertInfo.details.title}</Typography>
                            </Box>

                            <Typography variant="body1" paragraph>
                                {alertInfo.details.description}
                            </Typography>

                            <Typography variant="subtitle1" sx={{ fontWeight: 'bold', marginTop: 2 }}>
                                Hành động đề xuất:
                            </Typography>
                            <Typography variant="body1" paragraph>
                                {alertInfo.details.action}
                            </Typography>

                            {leakStatus.detected && (
                                <Box sx={{ textAlign: 'center', marginTop: 3 }}>
                                    <Button
                                        variant="contained"
                                        color="primary"
                                        onClick={handleResetLeak}
                                        sx={{
                                            backgroundColor: THEME_COLOR_BACKGROUND,
                                            '&:hover': {
                                                backgroundColor: '#2222AA'
                                            }
                                        }}
                                    >
                                        Đặt lại cảnh báo
                                    </Button>
                                </Box>
                            )}
                        </Paper>
                    )}
                </Grid>
            </Grid>
        </Box>
    );
};

export default WarningComponent;
