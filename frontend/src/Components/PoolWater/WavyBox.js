import React, { useState, useEffect, useCallback } from 'react';
import { COLOR_WATER, HEIGHT_WAVY } from '../../Assets/Constants/constants';
import { hexToRgba } from '../../Assets/Constants/utils';

const WavyBox = ({ width }) => {
    const baseAmplitude = 5; // Biên độ cơ bản
    const amplitudeVariation = 2; // Biên độ dao động thêm
    const wavelength = 100; // Độ dài sóng
    const speed = 0.1; // Tốc độ chuyển động sóng
    const amplitudeSpeed = 0.05; // Tốc độ thay đổi biên độ

    // Hàm tạo sóng hình sin với biên độ thay đổi theo vị trí x
    // Sử dụng useCallback để tránh tạo hàm mới mỗi khi render
    const generateWavePath = useCallback((time) => {
        const points = [];
        for (let x = 0; x <= width; x += 10) {
            // Biên độ thay đổi theo x để tạo hiệu ứng uốn lượn
            const dynamicAmplitude =
                baseAmplitude +
                amplitudeVariation * Math.sin(time * amplitudeSpeed + x * 0.05); // Thêm thay đổi theo x

            // Tính toán y dựa trên biên độ động
            const y =
                HEIGHT_WAVY / 2 + dynamicAmplitude * Math.sin((x / wavelength) * 2 * Math.PI + time * speed);
            points.push(`${x},${y}`);
        }

        // Căn giữa sóng theo chiều ngang
        const offsetX = (width - (width / wavelength) * wavelength) / 2;
        return `M${points[0]} ` + points.slice(1).map((p) => `L${offsetX + p}`).join(' ') + ` V${HEIGHT_WAVY} H0 Z`;
    }, [width, baseAmplitude, amplitudeVariation, wavelength, speed, amplitudeSpeed, HEIGHT_WAVY]);

    const [wavePath, setWavePath] = useState(generateWavePath(0));
    const [wavePathBehind, setWavePathBehind] = useState(generateWavePath(0)); // Sóng phía sau

    useEffect(() => {
        let animationFrameId;
        let time = 0;

        const animateWave = () => {
            time += 1; // Tăng thời gian
            setWavePath(generateWavePath(time)); // Cập nhật sóng phía trước
            setWavePathBehind(generateWavePath(time * 0.5)); // Cập nhật sóng phía sau, tốc độ chậm hơn
            animationFrameId = requestAnimationFrame(animateWave); // Yêu cầu frame tiếp theo
        };

        animationFrameId = requestAnimationFrame(animateWave);

        return () => cancelAnimationFrame(animationFrameId); // Dọn dẹp interval khi component bị unmount
    }, [generateWavePath]); // Chỉ cần phụ thuộc vào generateWavePath vì nó đã phụ thuộc vào width

    return (
        <div style={{ position: 'absolute', width: `${width}px`, top: '-10px' }}>
            {/* Sóng phía sau (di chuyển chậm hơn) */}
            <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox={`0 0 ${width} ${HEIGHT_WAVY}`}
                style={{
                    position: 'absolute',
                    top: `${-HEIGHT_WAVY / 2 - 8}`,
                    left: 0,
                    zIndex: 5, // Sóng phía sau

                }}
            >
                <path
                    d={wavePathBehind}
                    fill={hexToRgba(COLOR_WATER, 0.2)} // Màu sóng phía sau đậm hơn
                />
            </svg>

            {/* Sóng phía trước (di chuyển nhanh hơn) */}
            <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox={`0 0 ${width} ${HEIGHT_WAVY}`}
                style={{
                    position: 'absolute',
                    top: `${-HEIGHT_WAVY / 2}`,
                    left: 0,
                    zIndex: 10, // Sóng phía trước
                    // borderBottomLeftRadius: '30px',
                    // borderBottomRightRadius: '30px',
                }}
            >
                <path
                    d={wavePath}
                    fill={COLOR_WATER} // Màu sóng phía trước sáng hơn
                />
            </svg>
        </div>
    );
};

export default WavyBox;
