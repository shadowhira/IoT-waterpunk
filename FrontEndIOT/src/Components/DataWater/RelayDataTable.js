import React, { useState, useEffect } from 'react';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, TableSortLabel} from '@mui/material';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward'; // Icon cho trạng thái bình thường
import { BORDER_RADIUS_SMALL, MARGIN_HEADING, THEME_COLOR_BORDER, TIME_DELAY_TABLE, TRANSITION_TABLE } from '../../Assets/Constants/constants';
import { createTableAnimation, hexToRgba } from '../../Assets/Constants/utils';
import Heading from '../Heading/Heading';
const initialData = [
    { id: 1, relayStatus: 'ON', timestamp: '2024-10-21 10:30', location: 'Hà Nội' },
    { id: 2, relayStatus: 'OFF', timestamp: '2024-10-21 10:35', location: 'Hồ Chí Minh' },
    { id: 3, relayStatus: 'ON', timestamp: '2024-10-21 10:40', location: 'Đà Nẵng' },
    { id: 4, relayStatus: 'OFF', timestamp: '2024-10-21 10:45', location: 'Hà Nội' },
    { id: 5, relayStatus: 'ON', timestamp: '2024-10-21 10:50', location: 'Hồ Chí Minh' },
    { id: 6, relayStatus: 'OFF', timestamp: '2024-10-21 10:55', location: 'Đà Nẵng' },
    { id: 7, relayStatus: 'ON', timestamp: '2024-10-21 11:00', location: 'Hà Nội' },
    { id: 8, relayStatus: 'OFF', timestamp: '2024-10-21 11:05', location: 'Hồ Chí Minh' },
    { id: 9, relayStatus: 'ON', timestamp: '2024-10-21 11:10', location: 'Đà Nẵng' },
    { id: 10, relayStatus: 'OFF', timestamp: '2024-10-21 11:15', location: 'Hà Nội' },
];

function RelayDataTable() {
    const slideDown = createTableAnimation(TRANSITION_TABLE)
    const [data, setData] = useState(initialData);
    const [order, setOrder] = useState('asc');
    const [orderBy, setOrderBy] = useState('relayStatus');

    const toggleRelayStatus = () => {
        const updatedData = data.map(item => ({
            ...item,
            relayStatus: Math.random() > 0.5 ? 'ON' : 'OFF',
            timestamp: new Date().toISOString().slice(0, 19).replace('T', ' '),
        }));
        setData(updatedData);
    };

    useEffect(() => {
        toggleRelayStatus();
        const intervalId = setInterval(toggleRelayStatus, 2000);
        return () => clearInterval(intervalId);
    }, []);

    const handleSort = (property) => {
        if (orderBy === property) {
            setOrder(order === 'asc' ? 'desc' : order === 'desc' ? '' : 'asc');
        } else {
            setOrder('asc');
            setOrderBy(property);
        }
    };

    const sortedData = (() => {
        if (order === '') return data; // Không sắp xếp
        return [...data].sort((a, b) => {
            if (a[orderBy] < b[orderBy]) return order === 'asc' ? -1 : 1;
            if (a[orderBy] > b[orderBy]) return order === 'asc' ? 1 : -1;
            return 0;
        });
    })();

    return (
        <div style={{ textAlign: 'center' }}>
            <Heading
                text="Dữ liệu Relay"
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
                                    active={orderBy === 'relayStatus'}
                                    direction={orderBy === 'relayStatus' ? (order === '' ? 'asc' : order) : 'asc'}
                                    onClick={() => handleSort('relayStatus')}
                                    IconComponent={() => {
                                        if (order === '') {
                                            return <ArrowForwardIcon />;
                                        }
                                        return order === 'asc' ? <ArrowUpwardIcon /> : <ArrowDownwardIcon />;
                                    }}
                                >
                                    Trạng thái Relay
                                </TableSortLabel>
                            </TableCell>
                            <TableCell align="center">Thời gian đo</TableCell>
                            <TableCell align="center">Vị trí</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {sortedData.map((row, index) => (
                            <TableRow key={row.id} style={{ backgroundColor: row.relayStatus === 'ON' ? 'lightgreen' : 'lightcoral' }}>
                                <TableCell align="center">{index + 1}</TableCell>
                                <TableCell align="center">{row.relayStatus}</TableCell>
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

export default RelayDataTable;
