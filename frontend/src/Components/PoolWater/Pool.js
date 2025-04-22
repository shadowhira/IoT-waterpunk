import React, { useState, useEffect } from "react";
import "./Pool.css";
import WavyBox from "./WavyBox";
import {
  COLOR_WATER,
  HEIGHT_POOL,
  HEIGHT_WAVY,
  INSET_POOL,
  WIDTH_POOL,
} from "../../Assets/Constants/constants";
import { Box, Typography } from "@mui/material";

const Pool = ({ ratio }) => {
  const [heightWater, setHeightWater] = useState(0);
  const [displayedRatio, setDisplayedRatio] = useState(0); // State cho tỷ lệ hiển thị
  const transitionDuration = 1000; // Thời gian thay đổi height (ms)

  useEffect(() => {
    // Xử lý ratio không hợp lệ
    const validRatio = ratio < 0 || ratio > 1 ? 0 : ratio;

    // Cập nhật chiều cao nước
    const updatedHeight =
      validRatio * (HEIGHT_POOL - 2 * INSET_POOL - HEIGHT_WAVY / 7);
    setHeightWater(updatedHeight);

    // Cập nhật tỷ lệ hiển thị (dần dần)
    const targetRatio = Math.round(validRatio * 100); // Tỷ lệ mục tiêu
    const stepCount = Math.abs(targetRatio - displayedRatio); // Số bước tăng giá trị hiển thị (mượt mà hơn)

    if (stepCount === 0) return;

    const stepDuration = transitionDuration / stepCount; // Thời gian mỗi bước
    const stepValue = (targetRatio - displayedRatio) / stepCount; // Giá trị tăng mỗi bước

    let currentRatio = displayedRatio;
    let stepIndex = 0;

    const intervalId = setInterval(() => {
      stepIndex++;
      currentRatio += stepValue;
      setDisplayedRatio(Math.round(currentRatio));

      if (stepIndex >= stepCount) {
        clearInterval(intervalId); // Dừng interval khi hoàn thành
        setDisplayedRatio(targetRatio); // Đảm bảo đạt đúng giá trị cuối
      }
    }, stepDuration);

    return () => clearInterval(intervalId); // Cleanup interval khi component unmount
  }, [ratio, displayedRatio, transitionDuration]); // Chỉ giữ lại các dependencies cần thiết

  return (
    <div className="card-wrap">
      <div className="card">
        <Box
          sx={{
            width: { xs: `${WIDTH_POOL / 4}px`, sm: `${WIDTH_POOL / 3.5}px`, md: `${WIDTH_POOL / 3}px` },
            height: { xs: `${WIDTH_POOL / 4}px`, sm: `${WIDTH_POOL / 3.5}px`, md: `${WIDTH_POOL / 3}px` },
            borderRadius: "50%",
            backgroundColor: COLOR_WATER,
            zIndex: 30,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Typography
            variant="h4"
            sx={{
              fontWeight: "bold",
              color: "#fff",
              fontSize: { xs: '1.5rem', sm: '1.75rem', md: '2rem' },
            }}
          >
            {displayedRatio}%
          </Typography>
        </Box>

        <Box
          sx={{
            position: "absolute",
            backgroundColor: "#fff",
            inset: `${INSET_POOL}px`,
            zIndex: 2,
            borderRadius: "30px",
            overflow: "hidden",
          }}
        >
          <Box
            sx={{
              width: `${WIDTH_POOL - 20}px`,
              height: `${heightWater}px`,
              position: "absolute",
              bottom: "0px",
              backgroundColor: `${COLOR_WATER}`,
              zIndex: 2,
              borderBottomLeftRadius: "30px",
              borderBottomRightRadius: "30px",
              transition: `height ${transitionDuration}ms ease-in-out`, // Thời gian thay đổi height
            }}
          >
            <WavyBox width={WIDTH_POOL - INSET_POOL * 2}></WavyBox>
          </Box>
        </Box>
      </div>
    </div>
  );
};

export default Pool;
