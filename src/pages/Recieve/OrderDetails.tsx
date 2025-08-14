import React from 'react';
import { Box, Typography, Button, TextField, Divider, InputAdornment } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import { orderLabels } from '../../config/label/OrderDetail.labels';
import { themeColors, buttonSizes, typography } from '../../config/constants/OrderDetail.constants';
import TickMarkSvg from '../../assets/Right.svg';
import PlusIcon from "../../assets/PlusIcon.svg"

interface OrderDetailsProps {
    labels: typeof orderLabels;
}

const OrderDetails: React.FC<OrderDetailsProps> = ({ labels }) => {
    return (
        <>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0px' }} >
                <Typography
                    variant="h4"
                    sx={{
                        fontWeight: 'bold',
                        color: themeColors.textPrimary,
                        fontSize: typography.headerSize,
                    }}>
                    {labels.orderDetails}
                </Typography>

                <Box sx={{ display: 'flex', gap: '12px' }}>
                    <Button
                        variant="outlined"
                        disableRipple
                        sx={{
                            borderColor: themeColors.cancelButtonBorder,
                            color: themeColors.cancelButtonBorder,
                            backgroundColor: 'transparent',
                            "&:hover": { backgroundColor: "transparent" },
                            "&:active": { backgroundColor: "transparent" },
                            "&:focusVisible": { backgroundColor: "transparent" },
                            height: '48px',
                            width: '86px',
                            borderRadius: '12px',
                            fontFamily: 'Lexend',
                            fontWeight: 500,
                            fontSize: '12px',
                            lineHeight: '24px',
                            border: '2px solid'
                        }}>
                        {labels.cancelButton}
                    </Button>
                    <Button
                        variant="contained"
                        sx={{
                            backgroundColor: '#5C17E5',
                            borderRadius: '12px',
                            width: '166px',
                            height: '48px',
                            fontFamily: 'inherit',
                            textTransform: 'none',
                        }}
                    >
                        <img src={TickMarkSvg} alt="Right Icon" style={{ width: '16px', height: '16px', marginRight: '8px' }} />
                        Order Received
                    </Button>
                </Box>
            </Box>
            <Divider sx={{ marginTop: '16px' }} />

            <Box sx={{ display: 'flex', gap: '24px', marginTop: '10px' }}>
                {/* Supplier Name and GSTIN Field */}
                <Box
                    sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        width: '516px',
                        gap: '4px',
                        height: '48px'
                    }}
                >
                    <Typography
                        sx={{
                            fontFamily: 'Lexend',
                            fontWeight: 500,
                            fontSize: '12px',
                            lineHeight: '18px',
                            color: '#728197'
                        }}
                    >
                        Supplier Name
                    </Typography>
                    <Box
                        sx={{
                            backgroundColor: '#F6F8FB',
                            borderRadius: '12px',
                            padding: '12px 16px',
                            height: '48px'
                        }}
                    >
                        <Typography
                            sx={{
                                fontFamily: 'Lexend',
                                fontWeight: 400,
                                fontSize: '16px',
                                lineHeight: '24px',
                                color: '#1A212B'
                            }}
                        >
                            Sri Sai Anjyana Medical GSTIN: 899066578898...
                        </Typography>
                    </Box>
                </Box>

                {/* Invoice No Field */}
                <Box
                    sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        width: '275px',
                        gap: '4px',
                        height: '48px'
                    }}
                >
                    <Typography
                        sx={{
                            fontFamily: 'Lexend',
                            fontWeight: 500,
                            fontSize: '12px',
                            lineHeight: '18px',
                            color: '#525E6F'
                        }}
                    >
                        Invoice No
                    </Typography>
                    <Box
                        sx={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            border: '1px solid #9AA8BC',
                            borderRadius: '12px',
                            padding: '12px 16px',
                            backgroundColor: '#FFFFFF',
                            height: '48px'
                        }}
                    >
                        <Typography
                            sx={{
                                fontFamily: 'Lexend',
                                fontWeight: 400,
                                fontSize: '16px',
                                lineHeight: '24px',
                                color: '#728197'
                            }}
                        >
                            45788999
                        </Typography>
                        {/* Placeholder for the dropdown icon */}
                        <Box sx={{ width: '24px', height: '24px' }}>
                            {/* You would place your SVG or MUI icon component here */}
                        </Box>
                    </Box>
                </Box>

                {/* Invoice Date Field */}
                <Box
                    sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        width: '274px',
                        gap: '4px'
                    }}
                >
                    <Typography
                        sx={{
                            fontFamily: 'Lexend',
                            fontWeight: 500,
                            fontSize: '12px',
                            lineHeight: '18px',
                            color: '#525E6F'
                        }}
                    >
                        Invoice Date
                    </Typography>
                    <TextField
                        variant="outlined"
                        fullWidth
                        sx={{
                            '& .MuiOutlinedInput-root': {
                                borderRadius: '12px',
                                height: '48px',
                                '& fieldset': {
                                    borderColor: '#9AA8BC',
                                },
                                '&:hover fieldset': {
                                    borderColor: '#9AA8BC',
                                },
                                '&.Mui-focused fieldset': {
                                    borderColor: '#9AA8BC',
                                },
                            },
                            '& .MuiOutlinedInput-input': {
                                padding: '12px 16px',
                                fontFamily: 'Lexend',
                                fontSize: '16px',
                                lineHeight: '24px',
                            },
                        }}
                    />
                </Box>

                {/* Credit Field */}
                <Box
                    sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        width: '275px',
                        gap: '4px'
                    }}
                >
                    <Typography
                        sx={{
                            fontFamily: 'Lexend',
                            fontWeight: 500,
                            fontSize: '12px',
                            lineHeight: '18px',
                            color: '#525E6F'
                        }}
                    >
                        Credit
                    </Typography>
                    <TextField
                        variant="outlined"
                        fullWidth
                        sx={{
                            '& .MuiOutlinedInput-root': {
                                borderRadius: '12px',
                                height: '48px',
                                '& fieldset': {
                                    borderColor: '#9AA8BC',
                                },
                                '&:hover fieldset': {
                                    borderColor: '#9AA8BC',
                                },
                                '&.Mui-focused fieldset': {
                                    borderColor: '#9AA8BC',
                                },
                            },
                            '& .MuiOutlinedInput-input': {
                                padding: '12px 16px',
                                fontFamily: 'Lexend',
                                fontSize: '16px',
                                lineHeight: '24px',
                            },
                        }}
                    />
                </Box>
            </Box>
            <Divider sx={{ marginTop: '10px' }} />
            {/* Figma design section with "Find Product" and "Add Product" */}
            <Box
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'flex-start', // Align to the start of the container
                    marginTop: '24px',
                    marginBottom: '24px',
                    gap: '16px',
                    width: '100%', // Set width to take full available space
                }}
            >
                <TextField
                    placeholder="Find Product"
                    variant="outlined"
                    sx={{
                        width: '344px',
                        height: '48px',
                        '& .MuiOutlinedInput-root': {
                            height: '48px',
                            borderRadius: '12px',
                            padding: '12px 16px',
                            backgroundColor: '#FFFFFF',
                            borderColor: '#9AA8BC',
                        },
                        '& .MuiInputBase-input': {
                            padding: 0,
                            fontFamily: 'Lexend',
                            fontSize: '16px',
                            fontWeight: 400,
                            lineHeight: '24px',
                            color: '#728197',
                        },
                    }}
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <SearchIcon sx={{ color: '#728197', width: '24px', height: '24px' }} />
                            </InputAdornment>
                        ),
                    }}
                />
                <Button
                    variant="outlined"
                    sx={{
                        width: '150px',
                        height: '48px',
                        borderRadius: '12px',
                        border: '1px solid #E6E8EA',
                        backgroundColor: '#FFFFFF',
                        padding: '12px 16px',
                        gap: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        textTransform: 'none',
                        fontFamily: 'Lexend',
                        fontWeight: 500,
                        fontSize: '16px',
                        lineHeight: '24px',
                        color: '#27313F',
                    }}
                >
                    <img src={PlusIcon} alt="Add Product" style={{ width: '24px', height: '24px' }} />
                    Add Product
                </Button>
                <Box
                    sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'flex-end', // Align to the end to push it to the far right
                        flexGrow: 1, // Allow this box to grow and push the content to the right
                        height: '24px',
                        padding: '0px',
                        gap: '8px',
                    }}
                >
                    <Typography
                        variant="body1"
                        sx={{
                            fontFamily: 'Lexend',
                            fontWeight: 500,
                            fontSize: '14px',
                            lineHeight: '24px',
                            color: '#728197',
                            whiteSpace: 'nowrap',
                        }}
                    >
                        No. Of. Items: 0
                    </Typography>
                </Box>
            </Box>
        </>
    );
};

export default OrderDetails;