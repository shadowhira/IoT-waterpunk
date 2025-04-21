import React from "react";
import { Box, Typography } from "@mui/material";
import { THEME_COLOR_BACKGROUND, THEME_COLOR_FONT, BORDER_RADIUS_BIG, THEME_COLOR_BORDER, TRANSITION_FOOTER, TIME_DELAY} from "../Assets/Constants/constants";
import { createSlideDownAnimation } from "../Assets/Constants/utils";

function Footer() {
  const slideDown = createSlideDownAnimation(TRANSITION_FOOTER)
  return (
    <Box
      component="footer"
      sx={{
        backgroundColor: THEME_COLOR_BACKGROUND, // Màu nền đỏ
        color: THEME_COLOR_FONT, // Màu chữ trắng
        textAlign: "center", // Căn giữa nội dung
        padding: "10px 0", // Khoảng cách trên dưới
        fontSize: "14px", // Cỡ chữ
        lineHeight: "1.5", // Khoảng cách giữa các dòng
        position: "sticky",
        bottom: 0, // Nằm ở dưới cùng của trang
        left: 0, // Căn sát bên trái
        width: "100%", // Chiếm toàn bộ chiều ngang
        zIndex: "1",
        borderTopLeftRadius: BORDER_RADIUS_BIG,
        borderTopRightRadius: BORDER_RADIUS_BIG,
        // borderTop: `2px solid ${THEME_COLOR_BORDER}`,
        animation: `${slideDown} 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) ${TIME_DELAY} both`
      }}
    >
      <Typography variant="body2">
        Copyright © 2020 Công ty điện nước Văn Thành
      </Typography>
      <Typography variant="body2">
        Version: BCVT-2024.11.1.8 (updated 2024-11-20 17:41)
      </Typography>
      <Typography variant="body2">Design by TUANVU</Typography>
    </Box>
  );
}

export default Footer;
