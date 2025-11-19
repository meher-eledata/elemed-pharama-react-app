import React from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Box,
    Typography,
} from '@mui/material';

import {StandardButton } from '../../Common';

interface PasswordLinkConfirmationDialogProps{
    open:boolean,
    onClose:()=>void,
    onConfirm:()=>void,
    isLoading?: boolean
}

const PasswordLinkConfirmationDialog:React.FC<PasswordLinkConfirmationDialogProps>=({
    open,
    onClose,
    onConfirm,
    isLoading = false,
})=>{

    return(
        <Dialog
        open={open}
        onClose={isLoading ? undefined : onClose}
        PaperProps={{
            sx:{
                borderRadius:'12px',
                border:'1px solid #E0E0E0',
                backgroundColor:'#FFFFFF',
                padding:0,
                maxWidth:'500px',
                width:'90%',
                boxShadow:'0px 10px 40px rgba(0, 0, 0, 0.15)',
                    },
        }}
        aria-labelledby="password-link-dialog-title"
        >
            <DialogTitle
            id="password-link-dialog-title"
            sx={{
                fontSize:'20px',
                fontWeight:700,
                color:'#1A212B',
                padding:'24px 24px 0 24px',
                fontFamily: "'Lexend', sans-serif",
            }}
            >
            Confirm User Regsiatration 
            </DialogTitle>

            <DialogContent sx={{padding: '0 24px 24px 24px'}}>
            <Box 
            sx={{backGroundColor:'#ECEFF4',
                borderRadius:'12px',
                padding:'20px',
                textAlign:'center',
            }}
            >
                <Typography
                sx={{fontSize:'15px,',
                    color:'#374151',
                     lineHeight:1.7,
                    fontWeight:500,
                fontFamily: "'Lexend', sans-serif"          
             }}
             >
             A link to create a password will be sent to the registered email addres
             </Typography>
             </Box>
             </DialogContent>

             <DialogActions
             sx={{
                padding:'16pxc 24px 24px 24px',
                display:'flex',
                gap:'12px',
                justifyContent:'flex-end',
}}>

<StandardButton
onClick={onClose}
variant="secondary"
size="medium"
disabled={isLoading}
sx={{
    minWidth:'100px',
    borderRadius:'10px',
    textTransform:'none',

}}>
    Cancel
    </StandardButton>
    <StandardButton
    onClick={onConfirm}
    variant="primary"
    size="medium"
    disabled={isLoading}
    sx={{
        minWidth:'100px',
        borderRadius:'8px',
        textTransform:'none',

    }}>
        {isLoading ? 'Creating...' : 'Ok'}
        </StandardButton>
        </DialogActions>
        </Dialog>
    );
};

export default PasswordLinkConfirmationDialog;