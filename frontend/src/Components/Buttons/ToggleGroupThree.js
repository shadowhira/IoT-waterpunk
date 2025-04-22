import React, { useState } from "react";
import "./ToggleGroupThree.css";
import "../../Assets/CSS/style.css";

function ToggleGroupThree() {
  // State để lưu trạng thái hiện tại, mặc định là "auto"
  const [selectedOption, setSelectedOption] = useState("auto");

  // Hàm xử lý khi có thay đổi
  const handleChange = (event) => {
    const value = event.target.value; // Lấy giá trị của radio button được chọn
    setSelectedOption(value); // Cập nhật state
    console.log(value); // In giá trị ra console
    // socket.emit("clientEvent", { relay: value });
    fetch("http://localhost:4000/api/v1/system/control", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ relay: value }),
    });
  };

  return (
    /* From Uiverse.io by Tsiangana */
    <div className="radio-inputs">
      <label>
        <input
          className="radio-input on"
          type="radio"
          name="engine"
          value="on" // Giá trị của lựa chọn
          checked={selectedOption === "on"} // Kiểm tra nếu giá trị hiện tại là "on"
          onChange={handleChange} // Gọi hàm khi có thay đổi
        />
        <span className="radio-tile on">
          <span className="radio-icon">
            <span>On</span>
          </span>
        </span>
      </label>

      <label>
        <input
          className="radio-input off"
          type="radio"
          name="engine"
          value="off"
          checked={selectedOption === "off"} // Kiểm tra nếu giá trị hiện tại là "off"
          onChange={handleChange}
        />
        <span className="radio-tile off">
          <span className="radio-icon">
            <span>Off</span>
          </span>
        </span>
      </label>

      <label>
        <input
          className="radio-input auto"
          type="radio"
          name="engine"
          value="auto"
          checked={selectedOption === "auto"} // Kiểm tra nếu giá trị hiện tại là "auto"
          onChange={handleChange}
        />
        <span className="radio-tile auto">
          <span className="radio-icon">
            <span>Auto</span>
          </span>
        </span>
      </label>
    </div>
  );
}

export default ToggleGroupThree;
