import { ToggleButton, styled } from '@mui/material';

const CircleToggleButton = styled(ToggleButton)(({ theme, active }) => ({
    width: 50,            // Đặt kích thước chiều rộng
    height: 50,           // Đặt kích thước chiều cao
    backgroundColor: active ? '#3f51b5' : 'transparent',  // Màu nền thay đổi khi toggle
    color: 'white',       // Màu chữ trắng
    '&:hover': {
        backgroundColor: active ? '#303f9f' : '#e0e0e0', // Màu khi hover
    },
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '70px',
    border: 'none',

}));

export default CircleToggleButton