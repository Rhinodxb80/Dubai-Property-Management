const AED_FORMATTER = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

export const formatCurrencyAED = (value?: string | number | null) => {
  if (value === undefined || value === null) return "";

  if (typeof value === "number" && Number.isFinite(value)) {
    return `AED ${AED_FORMATTER.format(value)}`;
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return "";
    const digits = trimmed.replace(/[^0-9.]/g, "");
    if (!digits) return trimmed;
    const parsed = Number(digits);
    if (!Number.isFinite(parsed)) return trimmed;
    return `AED ${AED_FORMATTER.format(parsed)}`;
  }

  return "";
};
