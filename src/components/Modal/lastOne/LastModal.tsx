// import React from 'react';
// import { 
//   Modal, 
//   Box, 
//   Typography, 
//   TextField, 
//   Button, 
//   IconButton,
//   Divider
// } from '@mui/material';
// import { styled } from '@mui/material/styles';
// import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
// import CloseIcon from '@mui/icons-material/Close';
// import { PharmaTableRow } from "../../../pages/Recieve/OrderDetails"; // Add this line


// const DEFAULT_PRODUCT_NAME = 'Paracetamol GSTIN:76788...';
// const DEFAULT_GSTIN_CODE = '1348907689999';
// const DEFAULT_HSN_CODE = '1348907689999';
// const DEFAULT_DISCOUNT_PERCENTAGE = 60;
// const DEFAULT_AVAILABLE_ITEMS = 214;
// const PRODUCT_DETAIL_VALUE = '1 Unit is equal to 15';

// const MODAL_TITLE = 'Receive Supplier';
// const PRODUCT_NAME_LABEL = 'Product Name';
// const CANCEL_BUTTON_LABEL = 'Cancel';
// const DONE_BUTTON_LABEL = 'Done';
// const INPUT_PLACEHOLDER = 'P';

// const PRODUCT_INFO_LABELS = {
//   OVER_STOCK: 'Total Over Stock',
//   HSN_CODE: 'HSN Code',
//   DISCOUNT_PERCENTAGE: 'Disc %',
//   ITEMS_AVAILABLE: 'Items Available',
// };

// const TABLE_HEADERS = [
//   'Qty Received',
//   'Qty Free',
//   'Batch',
//   'Expiry Date',
//   'PP',
//   'SP',
//   'MRP',
//   'Disc',
//   'Marg %',
//   'Sales Disc %',
// ];


// // Inline SVGs for self-contained component
// const ModalIconSVG = () => (
//   <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
//     <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z" fill="#9CA3AF"/>
//     <path d="M12 11c-.55 0-1 .45-1 1v4c0 .55.45 1 1 1s1-.45 1-1v-4c0-.55-.45-1-1-1zm0-4c-.55 0-1-.45-1-1v-1c0-.55.45-1 1-1s1 .45 1 1v1c0 .55-.45 1-1 1z" fill="#9CA3AF"/>
//   </svg>
// );

// const DiscountBadgeSVG = () => (
//   <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
//     <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zM12 20c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z" fill="#10B981"/>
//     <path d="M12 7l-5 5h3v4h4v-4h3l-5-5z" fill="#ECFDF5"/>
//   </svg>
// );

// const TrendUpSVG = () => (
//   <svg width="12" height="12" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
//     <path d="M12 6L8 2L4 6H6V12H10V6H12z" fill="#22C55E"/>
//   </svg>
// );

// const StyledTextField = styled(TextField)(({ theme }) => ({
//   '& .MuiOutlinedInput-root': {
//     height: '44px', 
//     borderRadius: '12px', 
//     backgroundColor: '#FFFFFF', 
//     boxShadow: '0px 1px 2px rgba(0, 0, 0, 0.05)',
//     '& fieldset': {
//       borderColor: '#CBD4E1', 
//       borderWidth: '1px', 
//     },
//     '&:hover fieldset': {
//       borderColor: '#9AA8BC',
//     },
//     '&.Mui-focused fieldset': {
//       borderColor: '#5C17E5',
//       borderWidth: '1px',
//     },
//   },

//   '& .MuiInputBase-input': {
//     height: '100%',
//     display: 'flex',
//     alignItems: 'center',
//     justifyContent: 'center',
//     padding: '0 16px', 
//     boxSizing: 'border-box',
//     textAlign: 'center',
//     fontSize: '14px',
//     color: '#111827', 
//   },

//   '& .MuiInputBase-input::placeholder': {
//     color: '#9CA3AF',
//     opacity: 1,
//     textAlign: 'center',
//     fontSize: '14px',
//   },
// }));

// interface LastModalProps {
//   open: boolean;
//   onClose: () => void;
//   productName?: string;
//   gstinCode?: string;
//   hsnCode?: string;
//   discountPercentage?: number;
//   availableItems?: number;
//   onSave: (newProduct: PharmaTableRow) => void;

