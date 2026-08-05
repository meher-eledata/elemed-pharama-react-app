import React, { RefObject } from "react";
import { Box, Typography, IconButton } from "@mui/material";
import UploadIcon from "@mui/icons-material/Upload";
import CloseIcon from "@mui/icons-material/Close";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import { orderLabels } from "../../../config/label/OrderDetail.labels";
import { orderDetailsStyles } from "../styles";

interface InvoiceUploadSectionProps {
  invoiceFile: File | null;
  invoiceFileName: string;
  invoiceAttachmentUrl: string;
  isExistingFile: boolean;
  fileInputRef: RefObject<HTMLInputElement | null>;
  handleFileChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  handleRemoveFile: () => void;
}

const InvoiceUploadSection: React.FC<InvoiceUploadSectionProps> = ({
  invoiceFile,
  invoiceFileName,
  invoiceAttachmentUrl,
  isExistingFile,
  fileInputRef,
  handleFileChange,
  handleRemoveFile,
}) => {
  const isImage = invoiceFile?.type?.startsWith('image/') || 
    (invoiceAttachmentUrl && (invoiceAttachmentUrl.startsWith('data:image/') || /\.(jpg|jpeg|png|gif|webp)$/i.test(invoiceAttachmentUrl)));

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: "4px", width: "274px" }}>
      <Typography sx={orderDetailsStyles.labelText}>
        {orderLabels.invoiceAttachment || "Invoice Attachment"}
      </Typography>
      
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*,.pdf,.doc,.docx"
        style={{ display: 'none' }}
      />

      {invoiceFile || invoiceAttachmentUrl ? (
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            padding: "8px 12px",
            borderRadius: "12px",
            border: "1px solid #D1D5DB",
            backgroundColor: "#F9FAFB",
          }}
        >
          {isImage && invoiceAttachmentUrl ? (
            <a
              href={invoiceAttachmentUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{ display: 'inline-block' }}
            >
              <img
                src={invoiceAttachmentUrl}
                alt="Invoice preview"
                style={{
                  maxWidth: '60px',
                  maxHeight: '40px',
                  objectFit: 'contain',
                  borderRadius: '4px',
                }}
              />
            </a>
          ) : null}
          
          <Box sx={{ flex: 1, overflow: 'hidden' }}>
            <Typography
              sx={{
                fontSize: '13px',
                color: '#374151',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {invoiceFileName || 'Uploaded file'}
            </Typography>
            {isExistingFile && (
              <Typography sx={{ fontSize: '11px', color: '#9CA3AF' }}>
                Existing file
              </Typography>
            )}
          </Box>

          <IconButton
            size="small"
            onClick={handleRemoveFile}
            sx={{
              padding: '4px',
              color: '#6B7280',
              '&:hover': { backgroundColor: 'transparent', color: '#EF4444' }
            }}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>
      ) : (
        <Box sx={{ display: "flex", flexDirection: "column", gap: "4px" }}>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: "4px",
              alignSelf: "flex-end",
            }}
          >
            <AutoAwesomeIcon sx={{ color: "#5C17E5", fontSize: "13px" }} />
            <Typography
              sx={{
                fontFamily: "'Lexend', sans-serif",
                fontSize: "11px",
                fontWeight: 500,
                letterSpacing: "0.2px",
                color: "#5C17E5",
              }}
            >
              Elemed AI
            </Typography>
          </Box>

          <Box
            onClick={() => fileInputRef.current?.click()}
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              padding: "12px 16px",
              borderRadius: "18px",
              border: "1px dashed #D1D5DB",
              backgroundColor: "#FFFFFF",
              cursor: "pointer",
              transition: "all 0.2s",
              boxShadow: "0 0 0 3px rgba(92, 23, 229, 0.08), 0 0 12px 2px rgba(92, 23, 229, 0.18)",
              animation: "elemedAiGlow 2.8s ease-in-out infinite",
              "@keyframes elemedAiGlow": {
                "0%, 100%": {
                  boxShadow: "0 0 0 3px rgba(92, 23, 229, 0.08), 0 0 10px 2px rgba(92, 23, 229, 0.15)",
                },
                "50%": {
                  boxShadow: "0 0 0 4px rgba(92, 23, 229, 0.12), 0 0 16px 4px rgba(92, 23, 229, 0.28)",
                },
              },
              "&:hover": {
                borderColor: "#5C17E5",
                backgroundColor: "#F3E8FF",
                boxShadow: "0 0 0 4px rgba(92, 23, 229, 0.14), 0 0 18px 5px rgba(92, 23, 229, 0.32)",
                animation: "none",
              },
            }}
          >
            <UploadIcon sx={{ color: '#9CA3AF', fontSize: '20px' }} />
            <Typography
              sx={{
                fontFamily: "'Lexend', sans-serif",
                fontSize: "14px",
                color: "#728197",
              }}
            >
              Upload Invoice
            </Typography>
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default InvoiceUploadSection;
