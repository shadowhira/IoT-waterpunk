import React, { useEffect } from 'react';
import Welcome from './Welcome';
import { Box } from '@mui/material';
import { Routes, Route } from 'react-router-dom';
import Navbar from './Navbar/Navbar';
import UserInfo from './UserInfo';
import ECDataTable from './DataWater/ECDataTable';
import SensorDataTable from './DataWater/SensorDataTable';
import InvoiceTable from './Invoice/InvoiceTable';
import WaterBillChart from './Statics/WaterBillChart';
import WaterDataChart from './Statics/WaterDataChart';
import WarningComponent from './Warning/WarningComponent';
import SystemConfig from './Config/SystemConfig';
import Footer from './Footer';
import { HEIGHT_FOOTER, HEIGHT_USERINFO, MARGIN_HEADING } from '../Assets/Constants/constants';
import AdminInfo from './AdminInfo';
import AdminDashboard from './AdminDashboard';
import { Navigate } from 'react-router-dom';
import { connectWebSocket } from '../Socket/WebSocketService';

function Dashboard({ user, role }) {
    // Không cần kết nối WebSocket ở đây vì đã kết nối ở App.js
    useEffect(() => {
        console.log('Dashboard mounted - WebSocket đã được kết nối ở App.js');
        // Không gọi connectWebSocket() ở đây nữa
    }, []);

    return (
        <Box
            display="flex"
            sx={{
                position: "relative",
                margin: '0px',
                flexDirection: { xs: 'column', sm: 'row' } // Chuyển sang layout dọc trên màn hình nhỏ
            }}
        >
            <Navbar role={role}/>
            <Box
                flex={1}
                sx={{
                    height: { xs: 'auto', sm: '100vh' }, // Chiều cao tự động trên màn hình nhỏ
                    position: 'relative',
                    width: { xs: '100%', sm: 'auto' }, // Chiều rộng 100% trên màn hình nhỏ
                    overflow: 'auto' // Cho phép cuộn nếu nội dung quá dài
                }}
            >
                {role === "user" && (
                    < UserInfo
                        user={user}
                    />
                )}

                {role === "admin" && (
                    < AdminInfo />
                )}

                {/* Main content area for routing */}
                <Box
                    sx={{
                        height: {
                            xs: 'auto', // Chiều cao tự động trên màn hình nhỏ
                            sm: `calc(100vh - (${HEIGHT_USERINFO}px + ${HEIGHT_FOOTER}px + ${MARGIN_HEADING}px))`
                        },
                        position: 'relative',
                        // marginBottom: { xs: '100px', sm: '200px' },
                        padding: { xs: '10px', sm: '0' }, // Thêm padding trên màn hình nhỏ
                        minHeight: '300px', // Đảm bảo có chiều cao tối thiểu
                        overflow: 'auto' // Cho phép cuộn nếu nội dung quá dài
                    }}
                >
                    <Routes>
                        {/* Sử dụng cùng một component cho cả hai route để tránh mount/unmount */}
                        {role === 'admin' ? (
                            <>
                                <Route path="/" element={<AdminDashboard />} />
                                <Route path="/welcome" element={<AdminDashboard />} />
                                <Route path="/cau-hinh" element={<SystemConfig />} />
                            </>
                        ) : role === 'user' ? (
                            <>
                                <Route path="/" element={<Welcome user={user} />} />
                                <Route path="/welcome" element={<Welcome user={user} />} />
                            </>
                        ) : (
                            <>
                                <Route path="/" element={<Navigate to="/not-found" />} />
                                <Route path="/welcome" element={<Navigate to="/not-found" />} />
                            </>
                        )}
                        <Route path="/du-lieu" element={<SensorDataTable />} />
                        <Route path="/hoa-don" element={<InvoiceTable />} />
                        <Route path="/thong-ke/tien-nuoc" element={<WaterBillChart />} />
                        <Route path="/thong-ke/du-lieu-nuoc" element={<WaterDataChart />} />
                        <Route path="/xem-canh-bao" element={<WarningComponent />} />
                    </Routes>
                </Box>
                <Footer />
            </Box>
        </Box>
    );
}

export default Dashboard;
