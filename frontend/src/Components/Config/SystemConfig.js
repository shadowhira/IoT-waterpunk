import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  Grid,
  Snackbar,
  Alert,
  Divider,
  FormControlLabel,
  Switch
} from '@mui/material';
import { MARGIN_HEADING, BORDER_RADIUS_MEDIUM, THEME_COLOR_BACKGROUND, THEME_COLOR_BORDER } from '../../Assets/Constants/constants';
import { addTopicListener, removeTopicListener, sendMessage } from '../../Socket/WebSocketService';
import Heading from '../Heading/Heading';

const SystemConfig = () => {
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState({
    open: false,
    message: '',
    severity: 'info'
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        console.log('Đang lấy cấu hình...');
        const response = await axios.get(`${process.env.REACT_APP_API_URL}/config`);
        console.log('Phản hồi từ API:', response.data);
        
        if (response.data && response.data.metadata) {
          setConfig(response.data.metadata);
        } else {
          throw new Error('Dữ liệu cấu hình không hợp lệ');
        }
      } catch (error) {
        console.error('Lỗi khi lấy cấu hình:', error);
        setNotification({
          open: true,
          message: `Lỗi khi tải cấu hình: ${error.message}`,
          severity: 'error'
        });
      } finally {
        setLoading(false);
      }
    };

    fetchConfig();
  }, []);

  // Xử lý thay đổi giá trị input số
  const handleChange = (e) => {
    const { name, value } = e.target;
    const newValue = parseFloat(value);
    
    setConfig(prevConfig => {
      const updatedConfig = {
        ...prevConfig,
        [name]: newValue
      };
      
      // Gửi cập nhật ngay lập tức qua WebSocket
      sendMessage('config', {
        [name]: newValue
      });
      
      return updatedConfig;
    });
  };

  // Xử lý thay đổi switch (alerts_enabled)
  const handleSwitchChange = (e) => {
    const { name, checked } = e.target;
    
    setConfig(prevConfig => {
      const updatedConfig = {
        ...prevConfig,
        [name]: checked
      };
      
      // Gửi cập nhật ngay lập tức qua WebSocket
      sendMessage('config', {
        [name]: checked
      });
      
      return updatedConfig;
    });
  };

  // Xử lý lưu toàn bộ cấu hình
  const handleSaveConfig = async () => {
    try {
      setIsSaving(true);
      console.log('Đang lưu cấu hình:', config);
      const response = await axios.put(`${process.env.REACT_APP_API_URL}/config`, config);
      
      if (response.data && response.data.status === 'success') {
        setNotification({
          open: true,
          message: 'Đã lưu cấu hình thành công',
          severity: 'success'
        });
      }
    } catch (error) {
      console.error('Lỗi khi lưu cấu hình:', error);
      setNotification({
        open: true,
        message: `Lỗi khi lưu cấu hình: ${error.message}`,
        severity: 'error'
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Xử lý đóng thông báo
  const handleCloseNotification = () => {
    setNotification({
      ...notification,
      open: false
    });
  };

  if (loading) {
    return <div>Đang tải cấu hình...</div>;
  }

  if (!config) {
    return <div>Không thể tải cấu hình</div>;
  }

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
          {/* Cấu hình cảnh báo */}
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom>
              Cấu hình cảnh báo
            </Typography>
            <Divider sx={{ marginBottom: 2 }} />
          </Grid>

          <Grid item xs={12}>
            <FormControlLabel
              control={
                <Switch
                  name="alerts_enabled"
                  checked={config.alerts_enabled}
                  onChange={handleSwitchChange}
                  color="primary"
                />
              }
              label="Kích hoạt cảnh báo"
            />
          </Grid>

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

          {/* Nút lưu cấu hình */}
          <Grid item xs={12} sx={{ marginTop: 2, textAlign: 'center' }}>
            <Button
              variant="contained"
              color="primary"
              onClick={handleSaveConfig}
              disabled={isSaving}
              sx={{
                minWidth: 150,
                backgroundColor: THEME_COLOR_BACKGROUND,
                '&:hover': {
                  backgroundColor: '#2222AA'
                }
              }}
            >
              {false ? 'Đang lưu...' : 'Lưu cấu hình'}
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
