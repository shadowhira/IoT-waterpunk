import React, { useState } from "react";
import { Card, CardContent, Typography, Button, Box, Dialog, DialogTitle, DialogContent, DialogActions } from "@mui/material";
import { BORDER_RADIUS_SMALL, THEME_COLOR_BORDER, TRANSITION_ITEM_INVOICE } from "../../Assets/Constants/constants";
import { createItemInvoiceAnimation } from "../../Assets/Constants/utils";

const ItemInvoice = ({ item, onPay, delay }) => {
    const { id, date, waterBill, status } = item;
    const slideDown = createItemInvoiceAnimation(TRANSITION_ITEM_INVOICE);

    // State to manage modal visibility
    const [isModalOpen, setModalOpen] = useState(false);

    const handleOpenModal = () => setModalOpen(true);
    const handleCloseModal = () => setModalOpen(false);

    return (
        <>
            {/* Main Card */}
            <Card
                onClick={handleOpenModal}
                sx={{
                    mb: 3,
                    width: "70%",
                    borderRadius: BORDER_RADIUS_SMALL,
                    border: `3px solid ${THEME_COLOR_BORDER}`,
                    animation: `${slideDown} 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) ${delay}s both`,
                    cursor: "pointer",
                }}
            >
                <CardContent
                    sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        borderRadius: BORDER_RADIUS_SMALL,
                    }}
                >
                    <Box>
                        <Typography
                            variant="h5"
                            sx={{
                                marginBottom: "16px",
                            }}
                        >
                            Số tiền: {waterBill.toLocaleString()} VNĐ
                        </Typography>
                        <Typography
                            variant="body1"
                            color="textSecondary"
                            sx={{
                                marginBottom: "8px",
                            }}
                        >
                            Ngày: {date}
                        </Typography>

                        <Typography
                            variant="body1"
                            sx={{
                                fontWeight: "bold",
                                color: status === "Chưa Hoàn Thành" ? "error.main" : "success.main",
                            }}
                        >
                            Trạng thái: {status}
                        </Typography>
                    </Box>
                    {status === "Chưa Hoàn Thành" && (
                        <Box sx={{ mt: 2 }}>
                            <Button variant="contained" color="secondary" onClick={() => onPay(id)}>
                                Thanh toán
                            </Button>
                        </Box>
                    )}
                </CardContent>
            </Card>

            {/* Modal for Invoice Details */}
            <Dialog open={isModalOpen} onClose={handleCloseModal} maxWidth="sm" fullWidth
                sx={{
                    '& .MuiPaper-root': {
                        border: `3px solid ${THEME_COLOR_BORDER}`, // Thêm viền cho Dialog
                        borderRadius: BORDER_RADIUS_SMALL, // Bo góc Dialog
                    }
                }}
            >
                <DialogTitle>Chi tiết hóa đơn</DialogTitle>
                <DialogContent>
                    <Typography variant="h6">Hóa đơn #{id}</Typography>
                    <Typography>Ngày tạo: {date}</Typography>
                    <Typography>Số tiền: {waterBill.toLocaleString()} VNĐ</Typography>
                    <Typography
                        sx={{
                            mt: 2,
                            fontWeight: "bold",
                            color: status === "Chưa Hoàn Thành" ? "error.main" : "success.main",
                        }}
                    >
                        Trạng thái: {status}
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseModal} color="primary">
                        Đóng
                    </Button>
                    {status === "Chưa Hoàn Thành" && (
                        <Button variant="contained" color="secondary" onClick={() => onPay(id)}>
                            Thanh toán
                        </Button>
                    )}
                </DialogActions>
            </Dialog>
        </>
    );
};

export default ItemInvoice;
