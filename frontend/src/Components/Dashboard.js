import React, { useEffect, useState } from 'react';
import Welcome from './Welcome';
import { Box } from '@mui/material';
import { Routes, Route } from 'react-router-dom';
import Navbar from './Navbar/Navbar';
import UserInfo from './UserInfo';
import TurbidityTable from './DataWater/TurbidityTable';
import TemperatureTable from './DataWater/TemperatureTable';
import ECDataTable from './DataWater/ECDataTable';
import RelayDataTable from './DataWater/RelayDataTable';
import InvoiceTable from './Invoice/InvoiceTable';
import WaterBillChart from './Statics/WaterBillChart';
import WaterDataChart from './Statics/WaterDataChart';
import WarningComponent from './Warning/WarningComponent';
import SystemConfig from './Config/SystemConfig';
import Footer from './Footer';
import { HEIGHT_FOOTER, HEIGHT_USERINFO, MARGIN_HEADING } from '../Assets/Constants/constants';
import { css } from '@emotion/react';
import AdminInfo from './AdminInfo';
import AdminDashboard from './AdminDashboard';
import { Navigate } from 'react-router-dom';
import { connectWebSocket } from '../Socket/WebSocketService';

function Dashboard({ user, role }) {
    // Kết nối WebSocket khi component được tạo
    useEffect(() => {
        connectWebSocket();
    }, []);

    return (
        <Box display="flex" sx={{ position: "relative", margin: '0px' }}>
            <Navbar role = {role}/>
            <Box
                flex={1}
                sx={{
                    height: '100vh',
                    position: 'relative',
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
                        height: `calc(100vh - (${HEIGHT_USERINFO}px + ${HEIGHT_FOOTER}px + ${MARGIN_HEADING}px))`,
                        position: 'relative',
                        // overflow: 'hidden' // Container has hidden overflow
                        marginBottom: '200px',
                    }}
                >
                    <Routes>
                        <Route path="/" element={
                            role === 'user' ? (
                                <Welcome user={user} />
                            ) : role === 'admin' ? (
                                <AdminDashboard/>
                            ) : (
                                <Navigate to="/not-found" /> // Redirect nếu role không hợp lệ
                            )
                        } />
                        <Route path="/welcome" element={
                            role === 'user' ? (
                                <Welcome user={user} />
                            ) : role === 'admin' ? (
                                <AdminDashboard/>
                            ) : (
                                <Navigate to="/not-found" /> // Redirect nếu role không hợp lệ
                            )
                        } />
                        <Route path="/du-lieu" element={<ECDataTable />} />
                        <Route path="/hoa-don" element={<InvoiceTable />} />
                        <Route path="/thong-ke/tien-nuoc" element={<WaterBillChart />} />
                        <Route path="/thong-ke/du-lieu-nuoc" element={<WaterDataChart />} />
                        <Route path="/xem-canh-bao" element={<WarningComponent />} />
                        <Route path="/cau-hinh" element={<SystemConfig />} />
                    </Routes>
                </Box>
                <Footer />
            </Box>
        </Box>
    );
}

export default Dashboard;
