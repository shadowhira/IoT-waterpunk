import React from 'react';
import Typography from '@mui/material/Typography';
import { hexToRgba } from '../../Assets/Constants/utils';

const Heading = ({ text, margin, themeColorBorder }) => {
    return (
        <Typography
            variant="h4"
            align="left"
            style={{
                margin: margin,
                fontWeight: 'bold',
                textShadow: `1px 1px 2px ${hexToRgba(themeColorBorder)}`,
                color: '#333',
            }}
        >
            {text}
        </Typography>
    );
};

export default Heading