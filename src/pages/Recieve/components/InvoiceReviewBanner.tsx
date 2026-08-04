import React from "react";
import { Alert, AlertTitle, Box, Chip, Typography } from "@mui/material";
import { ExtractInvoiceCandidate } from "../../../redux/slices/receiveApi";
import { INVOICE_EXTRACTION } from "../../../config/constants/OrderReceive.constants";
import {
  InvoiceReview,
  InvoiceReviewFieldItem,
} from "../hooks/useInvoiceExtraction";

interface InvoiceReviewBannerProps {
  review: InvoiceReview;
  onSupplierCandidate: (c: ExtractInvoiceCandidate) => void;
  onProductCandidate: (rowId: string, c: ExtractInvoiceCandidate) => void;
  onDismiss: () => void;
}

const FONT = "'Lexend', sans-serif";

// A blank / low-confidence field rendered as a warning chip. Where the extractor
// returned near-matches (supplier / product) they are offered as quick-pick chips.
const FieldItem: React.FC<{
  item: InvoiceReviewFieldItem;
  pickLabel?: string;
  onPick?: (c: ExtractInvoiceCandidate) => void;
}> = ({ item, pickLabel, onPick }) => (
  <Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "8px" }}>
    <Chip
      label={item.label}
      size="small"
      sx={{
        fontFamily: FONT,
        fontSize: "12px",
        fontWeight: 500,
        color: "#92400E",
        backgroundColor: "#FEF3C7",
        border: "1px solid #FDE68A",
        borderRadius: "8px",
      }}
    />
    {onPick && item.candidates.length > 0 && (
      <>
        <Typography sx={{ fontFamily: FONT, fontSize: "12px", color: "#6B7280" }}>
          {pickLabel}
        </Typography>
        {item.candidates.map((c) => (
          <Chip
            key={c.id}
            label={`${c.name} (${Math.round(c.score * 100)}%)`}
            size="small"
            clickable
            onClick={() => onPick(c)}
            sx={{
              fontFamily: FONT,
              fontSize: "12px",
              color: "#5C17E5",
              backgroundColor: "#F3E8FF",
              border: "1px solid #E4D4FF",
              borderRadius: "8px",
              "&:hover": { backgroundColor: "#E9D5FF" },
            }}
          />
        ))}
      </>
    )}
  </Box>
);

const InvoiceReviewBanner: React.FC<InvoiceReviewBannerProps> = ({
  review,
  onSupplierCandidate,
  onProductCandidate,
  onDismiss,
}) => {
  if (review.count === 0) return null;

  return (
    <Alert
      severity="warning"
      onClose={onDismiss}
      sx={{
        mt: 2,
        borderRadius: "12px",
        fontFamily: FONT,
        "& .MuiAlert-message": { width: "100%" },
      }}
    >
      <AlertTitle sx={{ fontFamily: FONT, fontWeight: 600 }}>
        {INVOICE_EXTRACTION.reviewTitle(review.count)}
      </AlertTitle>
      <Typography sx={{ fontFamily: FONT, fontSize: "13px", color: "#6B7280", mb: 1.5 }}>
        {INVOICE_EXTRACTION.REVIEW_SUBTITLE}
      </Typography>

      {review.header.length > 0 && (
        <Box sx={{ display: "flex", flexDirection: "column", gap: "8px", mb: review.lines.length ? 1.5 : 0 }}>
          {review.header.map((item) => (
            <FieldItem
              key={item.path}
              item={item}
              pickLabel={INVOICE_EXTRACTION.SUPPLIER_PICK}
              onPick={item.path === "header.supplier" ? onSupplierCandidate : undefined}
            />
          ))}
        </Box>
      )}

      {review.lines.map((line) => (
        <Box key={line.rowId} sx={{ mb: 1 }}>
          <Typography sx={{ fontFamily: FONT, fontSize: "12px", fontWeight: 600, color: "#374151", mb: "4px" }}>
            {INVOICE_EXTRACTION.lineLabel(line.index + 1)} — {line.label}
          </Typography>
          <Box sx={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            {line.fields.map((item) => (
              <FieldItem
                key={item.path}
                item={item}
                pickLabel={INVOICE_EXTRACTION.PRODUCT_PICK}
                onPick={
                  item.path === "product"
                    ? (c) => onProductCandidate(line.rowId, c)
                    : undefined
                }
              />
            ))}
          </Box>
        </Box>
      ))}
    </Alert>
  );
};

export default InvoiceReviewBanner;
