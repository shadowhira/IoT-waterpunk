import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  Grid,
  Snackbar,
  Alert,
  Divider
} from '@mui/material';
import { MARGIN_HEADING, BORDER_RADIUS_MEDIUM, THEME_COLOR_BACKGROUND, THEME_COLOR_BORDER } from '../../Assets/Constants/constants';
import { addTopicListener, removeTopicListener, sendMessage } from '../../Socket/WebSocketService';
import Heading from '../Heading/Heading';

const SystemConfig = () => {
  // State cho cấu hình từ biến môi trường
  const [config, setConfig] = useState({
    tank_height: parseFloat(process.env.REACT_APP_DEFAULT_TANK_HEIGHT || '15.0'),
    max_temp: parseFloat(process.env.REACT_APP_DEFAULT_MAX_TEMP || '35.0'),
    max_tds: parseFloat(process.env.REACT_APP_DEFAULT_MAX_TDS || '500.0'),
    leak_threshold: parseFloat(process.env.REACT_APP_DEFAULT_LEAK_THRESHOLD || '0.5'),
    flow_threshold: parseFloat(process.env.REACT_APP_DEFAULT_FLOW_THRESHOLD || '0.2'),
    pump_timeout: parseInt(process.env.REACT_APP_DEFAULT_PUMP_TIMEOUT || '300')
  });

  // State cho thông báo
  const [notification, setNotification] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  // State cho trạng thái đang lưu
  const [isSaving, setSaving] = useState(false);

  // Xử lý khi nhận cấu hình từ server
  useEffect(() => {
    const handleConfigUpdate = (data) => {
      if (data.topic === 'config') {
        setConfig(data.payload);
      }
    };

    // Đăng ký lắng nghe cấu hình
    addTopicListener('config', handleConfigUpdate);

    // Hủy đăng ký khi component unmount
    return () => {
      removeTopicListener('config', handleConfigUpdate);
    };
  }, []);

  // Xử lý thay đổi giá trị input
  const handleChange = (e) => {
    const { name, value } = e.target;
    setConfig({
      ...config,
      [name]: parseFloat(value)
    });
  };

  // Xử lý lưu cấu hình
  const handleSave = () => {
    setSaving(true);

    // Gửi cấu hình mới đến server
    sendMessage('config', config);

    // Hiển thị thông báo thành công
    setNotification({
      open: true,
      message: 'Cấu hình đã được lưu thành công!',
      severity: 'success'
    });

    setSaving(false);
  };

  // Xử lý đóng thông báo
  const handleCloseNotification = () => {
    setNotification({
      ...notification,
      open: false
    });
  };

  return (
    <Box sx={{
      padding: 3,
      marginTop: MARGIN_HEADING/8,
      height: '100%',
      overflow: 'auto' // Enable scrolling for this component
    }}>
      <Heading text="Cấu hình hệ thống" margin={MARGIN_HEADING} themeColorBorder={THEME_COLOR_BORDER} />

      <Paper
        elevation={3}
        sx={{
          padding: 3,
          borderRadius: BORDER_RADIUS_MEDIUM,
          maxWidth: 800,
          margin: '0 auto',
          marginBottom: 3 // Add bottom margin for better spacing
        }}
      >
        <Typography variant="h5" gutterBottom sx={{ color: THEME_COLOR_BACKGROUND, fontWeight: 'bold', marginBottom: 3 }}>
          Thông số cấu hình
        </Typography>

        <Grid container spacing={3}>
          {/* Cấu hình bể nước */}
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom>
              Cấu hình bể nước
            </Typography>
            <Divider sx={{ marginBottom: 2 }} />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Chiều cao bể nước (cm)"
              name="tank_height"
              type="number"
              value={config.tank_height}
              onChange={handleChange}
              inputProps={{ step: 0.1 }}
              helperText="Chiều cao thực tế của bể nước"
            />
          </Grid>

          {/* Ngưỡng cảm biến */}
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom sx={{ marginTop: 2 }}>
              Ngưỡng cảm biến
            </Typography>
            <Divider sx={{ marginBottom: 2 }} />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Nhiệt độ tối đa (°C)"
              name="max_temp"
              type="number"
              value={config.max_temp}
              onChange={handleChange}
              inputProps={{ step: 0.1 }}
              helperText="Nhiệt độ tối đa cho phép"
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="TDS tối đa (ppm)"
              name="max_tds"
              type="number"
              value={config.max_tds}
              onChange={handleChange}
              inputProps={{ step: 1 }}
              helperText="Độ đục tối đa cho phép"
            />
          </Grid>

          {/* Cấu hình phát hiện rò rỉ */}
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom sx={{ marginTop: 2 }}>
              Cấu hình phát hiện rò rỉ
            </Typography>
            <Divider sx={{ marginBottom: 2 }} />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Ngưỡng rò rỉ mực nước (cm/phút)"
              name="leak_threshold"
              type="number"
              value={config.leak_threshold}
              onChange={handleChange}
              inputProps={{ step: 0.1 }}
              helperText="Tốc độ giảm mực nước bất thường"
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Ngưỡng rò rỉ lưu lượng (L/phút)"
              name="flow_threshold"
              type="number"
              value={config.flow_threshold}
              onChange={handleChange}
              inputProps={{ step: 0.1 }}
              helperText="Lưu lượng bất thường khi không bơm"
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Thời gian bơm tối đa (giây)"
              name="pump_timeout"
              type="number"
              value={config.pump_timeout}
              onChange={handleChange}
              inputProps={{ step: 10 }}
              helperText="Thời gian tối đa cho phép bơm liên tục"
            />
          </Grid>

          {/* Nút lưu cấu hình */}
          <Grid item xs={12} sx={{ marginTop: 2, textAlign: 'center' }}>
            <Button
              variant="contained"
              color="primary"
              onClick={handleSave}
              disabled={isSaving}
              sx={{
                minWidth: 150,
                backgroundColor: THEME_COLOR_BACKGROUND,
                '&:hover': {
                  backgroundColor: '#2222AA'
                }
              }}
            >
              {isSaving ? 'Đang lưu...' : 'Lưu cấu hình'}
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Thông báo */}
      <Snackbar
        open={notification.open}
        autoHideDuration={6000}
        onClose={handleCloseNotification}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseNotification} severity={notification.severity}>
          {notification.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default SystemConfig;
