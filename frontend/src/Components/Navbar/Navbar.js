import React, { useState } from "react";
import { Drawer, List, IconButton, Box } from "@mui/material";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";
import ArrowBackIosIcon from "@mui/icons-material/ArrowBackIos";
import DashboardIcon from "@mui/icons-material/Dashboard";
import InfoIcon from "@mui/icons-material/Info";
import ReceiptIcon from "@mui/icons-material/Receipt";
import BarChartIcon from "@mui/icons-material/BarChart";
import WarningIcon from "@mui/icons-material/Warning";
import InvertColorsIcon from "@mui/icons-material/InvertColors";
import ElectricBoltIcon from "@mui/icons-material/ElectricBolt";
import DeviceThermostatIcon from "@mui/icons-material/DeviceThermostat";
import SettingsIcon from "@mui/icons-material/Settings";
import ItemNavbar from "./ItemNavbar";
import SsidChartIcon from "@mui/icons-material/SsidChart";
import EqualizerIcon from "@mui/icons-material/Equalizer";
import logoImage from "../../Assets/Images/logo.png"; // Đường dẫn ảnh logo
import {
  TRANSITION_NAVBAR,
  TIME_DELAY,
} from "../../Assets/Constants/constants";
import { createSlideLeftAnimation } from "../../Assets/Constants/utils";

function Navbar({ role }) {
  const parent = role === "admin" ? "admindashboard" : "dashboard";
  const slideDown = createSlideLeftAnimation(TRANSITION_NAVBAR);
  const [drawerOpen, setDrawerOpen] = useState(true);
  const [showText, setShowText] = useState(true);
  const [selectedItem, setSelectedItem] = useState(`/${parent}/welcome`); // Trạng thái của mục đã chọn

  const toggleDrawer = () => {
    if (drawerOpen) setShowText(false);
    setDrawerOpen(!drawerOpen);
  };

  const handleTransitionEnd = () => {
    if (drawerOpen) setShowText(true);
  };

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: drawerOpen ? 240 : 60,
        height: "100vh",
        flexShrink: 0,
        transition: "width 0.3s",
        "& .MuiDrawer-paper": {
          width: drawerOpen ? 240 : 60,
          boxSizing: "border-box",
          transition: "width 0.3s",
        },
        animation: `${slideDown} 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) ${TIME_DELAY} both`,
      }}
      onTransitionEnd={handleTransitionEnd}
    >
      <Box
        sx={{
          display: "flex",
          justifyContent: drawerOpen ? "flex-end" : "center",
          alignItems: "center",
          padding: 1,
        }}
      >
        <IconButton
          onClick={toggleDrawer}
          sx={{
            transition: "transform 0.3s",
          }}
        >
          {drawerOpen ? <ArrowBackIosIcon /> : <ArrowForwardIosIcon />}
        </IconButton>
      </Box>
      {/* Logo */}
      <Box
        component="img"
        src={logoImage}
        alt="Logo"
        sx={{
          width: "auto",
          borderRadius: "50%",
        }}
      />
      <List>
        <ItemNavbar
          icon={<DashboardIcon />}
          label="Welcome"
          route={`/${parent}/welcome`}
          drawerOpen={drawerOpen}
          showText={showText}
          isSelected={selectedItem === `/${parent}/welcome`}
          onSelect={() => setSelectedItem(`/${parent}/welcome`)}
        />
        <ItemNavbar
          icon={<InfoIcon />}
          label="Dữ liệu"
          route={`/${parent}/du-lieu`}
          drawerOpen={drawerOpen}
          showText={showText}
          isSelected={selectedItem === `/${parent}/du-lieu`}
          onSelect={() => setSelectedItem(`/${parent}/du-lieu`)}
          // subItems={[
          //   { icon: <InvertColorsIcon />, label: 'Dữ liệu độ đục', route: `/${parent}/du-lieu/do-duc` },
          //   { icon: <ElectricBoltIcon />, label: 'Dữ liệu EC', route: `/${parent}/du-lieu/ec` },
          //   { icon: <DeviceThermostatIcon />, label: 'Dữ liệu nhiệt độ', route: `/${parent}/du-lieu/nhiệt-do` },
          //   { icon: <InfoIcon />, label: 'Dữ liệu Relay', route: `/${parent}/du-lieu/relay` },
          // ]}
        />
        <ItemNavbar
          icon={<ReceiptIcon />}
          label="Hóa đơn"
          route={`/${parent}/hoa-don`}
          drawerOpen={drawerOpen}
          showText={showText}
          isSelected={selectedItem === `/${parent}/hoa-don`}
          onSelect={() => setSelectedItem(`/${parent}/hoa-don`)}
        />
        <ItemNavbar
          icon={<BarChartIcon />}
          label="Thống kê"
          drawerOpen={drawerOpen}
          showText={showText}
          isSelected={selectedItem.startsWith(`/${parent}/thong-ke`)}
          onSelect={() => setSelectedItem(`/${parent}/thong-ke`)}
          subItems={[
            {
              icon: <EqualizerIcon />,
              label: "Thống kê tiền nước",
              route: `/${parent}/thong-ke/tien-nuoc`,
            },
            {
              icon: <SsidChartIcon />,
              label: "Thống kê dữ liệu nước",
              route: `/${parent}/thong-ke/du-lieu-nuoc`,
            },
          ]}
        />
        <ItemNavbar
          icon={<WarningIcon />}
          label="Xem cảnh báo"
          route={`/${parent}/xem-canh-bao`}
          drawerOpen={drawerOpen}
          showText={showText}
          isSelected={selectedItem === `/${parent}/xem-canh-bao`}
          onSelect={() => setSelectedItem(`/${parent}/xem-canh-bao`)}
        />
        <ItemNavbar
          icon={<SettingsIcon />}
          label="Cấu hình hệ thống"
          route={`/${parent}/cau-hinh`}
          drawerOpen={drawerOpen}
          showText={showText}
          isSelected={selectedItem === `/${parent}/cau-hinh`}
          onSelect={() => setSelectedItem(`/${parent}/cau-hinh`)}
        />
      </List>
    </Drawer>
  );
}

export default Navbar;
