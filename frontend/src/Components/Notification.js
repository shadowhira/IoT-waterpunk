import React from "react";
import { List, ListItem, ListItemText, IconButton, Box } from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
// import { THEME_COLOR_BORDER } from './../Assets/Constants/constants';

const allNotifications = [];

function Notification({ notifications, onDelete }) {
  return (
    <Box
      sx={{
        width: 400, // Chiều rộng cố định
        height: 400, // Chiều cao cố định
        overflow: "auto", // Cuộn nếu danh sách dài hơn chiều cao
        border: "1px solid #ddd", // Đường viền để dễ nhìn
        borderRadius: "8px", // Bo góc nhẹ
        backgroundColor: "transparent", // Màu nền nhạt
      }}
    >
      <List
        sx={{
          width: "100%", // Đảm bảo danh sách chiếm toàn bộ chiều rộng Box
          height: "100%", // Đảm bảo danh sách chiếm toàn bộ chiều cao Box
        }}
      >
        {notifications.length === 0 ? (
          <ListItem
            sx={{
              justifyContent: "center",
              alignItems: "center",
              height: "100%", // Chiều cao của ListItem lấp đầy toàn bộ Box
            }}
          >
            <ListItemText
              primary="Không có thông báo"
              sx={{
                textAlign: "center", // Căn giữa nội dung
                color: "#888",
              }}
            />
          </ListItem>
        ) : (
          notifications.map((notification, index) => (
            <ListItem
              key={index}
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                borderBottom: `1px solid #ddd`, // Đường kẻ dưới mỗi ListItem
              }}
            >
              {/* Nội dung thông báo */}
              <ListItemText
                primary={notification.message}
                secondary={notification.timestamp}
                sx={{
                  "& .MuiListItemText-primary": {
                    color: "#000",
                    fontWeight: "bold", // CSS riêng cho primary
                    fontSize: "1rem",
                    marginBottom: "0.5rem", // Khoảng cách dưới nội dung primary
                  },
                  "& .MuiListItemText-secondary": {
                    color: "#333",
                    fontStyle: "italic", // CSS riêng cho secondary
                    fontSize: "0.85rem",
                    marginBottom: "0.5rem", // Khoảng cách dưới nội dung primary

                  },

                }}
              />
              {/* Nút xóa */}
              <IconButton
                edge="end"
                color="error"
                onClick={() => onDelete(index)}
                sx = {{
                    marginLeft: "1.5rem",
                    marginRight: "0.5rem",
                }}
              >
                <DeleteIcon />
              </IconButton>
            </ListItem>
          ))
        )}
      </List>
    </Box>
  );
}

export { allNotifications, Notification };
