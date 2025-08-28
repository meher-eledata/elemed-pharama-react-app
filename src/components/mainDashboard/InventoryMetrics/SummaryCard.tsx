
import React from "react";
import { Card, CardContent, Typography, Box, Link } from "@mui/material";
import TrendUpIcon from "../../../assets/trend-up.svg";
import TrendDownIcon from "../../../assets/trend-down.svg";

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
  onActionClick?: () => void; // 👈 added for modal open
}

const SummaryCard: React.FC<SummaryCardProps> = ({
  title,
  value,
  content,
  trend,
  actionText,
  icon,
  onActionClick,
}) => {
  return (
    <Card
      sx={{
        flex: 1,
        borderRadius: '24px',
        mt:0,
        border: "1px solid #CBD5E1",
        fontFamily: "Plus Jakarta Sans",
      }}
    >
      <CardContent>
        {/* Title */}
        <Typography
          variant="h6"
          gutterBottom
          sx={{
            fontFamily: "lexend",
            fontWeight: "500",
            color: "#475569",
            size: "18px",
          }}
        >
          {title}
        </Typography>

        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box display="flex" alignItems="center">
            {(value || content) && (
              <Typography variant="h4" sx={{ fontWeight: "400" ,fontFamily:'lexend',fontSize:'32px'}}>
                {value ?? content}
              </Typography>
            )}

            {/* Trend */}
            {trend && typeof trend.percentage === "number" && (
              <Box display="flex" alignItems="center"  mt={1} ml={1}>
                {trend.direction === "up" ? (
                  <img src={TrendUpIcon} alt="trend up" width={16} height={16} />
                ) : (
                  <img
                    src={TrendDownIcon}
                    alt="trend down"
                    width={16}
                    height={16}
                  />
                )}
                <Typography
                  variant="body2"
                  sx={{ ml: 0.5 }}
                  color={trend.direction === "up" ? "green" : "red"}
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
                onClick={onActionClick}
                sx={{
                  mt: 1,
                  ml: 2,
                  display: "inline-block",
                  fontFamily: "lexend",
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
