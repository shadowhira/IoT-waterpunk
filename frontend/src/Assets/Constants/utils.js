import { keyframes } from '@mui/material';

export const createSlideDownAnimation = (distance) => keyframes`
  from {
    transform: translateY(${distance}); /* Sử dụng biến */
    opacity: 0.5; /* Ẩn ban đầu */
  }
  to {
    transform: translateY(0); /* Vị trí gốc */
    opacity: 1; /* Hiển thị hoàn toàn */
  }
`;

export const createSlideLeftAnimation = (distance) => keyframes`
  from {
    transform: translateX(${distance}); /* Sử dụng biến */
    opacity: 0.5; /* Ẩn ban đầu */
  }
  to {
    transform: translateX(0); /* Vị trí gốc */
    opacity: 1; /* Hiển thị hoàn toàn */
  }
`;

export const createItemInvoiceAnimation = (distance) => keyframes`
  from {
    transform: translateX(${distance}); /* Sử dụng biến */
    opacity: 0; /* Ẩn ban đầu */
  }
  to {
    transform: translateX(0); /* Vị trí gốc */
    opacity: 1; /* Hiển thị hoàn toàn */
  }
`;

export const createTableAnimation = (distance) => keyframes`
  from {
    transform: translateY(${distance}); /* Sử dụng biến */
    opacity: 0; /* Ẩn ban đầu */
  }
  to {
    transform: translateY(0); /* Vị trí gốc */
    opacity: 1; /* Hiển thị hoàn toàn */
  }
`;

export function hexToRgba(hex, alpha = 0.5) {
  // Xóa dấu # nếu có
  hex = hex.replace('#', '');

  // Tách màu đỏ, xanh lá, xanh dương
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);

  // Trả về giá trị RGBA
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}