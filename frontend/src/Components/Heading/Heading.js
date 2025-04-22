import React from 'react';
import Typography from '@mui/material/Typography';
import { hexToRgba } from '../../Assets/Constants/utils';
import { THEME_COLOR_BACKGROUND } from '../../Assets/Constants/constants';

const Heading = ({ text, title, margin, themeColorBorder }) => {
    // Sử dụng title nếu text không được cung cấp
    const displayText = text || title;

    // Sử dụng màu mặc định nếu themeColorBorder không được cung cấp
    const borderColor = themeColorBorder || THEME_COLOR_BACKGROUND;

    return (
        <Typography
            variant="h4"
            align="left"
            style={{
                margin: margin,
                fontWeight: 'bold',
                textShadow: `1px 1px 2px ${hexToRgba(borderColor)}`,
                color: '#333',
            }}
        >
            {displayText}
        </Typography>
    );
};

export default Heading