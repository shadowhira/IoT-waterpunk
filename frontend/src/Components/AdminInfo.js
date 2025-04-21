import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Avatar,
  Menu,
  MenuItem,
  IconButton,
  Badge,
} from "@mui/material";
import NotificationsIcon from "@mui/icons-material/Notifications"; // Import biểu tượng thông báo
import adminAvatar from "../Assets/Images/logo.png"; // Đường dẫn ảnh đại diện mặc định
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

function AdminInfo() {
  const [anchorEl, setAnchorEl] = useState(null); // Trạng thái cho menu
  const [notifications, setNotifications] = useState(allNotifications); // Trạng thái để lưu trữ thông báo
  const [notificationAnchorEl, setNotificationAnchorEl] = useState(null); // Trạng thái cho menu thông báo
  const [hasNewNotification, setHasNewNotification] = useState(false); // Trạng thái cho thông báo mới
  const navigate = useNavigate();
  const slideDown = createSlideDownAnimation(TRANSITION_USER_INFO);

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

  const handleNotificationClick = (event) => {
    setNotificationAnchorEl(event.currentTarget); // Mở menu thông báo
    setHasNewNotification(false); // Đánh dấu thông báo đã được xem
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
    const handleSwitchSystem = (newData) => {
      const message = newData.message;
      const timestamp = formatDate(new Date()); // Get formatted date and time
      setNotifications((prevData) => {
        const updatedData =
          prevData.length < 15
            ? [{ message, timestamp }, ...prevData] // Add new data to the front if there are less than 15 items
            : [
                { message, timestamp },
                ...prevData.slice(0, prevData.length - 1),
              ]; // Otherwise, remove the last item and add the new one

        return updatedData;
      });
      setHasNewNotification(true); // Đánh dấu có thông báo mới
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
        justifyContent: "flex-end",
        display: "flex",
        alignItems: "center", // Căn giữa các item theo chiều dọc
        position: "sticky",
        top: 0, // Nằm ở dưới cùng của trang
        left: 0, // Căn sát bên trái
        width: "100%", // Chiếm toàn bộ chiều ngang
        zIndex: "1",
        borderBottomLeftRadius: BORDER_RADIUS_MEDIUM,
        borderBottomRightRadius: BORDER_RADIUS_MEDIUM,
        animation: `${slideDown} 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) ${TIME_DELAY} both`,
      }}
    >
      <Box
        sx={{
          backgroundColor: THEME_COLOR_BACKGROUND,
          padding: "10px",
          justifyContent: "flex-end",
          display: "flex",
          alignItems: "center", // Căn giữa các item theo chiều dọc,
          borderBottomLeftRadius: BORDER_RADIUS_MEDIUM,
          borderBottomRightRadius: BORDER_RADIUS_MEDIUM,
        }}
      >
        {/* Biểu tượng thông báo */}
        <IconButton
          onClick={handleNotificationClick} // Mở menu thông báo và tải thông báo
          sx={{ marginRight: 2, color: THEME_COLOR_FONT }}
        >
          <Badge
            color="error"
            variant="dot"
            invisible={!hasNewNotification} // Ẩn dấu chấm đỏ nếu không có thông báo mới
          >
            <NotificationsIcon />
          </Badge>
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
          sx={{ mt: 2, backgroundColor: "transparent" }} // Thêm margin top (điều chỉnh giá trị nếu cần)
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
          <Typography variant="h6" sx={{ marginRight: 1 }}>
            Hi, Admin
          </Typography>
          <Avatar
            src={adminAvatar} // Sử dụng ảnh đại diện của người dùng hoặc ảnh mặc định
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

export default AdminInfo;
