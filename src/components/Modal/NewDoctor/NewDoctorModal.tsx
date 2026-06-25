import React, { useState, useEffect, ChangeEvent, FormEvent } from 'react';
import { Modal, Box, Typography, TextField, Select, FormControl, InputLabel, MenuItem, Grid, Stack, IconButton, Alert } from '@mui/material';
import { StandardButton } from '../../Common';
import CloseIcon from '@mui/icons-material/Close';
import { MASTER_GENDER_OPTIONS } from '../../../config/constants/MasterView.constants';

// Canonical Doctor-table fields. `name` required; gender is the canonical int (1/2/3)
// or null when unselected. All other fields optional.
export interface DoctorData {
    name: string;
    email: string;
    phone: string;
    branch: string;
    address: string;
    city: string;
    state: string;
    pin: string;
    country: string;
    drug_license: string;
    gender: number | null;
}

interface NewDoctorModalProps {
    isOpen: boolean,
    onClose(): void,
    onSubmit(data: DoctorData): void,
}

const initialDoctorState: DoctorData = {
    name: "",
    email: "",
    phone: "",
    branch: "",
    address: "",
    city: "",
    state: "",
    pin: "",
    country: "India",
    drug_license: "",
    gender: null,
}

// Styling Constants
const MODAL_STYLE = {
    position: 'absolute' as 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    boxShadow: 24,
    padding: 3,
    overflowY: 'hidden' as const,
};

const MODAL_WIDTH = 700;
const MODAL_HEIGHT = 500;
const MODAL_BORDER_RADIUS = '12px';
const INPUT_BORDER_RADIUS = '11px';
const PRIMARY_COLOR = '#5C17E5';

// Modal Container Style
const style = {
    ...MODAL_STYLE,
    width: MODAL_WIDTH,
    maxHeight: '90vh',
    minHeight: MODAL_HEIGHT,
    bgcolor: 'background.paper',
    borderRadius: MODAL_BORDER_RADIUS,
    border: '1px solid',
    borderColor: 'divider',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    p: 3,
};

// Input Field Style
const inputStyle = {
    '& .MuiOutlinedInput-root': {
        borderRadius: INPUT_BORDER_RADIUS,
        '& .MuiInputBase-input': {
            color: '#000000',
            fontSize: '14px',
            fontWeight: 400,
            fontFamily: "'Lexend', sans-serif",
        },
        '& .MuiOutlinedInput-notchedOutline': {
            borderColor: '#B0B7C3',
            borderWidth: '1px',
        },
        '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: '#B0B7C3',
            borderWidth: '1px',
        },
        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: '#B0B7C3',
            borderWidth: '1px',
        },
    },
    '& .MuiInputLabel-root': {
        color: '#B0B7C3',
        fontSize: '14px',
        '&.Mui-focused': {
            color: '#000000',
        },
        '&.MuiInputLabel-shrink': {
            color: '#000000',
        }
    },
};

// Select Dropdown Style
const selectStyle = {
    borderRadius: INPUT_BORDER_RADIUS,
    fontSize: '14px',
    fontFamily: "'Lexend', sans-serif",
    color: '#000000',
    '& .MuiOutlinedInput-notchedOutline': {
        borderColor: '#B0B7C3',
    },
    '&:hover .MuiOutlinedInput-notchedOutline': {
        borderColor: '#B0B7C3',
    },
    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
        borderColor: '#B0B7C3',
    },
    '& .MuiSelect-icon': {
        color: '#000000',
    },
};


