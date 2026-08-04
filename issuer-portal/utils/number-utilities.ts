import NumberAbbreviate from "number-abbreviate";

const numberFormatter = new Intl.NumberFormat();
const preciseNumberFormatter = new Intl.NumberFormat(undefined, {
  minimumFractionDigits: 6,
});

export const formatNumber = (number: number | null | undefined): string => {
  if (
    number === null ||
    number === undefined ||
    number === 0 ||
    Number.isNaN(number)
  ) {
    return "0";
  }

  return numberFormatter.format(number);
};

export const floorAndFormatNumber = (value: string | number): string => {
  if (typeof value === "string") {
    return numberFormatter.format(Math.trunc(Number(value)) || 0);
  }

  return numberFormatter.format(Math.floor(value));
};

export const formatPreciseNumber = (value: number): string =>
  preciseNumberFormatter.format(value);

export const roundTo = (number: number, places: number): number => {
  const multiplier = 10 ** places;
  return Math.round(number * multiplier) / multiplier;
};

export const fontSizeScaledBy = (numberToDisplay: number): number => {
  if (numberToDisplay >= 10_000_000) {
    return 20;
  }

  if (numberToDisplay >= 1_000_000) {
    return 25;
  }

  return 38;
};

export const truncateNumber = (numberValue: number | string): string => {
  const parsedNumber =
    typeof numberValue === "string"
      ? Number(numberValue.replaceAll(",", ""))
      : numberValue;

  if (!Number.isFinite(parsedNumber)) {
    return typeof numberValue === "string" ? numberValue : "0";
  }

  if (parsedNumber >= 1_000_000_000) {
    return `${(parsedNumber / 1_000_000_000).toFixed(1)}B`;
  }

  if (parsedNumber >= 1_000_000) {
    return `${(parsedNumber / 1_000_000).toFixed(1)}M`;
  }

  if (parsedNumber >= 1000) {
    return `${(parsedNumber / 1000).toFixed(1)}K`;
  }

  return parsedNumber.toLocaleString();
};

export const abbreviateNumber = (value: number): string => {
  const numberAbbreviate = new NumberAbbreviate();
  return numberAbbreviate.abbreviate(Math.floor(value), 1);
};

const sizes = ["Bytes", "KB", "MB", "GB", "TB"];

export const bytesToSize = (bytes: number): string => {
  if (bytes === 0) {
    return "0 Bytes";
  }

  const sizeIndex = Math.floor(Math.log(bytes) / Math.log(1024));

  if (sizeIndex === 0) {
    return `${bytes} ${sizes[sizeIndex]}`;
  }

  return `${(bytes / 1024 ** sizeIndex).toFixed(1)} ${sizes[sizeIndex]}`;
};

export const validSharesRegex = /^\d+(?:\.\d{0,6})?$|^$/u;

export const formatPhoneNumber = (phoneNumber: string): string => {
  const cleaned = phoneNumber.replaceAll(/\D/gu, "");
  if (cleaned.length < 10 || cleaned.length > 13) {
    return "";
  }

  const countryCode = cleaned.slice(0, -10);
  const localNumber = cleaned.slice(-10);
  const internationalPrefix = countryCode.length > 0 ? `+${countryCode} ` : "";

  return `${internationalPrefix}(${localNumber.slice(0, 3)}) ${localNumber.slice(3, 6)}-${localNumber.slice(6)}`;
};
