import React, { useState } from "react";
import { Box, Pagination, Snackbar, Alert } from "@mui/material";
import {
  MARGIN_HEADING,
  THEME_COLOR_BACKGROUND,
  THEME_COLOR_FONT,
  THEME_COLOR_BORDER,
} from "../../Assets/Constants/constants";
import ItemInvoice from "./ItemInvoice";
import Heading from "../Heading/Heading";

const initialData = [
  { id: 1, date: "2024-11-01", waterBill: 150000, status: "Hoàn Thành" },
  { id: 2, date: "2024-10-01", waterBill: 200000, status: "Chưa Hoàn Thành" },
  { id: 3, date: "2024-09-01", waterBill: 120000, status: "Hoàn Thành" },
  { id: 4, date: "2024-08-01", waterBill: 180000, status: "Chưa Hoàn Thành" },
  { id: 5, date: "2024-07-01", waterBill: 160000, status: "Hoàn Thành" },
  { id: 6, date: "2024-06-01", waterBill: 210000, status: "Chưa Hoàn Thành" },
  { id: 7, date: "2024-05-01", waterBill: 175000, status: "Hoàn Thành" },
  { id: 8, date: "2024-04-01", waterBill: 195000, status: "Chưa Hoàn Thành" },
  { id: 9, date: "2024-03-01", waterBill: 185000, status: "Hoàn Thành" },
  { id: 10, date: "2024-02-01", waterBill: 200000, status: "Chưa Hoàn Thành" },
];

function InvoiceTable() {
  // const navigate = useNavigate(); // Hiện tại không sử dụng
  const [data, setData] = useState(initialData);
  const [currentPage, setCurrentPage] = useState(1);
  const [notification, setNotification] = useState({
    open: false,
    message: "",
  });
  const itemsPerPage = 3;

  // Tính toán hóa đơn hiển thị
  const totalPages = Math.ceil(data.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentData = data.slice(startIndex, endIndex);

  // Xử lý khi đổi trang
  const handlePageChange = (event, value) => {
    setCurrentPage(value);
  };

  // Xử lý thanh toán
  const handlePay = async (id) => {
    const response = await fetch(
      "http://localhost:4000/api/v1/billing/create_payment_url",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          billing_period: {
            start: "2024-11-01T00:00:00Z",
            end: "2024-11-30T23:59:59Z",
          },
          amount_due: 500000,
          bankCode: "",
          order: {
            note: "Thanh toán hóa đơn tháng 11",
          },
          orderType: "bill payment",
          language: "vn",
        }),
      }
    );
    // open new tab with payment url
    const url = await response.text();
    window.open(url, "_blank");

    setData((prevData) =>
      prevData.map((item) =>
        item.id === id ? { ...item, status: "Hoàn Thành" } : item
      )
    );

    // Hiển thị thông báo
    setNotification({
      open: true,
      message: `Thanh toán thành công hóa đơn #${id}`,
    });
  };

  // Đóng thông báo
  const handleCloseNotification = () => {
    setNotification({ open: false, message: "" });
  };

  return (
    <Box
      sx={{
        height: "100%",
      }}
    >
      <Heading
        text="Danh sách hóa đơn tiền nước"
        margin={MARGIN_HEADING}
        themeColorBorder={THEME_COLOR_BORDER}
      />
      <Box
        sx={{
          height: "80%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        {currentData.map((item) => (
          <ItemInvoice
            key={item.id}
            item={item}
            onPay={handlePay}
            delay={((item.id - 1) % itemsPerPage) * 0.1}
          />
        ))}
      </Box>

      <Box sx={{ display: "flex", justifyContent: "center" }}>
        <Pagination
          count={totalPages}
          page={currentPage}
          onChange={handlePageChange}
          color="primary"
          shape="rounded"
          size="large"
          sx={{
            "& .MuiPaginationItem-root.Mui-selected": {
              color: THEME_COLOR_FONT,
              backgroundColor: THEME_COLOR_BACKGROUND,
            },
          }}
        />
      </Box>

      {/* Snackbar thông báo */}
      <Snackbar
        open={notification.open}
        autoHideDuration={3000}
        onClose={handleCloseNotification}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert onClose={handleCloseNotification} severity="success">
          {notification.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}

export default InvoiceTable;
