import React, { useEffect, useState, memo } from "react";
import {
  Box,
  Typography,
  Button,
  Alert,
  AlertTitle,
  Paper,
  Grid,
} from "@mui/material";
import {
  BORDER_RADIUS_BIG,
  BORDER_RADIUS_SMALL,

  COLOR_CONTENT_ADMIN,
  HEIGHT_FOOTER,
  HEIGHT_USERINFO,
  MARGIN_HEADING,
  THEME_COLOR_BORDER,
} from "../Assets/Constants/constants";
import {
  createItemInvoiceAnimation,
  hexToRgba,
} from "../Assets/Constants/utils";
// import logoImage from "../Assets/Images/logo.png"; // Đường dẫn ảnh logo (removed)
import ToggleSwitch from "./Buttons/Toggles/ToggleSwitch";
import ToggleGroupThree from "./Buttons/ToggleGroupThree";
import Pool from "./PoolWater/Pool";
import SliderControlPool from "./PoolWater/SliderControlPool";
import {
  addTopicListener,
  removeTopicListener,
  isWebSocketConnected,
  connectWebSocket
} from "../Socket/WebSocketService"; // Assuming WebSocketService manages your socket connection

// Tạo animation
const slideLeft = createItemInvoiceAnimation("left");
const slideRight = createItemInvoiceAnimation("right");

