import React, { useState, useEffect } from "react";
import { Bar } from "react-chartjs-2";
import { Box, TextField } from "@mui/material";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import {
  MARGIN_HEADING,
  THEME_COLOR_BORDER,
} from "../../Assets/Constants/constants";
import Heading from "../Heading/Heading";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

// Khai báo state cho dữ liệu và trạng thái tải
const WaterBillChart = () => {
  const [waterBillData, setWaterBillData] = useState([]);
  const [startMonth, setStartMonth] = useState("");
  const [endMonth, setEndMonth] = useState("");
  const [loading, setLoading] = useState(true);
  const [error] = useState(null);

  useEffect(() => {
    fetchDataFake();
  }, []);

  const fetchDataFake = () => {
    const data = [];
    const currentDate = new Date();

    for (let i = 30; i >= 0; i--) {
      const month = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth() - i,
        1
      );
      const monthString = month.toISOString().slice(0, 7); // Lấy chuỗi YYYY-MM
      const amount = Math.floor(Math.random() * 50) + 200; // Giả lập tiền nước từ 100 đến 1099
      data.push({ month: monthString, amount });
    }

    setWaterBillData(data);
    setLoading(false);

    // Thiết lập khoảng thời gian mặc định
    const endMonthValue = `${currentDate.getFullYear()}-${String(
      currentDate.getMonth() + 1
    ).padStart(2, "0")}`;
    const startDate = new Date();
    startDate.setMonth(currentDate.getMonth() - 11);
    const startMonthValue = `${startDate.getFullYear()}-${String(
      startDate.getMonth() + 1
    ).padStart(2, "0")}`;

    setStartMonth(startMonthValue);
    setEndMonth(endMonthValue);
  };

  const filterData = () => {
    return waterBillData.filter(
      (data) => data.month >= startMonth && data.month <= endMonth
    );
  };

  const chartData = {
    labels: filterData().map((data) => data.month),
    datasets: [
      {
        label: "Tiền nước",
        data: filterData().map((data) => data.amount),
        backgroundColor: "rgba(75, 192, 192, 0.6)",
      },
    ],
  };

  const handleStartMonthChange = (e) => {
    setStartMonth(e.target.value);
    console.log(waterBillData);
  };
  const handleEndMonthChange = (e) => setEndMonth(e.target.value);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <Box style={{ width: "100%", height: "80vh" }}>
      <Heading
        text="Biểu đồ tiền nước"
        margin={MARGIN_HEADING}
        themeColorBorder={THEME_COLOR_BORDER}
      ></Heading>
      <Box
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          width: "100%",
          height: "100%",
        }}
      >
        <Box
          sx={{
            marginBottom: { xs: "30px", sm: "50px" },
            display: "flex",
            flexDirection: { xs: "column", sm: "row" }, // Chuyển sang layout dọc trên màn hình nhỏ
            gap: { xs: "15px", sm: "20px" }, // Khoảng cách giữa các input
            width: "100%",
            justifyContent: "center",
            alignItems: "center"
          }}
        >
          <TextField
            label="Từ tháng"
            type="month"
            value={startMonth}
            onChange={handleStartMonthChange}
            sx={{
              width: { xs: "90%", sm: "auto" } // Chiều rộng 90% trên màn hình nhỏ
            }}
            InputLabelProps={{
              shrink: true,
            }}
            variant="outlined"
          />
          <TextField
            label="Đến tháng"
            type="month"
            value={endMonth}
            onChange={handleEndMonthChange}
            sx={{
              width: { xs: "90%", sm: "auto" } // Chiều rộng 90% trên màn hình nhỏ
            }}
            InputLabelProps={{
              shrink: true,
            }}
            variant="outlined"
          />
        </Box>
        <Box
          sx={{
            width: { xs: "95%", sm: "90%" },
            height: { xs: "50vh", sm: "60vh", md: "70%" },
            margin: "0 auto"
          }}
        >
          <Bar
            data={chartData}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              scales: {
                x: {
                  ticks: {
                    // Hiển thị nhãn trục x phù hợp với kích thước màn hình
                    maxRotation: 90, // Xoay nhãn 90 độ trên màn hình nhỏ
                    autoSkip: true,
                    autoSkipPadding: 10,
                    font: {
                      size: 10 // Kích thước font nhỏ hơn
                    }
                  }
                }
              }
            }}
          />
        </Box>
      </Box>
    </Box>
  );
};

export default WaterBillChart;
