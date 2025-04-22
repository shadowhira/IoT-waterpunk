import React, { useState, useEffect } from "react";
import { Drawer, List, IconButton, Box, AppBar, Toolbar, Typography, useMediaQuery, useTheme, BottomNavigation, BottomNavigationAction } from "@mui/material";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";
import ArrowBackIosIcon from "@mui/icons-material/ArrowBackIos";
import DashboardIcon from "@mui/icons-material/Dashboard";
import InfoIcon from "@mui/icons-material/Info";
import ReceiptIcon from "@mui/icons-material/Receipt";
import BarChartIcon from "@mui/icons-material/BarChart";
import WarningIcon from "@mui/icons-material/Warning";
import MenuIcon from "@mui/icons-material/Menu";
// import InvertColorsIcon from "@mui/icons-material/InvertColors";
// import ElectricBoltIcon from "@mui/icons-material/ElectricBolt";
// import DeviceThermostatIcon from "@mui/icons-material/DeviceThermostat";
import SettingsIcon from "@mui/icons-material/Settings";
import ItemNavbar from "./ItemNavbar";
import SsidChartIcon from "@mui/icons-material/SsidChart";
import EqualizerIcon from "@mui/icons-material/Equalizer";
import logoImage from "../../Assets/Images/logo.png"; // Đường dẫn ảnh logo
import {
  TRANSITION_NAVBAR,
  TIME_DELAY,
  THEME_COLOR_BACKGROUND,
  THEME_COLOR_FONT,
} from "../../Assets/Constants/constants";
import { createSlideLeftAnimation } from "../../Assets/Constants/utils";
import { useNavigate } from "react-router-dom";

function Navbar({ role }) {
  const parent = role === "admin" ? "admindashboard" : "dashboard";
  const slideDown = createSlideLeftAnimation(TRANSITION_NAVBAR);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [showText, setShowText] = useState(false);
  const [selectedItem, setSelectedItem] = useState(`/${parent}/welcome`); // Trạng thái của mục đã chọn
  const [mobileOpen, setMobileOpen] = useState(false);
  const [bottomNavValue, setBottomNavValue] = useState(0);

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const navigate = useNavigate();

  // Đóng drawer khi chuyển sang mobile view
  useEffect(() => {
    if (isMobile) {
      setDrawerOpen(false);
      setShowText(false);
    } else {
      setDrawerOpen(true);
      setShowText(true);
    }
  }, [isMobile]);

  const toggleDrawer = () => {
    if (drawerOpen) setShowText(false);
    setDrawerOpen(!drawerOpen);
  };

  const toggleMobileDrawer = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleTransitionEnd = () => {
    if (drawerOpen) setShowText(true);
  };

  const handleBottomNavChange = (event, newValue) => {
    setBottomNavValue(newValue);
    switch(newValue) {
      case 0:
        navigate(`/${parent}/welcome`);
        setSelectedItem(`/${parent}/welcome`);
        break;
      case 1:
        navigate(`/${parent}/du-lieu`);
        setSelectedItem(`/${parent}/du-lieu`);
        break;
      case 2:
        navigate(`/${parent}/hoa-don`);
        setSelectedItem(`/${parent}/hoa-don`);
        break;
      case 3:
        navigate(`/${parent}/xem-canh-bao`);
        setSelectedItem(`/${parent}/xem-canh-bao`);
        break;
      case 4:
        navigate(`/${parent}/cau-hinh`);
        setSelectedItem(`/${parent}/cau-hinh`);
        break;
      default:
        break;
    }
  };

  // Mobile Top AppBar
  const mobileAppBar = (
    <AppBar position="fixed" sx={{ backgroundColor: THEME_COLOR_BACKGROUND, display: { xs: 'block', sm: 'none' } }}>
      <Toolbar>
        <IconButton
          color="inherit"
          aria-label="open drawer"
          edge="start"
          onClick={toggleMobileDrawer}
          sx={{ mr: 2 }}
        >
          <MenuIcon />
        </IconButton>
        <Box
          component="img"
          src={logoImage}
          alt="Logo"
          sx={{ height: 40, borderRadius: '50%', mr: 1 }}
        />
        <Typography variant="h6" noWrap component="div">
          WaterPunk
        </Typography>
      </Toolbar>
    </AppBar>
  );

  // Mobile Bottom Navigation
  const mobileBottomNav = (
    <BottomNavigation
      value={bottomNavValue}
      onChange={handleBottomNavChange}
      showLabels
      sx={{
        width: '100%',
        position: 'fixed',
        bottom: 0,
        zIndex: 1300,
        display: { xs: 'flex', sm: 'none' },
        backgroundColor: THEME_COLOR_BACKGROUND,
        '& .MuiBottomNavigationAction-root': {
          color: 'rgba(255, 255, 255, 0.7)',
        },
        '& .Mui-selected': {
          color: THEME_COLOR_FONT,
        },
      }}
    >
      <BottomNavigationAction label="Home" icon={<DashboardIcon />} />
      <BottomNavigationAction label="Dữ liệu" icon={<InfoIcon />} />
      <BottomNavigationAction label="Hóa đơn" icon={<ReceiptIcon />} />
      <BottomNavigationAction label="Cảnh báo" icon={<WarningIcon />} />
      <BottomNavigationAction label="Cấu hình" icon={<SettingsIcon />} />
    </BottomNavigation>
  );

  // Desktop Sidebar
  return (
    <>
      {mobileAppBar}
      <Drawer
        variant={isMobile ? "temporary" : "permanent"}
        open={isMobile ? mobileOpen : true}
        onClose={toggleMobileDrawer}
        sx={{
          width: drawerOpen ? { xs: 240, sm: 220, md: 240 } : { xs: 60, sm: 55, md: 60 },
          height: "100vh",
          flexShrink: 0,
          transition: "width 0.3s",
          display: { xs: mobileOpen ? 'block' : 'none', sm: 'block' },
          "& .MuiDrawer-paper": {
            width: drawerOpen ? { xs: 240, sm: 220, md: 240 } : { xs: 60, sm: 55, md: 60 },
            boxSizing: "border-box",
            transition: "width 0.3s",
          },
          animation: `${slideDown} 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) ${TIME_DELAY} both`,
          zIndex: 1200, // Đảm bảo navbar luôn hiển thị trên các phần tử khác
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
          width: drawerOpen ? { xs: "80%", sm: "85%", md: "90%" } : { xs: "70%", sm: "75%", md: "80%" },
          maxWidth: "200px",
          margin: "0 auto",
          display: "block",
          borderRadius: "50%",
          padding: drawerOpen ? "10px" : "5px",
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
    {mobileBottomNav}
    </>
  );
}

export default Navbar;