// }

// const LastModal: React.FC<LastModalProps> = ({ 
//   open, 
//   onClose, 
//   productName = DEFAULT_PRODUCT_NAME, 
//   gstinCode = DEFAULT_GSTIN_CODE, 
//   hsnCode = DEFAULT_HSN_CODE, 
//   discountPercentage = DEFAULT_DISCOUNT_PERCENTAGE,
//   availableItems = DEFAULT_AVAILABLE_ITEMS
// }) => {
//   const modalContentStyle = {
//     position: 'absolute' as 'absolute',
//     top: '50%',
//     left: '50%',
//     transform: 'translate(-50%, -50%)',
//     width: '90%',
//     maxWidth: 1200,
//     bgcolor: 'white',
//     borderRadius: '16px',
//     boxShadow: '0px 10px 15px -3px rgba(0, 0, 0, 0.1), 0px 4px 6px -2px rgba(0, 0, 0, 0.05)',
//     p: 3,
//     outline: 'none',
//   };

//   const productDetailItemStyle = {
//     display: 'flex',
//     flexDirection: 'column',
//     alignItems: 'center',
//     justifyContent: 'center',
//     textAlign: 'center',
//     px: 2,
//   };

//   return (
//     <Modal
//       open={open}
//       onClose={onClose}
//       aria-labelledby="receive-supplier-modal-title"
//     >
//       <Box sx={modalContentStyle}>
//         {/* Modal Header */}
//         <Box sx={{ 
//           display: 'flex', 
//           justifyContent: 'space-between', 
//           alignItems: 'center', 
//           mb: 2,
//           pb: 2,
//         }}>
//           <Typography
//             id="receive-supplier-modal-title"
//             sx={{
//               fontSize: '18px',
//               color: '#111827', 
//             }}
//           >
//             {MODAL_TITLE}
//           </Typography>
//           <IconButton onClick={onClose} size="small">
//             <CloseIcon />
//           </IconButton>
//         </Box>

//         {/* Product Name */}
//         <Typography sx={{ 
//           fontSize: '14px', 
//           color: '#6B7280',
//           mb: 0.25,
//           fontWeight: 500
//         }}>
//           {PRODUCT_NAME_LABEL}
//         </Typography>

//         {/* Product Details Row */}
//         <Box sx={{ 
//           display: 'flex', 
//           alignItems: 'center',
//           borderRadius: '8px',
//         }}>
//           <Box sx={{ 
//             flex: '0 0 360px', 
//             bgcolor: '#F3F4F6', 
//             width:'360px',
//             p: 1.5,
//             borderRadius: '8px'
//           }}>
//             <Typography sx={{ 
//               fontSize: '14px', 
//               color: '#1F2937',
//               fontWeight: 500
//             }}>
//               {productName}
//             </Typography>
//           </Box>

//           <Divider 
//             orientation="vertical" 
//             flexItem 
//             sx={{ borderColor: '#E5E7EB', height: 28, mx: 1, alignSelf: 'center' }}
//           />

