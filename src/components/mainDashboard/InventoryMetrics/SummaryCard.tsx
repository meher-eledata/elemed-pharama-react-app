import React from "react";
import { Card, CardContent, Typography, Box, Link } from "@mui/material";
import TrendUpIcon from "../../../assets/trend-up.svg";
import TrendDownIcon from "../../../assets/trend-down.svg";
import { SUMMARY_CARD_CONSTANTS } from "../../../config/constants/SummaryCard.constants";
import { SUMMARY_CARD_LABELS } from "../../../config/label/SummaryCard.labels";

interface SummaryCardProps {
  title: string;
  value?: number | string;
  content?: string;
  trend?: {
    percentage: number | null;
    direction: "up" | "down" | null;
  };
  actionText?: string;
  icon?: React.ReactNode;
  onActionClick?: () => void;
  disabled?: boolean;
}

const SummaryCard: React.FC<SummaryCardProps> = ({
  title,
  value,
  content,
  trend,
  actionText,
  icon,
  onActionClick,
  disabled = false,
}) => {
  return (
    <Card
      sx={{
        flex: 1,
        borderRadius: SUMMARY_CARD_CONSTANTS.BORDER_RADIUS,
        mt: 0,
        border: `1px solid ${SUMMARY_CARD_CONSTANTS.BORDER_COLOR}`,
        fontFamily: "Plus Jakarta Sans",
      }}
    >
      <CardContent>
        {/* Title */}
        <Typography
          variant="h6"
          gutterBottom
          sx={{
            fontFamily: SUMMARY_CARD_CONSTANTS.TITLE.FONT_FAMILY,
            fontWeight: SUMMARY_CARD_CONSTANTS.TITLE.FONT_WEIGHT,
            color: SUMMARY_CARD_CONSTANTS.TITLE.COLOR,
            size: SUMMARY_CARD_CONSTANTS.TITLE.SIZE,
          }}
        >
          {title}
        </Typography>

        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box display="flex" alignItems="center">
            {(value || content) && (
              <Typography
                variant="h4"
                sx={{
                  fontFamily: SUMMARY_CARD_CONSTANTS.VALUE.FONT_FAMILY,
                  fontWeight: SUMMARY_CARD_CONSTANTS.VALUE.FONT_WEIGHT,
                  fontSize: SUMMARY_CARD_CONSTANTS.VALUE.FONT_SIZE,
                }}
              >
                {value ?? content}
              </Typography>
            )}

            {/* Trend */}
            {trend && typeof trend.percentage === "number" && (
              <Box display="flex" alignItems="center" mt={1} ml={1}>
                {trend.direction === "up" ? (
                  <img
                    src={TrendUpIcon}
                    alt={SUMMARY_CARD_LABELS.TREND_UP_ALT}
                    width={SUMMARY_CARD_CONSTANTS.TREND.ICON_SIZE}
                    height={SUMMARY_CARD_CONSTANTS.TREND.ICON_SIZE}
                  />
                ) : (
                  <img
                    src={TrendDownIcon}
                    alt={SUMMARY_CARD_LABELS.TREND_DOWN_ALT}
                    width={SUMMARY_CARD_CONSTANTS.TREND.ICON_SIZE}
                    height={SUMMARY_CARD_CONSTANTS.TREND.ICON_SIZE}
                  />
                )}
                <Typography
                  variant="body2"
                  sx={{ ml: 0.5 }}
                  color={
                    trend.direction === "up"
                      ? SUMMARY_CARD_CONSTANTS.TREND.UP_COLOR
                      : SUMMARY_CARD_CONSTANTS.TREND.DOWN_COLOR
                  }
                >
                  {trend.percentage}%
                </Typography>
              </Box>
            )}

            {/* Action */}
            {actionText && (
              <Link
                component="button"
                underline="hover"
                onClick={!disabled ? onActionClick : undefined}
                sx={{
                  mt: 1,
                  ml: 2,
                  display: "inline-block",
                  fontFamily: SUMMARY_CARD_CONSTANTS.ACTION.FONT_FAMILY,
                  color: disabled
                    ? SUMMARY_CARD_CONSTANTS.ACTION.DISABLED_COLOR
                    : SUMMARY_CARD_CONSTANTS.ACTION.ENABLED_COLOR,
                  pointerEvents: disabled ? "none" : "auto",
                  cursor: disabled ? "not-allowed" : "pointer",
                }}
              >
                {actionText}
              </Link>
            )}
          </Box>

          {icon && <Box sx={{ height: "32px", width: "32px" }}>{icon}</Box>}
        </Box>
      </CardContent>
    </Card>
  );
};

export default SummaryCard;