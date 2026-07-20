// Parses date-only strings (YYYY-MM-DD) as local dates instead of UTC midnight,
// which would shift the displayed day backwards in US timezones.
export const parseDisplayDate = (dateInput: string | Date): Date => {
  if (dateInput instanceof Date) return dateInput;

  const dateOnlyMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateInput);
  if (dateOnlyMatch) {
    const [, year, month, day] = dateOnlyMatch;
    return new Date(Number(year), Number(month) - 1, Number(day));
  }

  return new Date(dateInput);
};

export const formatDate = (
  dateInput: string | Date | undefined | null
): string => {
  if (!dateInput) return "-";

  const date = parseDisplayDate(dateInput);

  // Check if date is valid
  if (isNaN(date.getTime())) return "-";

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
};

export const formatDateWithYear = (
  dateInput: string | Date | undefined | null
): string => {
  if (!dateInput) return "-";

  const date = parseDisplayDate(dateInput);

  // Check if date is valid
  if (isNaN(date.getTime())) return "-";

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

// Split shares into numeric value and suffix for animated counters
export const formatSharesParts = (
  shares: string
): { value: number; suffix: string } => {
  const num = parseFloat(shares);
  if (isNaN(num)) return { value: 0, suffix: "" };
  if (num >= 1_000_000_000)
    return { value: parseFloat((num / 1_000_000_000).toFixed(2)), suffix: "B" };
  if (num >= 1_000_000)
    return { value: parseFloat((num / 1_000_000).toFixed(2)), suffix: "M" };
  if (num >= 1_000)
    return { value: parseFloat((num / 1_000).toFixed(2)), suffix: "K" };
  return { value: parseFloat(num.toFixed(2)), suffix: "" };
};
