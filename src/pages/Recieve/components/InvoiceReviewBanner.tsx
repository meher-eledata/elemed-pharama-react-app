import React from "react";
import {
  Alert,
  AlertTitle,
  Box,
  Chip,
  List,
  ListItemButton,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
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
  onAddNewProduct: () => void;
  onDismiss: () => void;
}

const FONT = "'Lexend', sans-serif";

// A blank / low-confidence field rendered as a warning chip. Supplier near-matches
// stay as quick-pick chips (product matches use the aligned list below instead).
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

// Product candidates as a vertical, column-aligned list — NAME | muted (type · brand)
// | right-aligned score% — so same-named products (e.g. Injection vs Nasal Spray) are
// distinguishable. Always ends with an "+ Add new product…" row.
const ProductCandidateList: React.FC<{
  candidates: ExtractInvoiceCandidate[];
  onPick: (c: ExtractInvoiceCandidate) => void;
  onAddNewProduct: () => void;
}> = ({ candidates, onPick, onAddNewProduct }) => {
  const rowSx = {
    display: "grid",
    gridTemplateColumns: "minmax(90px, auto) 1fr auto",
    alignItems: "center",
    gap: "12px",
    borderRadius: "8px",
    px: "10px",
    py: "5px",
    minHeight: "unset",
  };
  return (
    <List disablePadding sx={{ mt: "4px", display: "flex", flexDirection: "column", gap: "2px" }}>
      {candidates.map((c) => {
        const meta = [c.type, c.brand_name]
          .filter((v) => v && String(v).trim() !== "")
          .join(" · ");
        return (
          <ListItemButton
            key={c.id}
            onClick={() => onPick(c)}
            sx={{ ...rowSx, "&:hover": { backgroundColor: "#F3E8FF" } }}
          >
            <Typography sx={{ fontFamily: FONT, fontSize: "13px", fontWeight: 500, color: "#1A212B" }}>
              {c.name}
            </Typography>
            <Typography
              sx={{
                fontFamily: FONT,
                fontSize: "12px",
                color: "#9CA3AF",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {meta}
            </Typography>
            <Typography sx={{ fontFamily: FONT, fontSize: "12px", fontWeight: 600, color: "#5C17E5" }}>
              {Math.round(c.score * 100)}%
            </Typography>
          </ListItemButton>
        );
      })}
      <ListItemButton
        onClick={onAddNewProduct}
        sx={{
          ...rowSx,
          gridTemplateColumns: "auto",
          color: "#5C17E5",
          "&:hover": { backgroundColor: "#F3E8FF" },
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: "4px" }}>
          <AddIcon sx={{ fontSize: "16px" }} />
          <Typography sx={{ fontFamily: FONT, fontSize: "13px", fontWeight: 500 }}>
            {INVOICE_EXTRACTION.ADD_NEW_PRODUCT.replace(/^\+\s*/, "")}
          </Typography>
        </Box>
      </ListItemButton>
    </List>
  );
};

const InvoiceReviewBanner: React.FC<InvoiceReviewBannerProps> = ({
  review,
  onSupplierCandidate,
  onProductCandidate,
  onAddNewProduct,
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
            {line.fields.map((item) =>
              item.path === "product" ? (
                <Box key={item.path}>
                  <FieldItem item={item} />
                  <Typography sx={{ fontFamily: FONT, fontSize: "12px", color: "#6B7280", mt: "6px" }}>
                    {INVOICE_EXTRACTION.PRODUCT_PICK}
                  </Typography>
                  <ProductCandidateList
                    candidates={item.candidates}
                    onPick={(c) => onProductCandidate(line.rowId, c)}
                    onAddNewProduct={onAddNewProduct}
                  />
                </Box>
              ) : (
                <FieldItem key={item.path} item={item} />
              )
            )}
          </Box>
        </Box>
      ))}
    </Alert>
  );
};

export default InvoiceReviewBanner;
