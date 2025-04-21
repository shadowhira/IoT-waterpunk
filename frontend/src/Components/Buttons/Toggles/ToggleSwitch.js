import React, { useState, useEffect } from "react";
import "./ToggleSwitch.css";
import "../../../Assets/CSS/style.css";
import {
  addTopicListener,
  removeTopicListener,
} from "../../../Socket/WebSocketService"; // Assuming WebSocketService manages your socket connection

function ToggleSwitch() {
  // State quản lý giá trị ON/OFF
  const [isActive, setIsActive] = useState(false); // true: ON, false: OFF

  // Hàm chuyển trạng thái
  const toggleActive = () => {
    setIsActive(!isActive); // Đảo trạng thái hiện tại
  };

  // useEffect(() => {
  //     // Hàm thay đổi trạng thái cứ mỗi 1 giây
  //     const interval = setInterval(() => {
  //         setIsActive((prev) => !prev); // Đảo trạng thái
  //     }, 1000);

  //     // Dọn dẹp interval khi component bị unmount
  //     return () => clearInterval(interval);
  // }, []);

  useEffect(() => {
    // WebSocket data handler
    const handleMqttData = (newData) => {
      // Parse new data and update state
      const newParsedData = JSON.parse(newData.data);

      setIsActive((prevData) => {
        // Ensure that the data array doesn't exceed 15 items
        const updatedData =
          newParsedData.pumpState === 1
            ? true // Add new data to the front if there are less than 15 items
            : false; // Otherwise, remove the last item and add the new one

        // console.log("Dữ liệu mới:", updatedData);

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

  return (
    <div id="firstFilter" className="filter-switch">
      {/* Input điều khiển trạng thái thông qua biến isActive */}
      <input
        id="option1"
        name="options"
        type="radio"
        checked={isActive} // Bật ON nếu isActive = true
        readOnly // Chỉ đọc, không cho phép thay đổi trực tiếp
      />
      <label className="option" htmlFor="option1">
        ON
      </label>

      <input
        id="option2"
        name="options"
        type="radio"
        checked={!isActive} // Bật OFF nếu isActive = false
        readOnly // Chỉ đọc, không cho phép thay đổi trực tiếp
      />
      <label className="option" htmlFor="option2">
        OFF
      </label>

      <span className="background"></span>
    </div>
  );
}

export default ToggleSwitch;
