import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Avatar,
  Menu,
  MenuItem,
  IconButton,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import NotificationsIcon from "@mui/icons-material/Notifications"; // Import biểu tượng thông báo
import defaultAvatar from "../Assets/Images/defaultAvatar.png"; // Đường dẫn ảnh đại diện mặc định
import { useNavigate } from "react-router-dom";
import {
  BORDER_RADIUS_MEDIUM,
  THEME_COLOR_BACKGROUND,
  THEME_COLOR_BORDER,
  THEME_COLOR_FONT,
  TIME_DELAY,
  TRANSITION_USER_INFO,
} from "../Assets/Constants/constants";
import { createSlideDownAnimation } from "../Assets/Constants/utils";
import { Notification, allNotifications } from "./Notification";
import {
  addTopicListener,
  removeTopicListener,
} from "../Socket/WebSocketService"; // Assuming WebSocketService manages your socket connection

function UserInfo({ user }) {
  const [anchorEl, setAnchorEl] = useState(null); // Trạng thái cho menu
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState(allNotifications); // Trạng thái để lưu trữ thông báo
  const [notificationAnchorEl, setNotificationAnchorEl] = useState(null); // Trạng thái cho menu thông báo
  const slideDown = createSlideDownAnimation(TRANSITION_USER_INFO);

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const handleMenuClick = (event) => {
    setAnchorEl(event.currentTarget); // Mở menu
  };

  const handleMenuClose = (action) => {
    setAnchorEl(null); // Đóng menu
    // Xử lý hành động dựa trên mục đã nhấn
    if (action === "logout") {
      console.log("Đăng xuất"); // In ra 'Đăng xuất' trong console
      navigate("/login");
      // Thêm logic đăng xuất của bạn ở đây
    } else if (action === "changePassword") {
      console.log("Đổi mật khẩu"); // In ra 'Đổi mật khẩu' trong console
      // Thêm logic đổi mật khẩu của bạn ở đây
    }
  };

  // Dữ liệu thông báo mẫu (bạn có thể thay thế bằng dữ liệu từ API)

  const handleNotificationClick = (event) => {
    setNotificationAnchorEl(event.currentTarget); // Mở menu thông báo
    // setNotifications(allNotifications); // Tải thông báo vào trạng thái
  };

  const handleNotificationClose = () => {
    setNotificationAnchorEl(null); // Đóng menu thông báo
  };

  const formatDate = (date) => {
    const options = {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    };
    return new Date(date).toLocaleString("vi-VN", options);
  };

  const handleDelete = (index) => {
    setNotifications((prev) => prev.filter((_, i) => i !== index)); // Xóa thông báo theo chỉ số
  };

  useEffect(() => {
    // WebSocket data handler
    // WebSocket system state handler (e.g., for warnings or status)
    const handleSwitchSystem = (newData) => {
      // console.log("Cảnh báo từ server:", newData);
      // Parse new data and update state
      const message = newData.message;
      // console.log("Dữ liệu mới:", typeof newParsedData);
      const timestamp = formatDate(new Date()); // Get formatted date and time
      setNotifications((prevData) => {
        // Ensure that the data array doesn't exceed 15 items
        const updatedData =
          prevData.length < 15
            ? [{ message, timestamp }, ...prevData] // Add new data to the front if there are less than 15 items
            : [
                { message, timestamp },
                ...prevData.slice(0, prevData.length - 1),
              ]; // Otherwise, remove the last item and add the new one

        // console.log("Dữ liệu mới:", updatedData);

        return updatedData;
      });
    };

    // Add WebSocket event listeners
    addTopicListener("notification", handleSwitchSystem);

    // Cleanup on component unmount
    return () => {
      console.log("Component unmounted. Gỡ bỏ các listener và ngắt kết nối...");
      removeTopicListener("notification", handleSwitchSystem);
    };
  }, []); // Empty dependency array ensures this runs once on mount

  return (
    <Box
      sx={{
        backgroundColor: THEME_COLOR_BACKGROUND,
        color: THEME_COLOR_FONT,
        borderBottom: `3px solid ${THEME_COLOR_BORDER}`,
        justifyContent: { xs: "center", sm: "flex-end" }, // Căn giữa trên màn hình nhỏ
        display: "flex",
        alignItems: "center", // Căn giữa các item theo chiều dọc
        position: "sticky",
        top: 0, // Nằm ở dưới cùng của trang
        left: 0, // Căn sát bên trái
        width: "100%", // Chiếm toàn bộ chiều ngang
        zIndex: isMobile ? 1050 : 1, // Z-index cao hơn trên mobile để hiển thị trên AppBar
        borderBottomLeftRadius: { xs: BORDER_RADIUS_MEDIUM / 3, sm: BORDER_RADIUS_MEDIUM / 2, md: BORDER_RADIUS_MEDIUM },
        borderBottomRightRadius: { xs: BORDER_RADIUS_MEDIUM / 3, sm: BORDER_RADIUS_MEDIUM / 2, md: BORDER_RADIUS_MEDIUM },
        animation: `${slideDown} 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) ${TIME_DELAY} both`,
        padding: { xs: "8px 5px", sm: "10px" }, // Tăng padding trên màn hình nhỏ
        flexDirection: { xs: "column", sm: "row" }, // Chuyển sang layout dọc trên màn hình nhỏ
        marginTop: { xs: isMobile ? '56px' : '0', sm: '0' }, // Thêm margin-top trên mobile để tránh bị AppBar che
      }}
    >
      {/* Logo */}
      {/* <Box
        component="img"
        src={logoImage}
        alt="Logo"
        sx={{
          height: 100,
          borderRadius: '50%',
          marginRight: 2, // Khoảng cách giữa logo và các thành phần khác
        }}
      /> */}
      <Box
        sx={{
          backgroundColor: THEME_COLOR_BACKGROUND,
          padding: { xs: "5px", sm: "10px" },
          justifyContent: { xs: "center", sm: "flex-end" },
          display: "flex",
          alignItems: "center", // Căn giữa các item theo chiều dọc
          borderBottomLeftRadius: { xs: BORDER_RADIUS_MEDIUM / 3, sm: BORDER_RADIUS_MEDIUM / 2, md: BORDER_RADIUS_MEDIUM },
          borderBottomRightRadius: { xs: BORDER_RADIUS_MEDIUM / 3, sm: BORDER_RADIUS_MEDIUM / 2, md: BORDER_RADIUS_MEDIUM },
          flexDirection: { xs: "column", sm: "row" }, // Chuyển sang layout dọc trên màn hình nhỏ
          width: "100%",
          gap: { xs: "8px", sm: "5px", md: "0" } // Khoảng cách giữa các phần tử trên màn hình nhỏ
        }}
      >
        {/* Biểu tượng thông báo */}
        <IconButton
          onClick={handleNotificationClick} // Mở menu thông báo và tải thông báo
          sx={{ marginRight: 2, color: THEME_COLOR_FONT }}
        >
          <NotificationsIcon notifications={notifications} />
        </IconButton>

        {/* Menu thông báo */}
        <Menu
          anchorEl={notificationAnchorEl}
          open={Boolean(notificationAnchorEl)} // Mở menu nếu anchor không null
          onClose={handleNotificationClose}
          anchorOrigin={{
            vertical: "bottom",
            horizontal: "right",
          }}
          transformOrigin={{
            vertical: "top",
            horizontal: "right",
          }}
          sx={{ mt: 2 }} // Thêm margin top (điều chỉnh giá trị nếu cần)
        >
          <Notification
            notifications={notifications}
            onDelete={handleDelete}
          ></Notification>
        </Menu>

        <Box
          onClick={handleMenuClick}
          sx={{
            cursor: "pointer",
            marginRight: 2,
            display: "flex",
            alignItems: "center",
          }}
        >
          <Typography
            variant="h6"
            sx={{
              marginRight: { xs: 0, sm: 1 },
              fontSize: { xs: '0.9rem', sm: '1rem', md: '1.25rem' }, // Font size nhỏ hơn trên màn hình nhỏ
              textAlign: 'center' // Căn giữa text trên màn hình nhỏ
            }}
          >
            Xin chào, {user.name}
          </Typography>
          <Avatar
            alt={user.name}
            src={user.avatar || defaultAvatar} // Sử dụng ảnh đại diện của người dùng hoặc ảnh mặc định
            sx={{ width: 40, height: 40 }} // Kích thước của ảnh đại diện
          />
        </Box>

        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={() => handleMenuClose(null)} // Đóng menu mà không có hành động
          anchorOrigin={{
            vertical: "bottom", // Đặt menu bên dưới ảnh đại diện
            horizontal: "right", // Căn menu sang bên phải
          }}
          transformOrigin={{
            vertical: "top", // Bắt đầu menu từ trên cùng
            horizontal: "right", // Căn trên cùng của menu với bên phải
          }}
          sx={{ mt: 2 }} // Thêm margin top (điều chỉnh giá trị nếu cần)
        >
          <MenuItem onClick={() => handleMenuClose("changePassword")}>
            Đổi mật khẩu
          </MenuItem>
          <MenuItem onClick={() => handleMenuClose("logout")}>
            Đăng xuất
          </MenuItem>
        </Menu>
      </Box>
    </Box>
  );
}

export default UserInfo;
