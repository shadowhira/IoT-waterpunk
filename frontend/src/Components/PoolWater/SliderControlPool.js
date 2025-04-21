import React from "react";
import { Slider } from "@mui/material";
import { COLOR_SLIDER } from "../../Assets/Constants/constants";
import { hexToRgba } from "../../Assets/Constants/utils";

const SliderControlPool = () => {
  const heightSlider = 20;

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
        width: "80%",
        color: `${COLOR_SLIDER}`, // Màu chính của slider
        "& .MuiSlider-thumb": {
          backgroundColor: `${COLOR_SLIDER}`, // Màu cho nút tròn
          border: "6px solid #fff", // Viền cho nút tròn
          "&:hover, &.Mui-focusVisible": {
            boxShadow: `0px 0px 0px 8px ${hexToRgba(COLOR_SLIDER, 0.1)}`, // Hiệu ứng khi hover hoặc focus
          },
          height: heightSlider * 2,
          width: heightSlider * 2,
        },
        "& .MuiSlider-rail": {
          backgroundColor: "#ADD8E6", // Màu nền slider
          height: heightSlider,
        },
        "& .MuiSlider-track": {
          backgroundColor: `${COLOR_SLIDER}`, // Màu đường track slider
          height: heightSlider,
        },
        "& .MuiSlider-valueLabel": {
          backgroundColor: `${COLOR_SLIDER}`, // Màu nhãn hiển thị giá trị
          color: "#fff", // Màu chữ trong nhãn
          fontSize: "20px",
          fontWeight: "bold",
        },
      }}
    />
  );
};

export default SliderControlPool;
