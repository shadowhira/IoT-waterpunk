import React from "react";
import { Box, Typography, useMediaQuery, useTheme } from "@mui/material";
import { THEME_COLOR_BACKGROUND, THEME_COLOR_FONT, BORDER_RADIUS_BIG, TRANSITION_FOOTER, TIME_DELAY} from "../Assets/Constants/constants";
import { createSlideDownAnimation } from "../Assets/Constants/utils";

function Footer() {
  const slideDown = createSlideDownAnimation(TRANSITION_FOOTER);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  return (
    <Box
      component="footer"
      sx={{
        backgroundColor: THEME_COLOR_BACKGROUND, // Màu nền đỏ
        color: THEME_COLOR_FONT, // Màu chữ trắng
        textAlign: "center", // Căn giữa nội dung
        padding: { xs: "8px 5px", sm: "10px 0" }, // Khoảng cách trên dưới
        fontSize: { xs: "10px", sm: "12px", md: "14px" }, // Cỡ chữ responsive
        lineHeight: "1.5", // Khoảng cách giữa các dòng
        // position: "sticky",
        // bottom: 0, // Nằm ở dưới cùng của trang
        left: 0, // Căn sát bên trái
        width: "100%", // Chiếm toàn bộ chiều ngang
        zIndex: isMobile ? 1000 : 1, // Z-index cao hơn trên mobile để hiển thị trên BottomNavigation
        borderTopLeftRadius: { xs: BORDER_RADIUS_BIG / 3, sm: BORDER_RADIUS_BIG / 2, md: BORDER_RADIUS_BIG },
        borderTopRightRadius: { xs: BORDER_RADIUS_BIG / 3, sm: BORDER_RADIUS_BIG / 2, md: BORDER_RADIUS_BIG },
        // borderTop: `2px solid ${THEME_COLOR_BORDER}`,
        animation: `${slideDown} 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) ${TIME_DELAY} both`,
        display: "flex",
        flexDirection: { xs: "column", sm: "row" },
        justifyContent: "space-around",
        alignItems: "center",
        gap: { xs: "2px", sm: "5px", md: "10px" },
        display: { xs: isMobile ? 'none' : 'flex', sm: 'flex' } // Ẩn trên mobile vì đã có BottomNavigation
      }}
    >
      <Typography variant="body2" sx={{ fontSize: { xs: '10px', sm: '12px', md: '14px' } }}>
        Copyright © 2020 Công ty điện nước Văn Thành
      </Typography>
      <Typography variant="body2" sx={{ fontSize: { xs: '10px', sm: '12px', md: '14px' } }}>
        Version: BCVT-2025.4.28 (updated 2025-4-28 11:52)
      </Typography>
      {/* <Typography variant="body2" sx={{ fontSize: { xs: '10px', sm: '12px', md: '14px' } }}>Design by TUANVU</Typography> */}
    </Box>
  );
}

export default Footer;
