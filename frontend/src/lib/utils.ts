import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

export function formatKwh(n: number | null | undefined): string {
  const val = typeof n === "number" && !isNaN(n) ? n : Number(n) || 0;
  return `${val.toFixed(1)} kWh`;
}

export function formatKw(n: number | null | undefined): string {
  const val = typeof n === "number" && !isNaN(n) ? n : Number(n) || 0;
  return `${val.toFixed(2)} kW`;
}

export function formatCost(units: number | null | undefined, rate = 10): string {
  const num = typeof units === "number" && !isNaN(units) ? units : Number(units) || 0;
  const cost = num * rate;
  return `₹${Math.round(cost).toLocaleString("en-IN")}`;
}

export function formatDate(d: Date | string | null | undefined): string {
  if (!d) return "";
  const dateObj = d instanceof Date ? d : new Date(d);
  if (isNaN(dateObj.getTime())) return String(d);
  return dateObj.toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
}

export function formatTime(d: Date | string | null | undefined): string {
  if (!d) return "";
  const dateObj = d instanceof Date ? d : new Date(d);
  if (isNaN(dateObj.getTime())) return String(d);
  return dateObj.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
}

export function timeAgo(d: Date | string | null | undefined): string {
  if (!d) return "Never";
  const dateObj = d instanceof Date ? d : new Date(d);
  if (isNaN(dateObj.getTime())) return "Never";

  const diffMs = Date.now() - dateObj.getTime();
  if (diffMs < 60000) return "Just now";

  const mins = Math.floor(diffMs / 60000);
  if (mins < 60) return `${mins}m ago`;

  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;

  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  if (days < 365) return `${Math.floor(days / 30)}mo ago`;

  return dateObj.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

export function getErrorMessage(err: unknown, fallback = "An unexpected error occurred."): string {
  if (!err) return fallback;
  if (typeof err === "string") return err;
  if (typeof err === "object") {
    const anyErr = err as any;
    if (anyErr.response?.data) {
      const data = anyErr.response.data;
      if (typeof data === "string" && data.trim()) return data.trim();
      if (typeof data === "object") {
        if (data.message && typeof data.message === "string") return data.message;
        if (data.error && typeof data.error === "string") return data.error;
        if (data.details && typeof data.details === "string") return data.details;
      }
    }
    if (anyErr.message && typeof anyErr.message === "string") {
      return anyErr.message;
    }
  }
  if (err instanceof Error) {
    return err.message;
  }
  return fallback;
}
