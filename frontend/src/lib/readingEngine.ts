// Deterministic pseudo-random reading generator.
// Same device + same timestamp always produces the same reading, so charts
// stay stable across re-renders without needing to store millions of rows.

import type { DaySeriesPoint, HeatmapGrid, TrendPoint } from "./types";

function hashStr(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(seed: number): () => number {
  let a = seed;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function rand(seedStr: string): number {
  return mulberry32(hashStr(seedStr))();
}

// Baseline average draw for a device, stable per device.
function baseLoad(deviceId: string, isCommonArea: boolean): number {
  const r = rand(`base:${deviceId}`);
  return isCommonArea ? 0.5 + r * 5.5 : 0.4 + r * 1.6; // common areas run higher avg
}

// Multiplier curve across the day — peaks 7-10am & 6-10pm, trough 1-5am.
function timeOfDayFactor(hour: number): number {
  const morningPeak = Math.exp(-Math.pow(hour - 8.5, 2) / 6);
  const eveningPeak = Math.exp(-Math.pow(hour - 20, 2) / 8);
  const trough = hour >= 1 && hour <= 5 ? 0.35 : 1;
  return (0.55 + 0.9 * morningPeak + 1.1 * eveningPeak) * trough;
}

function dateKeyHour(date: Date, hour: number): string {
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}-${hour}`;
}

// Average kW for a device at a given date+hour (small day-to-day noise, no live jitter)
export function hourlyKw(deviceId: string, date: Date, hour: number, isCommonArea: boolean): number {
  const base = baseLoad(deviceId, isCommonArea);
  const factor = timeOfDayFactor(hour);
  const noise = 0.85 + rand(`${deviceId}:${dateKeyHour(date, hour)}`) * 0.3;
  const min = isCommonArea ? 0.5 : 0.2;
  const max = isCommonArea ? 15 : 4.5;
  return Math.min(max, Math.max(min, base * factor * noise));
}

// "Live" instantaneous kW reading — same hourly value plus a touch of jitter.
export function liveKw(deviceId: string, isCommonArea: boolean, now: Date = new Date()): number {
  const h = hourlyKw(deviceId, now, now.getHours(), isCommonArea);
  const jitter = 0.95 + rand(`${deviceId}:live:${now.getMinutes()}`) * 0.1;
  return +(h * jitter).toFixed(2);
}

export function dailyKwh(deviceId: string, date: Date, isCommonArea: boolean): number {
  let sum = 0;
  for (let h = 0; h <= date.getHours() && h < 24; h++) {
    if (isToday(date) && h === date.getHours()) {
      sum += hourlyKw(deviceId, date, h, isCommonArea) * (date.getMinutes() / 60);
    } else {
      sum += hourlyKw(deviceId, date, h, isCommonArea);
    }
  }
  return +sum.toFixed(2);
}

export function fullDailyKwh(deviceId: string, date: Date, isCommonArea: boolean): number {
  let sum = 0;
  for (let h = 0; h < 24; h++) sum += hourlyKw(deviceId, date, h, isCommonArea);
  return +sum.toFixed(2);
}

function isToday(d: Date): boolean {
  const t = new Date();
  return d.getFullYear() === t.getFullYear() && d.getMonth() === t.getMonth() && d.getDate() === t.getDate();
}

export function isOffline(deviceId: string): boolean {
  // ~8% of devices simulate an offline meter, stable per device
  return rand(`offline:${deviceId}`) < 0.08;
}

export function lastSeenMinutesAgo(deviceId: string): number {
  return Math.floor(rand(`lastseen:${deviceId}`) * 180) + 6; // 6-186 min ago
}

// Hourly average profile (0-23) across last N days for a device, for the
// 24-bar time-of-day chart.
export function hourlyProfile(deviceId: string, isCommonArea: boolean, days = 30): number[] {
  const today = new Date();
  const profile = new Array(24).fill(0);
  for (let h = 0; h < 24; h++) {
    let sum = 0;
    for (let d = 0; d < days; d++) {
      const day = new Date(today);
      day.setDate(day.getDate() - d);
      sum += hourlyKw(deviceId, day, h, isCommonArea);
    }
    profile[h] = +(sum / days).toFixed(2);
  }
  return profile;
}

// Daily kWh series for the current month up to today.
export function monthSeries(deviceId: string, isCommonArea: boolean, monthDate: Date = new Date()): DaySeriesPoint[] {
  const days: DaySeriesPoint[] = [];
  const year = monthDate.getFullYear();
  const month = monthDate.getMonth();
  const lastDay = Math.min(
    new Date(year, month + 1, 0).getDate(),
    isSameMonth(monthDate, new Date()) ? new Date().getDate() : 31
  );
  for (let d = 1; d <= lastDay; d++) {
    const date = new Date(year, month, d, 23, 59);
    const kwh = isSameDay(date, new Date()) ? dailyKwh(deviceId, new Date(), isCommonArea) : fullDailyKwh(deviceId, date, isCommonArea);
    days.push({ date, day: d, kwh, isWeekend: date.getDay() === 0 || date.getDay() === 6 });
  }
  return days;
}

function isSameMonth(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();
}
function isSameDay(a: Date, b: Date): boolean {
  return isSameMonth(a, b) && a.getDate() === b.getDate();
}

// Last 30 days daily kWh + 7-day rolling average, for the trend line.
export function trend30Day(deviceId: string, isCommonArea: boolean): TrendPoint[] {
  const today = new Date();
  const points: TrendPoint[] = [];
  for (let i = 29; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const kwh = i === 0 ? dailyKwh(deviceId, today, isCommonArea) : fullDailyKwh(deviceId, date, isCommonArea);
    points.push({ date, kwh });
  }
  for (let i = 0; i < points.length; i++) {
    const window = points.slice(Math.max(0, i - 6), i + 1);
    points[i].rollingAvg = +(window.reduce((s, p) => s + p.kwh, 0) / window.length).toFixed(2);
  }
  return points;
}

// hour x day-of-week heatmap, averaged across a set of device ids.
export function heatmap(deviceIds: string[], isCommonArea: boolean): HeatmapGrid {
  const grid: HeatmapGrid = Array.from({ length: 7 }, () => new Array(24).fill(0));
  const today = new Date();
  const dowSamples: number[][] = Array.from({ length: 7 }, () => new Array(24).fill(0));
  for (let i = 0; i < 28; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dow = date.getDay();
    for (let h = 0; h < 24; h++) {
      let sum = 0;
      for (const id of deviceIds) sum += hourlyKw(id, date, h, isCommonArea);
      grid[dow][h] += sum / deviceIds.length;
      dowSamples[dow][h] += 1;
    }
  }
  for (let d = 0; d < 7; d++) {
    for (let h = 0; h < 24; h++) {
      grid[d][h] = dowSamples[d][h] ? +(grid[d][h] / dowSamples[d][h]).toFixed(2) : 0;
    }
  }
  return grid;
}