const NewDoctorModal: React.FC<NewDoctorModalProps> = ({ isOpen, onClose, onSubmit }) => {
    const [doctorData, setDoctorData] = useState<DoctorData>(initialDoctorState);
    const [errorMessage, setErrorMessage] = useState<string>('');

    // Reset form when modal closes
    useEffect(() => {
        if (!isOpen) {
            setDoctorData(initialDoctorState);
            setErrorMessage('');
        }
    }, [isOpen]);

    const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setDoctorData(prev => ({ ...prev, [name]: value }));
    };

    const handleGenderChange = (e: any) => {
        const { value } = e.target;
        setDoctorData(prev => ({ ...prev, gender: value === '' ? null : Number(value) }));
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setErrorMessage('');

        if (!doctorData.name || !doctorData.name.trim()) {
            setErrorMessage('Please fill in the following required fields: Name');
            return;
        }

        try {
            await onSubmit(doctorData);
        } catch (error) {
            setErrorMessage(error instanceof Error ? error.message : 'Failed to add doctor. Please try again.');
        }
    };

    return (
        <Modal
            open={isOpen}
            onClose={onClose}
            aria-labelledby="new-doctor-modal-title"
            sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backdropFilter: 'blur(8px)',
                backgroundColor: 'rgba(0, 0, 0, 0.1)',
            }}
        >
            <Box sx={style} component="form" onSubmit={handleSubmit}>
                {/* Header */}
                <Box sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    borderBottom: '1px solid #e2e8f0',
                    pb: 1.5,
                    mb: 1
                }}>
                    <Box>
                        <Typography
                            id="new-doctor-modal-title"
                            variant="h5"
                            component="h2"
                            sx={{
                                fontFamily: "'Lexend', sans-serif",
                                fontWeight: 600,
                                fontSize: '22px',
                                color: '#1a202c',
                                margin: 0,
                                mb: 0.5,
                            }}
                        >
                            New Doctor
                        </Typography>
                        <Typography
                            variant="body2"
                            sx={{
                                color: '#718096',
                                fontSize: '14px',
                                fontFamily: "'Lexend', sans-serif",
                            }}
                        >
                            Enter the doctor details below to create a new profile.
                        </Typography>
                    </Box>
                    <IconButton
                        aria-label="close"
                        onClick={onClose}
                        sx={{
                            color: '#718096',
                            backgroundColor: '#f7fafc',
                            borderRadius: '8px',
                            width: '32px',
                            height: '32px',
                            '&:hover': {
                                backgroundColor: '#edf2f7',
                                color: '#2d3748',
                            }
                        }}
                    >
                        <CloseIcon fontSize="small" />
                    </IconButton>
                </Box>

                {/* Content Area */}
                <Box sx={{ flex: 1, overflow: 'auto', px: 1 }}>
                    {errorMessage && (
                        <Alert
                            severity="error"
                            sx={{
                                mb: 2,
                                borderRadius: '8px',
                                '& .MuiAlert-message': {
                                    fontFamily: "'Lexend', sans-serif",
                                    fontSize: '14px',
                                }
                            }}
                            onClose={() => setErrorMessage('')}
                        >
                            {errorMessage}
                        </Alert>
                    )}
                    <Grid container spacing={5}>
                        {/* Left Section: Doctor details */}
                        <Grid item xs={12} md={6}>
                            <Typography sx={{ fontSize: '14px', fontWeight: 500, mb: 3 }}>
                                Doctor details
                            </Typography>
                            <Stack spacing={3}>
                                <TextField
                                    fullWidth
                                    variant="outlined"
                                    placeholder="Name *"
                                    name="name"
                                    value={doctorData.name}
                                    onChange={handleInputChange}
                                    sx={inputStyle}
                                />
                                <TextField
                                    fullWidth
                                    variant="outlined"
                                    placeholder="Email id"
                                    name="email"
                                    type="email"
                                    value={doctorData.email}
                                    onChange={handleInputChange}
                                    sx={inputStyle}
                                />
                                <TextField
                                    fullWidth
                                    variant="outlined"
                                    placeholder="Phone number"
                                    name="phone"
                                    value={doctorData.phone}
                                    onChange={handleInputChange}
                                    sx={inputStyle}
                                />
                                <TextField
                                    fullWidth
                                    variant="outlined"
                                    placeholder="Branch"
                                    name="branch"
                                    value={doctorData.branch}
                                    onChange={handleInputChange}
                                    sx={inputStyle}
                                />
                                <FormControl fullWidth sx={inputStyle}>
                                    <InputLabel
                                        id="gender-select-label"
                                        sx={{
                                            color: '#B0B7C3',
                                            fontSize: '14px',
                                            '&.Mui-focused': {
                                                color: '#000000',
                                            },
                                            '&.MuiInputLabel-shrink': {
                                                color: '#000000',
                                            }
                                        }}
                                    >
                                        Gender
                                    </InputLabel>
                                    <Select
                                        labelId="gender-select-label"
                                        id="gender-select"
                                        value={doctorData.gender === null ? '' : doctorData.gender}
                                        label="Gender"
                                        onChange={handleGenderChange}
                                        sx={selectStyle}
                                        MenuProps={{
                                            PaperProps: {
                                                sx: {
                                                    borderRadius: INPUT_BORDER_RADIUS,
                                                    fontFamily: "'Lexend', sans-serif",
                                                    '& .MuiMenuItem-root': {
                                                        fontSize: '14px',
                                                        fontFamily: "'Lexend', sans-serif",
                                                        '&:hover': {
                                                            backgroundColor: '#f5f5f5',
                                                        },
                                                        '&.Mui-selected': {
                                                            backgroundColor: PRIMARY_COLOR + '15',
                                                            color: PRIMARY_COLOR,
                                                            '&:hover': {
                                                                backgroundColor: PRIMARY_COLOR + '25',
                                                            },
                                                        },
                                                    },
                                                },
                                            },
                                        }}
                                    >
                                        {MASTER_GENDER_OPTIONS.map((opt) => (
                                            <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Stack>
                        </Grid>

                        {/* Right Section: Address & registration details */}
                        <Grid item xs={12} md={6}>
                            <Typography sx={{ fontSize: '14px', fontWeight: 500, mb: 3 }}>
                                Address & registration
                            </Typography>
                            <Stack spacing={3}>
                                <TextField
                                    fullWidth
                                    variant="outlined"
                                    placeholder="Address"
                                    name="address"
                                    value={doctorData.address}
                                    onChange={handleInputChange}
                                    sx={inputStyle}
                                />
                                <TextField
                                    fullWidth
                                    variant="outlined"
                                    placeholder="City"
                                    name="city"
                                    value={doctorData.city}
                                    onChange={handleInputChange}
                                    sx={inputStyle}
                                />
                                <TextField
                                    fullWidth
                                    variant="outlined"
                                    placeholder="State"
                                    name="state"
                                    value={doctorData.state}
                                    onChange={handleInputChange}
                                    sx={inputStyle}
                                />
                                <TextField
                                    fullWidth
                                    variant="outlined"
                                    placeholder="PIN"
                                    name="pin"
                                    value={doctorData.pin}
                                    onChange={handleInputChange}
                                    sx={inputStyle}
                                />
                                <TextField
                                    fullWidth
                                    variant="outlined"
                                    placeholder="Country"
                                    name="country"
                                    value={doctorData.country}
                                    onChange={handleInputChange}
                                    sx={inputStyle}
                                />
                                <TextField
                                    fullWidth
                                    variant="outlined"
                                    placeholder="License"
                                    name="drug_license"
                                    value={doctorData.drug_license}
                                    onChange={handleInputChange}
                                    sx={inputStyle}
                                />
                            </Stack>
                        </Grid>
                    </Grid>
                </Box>

                {/* Action Buttons */}
                <Box sx={{
                    display: 'flex',
                    justifyContent: 'flex-end',
                    gap: '12px',
                    pt: 2,
                    borderTop: '1px solid #e2e8f0',
                    mt: 'auto'
                }}>
                    <StandardButton
                        onClick={onClose}
                        variant="secondary"
                        size="medium"
                    >
                        Cancel
                    </StandardButton>
                    <StandardButton
                        type="submit"
                        variant="primary"
                        size="medium"
                    >
                        Add
                    </StandardButton>
                </Box>
            </Box>
        </Modal>
    );
};

export default NewDoctorModal;
