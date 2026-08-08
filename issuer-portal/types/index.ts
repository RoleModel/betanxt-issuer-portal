// Re-export common types from consolidated namespace files
export type {
  CalendarDate,
  CalendarWeek,
  CalendarMonth,
  ContextMenuPosition,
} from "./common";

// Re-export utility functions from typeUtils for backward compatibility
export {
  asArray,
  asRecord,
  asString,
  asNumber,
  getString,
  getNumber,
} from "../utils/typeUtils";