//           <Box sx={{ 
//             display: 'flex', 
//             alignItems: 'center',
//             gap: 0,
//             p: 1.5,
//             flex: 1
//           }}>
//             {[
//               { 
//                 key: 'over',
//                 label: PRODUCT_INFO_LABELS.OVER_STOCK, 
//                 value: PRODUCT_DETAIL_VALUE,
//                 labelColor: '#1A212B',
//                 valueColor: '#9AA8BC',
//                 icon: (<Box sx={{
//                   width: 32,
//                   height: 32,
//                   borderRadius: '50%',
//                   backgroundColor: '#F6F8FB',
//                   display: 'flex',
//                   alignItems: 'center',
//                   justifyContent: 'center'
//                 }}>
//                   <ModalIconSVG />
//                 </Box>)
//               },
//               { 
//                 key: 'hsn',
//                 label: PRODUCT_INFO_LABELS.HSN_CODE, 
//                 value: hsnCode,
//                 labelColor: '#1A212B',
//                 valueColor: '#9AA8BC',
//                 icon: (<Box sx={{
//                   width: 32,
//                   height: 32,
//                   borderRadius: '50%',
//                   backgroundColor: '#F6F8FB',
//                   display: 'flex',
//                   alignItems: 'center',
//                   justifyContent: 'center'
//                 }}>
//                   <ModalIconSVG />
//                 </Box>)
//               },
//               { 
//                 key: 'disc',
//                 label: PRODUCT_INFO_LABELS.DISCOUNT_PERCENTAGE, 
//                 value: `${discountPercentage}%`,
//                 labelColor: '#6B7280',
//                 valueColor: '#10B981',
//                 icon: (<DiscountBadgeSVG />)
//               },
//               { 
//                 key: 'items',
//                 label: PRODUCT_INFO_LABELS.ITEMS_AVAILABLE, 
//                 value: `${availableItems} Tabs.`,
//                 labelColor: '#6B7280',
//                 valueColor: '#1A212B',
//                 icon: null
//               }
//             ].map((item, index) => (
//               <React.Fragment key={item.key}>
//                 {item.key === 'disc' ? (
//                   <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: '180px', whiteSpace: 'nowrap' }}>
//                     <DiscountBadgeSVG />
//                     <Typography sx={{ fontSize: '14px', color: '#1A212B', fontWeight: 500 }}>{item.label}</Typography>
//                     <Box sx={{
//                       display: 'inline-flex',
//                       alignItems: 'center',
//                       gap: 0.5,
//                       px: 1.25,
//                       py: 0.25,
//                       borderRadius: '9999px',
//                       border: '1px solid #86EFAC',
//                       backgroundColor: '#ECFDF5'
//                     }}>
//                       <TrendUpSVG />
//                       <Typography sx={{ fontSize: '12px', color: '#22C55E', fontWeight: 600 }}>{item.value}</Typography>
//                     </Box>
//                   </Box>
//                 ) : item.key === 'items' ? (
//                   <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: '160px', whiteSpace: 'nowrap' }}>
//                     <Typography sx={{ fontSize: '12px', color: item.labelColor }}>{item.label}</Typography>
//                     <Typography sx={{ fontSize: '14px', color: item.valueColor, fontWeight: 600 }}>{item.value}</Typography>
//                   </Box>
//                 ) : (
//                   <Box sx={{
//                     display: 'flex',
//                     alignItems: 'center',
//                     gap: 1,
//                     minWidth: '120px',
//                     justifyContent: 'center',
//                     whiteSpace: 'nowrap'
//                   }}>
//                     {item.icon}
//                     <Box sx={productDetailItemStyle}>
//                       <Typography sx={{ fontSize: '12px', color: item.labelColor, mb: 0.5, textAlign: 'center' }}>
//                         {item.label}
//                       </Typography>
//                       <Typography sx={{ fontSize: '14px', color: item.valueColor, fontWeight: 600, textAlign: 'center' }}>
//                         {item.value}
//                       </Typography>
//                     </Box>
//                   </Box>
//                 )}
//                 {index < 3 && <Divider orientation="vertical" flexItem sx={{ borderColor: '#E5E7EB', height: '40px', mx: 1 }} />}
//               </React.Fragment>
//             ))}
//           </Box>
//         </Box>

//         {/* Table-like Input Grid */}
//         <Box sx={{
//           border: '1px solid #E0E7ED',
//           borderRadius: '8px',
//           overflow: 'hidden',
//           mt: 2,
//           mb: 2
//         }}>
//           {/* Table Headers */}
//           <Box sx={{
//             display: 'grid',
//             gridTemplateColumns: 'repeat(10, 1fr)',
//             gap: 1,
//             py: 1,
//             px: 1,
//             alignItems: 'end'
//           }}>
//             {TABLE_HEADERS.map((label, index) => (
//               <Typography 
//                 key={index} 
//                 sx={{
//                   textAlign: index < 2 ? 'right' : 'left',
//                   fontSize: '12px',
//                   lineHeight: '16px',
//                   fontWeight: 500,
//                   color: '#1A212B'
//                 }}
//               >
//                 {label}
//               </Typography>
//             ))}
//           </Box>

