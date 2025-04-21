import React, { useState, useEffect } from 'react';
import { Box, Typography } from '@mui/material';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import InfoIcon from '@mui/icons-material/Info';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import { MARGIN_HEADING } from '../../Assets/Constants/constants';

const WarningComponent = () => {
    const [alertData, setAlertData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchDataFake();
    }, []);

    const fetchDataFake = () => {
        // Simulate an API call to randomly generate alert data
        const id = Math.floor(Math.random() * 3) + 1;
        const data = {
            id, // Randomly assign id from 1 to 3
            heading: id === 1 ? 'Critical Alert' : id === 2 ? 'Neutral Alert' : 'Good Alert',
            description:
                id === 1
                    ? 'Immediate action required. This is a critical warning.'
                    : id === 2
                        ? 'Please review the system for possible improvements.'
                        : 'All systems are functioning within normal parameters.',
        };

        setAlertData(data);
        setLoading(false);
    };

    if (loading) return <div>Loading...</div>;

    // Define alert styles and icons based on the id
    const alertStyles = {
        1: {
            color: 'red',
            icon: <ErrorOutlineIcon style={{ fontSize: 60, color: 'white' }} />, // inline style to ensure it works
        },
        2: {
            color: 'gray',
            icon: <InfoIcon style={{ fontSize: 60, color: 'white' }} />,
        },
        3: {
            color: 'green',
            icon: <CheckCircleOutlineIcon style={{ fontSize: 60, color: 'white' }} />,
        },
    };

    const { id, heading, description } = alertData;

    return (
        <Box
            sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
                marginTop: MARGIN_HEADING/8
            }}
        >

            <Box
                sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: alertStyles[id].color,
                    color: 'white',
                    borderRadius: '8px',
                    padding: '20px',
                    maxWidth: '400px',
                    textAlign: 'center',
                }}
            >
                {/* Display the icon based on the id */}
                {alertStyles[id].icon}
                <Typography variant="h4" sx={{ fontWeight: 'bold', margin: '10px 0' }}>
                    {heading}
                </Typography>
                <Typography variant="body1">{description}</Typography>
            </Box>
        </Box>
    );
};

export default WarningComponent;
