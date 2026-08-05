import dayjs from "dayjs";

export const capitalizeFirstLetter = (str: string): string => {
  if (!str) return str;
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

// Secondary line for a product option/candidate — "type · brand_name" with blank
// parts omitted (so a missing type/brand never leaves a dangling " · ").
export const formatCandidateMeta = (
  type?: string | null,
  brand_name?: string | null
): string =>
  [type, brand_name].filter((v) => v && String(v).trim() !== "").join(" · ");

export const getStatusColor = (status: string) => {
  switch (status.toLowerCase()) {
    case "received":
      return "#10B981";
    case "pending":
      return "#F59E0B";
    default:
      return "#6B7280";
  }
};