//           {/* Divider */}
//           <Box sx={{ 
//             borderTop: '1px solid #E0E7ED', 
//             width: '100%' ,
//             textAlign:'right',
//           }} />

//           {/* Input Fields */}
//           <Box sx={{ 
//             display: 'grid',
//             gridTemplateColumns: 'repeat(10, 1fr)',
//             gap: 1,
//             p: 1,
//             backgroundColor: '#F9FAFB',
//             alignItems: 'center'
//           }}>
//             {TABLE_HEADERS.map((field, index) => (
//               <StyledTextField 
//                 key={index}
//                 fullWidth 
//                 variant="outlined" 
//                 placeholder={INPUT_PLACEHOLDER}
//                 InputProps={field.includes('Expiry Date') ? { 
//                   endAdornment: (
//                     <IconButton size="small" edge="end">
//                       <CalendarTodayIcon fontSize="small" />
//                     </IconButton>
//                   )
//                 } : undefined}
//                 sx={{ '& input': { textAlign: index < 2 ? 'right' : 'left' } }}
//               />
//             ))}
//           </Box>
//         </Box>

//         {/* Action Buttons */}
//         <Box sx={{ 
//           display: 'flex', 
//           justifyContent: 'flex-end', 
//           gap: 1.5,
//           pt: 2,
//           pr: 1,
//           borderTop: '1px solid #E5E7EB'
//         }}>
//           <Button
//             variant="text"
//             onClick={onClose}
//             disableRipple
//             sx={{
//               color: '#6B7280',
//               borderRadius: '12px',
//               px: 3,
//               height: 44,
//               textTransform: 'none',
//               bgcolor: 'transparent',
//               boxShadow: 'none',
//               '&:hover': { bgcolor: 'transparent', boxShadow: 'none' },
//               '&:focus': { bgcolor: 'transparent' },
//               '&:active': { bgcolor: 'transparent' }
//             }}
//           >
//             {CANCEL_BUTTON_LABEL}
//           </Button>
//           <Button
//             variant="contained"
//             sx={{
//               bgcolor: '#4F46E5',
//               color: '#FFFFFF',
//               borderRadius: '12px',
//               px: 3,
//               height: 44,
//               textTransform: 'none',
//               boxShadow: '0px 1px 2px rgba(0, 0, 0, 0.05)',
//               '&:hover': {
//                 bgcolor: '#4338CA',
//                 boxShadow: '0px 1px 2px rgba(0, 0, 0, 0.05)'
//               }
//             }}
//           >
//             {DONE_BUTTON_LABEL}
//           </Button>
//         </Box>
//       </Box>
//     </Modal>
//   );
// };

// export default LastModal;

import React, { useState } from 'react';
import { 
    Modal, 
    Box, 
    Typography, 
    TextField, 
    IconButton,
    Divider
} from '@mui/material';
import { styled } from '@mui/material/styles';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import CloseIcon from '@mui/icons-material/Close';
import { StandardButton } from '../../Common';
import { PharmaTableRow } from "../../../pages/Recieve/OrderDetails";

// Inline SVGs for self-contained component
const ModalIconSVG = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z" fill="#9CA3AF"/>
        <path d="M12 11c-.55 0-1 .45-1 1v4c0 .55.45 1 1 1s1-.45 1-1v-4c0-.55-.45-1-1-1zm0-4c-.55 0-1-.45-1-1v-1c0-.55.45-1 1-1s1 .45 1 1v1c0 .55-.45 1-1 1z" fill="#9CA3AF"/>
    </svg>
);

const DiscountBadgeSVG = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zM12 20c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z" fill="#10B981"/>
        <path d="M12 7l-5 5h3v4h4v-4h3l-5-5z" fill="#ECFDF5"/>
    </svg>
);

const TrendUpSVG = () => (
    <svg width="12" height="12" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 6L8 2L4 6H6V12H10V6H12z" fill="#22C55E"/>
    </svg>
);

