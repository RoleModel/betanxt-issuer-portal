/* eslint-disable unicorn/filename-case -- The `Navigation` directory name is intentional and shared by the rest of the app; renaming it is out of scope for lint cleanup. */
import { normalizeCusips } from "@/utils/cusipDisplay";

export const parsePhaseNumber = (
  phase: string | number | undefined
): number => {
  if (typeof phase === "number" && Number.isFinite(phase)) {
    return Math.max(1, phase);
  }

  if (typeof phase === "string") {
    const digits = /(?<digits>\d+)/u.exec(phase)?.groups?.digits;
    if (digits !== undefined && digits.length > 0) {
      const value = Number(digits);
      if (Number.isFinite(value) && value > 0) {
        return value;
      }
    }
  }

  return 1;
};

export const getCusipDisplayValue = (value: string): string => {
  const cusips = normalizeCusips(value);

  if (cusips.length <= 1) {
    return cusips[0] ?? value;
  }

  return `${cusips[0]} +${cusips.length - 1}`;
};
