import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import {
  BORDER_RADIUS_BIG,
  BORDER_RADIUS_MEDIUM,
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
import ToggleSwitch from "./Buttons/Toggles/ToggleSwitch";
import ToggleGroupThree from "./Buttons/ToggleGroupThree";
import Pool from "./PoolWater/Pool";
import SliderControlPool from "./PoolWater/SliderControlPool";
import {
  addTopicListener,
  removeTopicListener,
} from "../Socket/WebSocketService"; // Assuming WebSocketService manages your socket connection
function AdminDashboard() {
  const slideLeft = createItemInvoiceAnimation("-100px");
  const slideRight = createItemInvoiceAnimation("100px");
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  // State để quản lý ratio của pool
  // const [activeToggle, setActiveToggle] = useState(1);
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
  useEffect(() => {
    // WebSocket data handler
    const handleMqttData = (newData) => {
      try {
        // Bỏ qua các lệnh điều khiển
        if (
          newData.data === "off" ||
          newData.data === "on" ||
          newData.data === "auto"
        )
          return;

        // Xử lý dữ liệu cảm biến
        let sensorData;

        if (typeof newData.data === 'string') {
          sensorData = JSON.parse(newData.data);
        } else if (newData.payload) {
          sensorData = newData.payload;
        } else {
          console.error("Invalid sensor data format");
          return;
        }

        // Lấy thông tin khoảng cách và chiều cao bể
        const distance = parseFloat(sensorData.distance) || 0;
        const tankHeight = parseFloat(sensorData.tankHeight) || 15; // Mặc định 15cm nếu không có dữ liệu

        // Tính toán tỷ lệ mực nước
        let waterRatio;
        let percentage;

        if (sensorData.currentLevelPercent !== undefined) {
          // Nếu dữ liệu đã có currentLevelPercent (từ simulator)
          percentage = parseFloat(sensorData.currentLevelPercent);
          waterRatio = percentage / 100;
        } else if (distance !== undefined) {
          // Nếu chỉ có khoảng cách (từ ESP32 thực)
          percentage = Math.round(((tankHeight - distance) / tankHeight) * 100 * 10) / 10;
          waterRatio = percentage / 100;
        } else {
          console.error("Missing water level data");
          return;
        }

        // Đảm bảo tỷ lệ nằm trong khoảng [0, 1]
        waterRatio = Math.min(Math.max(waterRatio, 0), 1);
        percentage = Math.min(Math.max(percentage, 0), 100);

        // Cập nhật thông tin mực nước
        setWaterLevelInfo({
          distance: distance,
          tankHeight: tankHeight,
          percentage: percentage
        });

        // Cập nhật dữ liệu cảm biến
        setSensorData({
          temperature: parseFloat(sensorData.temperature) || 0,
          tds: parseFloat(sensorData.tds) || 0,
          flowRate: parseFloat(sensorData.flowRate) || 0,
          pumpState: parseInt(sensorData.pumpState) || 0
        });

        // Cập nhật tỷ lệ cho hiển thị bể nước
        setRatio(waterRatio);
        console.log(`Cập nhật mực nước: ${percentage.toFixed(1)}% (Khoảng cách: ${distance.toFixed(1)}cm)`);
        console.log(`Nhiệt độ: ${sensorData.temperature}°C | TDS: ${sensorData.tds} ppm | Lưu lượng: ${sensorData.flowRate} L/phút`);
      } catch (error) {
        console.error("Error processing sensor data:", error);
      }
    };

    // Add WebSocket event listeners
    addTopicListener("/sensor/data", handleMqttData);

    // Cleanup on component unmount
    return () => {
      console.log("Component unmounted. Gỡ bỏ các listener và ngắt kết nối...");
      removeTopicListener("/sensor/data", handleMqttData);
    };
  }, []); // Empty dependency array ensures this runs once on mount

  // Hàm xử lý sự kiện thay đổi toggle - hiện tại không sử dụng
  // const handleToggle = (event, newToggle) => {
  //   // Nếu chọn một giá trị hợp lệ thì cập nhật state
  //   if (newToggle !== null) {
  //     setActiveToggle(newToggle);
  //   }
  // };
  return (
    <Box
      sx={{
        height: `calc(100vh - (${HEIGHT_USERINFO}px + ${HEIGHT_FOOTER}px + ${MARGIN_HEADING}px))`,
        marginTop: MARGIN_HEADING / 8,
        display: "flex",
        flexDirection: { xs: "column", md: "row" },
        alignItems: "center",
        padding: { xs: "10px", sm: "15px", md: "20px" },
        overflowY: { xs: "auto", md: "hidden" },
        overflowX: "hidden",
        paddingTop: isMobile ? "65px" : MARGIN_HEADING / 8, // Thêm padding-top cho mobile để tránh bị AppBar che
        paddingBottom: isMobile ? "65px" : "20px", // Thêm padding-bottom cho mobile để tránh bị BottomNavigation che
      }}
    >
      {/* Phần điều khiển máy bơm */}
      <Box
        sx={{
          flex: { xs: 1, md: 1 },
          width: "100%",
          height: { xs: "auto", md: "80%" },
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: { xs: "20px", md: 0 },
          marginRight: { xs: 0, md: "20px" },
          maxWidth: { xs: "100%", sm: "500px", md: "600px" },
          margin: { xs: "0 auto 20px", md: "0 20px 0 0" },
        }}
      >
        <Box
          sx={{
            backgroundColor: "#fff",
            borderRadius: { xs: BORDER_RADIUS_BIG / 2, sm: BORDER_RADIUS_BIG / 1.5, md: BORDER_RADIUS_BIG },
            boxShadow: `${hexToRgba(COLOR_CONTENT_ADMIN, 0.4)} 5px 5px, ${hexToRgba(COLOR_CONTENT_ADMIN, 0.3)} 10px 10px, ${hexToRgba(COLOR_CONTENT_ADMIN, 0.2)} 15px 15px, ${hexToRgba(COLOR_CONTENT_ADMIN, 0.1)} 20px 20px, ${hexToRgba(COLOR_CONTENT_ADMIN, 0.05)} 25px 25px`,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: { xs: "12px", sm: "18px", md: "25px" },
            width: "100%",
            maxWidth: { xs: "100%", sm: "450px", md: "500px" },
            animation: `${slideRight} 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) 0.3s both`,
          }}
        >
          <Box
            sx={{
              display: "flex",
              width: "100%",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: { xs: "15px", sm: "20px" },
            }}
          >
            <ToggleSwitch></ToggleSwitch>
          </Box>
          <Box
            sx={{
              display: "flex",
              width: "100%",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <ToggleGroupThree></ToggleGroupThree>
          </Box>
        </Box>
      </Box>

      {/* Phần hiển thị thông tin bể nước và cảm biến */}
      <Box
        sx={{
          flex: { xs: 1, md: 1 },
          width: "100%",
          height: { xs: "auto", md: "80%" },
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
          marginLeft: { xs: 0, md: "20px" },
          maxWidth: { xs: "100%", sm: "500px", md: "600px" },
          margin: { xs: "0 auto", md: "0 0 0 20px" },
        }}
      >
        <Box
          sx={{
            width: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: { xs: "15px", sm: "20px" },
          }}
        >
          <SliderControlPool></SliderControlPool>
        </Box>
        <Box
          sx={{
            width: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexDirection: "column",
            backgroundColor: "#fff",
            borderRadius: { xs: BORDER_RADIUS_BIG / 2, sm: BORDER_RADIUS_BIG / 1.5, md: BORDER_RADIUS_BIG },
            padding: { xs: "12px", sm: "18px", md: "20px" },
            boxShadow: `${hexToRgba(COLOR_CONTENT_ADMIN, 0.3)} 0px 5px 15px`,
            animation: `${slideLeft} 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) 0.3s both`,
          }}
        >
          <Box
            sx={{
              width: "100%",
              maxWidth: { xs: "200px", sm: "250px", md: "300px" },
              marginBottom: { xs: "15px", sm: "20px" },
              margin: "0 auto 15px",
            }}
          >
            <Pool ratio={ratio}></Pool>
          </Box>

          {/* Hiển thị thông tin mực nước và EC (TDS) */}
          <Box
            sx={{
              width: "100%",
              display: "flex",
              flexDirection: { xs: "column", sm: "row" },
              justifyContent: "space-around",
              alignItems: "center",
              marginTop: { xs: "10px", sm: "20px" },
              gap: { xs: "15px", sm: "20px" },
              padding: { xs: "0 10px", sm: "0 15px" },
            }}
          >
            <Box
              sx={{
                backgroundColor: "#f5f5f5",
                borderRadius: { xs: "6px", sm: "8px", md: "10px" },
                padding: { xs: "6px 10px", sm: "8px 12px", md: "10px 15px" },
                boxShadow: "0 2px 5px rgba(0,0,0,0.1)",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                width: { xs: "100%", sm: "auto" },
                minWidth: { xs: "auto", sm: "150px" },
              }}
            >
              <Typography
                variant="subtitle1"
                fontWeight="bold"
                color="primary"
                sx={{ fontSize: { xs: "0.9rem", sm: "1rem" } }}
              >
                Mực nước
              </Typography>
              <Typography
                variant="h5"
                fontWeight="bold"
                color="secondary"
                sx={{ fontSize: { xs: "1.5rem", sm: "1.75rem", md: "2rem" } }}
              >
                {waterLevelInfo.percentage.toFixed(1)}%
              </Typography>
              <Typography
                variant="body2"
                color="textSecondary"
                sx={{ fontSize: { xs: "0.75rem", sm: "0.875rem" } }}
              >
                Khoảng cách: {waterLevelInfo.distance.toFixed(1)} cm
              </Typography>
            </Box>

            <Box
              sx={{
                backgroundColor: "#f5f5f5",
                borderRadius: { xs: "6px", sm: "8px", md: "10px" },
                padding: { xs: "6px 10px", sm: "8px 12px", md: "10px 15px" },
                boxShadow: "0 2px 5px rgba(0,0,0,0.1)",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                width: { xs: "100%", sm: "auto" },
                minWidth: { xs: "auto", sm: "150px" },
              }}
            >
              <Typography
                variant="subtitle1"
                fontWeight="bold"
                color="primary"
                sx={{ fontSize: { xs: "0.9rem", sm: "1rem" } }}
              >
                Độ đục (TDS)
              </Typography>
              <Typography
                variant="h5"
                fontWeight="bold"
                color="secondary"
                sx={{ fontSize: { xs: "1.5rem", sm: "1.75rem", md: "2rem" } }}
              >
                {sensorData?.tds || 0} ppm
              </Typography>
              <Typography
                variant="body2"
                color="textSecondary"
                sx={{ fontSize: { xs: "0.75rem", sm: "0.875rem" } }}
              >
                Nhiệt độ: {sensorData?.temperature || 0}°C
              </Typography>
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}

export default AdminDashboard;