const StyledTextField = styled(TextField)(({ theme }) => ({
    '& .MuiOutlinedInput-root': {
        height: '44px', 
        borderRadius: '12px', 
        backgroundColor: '#FFFFFF', 
        boxShadow: '0px 1px 2px rgba(0, 0, 0, 0.05)',
        '& fieldset': {
            borderColor: '#CBD4E1', 
            borderWidth: '1px', 
        },
        '&:hover fieldset': {
            borderColor: '#9AA8BC',
        },
        '&.Mui-focused fieldset': {
            borderColor: '#5C17E5',
            borderWidth: '1px',
        },
    },
    '& .MuiInputBase-input': {
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '0 16px', 
        boxSizing: 'border-box',
        textAlign: 'center',
        fontSize: '14px',
        color: '#111827', 
        '&::-webkit-outer-spin-button, &::-webkit-inner-spin-button': {
            '-webkit-appearance': 'none',
            margin: 0,
        },
        '&[type=number]': {
            '-moz-appearance': 'textfield',
        },
    },
}));

interface LastModalProps {
    open: boolean;
    onClose: () => void;
    onSave: (newProduct: PharmaTableRow) => void;
    productName?: string;
    gstinCode?: string;
    hsnCode?: string;
    discountPercentage?: number;
    availableItems?: number;
}

