/**
 * Common types used across multiple components
 * These are one-off types that aren't part of the core API schema
 */

// Calendar types for Calendar components
export interface CalendarDate {
  date: Date;
  isCurrentMonth: boolean;
  tasks: Task[];
  keyDates: KeyDate[];
}

export interface CalendarWeek {
  days: CalendarDate[];
}

export interface CalendarMonth {
  year: number;
  month: Date;
  weeks: CalendarWeek[];
  monthName: string;
}

// UI Context Menu types
export interface ContextMenuPosition {
  x: number;
  y: number;
}

// Re-export core domain types from API namespace
export type { Task, KeyDate, Document, Meeting, Proposal, Phase } from "./api";
