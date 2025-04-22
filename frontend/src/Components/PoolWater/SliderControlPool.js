import React from "react";
import { Slider, useMediaQuery, useTheme } from "@mui/material";
import { COLOR_SLIDER } from "../../Assets/Constants/constants";
import { hexToRgba } from "../../Assets/Constants/utils";

const SliderControlPool = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'md'));

  const heightSlider = isMobile ? 15 : isTablet ? 18 : 20;

  const handleSliderChangeCommitted = (event, value) => {
    fetch("http://localhost:4000/api/v1/system", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ storage: value.toString() }),
    });
  };

  return (
    <Slider
      defaultValue={75} // Giá trị mặc định
      max={75} // Giá trị tối đa
      aria-label="Default"
      valueLabelDisplay="auto"
      valueLabelFormat={(value) => `${value}%`} // Định dạng giá trị hiển thị
      onChangeCommitted={handleSliderChangeCommitted} // Gọi hàm khi thả chuột
      sx={{
        width: isMobile ? "95%" : isTablet ? "90%" : "85%",
        color: `${COLOR_SLIDER}`, // Màu chính của slider
        "& .MuiSlider-thumb": {
          backgroundColor: `${COLOR_SLIDER}`, // Màu cho nút tròn
          border: isMobile ? "4px solid #fff" : "6px solid #fff", // Viền cho nút tròn
          "&:hover, &.Mui-focusVisible": {
            boxShadow: `0px 0px 0px 8px ${hexToRgba(COLOR_SLIDER, 0.1)}`, // Hiệu ứng khi hover hoặc focus
          },
          height: isMobile ? heightSlider * 1.3 : isTablet ? heightSlider * 1.6 : heightSlider * 2,
          width: isMobile ? heightSlider * 1.3 : isTablet ? heightSlider * 1.6 : heightSlider * 2,
        },
        "& .MuiSlider-rail": {
          backgroundColor: "#ADD8E6", // Màu nền slider
          height: isMobile ? heightSlider * 0.7 : isTablet ? heightSlider * 0.85 : heightSlider,
        },
        "& .MuiSlider-track": {
          backgroundColor: `${COLOR_SLIDER}`, // Màu đường track slider
          height: isMobile ? heightSlider * 0.7 : isTablet ? heightSlider * 0.85 : heightSlider,
        },
        "& .MuiSlider-valueLabel": {
          backgroundColor: `${COLOR_SLIDER}`, // Màu nhãn hiển thị giá trị
          color: "#fff", // Màu chữ trong nhãn
          fontSize: isMobile ? "14px" : isTablet ? "16px" : "18px",
          fontWeight: "bold",
          padding: isMobile ? "2px 6px" : "4px 8px",
        },
      }}
    />
  );
};

export default SliderControlPool;
