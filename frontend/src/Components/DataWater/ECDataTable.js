import React, { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TableSortLabel,
} from "@mui/material";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward"; // Normal state icon
import {
  BORDER_RADIUS_SMALL,
  MARGIN_HEADING,
  THEME_COLOR_BORDER,
  TIME_DELAY_TABLE,
  TRANSITION_TABLE,
} from "../../Assets/Constants/constants";
import { createTableAnimation } from "../../Assets/Constants/utils";
import Heading from "../Heading/Heading";
import {
  addTopicListener,
  removeTopicListener,
} from "../../Socket/WebSocketService"; // Assuming WebSocketService manages your socket connection

const initialData = [];

function ECDataTable() {
  const [data, setData] = useState(initialData);
  const [order, setOrder] = useState("asc");
  const [orderBy, setOrderBy] = useState("ecValue");

  useEffect(() => {
    // WebSocket data handler
    const handleMqttData = (newData) => {
      console.log("Phản hồi từ server:", newData);

      if (
        newData.data === "off" ||
        newData.data === "on" ||
        newData.data === "auto"
      )
        return;

      // Parse new data and update state
      const newParsedData = JSON.parse(newData.data);
      console.log("Dữ liệu mới:", typeof newParsedData);

      setData((prevData) => {
        // Ensure that the data array doesn't exceed 15 items
        const updatedData =
          prevData.length < 15
            ? [newParsedData, ...prevData] // Add new data to the front if there are less than 15 items
            : [newParsedData, ...prevData.slice(0, prevData.length - 1)]; // Otherwise, remove the last item and add the new one

        // console.log("Dữ liệu mới:", updatedData);
        // initialData = updatedData;
        return updatedData;
      });
    };

    // Add WebSocket event listeners
    addTopicListener("/sensor/data", handleMqttData);

    // Cleanup on component unmount
    return () => {
      console.log("Component unmounted. Gỡ bỏ các listener và ngắt kết nối...");
      removeTopicListener("/sensor/data", handleMqttData);
    };
  }, []); // Empty dependency array ensures this runs once on mount

  // Sorting functionality
  const handleSort = (property) => {
    if (orderBy === property) {
      if (order === "asc") {
        setOrder("desc");
      } else if (order === "desc") {
        setOrder(""); // Reset to no sorting
      } else {
        setOrder("asc");
      }
    } else {
      setOrder("asc");
      setOrderBy(property);
    }
  };

  // Sorting logic
  const sortedData = (() => {
    if (order === "") return data;
    return [...data].sort((a, b) => {
      if (a[orderBy] < b[orderBy]) return order === "asc" ? -1 : 1;
      if (a[orderBy] > b[orderBy]) return order === "asc" ? 1 : -1;
      return 0;
    });
  })();

  // Function to determine row background color based on conditions
  const getBackgroundColor = (
    temperature,
    tds,
    tempThreshold,
    tdsThreshold
  ) => {
    if (temperature >= tempThreshold || tds >= tdsThreshold) {
      return "lightcoral"; // Poor
    }
    return "lightgreen"; // Good
  };

  // Table slide down animation
  const slideDown = createTableAnimation(TRANSITION_TABLE);

  return (
    <div style={{ textAlign: "center", width: "100%", overflowX: "hidden" }}>
      <Heading
        text="Dữ liệu EC"
        margin={MARGIN_HEADING}
        themeColorBorder={THEME_COLOR_BORDER}
      />
      <TableContainer
        component={Paper}
        sx={{
          width: { xs: "95%", sm: "90%", md: "80%", lg: "70%" }, // Sử dụng đơn vị phần trăm thay vì vh
          height: { xs: "60vh", sm: "65vh", md: "70vh" }, // Điều chỉnh chiều cao theo kích thước màn hình
          margin: "auto",
          borderRadius: BORDER_RADIUS_SMALL,
          border: `3px solid ${THEME_COLOR_BORDER}`,
          boxShadow: "0px 4px 10px rgba(0, 0, 0, 0.2)",
          animation: `${slideDown} 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) ${TIME_DELAY_TABLE} both`,
          overflowX: "auto", // Cho phép cuộn ngang nếu bảng quá rộng
          maxWidth: "100%", // Đảm bảo không vượt quá kích thước màn hình
        }}
      >
        <Table>
          <TableHead
            style={{
              position: "sticky",
              top: 0,
              zIndex: 1,
              backgroundColor: "#fff",
            }}
          >
            <TableRow>
              <TableCell align="center">Temperature</TableCell>
              <TableCell align="center">
                <TableSortLabel
                  active={orderBy === "ecValue"}
                  direction={
                    orderBy === "ecValue"
                      ? order === ""
                        ? "asc"
                        : order
                      : "asc"
                  }
                  onClick={() => handleSort("ecValue")}
                  IconComponent={() => {
                    if (order === "") {
                      return <ArrowForwardIcon />;
                    }
                    return order === "asc" ? (
                      <ArrowUpwardIcon />
                    ) : (
                      <ArrowDownwardIcon />
                    );
                  }}
                >
                  TDS
                </TableSortLabel>
              </TableCell>
              <TableCell align="center">FlowRate (L/min)</TableCell>
              <TableCell align="center">Water Tank</TableCell>
              <TableCell align="center">PumpState</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {sortedData.map((row, index) => (
              <TableRow
                key={index}
                style={{
                  backgroundColor: getBackgroundColor(
                    row.temperature,
                    row.tds,
                    35,
                    500
                  ),
                }}
              >
                <TableCell align="center">{row.temperature}</TableCell>
                <TableCell align="center">{row.tds}</TableCell>
                <TableCell align="center">{row.flowRate}</TableCell>
                <TableCell align="center">
                  {Math.round(((15 - row.distance) / 15) * 100)}%
                </TableCell>
                <TableCell align="center">
                  {row.pumpState === 1 ? "on" : "off"}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </div>
  );
}

export default ECDataTable;
