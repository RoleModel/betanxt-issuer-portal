import NumberAbbreviate from "number-abbreviate";

const numberFormatter = new Intl.NumberFormat();
const preciseNumberFormatter = new Intl.NumberFormat(undefined, {
  minimumFractionDigits: 6,
});

export const formatNumber = (number: number | null | undefined): string => {
  if (!number) {
    return "0";
  }

  return numberFormatter.format(number);
};

export function floorAndFormatNumber(value: string | number): string {
  if (typeof value === "string") {
    return numberFormatter.format(parseInt(value) || 0);
  } else {
    return numberFormatter.format(Math.floor(value ?? 0));
  }
}

export function formatPreciseNumber(value: number): string {
  return preciseNumberFormatter.format(value ?? 0);
}

export function roundTo(number: number, places: number): number {
  const x = Math.pow(10, places);
  return Math.round(number * x) / x;
}

export function fontSizeScaledBy(numberToDisplay: number) {
  if (numberToDisplay >= 10_000_000) {
    return 20;
  } else if (numberToDisplay >= 1_000_000) {
    return 25;
  }
}

export const truncateNumber = (num: number | string) => {
  const parsedNum = typeof num === "string" ? parseFloat(num.replace(/,/g, "")) : num;

  if (!Number.isFinite(parsedNum)) {
    return typeof num === "string" ? num : "0";
  }

  if (parsedNum >= 1000000000) {
    return (parsedNum / 1000000000).toFixed(1) + "B";
  } else if (parsedNum >= 1000000) {
    return (parsedNum / 1000000).toFixed(1) + "M";
  } else if (parsedNum >= 1000) {
    return (parsedNum / 1000).toFixed(1) + "K";
  }
  return parsedNum.toLocaleString();
};

export function abbreviateNumber(value: number): string {
  const numAbbreviate = new NumberAbbreviate();
  return numAbbreviate.abbreviate(Math.floor(value), 1);
}

const sizes = ["Bytes", "KB", "MB", "GB", "TB"];

export function bytesToSize(bytes: number): string {
  if (bytes === 0) {
    return "0 Bytes";
  }

  const sizeIndex = Math.floor(Math.log(bytes) / Math.log(1024));

  if (sizeIndex === 0) {
    return `${bytes} ${sizes[sizeIndex]}`;
  }

  return `${(bytes / 1024 ** sizeIndex).toFixed(1)} ${sizes[sizeIndex]}`;
}

export const validSharesRegex = new RegExp(/^\d+(\.\d{0,6})?$|^$/);

export const formatPhoneNumber = (phoneNumber: string) => {
  const cleaned = ("" + phoneNumber).replace(/\D/g, "");
  const phoneNumberPattern = /^(\d{1,3}|)?(\d{3})(\d{3})(\d{4})$/;
  const match = phoneNumberPattern.exec(cleaned);
  if (match) {
    const intlCode = match[1] ? `+${match[1]} ` : "";
    return [intlCode, "(", match[2], ") ", match[3], "-", match[4]].join("");
  }
  return null;
};
