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
  TablePagination,
  Box,
  TextField,
  Button,
  Typography,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  CircularProgress,
  IconButton,
  Tooltip
} from "@mui/material";
// Sử dụng TextField thay cho DatePicker
import RefreshIcon from '@mui/icons-material/Refresh';
import FilterListIcon from '@mui/icons-material/FilterList';
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
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
} from "../../Socket/WebSocketService";

function SensorDataTable() {
  // State for data and pagination
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalRows, setTotalRows] = useState(0);

  // State for sorting
  const [order, setOrder] = useState("desc");
  const [orderBy, setOrderBy] = useState("timestamp");

  // State for filtering
  const [showFilters, setShowFilters] = useState(false);
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [minTemp, setMinTemp] = useState("");
  const [maxTemp, setMaxTemp] = useState("");
  const [minTds, setMinTds] = useState("");
  const [maxTds, setMaxTds] = useState("");
  const [pumpState, setPumpState] = useState("all");

  // State for real-time data
  const [realtimeData, setRealtimeData] = useState(null);
  const [showRealtime, setShowRealtime] = useState(true);

  // Load initial data
  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, rowsPerPage]);

  // Listen for real-time data
  useEffect(() => {
    // WebSocket data handler
    const handleMqttData = (newData) => {
      try {
        // Skip control messages
        if (
          newData.data === "off" ||
          newData.data === "on" ||
          newData.data === "auto"
        )
          return;

        // Kiểm tra xem đã xử lý dữ liệu này chưa bằng cách sử dụng timestamp
        // Nếu đã có dữ liệu với timestamp giống nhau, bỏ qua
        if (realtimeData && newData.payload && newData.payload.timestamp === realtimeData.timestamp) {
          console.log("Bỏ qua dữ liệu trùng lặp", newData.payload.timestamp);
          return;
        }

        // Parse new data
        let sensorData;
        if (typeof newData.data === 'string') {
          sensorData = JSON.parse(newData.data);
        } else if (newData.payload) {
          sensorData = newData.payload;
        } else {
          console.error("Invalid sensor data format");
          return;
        }

        // Add timestamp if not present
        if (!sensorData.timestamp) {
          sensorData.timestamp = new Date().toISOString();
        }

        console.log("Đã nhận dữ liệu mới:", sensorData.timestamp);

        // Update real-time data
        setRealtimeData(sensorData);

        // If showing real-time data, add to the table
        if (showRealtime) {
          setData(prevData => {
            // Kiểm tra xem dữ liệu đã tồn tại trong bảng chưa
            const exists = prevData.some(item =>
              item.timestamp === sensorData.timestamp
            );

            if (exists) {
              console.log("Dữ liệu đã tồn tại trong bảng, không thêm lại");
              return prevData;
            }

            // Create a new array with the new data at the beginning
            const newData = [sensorData, ...prevData.slice(0, rowsPerPage - 1)];
            return newData;
          });
        }
      } catch (error) {
        console.error("Error processing sensor data:", error);
      }
    };

    // Chỉ lắng nghe một topic để tránh trùng lặp
    // Ưu tiên sử dụng topic "/sensor/data" vì đây là topic chính
    addTopicListener("/sensor/data", handleMqttData);

    // Cleanup on component unmount
    return () => {
      removeTopicListener("/sensor/data", handleMqttData);
    };
  }, [showRealtime, rowsPerPage, realtimeData]);

  // Fetch data from API
  const fetchData = async () => {
    setLoading(true);
    try {
      // Build query parameters
      const params = new URLSearchParams();
      params.append('page', page + 1); // API uses 1-based indexing
      params.append('limit', rowsPerPage);

      // Add filters if they exist
      if (startDate) params.append('startDate', startDate.toISOString());
      if (endDate) params.append('endDate', endDate.toISOString());
      if (minTemp) params.append('minTemp', minTemp);
      if (maxTemp) params.append('maxTemp', maxTemp);
      if (minTds) params.append('minTds', minTds);
      if (maxTds) params.append('maxTds', maxTds);
      if (pumpState !== 'all') params.append('pumpState', pumpState);

      // Fetch data from API
      const apiUrl = `${window.location.protocol}//${window.location.hostname}:4000/api/v1/sensor-data?${params.toString()}`;
      console.log('Fetching data from:', apiUrl);
      const response = await fetch(apiUrl);

      // Check if response is OK
      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
      }

      const result = await response.json();

      // Update state with fetched data
      if (result.data) {
        setData(result.data);
        setTotalRows(result.meta.total);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      // If API fails, use simulated data
      simulateData();
    } finally {
      setLoading(false);
    }
  };

  // Simulate data for testing
  const simulateData = () => {
    // Generate random data for testing
    const simulatedData = Array.from({ length: 50 }, (_, i) => {
      const date = new Date();
      date.setMinutes(date.getMinutes() - i * 10);

      return {
        timestamp: date.toISOString(),
        temperature: Math.round((20 + Math.random() * 15) * 10) / 10,
        tds: Math.round(Math.random() * 500),
        flowRate: Math.round(Math.random() * 10 * 10) / 10,
        distance: Math.round((5 + Math.random() * 10) * 10) / 10,
        pumpState: Math.random() > 0.5 ? 1 : 0,
        currentLevelPercent: Math.round(Math.random() * 100)
      };
    });

    // Update state with simulated data
    setData(simulatedData.slice(page * rowsPerPage, (page + 1) * rowsPerPage));
    setTotalRows(simulatedData.length);
  };

  // Apply filters
  const applyFilters = () => {
    fetchData();
  };

  // Reset filters
  const resetFilters = () => {
    setStartDate(null);
    setEndDate(null);
    setMinTemp("");
    setMaxTemp("");
    setMinTds("");
    setMaxTds("");
    setPumpState("all");
    fetchData();
  };

  // Handle page change
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  // Handle rows per page change
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Handle sorting
  const handleSort = (property) => {
    const isAsc = orderBy === property && order === "asc";
    setOrder(isAsc ? "desc" : "asc");
    setOrderBy(property);

    // Sort the data
    const sortedData = [...data].sort((a, b) => {
      if (a[property] < b[property]) return order === "asc" ? -1 : 1;
      if (a[property] > b[property]) return order === "asc" ? 1 : -1;
      return 0;
    });

    setData(sortedData);
  };

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  // Calculate water level percentage
  const calculateWaterLevel = (distance, tankHeight = 15) => {
    if (distance === undefined) return 0;
    const percentage = Math.round(((tankHeight - distance) / tankHeight) * 100);
    return Math.max(0, Math.min(100, percentage));
  };

  // Get background color based on values
  const getBackgroundColor = (temperature, tds) => {
    if (temperature >= 35 || tds >= 500) {
      return "rgba(255, 99, 71, 0.2)"; // Light red for poor quality
    }
    return "rgba(144, 238, 144, 0.2)"; // Light green for good quality
  };

  // Table slide down animation
  const slideDown = createTableAnimation(TRANSITION_TABLE);

  return (
    <div style={{ textAlign: "center", width: "100%", overflowX: "hidden" }}>
      <Heading
        text="Dữ liệu cảm biến"
        margin={MARGIN_HEADING}
        themeColorBorder={THEME_COLOR_BORDER}
      />

      {/* Controls */}
      <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', px: 2 }}>
        <Box>
          <Button
            variant="outlined"
            startIcon={<FilterListIcon />}
            onClick={() => setShowFilters(!showFilters)}
            sx={{ mr: 1 }}
          >
            {showFilters ? "Ẩn bộ lọc" : "Hiện bộ lọc"}
          </Button>

          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={fetchData}
          >
            Làm mới
          </Button>
        </Box>

        <Box>
          <Tooltip title={showRealtime ? "Tắt dữ liệu thời gian thực" : "Bật dữ liệu thời gian thực"}>
            <Chip
              label={showRealtime ? "Dữ liệu thời gian thực: BẬT" : "Dữ liệu thời gian thực: TẮT"}
              color={showRealtime ? "success" : "default"}
              onClick={() => setShowRealtime(!showRealtime)}
              sx={{ mr: 1 }}
            />
          </Tooltip>
        </Box>
      </Box>

      {/* Filters */}
      {showFilters && (
        <Box sx={{ mb: 3, p: 2, bgcolor: '#f5f5f5', borderRadius: 2 }}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                label="Từ ngày"
                type="date"
                value={startDate ? startDate.toISOString().split('T')[0] : ''}
                onChange={(e) => {
                  const date = e.target.value ? new Date(e.target.value) : null;
                  setStartDate(date);
                }}
                InputLabelProps={{ shrink: true }}
                fullWidth
              />
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <TextField
                label="Đến ngày"
                type="date"
                value={endDate ? endDate.toISOString().split('T')[0] : ''}
                onChange={(e) => {
                  const date = e.target.value ? new Date(e.target.value) : null;
                  setEndDate(date);
                }}
                InputLabelProps={{ shrink: true }}
                fullWidth
              />
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <TextField
                label="Nhiệt độ tối thiểu"
                type="number"
                value={minTemp}
                onChange={(e) => setMinTemp(e.target.value)}
                fullWidth
              />
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <TextField
                label="Nhiệt độ tối đa"
                type="number"
                value={maxTemp}
                onChange={(e) => setMaxTemp(e.target.value)}
                fullWidth
              />
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <TextField
                label="TDS tối thiểu"
                type="number"
                value={minTds}
                onChange={(e) => setMinTds(e.target.value)}
                fullWidth
              />
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <TextField
                label="TDS tối đa"
                type="number"
                value={maxTds}
                onChange={(e) => setMaxTds(e.target.value)}
                fullWidth
              />
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth>
                <InputLabel>Trạng thái máy bơm</InputLabel>
                <Select
                  value={pumpState}
                  onChange={(e) => setPumpState(e.target.value)}
                  label="Trạng thái máy bơm"
                >
                  <MenuItem value="all">Tất cả</MenuItem>
                  <MenuItem value="1">Bật</MenuItem>
                  <MenuItem value="0">Tắt</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6} md={3} sx={{ display: 'flex', alignItems: 'center' }}>
              <Button
                variant="contained"
                onClick={applyFilters}
                sx={{ mr: 1 }}
              >
                Áp dụng
              </Button>

              <Button
                variant="outlined"
                onClick={resetFilters}
              >
                Đặt lại
              </Button>
            </Grid>
          </Grid>
        </Box>
      )}

      {/* Real-time data display */}
      {realtimeData && showRealtime && (
        <Box sx={{ mb: 2, p: 2, bgcolor: '#e3f2fd', borderRadius: 2, maxWidth: '90%', mx: 'auto' }}>
          <Typography variant="h6" gutterBottom>
            Dữ liệu thời gian thực
          </Typography>

          <Grid container spacing={2}>
            <Grid item xs={6} sm={4} md={2}>
              <Typography variant="body2" color="textSecondary">Nhiệt độ</Typography>
              <Typography variant="body1" fontWeight="bold">{realtimeData.temperature}°C</Typography>
            </Grid>

            <Grid item xs={6} sm={4} md={2}>
              <Typography variant="body2" color="textSecondary">TDS</Typography>
              <Typography variant="body1" fontWeight="bold">{realtimeData.tds} ppm</Typography>
            </Grid>

            <Grid item xs={6} sm={4} md={2}>
              <Typography variant="body2" color="textSecondary">Lưu lượng</Typography>
              <Typography variant="body1" fontWeight="bold">{realtimeData.flowRate} L/phút</Typography>
            </Grid>

            <Grid item xs={6} sm={4} md={2}>
              <Typography variant="body2" color="textSecondary">Khoảng cách</Typography>
              <Typography variant="body1" fontWeight="bold">{realtimeData.distance} cm</Typography>
            </Grid>

            <Grid item xs={6} sm={4} md={2}>
              <Typography variant="body2" color="textSecondary">Mực nước</Typography>
              <Typography variant="body1" fontWeight="bold">
                {realtimeData.currentLevelPercent !== undefined
                  ? `${realtimeData.currentLevelPercent.toFixed(1)}%`
                  : `${calculateWaterLevel(realtimeData.distance)}%`}
              </Typography>
            </Grid>

            <Grid item xs={6} sm={4} md={2}>
              <Typography variant="body2" color="textSecondary">Máy bơm</Typography>
              <Chip
                label={realtimeData.pumpState === 1 ? "BẬT" : "TẮT"}
                color={realtimeData.pumpState === 1 ? "success" : "default"}
                size="small"
              />
            </Grid>
          </Grid>
        </Box>
      )}

      {/* Data table */}
      <TableContainer
        component={Paper}
        sx={{
          width: { xs: "95%", sm: "90%", md: "95%" },
          height: { xs: "60vh", sm: "65vh", md: "70vh" },
          margin: "auto",
          borderRadius: BORDER_RADIUS_SMALL,
          border: `3px solid ${THEME_COLOR_BORDER}`,
          boxShadow: "0px 4px 10px rgba(0, 0, 0, 0.2)",
          animation: `${slideDown} 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) ${TIME_DELAY_TABLE} both`,
          overflowX: "auto",
          maxWidth: "100%",
        }}
      >
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
            <CircularProgress />
          </Box>
        ) : (
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell align="center">
                  <TableSortLabel
                    active={orderBy === "timestamp"}
                    direction={orderBy === "timestamp" ? order : "asc"}
                    onClick={() => handleSort("timestamp")}
                    IconComponent={() => {
                      return order === "asc" ? (
                        <ArrowUpwardIcon />
                      ) : (
                        <ArrowDownwardIcon />
                      );
                    }}
                  >
                    Thời gian
                  </TableSortLabel>
                </TableCell>
                <TableCell align="center">
                  <TableSortLabel
                    active={orderBy === "temperature"}
                    direction={orderBy === "temperature" ? order : "asc"}
                    onClick={() => handleSort("temperature")}
                    IconComponent={() => {
                      return order === "asc" ? (
                        <ArrowUpwardIcon />
                      ) : (
                        <ArrowDownwardIcon />
                      );
                    }}
                  >
                    Nhiệt độ (°C)
                  </TableSortLabel>
                </TableCell>
                <TableCell align="center">
                  <TableSortLabel
                    active={orderBy === "tds"}
                    direction={orderBy === "tds" ? order : "asc"}
                    onClick={() => handleSort("tds")}
                    IconComponent={() => {
                      return order === "asc" ? (
                        <ArrowUpwardIcon />
                      ) : (
                        <ArrowDownwardIcon />
                      );
                    }}
                  >
                    TDS (ppm)
                  </TableSortLabel>
                </TableCell>
                <TableCell align="center">
                  <TableSortLabel
                    active={orderBy === "flowRate"}
                    direction={orderBy === "flowRate" ? order : "asc"}
                    onClick={() => handleSort("flowRate")}
                    IconComponent={() => {
                      return order === "asc" ? (
                        <ArrowUpwardIcon />
                      ) : (
                        <ArrowDownwardIcon />
                      );
                    }}
                  >
                    Lưu lượng (L/phút)
                  </TableSortLabel>
                </TableCell>
                <TableCell align="center">
                  <TableSortLabel
                    active={orderBy === "distance"}
                    direction={orderBy === "distance" ? order : "asc"}
                    onClick={() => handleSort("distance")}
                    IconComponent={() => {
                      return order === "asc" ? (
                        <ArrowUpwardIcon />
                      ) : (
                        <ArrowDownwardIcon />
                      );
                    }}
                  >
                    Khoảng cách (cm)
                  </TableSortLabel>
                </TableCell>
                <TableCell align="center">
                  <TableSortLabel
                    active={orderBy === "currentLevelPercent"}
                    direction={orderBy === "currentLevelPercent" ? order : "asc"}
                    onClick={() => handleSort("currentLevelPercent")}
                    IconComponent={() => {
                      return order === "asc" ? (
                        <ArrowUpwardIcon />
                      ) : (
                        <ArrowDownwardIcon />
                      );
                    }}
                  >
                    Mực nước (%)
                  </TableSortLabel>
                </TableCell>
                <TableCell align="center">
                  <TableSortLabel
                    active={orderBy === "pumpState"}
                    direction={orderBy === "pumpState" ? order : "asc"}
                    onClick={() => handleSort("pumpState")}
                    IconComponent={() => {
                      return order === "asc" ? (
                        <ArrowUpwardIcon />
                      ) : (
                        <ArrowDownwardIcon />
                      );
                    }}
                  >
                    Máy bơm
                  </TableSortLabel>
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {data.length > 0 ? (
                data.map((row, index) => (
                  <TableRow
                    key={index}
                    sx={{
                      backgroundColor: getBackgroundColor(row.temperature, row.tds),
                      '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.04)' }
                    }}
                  >
                    <TableCell align="center">{formatDate(row.timestamp)}</TableCell>
                    <TableCell align="center">{row.temperature}</TableCell>
                    <TableCell align="center">{row.tds}</TableCell>
                    <TableCell align="center">{row.flowRate}</TableCell>
                    <TableCell align="center">{row.distance}</TableCell>
                    <TableCell align="center">
                      {row.currentLevelPercent !== undefined
                        ? row.currentLevelPercent.toFixed(1)
                        : calculateWaterLevel(row.distance)}%
                    </TableCell>
                    <TableCell align="center">
                      <Chip
                        label={row.pumpState === 1 ? "BẬT" : "TẮT"}
                        color={row.pumpState === 1 ? "success" : "default"}
                        size="small"
                      />
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    Không có dữ liệu
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </TableContainer>

      {/* Pagination */}
      <TablePagination
        rowsPerPageOptions={[5, 10, 25, 50]}
        component="div"
        count={totalRows}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
        labelRowsPerPage="Số dòng mỗi trang:"
        labelDisplayedRows={({ from, to, count }) => `${from}-${to} của ${count}`}
      />
    </div>
  );
}

export default SensorDataTable;
