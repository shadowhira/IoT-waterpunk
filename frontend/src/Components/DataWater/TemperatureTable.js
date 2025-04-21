import React, { useState, useEffect } from 'react';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, TableSortLabel} from '@mui/material';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward'; // Normal state icon
import { BORDER_RADIUS_SMALL, MARGIN_HEADING, THEME_COLOR_BORDER, TIME_DELAY_TABLE, TRANSITION_TABLE } from '../../Assets/Constants/constants';
import { createTableAnimation, hexToRgba } from '../../Assets/Constants/utils';
import Heading from '../Heading/Heading';
const initialData = [
    { id: 1, temperatureValue: 25.3, timestamp: '2024-10-21 10:30', location: 'Hà Nội' },
    { id: 2, temperatureValue: 26.1, timestamp: '2024-10-21 10:35', location: 'Hồ Chí Minh' },
    { id: 3, temperatureValue: 24.5, timestamp: '2024-10-21 10:40', location: 'Đà Nẵng' },
    { id: 4, temperatureValue: 27.0, timestamp: '2024-10-21 10:45', location: 'Hà Nội' },
    { id: 5, temperatureValue: 28.2, timestamp: '2024-10-21 10:50', location: 'Hồ Chí Minh' },
    { id: 6, temperatureValue: 23.8, timestamp: '2024-10-21 10:55', location: 'Đà Nẵng' },
    { id: 7, temperatureValue: 26.5, timestamp: '2024-10-21 11:00', location: 'Hà Nội' },
    { id: 8, temperatureValue: 25.9, timestamp: '2024-10-21 11:05', location: 'Hồ Chí Minh' },
    { id: 9, temperatureValue: 24.2, timestamp: '2024-10-21 11:10', location: 'Đà Nẵng' },
    { id: 10, temperatureValue: 27.3, timestamp: '2024-10-21 11:15', location: 'Hà Nội' },
    { id: 11, temperatureValue: 25.6, timestamp: '2024-10-21 11:20', location: 'Hồ Chí Minh' },
    { id: 12, temperatureValue: 23.4, timestamp: '2024-10-21 11:25', location: 'Đà Nẵng' },
    { id: 13, temperatureValue: 26.8, timestamp: '2024-10-21 11:30', location: 'Hà Nội' },
    { id: 14, temperatureValue: 24.7, timestamp: '2024-10-21 11:35', location: 'Hồ Chí Minh' },
    { id: 15, temperatureValue: 27.1, timestamp: '2024-10-21 11:40', location: 'Đà Nẵng' },
];

function TemperatureTable() {
    const slideDown = createTableAnimation(TRANSITION_TABLE)
    const [data, setData] = useState(initialData);
    const [order, setOrder] = useState('asc');
    const [orderBy, setOrderBy] = useState('temperatureValue');

    const getRandomTemperatureValue = () => {
        return (Math.random() * 10 + 20).toFixed(2); // Random value between 20 and 30
    };

    const fetchDataFake = () => {
        const currentTime = new Date();
        const formattedTime = currentTime.toISOString().slice(0, 19).replace('T', ' ');

        const updatedData = data.map(item => ({
            ...item,
            temperatureValue: getRandomTemperatureValue(),
            timestamp: formattedTime,
        }));
        setData(updatedData);
    };

    useEffect(() => {
        fetchDataFake();
        const intervalId = setInterval(fetchDataFake, 2000);
        return () => clearInterval(intervalId);
    }, []);

    const getBackgroundColor = (value) => {
        if (value <= 24) return 'lightblue';  // "Low"
        if (value > 24 && value <= 26) return 'lightyellow';  // "Medium"
        return 'lightcoral';  // "High"
    };

    const handleSort = (property) => {
        if (orderBy === property) {
            // Cycle through states: normal -> asc -> desc
            if (order === 'asc') {
                setOrder('desc');
            } else if (order === 'desc') {
                setOrder(''); // Reset to normal
            } else {
                setOrder('asc');
            }
        } else {
            setOrder('asc');
            setOrderBy(property);
        }
    };

    const sortedData = (() => {
        if (order === '') return data; // No sorting
        return [...data].sort((a, b) => {
            if (a[orderBy] < b[orderBy]) return order === 'asc' ? -1 : 1;
            if (a[orderBy] > b[orderBy]) return order === 'asc' ? 1 : -1;
            return 0;
        });
    })();

    return (
        <div style={{ textAlign: 'center' }}>
            <Heading
                text="Dữ liệu nhiệt độ"
                margin={MARGIN_HEADING}
                themeColorBorder={THEME_COLOR_BORDER}
            ></Heading>
            <TableContainer component={Paper}
                sx={{
                    width: '80vh',
                    height: '70vh',
                    margin: 'auto', // Center the table container
                    borderRadius: BORDER_RADIUS_SMALL,
                    border: `3px solid ${THEME_COLOR_BORDER}`,
                    boxShadow: '0px 4px 10px rgba(0, 0, 0, 0.2)', // Thêm shadow
                    // overflow: 'hidden',
                    scrollbarWidth: 'none',
                    msOverflowStyle: 'none',
                    animation: `${slideDown} 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) ${TIME_DELAY_TABLE} both`
                }}
            >
                <Table>
                    <TableHead
                        style={{
                            position: 'sticky',
                            top: 0,
                            zIndex: 1, // Để đảm bảo TableHead luôn nằm trên các thành phần khác
                            backgroundColor: '#fff', // Màu nền để tránh bị chồng mờ
                        }}
                    >
                        <TableRow>
                            <TableCell align="center">STT</TableCell>
                            <TableCell align="center">
                                <TableSortLabel
                                    active={orderBy === 'temperatureValue'}
                                    direction={orderBy === 'temperatureValue' ? (order === '' ? 'asc' : order) : 'asc'}
                                    onClick={() => handleSort('temperatureValue')}
                                    IconComponent={() => {
                                        if (order === '') {
                                            return <ArrowForwardIcon />;
                                        }
                                        return order === 'asc' ? <ArrowUpwardIcon /> : <ArrowDownwardIcon />;
                                    }}
                                >
                                    Temperature Value (°C)
                                </TableSortLabel>
                            </TableCell>
                            <TableCell align="center">Measurement Timestamp</TableCell>
                            <TableCell align="center">Location</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {sortedData.map((row, index) => (
                            <TableRow key={row.id} style={{ backgroundColor: getBackgroundColor(row.temperatureValue) }}>
                                <TableCell align="center">{index + 1}</TableCell>
                                <TableCell align="center">{row.temperatureValue}</TableCell>
                                <TableCell align="center">{row.timestamp}</TableCell>
                                <TableCell align="center">{row.location}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
        </div>
    );
}

export default TemperatureTable;
