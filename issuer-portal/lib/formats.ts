// Parses date-only strings (YYYY-MM-DD) as local dates instead of UTC midnight,
// which would shift the displayed day backwards in US timezones.
export const parseDisplayDate = (dateInput: string | Date): Date => {
  if (dateInput instanceof Date) {
    return dateInput;
  }

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
  if (!dateInput) {
    return "-";
  }

  const date = parseDisplayDate(dateInput);

  // Check if date is valid
  if (isNaN(date.getTime())) {
    return "-";
  }

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
};

export const formatDateWithYear = (
  dateInput: string | Date | undefined | null
): string => {
  if (!dateInput) {
    return "-";
  }

  const date = parseDisplayDate(dateInput);

  // Check if date is valid
  if (isNaN(date.getTime())) {
    return "-";
  }

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
  const number_ = Number.parseFloat(shares);
  if (isNaN(number_)) {
    return { value: 0, suffix: "" };
  }
  if (number_ >= 1_000_000_000) {
    return {
      value: Number.parseFloat((number_ / 1_000_000_000).toFixed(2)),
      suffix: "B",
    };
  }
  if (number_ >= 1_000_000) {
    return {
      value: Number.parseFloat((number_ / 1_000_000).toFixed(2)),
      suffix: "M",
    };
  }
  if (number_ >= 1000) {
    return {
      value: Number.parseFloat((number_ / 1000).toFixed(2)),
      suffix: "K",
    };
  }
  return { value: Number.parseFloat(number_.toFixed(2)), suffix: "" };
};
