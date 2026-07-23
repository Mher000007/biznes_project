"use client";

import React from "react";
import { Clock } from "lucide-react";
import "./OperatingHoursCard.css";

export interface OperatingHour {
  day: string;
  open?: string;
  close?: string;
  closed?: boolean;
  isClosed?: boolean;
  is24h?: boolean;
  openTime?: string;
  closeTime?: string;
}

export interface GroupedOperatingHours {
  dayLabel: string;
  open: string;
  close: string;
  isClosed: boolean;
  is24h: boolean;
  isToday: boolean;
}

export interface OperatingHoursCardProps {
  /** Array of raw daily operating hours */
  operatingHours?: OperatingHour[];
  /** Optional custom card title */
  title?: string;
  /** Optional translations dictionary for day names and labels */
  translations?: {
    title?: string;
    closed?: string;
    today?: string;
    openNow?: string;
    closedNow?: string;
    aroundTheClock?: string;
    days?: Record<string, string>;
  };
  /** Optional override for simulated current day for testing */
  forcedCurrentDay?: string;
}

export const DEFAULT_SAMPLE_HOURS: OperatingHour[] = [
  { day: "Monday", open: "11:00", close: "24:00", closed: false },
  { day: "Tuesday", open: "11:00", close: "24:00", closed: false },
  { day: "Wednesday", open: "11:00", close: "24:00", closed: false },
  { day: "Thursday", open: "00:00", close: "24:00", closed: false, is24h: true },
  { day: "Friday", open: "00:00", close: "24:00", closed: false, is24h: true },
  { day: "Saturday", open: "10:00", close: "22:00", closed: false },
  { day: "Sunday", open: "09:00", close: "18:00", closed: true },
];

/** Formats time string to 24h format and displays midnight closing as 24:00 */
export function formatTime24h(timeStr?: string, isClosing = false): string {
  if (!timeStr) return "00:00";
  const clean = timeStr.trim();
  if (isClosing && (clean === "00:00" || clean === "0:00" || clean === "24:00")) {
    return "24:00";
  }
  return clean;
}

/** Groups consecutive days with identical operating schedules */
export function groupOperatingHours(
  hours: OperatingHour[],
  translationsDays?: Record<string, string>,
  currentDayName?: string
): GroupedOperatingHours[] {
  if (!hours || hours.length === 0) return [];

  const todayLower = (currentDayName || new Date().toLocaleDateString("en-US", { weekday: "long" })).toLowerCase();

  const normalized = hours.map((h) => {
    const rawDay = (h.day || "").trim();
    const isClosed = Boolean(h.closed ?? h.isClosed);
    const rawOpen = h.open || h.openTime || "09:00";
    const rawClose = h.close || h.closeTime || "18:00";
    const formattedOpen = formatTime24h(rawOpen, false);
    const formattedClose = formatTime24h(rawClose, true);
    const is24h = Boolean(h.is24h || (formattedOpen === "00:00" && (formattedClose === "24:00" || formattedClose === "00:00")));

    return {
      rawDay,
      dayLower: rawDay.toLowerCase(),
      isClosed,
      is24h,
      open: formattedOpen,
      close: formattedClose,
    };
  });

  const getTranslatedDay = (dayStr: string) => translationsDays?.[dayStr.toLowerCase()] || dayStr;

  const result: GroupedOperatingHours[] = [];
  let currentChunk: typeof normalized = [];

  const isSameSchedule = (a: (typeof normalized)[0], b: (typeof normalized)[0]) => {
    if (a.isClosed !== b.isClosed) return false;
    if (a.isClosed) return true;
    if (a.is24h !== b.is24h) return false;
    if (a.is24h) return true;
    return a.open === b.open && a.close === b.close;
  };

  const commitChunk = (chunk: typeof normalized) => {
    if (chunk.length === 0) return;
    const first = chunk[0];
    const last = chunk[chunk.length - 1];

    let dayLabel = "";
    if (chunk.length === 1) {
      dayLabel = getTranslatedDay(first.rawDay);
    } else if (chunk.length === 2) {
      dayLabel = `${getTranslatedDay(first.rawDay)}, ${getTranslatedDay(last.rawDay)}`;
    } else {
      dayLabel = `${getTranslatedDay(first.rawDay)} - ${getTranslatedDay(last.rawDay)}`;
    }

    const isToday = chunk.some((item) => item.dayLower === todayLower);

    result.push({
      dayLabel,
      open: first.open,
      close: first.close,
      isClosed: first.isClosed,
      is24h: first.is24h,
      isToday,
    });
  };

  for (let i = 0; i < normalized.length; i++) {
    const item = normalized[i];
    if (currentChunk.length === 0) {
      currentChunk.push(item);
    } else {
      if (isSameSchedule(currentChunk[currentChunk.length - 1], item)) {
        currentChunk.push(item);
      } else {
        commitChunk(currentChunk);
        currentChunk = [item];
      }
    }
  }
  commitChunk(currentChunk);

  return result;
}

export default function OperatingHoursCard({
  operatingHours = DEFAULT_SAMPLE_HOURS,
  title,
  translations,
  forcedCurrentDay,
}: OperatingHoursCardProps) {
  const cardTitle = title || translations?.title || "Operating Hours";
  const closedLabel = translations?.closed || "Closed";
  const todayLabel = translations?.today || "Today";
  const aroundTheClockLabel = translations?.aroundTheClock || "24/7 (Շուրջօրյա)";

  const groupedList = groupOperatingHours(operatingHours, translations?.days, forcedCurrentDay);
  const todayGroup = groupedList.find((g) => g.isToday);
  const isOpenNow = todayGroup ? !todayGroup.isClosed : false;

  return (
    <div className="hours-card">
      <div className="hours-header">
        <div className="hours-title-container">
          <Clock className="hours-icon" />
          <h3 className="hours-title">{cardTitle}</h3>
        </div>
        <div className={`hours-status-badge ${isOpenNow ? "is-open" : "is-closed"}`}>
          <span className="pulse-dot" />
          {isOpenNow ? translations?.openNow || "Open Now" : translations?.closedNow || "Closed"}
        </div>
      </div>

      <div className="hours-list">
        {groupedList.map((row, idx) => (
          <div key={idx} className={`hours-row ${row.isToday ? "is-today" : ""}`}>
            <div className="day-info">
              <span className="day-label">{row.dayLabel}</span>
              {row.isToday && <span className="today-indicator">{todayLabel}</span>}
            </div>

            {row.isClosed ? (
              <span className="status-closed">{closedLabel}</span>
            ) : row.is24h ? (
              <span className="status-247">{aroundTheClockLabel}</span>
            ) : (
              <div className="time-range">
                <span>{row.open}</span>
                <span className="time-separator">-</span>
                <span>{row.close}</span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