function AdminDashboard() {
  const [ratio, setRatio] = useState(0);
  const [waterLevelInfo, setWaterLevelInfo] = useState({
    distance: 0,
    tankHeight: 15,
    percentage: 0
  });
  const [sensorData, setSensorData] = useState({
    temperature: 0,
    tds: 0,
    flowRate: 0,
    pumpState: 0
  });

  // State để quản lý cảnh báo rò rỉ
  const [leakAlert, setLeakAlert] = useState({
    detected: false,
    type: 0,
    timestamp: null
  });

  // Sử dụng useRef để theo dõi xem component đã mount chưa
  const isMounted = React.useRef(false);

  // Hàm xử lý reset leak
  const handleResetLeak = () => {
    console.log('Gửi lệnh reset leak');
    fetch('http://localhost:4000/api/v1/config/reset-leak', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    })
    .then(response => response.json())
    .then(data => {
      console.log('Reset leak thành công:', data);
      // Cập nhật trạng thái cảnh báo rò rỉ
      setLeakAlert({
        detected: false,
        type: 0,
        timestamp: null
      });
    })
    .catch(error => {
      console.error('Lỗi khi reset leak:', error);
    });
  };

  const [config, setConfig] = useState({ alerts_enabled: true });

  useEffect(() => {
    // Chỉ khởi tạo giá trị mặc định nếu component chưa được mount
    if (!isMounted.current) {
      // Đánh dấu component đã được mount
      isMounted.current = true;

      // Khởi tạo giá trị mặc định cho waterLevelInfo
      setWaterLevelInfo({
        distance: 5,
        tankHeight: 15,
        percentage: 66.7
      });

      // Khởi tạo giá trị mặc định cho ratio
      setRatio(0.667);

      // Khởi tạo giá trị mặc định cho sensorData
      setSensorData({
        temperature: 25,
        tds: 300,
        flowRate: 0,
        pumpState: 0
      });

      console.log('AdminDashboard mounted - đã khởi tạo giá trị mặc định');
    }

    // WebSocket data handler
    const handleMqttData = (newData) => {
      console.log('Nhận dữ liệu mới:', newData);
      try {
        let sensorData;
        
        // Lấy dữ liệu từ payload của WebSocketServer
        if (newData.payload) {
          sensorData = newData.payload;
          console.log('Dữ liệu cảm biến từ payload:', sensorData);
        } else {
          console.error("Invalid sensor data format", newData);
          return;
        }

        // Cập nhật trạng thái rò rỉ từ dữ liệu WebSocketServer
        if ('leakDetected' in sensorData && 'leakType' in sensorData) {
          console.log('Cập nhật trạng thái rò rỉ:', {
            detected: sensorData.leakDetected,
            type: sensorData.leakType
          });
          
          setLeakAlert({
            detected: Boolean(sensorData.leakDetected),
            type: Number(sensorData.leakType),
            timestamp: sensorData.leakDetected ? new Date().toISOString() : null
          });
        }

        // Bỏ qua các lệnh điều khiển
        if (
          sensorData === "off" ||
          sensorData === "on" ||
          sensorData === "auto"
        ) {
          console.log('Bỏ qua lệnh điều khiển:', sensorData);
          return;
        }

        // Lấy thông tin khoảng cách và chiều cao bể
        const distance = parseFloat(sensorData.distance) || 0;
        const tankHeight = parseFloat(sensorData.tankHeight) || 15; // Mặc định 15cm nếu không có dữ liệu

        console.log('Khoảng cách:', distance, 'Chiều cao bể:', tankHeight);

        // Tính toán tỷ lệ mực nước
        let waterRatio;
        let percentage;

        if (sensorData.currentLevelPercent !== undefined) {
          // Nếu dữ liệu đã có currentLevelPercent (từ simulator)
          percentage = parseFloat(sensorData.currentLevelPercent);
          waterRatio = percentage / 100;
          console.log('Sử dụng currentLevelPercent:', percentage);
        } else if (distance !== undefined) {
          // Nếu chỉ có khoảng cách (từ ESP32 thực)
          percentage = Math.round(((tankHeight - distance) / tankHeight) * 100 * 10) / 10;
          waterRatio = percentage / 100;
          console.log('Tính toán từ khoảng cách:', percentage);
        } else {
          console.error("Missing water level data");
          return;
        }

        // Đảm bảo tỷ lệ nằm trong khoảng [0, 1]
        waterRatio = Math.min(Math.max(waterRatio, 0), 1);
        percentage = Math.min(Math.max(percentage, 0), 100);

        console.log('Tỷ lệ cuối cùng:', waterRatio, 'Phần trăm:', percentage);

        // Cập nhật thông tin mực nước
        const newWaterLevelInfo = {
          distance: distance,
          tankHeight: tankHeight,
          percentage: percentage
        };

        setWaterLevelInfo(newWaterLevelInfo);
        console.log('Đã cập nhật WaterLevelInfo:', newWaterLevelInfo);

        // Cập nhật dữ liệu cảm biến
        const newSensorData = {
          temperature: parseFloat(sensorData.temperature) || 0,
          tds: parseFloat(sensorData.tds) || 0,
          flowRate: parseFloat(sensorData.flowRate) || 0,
          pumpState: parseInt(sensorData.pumpState) || 0
        };

        setSensorData(newSensorData);
        console.log('Đã cập nhật SensorData:', newSensorData);

        // Cập nhật tỷ lệ cho hiển thị bể nước
        setRatio(waterRatio);
        console.log(`Cập nhật mực nước: ${percentage.toFixed(1)}% (Khoảng cách: ${distance.toFixed(1)}cm)`);
        console.log(`Nhiệt độ: ${sensorData.temperature}°C | TDS: ${sensorData.tds} ppm | Lưu lượng: ${sensorData.flowRate} L/phút`);
      } catch (error) {
        console.error("Error processing sensor data:", error);
      }
    };

    // Chỉ đăng ký listener cho topic sensor_data
    addTopicListener("sensor_data", handleMqttData);
    
    return () => {
      removeTopicListener("sensor_data", handleMqttData);
    };
  }, []); // Empty dependency array ensures this runs once on mount
  console.log('Leak: ', leakAlert);
  

  return (
    <Box
      sx={{
        height: "auto",
        minHeight: `calc(100vh - ${HEIGHT_FOOTER}px - ${MARGIN_HEADING / 8}px)`,
        marginTop: MARGIN_HEADING / 8,
        display: "flex",
        flexDirection: { xs: "column", md: "row" },
        alignItems: "flex-start", // Đổi từ center sang flex-start
        overflowY: { xs: "auto", md: "hidden" },
        overflowX: "hidden",
        padding: "16px 24px", // Tăng padding để tạo khoảng cách
      }}
    >
      {/* Phần điều khiển máy bơm và cảnh báo rò rỉ */}
      <Box
        sx={{
          flex: 1,
          marginRight: { xs: 0, md: "24px" }, // Thêm khoảng cách giữa hai cột khi hiển thị trên desktop
          display: "flex",
          flexDirection: "column",
          width: "100%",
          height: "100%",
          justifyContent: "flex-start",
          alignItems: "center",
          gap: 4, // Tăng khoảng cách giữa các box
          padding: "16px",
        }}
      >
        {/* Phần cảnh báo rò rỉ */}
        {config.alerts_enabled && (
          <Paper
          elevation={3}
          sx={{
            width: "100%",
            padding: "20px", // Tăng padding cho các Paper
            borderRadius: BORDER_RADIUS_SMALL,
            backgroundColor: leakAlert.detected ? "#fff4e5" : "#f5f5f5",
            border: leakAlert.detected ? "1px solid #ff9800" : "none",
          }}
        >
          <Typography variant="h6" gutterBottom>
            Trạng thái cảnh báo rò rỉ
          </Typography>

          {leakAlert.detected ? (
            <>
              <Alert
                severity="warning"
                sx={{ mb: 2 }}
              >
                <AlertTitle>Phát hiện rò rỉ nước!</AlertTitle>
                Loại rò rỉ: {leakAlert.type === 1 ? "Rò rỉ nhỏ" : "Rò rỉ lớn"}
                {leakAlert.timestamp && (
                  <Typography variant="body2">
                    Thời gian: {new Date(leakAlert.timestamp).toLocaleString()}
                  </Typography>
                )}
              </Alert>
              <Button
                variant="contained"
                color="warning"
                onClick={handleResetLeak}
                fullWidth
              >
                Reset cảnh báo rò rỉ
              </Button>
            </>
          ) : (
            <Alert severity="success">
              Không phát hiện rò rỉ nước
            </Alert>
          )}
        </Paper>
        )}

        {/* Phần điều khiển máy bơm */}
        <Paper
          elevation={3}
          sx={{
            width: "100%",
            padding: "20px", // Tăng padding cho các Paper
            borderRadius: BORDER_RADIUS_SMALL,
          }}
        >
          <Typography variant="h6" gutterBottom>
            Điều khiển máy bơm
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <Typography variant="subtitle2" gutterBottom>
                Trạng thái máy bơm
              </Typography>
              <ToggleSwitch />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="subtitle2" gutterBottom>
                Chế độ hoạt động
              </Typography>
              <ToggleGroupThree />
            </Grid>
          </Grid>
        </Paper>

        {/* Không còn phần điều khiển mực nước ở đây nữa */}
      </Box>

      {/* Phần hiển thị bể nước và thông tin cảm biến */}
      <Box
        sx={{
          flex: 1,
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
          padding: "16px 16px 0 16px",
        }}
      >
        {/* Phần điều khiển mực nước */}
        <Paper
          elevation={3}
          sx={{
            width: "100%",
            padding: "20px", // Tăng padding cho các Paper
            borderRadius: BORDER_RADIUS_SMALL,
            marginBottom: "20px", // Tăng khoảng cách giữa slider và bể nước
          }}
        >
          <Typography variant="h6" gutterBottom>
            Điều khiển mực nước
          </Typography>
          <SliderControlPool />
        </Paper>

        <Box
          sx={{
            width: "100%",
            flex: 3,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexDirection: "column",
          }}
        >
          <Pool ratio={ratio} />

          {/* Hiển thị thông tin mực nước và EC (TDS) */}
          <Box
            sx={{
              width: "100%",
              display: "flex",
              justifyContent: "space-around",
              marginTop: "24px", // Tăng khoảng cách giữa bể nước và thông tin cảm biến
              padding: "0 20px",
            }}
          >
            <Box
              sx={{
                backgroundColor: "#f5f5f5",
                borderRadius: "10px",
                padding: "16px 20px", // Tăng padding cho các box thông tin
                boxShadow: "0 2px 5px rgba(0,0,0,0.1)",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                width: "45%",
              }}
            >
              <Typography variant="subtitle1" fontWeight="bold" color="primary">
                Mực nước
              </Typography>
              <Typography variant="h5" fontWeight="bold" color="secondary">
                {waterLevelInfo.percentage.toFixed(1)}%
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Khoảng cách: {waterLevelInfo.distance.toFixed(1)} cm
              </Typography>
            </Box>

            <Box
              sx={{
                backgroundColor: "#f5f5f5",
                borderRadius: "10px",
                padding: "16px 20px", // Tăng padding cho các box thông tin
                boxShadow: "0 2px 5px rgba(0,0,0,0.1)",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                width: "45%",
              }}
            >
              <Typography variant="subtitle1" fontWeight="bold" color="primary">
                Độ đục (TDS)
              </Typography>
              <Typography variant="h5" fontWeight="bold" color="secondary">
                {sensorData?.tds || 0} ppm
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Nhiệt độ: {sensorData?.temperature || 0}°C
              </Typography>
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}

// Sử dụng memo để tránh re-render không cần thiết
export default memo(AdminDashboard);