const LastModal: React.FC<LastModalProps> = ({ 
    open, 
    onClose, 
    onSave,
    productName, 
    gstinCode, 
    hsnCode, 
    discountPercentage,
    availableItems 
}) => {
    const [qtyReceived, setQtyReceived] = useState('');
    const [qtyFree, setQtyFree] = useState('');
    const [batch, setBatch] = useState('');
    const [expiryDate, setExpiryDate] = useState('');
    const [pp, setPp] = useState('');
    const [sp, setSp] = useState('');
    const [mrp, setMrp] = useState('');
    const [disc, setDisc] = useState('');
    const [margPercent, setMargPercent] = useState('');
    const [salesDiscPercent, setSalesDiscPercent] = useState('');
    const [cgst, setCgst] = useState('');
    const [sgst, setSgst] = useState('');
    const [igst, setIgst] = useState('');

    const handleDone = () => {
        const newProduct: PharmaTableRow = {
            productId: productName || 'Unknown Product',
            qtyReceived: Number(qtyReceived),
            qtyFree: Number(qtyFree),
            batch: batch,
            pp: Number(pp),
            sp: Number(sp),
            mrp: Number(mrp),
            disc: disc,
            margPercent: margPercent,
            salesDiscPercent: salesDiscPercent,
            cgst: Number(cgst),
            sgst: Number(sgst),
            igst: Number(igst)
        };
        onSave(newProduct);
        setQtyReceived('');
        setQtyFree('');
        setBatch('');
        setExpiryDate('');
        setPp('');
        setSp('');
        setMrp('');
        setDisc('');
        setMargPercent('');
        setSalesDiscPercent('');
        setCgst('');
        setSgst('');
        setIgst('');
    };

    const modalContentStyle = {
        position: 'absolute' as 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '90%',
        maxWidth: 1200,
        bgcolor: 'white',
        borderRadius: '16px',
        boxShadow: '0px 10px 15px -3px rgba(0, 0, 0, 0.1), 0px 4px 6px -2px rgba(0, 0, 0, 0.05)',
        p: 3,
        outline: 'none',
    };

    const productDetailItemStyle = {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        px: 2,
    };

    const TABLE_HEADERS = [
        'Qty Received',
        'Qty Free',
        'Batch',
        'Expiry Date',
        'PP',
        'SP',
        'MRP',
        'Disc',
        'Marg %',
        'Sales Disc %',
        'CGST',
        'SGST',
        'IGST'
    ];
    
    const fieldMap = {
        'Qty Received': { state: qtyReceived, setState: setQtyReceived, type: 'number', placeholder: 'P' },
        'Qty Free': { state: qtyFree, setState: setQtyFree, type: 'number', placeholder: 'P' },
        'Batch': { state: batch, setState: setBatch, type: 'text', placeholder: 'P' },
        // Change the placeholder for Expiry Date to an empty string
        'Expiry Date': { state: expiryDate, setState: setExpiryDate, type: 'text', placeholder: '' },
        'PP': { state: pp, setState: setPp, type: 'number', placeholder: 'P' },
        'SP': { state: sp, setState: setSp, type: 'number', placeholder: 'P' },
        'MRP': { state: mrp, setState: setMrp, type: 'number', placeholder: 'P' },
        'Disc': { state: disc, setState: setDisc, type: 'number', placeholder: 'P' },
        'Marg %': { state: margPercent, setState: setMargPercent, type: 'number', placeholder: 'P' },
        'Sales Disc %': { state: salesDiscPercent, setState: setSalesDiscPercent, type: 'number', placeholder: 'P' },
        'CGST': { state: cgst, setState: setCgst, type: 'number', placeholder: 'P' },
        'SGST': { state: sgst, setState: setSgst, type: 'number', placeholder: 'P' },
        'IGST': { state: igst, setState: setIgst, type: 'number', placeholder: 'P' },
    };

    return (
        <Modal
            open={open}
            onClose={onClose}
            aria-labelledby="receive-supplier-modal-title"
            sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backdropFilter: 'blur(8px)',
                backgroundColor: 'rgba(0, 0, 0, 0.1)',
            }}
        >
            <Box sx={modalContentStyle}>
                {/* Enhanced Header */}
                <Box sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'space-between',
                    borderBottom: '1px solid #e2e8f0',
                    pb: 1.5,
                    mb: 2,
                }}>
                    <Box>
                        <Typography 
                            id="receive-supplier-modal-title" 
                            sx={{ 
                                fontFamily: 'Lexend, sans-serif',
                                fontWeight: 600,
                                fontSize: '22px',
                                color: '#1a202c',
                                margin: 0,
                                mb: 0.5,
                            }}
                        >
                            Receive Supplier
                        </Typography>
                        <Typography 
                            variant="body2" 
                            sx={{
                                color: '#718096',
                                fontSize: '14px',
                                fontFamily: 'Lexend, sans-serif',
                            }}
                        >
                            Enter product details to receive from supplier.
                        </Typography>
                    </Box>
                    <IconButton 
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

                <Typography sx={{ 
                    fontSize: '14px', 
                    color: '#6B7280',
                    mb: 0.25,
                    fontWeight: 500
                }}>
                    Product Name
                </Typography>

                <Box sx={{ 
                    display: 'flex', 
                    alignItems: 'center',
                    borderRadius: '8px',
                }}>
                    <Box sx={{ 
                        flex: '0 0 360px', 
                        bgcolor: '#F3F4F6', 
                        width:'360px',
                        p: 1.5,
                        borderRadius: '8px'
                    }}>
                        <Typography sx={{ 
                            fontSize: '14px', 
                            color: '#1F2937',
                            fontWeight: 500
                        }}>
                            {productName}
                        </Typography>
                    </Box>

                    <Divider 
                        orientation="vertical" 
                        flexItem 
                        sx={{ borderColor: '#E5E7EB', height: 28, mx: 1, alignSelf: 'center' }}
                    />

                    <Box sx={{ 
                        display: 'flex', 
                        alignItems: 'center',
                        gap: 0,
                        p: 1.5,
                        flex: 1
                    }}>
                        {[
                            { key: 'gstin', label: 'GSTIN', value: gstinCode, labelColor: '#1A212B', valueColor: '#9AA8BC', icon: (<Box sx={{ width: 32, height: 32, borderRadius: '50%', backgroundColor: '#F6F8FB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><ModalIconSVG /></Box>) },
                            { key: 'hsn', label: 'HSN Code', value: hsnCode, labelColor: '#1A212B', valueColor: '#9AA8BC', icon: (<Box sx={{ width: 32, height: 32, borderRadius: '50%', backgroundColor: '#F6F8FB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><ModalIconSVG /></Box>) },
                            { key: 'disc', label: 'Disc %', value: `${discountPercentage}%`, labelColor: '#6B7280', valueColor: '#10B981', icon: (<DiscountBadgeSVG />) },
                            { key: 'items', label: 'Items Available', value: `${availableItems} Tabs.`, labelColor: '#6B7280', valueColor: '#1A212B', icon: null }
                        ].map((item, index) => (
                            <React.Fragment key={item.key}>
                                {item.key === 'disc' ? (
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: '180px', whiteSpace: 'nowrap' }}>
                                        <DiscountBadgeSVG />
                                        <Typography sx={{ fontSize: '14px', color: '#1A212B', fontWeight: 500 }}>{item.label}</Typography>
                                        <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5, px: 1.25, py: 0.25, borderRadius: '9999px', border: '1px solid #86EFAC', backgroundColor: '#ECFDF5' }}>
                                            <TrendUpSVG />
                                            <Typography sx={{ fontSize: '12px', color: '#22C55E', fontWeight: 600 }}>{item.value}</Typography>
                                        </Box>
                                    </Box>
                                ) : item.key === 'items' ? (
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: '160px', whiteSpace: 'nowrap' }}>
                                        <Typography sx={{ fontSize: '12px', color: item.labelColor }}>{item.label}</Typography>
                                        <Typography sx={{ fontSize: '14px', color: item.valueColor, fontWeight: 600 }}>{item.value}</Typography>
                                    </Box>
                                ) : (
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: '120px', justifyContent: 'center', whiteSpace: 'nowrap' }}>
                                        {item.icon}
                                        <Box sx={productDetailItemStyle}>
                                            <Typography sx={{ fontSize: '12px', color: item.labelColor, mb: 0.5, textAlign: 'center' }}>
                                                {item.label}
                                            </Typography>
                                            <Typography sx={{ fontSize: '14px', color: item.valueColor, fontWeight: 600, textAlign: 'center' }}>
                                                {item.value}
                                            </Typography>
                                        </Box>
                                    </Box>
                                )}
                                {index < 3 && <Divider orientation="vertical" flexItem sx={{ borderColor: '#E5E7EB', height: '40px', mx: 1 }} />}
                            </React.Fragment>
                        ))}
                    </Box>
                </Box>

                <Box sx={{ border: '1px solid #E0E7ED', borderRadius: '8px', overflow: 'hidden', mt: 2, mb: 2 }}>
                    <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(13, 1fr)', gap: 1, py: 1, px: 1, alignItems: 'end' }}>
                        {TABLE_HEADERS.map((label, index) => (
                            <Typography 
                                key={index} 
                                sx={{
                                    textAlign: index < 2 ? 'right' : 'left',
                                    fontSize: '12px',
                                    lineHeight: '16px',
                                    fontWeight: 500,
                                    color: '#1A212B'
                                }}
                            >
                                {label}
                            </Typography>
                        ))}
                    </Box>

                    <Box sx={{ borderTop: '1px solid #E0E7ED', width: '100%', textAlign:'right' }} />

                    <Box sx={{ 
                        display: 'grid',
                        gridTemplateColumns: 'repeat(13, 1fr)',
                        gap: 1,
                        p: 1,
                        backgroundColor: '#F9FAFB',
                        alignItems: 'center'
                    }}>
                        {TABLE_HEADERS.map((field, index) => {
                            const stateInfo = fieldMap[field as keyof typeof fieldMap];
                            return (
                                <StyledTextField 
                                    key={field}
                                    fullWidth 
                                    variant="outlined" 
                                    placeholder={stateInfo.placeholder}
                                    type={stateInfo.type}
                                    value={stateInfo.state}
                                    onChange={(e) => stateInfo.setState(e.target.value)}
                                    InputProps={field.includes('Expiry Date') ? { 
                                        endAdornment: (
                                            <IconButton size="small" edge="end">
                                                <CalendarTodayIcon fontSize="small" />
                                            </IconButton>
                                        )
                                    } : undefined}
                                    sx={{ '& input': { textAlign: index < 2 ? 'right' : 'left' } }}
                                />
                            );
                        })}
                    </Box>
                </Box>

                {/* Enhanced Action Buttons */}
                <Box sx={{ 
                    display: 'flex', 
                    justifyContent: 'flex-end', 
                    gap: '12px',
                    pt: 2,
                    borderTop: '1px solid #e2e8f0',
                    mt: 'auto'
                }}>
                    <StandardButton
                        variant="secondary"
                        size="medium"
                        onClick={onClose}
                    >
                        Cancel
                    </StandardButton>
                    <StandardButton
                        variant="primary"
                        size="medium"
                        onClick={handleDone}
                    >
                        Done
                    </StandardButton>
                </Box>
            </Box>
        </Modal>
    );
};

export default LastModal;