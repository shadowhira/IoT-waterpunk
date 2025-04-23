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

  // Hàm chuyển trạng thái - hiện tại không sử dụng
  // const toggleActive = () => {
  //   setIsActive(!isActive); // Đảo trạng thái hiện tại
  // };

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
      try {
        // Lấy dữ liệu cảm biến từ payload hoặc data
        let sensorData;

        if (newData.payload) {
          // Dữ liệu từ backend qua WebSocket
          sensorData = newData.payload;
        } else if (typeof newData.data === 'string') {
          // Dữ liệu dạng chuỗi JSON
          sensorData = JSON.parse(newData.data);
        } else if (newData.data) {
          // Dữ liệu đã là object
          sensorData = newData.data;
        } else {
          console.error("Invalid sensor data format", newData);
          return;
        }

        // Cập nhật trạng thái dựa trên pumpState
        setIsActive((prevData) => {
          const updatedData = sensorData.pumpState === 1;
          console.log("Trạng thái máy bơm:", updatedData ? "ON" : "OFF");
          return updatedData;
        });
      } catch (error) {
        console.error("Lỗi khi xử lý dữ liệu máy bơm:", error);
      }
    };

    // Add WebSocket event listeners - lắng nghe cả hai topic
    addTopicListener("/sensor/data", handleMqttData);
    addTopicListener("sensor_data", handleMqttData);

    // Cleanup on component unmount
    return () => {
      console.log("Component unmounted. Gỡ bỏ các listener và ngắt kết nối...");
      removeTopicListener("/sensor/data", handleMqttData);
      removeTopicListener("sensor_data", handleMqttData);
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
