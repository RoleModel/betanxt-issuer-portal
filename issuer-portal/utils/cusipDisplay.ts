export const normalizeCusips = (value?: string | string[] | null): string[] => {
  if (!value) return [];

  const parts = Array.isArray(value)
    ? value
    : value
        .split(/[\n,;|/]+/)
        .map((part) => part.trim())
        .filter(Boolean);

  return [...new Set(parts)];
};

export const getCusipLabel = (
  value?: string | string[] | null
): "CUSIP" | "CUSIPs" => {
  return normalizeCusips(value).length > 1 ? "CUSIPs" : "CUSIP";
};
