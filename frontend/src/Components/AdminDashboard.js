import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
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
import logoImage from "../Assets/Images/logo.png"; // Đường dẫn ảnh logo
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
        // marginRight: { xs: "10px", sm: "30px", md: "50px" },
        // marginLeft: { xs: "10px", sm: "30px", md: "50px" },
        overflowY: { xs: "auto", md: "hidden" },
        overflowX: "hidden",
      }}
    >
      <Box
        sx={{
          height: `calc(100vh - (${HEIGHT_USERINFO}px + ${HEIGHT_FOOTER}px + ${MARGIN_HEADING}px))`,
          position: "relative",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          // backgroundColor: '#f0f0f0'
          // marginTop: MARGIN_HEADING / 8,
          flex: 2,
        }}
      >
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            maxWidth: "900px",
            minWidth: { xs: "300px", sm: "500px", md: "800px" },
            width: { xs: "95%", sm: "90%", md: "80%" },
            height: { xs: "auto", md: "80%" },
            flexDirection: { xs: "column", md: "row" },
          }}
        >
          <Box
            sx={{
              flex: 2, // Box thứ nhất chiếm 2 phần
              backgroundColor: COLOR_CONTENT_ADMIN, // Màu để dễ phân biệt (tuỳ chọn)
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              borderTopLeftRadius: BORDER_RADIUS_BIG * 2,
              borderBottomLeftRadius: BORDER_RADIUS_BIG * 2,
              animation: `${slideLeft} 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) 0.3s both`,
            }}
          >
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                width: "80%",
                height: "80%", // Chiều cao Box (tuỳ chỉnh theo ý bạn)
                backgroundColor: "#fff", // Màu nền (tuỳ chỉnh)
                border: `3px solid ${THEME_COLOR_BORDER}`, // Viền Box (tuỳ chỉnh)
                borderRadius: BORDER_RADIUS_MEDIUM, // Bo góc (tuỳ chỉnh)
                padding: "16px", // Khoảng cách bên trong
                boxShadow: `rgba(0, 0, 0, 0.25) 0px 25px 50px -12px`,
              }}
            >
              {/* Logo */}
              <Box
                component="img"
                src={logoImage}
                alt="Logo"
                sx={{
                  width: "85%",
                }}
              />
              <Typography
                variant="h3"
                sx={{
                  fontWeight: "bold",
                  color: "#333",
                  textShadow: `2px 2px 2px ${hexToRgba(THEME_COLOR_BORDER)}`,
                  marginTop: "40px",
                }}
              >
                Welcome Admin
              </Typography>
            </Box>
          </Box>
          <Box
            sx={{
              flex: 1, // Box thứ hai chiếm 1 phần
              backgroundColor: "#fff", // Màu để dễ phân biệt (tuỳ chọn)
              borderTopRightRadius: BORDER_RADIUS_BIG,
              borderBottomRightRadius: BORDER_RADIUS_BIG,
              boxShadow: `${hexToRgba(
                COLOR_CONTENT_ADMIN,
                0.4
              )} 5px 5px, ${hexToRgba(
                COLOR_CONTENT_ADMIN,
                0.3
              )} 10px 10px, ${hexToRgba(
                COLOR_CONTENT_ADMIN,
                0.2
              )} 15px 15px, ${hexToRgba(
                COLOR_CONTENT_ADMIN,
                0.1
              )} 20px 20px, ${hexToRgba(COLOR_CONTENT_ADMIN, 0.05)} 25px 25px`,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              animation: `${slideRight} 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) 0.3s both`,
            }}
          >
            <Box
              sx={{
                display: "flex",
                flex: 1,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <ToggleSwitch></ToggleSwitch>
            </Box>
            <Box
              sx={{
                display: "flex",
                flex: 3,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <ToggleGroupThree></ToggleGroupThree>
            </Box>
          </Box>
        </Box>
      </Box>
      <Box
        sx={{
          flex: 1,
          // backgroundColor : '#666'
          width: "100%",
          height: "80%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
        }}
      >
        <Box
          sx={{
            flex: 1,
            width: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <SliderControlPool></SliderControlPool>
        </Box>
        <Box
          sx={{
            flex: 3,
            width: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexDirection: "column",
          }}
        >
          <Pool ratio={ratio}></Pool>

          {/* Hiển thị thông tin mực nước và EC (TDS) */}
          <Box
            sx={{
              width: "100%",
              display: "flex",
              justifyContent: "space-around",
              marginTop: "20px",
              padding: "0 20px",
            }}
          >
            <Box
              sx={{
                backgroundColor: "#f5f5f5",
                borderRadius: "10px",
                padding: "10px 15px",
                boxShadow: "0 2px 5px rgba(0,0,0,0.1)",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
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
                padding: "10px 15px",
                boxShadow: "0 2px 5px rgba(0,0,0,0.1)",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
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

export default AdminDashboard;
