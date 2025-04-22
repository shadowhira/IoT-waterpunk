import React, { useState, useEffect } from "react";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Box, TextField } from "@mui/material";
import {
  MARGIN_HEADING,
  THEME_COLOR_BORDER,
} from "../../Assets/Constants/constants";
import Heading from "../Heading/Heading";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const WaterDataChart = () => {
  const [waterQualityData, setWaterQualityData] = useState([]);
  const [selectedDate, setSelectedDate] = useState("");
  const [loading, setLoading] = useState(true);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    fetchDataFake();
  }, [selectedDate]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const fetchDataFake = () => {
    const data = [];
    const selected = selectedDate ? new Date(selectedDate) : new Date();

    for (let i = 0; i < 24; i++) {
      const hour = new Date(selected.setHours(i, 0, 0, 0)); // Set each hour of the day
      const timeString = hour.toISOString().slice(11, 13); // Extract HH format for labels
      // random data from 0 to 100
      let turbidity;
      const randomTurbidity = Math.random();
      if (randomTurbidity < 0.9) {
        turbidity = Math.random() * 100; // 90% chance to get a value between 0 and 100
      } else if (randomTurbidity < 0.95) {
        turbidity = 500; // 5% chance to get a value of 500
      } else {
        turbidity = 800; // 5% chance to get a value of 1000
      }

      //   const turbidity = Math.random() * 100 ; // Random turbidity value

      let temperature;
      const randomTemp = Math.random();
      if (randomTemp < 0.9) {
        temperature = 25 + Math.random() * 10; // 90% chance to get a value between 25 and 35
      } else if (randomTemp < 0.95) {
        temperature = 40; // 5% chance to get a value of 40
      } else {
        temperature = 50; // 5% chance to get a value of 50
      }
      // const ec = Math.random() * 2000; // Random EC value
      data.push({ time: timeString, turbidity, temperature });
    }

    setWaterQualityData(data);
    setLoading(false);
  };

  const chartData = {
    labels: waterQualityData.map((data) => `${data.time}:00`), // Display time in HH:00 format
    datasets: [
      {
        label: "Turbidity (NTU)",
        data: waterQualityData.map((data) => data.turbidity),
        borderColor: "rgba(75, 192, 192, 1)",
        fill: false,
        tension: 0.1,
      },
      {
        label: "Temperature (°C)",
        data: waterQualityData.map((data) => data.temperature),
        borderColor: "rgba(255, 99, 132, 1)",
        fill: false,
        tension: 0.1,
      },
      // {
      //     label: 'EC (µS/cm)',
      //     data: waterQualityData.map(data => data.ec),
      //     borderColor: 'rgba(54, 162, 235, 1)',
      //     fill: false,
      //     tension: 0.1,
      // },
    ],
  };

  const handleDateChange = (e) => {
    setSelectedDate(e.target.value);
  };

  if (loading) return <div>Loading...</div>;

  return (
    <Box sx={{ width: "100%", height: "80vh" }}>
      <Heading
        text="Biểu đồ dữ liệu nước"
        margin={MARGIN_HEADING}
        themeColorBorder={THEME_COLOR_BORDER}
      ></Heading>
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          mb: { xs: 2, sm: 3 },
          flexDirection: { xs: "column", sm: "row" },
          gap: { xs: "10px", sm: "0" }
        }}
      >
        <TextField
          label="Chọn ngày"
          type="date"
          value={selectedDate}
          onChange={handleDateChange}
          InputLabelProps={{ shrink: true }}
          sx={{
            width: { xs: "90%", sm: "auto" },
            mr: { xs: 0, sm: 2 }
          }}
        />
      </Box>
      <Box
        sx={{
          width: { xs: "95%", sm: "90%" },
          height: { xs: "50vh", sm: "60vh", md: "80%" },
          mx: "auto"
        }}
      >
        <Line
          data={chartData}
          options={{
            responsive: true,
            maintainAspectRatio: false,
            scales: {
              x: {
                ticks: {
                  maxRotation: 90,
                  autoSkip: true,
                  autoSkipPadding: 10,
                  font: {
                    size: { xs: 8, sm: 10, md: 12 }
                  }
                }
              },
              y: {
                ticks: {
                  font: {
                    size: { xs: 8, sm: 10, md: 12 }
                  }
                }
              }
            }
          }}
        />
      </Box>
    </Box>
  );
};

export default WaterDataChart;
