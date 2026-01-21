import dayjs from "dayjs";

export const capitalizeFirstLetter = (str: string): string => {
  if (!str) return str;
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

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
